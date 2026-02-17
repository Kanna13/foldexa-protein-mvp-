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


@celery_app.task(base=JobTask, bind=True, name="execute_pipeline")
def execute_pipeline(self, job_id: str, pipeline_type: str):
    """
    Execute a complete pipeline job.
    
    Args:
        job_id: Unique job identifier
        pipeline_type: Type of pipeline to execute
    """
    logger.info(f"Executing pipeline {pipeline_type} for job {job_id}")
    
    async def _run():
        SessionLocal, engine = await get_task_session()
        async with SessionLocal() as db:
            try:
                # Get job
                job = await JobService.get_job(db, job_id)
                if not job or not job.input_s3_key:
                    raise ValueError(f"Job {job_id} not found or missing input")
                
                # Update status to PROVISIONING then RUNNING to satisfy state machine
                await JobService.update_job_status(db, job_id, JobStatus.PROVISIONING)
                await db.commit()
                
                await JobService.update_job_status(db, job_id, JobStatus.RUNNING)
                await db.commit()
                
                # Execute pipeline based on type
                if pipeline_type == "diffab_only":
                    result = await model_executor.execute_diffab(job_id, job.input_s3_key)
                elif pipeline_type == "rfdiffusion_only":
                    result = await model_executor.execute_rfdiffusion(job_id, job.input_s3_key)
                elif pipeline_type == "af2_only":
                    result = await model_executor.execute_af2_gamma(job_id, job.input_s3_key)
                elif pipeline_type == "diffab_rfdiffusion_af2":
                    # Full pipeline with optional steps based on selection
                    config = job.config or {}
                    selected = config.get("selected_models", [])
                    
                    # If no specific selection stored (legacy), assume all
                    if not selected:
                        selected = ["diffab", "rfdiffusion", "alphafold2"]
                        
                    current_input = job.input_s3_key
                    collected_artifacts = []
                    
                    # 1. DiffAb
                    if "diffab" in selected:
                        diffab_result = await model_executor.execute_diffab(job_id, current_input)
                        if not diffab_result["artifacts"]:
                            raise RuntimeError("DiffAb produced no artifacts")
                        collected_artifacts.extend(diffab_result["artifacts"])
                        # Update input for next step (use first design)
                        current_input = diffab_result["artifacts"][0]["s3_key"]
                        
                    # 2. RFdiffusion
                    if "rfdiffusion" in selected:
                        rf_result = await model_executor.execute_rfdiffusion(job_id, current_input)
                        if not rf_result["artifacts"]:
                            raise RuntimeError("RFdiffusion produced no artifacts")
                        collected_artifacts.extend(rf_result["artifacts"])
                        current_input = rf_result["artifacts"][0]["s3_key"]
                        
                    # 3. AlphaFold 2
                    af2_metrics = {}
                    if "alphafold2" in selected:
                        af2_result = await model_executor.execute_af2_gamma(job_id, current_input)
                        collected_artifacts.extend(af2_result["artifacts"])
                        af2_metrics = af2_result.get("metrics", {})
                    
                    result = {
                        "artifacts": collected_artifacts,
                        "metrics": af2_metrics
                    }
                else:
                    raise ValueError(f"Unknown pipeline type: {pipeline_type}")
                
                # Store artifacts
                for artifact_data in result.get("artifacts", []):
                    await JobService.add_artifact(
                        db,
                        job_id,
                        artifact_data["type"],
                        artifact_data["s3_key"],
                        artifact_data.get("size")
                    )
                
                # Store metrics
                for metric_name, metric_value in result.get("metrics", {}).items():
                    try:
                        final_value = 0.0
                        if isinstance(metric_value, list):
                            # Compute mean for array metrics (like per-residue pLDDT)
                            if metric_value:
                                final_value = sum(metric_value) / len(metric_value)
                        else:
                            final_value = float(metric_value)
                            
                        await JobService.add_metric(db, job_id, metric_name, final_value)
                    except (ValueError, TypeError) as e:
                        logger.warning(f"Skipping metric {metric_name} with value {metric_value}: {e}")
                
                # Update to POST_PROCESSING then COMPLETED to satisfy state machine
                await JobService.update_job_status(db, job_id, JobStatus.POST_PROCESSING)
                await db.commit()
                
                await JobService.update_job_status(db, job_id, JobStatus.COMPLETED)
                await db.commit()
                
            except Exception as e:
                logger.error(f"Pipeline execution failed for job {job_id}: {e}")
                # We need to catch this here to update status, but also re-raise to trigger on_failure
                await JobService.update_job_status(db, job_id, JobStatus.FAILED, str(e))
                await db.commit()
                raise
            finally:
                await engine.dispose()
    
    asyncio.run(_run())
    
    return {
        "job_id": job_id,
        "status": "completed"
    }


@celery_app.task(base=JobTask, bind=True, name="execute_diffab")
def execute_diffab(self, job_id: str, input_s3_key: str):
    """Execute DiffAb model."""
    logger.info(f"Executing DiffAb for job {job_id}")
    
    async def _run():
        result = await model_executor.execute_diffab(job_id, input_s3_key)
        return result
    
    return asyncio.run(_run())


@celery_app.task(base=JobTask, bind=True, name="execute_rfdiffusion")
def execute_rfdiffusion(self, job_id: str, input_s3_key: str):
    """Execute RFdiffusion model."""
    logger.info(f"Executing RFdiffusion for job {job_id}")
    
    async def _run():
        result = await model_executor.execute_rfdiffusion(job_id, input_s3_key)
        return result
    
    return asyncio.run(_run())


@celery_app.task(base=JobTask, bind=True, name="execute_af2")
def execute_af2(self, job_id: str, input_s3_key: str):
    """Execute AlphaFold2 Gamma model."""
    logger.info(f"Executing AF2 for job {job_id}")
    
    async def _run():
        result = await model_executor.execute_af2_gamma(job_id, input_s3_key)
        return result
    
    return asyncio.run(_run())

