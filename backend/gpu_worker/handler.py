"""
RunPod Serverless GPU Handler for Foldexa.

This handler runs inside a RunPod GPU container.
It receives a job request, downloads the input PDB from MinIO,
runs the specified model (DiffAb or RFdiffusion), uploads results
back to MinIO, and returns artifact metadata.

Deploy this as a RunPod Serverless Endpoint with a GPU-enabled Docker image.
"""
import runpod
import os
import subprocess
import json
import logging
import tempfile
from pathlib import Path
from minio import Minio
from urllib.parse import urlparse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("gpu_worker")


def get_minio_client(minio_config: dict) -> Minio:
    """Create a MinIO client from the config passed by the API."""
    endpoint = minio_config["endpoint"]
    parsed = urlparse(endpoint)
    endpoint_clean = parsed.netloc if parsed.netloc else endpoint
    use_ssl = minio_config.get("use_ssl", False)

    return Minio(
        endpoint=endpoint_clean,
        access_key=minio_config["access_key"],
        secret_key=minio_config["secret_key"],
        secure=use_ssl,
    )


def download_input(client: Minio, bucket: str, s3_key: str, local_path: str):
    """Download input file from MinIO."""
    client.fget_object(bucket, s3_key, local_path)
    logger.info(f"Downloaded {s3_key} -> {local_path}")


def upload_outputs(client: Minio, bucket: str, job_id: str, model: str, output_dir: str) -> list:
    """Upload all output PDB files back to MinIO."""
    artifacts = []
    output_path = Path(output_dir)

    for pdb_file in output_path.glob("*.pdb"):
        s3_key = f"jobs/{job_id}/{model}/{pdb_file.name}"
        client.fput_object(bucket, s3_key, str(pdb_file))
        artifacts.append({
            "type": "pdb",
            "s3_key": s3_key,
            "size": pdb_file.stat().st_size,
        })
        logger.info(f"Uploaded {pdb_file.name} -> {s3_key}")

    return artifacts


def run_diffab(input_path: str, output_dir: str) -> dict:
    """Run DiffAb antibody design model."""
    logger.info(f"Running DiffAb: input={input_path}, output={output_dir}")

    # DiffAb execution command — adjust path based on your Docker image
    cmd = [
        "conda", "run", "--no-capture-output", "-n", "diffab",
        "python", "/app/wrapper.py",
        "--input", input_path,
        "--output", output_dir,
        "--num_designs", "5",
    ]

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=1800)

    if result.returncode != 0:
        raise RuntimeError(f"DiffAb failed (exit {result.returncode}): {result.stderr[:500]}")

    return {"logs": result.stdout}


def run_rfdiffusion(input_path: str, output_dir: str) -> dict:
    """Run RFdiffusion protein design model."""
    logger.info(f"Running RFdiffusion: input={input_path}, output={output_dir}")

    cmd = [
        "python", "/app/scripts/run_inference.py",
        f"inference.input_pdb={input_path}",
        f"inference.output_prefix={output_dir}/design",
        "inference.num_designs=5",
    ]

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=3600)

    if result.returncode != 0:
        raise RuntimeError(f"RFdiffusion failed (exit {result.returncode}): {result.stderr[:500]}")

    return {"logs": result.stdout}


def handler(event):
    """
    RunPod serverless handler.

    Expected input:
    {
        "input": {
            "job_id": "uuid",
            "model": "diffab" | "rfdiffusion",
            "input_s3_key": "jobs/<id>/inputs/file.pdb",
            "minio": {
                "endpoint": "minio:9000",
                "access_key": "...",
                "secret_key": "...",
                "bucket": "foldexa-artifacts",
                "use_ssl": false
            }
        }
    }

    Returns:
    {
        "artifacts": [{"type": "pdb", "s3_key": "...", "size": 12345}],
        "metrics": {}
    }
    """
    job_input = event["input"]
    job_id = job_input["job_id"]
    model = job_input["model"]
    input_s3_key = job_input["input_s3_key"]
    minio_config = job_input["minio"]
    bucket = minio_config["bucket"]

    logger.info(f"Processing {model} job {job_id}")

    # Setup MinIO client
    client = get_minio_client(minio_config)

    # Create temp working directory
    with tempfile.TemporaryDirectory() as work_dir:
        input_path = os.path.join(work_dir, "input.pdb")
        output_dir = os.path.join(work_dir, "outputs")
        os.makedirs(output_dir, exist_ok=True)

        # Download input
        download_input(client, bucket, input_s3_key, input_path)

        # Run model
        if model == "diffab":
            run_result = run_diffab(input_path, output_dir)
        elif model == "rfdiffusion":
            run_result = run_rfdiffusion(input_path, output_dir)
        else:
            raise ValueError(f"Unknown model: {model}")

        # Upload results
        artifacts = upload_outputs(client, bucket, job_id, model, output_dir)

        # Parse metrics if present
        metrics = {}
        metrics_file = os.path.join(output_dir, "metrics.json")
        if os.path.exists(metrics_file):
            with open(metrics_file) as f:
                metrics = json.load(f)

    logger.info(f"Completed {model} job {job_id}: {len(artifacts)} artifacts")

    return {
        "artifacts": artifacts,
        "metrics": metrics,
    }


# RunPod entrypoint
runpod.serverless.start({"handler": handler})
