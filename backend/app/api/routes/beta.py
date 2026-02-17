from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
import uuid
import os
import httpx
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

from app.infrastructure.db.session import get_db
from app.infrastructure.db.models import BetaAccessRequest

router = APIRouter()

# --- Pydantic Schema ---
class BetaAccessCreate(BaseModel):
    fullName: str
    email: EmailStr
    org: Optional[str] = None
    role: Optional[str] = None
    usageType: str
    description: Optional[str] = None
    contactPref: str = "email"
    contactHandle: Optional[str] = None

# --- Notification Logic ---

async def send_telegram_notification(request: BetaAccessRequest):
    """Sends a notification to the admin Telegram regarding a new submission."""
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
    chat_id = os.getenv("TELEGRAM_CHAT_ID")
    
    if not bot_token or not chat_id:
        print("Telegram tokens missing. Skipping notification.")
        return

    message = (
        f"🚀 **New Beta Access Request**\n\n"
        f"👤 **Name**: {request.full_name}\n"
        f"📧 **Email**: {request.email}\n"
        f"🏢 **Org**: {request.organization or 'N/A'}\n"
        f"💼 **Role**: {request.role or 'N/A'}\n"
        f"🎯 **Usage**: {request.usage_type}\n"
        f"📝 **Note**: {request.description or 'N/A'}\n"
        f"📞 **Contact**: {request.contact_preference} ({request.contact_handle or 'N/A'})\n"
    )

    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    
    async with httpx.AsyncClient() as client:
        try:
            await client.post(url, json={"chat_id": chat_id, "text": message, "parse_mode": "Markdown"})
        except Exception as e:
            print(f"Failed to send Telegram notification: {e}")

def send_email_notification(request: BetaAccessRequest):
    """Sends a confirmation email to the user and a copy to the admin."""
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")      # "kanseu13@gmail.com"
    smtp_password = os.getenv("SMTP_PASSWORD") # App Password
    
    if not smtp_user or not smtp_password:
        print("SMTP credentials missing. Skipping email.")
        return

    # 1. User Confirmation Email
    try:
        msg = MIMEMultipart()
        msg['From'] = f"Foldexa Team <{smtp_user}>"
        msg['To'] = request.email
        msg['Subject'] = "We've received your Foldexa Beta Request"
        
        body = f"""
        Hi {request.full_name},

        Thanks for requesting early access to Foldexa. We've added you to our priority queue.
        
        We review requests manually to ensure we can support your research needs. You'll hear from us soon via {request.contact_preference}.

        Unfolding the future,
        The Foldexa Team
        """
        msg.attach(MIMEText(body, 'plain'))
        
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
            
            # 2. Admin Copy (Optional if Telegram is primary, but good backup)
            admin_msg = MIMEMultipart()
            admin_msg['From'] = smtp_user
            admin_msg['To'] = smtp_user # Send to self
            admin_msg['Subject'] = f"[Beta Request] {request.full_name}"
            admin_msg.attach(MIMEText(f"New request from {request.email}.\n\n{request.description}", 'plain'))
            server.send_message(admin_msg)

    except Exception as e:
        print(f"Failed to send email: {e}")

# --- API Endpoint ---

@router.post("/request-access")
async def request_beta_access(
    data: BetaAccessCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    # Check if email is already registered (optional logic, skipping for MVP)
    
    # Create DB Record
    db_request = BetaAccessRequest(
        id=str(uuid.uuid4()),
        full_name=data.fullName,
        email=data.email,
        organization=data.org,
        role=data.role,
        usage_type=data.usageType,
        description=data.description,
        contact_preference=data.contactPref,
        contact_handle=data.contactHandle,
        created_at=datetime.utcnow()
    )
    
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    
    # Queue Notifications
    background_tasks.add_task(send_telegram_notification, db_request)
    background_tasks.add_task(send_email_notification, db_request)
    
    return {"status": "success", "message": "Request received"}
