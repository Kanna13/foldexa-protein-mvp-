from fastapi import APIRouter, BackgroundTasks, UploadFile, File, Depends, HTTPException, Form
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Annotated, Optional
from enum import Enum
import logging

from app.domain.services.job_service import JobService
from app.infrastructure.db.session import get_db
from app.infrastructure.db.models import JobStatus
from app.schemas.job import (
    JobCreateRequest,
    JobCreateResponse,
    JobStatusResponse,
    JobResultResponse,
    ArtifactResponse,
    MetricResponse,
)
from app.worker.tasks import execute_pipeline
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


@router.post("/", response_model=JobCreateResponse)
async def create_job(
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
    
    **Accepted file format:**
    - `.pdb` - Protein Data Bank format (ONLY)
    
    **File requirements:**
    - Maximum size: 50 MB
    - Must contain valid protein structure data (ATOM/HETATM records)
    - Minimum 10 atoms required
    - File extension MUST be .pdb
    
    **Process:**
    1. Validates file extension is .pdb
    2. Validates file content and structure
    3. Creates a job in the database
    4. Uploads the input file to S3
    5. Queues the job for execution
    
    **Returns:**
    - `job_id`: Unique identifier for tracking
    - `status`: Current job status (initially "queued")
    - `created_at`: Timestamp of job creation
    
    **Error Responses:**
    - `400 Bad Request`: Invalid file format or content
    - `500 Internal Server Error`: Server-side processing error
    """
    job = None
    s3_key = None
    
    try:
        # Validate filename
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")
        
        # Read file content ONCE
        file_content = await file.read()
        
        # Validate extension
        is_valid, error = validate_file_extension(file.filename)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error)
        
        # Validate content
        is_valid, error = validate_file_content(file_content)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error)
        
        # Validate PDB structure
        is_valid, error = validate_pdb_structure(file_content)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error)
        
        # Extract file metadata
        file_info = get_file_info(file_content)
        logger.info(f"File validation passed: {file.filename} ({len(file_content)} bytes, {file_info.get('atom_count', 0)} atoms)")
        
        # Analyze PDB structure for intelligent mode selection
        pdb_analysis = PDBAnalyzer.analyze(file_content.decode('utf-8'), filename=file.filename)
        logger.info(f"PDB Analysis: {pdb_analysis['chain_count']} chains, antibody={pdb_analysis['is_antibody']}, recommended={pdb_analysis['recommended_mode']}")
        
        # Auto-select pipeline if not specified (intelligent selection)
        if pipeline_type == PipelineType.FULL_PIPELINE:
            # Map recommended mode to pipeline type
            mode_to_pipeline = {
                'codesign_single': 'diffab_only',
                'codesign_multicdrs': 'diffab_rfdiffusion_af2',  # Full pipeline
                'fixbb': 'diffab_only',
                'strpred': 'af2_only'
            }
            recommended_pipeline = mode_to_pipeline.get(
                pdb_analysis['recommended_mode'],
                'diffab_rfdiffusion_af2'
            )
            logger.info(f"Auto-selected pipeline: {recommended_pipeline} based on structure analysis")
        else:
            recommended_pipeline = pipeline_type.value
        
        # Use transaction for atomicity
        async with db.begin():
            # Parse selected_models
            model_list = selected_models.split(",") if selected_models else []
            
            # Create job with analysis metadata
            job = await JobService.create_job(
                db=db,
                pipeline_type=recommended_pipeline,
                config={
                    "atom_count": file_info.get("atom_count", 0),
                    "pdb_analysis": pdb_analysis,
                    "selected_models": model_list
                }
            )
            
            # Upload to S3
            s3_key = await JobService.upload_input(
                db=db,
                job_id=job.id,
                file_content=file_content,
                filename=file.filename
            )
            
            # Update status to QUEUED
            await JobService.update_job_status(db, job.id, JobStatus.QUEUED)
        
        # Dispatch to Celery (outside transaction)
        task = execute_pipeline.delay(job.id, pipeline_type.value)
        
        # Store Celery task ID
        job.celery_task_id = task.id
        await db.commit()
        
        logger.info(f"Created and queued job {job.id} with {file_info.get('atom_count', 0)} atoms")
        
        return JobCreateResponse(
            job_id=job.id,
            status=job.status,
            created_at=job.created_at
        )
    
    except HTTPException:
        # Re-raise validation errors (already have proper status codes)
        raise
    except Exception as e:
        # Rollback transaction
        await db.rollback()
        
        # Cleanup S3 if uploaded
        if s3_key:
            try:
                storage_service.delete_file(s3_key)
                logger.info(f"Cleaned up S3 file: {s3_key}")
            except Exception as cleanup_error:
                logger.error(f"Failed to cleanup S3 file {s3_key}: {cleanup_error}")
        
        # Cleanup job if created
        if job:
            try:
                await JobService.update_job_status(db, job.id, JobStatus.FAILED, str(e))
            except Exception as cleanup_error:
                logger.error(f"Failed to mark job as failed: {cleanup_error}")
        
        logger.error(f"Error creating job: {e}", exc_info=True)
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
    status_filter = JobStatus(status) if status else None
    jobs = await JobService.list_jobs(db, status=status_filter, limit=limit)
    return [JobStatusResponse.model_validate(job) for job in jobs]


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
    
    # Revoke Celery task if exists
    if job.celery_task_id:
        try:
            from app.core.celery_app import celery_app
            celery_app.control.revoke(job.celery_task_id, terminate=True, signal='SIGKILL')
            logger.info(f"Revoked Celery task {job.celery_task_id} for job {job_id}")
        except Exception as e:
            logger.error(f"Failed to revoke Celery task: {e}")
    
    # Update job status
    await JobService.update_job_status(db, job_id, JobStatus.CANCELLED)
    
    return {"message": f"Job {job_id} cancelled", "status": "cancelled"}