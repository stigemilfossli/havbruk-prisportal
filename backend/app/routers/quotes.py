from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import secrets
from ..database import get_db
from ..models import (
    QuoteRequest, QuoteRequestItem, QuoteResponse, QuoteResponseItem,
    Supplier, Product
)
from ..schemas import (
    QuoteRequestCreate, QuoteRequestOut, QuoteSendRequest,
    QuoteResponseSubmit, QuoteResponseOut
)

router = APIRouter(prefix="/api/quotes", tags=["quotes"])


def _build_quote_out(quote: QuoteRequest) -> QuoteRequestOut:
    return QuoteRequestOut.model_validate(quote)


@router.get("", response_model=List[QuoteRequestOut])
def list_quotes(db: Session = Depends(get_db)):
    quotes = db.query(QuoteRequest).order_by(QuoteRequest.created_at.desc()).all()
    return [_build_quote_out(q) for q in quotes]


@router.post("", response_model=QuoteRequestOut)
def create_quote(payload: QuoteRequestCreate, db: Session = Depends(get_db)):
    quote = QuoteRequest(
        requester_name=payload.requester_name,
        requester_email=payload.requester_email,
        requester_company=payload.requester_company,
        status="draft",
    )
    db.add(quote)
    db.flush()

    for item_data in payload.items:
        item = QuoteRequestItem(
            quote_request_id=quote.id,
            product_id=item_data.product_id,
            quantity=item_data.quantity,
            unit=item_data.unit,
            notes=item_data.notes,
        )
        db.add(item)

    db.commit()
    db.refresh(quote)
    return _build_quote_out(quote)


@router.get("/{quote_id}", response_model=QuoteRequestOut)
def get_quote(quote_id: int, db: Session = Depends(get_db)):
    quote = db.query(QuoteRequest).filter(QuoteRequest.id == quote_id).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Forespørsel ikke funnet")
    return _build_quote_out(quote)


@router.post("/{quote_id}/send")
async def send_quote(
    quote_id: int,
    payload: QuoteSendRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    quote = db.query(QuoteRequest).filter(QuoteRequest.id == quote_id).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Forespørsel ikke funnet")

    # Determine which suppliers to contact
    if payload.supplier_ids:
        suppliers = db.query(Supplier).filter(Supplier.id.in_(payload.supplier_ids)).all()
    else:
        # Find suppliers relevant to the product categories in the quote
        product_ids = [item.product_id for item in quote.items]
        products = db.query(Product).filter(Product.id.in_(product_ids)).all()
        categories = list({p.category for p in products})
        all_suppliers = db.query(Supplier).all()
        suppliers = [
            s for s in all_suppliers
            if any(cat in (s.categories or []) for cat in categories)
        ]

    sent_to = []
    for supplier in suppliers:
        # Create a QuoteResponse record with a unique token
        token = secrets.token_urlsafe(32)
        response = QuoteResponse(
            quote_request_id=quote.id,
            supplier_id=supplier.id,
            status="pending",
            token=token,
        )
        db.add(response)
        sent_to.append(supplier.name)

    quote.status = "sent"
    quote.updated_at = datetime.utcnow()
    db.commit()

    # Send emails in background
    from ..services.email_service import send_rfq_email
    db.refresh(quote)
    for response in quote.responses:
        if response.status == "pending":
            background_tasks.add_task(
                send_rfq_email, quote, response.supplier, quote.items, response.token
            )

    return {"message": f"Forespørsel sendt til {len(sent_to)} leverandører", "suppliers": sent_to}


@router.post("/{quote_id}/response", response_model=QuoteResponseOut)
def submit_response_manual(
    quote_id: int,
    supplier_id: int,
    payload: QuoteResponseSubmit,
    db: Session = Depends(get_db),
):
    quote = db.query(QuoteRequest).filter(QuoteRequest.id == quote_id).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Forespørsel ikke funnet")

    response = db.query(QuoteResponse).filter(
        QuoteResponse.quote_request_id == quote_id,
        QuoteResponse.supplier_id == supplier_id,
    ).first()

    if not response:
        raise HTTPException(status_code=404, detail="Leverandørsvar ikke funnet")

    response.status = "received"
    response.received_at = datetime.utcnow()
    response.notes = payload.notes

    for item_data in payload.items:
        resp_item = QuoteResponseItem(
            quote_response_id=response.id,
            product_id=item_data.product_id,
            unit_price=item_data.unit_price,
            currency=item_data.currency,
            delivery_days=item_data.delivery_days,
            valid_until=item_data.valid_until,
            notes=item_data.notes,
        )
        db.add(resp_item)

    # Update quote status
    all_responses = db.query(QuoteResponse).filter(
        QuoteResponse.quote_request_id == quote_id
    ).all()
    received = sum(1 for r in all_responses if r.status == "received")
    total = len(all_responses)
    if received == total and total > 0:
        quote.status = "complete"
    elif received > 0:
        quote.status = "partial"
    quote.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(response)
    return QuoteResponseOut.model_validate(response)


@router.get("/respond/{token}")
def get_supplier_rfq(token: str, db: Session = Depends(get_db)):
    response = db.query(QuoteResponse).filter(QuoteResponse.token == token).first()
    if not response:
        raise HTTPException(status_code=404, detail="Ugyldig eller utløpt lenke")
    quote = response.quote_request
    supplier = response.supplier
    items = quote.items
    return {
        "quote_id": quote.id,
        "response_id": response.id,
        "requester_company": quote.requester_company,
        "supplier_name": supplier.name,
        "status": response.status,
        "items": [
            {
                "product_id": item.product_id,
                "product_name": item.product.name,
                "quantity": item.quantity,
                "unit": item.unit or item.product.unit,
                "notes": item.notes,
            }
            for item in items
        ],
    }


@router.post("/respond/{token}", response_model=QuoteResponseOut)
def submit_supplier_response(
    token: str,
    payload: QuoteResponseSubmit,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    response = db.query(QuoteResponse).filter(QuoteResponse.token == token).first()
    if not response:
        raise HTTPException(status_code=404, detail="Ugyldig eller utløpt lenke")

    response.status = "received"
    response.received_at = datetime.utcnow()
    response.notes = payload.notes

    for item_data in payload.items:
        resp_item = QuoteResponseItem(
            quote_response_id=response.id,
            product_id=item_data.product_id,
            unit_price=item_data.unit_price,
            currency=item_data.currency,
            delivery_days=item_data.delivery_days,
            valid_until=item_data.valid_until,
            notes=item_data.notes,
        )
        db.add(resp_item)

    quote = response.quote_request
    all_responses = db.query(QuoteResponse).filter(
        QuoteResponse.quote_request_id == quote.id
    ).all()
    received = sum(1 for r in all_responses if r.status == "received")
    total = len(all_responses)
    if received == total and total > 0:
        quote.status = "complete"
    elif received > 0:
        quote.status = "partial"
    quote.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(response)

    from ..services.email_service import send_quote_received_notification
    background_tasks.add_task(
        send_quote_received_notification, quote, response.supplier
    )

    return QuoteResponseOut.model_validate(response)
