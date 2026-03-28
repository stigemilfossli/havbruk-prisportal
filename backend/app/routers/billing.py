import os
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Subscription
from app.services.auth_service import get_current_user
from app.services.stripe_service import (
    PLANS,
    create_customer,
    create_checkout_session,
    create_portal_session,
    handle_webhook,
)

router = APIRouter(tags=["billing"])

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


# ── Schemas ───────────────────────────────────────────────────────────────────

class CheckoutRequest(BaseModel):
    plan: str


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/plans")
def get_plans():
    """Public — returns available subscription plans."""
    return PLANS


@router.post("/checkout")
def create_checkout(
    body: CheckoutRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if body.plan not in PLANS:
        raise HTTPException(status_code=400, detail=f"Ukjent plan: {body.plan}")

    # Create Stripe customer if the user doesn't have one yet
    if not current_user.stripe_customer_id:
        customer_id = create_customer(
            email=current_user.email,
            name=current_user.full_name or current_user.company_name or current_user.email,
        )
        current_user.stripe_customer_id = customer_id
        db.commit()
    else:
        customer_id = current_user.stripe_customer_id

    try:
        url = create_checkout_session(
            customer_id=customer_id,
            plan=body.plan,
            success_url=f"{FRONTEND_URL}/konto?checkout=success",
            cancel_url=f"{FRONTEND_URL}/priser?checkout=canceled",
        )
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))

    return {"url": url}


@router.post("/portal")
def customer_portal(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.stripe_customer_id:
        raise HTTPException(
            status_code=400,
            detail="Ingen Stripe-kunde funnet. Abonner på en plan først.",
        )
    url = create_portal_session(
        customer_id=current_user.stripe_customer_id,
        return_url=f"{FRONTEND_URL}/konto",
    )
    return {"url": url}


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "")

    try:
        event = handle_webhook(payload, sig_header, webhook_secret)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook-feil: {str(e)}")

    event_type = event["type"]
    data = event["data"]["object"]

    if event_type == "checkout.session.completed":
        customer_id = data.get("customer")
        stripe_subscription_id = data.get("subscription")
        # Find the user by stripe_customer_id
        user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
        if user and user.subscription:
            # Determine plan from line items metadata if possible; fall back to keeping existing
            # The plan name is stored in session metadata when we create it; look up price_id
            sub = user.subscription
            sub.stripe_subscription_id = stripe_subscription_id
            sub.status = "active"
            db.commit()

    elif event_type == "customer.subscription.updated":
        stripe_subscription_id = data.get("id")
        customer_id = data.get("customer")
        status = data.get("status")
        cancel_at_period_end = data.get("cancel_at_period_end", False)
        current_period_end_ts = data.get("current_period_end")
        current_period_end = (
            datetime.utcfromtimestamp(current_period_end_ts)
            if current_period_end_ts
            else None
        )
        # Determine plan from price ID
        items = data.get("items", {}).get("data", [])
        price_id = items[0]["price"]["id"] if items else None

        user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
        if user and user.subscription:
            sub = user.subscription
            sub.stripe_subscription_id = stripe_subscription_id
            sub.status = status
            sub.cancel_at_period_end = cancel_at_period_end
            sub.current_period_end = current_period_end
            if price_id:
                sub.stripe_price_id = price_id
                # Map price_id back to plan name
                for plan_key, plan_cfg in PLANS.items():
                    env_key = plan_cfg["price_id_env"]
                    configured_price = os.getenv(env_key, "")
                    if configured_price and configured_price == price_id:
                        sub.plan = plan_key
                        break
            db.commit()

    elif event_type == "customer.subscription.deleted":
        customer_id = data.get("customer")
        user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
        if user and user.subscription:
            user.subscription.plan = "free"
            user.subscription.status = "canceled"
            user.subscription.stripe_subscription_id = None
            db.commit()

    elif event_type == "invoice.payment_failed":
        customer_id = data.get("customer")
        user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
        if user and user.subscription:
            user.subscription.status = "past_due"
            db.commit()

    return {"received": True}
