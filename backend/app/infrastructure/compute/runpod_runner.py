import os
import hmac
import hashlib
import json
import logging
import httpx

logger = logging.getLogger(__name__)

# Try to get from app config, fallback to environment for flexibility
RUNPOD_URL = os.environ.get("RUNPOD_URL", "").rstrip("/")
RUNPOD_SHARED_SECRET = os.environ.get("RUNPOD_SHARED_SECRET", "")

class RunPodRunner:
    """Runner for dispatching GPU jobs over HTTP to dedicated RunPod inference server."""

    @staticmethod
    async def submit_job(job_id: str, model_name: str, input_s3_key: str, params: dict = None) -> str:
        """
        Submit a GPU inference job via HTTP to RunPod.
        """
        if not RUNPOD_URL or not RUNPOD_SHARED_SECRET:
            logger.error("RUNPOD_URL or RUNPOD_SHARED_SECRET not configured")
            raise RuntimeError("RunPod credentials not configured. Job cannot be dispatched.")

        payload = json.dumps({
            "model_name": model_name,
            "input_s3_key": input_s3_key,
            "params": params or {}
        }).encode("utf-8")

        # Create HMAC SHA256 signature
        signature = f"sha256={hmac.new(RUNPOD_SHARED_SECRET.encode(), payload, hashlib.sha256).hexdigest()}"

        logger.info(f"Dispatching job {job_id} ({model_name}) to RunPod at {RUNPOD_URL}...")

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{RUNPOD_URL}/v1/predict",
                    content=payload,
                    headers={
                        "X-Signature": signature,
                        "Content-Type": "application/json"
                    },
                    timeout=10.0  # Fast timeout since server should reply 'ACCEPTED' immediately 
                )
                response.raise_for_status()
                data = response.json()
                logger.info(f"RunPod successfully accepted job {job_id}: {data}")
                return data.get("job_id", "")
            
            except httpx.TimeoutException:
                logger.error(f"RunPod submission timed out for {job_id}.")
                raise RuntimeError("RunPod GPU server is currently unreachable (Timeout).")
            except httpx.HTTPError as e:
                logger.error(f"RunPod submission failed with HTTP error for {job_id}: {e}")
                raise RuntimeError(f"RunPod GPU server rejected request: {e}")
            except Exception as e:
                logger.error(f"Unexpected error submitting job {job_id} to RunPod: {e}")
                raise RuntimeError(f"Unexpected error during RunPod submission: {e}")
