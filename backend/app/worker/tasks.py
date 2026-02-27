"""
Celery worker tasks for job execution.
"""
from celery import Task
from app.core.celery_app import celery_app
from app.core.config import settings
from app.infrastructure.db.models import JobStatus
from app.domain.services.job_service import JobService
from app.infrastructure.compute.docker_runner import model_executor
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import NullPool
import logging
import asyncio

logger = logging.getLogger(__name__)


async def get_task_session():
    """Create a fresh async session with NullPool to avoid event loop conflicts in Celery."""
    # We use NullPool to ensure connections are created/closed within the current asyncio.run() loop
    engine = create_async_engine(settings.database_url, poolclass=NullPool, echo=settings.db_echo)
    async_session = async_sessionmaker(engine, expire_on_commit=False)
    return async_session, engine


class JobTask(Task):
    """Base task class with error handling and database integration."""
    
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """Handle task failure."""
        logger.error(f"Task {task_id} failed: {exc}")
        job_id = args[0] if args else None
        if job_id:
            asyncio.run(self._update_job_status(job_id, JobStatus.FAILED, str(exc)))
    
    def on_retry(self, exc, task_id, args, kwargs, einfo):
        """Handle task retry."""
        logger.warning(f"Task {task_id} retrying: {exc}")
        job_id = args[0] if args else None
        if job_id:
            asyncio.run(self._increment_retry_count(job_id))
    
    def on_success(self, retval, task_id, args, kwargs):
        """Handle task success."""
        logger.info(f"Task {task_id} completed successfully")
    
    async def _update_job_status(self, job_id: str, status: JobStatus, error_msg: str = None):
        """Update job status in database."""
        SessionLocal, engine = await get_task_session()
        async with SessionLocal() as db:
            try:
                await JobService.update_job_status(db, job_id, status, error_msg)
                await db.commit()
            except Exception as e:
                logger.error(f"Failed to update status: {e}")
            finally:
                await engine.dispose()
    
    async def _increment_retry_count(self, job_id: str):
        """Increment retry count."""
        SessionLocal, engine = await get_task_session()
        async with SessionLocal() as db:
            try:
                job = await JobService.get_job(db, job_id)
                if job:
                    job.retry_count += 1
                    await db.commit()
            except Exception as e:
                logger.error(f"Failed to increment retry: {e}")
            finally:
                await engine.dispose()


# Note: Heavy GPU pipelines (execute_pipeline, execute_diffab, execute_rfdiffusion)
# have been removed from Celery. They are now dispatched via HTTP to RunPod 
# (see app.infrastructure.compute.runpod_runner) and handled asynchronously via Webhooks.

