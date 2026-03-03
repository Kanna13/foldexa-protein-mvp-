import os
import json
import uuid
import logging
import asyncio
import shutil
from pathlib import Path

import runpod
from minio import Minio

# --- ENV & PATHS ---
FOLDEXA_ROOT = Path(os.environ.get("FOLDEXA_ROOT", "/workspace"))
CODE_DIR = FOLDEXA_ROOT / "code"
MODEL_DIR = FOLDEXA_ROOT / "weights"
JOB_DIR = FOLDEXA_ROOT / "jobs"
LOG_DIR = FOLDEXA_ROOT / "logs"
CACHE_DIR = FOLDEXA_ROOT / "cache"

MINIO_ENDPOINT = os.environ.get("S3_ENDPOINT", os.environ.get("MINIO_ENDPOINT", "minio-production-09da.up.railway.app"))
# Strip http:// or https:// for minio client if provided
if MINIO_ENDPOINT.startswith("http://"):
    MINIO_ENDPOINT = MINIO_ENDPOINT[7:]
elif MINIO_ENDPOINT.startswith("https://"):
    MINIO_ENDPOINT = MINIO_ENDPOINT[8:]

MINIO_ACCESS_KEY = os.environ.get("S3_ACCESS_KEY", os.environ.get("MINIO_ACCESS_KEY", "minioadmin"))
MINIO_SECRET_KEY = os.environ.get("S3_SECRET_KEY", os.environ.get("MINIO_SECRET_KEY", "minioadmin"))
MINIO_BUCKET = os.environ.get("S3_BUCKET_NAME", os.environ.get("MINIO_BUCKET", "foldexa-artifacts"))
MINIO_SECURE = os.environ.get("S3_USE_SSL", "True").lower() == "true"

# --- LOGGING ---
logging.basicConfig(
    level=logging.INFO,
    format="%(filename)-20s:%(lineno)-4d %(asctime)s %(message)s"
)
logger = logging.getLogger("runpod-serverless-worker")

def get_minio_client():
    client = Minio(
        MINIO_ENDPOINT,
        access_key=MINIO_ACCESS_KEY,
        secret_key=MINIO_SECRET_KEY,
        secure=MINIO_SECURE
    )
    # Auto-create bucket if it doesn't exist yet
    if not client.bucket_exists(MINIO_BUCKET):
        logger.info(f"Bucket '{MINIO_BUCKET}' not found — creating it...")
        client.make_bucket(MINIO_BUCKET)
        logger.info(f"Bucket '{MINIO_BUCKET}' created successfully.")
    return client

def ensure_directories():
    for d in [MODEL_DIR, JOB_DIR, LOG_DIR, CACHE_DIR]:
        d.mkdir(parents=True, exist_ok=True)

async def run_subprocess(cmd, timeout=3600):
    """Run a subprocess with timeout."""
    logger.info(f"Running: {' '.join(str(c) for c in cmd)}")
    proc = await asyncio.create_subprocess_exec(
        *[str(c) for c in cmd],
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )
    try:
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout)
    except asyncio.TimeoutError:
        proc.kill()
        raise RuntimeError(f"GPU execution timed out ({timeout}s)")

    if proc.returncode != 0:
        raise RuntimeError(
            f"GPU process failed (exit {proc.returncode}):\n"
            f"STDOUT: {stdout.decode()}\nSTDERR: {stderr.decode()}"
        )

    return stdout.decode(), stderr.decode()


async def handler(event):
    """
    RunPod Serverless Handler — async so it integrates natively with RunPod SDK.
    `event` is a dictionary containing the job data.
    """
    logger.info(f"Received job: {event}")
    job_input = event.get("input", {})
    job_id = job_input.get("job_id", f"job_{uuid.uuid4().hex[:8]}")
    model_name = job_input.get("model_name", "")
    input_s3_key = job_input.get("input_s3_key", "")

    logger.info(f"[{job_id}] model_name={model_name!r}, input_s3_key={input_s3_key!r}")

    if not model_name or not input_s3_key:
        return {"error": "Missing model_name or input_s3_key in input"}

    ensure_directories()
    minio_client = get_minio_client()

    job_path = JOB_DIR / job_id
    job_path.mkdir(parents=True, exist_ok=True)
    input_file = job_path / "input.pdb"
    output_dir = job_path / "output"
    output_dir.mkdir(parents=True, exist_ok=True)

    try:
        # Download input from MinIO
        logger.info(f"[{job_id}] Downloading input from S3: {input_s3_key}")
        minio_client.fget_object(MINIO_BUCKET, input_s3_key, str(input_file))
        logger.info(f"[{job_id}] Download complete. Running inference...")

        # Prepare command based on model_name
        if model_name.startswith("diffab"):
            cmd = [
                "python",
                CODE_DIR / "diffab" / "wrapper.py",
                "--input", input_file,
                "--output", output_dir
            ]
        elif model_name.startswith("rfdiffusion"):
            cmd = [
                "python",
                CODE_DIR / "rfdiffusion" / "scripts" / "run_inference.py",
                f"inference.input_pdb={input_file}",
                f"inference.output_prefix={output_dir}/design"
            ]
        elif model_name.startswith("af2"):
            cmd = [
                "python",
                CODE_DIR / "af2" / "run_af2.py",
                "--input", input_file,
                "--output", output_dir
            ]
        else:
            raise RuntimeError(f"Unknown model_name: {model_name!r}")

        # Execute model
        stdout, stderr = await run_subprocess(cmd, timeout=3600)
        logger.info(f"[{job_id}] Inference complete. stdout={stdout[:200]}")

        # Upload outputs to S3
        out_files = list(output_dir.glob("*.pdb"))
        if not out_files:
            raise RuntimeError("No PDB output generated after inference.")

        output_file = out_files[0]
        output_s3_key = f"jobs/{job_id}/results/{output_file.name}"
        logger.info(f"[{job_id}] Uploading result to S3: {output_s3_key}")
        minio_client.fput_object(MINIO_BUCKET, output_s3_key, str(output_file))

        logger.info(f"[{job_id}] Job completed successfully.")
        return {
            "status": "COMPLETED",
            "job_id": job_id,
            "output_s3_key": output_s3_key,
            "model_name": model_name
        }

    except Exception as e:
        logger.error(f"[{job_id}] ERROR: {str(e)}", exc_info=True)
        return {"error": str(e)}

    finally:
        # Clean up job workspace
        shutil.rmtree(job_path, ignore_errors=True)


if __name__ == "__main__":
    logger.info("Starting RunPod Serverless Worker...")
    logger.info(f"  MODEL_DIR  = {MODEL_DIR}")
    logger.info(f"  CODE_DIR   = {CODE_DIR}")
    logger.info(f"  S3 endpoint= {MINIO_ENDPOINT} / bucket={MINIO_BUCKET}")
    runpod.serverless.start({"handler": handler})
