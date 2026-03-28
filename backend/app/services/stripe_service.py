import stripe
import os
from datetime import datetime

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")

# Plan config — price IDs filled in via env
PLANS = {
    "basis": {
        "name": "Basis",
        "price_nok": 990,
        "price_id_env": "STRIPE_PRICE_BASIS",
        "features": ["Prissøk", "10 tilbudsforespørsler/mnd", "Leverandørkatalog"],
    },
    "pro": {
        "name": "Pro",
        "price_nok": 2490,
        "price_id_env": "STRIPE_PRICE_PRO",
        "features": [
            "Alt i Basis",
            "Ubegrenset forespørsler",
            "Prisvarslinger",
            "Prishistorikk",
        ],
    },
    "enterprise": {
        "name": "Enterprise",
        "price_nok": 4990,
        "price_id_env": "STRIPE_PRICE_ENTERPRISE",
        "features": [
            "Alt i Pro",
            "API-tilgang",
            "ERP-integrasjon",
            "Dedikert support",
        ],
    },
}


def get_price_id(plan: str) -> str:
    env_key = PLANS[plan]["price_id_env"]
    return os.getenv(env_key, "")


def create_customer(email: str, name: str) -> str:
    customer = stripe.Customer.create(email=email, name=name)
    return customer.id


def create_checkout_session(
    customer_id: str, plan: str, success_url: str, cancel_url: str
) -> str:
    price_id = get_price_id(plan)
    if not price_id:
        raise ValueError(f"Stripe price ID ikke konfigurert for plan: {plan}")
    session = stripe.checkout.Session.create(
        customer=customer_id,
        payment_method_types=["card"],
        line_items=[{"price": price_id, "quantity": 1}],
        mode="subscription",
        success_url=success_url,
        cancel_url=cancel_url,
        locale="nb",
    )
    return session.url


def create_portal_session(customer_id: str, return_url: str) -> str:
    session = stripe.billing_portal.Session.create(
        customer=customer_id,
        return_url=return_url,
    )
    return session.url


def cancel_subscription(stripe_subscription_id: str):
    stripe.Subscription.modify(stripe_subscription_id, cancel_at_period_end=True)


def handle_webhook(payload: bytes, sig_header: str, webhook_secret: str) -> dict:
    event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    return event
