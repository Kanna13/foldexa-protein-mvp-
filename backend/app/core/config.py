"""
Core application configuration using pydantic-settings.
Supports environment-based config for dev/staging/prod.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    # Application
    app_name: str = "Foldexa"
    app_version: str = "1.0.0"
    debug: bool = False
    environment: str = "development"
    
    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_workers: int = 4
    
    # Database
    database_url: str = "postgresql+asyncpg://foldexa:foldexa@localhost:5432/foldexa"
    db_echo: bool = False
    db_pool_size: int = 20
    db_max_overflow: int = 10
    
    # Redis (Celery Broker + Cache)
    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"
    
    # Object Storage (MinIO/S3)
    s3_endpoint: str = "http://localhost:9000"
    s3_access_key: str = "minioadmin"
    s3_secret_key: str = "minioadmin"
    s3_bucket_name: str = "foldexa-artifacts"
    s3_region: str = "us-east-1"
    s3_use_ssl: bool = False
    
    # Storage Paths (Local fallback for development)
    storage_base_path: str = "app/storage"
    upload_dir: str = "app/storage/uploads"
    result_dir: str = "app/storage/results"
    
    # Job Configuration
    job_timeout_seconds: int = 10800  # 3 hours
    max_retries: int = 3
    retry_backoff_seconds: int = 60
    
    # GPU/Compute
    gpu_enabled: bool = False
    slurm_enabled: bool = False
    k8s_enabled: bool = False
    docker_enabled: bool = True
    
    # Security
    secret_key: str = "CHANGE_ME_IN_PRODUCTION"
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://foldexa.bio",
        "https://www.foldexa.bio",
        "https://foldexa-protein-mvp-production.up.railway.app"
    ]
    
    # Observability
    log_level: str = "INFO"
    sentry_dsn: Optional[str] = None
    prometheus_enabled: bool = True


# Global settings instance
settings = Settings()
