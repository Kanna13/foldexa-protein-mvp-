"""
Job service - Core business logic for job lifecycle management.
Deterministic, idempotent, race-safe implementation.
"""

import uuid
import logging
from typing import Optional, List
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.infrastructure.db.models import Job, JobStatus, Artifact, Metric
from app.infrastructure.storage.s3_service import storage_service

from fastapi.concurrency import run_in_threadpool
from io import BytesIO

logger = logging.getLogger(__name__)

UTC = timezone.utc


class InvalidStateTransition(Exception):
    pass


class JobNotFound(Exception):
    pass


class JobService:
    """
    Production-grade job lifecycle manager.
    - Strict state machine
    - Idempotent transitions
    - Row locking (FOR UPDATE)
    - Timezone-aware timestamps
    - Structured logging
    """

    # =========================================================
    # CREATE
    # =========================================================

    @staticmethod
    async def create_job(
        db: AsyncSession,
        pipeline_type: str,
        user_id: Optional[str] = None,
        config: Optional[dict] = None
    ) -> Job:
        job = Job(
            id=str(uuid.uuid4()),
            user_id=user_id,
            pipeline_type=pipeline_type,
            status=JobStatus.CREATED,
            config=config or {},
            # created_at is omitted to allow PostgreSQL's server_default=func.now() to set it
            # This prevents offset-naive vs offset-aware datetime errors in asyncpg
        )

        db.add(job)
        await db.flush()
        await db.refresh(job)

        logger.info(
            "job_created",
            extra={
                "job_id": job.id,
                "pipeline": pipeline_type,
                "user_id": user_id
            }
        )

        return job

    # =========================================================
    # READ
    # =========================================================

    @staticmethod
    async def get_job(
        db: AsyncSession,
        job_id: str,
        with_details: bool = False
    ) -> Optional[Job]:
        query = select(Job).where(Job.id == job_id)

        if with_details:
            query = query.options(
                selectinload(Job.artifacts),
                selectinload(Job.metrics)
            )

        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def list_jobs(
        db: AsyncSession,
        user_id: Optional[str] = None,
        status: Optional[JobStatus] = None,
        limit: int = 50
    ) -> List[Job]:
        query = select(Job).order_by(Job.created_at.desc()).limit(limit)

        if user_id:
            query = query.where(Job.user_id == user_id)

        if status:
            query = query.where(Job.status == status)

        result = await db.execute(query)
        return list(result.scalars().all())

    # =========================================================
    # STATE MACHINE
    # =========================================================

    TERMINAL = {
        JobStatus.COMPLETED,
        JobStatus.FAILED,
        JobStatus.CANCELLED
    }

    ACTIVE = {
        JobStatus.QUEUED,
        JobStatus.PROVISIONING,
        JobStatus.RUNNING,
        JobStatus.POST_PROCESSING
    }

    VALID_TRANSITIONS = {
        JobStatus.CREATED: {JobStatus.UPLOADED} | TERMINAL,
        JobStatus.UPLOADED: {JobStatus.QUEUED} | TERMINAL,
        JobStatus.QUEUED: ACTIVE | TERMINAL,
        JobStatus.PROVISIONING: ACTIVE | TERMINAL,
        JobStatus.RUNNING: ACTIVE | TERMINAL,
        JobStatus.POST_PROCESSING: ACTIVE | TERMINAL,
        JobStatus.FAILED: {JobStatus.QUEUED},  # retry
        JobStatus.COMPLETED: set(),
        JobStatus.CANCELLED: set(),
    }

    @staticmethod
    async def update_job_status(
        db: AsyncSession,
        job_id: str,
        new_status: JobStatus,
        error_message: Optional[str] = None
    ) -> Job:
        result = await db.execute(
            select(Job)
            .where(Job.id == job_id)
            .with_for_update()
        )

        job = result.scalar_one_or_none()

        if not job:
            raise JobNotFound(f"Job {job_id} not found")

        current_status = job.status

        # Idempotent update
        if current_status == new_status:
            return job

        if new_status not in JobService.VALID_TRANSITIONS.get(current_status, set()):
            raise InvalidStateTransition(
                f"Invalid transition {current_status} -> {new_status}"
            )

        job.status = new_status

        now = datetime.now(UTC)

        if new_status == JobStatus.RUNNING and not job.started_at:
            job.started_at = now

        if new_status in JobService.TERMINAL:
            job.finished_at = now

        if error_message:
            job.error_message = error_message

        await db.flush()

        logger.info(
            "job_status_changed",
            extra={
                "job_id": job_id,
                "from": current_status.name,
                "to": new_status.name
            }
        )

        return job

    # =========================================================
    # INPUT UPLOAD
    # =========================================================

    @staticmethod
    async def upload_input(
        db: AsyncSession,
        job_id: str,
        file_content: bytes,
        filename: str
    ) -> str:
        result = await db.execute(
            select(Job)
            .where(Job.id == job_id)
            .with_for_update()
        )

        job = result.scalar_one_or_none()

        if not job:
            raise JobNotFound(f"Job {job_id} not found")

        s3_key = f"jobs/{job_id}/inputs/{filename}"

        await run_in_threadpool(
            storage_service.upload_fileobj,
            file_obj=BytesIO(file_content),
            s3_key=s3_key,
            length=len(file_content)
        )

        job.input_s3_key = s3_key

        await JobService.update_job_status(
            db,
            job_id,
            JobStatus.UPLOADED
        )

        logger.info(
            "job_input_uploaded",
            extra={
                "job_id": job_id,
                "s3_key": s3_key
            }
        )

        return s3_key

    # =========================================================
    # ARTIFACTS
    # =========================================================

    @staticmethod
    async def add_artifact(
        db: AsyncSession,
        job_id: str,
        artifact_type: str,
        s3_key: str,
        size_bytes: Optional[int] = None
    ) -> Artifact:
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

        logger.info(
            "artifact_added",
            extra={
                "job_id": job_id,
                "artifact_id": artifact.id,
                "type": artifact_type,
                "s3_key": s3_key
            }
        )

        return artifact

    # =========================================================
    # METRICS
    # =========================================================

    @staticmethod
    async def add_metric(
        db: AsyncSession,
        job_id: str,
        metric_name: str,
        metric_value: float
    ) -> Metric:
        metric = Metric(
            id=str(uuid.uuid4()),
            job_id=job_id,
            metric_name=metric_name,
            metric_value=metric_value,
        )

        db.add(metric)
        await db.flush()
        await db.refresh(metric)

        logger.info(
            "metric_added",
            extra={
                "job_id": job_id,
                "metric_name": metric_name,
                "metric_value": metric_value
            }
        )

        return metric