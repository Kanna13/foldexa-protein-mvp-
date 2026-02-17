"""
Pydantic schemas for API request/response validation.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class JobStatusEnum(str, Enum):
    """Job status enum for API responses."""
    CREATED = "created"
    UPLOADED = "uploaded"
    QUEUED = "queued"
    PROVISIONING = "provisioning"
    RUNNING = "running"
    POST_PROCESSING = "post_processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class JobCreateRequest(BaseModel):
    """Request to create a new job."""
    pipeline_type: str = Field(..., description="Pipeline type (e.g., 'diffab_rfdiffusion_af2')")
    config: Optional[dict] = Field(default=None, description="Pipeline-specific configuration")


class JobCreateResponse(BaseModel):
    """Response after creating a job."""
    job_id: str
    status: JobStatusEnum
    created_at: datetime


class JobStatusResponse(BaseModel):
    """Job status response."""
    job_id: str = Field(validation_alias="id")
    status: JobStatusEnum
    created_at: datetime
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    error_message: Optional[str] = None
    pipeline_type: str
    
    class Config:
        from_attributes = True


class ArtifactResponse(BaseModel):
    """Artifact response."""
    id: str
    artifact_type: str
    s3_key: str
    size_bytes: Optional[int] = None
    download_url: Optional[str] = None
    
    class Config:
        from_attributes = True


class MetricResponse(BaseModel):
    """Metric response."""
    metric_name: str
    metric_value: float
    
    class Config:
        from_attributes = True


class JobResultResponse(BaseModel):
    """Complete job result with artifacts and metrics."""
    job_id: str
    status: JobStatusEnum
    artifacts: List[ArtifactResponse]
    metrics: List[MetricResponse]
    
    class Config:
        from_attributes = True