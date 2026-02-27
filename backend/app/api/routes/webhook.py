import os
import hmac
import hashlib
import logging
from typing import Optional

from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.infrastructure.db.session import get_db
from app.domain.services.job_service import JobService
from app.infrastructure.db.models import JobStatus

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/webhook", tags=["webhooks"])

RUNPOD_SHARED_SECRET = os.environ.get("RUNPOD_SHARED_SECRET", "")

class WebhookPayload(BaseModel):
    job_id: str
    status: str
    output_s3_key: Optional[str] = None
    error: Optional[str] = None

async def verify_runpod_signature(request: Request):
    """Dependency to verify the HMAC signature from RunPod."""
    signature_header = request.headers.get("X-Signature")
    if not signature_header:
        logger.warning("Rejecting RunPod webhook: Missing X-Signature header")
        raise HTTPException(status_code=401, detail="Missing signature header")
    
    if not RUNPOD_SHARED_SECRET:
        logger.error("RunPod Webhook received but RUNPOD_SHARED_SECRET is not configured on Railway!")
        raise HTTPException(status_code=500, detail="Server misconfiguration")

    body = await request.body()
    expected = hmac.new(RUNPOD_SHARED_SECRET.encode(), body, hashlib.sha256).hexdigest()
    
    if not hmac.compare_digest(f"sha256={expected}", signature_header):
        logger.warning(f"Rejecting RunPod webhook: Invalid signature.")
        raise HTTPException(status_code=401, detail="Invalid signature")

@router.post("/job_completed", dependencies=[Depends(verify_runpod_signature)])
async def runpod_webhook(payload: WebhookPayload, db: AsyncSession = Depends(get_db)):
    """
    Webhook target for RunPod to notify Railway when a GPU job finishes.
    """
    logger.info(f"Received RunPod webhook for job {payload.job_id}: {payload.status}")
    
    # Strip any potential prefix added by the fast API if applicable, assuming they match perfectly.
    job_id = payload.job_id
    
    try:
        if payload.status == "COMPLETED":
            await JobService.update_job_status(db, job_id, JobStatus.COMPLETED)
            
            # Record output artifact
            if payload.output_s3_key:
                await JobService.add_artifact(
                    db=db,
                    job_id=job_id,
                    artifact_type="pdb",
                    s3_key=payload.output_s3_key
                )
        else:
            await JobService.update_job_status(db, job_id, JobStatus.FAILED, error_message=payload.error)

        await db.commit()
        return {"status": "ACK"}
    
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to process RunPod webhook for job {job_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to process webhook locally")
