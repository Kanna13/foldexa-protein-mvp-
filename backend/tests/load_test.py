"""
Load testing script using Locust.
"""
from locust import HttpUser, task, between
import random
import io


class FoldexaUser(HttpUser):
    """Simulate user behavior for load testing."""
    
    wait_time = between(1, 3)  # Wait 1-3 seconds between tasks
    
    def on_start(self):
        """Called when a user starts."""
        self.job_ids = []
    
    @task(3)
    def create_job(self):
        """Create a new job (most common operation)."""
        # Create a minimal PDB file
        pdb_content = b"ATOM      1  N   ALA A   1       0.000   0.000   0.000  1.00  0.00           N\n"
        
        files = {
            "file": ("test.pdb", io.BytesIO(pdb_content), "chemical/x-pdb")
        }
        data = {
            "pipeline_type": random.choice(["diffab_only", "rfdiffusion_only", "af2_only"])
        }
        
        with self.client.post("/jobs/", files=files, data=data, catch_response=True) as response:
            if response.status_code == 200:
                job_id = response.json().get("job_id")
                if job_id:
                    self.job_ids.append(job_id)
                response.success()
            elif response.status_code == 429:
                # Rate limited - expected behavior
                response.success()
            else:
                response.failure(f"Got status code {response.status_code}")
    
    @task(5)
    def check_job_status(self):
        """Check status of existing jobs (most common read operation)."""
        if not self.job_ids:
            return
        
        job_id = random.choice(self.job_ids)
        with self.client.get(f"/jobs/{job_id}", catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Got status code {response.status_code}")
    
    @task(2)
    def list_jobs(self):
        """List all jobs."""
        with self.client.get("/jobs/", catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Got status code {response.status_code}")
    
    @task(1)
    def get_results(self):
        """Try to get job results."""
        if not self.job_ids:
            return
        
        job_id = random.choice(self.job_ids)
        with self.client.get(f"/jobs/{job_id}/results", catch_response=True) as response:
            # 400 is expected if job not completed
            if response.status_code in [200, 400]:
                response.success()
            else:
                response.failure(f"Got status code {response.status_code}")
    
    @task(1)
    def health_check(self):
        """Health check endpoint."""
        self.client.get("/health")


# Run with: locust -f tests/load_test.py --host=http://localhost:8000
