from fastapi import APIRouter, BackgroundTasks, UploadFile, File, Depends, HTTPException, Form
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Annotated, Optional
from datetime import datetime
from enum import Enum
import logging

from app.domain.services.job_service import JobService
from app.infrastructure.db.session import get_db, AsyncSessionLocal
from app.infrastructure.db.models import JobStatus
from app.schemas.job import (
    JobCreateRequest,
    JobCreateResponse,
    JobStatusResponse,
    JobResultResponse,
    ArtifactResponse,
    MetricResponse,
)
from app.infrastructure.compute.runpod_runner import RunPodRunner
from app.infrastructure.storage.s3_service import storage_service
from app.core.validation import validate_file_extension, validate_file_content, validate_pdb_structure, get_file_info
from app.core.pdb_analyzer import PDBAnalyzer

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/jobs", tags=["jobs"])


class PipelineType(str, Enum):
    """Allowed pipeline types."""
    DIFFAB_ONLY = "diffab_only"
    RFDIFFUSION_ONLY = "rfdiffusion_only"
    AF2_ONLY = "af2_only"
    FULL_PIPELINE = "diffab_rfdiffusion_af2"


async def _process_job_background(
    job_id: str,
    file_content: bytes,
    filename: str,
    pipeline_type: PipelineType,
    selected_models: str,
):
    """Background task to analyze, upload, and dispatch the job without blocking HTTP response."""
    async with AsyncSessionLocal() as db:
        try:
            # 1. Extract file metadata
            file_info = await run_in_threadpool(get_file_info, file_content)
            
            # 2. Analyze PDB structure
            pdb_analysis = await run_in_threadpool(
                PDBAnalyzer.analyze, 
                file_content.decode('utf-8', errors='ignore'), 
                filename
            )
            logger.info(f"PDB Analysis for {job_id}: {pdb_analysis['recommended_mode']}")
            
            if pipeline_type == PipelineType.FULL_PIPELINE:
                mode_to_pipeline = {
                    'codesign_single': 'diffab_only',
                    'codesign_multicdrs': 'diffab_rfdiffusion_af2',
                    'fixbb': 'diffab_only',
                    'strpred': 'af2_only'
                }
                recommended_pipeline = mode_to_pipeline.get(pdb_analysis['recommended_mode'], 'diffab_rfdiffusion_af2')
            else:
                recommended_pipeline = pipeline_type.value
            
            model_list = selected_models.split(",") if selected_models else []
            
            # 3. Update the job configuration in DB
            job = await JobService.get_job(db, job_id)
            if job:
                job.config = {
                    "atom_count": file_info.get("atom_count", 0),
                    "pdb_analysis": pdb_analysis,
                    "selected_models": model_list
                }
                job.pipeline_type = recommended_pipeline
                await db.commit()
            
            # 4. Upload to S3 — upload_input already transitions status to UPLOADED internally
            s3_key = await JobService.upload_input(db=db, job_id=job_id, file_content=file_content, filename=filename)
            await db.commit()
            logger.info(f"Job {job_id}: input uploaded to S3, status=UPLOADED")

            # 5. Dispatch to RunPod GPU
            try:
                runpod_job_id = await RunPodRunner.submit_job(
                    job_id=job_id,
                    model_name=recommended_pipeline,
                    input_s3_key=s3_key,
                    params={
                        "atom_count": file_info.get("atom_count", 0),
                        "pipeline": recommended_pipeline
                    }
                )
                # Atomically save runpod_job_id + transition to QUEUED in one transaction.
                # We do NOT use update_job_status() here to avoid the extra get_job() call
                # and potential identity-map staleness after the previous commit().
                job = await JobService.get_job(db, job_id)
                if not job:
                    raise RuntimeError(f"Job {job_id} disappeared from DB after upload!")
                job.runpod_job_id = runpod_job_id
                job.status = JobStatus.QUEUED
                await db.flush()
                await db.commit()
                await db.refresh(job)
                logger.info(
                    f"Job {job_id} dispatched to RunPod. "
                    f"runpod_job_id={runpod_job_id}, status=QUEUED"
                )
            except Exception as runpod_err:
                logger.error(
                    f"RunPod dispatch failed for job {job_id}: {runpod_err}. "
                    "Marking as FAILED."
                )
                job = await JobService.get_job(db, job_id)
                if job:
                    job.status = JobStatus.FAILED
                    job.error_message = str(runpod_err)
                    job.finished_at = datetime.utcnow()
                    await db.flush()
                    await db.commit()
                return

        except Exception as e:
            await db.rollback()
            logger.error(f"Background processing failed for job {job_id}: {e}", exc_info=True)
            try:
                await JobService.update_job_status(db, job_id, JobStatus.FAILED, str(e))
                await db.commit()
            except Exception as cleanup_error:
                logger.error(f"Failed to mark background job {job_id} as FAILED: {cleanup_error}")


@router.post("/", response_model=JobCreateResponse)
async def create_job(
    background_tasks: BackgroundTasks,
    file: Annotated[
        UploadFile,
        File(
            description="Protein structure file in PDB format ONLY (.pdb)",
            media_type="chemical/x-pdb",
        )
    ],
    pipeline_type: Annotated[
        PipelineType,
        Form(description="Pipeline type to execute")
    ] = PipelineType.FULL_PIPELINE,
    selected_models: Annotated[
        Optional[str], 
        Form(description="Comma-separated list of selected models (e.g. 'diffab,alphafold2')")
    ] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new job and upload input file.
    
    ⚠️ **ONLY .pdb files are accepted!**
    
    **Returns:**
    - `job_id`: Unique identifier for tracking
    - `status`: Current job status (initially "queued")
    - `created_at`: Timestamp of job creation
    """
    try:
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")
        
        file_content = await file.read()
        
        is_valid, error = validate_file_extension(file.filename)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error)
        
        is_valid, error = validate_file_content(file_content)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error)
        
        # PDB parsing is fast enough for HTTP req, but full analysis is moved to BG
        is_valid, error = validate_pdb_structure(file_content)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error)
        
        # Create lightweight job in CREATED state instantly
        job = await JobService.create_job(
            db=db,
            pipeline_type=pipeline_type.value,
        )
        await db.commit()
        
        # Offload heavy text splitting, S3 networking, and HTTP dispatch to BackgroundTasks
        background_tasks.add_task(
            _process_job_background,
            job_id=job.id,
            file_content=file_content,
            filename=file.filename,
            pipeline_type=pipeline_type,
            selected_models=selected_models
        )
        
        logger.info(f"Received and delegated job {job.id} to background tasks.")
        
        return JobCreateResponse(
            job_id=job.id,
            status=job.status,
            created_at=job.created_at
        )
    
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error initializing job: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{job_id}", response_model=JobStatusResponse)
async def get_job_status(
    job_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get job status and metadata. Polls RunPod if job is actively processing."""
    job = await JobService.get_job(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # -----------------------------------------------------------------
    # Conditions under which we skip RunPod polling:
    #  1. Job is already terminal (COMPLETED, FAILED, CANCELLED)
    #  2. finished_at is set (already reconciled)
    #  3. runpod_job_id is missing (job never reached RunPod)
    #  4. Job has been running for > 30 minutes (hard timeout safety)
    # -----------------------------------------------------------------
    ACTIVE_STATUSES = {JobStatus.QUEUED, JobStatus.PROVISIONING, JobStatus.RUNNING}
    TERMINAL_STATUSES = {JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED}

    needs_poll = (
        job.status in ACTIVE_STATUSES
        and job.runpod_job_id
        and not job.finished_at
    )

    # 30-minute hard timeout
    if needs_poll and job.created_at:
        age_minutes = (datetime.utcnow() - job.created_at).total_seconds() / 60
        if age_minutes > 30:
            logger.error(
                f"Job {job_id} exceeded 30-minute timeout (age={age_minutes:.1f}m). "
                "Marking FAILED."
            )
            job.status = JobStatus.FAILED
            job.finished_at = datetime.utcnow()
            job.error_message = "Job timed out after 30 minutes."
            await db.flush()
            await db.commit()
            await db.refresh(job)
            needs_poll = False

    if needs_poll:
        try:
            logger.info(
                f"[POLL] Job {job_id} | DB status={job.status.value} "
                f"| runpod_job_id={job.runpod_job_id}"
            )
            runpod_data = await RunPodRunner.get_job_status(
                job.runpod_job_id, job.pipeline_type
            )
            # Log FULL RunPod response for debugging
            logger.info(f"[RUNPOD RESPONSE] job={job_id}: {runpod_data}")

            rp_status: str = runpod_data.get("status", "UNKNOWN")

            if rp_status == "COMPLETED":
                output = runpod_data.get("output") or {}
                output_s3_key = output.get("output_s3_key")
                execution_ms = runpod_data.get("executionTime")

                logger.info(
                    f"[COMPLETED] job={job_id} | output_s3_key={output_s3_key} "
                    f"| executionTime={execution_ms}ms | full_output={output}"
                )

                job.status = JobStatus.COMPLETED
                job.finished_at = datetime.utcnow()
                job.output_s3_key = output_s3_key
                job.execution_time = (execution_ms / 1000.0) if execution_ms else None
                if not job.started_at:
                    job.started_at = datetime.utcnow()

                await db.flush()
                await db.commit()
                await db.refresh(job)
                logger.info(
                    f"[DB COMMITTED] job={job_id} "
                    f"status=COMPLETED output_s3_key={job.output_s3_key} "
                    f"execution_time={job.execution_time}s finished_at={job.finished_at}"
                )

            elif rp_status == "FAILED":
                error_msg = runpod_data.get("error") or "Unknown RunPod failure"
                logger.error(f"[FAILED] job={job_id} | error={error_msg}")

                job.status = JobStatus.FAILED
                job.finished_at = datetime.utcnow()
                job.error_message = str(error_msg)

                await db.flush()
                await db.commit()
                await db.refresh(job)

            elif rp_status in ("IN_PROGRESS", "IN_QUEUE"):
                logger.info(f"[RUNNING] job={job_id} | rp_status={rp_status}")
                if job.status != JobStatus.RUNNING:
                    job.status = JobStatus.RUNNING
                if not job.started_at:
                    job.started_at = datetime.utcnow()
                await db.flush()
                await db.commit()
                await db.refresh(job)

            else:
                # UNKNOWN, CANCELLED, etc.
                logger.warning(
                    f"[UNKNOWN STATUS] job={job_id} | rp_status={rp_status} "
                    f"| full_data={runpod_data}"
                )

        except Exception as e:
            logger.error(
                f"[POLL ERROR] Failed to sync RunPod status for job {job_id}: {e}",
                exc_info=True
            )
            try:
                await db.rollback()
            except Exception:
                pass

    return JobStatusResponse.model_validate(job)


@router.get("/", response_model=List[JobStatusResponse])
async def list_jobs(
    status: str = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """List jobs with optional status filter."""
    try:
        status_filter = JobStatus(status) if status else None
        jobs = await JobService.list_jobs(db, status=status_filter, limit=limit)
        return [JobStatusResponse.model_validate(job) for job in jobs]
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status filter: {status}")
    except Exception as e:
        logger.error(f"Error listing jobs: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to list jobs: {str(e)}")


@router.get("/{job_id}/results", response_model=JobResultResponse)
async def get_job_results(
    job_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get job results including artifacts and metrics."""
    job = await JobService.get_job(db, job_id, with_details=True)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job.status != JobStatus.COMPLETED:
        raise HTTPException(
            status_code=400,
            detail=f"Job not completed. Current status: {job.status}"
        )
    
    # Generate presigned URLs for artifacts
    artifacts = []
    for artifact in job.artifacts:
        download_url = storage_service.get_presigned_url(artifact.s3_key)
        artifacts.append(ArtifactResponse(
            id=artifact.id,
            artifact_type=artifact.artifact_type,
            s3_key=artifact.s3_key,
            size_bytes=artifact.size_bytes,
            download_url=download_url
        ))
    
    metrics = [
        MetricResponse(metric_name=m.metric_name, metric_value=m.metric_value)
        for m in job.metrics
    ]
    
    return JobResultResponse(
        job_id=job.id,
        status=job.status,
        artifacts=artifacts,
        metrics=metrics
    )


@router.get("/{job_id}/download")
async def download_job_result(
    job_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get a pre-signed download URL for the job's main output file."""
    job = await JobService.get_job(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job.status != JobStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Job is not completed yet.")
        
    if not job.output_s3_key:
        raise HTTPException(status_code=404, detail="No output file found for this job.")
        
    try:
        download_url = storage_service.get_presigned_url(job.output_s3_key, expires_seconds=3600)
        return {"download_url": download_url}
    except Exception as e:
        logger.error(f"Error generating presigned URL for {job_id}: {e}")
        raise HTTPException(status_code=500, detail="Could not generate download link.")


@router.delete("/{job_id}")
async def cancel_job(
    job_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Cancel a running job and revoke Celery task."""
    job = await JobService.get_job(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Check if job can be cancelled
    if job.status in [JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel job in {job.status} status"
        )
    
    # Revoke RunPod HTTP Job if it was still active
    # (Optional: Implement a cancel endpoint on the RunPod HTTP server if desired)
    if job.status in [JobStatus.QUEUED, JobStatus.PROVISIONING, JobStatus.RUNNING]:
        logger.info(f"Marking job {job_id} as CARCELLED locally. RunPod may still compute it, but result will be ignored.")

    
    # Update job status
    await JobService.update_job_status(db, job_id, JobStatus.CANCELLED)
    
    return {"message": f"Job {job_id} cancelled", "status": "cancelled"}