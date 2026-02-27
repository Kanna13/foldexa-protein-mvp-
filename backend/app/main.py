"""
Foldexa API - Main application entry point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import os

from app.api.routes import jobs, files, payments, beta, webhook
from app.core.config import settings
from app.core.logging import setup_logging
from app.core.rate_limit import RateLimitMiddleware
from app.core.metrics import PrometheusMiddleware, metrics_endpoint
from app.infrastructure.db.session import engine
from app.infrastructure.db.models import Base

# ... (logging setup)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    setup_logging()
    logger = logging.getLogger("uvicorn.error")
    logger.info("Starting up Foldexa API...")
    
    # Ensure storage directories exist
    os.makedirs(settings.upload_dir, exist_ok=True)
    os.makedirs(settings.result_dir, exist_ok=True)
    
    # Create database tables if they don't exist
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables verified/created.")
    except Exception as e:
        logger.error(f"CRITICAL: Database connection failed: {e}")
        # Don't block startup — the DB might come online shortly
        logger.warning("Server will start, but database operations will fail until DB is reachable.")
    
    # Validate MinIO connection on startup (non-blocking)
    from app.infrastructure.storage.s3_service import storage_service
    logger.info("Validating MinIO connection...")
    try:
        storage_service.validate_connection(timeout_seconds=10)
        logger.info("Successfully connected to MinIO/S3 object storage.")
    except RuntimeError as e:
        logger.warning(
            f"MinIO validation failed: {e}. "
            "Server will start, but file operations will fail until MinIO is reachable."
        )
    
    yield
    
    # Shutdown
    logger.info("Shutting down Foldexa API...")

app = FastAPI(
    title=settings.app_name,
    description="AI platform for protein structure generation and analysis",
    version=settings.app_version,
    debug=settings.debug,
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",  # Allow all Vercel preview deploys
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(jobs.router, prefix="/api/v1") # Assuming jobs handles its own prefix (/jobs)
app.include_router(files.router, prefix="/api/v1")
app.include_router(payments.router, prefix="/api/v1/payments", tags=["payments"])
app.include_router(beta.router, prefix="/api/v1/beta", tags=["beta"])
app.include_router(webhook.router, prefix="/api/v1", tags=["webhooks"])



@app.get("/")
def root():
    return {
        "message": "Foldexa API is running",
        "version": settings.app_version,
        "environment": settings.environment,
    }


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint."""
    if not settings.prometheus_enabled:
        return {"error": "Metrics disabled"}
    return await metrics_endpoint()