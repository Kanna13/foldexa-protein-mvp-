import os
import hmac
import hashlib
import logging
from typing import Optional

from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import OperationalError
from pydantic import BaseModel
import asyncio

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
    """Verify HMAC signature sent by RunPod."""

    signature_header = request.headers.get("X-Signature")

    if not signature_header:
        raise HTTPException(status_code=401, detail="Missing signature")

    if not RUNPOD_SHARED_SECRET:
        raise HTTPException(status_code=500, detail="RUNPOD_SHARED_SECRET not configured")

    body = await request.body()

    expected = hmac.new(
        RUNPOD_SHARED_SECRET.encode(),
        body,
        hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(f"sha256={expected}", signature_header):
        raise HTTPException(status_code=401, detail="Invalid signature")


@router.post("/job_completed", dependencies=[Depends(verify_runpod_signature)])
async def runpod_webhook(
    payload: WebhookPayload,
    db: AsyncSession = Depends(get_db)
):
    """
    Webhook called by RunPod when a job finishes.
    """

    logger.info(f"RunPod webhook received: job={payload.job_id} status={payload.status}")

    job = await JobService.get_job(db, payload.job_id)

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Prevent duplicate processing
    if job.status in {JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED}:
        logger.info(f"Ignoring duplicate webhook for job {payload.job_id}")
        return {"status": "IGNORED"}

    # Implement a retry loop for Deadlock resilience during high-concurrency DB writes
    for attempt in range(3):
        try:
            if payload.status == "COMPLETED":
                await JobService.update_job_status(
                    db,
                    payload.job_id,
                    JobStatus.COMPLETED
                )

                if payload.output_s3_key:
                    await JobService.add_artifact(
                        db=db,
                        job_id=payload.job_id,
                        artifact_type="pdb",
                        s3_key=payload.output_s3_key
                    )

            else:
                await JobService.update_job_status(
                    db,
                    payload.job_id,
                    JobStatus.FAILED,
                    error_message=payload.error
                )

            await db.commit()
            logger.info(f"Webhook processed successfully for job {payload.job_id}")
            return {"status": "ACK"}

        except OperationalError as e:
            await db.rollback()
            if "deadlock detected" in str(e).lower() and attempt < 2:
                logger.warning(f"Deadlock detected for job {payload.job_id}, retrying {attempt+1}/3...")
                await asyncio.sleep(0.2)
            else:
                logger.error(f"Operational DB error processing webhook for job {payload.job_id}: {e}", exc_info=True)
                raise HTTPException(status_code=500, detail="Database error during webhook processing")
        except Exception as e:
            await db.rollback()
            logger.error(
                f"Webhook processing failed for job {payload.job_id}: {e}",
                exc_info=True
            )
            raise HTTPException(
                status_code=500,
                detail="Webhook processing failed"
            )
