import json
import logging
import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

class RunPodRunner:
    """Runner for dispatching GPU jobs over HTTP to dedicated RunPod Serverless."""

    @staticmethod
    async def submit_job(job_id: str, model_name: str, input_s3_key: str, params: dict = None) -> str:
        """
        Submit a GPU inference job via HTTP to RunPod Serverless API.
        """
        runpod_api_key = settings.runpod_api_key
        if model_name.startswith("rfdiffusion"):
            endpoint_id = settings.runpod_endpoint_rfdiffusion
        elif model_name.startswith("diffab"):
            endpoint_id = settings.runpod_endpoint_diffab
        elif model_name.startswith("af2"):
            endpoint_id = getattr(settings, "runpod_endpoint_af2", "")
        else:
            logger.error(f"Unknown model_name for RunPod dispatch: {model_name}")
            raise ValueError(f"Unknown model_name: {model_name}")

        if not runpod_api_key or not endpoint_id:
            logger.error(f"RunPod settings missing for {model_name}. API_KEY and ENDPOINT_ID are required.")
            raise RuntimeError(f"RunPod credentials/endpoint not configured for {model_name}. Job cannot be dispatched.")

        payload = {
            "input": {
                "job_id": job_id,
                "model_name": model_name,
                "input_s3_key": input_s3_key,
                "params": params or {}
            }
        }

        url = f"https://api.runpod.ai/v2/{endpoint_id}/run"
        logger.info(f"Dispatching job {job_id} ({model_name}) to RunPod Serverless endpoint: {endpoint_id}...")

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    url,
                    json=payload,
                    headers={
                        "Authorization": f"Bearer {runpod_api_key}",
                        "Content-Type": "application/json"
                    },
                    timeout=15.0  # Fast timeout since server should reply 'IN_QUEUE' immediately 
                )
                response.raise_for_status()
                data = response.json()
                
                # RunPod returns {"id": "job_id", "status": "IN_QUEUE"}
                runpod_job_id = data.get("id", "")
                if not runpod_job_id:
                    raise RuntimeError(f"Invalid response from RunPod: {data}")
                    
                logger.info(f"RunPod successfully accepted job {job_id} -> RunPod Job ID: {runpod_job_id}")
                return runpod_job_id
            
            except httpx.TimeoutException:
                logger.error(f"RunPod submission timed out for {job_id}.")
                raise RuntimeError("RunPod GPU server is currently unreachable (Timeout).")
            except httpx.HTTPError as e:
                response_text = ""
                if hasattr(e, "response") and e.response:
                    try:
                        response_text = e.response.text
                    except:
                        pass
                logger.error(f"RunPod submission failed with HTTP error for {job_id}: {e} - {response_text}")
                raise RuntimeError(f"RunPod GPU server rejected request: {e}")
            except Exception as e:
                logger.error(f"Unexpected error submitting job {job_id} to RunPod: {e}")
                raise RuntimeError(f"Unexpected error during RunPod submission: {e}")

    @staticmethod
    async def get_job_status(runpod_job_id: str, model_name: str) -> dict:
        """
        Query the status of a GPU inference job from RunPod Serverless API.
        Returns a dictionary with status, executionTime, and output.
        """
        runpod_api_key = settings.runpod_api_key
        if model_name.startswith("rfdiffusion"):
            endpoint_id = settings.runpod_endpoint_rfdiffusion
        elif model_name.startswith("diffab"):
            endpoint_id = settings.runpod_endpoint_diffab
        elif model_name.startswith("af2"):
            endpoint_id = getattr(settings, "runpod_endpoint_af2", "")
        else:
            logger.error(f"Unknown model_name for RunPod status: {model_name}")
            raise ValueError(f"Unknown model_name: {model_name}")

        if not runpod_api_key or not endpoint_id:
            logger.error(f"RunPod settings missing for {model_name}. API_KEY and ENDPOINT_ID are required.")
            raise RuntimeError(f"RunPod credentials/endpoint not configured for {model_name}.")

        url = f"https://api.runpod.ai/v2/{endpoint_id}/status/{runpod_job_id}"
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    url,
                    headers={
                        "Authorization": f"Bearer {runpod_api_key}",
                        "Content-Type": "application/json"
                    },
                    timeout=10.0
                )
                response.raise_for_status()
                return response.json()
            
            except httpx.TimeoutException:
                logger.error(f"RunPod status query timed out for {runpod_job_id}.")
                return {"status": "UNKNOWN", "error": "Timeout"}
            except httpx.HTTPError as e:
                logger.error(f"RunPod status query failed for {runpod_job_id}: {e}")
                return {"status": "UNKNOWN", "error": str(e)}
            except Exception as e:
                logger.error(f"Unexpected error querying RunPod status for {runpod_job_id}: {e}")
                return {"status": "UNKNOWN", "error": str(e)}
