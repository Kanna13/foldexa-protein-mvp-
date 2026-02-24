"""
GPU model executor — routes jobs to the configured backend.

Backends:
  - "runpod"  → RunPod Serverless GPU (production)
  - "docker"  → Local Docker containers (docker-compose dev)
  - "local"   → Stub/placeholder (no GPU, returns mock result)

The interface (execute_diffab, execute_rfdiffusion, execute_af2_gamma)
is consumed by app/worker/tasks.py and must not change.
"""
import logging
import os
import json
import time
import tempfile
from pathlib import Path
from typing import Dict, Optional

import requests

from app.core.config import settings
from app.infrastructure.storage.s3_service import storage_service

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# RunPod Serverless Executor (production)
# ---------------------------------------------------------------------------

class RunPodExecutor:
    """Execute ML models via RunPod serverless GPU endpoints."""

    def __init__(self):
        self.api_key = settings.runpod_api_key
        self.timeout = settings.runpod_timeout
        self.base_url = "https://api.runpod.ai/v2"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        # MinIO config passed to the GPU worker so it can read/write files
        self.minio_config = {
            "endpoint": settings.s3_endpoint,
            "access_key": settings.s3_access_key,
            "secret_key": settings.s3_secret_key,
            "bucket": settings.s3_bucket_name,
            "use_ssl": settings.s3_use_ssl,
        }

    # -- public interface (matches old ModelExecutor) --

    async def execute_diffab(self, job_id: str, input_s3_key: str) -> Dict:
        return await self._run_model(
            endpoint_id=settings.runpod_endpoint_diffab,
            model="diffab",
            job_id=job_id,
            input_s3_key=input_s3_key,
        )

    async def execute_rfdiffusion(self, job_id: str, input_s3_key: str) -> Dict:
        return await self._run_model(
            endpoint_id=settings.runpod_endpoint_rfdiffusion,
            model="rfdiffusion",
            job_id=job_id,
            input_s3_key=input_s3_key,
        )

    async def execute_af2_gamma(self, job_id: str, input_s3_key: str) -> Dict:
        """AF2 not on RunPod yet — placeholder that returns empty metrics."""
        logger.warning(f"AF2 Gamma not configured on RunPod; skipping for job {job_id}")
        return {"artifacts": [], "metrics": {}}

    # -- internals --

    async def _run_model(
        self,
        endpoint_id: str,
        model: str,
        job_id: str,
        input_s3_key: str,
    ) -> Dict:
        """Submit a job to RunPod and poll until complete."""
        if not endpoint_id:
            raise RuntimeError(f"RunPod endpoint for {model} is not configured (RUNPOD_ENDPOINT_{model.upper()} is empty)")

        url = f"{self.base_url}/{endpoint_id}/run"

        payload = {
            "input": {
                "job_id": job_id,
                "model": model,
                "input_s3_key": input_s3_key,
                "minio": self.minio_config,
            }
        }

        logger.info(f"[RunPod] Submitting {model} job {job_id} to {endpoint_id}")

        # 1. Submit
        resp = requests.post(url, json=payload, headers=self.headers, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        runpod_id = data["id"]
        logger.info(f"[RunPod] Submitted — runpod_id={runpod_id}")

        # 2. Poll for completion
        status_url = f"{self.base_url}/{endpoint_id}/status/{runpod_id}"
        deadline = time.time() + self.timeout

        while time.time() < deadline:
            time.sleep(5)
            status_resp = requests.get(status_url, headers=self.headers, timeout=15)
            status_resp.raise_for_status()
            status_data = status_resp.json()
            status = status_data.get("status")

            if status == "COMPLETED":
                output = status_data.get("output", {})
                logger.info(f"[RunPod] {model} job {job_id} completed: {len(output.get('artifacts', []))} artifacts")
                return output

            if status == "FAILED":
                error = status_data.get("error", "Unknown RunPod error")
                raise RuntimeError(f"RunPod {model} failed: {error}")

            logger.debug(f"[RunPod] {model} job {job_id} status={status}")

        raise TimeoutError(f"RunPod {model} job {job_id} timed out after {self.timeout}s")


# ---------------------------------------------------------------------------
# Local Docker Executor (docker-compose dev — reuses old logic)
# ---------------------------------------------------------------------------

class LocalDockerExecutor:
    """Execute ML models in local Docker containers (for development)."""

    def __init__(self):
        import subprocess
        self.subprocess = subprocess
        self.gpu_enabled = settings.gpu_enabled

    async def execute_diffab(self, job_id: str, input_s3_key: str) -> Dict:
        return await self._run_docker_model("diffab", job_id, input_s3_key)

    async def execute_rfdiffusion(self, job_id: str, input_s3_key: str) -> Dict:
        return await self._run_docker_model("rfdiffusion", job_id, input_s3_key)

    async def execute_af2_gamma(self, job_id: str, input_s3_key: str) -> Dict:
        return await self._run_docker_model("af2-gamma", job_id, input_s3_key)

    async def _run_docker_model(self, model: str, job_id: str, input_s3_key: str) -> Dict:
        job_dir = Path(f"/workspace_share/{job_id}")
        job_dir.mkdir(parents=True, exist_ok=True)

        input_path = job_dir / "input.pdb"
        storage_service.download_file(input_s3_key, str(input_path))

        output_dir = job_dir / "outputs"
        output_dir.mkdir(exist_ok=True)

        docker_cmd = [
            "docker", "run", "--rm",
            "-v", f"foldexa_workspace_shared:/workspace",
        ]
        if self.gpu_enabled:
            docker_cmd.extend(["--gpus", "all"])

        if model == "diffab":
            docker_cmd.extend([
                "diffab:latest",
                "--input", f"/workspace/{job_id}/input.pdb",
                "--output", f"/workspace/{job_id}/outputs",
                "--num_designs", "5",
            ])
        elif model == "rfdiffusion":
            docker_cmd.extend([
                "rfdiffusion:latest",
                "inference.design_ppi",
                f"inference.input_pdb=/workspace/{job_id}/input.pdb",
                f"inference.output_prefix=/workspace/{job_id}/outputs/design",
                "inference.num_designs=5",
            ])
        elif model == "af2-gamma":
            docker_cmd.extend([
                "af2-gamma:latest",
                "--input", f"/workspace/{job_id}/input.pdb",
                "--output_dir", f"/workspace/{job_id}/outputs",
            ])

        logger.info(f"[Docker] Running {model} for job {job_id}")
        result = self.subprocess.run(docker_cmd, capture_output=True, text=True, timeout=3600)

        if result.returncode != 0:
            raise RuntimeError(f"{model} container failed: {result.stderr}")

        # Upload output PDBs to MinIO
        artifacts = []
        for pdb_file in output_dir.glob("*.pdb"):
            s3_key = f"jobs/{job_id}/{model}/{pdb_file.name}"
            storage_service.upload_file(str(pdb_file), s3_key)
            artifacts.append({
                "type": "pdb",
                "s3_key": s3_key,
                "size": pdb_file.stat().st_size,
            })

        metrics = {}
        metrics_file = output_dir / "metrics.json"
        if metrics_file.exists():
            with open(metrics_file) as f:
                metrics = json.load(f)

        return {"artifacts": artifacts, "metrics": metrics, "logs": result.stdout}


# ---------------------------------------------------------------------------
# Stub Executor (no GPU at all — for testing)
# ---------------------------------------------------------------------------

class LocalStubExecutor:
    """Stub executor that returns placeholder results (no real GPU)."""

    async def execute_diffab(self, job_id: str, input_s3_key: str) -> Dict:
        logger.warning(f"[Stub] DiffAb stub for job {job_id} — no real GPU execution")
        return {"artifacts": [], "metrics": {}}

    async def execute_rfdiffusion(self, job_id: str, input_s3_key: str) -> Dict:
        logger.warning(f"[Stub] RFdiffusion stub for job {job_id} — no real GPU execution")
        return {"artifacts": [], "metrics": {}}

    async def execute_af2_gamma(self, job_id: str, input_s3_key: str) -> Dict:
        logger.warning(f"[Stub] AF2 stub for job {job_id} — no real GPU execution")
        return {"artifacts": [], "metrics": {}}


# ---------------------------------------------------------------------------
# Factory — picks the right executor based on GPU_BACKEND env var
# ---------------------------------------------------------------------------

def _create_executor():
    backend = settings.gpu_backend.lower()
    if backend == "runpod":
        logger.info("GPU backend: RunPod Serverless")
        return RunPodExecutor()
    elif backend == "docker":
        logger.info("GPU backend: Local Docker")
        return LocalDockerExecutor()
    else:
        logger.info("GPU backend: Local Stub (no GPU)")
        return LocalStubExecutor()


# Global instance — consumed by app/worker/tasks.py
model_executor = _create_executor()
