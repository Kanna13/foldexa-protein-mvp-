"""
Prometheus monitoring and metrics.
"""
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from fastapi import Response
import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

# Define metrics
http_requests_total = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["method", "endpoint", "status_code"]
)

http_request_duration_seconds = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency",
    ["method", "endpoint"]
)

jobs_total = Counter(
    "jobs_total",
    "Total jobs created",
    ["pipeline_type"]
)

jobs_by_status = Gauge(
    "jobs_by_status",
    "Number of jobs by status",
    ["status"]
)

celery_tasks_total = Counter(
    "celery_tasks_total",
    "Total Celery tasks",
    ["task_name", "status"]
)

model_execution_duration_seconds = Histogram(
    "model_execution_duration_seconds",
    "Model execution duration",
    ["model_name"]
)


class PrometheusMiddleware(BaseHTTPMiddleware):
    """Middleware to collect HTTP metrics."""
    
    async def dispatch(self, request: Request, call_next):
        """Record request metrics."""
        start_time = time.time()
        
        response = await call_next(request)
        
        duration = time.time() - start_time
        
        # Record metrics
        http_requests_total.labels(
            method=request.method,
            endpoint=request.url.path,
            status_code=response.status_code
        ).inc()
        
        http_request_duration_seconds.labels(
            method=request.method,
            endpoint=request.url.path
        ).observe(duration)
        
        return response


async def metrics_endpoint():
    """Endpoint to expose Prometheus metrics."""
    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )
