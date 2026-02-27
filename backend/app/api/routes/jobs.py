from fastapi import APIRouter, BackgroundTasks, UploadFile, File, Depends, HTTPException, Form
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Annotated, Optional
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
            
            # 4. Upload to S3 (Network bound, minio is synchronous so run_in_threadpool is used inside)
            s3_key = await JobService.upload_input(db=db, job_id=job_id, file_content=file_content, filename=filename)
            await JobService.update_job_status(db, job_id, JobStatus.QUEUED)
            await db.commit()
            
            # 5. Dispatch to RunPod via HTTP 
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
                logger.info(f"Dispatched job {job_id} to RunPod via BackgroundTask. RunPod ID: {runpod_job_id}")
            except Exception as runpod_err:
                logger.warning(
                    f"RunPod dispatch failed for job {job_id}: {runpod_err}. "
                    "Job is saved as QUEUED but won't execute until RunPod is available."
                )

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
    """Get job status and metadata."""
    job = await JobService.get_job(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
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