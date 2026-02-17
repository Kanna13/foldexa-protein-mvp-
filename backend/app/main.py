"""
Foldexa API - Main application entry point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.api.routes import jobs, files, payments, beta
from app.core.config import settings
from app.core.logging import setup_logging
from app.core.rate_limit import RateLimitMiddleware
from app.core.metrics import PrometheusMiddleware, metrics_endpoint
from app.infrastructure.db.session import engine
from app.infrastructure.db.models import Base

# ... (logging setup)

# ... (lifespan)

app = FastAPI(
    title=settings.app_name,
    description="AI platform for protein structure generation and analysis",
    version=settings.app_version,
    debug=settings.debug,
    lifespan=lifespan,
)

# ... (middlewares)

# Include routers
app.include_router(jobs.router) # Assuming jobs handles its own prefix or is root
app.include_router(files.router)
app.include_router(payments.router, prefix="/api/v1/payments", tags=["payments"])
app.include_router(beta.router, prefix="/api/v1/beta", tags=["beta"])



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