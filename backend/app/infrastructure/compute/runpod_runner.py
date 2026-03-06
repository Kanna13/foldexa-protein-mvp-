import logging
import httpx
from typing import Optional, Dict, Any

from app.core.config import settings

logger = logging.getLogger(__name__)

class RunPodRunner:
    """
    Runner for dispatching GPU jobs over HTTP to dedicated RunPod Serverless.
    Supports asynchronous execution, status polling, and webhook callbacks.
    """

    @staticmethod
    def _get_endpoint_id(model_name: str) -> str:
        """Map model prefixes to RunPod endpoint IDs."""
        if model_name.startswith("rfdiffusion"):
            return settings.runpod_endpoint_rfdiffusion
        elif model_name.startswith("diffab"):
            return settings.runpod_endpoint_diffab
        elif model_name.startswith("af2"):
            return getattr(settings, "runpod_endpoint_af2", "")
        
        logger.error(f"Unknown model_name for RunPod dispatch: {model_name}")
        raise ValueError(f"Unknown model_name: {model_name}")

    @staticmethod
    async def submit_job(
        job_id: str, 
        model_name: str, 
        input_s3_key: str, 
        params: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Submit a GPU inference job via HTTP to RunPod Serverless API.
        Returns the RunPod Job ID.
        """
        api_key = settings.runpod_api_key
        endpoint_id = RunPodRunner._get_endpoint_id(model_name)

        if not api_key or not endpoint_id:
            logger.error(f"RunPod settings missing for {model_name}. API_KEY and ENDPOINT_ID are required.")
            raise RuntimeError(f"RunPod credentials/endpoint not configured for {model_name}.")

        # -----------------------------------------------------------------
        # WEBHOOK: If app_url is set, tell RunPod to POST back when finished.
        # This is more efficient than polling alone.
        # -----------------------------------------------------------------
        webhook_url = f"{settings.app_url}/api/v1/webhook/job_completed" if settings.app_url else None

        payload = {
            "input": {
                "job_id": job_id,
                "model_name": model_name,
                "input_s3_key": input_s3_key,
                "params": params or {},
                "s3_config": {
                    "s3_endpoint": settings.s3_endpoint,
                    "s3_access_key": settings.s3_access_key,
                    "s3_secret_key": settings.s3_secret_key,
                    "s3_bucket_name": settings.s3_bucket_name,
                    "s3_use_ssl": settings.s3_use_ssl,
                }
            },
            "policy": {
                "executionTimeout": 3600000, # 60 minutes safety (in ms)
                "priority": 1
            }
        }

        if webhook_url:
            payload["webhook"] = webhook_url
            logger.info(f"Using webhook for RunPod job: {webhook_url}")

        url = f"https://api.runpod.ai/v2/{endpoint_id}/run"
        
        logger.info(
            f"Dispatching job {job_id} ({model_name}) to RunPod endpoint: {endpoint_id}..."
        )

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    url,
                    json=payload,
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json"
                    },
                    timeout=20.0  # Slightly longer timeout for initial queueing
                )
                response.raise_for_status()
                data = response.json()
                
                runpod_job_id = data.get("id", "")
                if not runpod_job_id:
                    raise RuntimeError(f"Invalid response from RunPod: {data}")
                    
                logger.info(f"RunPod accepted job {job_id} -> RP ID: {runpod_job_id}")
                return runpod_job_id
            
            except httpx.TimeoutException:
                logger.error(f"RunPod submission timed out for {job_id}.")
                raise RuntimeError("RunPod GPU server unreachable (Timeout).")
            except httpx.HTTPStatusError as e:
                resp_text = e.response.text if e.response else "No body"
                logger.error(f"RunPod API error {e.response.status_code}: {resp_text}")
                raise RuntimeError(f"RunPod GPU server rejected request: {e}")
            except Exception as e:
                logger.error(f"Unexpected error submitting job {job_id}: {e}")
                raise RuntimeError(f"Unexpected error during RunPod submission: {e}")

    @staticmethod
    async def get_job_status(runpod_job_id: str, model_name: str) -> Dict[str, Any]:
        """
        Query the status of a GPU inference job from RunPod.
        """
        api_key = settings.runpod_api_key
        endpoint_id = RunPodRunner._get_endpoint_id(model_name)

        if not api_key or not endpoint_id:
            logger.error(f"RunPod settings missing for status check.")
            raise RuntimeError("RunPod credentials/endpoint not configured.")

        url = f"https://api.runpod.ai/v2/{endpoint_id}/status/{runpod_job_id}"
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    url,
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json"
                    },
                    timeout=10.0
                )
                response.raise_for_status()
                return response.json()
            
            except Exception as e:
                logger.error(f"Failed to query RunPod status for {runpod_job_id}: {e}")
                return {"status": "UNKNOWN", "error": str(e)}

    @staticmethod
    async def cancel_job(runpod_job_id: str, model_name: str) -> bool:
        """
        Cancel a running or queued job on RunPod.
        """
        api_key = settings.runpod_api_key
        endpoint_id = RunPodRunner._get_endpoint_id(model_name)

        url = f"https://api.runpod.ai/v2/{endpoint_id}/cancel/{runpod_job_id}"
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    url,
                    headers={"Authorization": f"Bearer {api_key}"},
                    timeout=10.0
                )
                return response.status_code == 200
            except Exception as e:
                logger.error(f"Failed to cancel RunPod job {runpod_job_id}: {e}")
                return False
