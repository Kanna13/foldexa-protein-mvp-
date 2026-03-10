import os
import ssl
import uuid
import logging
import subprocess
import time
import shutil
from pathlib import Path

import runpod
from minio import Minio
import urllib3

# Disable noisy SSL warnings when using CERT_NONE
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


# ---------------- ENV PATHS ----------------

FOLDEXA_ROOT = Path(os.environ.get("FOLDEXA_ROOT", "/workspace"))

CODE_DIR = FOLDEXA_ROOT / "code"
MODEL_DIR = FOLDEXA_ROOT / "weights"
JOB_DIR = FOLDEXA_ROOT / "jobs"
LOG_DIR = FOLDEXA_ROOT / "logs"
CACHE_DIR = FOLDEXA_ROOT / "cache"


# ---------------- S3 CONFIG ----------------

MINIO_ENDPOINT = os.environ.get(
    "S3_ENDPOINT",
    os.environ.get("MINIO_ENDPOINT", "minio-production-09da.up.railway.app")
)

if MINIO_ENDPOINT.startswith("http://"):
    MINIO_ENDPOINT = MINIO_ENDPOINT[7:]

elif MINIO_ENDPOINT.startswith("https://"):
    MINIO_ENDPOINT = MINIO_ENDPOINT[8:]


MINIO_ACCESS_KEY = os.environ.get(
    "S3_ACCESS_KEY",
    os.environ.get("MINIO_ACCESS_KEY", "minioadmin")
)

MINIO_SECRET_KEY = os.environ.get(
    "S3_SECRET_KEY",
    os.environ.get("MINIO_SECRET_KEY", "minioadmin")
)

MINIO_BUCKET = os.environ.get(
    "S3_BUCKET_NAME",
    os.environ.get("MINIO_BUCKET", "foldexa-artifacts")
)

MINIO_SECURE = os.environ.get("S3_USE_SSL", "True").lower() == "true"


# ---------------- LOGGING ----------------

logging.basicConfig(
    level=logging.INFO,
    format="%(filename)s:%(lineno)d %(asctime)s %(message)s"
)

logger = logging.getLogger("foldexa-worker")

# Startup diagnostics — logged once when container initialises
logger.info("=== Foldexa RunPod Worker v1.9.3 Starting ===")
logger.info(f"  MinIO endpoint : {MINIO_ENDPOINT}")
logger.info(f"  MinIO bucket   : {MINIO_BUCKET}")
logger.info(f"  MinIO secure   : {MINIO_SECURE}")
logger.info(f"  Access key set : {bool(MINIO_ACCESS_KEY and MINIO_ACCESS_KEY != 'minioadmin')}")
logger.info(f"  FOLDEXA_ROOT   : {FOLDEXA_ROOT}")
logger.info(f"  CODE_DIR       : {CODE_DIR}")
logger.info(f"  MODEL_DIR      : {MODEL_DIR}")
logger.info("===========================================")


# ---------------- MINIO ----------------

def get_minio_client(s3_config=None):
    try:
        # Use provided config or fall back to defaults
        endpoint = s3_config.get("s3_endpoint") if s3_config else MINIO_ENDPOINT
        access_key = s3_config.get("s3_access_key") if s3_config else MINIO_ACCESS_KEY
        secret_key = s3_config.get("s3_secret_key") if s3_config else MINIO_SECRET_KEY
        bucket = s3_config.get("s3_bucket_name") if s3_config else MINIO_BUCKET
        secure = s3_config.get("s3_use_ssl") if s3_config else MINIO_SECURE

        # Strip prefixes if provided in dynamic config
        if isinstance(endpoint, str):
            if endpoint.startswith("http://"):
                endpoint = endpoint[7:]
            elif endpoint.startswith("https://"):
                endpoint = endpoint[8:]

        # Build an SSL context that skips certificate verification.
        ssl_ctx = ssl.create_default_context()
        ssl_ctx.check_hostname = False
        ssl_ctx.verify_mode = ssl.CERT_NONE

        # Use urllib3 with explicit timeouts to prevent infinite RunPod execution
        # if the MinIO connection hangs or Railway drops connections.
        http_client = urllib3.PoolManager(
            timeout=urllib3.Timeout(connect=15.0, read=60.0),
            retries=urllib3.Retry(
                total=4,
                backoff_factor=0.5,
                status_forcelist=[500, 502, 503, 504, 520, 524]
            ),
            ssl_context=ssl_ctx
        )

        client = Minio(
            endpoint,
            access_key=access_key,
            secret_key=secret_key,
            secure=secure,
            http_client=http_client
        )

        if not client.bucket_exists(bucket):
            logger.info(f"Creating bucket {bucket}")
            client.make_bucket(bucket)

        return client, bucket

    except Exception as e:
        logger.error(f"CRITICAL: MinIO client failed to initialise: {e}")
        raise


# ---------------- DIRECTORIES ----------------

def ensure_directories():

    for d in [MODEL_DIR, JOB_DIR, LOG_DIR, CACHE_DIR]:
        d.mkdir(parents=True, exist_ok=True)


# ---------------- SUBPROCESS ----------------

def run_subprocess(cmd, timeout=3600):

    logger.info("Running command:")
    logger.info(" ".join(str(c) for c in cmd))

    proc = subprocess.Popen(
        [str(c) for c in cmd],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )

    stdout_chunks = []
    
    # Read output line by line as it is generated
    if proc.stdout:
        for line in proc.stdout:
            stdout_chunks.append(line)
            print(line, end="", flush=True)

    proc.wait(timeout=timeout)

    if proc.returncode != 0:
        raise RuntimeError(
            f"Process failed (exit {proc.returncode})"
        )

    return "".join(stdout_chunks)


# ---------------- HANDLER ----------------

def handler(event):
    """
    Main RunPod Serverless handler.

    Returns a structured payload so the backend can reliably extract
    the result S3 key and distinguish hard failures.
    """

    logger.info(f"Received job: {event}")

    job_input = event.get("input", {}) or {}

    job_id = job_input.get(
        "job_id",
        f"job_{uuid.uuid4().hex[:8]}"
    )

    model_name = job_input.get("model_name")
    input_s3_key = job_input.get("input_s3_key")
    s3_config = job_input.get("s3_config")

    if not model_name or not input_s3_key:
        logger.error("Missing model_name or input_s3_key in event payload")
        return {
            "status": "FAILED",
            "error": "Missing model_name or input_s3_key",
        }

    ensure_directories()

    minio, bucket_name = get_minio_client(s3_config)

    job_path = JOB_DIR / job_id
    job_path.mkdir(parents=True, exist_ok=True)

    input_file = job_path / "input.pdb"
    output_dir = job_path / "output"
    output_dir.mkdir(exist_ok=True)

    try:

        # ---------- DOWNLOAD INPUT ----------

        logger.info(f"Downloading {input_s3_key} from {bucket_name}")

        minio.fget_object(
            bucket_name,
            input_s3_key,
            str(input_file)
        )

        # ---------- BUILD COMMAND ----------

        if model_name.startswith("diffab"):

            diffab_cfg = job_input.get("params", {}).get("diffab_config", {}) or {}

            num_designs = int(diffab_cfg.get("num_designs", 5))
            temperature = float(diffab_cfg.get("sampling_temp", 0.5))
            device = diffab_cfg.get("device", "cuda")
            design_mode = diffab_cfg.get("design_mode", "codesign_single")

            cmd = [
                "python",
                CODE_DIR / "diffab" / "wrapper.py",
                "--input", input_file,
                "--output", output_dir,
                "--num_designs", str(num_designs),
                "--temperature", str(temperature),
                "--device", device,
                "--design_mode", design_mode,
            ]

        else:

            raise RuntimeError(f"Unknown model {model_name}")

        # ---------- RUN MODEL ----------

        run_subprocess(cmd)

        # ---------- FIND OUTPUT ----------

        pdb_files = list(output_dir.glob("*.pdb"))

        if not pdb_files:
            raise RuntimeError("No PDB output")

        result_file = pdb_files[0]

        output_s3_key = f"jobs/{job_id}/results/{result_file.name}"

        # ---------- UPLOAD RESULT ----------

        logger.info(f"Uploading result to s3://{bucket_name}/{output_s3_key}")

        minio.fput_object(
            bucket_name,
            output_s3_key,
            str(result_file)
        )

        logger.info("Upload complete. Job finished successfully")

        # Structured payload that matches backend expectations:
        # jobs.py can read output["result_s3_key"] or output["output_s3_key"]
        return {
            "status": "COMPLETED",
            "output": {
                "job_id": job_id,
                "output_s3_key": output_s3_key,
                "model_name": model_name
            }
        }

    except Exception as e:

        logger.exception("Worker failed")

        # Let the backend and/or RunPod know this is a hard failure.
        return {
            "status": "FAILED",
            "error": str(e)
        }

    finally:

        # Give any logging time to flush and then clean the workspace.
        time.sleep(1)
        shutil.rmtree(job_path, ignore_errors=True)
        logger.info("Workspace cleaned")


# ---------------- START ----------------

if __name__ == "__main__":
    logger.info("Starting Foldexa RunPod worker...")
    runpod.serverless.start({"handler": handler})