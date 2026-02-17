"""
Database models for the Foldexa platform.
"""
from sqlalchemy import Column, String, Integer, Float, DateTime, Enum, JSON, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.infrastructure.db.session import Base


class JobStatus(str, enum.Enum):
    """Job state machine states."""
    CREATED = "created"
    UPLOADED = "uploaded"
    QUEUED = "queued"
    PROVISIONING = "provisioning"
    RUNNING = "running"
    POST_PROCESSING = "post_processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class Job(Base):
    """Job entity representing a single pipeline execution."""
    __tablename__ = "jobs"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, nullable=True)  # TODO: Add auth later
    
    # Status tracking
    status = Column(Enum(JobStatus), default=JobStatus.CREATED, nullable=False, index=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    started_at = Column(DateTime, nullable=True)
    finished_at = Column(DateTime, nullable=True)
    
    # Configuration
    pipeline_type = Column(String, nullable=False)  # e.g., "diffab_rfdiffusion_af2"
    config = Column(JSON, nullable=True)  # Pipeline-specific parameters
    
    # Input/Output
    input_s3_key = Column(String, nullable=True)
    
    # Error tracking
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0)
    
    # Celery task tracking
    celery_task_id = Column(String, nullable=True, index=True)
    
    # Relationships
    artifacts = relationship("Artifact", back_populates="job", cascade="all, delete-orphan")
    metrics = relationship("Metric", back_populates="job", cascade="all, delete-orphan")


class Artifact(Base):
    """Artifacts produced by jobs (PDB files, logs, plots)."""
    __tablename__ = "artifacts"
    
    id = Column(String, primary_key=True)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=False, index=True)
    
    artifact_type = Column(String, nullable=False)  # "pdb", "log", "plot", "trajectory"
    s3_key = Column(String, nullable=False)
    size_bytes = Column(Integer, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    job = relationship("Job", back_populates="artifacts")


class Metric(Base):
    """Metrics computed for job outputs (pLDDT, ddG, etc)."""
    __tablename__ = "metrics"
    
    id = Column(String, primary_key=True)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=False, index=True)
    
    metric_name = Column(String, nullable=False)  # "plddt", "ddg", "ipae"
    metric_value = Column(Float, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    job = relationship("Job", back_populates="metrics")


class BetaAccessRequest(Base):
    """Beta access requests submitted by users."""
    __tablename__ = "beta_access_requests"

    id = Column(String, primary_key=True)
    
    # Personal Info
    full_name = Column(String, nullable=False)
    email = Column(String, nullable=False, index=True)
    organization = Column(String, nullable=True)
    role = Column(String, nullable=True)
    
    # Usage Details
    usage_type = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    
    # Contact
    contact_preference = Column(String, default="email")
    contact_handle = Column(String, nullable=True)
    
    # Status
    status = Column(String, default="pending", index=True)  # pending, approved, rejected
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
