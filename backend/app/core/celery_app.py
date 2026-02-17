"""
Celery application configuration.
"""
from celery import Celery
from app.core.config import settings

# Initialize Celery app
celery_app = Celery(
    "foldexa",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["app.worker.tasks"]
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=settings.job_timeout_seconds,
    task_soft_time_limit=settings.job_timeout_seconds - 300,  # 5 min before hard limit
    task_acks_late=True,
    worker_prefetch_multiplier=1,  # One task at a time for GPU jobs
    task_reject_on_worker_lost=True,
    task_default_retry_delay=settings.retry_backoff_seconds,
    task_max_retries=settings.max_retries,
)
