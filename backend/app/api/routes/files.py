from fastapi import APIRouter, UploadFile, File
import uuid
import os

router = APIRouter(prefix="/files", tags=["files"])

UPLOAD_DIR = "app/storage/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    file_id = str(uuid.uuid4())
    ext = file.filename.split(".")[-1]
    filename = f"{file_id}.{ext}"
    path = os.path.join(UPLOAD_DIR, filename)

    with open(path, "wb") as f:
        f.write(await file.read())

    return {
        "file_id": file_id,
        "filename": filename,
        "path": path
    }