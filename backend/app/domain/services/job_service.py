import uuid
from typing import Dict
from app.infrastructure.pipeline.runner import run_pipeline

jobs: Dict[str, dict] = {}

def create_job(input_path: str) -> str:
    job_id = str(uuid.uuid4())
    jobs[job_id] = {
        "status": "pending",
        "input_path": input_path,
        "results": None
    }
    return job_id

def get_job(job_id: str):
    return jobs.get(job_id)

def run_job(job_id: str):
    job = jobs[job_id]
    job["status"] = "running"
    results = run_pipeline(job_id, job["input_path"])
    job["status"] = "done"
    job["results"] = results