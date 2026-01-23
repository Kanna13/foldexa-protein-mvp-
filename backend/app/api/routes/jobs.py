from fastapi import APIRouter, BackgroundTasks, UploadFile, File
import uuid
import os

from app.domain.services.job_service import create_job, get_job, run_job

router = APIRouter(prefix="/jobs", tags=["jobs"])

UPLOAD_DIR = "app/storage/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/")
async def submit_job(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None
):
    file_id = str(uuid.uuid4())
    ext = file.filename.split(".")[-1]
    filename = f"{file_id}.{ext}"
    path = os.path.join(UPLOAD_DIR, filename)

    with open(path, "wb") as f:
        f.write(await file.read())

    job_id = create_job(path)
    background_tasks.add_task(run_job, job_id)

    return {
        "job_id": job_id,
        "filename": filename
    }


@router.get("/{job_id}")
def job_status(job_id: str):
    job = get_job(job_id)
    if not job:
        return {"status": "not_found"}
    return {"job_id": job_id, "status": job["status"]}


@router.get("/{job_id}/results")
def job_results(job_id: str):
    job = get_job(job_id)
    if not job or job["status"] != "done":
        return {"error": "Not ready"}
    return job["results"]