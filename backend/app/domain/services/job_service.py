"""
Job service - Core business logic for job management.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
import uuid
import logging
from datetime import datetime

from app.infrastructure.db.models import Job, JobStatus, Artifact, Metric
from app.infrastructure.storage.s3_service import storage_service

from sqlalchemy.orm import selectinload

logger = logging.getLogger(__name__)


class JobService:
    """Service for managing job lifecycle and state transitions."""
    
    @staticmethod
    async def create_job(
        db: AsyncSession,
        pipeline_type: str,
        user_id: Optional[str] = None,
        config: Optional[dict] = None
    ) -> Job:
        """Create a new job in CREATED state."""
        job = Job(
            id=str(uuid.uuid4()),
            user_id=user_id,
            pipeline_type=pipeline_type,
            status=JobStatus.CREATED,
            config=config or {},
        )
        db.add(job)
        await db.flush()  # Flush to get ID, but don't commit
        await db.refresh(job)
        
        logger.info(f"Created job {job.id} with pipeline {pipeline_type}")
        return job
    
    @staticmethod
    async def get_job(db: AsyncSession, job_id: str, with_details: bool = False) -> Optional[Job]:
        """Get a job by ID."""
        query = select(Job).where(Job.id == job_id)
        if with_details:
            query = query.options(selectinload(Job.artifacts), selectinload(Job.metrics))
        
        result = await db.execute(query)
        return result.scalar_one_or_none()
    
    @staticmethod
    async def list_jobs(
        db: AsyncSession,
        user_id: Optional[str] = None,
        status: Optional[JobStatus] = None,
        limit: int = 50
    ) -> List[Job]:
        """List jobs with optional filters."""
        query = select(Job).order_by(Job.created_at.desc()).limit(limit)
        
        if user_id:
            query = query.where(Job.user_id == user_id)
        if status:
            query = query.where(Job.status == status)
        
        result = await db.execute(query)
        return list(result.scalars().all())
    
    @staticmethod
    async def update_job_status(
        db: AsyncSession,
        job_id: str,
        new_status: JobStatus,
        error_message: Optional[str] = None
    ) -> Optional[Job]:
        """Update job status with state machine validation."""
        job = await JobService.get_job(db, job_id)
        if not job:
            return None
        
        # Validate state transition
        if not JobService._is_valid_transition(job.status, new_status):
            logger.warning(
                f"Invalid state transition for job {job_id}: "
                f"{job.status} -> {new_status}"
            )
            return None
        
        job.status = new_status
        
        # Update timestamps
        if new_status == JobStatus.RUNNING and not job.started_at:
            job.started_at = datetime.utcnow()
        elif new_status in [JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED]:
            job.finished_at = datetime.utcnow()
        
        if error_message:
            job.error_message = error_message
        
        await db.flush()  # Flush changes, but let caller handle commit
        
        logger.info(f"Updated job {job_id} status: {job.status}")
        return job
    
    @staticmethod
    def _is_valid_transition(current: JobStatus, new: JobStatus) -> bool:
        """Validate state machine transitions."""
        valid_transitions = {
            JobStatus.CREATED: [JobStatus.UPLOADED, JobStatus.FAILED, JobStatus.CANCELLED],
            JobStatus.UPLOADED: [JobStatus.QUEUED, JobStatus.FAILED, JobStatus.CANCELLED],
            JobStatus.QUEUED: [JobStatus.PROVISIONING, JobStatus.FAILED, JobStatus.CANCELLED],
            JobStatus.PROVISIONING: [JobStatus.RUNNING, JobStatus.FAILED, JobStatus.CANCELLED],
            JobStatus.RUNNING: [JobStatus.POST_PROCESSING, JobStatus.FAILED, JobStatus.CANCELLED],
            JobStatus.POST_PROCESSING: [JobStatus.COMPLETED, JobStatus.FAILED],
            JobStatus.COMPLETED: [],
            JobStatus.FAILED: [JobStatus.QUEUED],  # Allow retry
            JobStatus.CANCELLED: [],
        }
        return new in valid_transitions.get(current, [])
    
    @staticmethod
    async def upload_input(
        db: AsyncSession,
        job_id: str,
        file_content: bytes,
        filename: str
    ) -> Optional[str]:
        """Upload input file to S3 and update job."""
        from io import BytesIO
        
        job = await JobService.get_job(db, job_id)
        if not job:
            return None
        
        # Upload to S3
        s3_key = f"jobs/{job_id}/inputs/{filename}"
        storage_service.upload_fileobj(
            file_obj=BytesIO(file_content),  # Wrap bytes in BytesIO
            s3_key=s3_key,
            length=len(file_content)
        )
        
        # Update job
        job.input_s3_key = s3_key
        await JobService.update_job_status(db, job_id, JobStatus.UPLOADED)
        
        logger.info(f"Uploaded input for job {job_id} to {s3_key}")
        return s3_key
    
    @staticmethod
    async def add_artifact(
        db: AsyncSession,
        job_id: str,
        artifact_type: str,
        s3_key: str,
        size_bytes: Optional[int] = None
    ) -> Artifact:
        """Add an artifact to a job."""
        artifact = Artifact(
            id=str(uuid.uuid4()),
            job_id=job_id,
            artifact_type=artifact_type,
            s3_key=s3_key,
            size_bytes=size_bytes,
        )
        db.add(artifact)
        await db.flush()
        await db.refresh(artifact)
        
        logger.info(f"Added artifact {artifact.id} to job {job_id}")
        return artifact
    
    @staticmethod
    async def add_metric(
        db: AsyncSession,
        job_id: str,
        metric_name: str,
        metric_value: float
    ) -> Metric:
        """Add a metric to a job."""
        metric = Metric(
            id=str(uuid.uuid4()),
            job_id=job_id,
            metric_name=metric_name,
            metric_value=metric_value,
        )
        db.add(metric)
        await db.flush()
        await db.refresh(metric)
        
        logger.info(f"Added metric {metric_name}={metric_value} to job {job_id}")
        return metric