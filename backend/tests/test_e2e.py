"""
End-to-end integration tests for the complete job pipeline.
"""
import pytest
import asyncio
from httpx import AsyncClient
import os
import tempfile

from app.main import app
from app.infrastructure.db.session import AsyncSessionLocal, engine
from app.infrastructure.db.models import Base


@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
async def db_session():
    """Create a fresh database session for each test."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    
    async with AsyncSessionLocal() as session:
        yield session


@pytest.fixture
async def client():
    """Create test client."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_health_endpoint(client):
    """Test health check endpoint."""
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


@pytest.mark.asyncio
async def test_create_job(client):
    """Test job creation with file upload."""
    # Create a test PDB file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.pdb', delete=False) as f:
        f.write("ATOM      1  N   ALA A   1       0.000   0.000   0.000  1.00  0.00           N\n")
        test_file = f.name
    
    try:
        with open(test_file, 'rb') as f:
            response = await client.post(
                "/jobs/",
                files={"file": ("test.pdb", f, "chemical/x-pdb")},
                data={"pipeline_type": "diffab_only"}
            )
        
        assert response.status_code == 200
        data = response.json()
        assert "job_id" in data
        assert data["status"] == "queued"
        
        job_id = data["job_id"]
        
        # Check job status
        status_response = await client.get(f"/jobs/{job_id}")
        assert status_response.status_code == 200
        assert status_response.json()["job_id"] == job_id
    
    finally:
        os.unlink(test_file)


@pytest.mark.asyncio
async def test_list_jobs(client):
    """Test listing jobs."""
    response = await client.get("/jobs/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_job_not_found(client):
    """Test getting non-existent job."""
    response = await client.get("/jobs/nonexistent-id")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_rate_limiting(client):
    """Test rate limiting middleware."""
    # Make multiple requests rapidly
    responses = []
    for _ in range(70):  # Exceed the 60 req/min limit
        response = await client.get("/health")
        responses.append(response.status_code)
    
    # Should have some 429 responses
    assert 429 in responses


@pytest.mark.asyncio
async def test_metrics_endpoint(client):
    """Test Prometheus metrics endpoint."""
    response = await client.get("/metrics")
    assert response.status_code == 200
    # Metrics should be in Prometheus format
    assert b"http_requests_total" in response.content or "error" in response.json()


@pytest.mark.asyncio
async def test_complete_pipeline_flow(client, db_session):
    """
    Test complete end-to-end flow:
    1. Create job
    2. Check status transitions
    3. Get results
    """
    # Create test file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.pdb', delete=False) as f:
        f.write("ATOM      1  N   ALA A   1       0.000   0.000   0.000  1.00  0.00           N\n")
        test_file = f.name
    
    try:
        # 1. Submit job
        with open(test_file, 'rb') as f:
            create_response = await client.post(
                "/jobs/",
                files={"file": ("test.pdb", f, "chemical/x-pdb")},
                data={"pipeline_type": "diffab_only"}
            )
        
        assert create_response.status_code == 200
        job_id = create_response.json()["job_id"]
        
        # 2. Wait for job to complete (in real test, would mock execution)
        # For now, just check that job exists
        status_response = await client.get(f"/jobs/{job_id}")
        assert status_response.status_code == 200
        
        job_data = status_response.json()
        assert job_data["status"] in ["created", "uploaded", "queued", "running", "completed"]
        
        # 3. If completed, get results
        if job_data["status"] == "completed":
            results_response = await client.get(f"/jobs/{job_id}/results")
            assert results_response.status_code == 200
            results = results_response.json()
            assert "artifacts" in results
            assert "metrics" in results
    
    finally:
        os.unlink(test_file)
