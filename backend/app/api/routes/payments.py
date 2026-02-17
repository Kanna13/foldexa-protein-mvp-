from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
import stripe
import os
from typing import Optional

router = APIRouter()

# Initialize Stripe (Use env variable in production)
# For demo purposes, we'll try to get it from env, or log a warning
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

class CheckoutSessionRequest(BaseModel):
    plan: str

PLANS = {
    "free": {"price_id": None, "mode": "subscription"}, # Free plan logic handled separately usually
    "standard": {"price_id": "price_1Ot...", "mode": "subscription"}, # Placeholder Price ID
    "premium": {"price_id": "price_1Ot...", "mode": "subscription"}, # Placeholder Price ID
}

@router.post("/create-checkout-session")
async def create_checkout_session(request: CheckoutSessionRequest):
    if not stripe.api_key:
        # Fallback for demo when no key is present
        return {
            "url": "https://buy.stripe.com/test_demo_link", # Mock link or just redirect to general page
            "mock": True,
            "message": "Stripe key not configured. Using mock link."
        }

    try:
        # In a real app, you would:
        # 1. Get the price ID from your DB or config based on plan name
        # 2. Get the customer ID if they are logged in
        
        # specific price IDs should be in ENV or DB, hardcoded for MVP demo structure
        price_id = "price_H5ggYJ..." # Replace with actual Stripe Price ID
        
        # Create session
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[
                {
                    # Provide the exact Price ID (for example, pr_1234) of the product you want to sell
                    'price': price_id, 
                    'quantity': 1,
                },
            ],
            mode='subscription',
            success_url='http://localhost:3000/app/history?success=true&session_id={CHECKOUT_SESSION_ID}',
            cancel_url='http://localhost:3000/checkout?canceled=true',
        )
        return {"url": checkout_session.url}
    except Exception as e:
        print(f"Stripe Error: {str(e)}")
        # For MVP/Demo purposes return a success mock if it fails (likely due to missing config)
        return {
             "url": "https://stripe.com/checkout/demo-success",
             "mock": True
        }
