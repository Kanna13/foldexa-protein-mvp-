# Foldexa Backend

Production-grade backend for the Foldexa protein design platform.

## Architecture

This backend implements a **Domain-Driven Design (DDD)** architecture with:

- **FastAPI** for async HTTP API
- **Celery + Redis** for distributed task orchestration
- **PostgreSQL** for persistent state
- **MinIO/S3** for artifact storage
- **Docker** for model execution isolation

## Project Structure

```
backend/
├── app/
│   ├── api/              # HTTP endpoints
│   ├── core/             # Config, Celery, logging
│   ├── domain/           # Business logic (JobService)
│   ├── infrastructure/   # External integrations (DB, S3)
│   ├── schemas/          # Pydantic models
│   ├── worker/           # Celery tasks
│   └── main.py           # Application entry point
├── alembic/              # Database migrations
├── docker-compose.yml    # Local dev stack
├── Dockerfile            # Container definition
└── requirements.txt      # Python dependencies
```

## Quick Start

### 1. Setup Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 2. Start Services

```bash
docker-compose up -d
```

This starts:
- PostgreSQL (port 5432)
- Redis (port 6379)
- MinIO (port 9000, console 9001)
- FastAPI (port 8000)
- Celery Worker

### 3. Run Migrations

```bash
docker-compose exec api alembic upgrade head
```

### 4. Test the API

```bash
curl http://localhost:8000/health
```

## API Endpoints

- `POST /jobs/` - Create and submit a job
- `GET /jobs/{job_id}` - Get job status
- `GET /jobs/` - List all jobs
- `GET /jobs/{job_id}/results` - Get job results
- `DELETE /jobs/{job_id}` - Cancel a job

## Development

### Local Development (without Docker)

```bash
# Install dependencies
pip install -r requirements.txt

# Start Postgres and Redis
docker-compose up -d postgres redis minio

# Run migrations
alembic upgrade head

# Start API
uvicorn app.main:app --reload

# Start worker (in another terminal)
celery -A app.core.celery_app worker --loglevel=info
```

### Database Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

## Job State Machine

Jobs follow this state flow:

```
CREATED → UPLOADED → QUEUED → PROVISIONING → RUNNING → POST_PROCESSING → COMPLETED
                                    ↓              ↓
                                  FAILED ←────────┘
                                    ↓
                                  QUEUED (retry)
```

## Testing

```bash
pytest
```

## Production Deployment

1. Set environment variables properly
2. Use Alembic for migrations (not auto-create)
3. Run behind a reverse proxy (nginx)
4. Use managed Postgres/Redis
5. Configure S3 bucket policies
6. Set up monitoring (Prometheus/Grafana)
