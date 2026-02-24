"""
Core application configuration using pydantic-settings.
Supports environment-based config for dev/staging/prod.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, AliasChoices
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
    s3_endpoint: str = Field(default="http://localhost:9000", validation_alias=AliasChoices("S3_ENDPOINT", "MINIO_ENDPOINT"))
    s3_access_key: str = Field(default="minioadmin", validation_alias=AliasChoices("S3_ACCESS_KEY", "MINIO_ACCESS_KEY"))
    s3_secret_key: str = Field(default="minioadmin", validation_alias=AliasChoices("S3_SECRET_KEY", "MINIO_SECRET_KEY"))
    s3_bucket_name: str = Field(default="foldexa-artifacts", validation_alias=AliasChoices("S3_BUCKET_NAME", "MINIO_BUCKET"))
    s3_region: str = "us-east-1"
    s3_use_ssl: bool = Field(default=False, validation_alias=AliasChoices("S3_USE_SSL", "MINIO_USE_SSL"))
    
    # Storage Paths (Local fallback for development)
    storage_base_path: str = "./storage"
    upload_dir: str = "./storage/uploads"
    result_dir: str = "./storage/results"
    
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
        "https://foldexa-protein-mvp-production.up.railway.app",
        # Vercel preview/production domains
        "https://foldexa-protein-mvp.vercel.app",
        "https://foldexa.vercel.app",
    ]
    
    # Observability
    log_level: str = "INFO"
    sentry_dsn: Optional[str] = None
    prometheus_enabled: bool = True


# Global settings instance
settings = Settings()
