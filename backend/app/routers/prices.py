from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime
from ..database import get_db
from ..dependencies import require_api_key
from ..models import Price, Product, Supplier
from ..schemas import PriceCreate, PriceOut, PriceScrapeRequest, SupplierOut, ProductOut

router = APIRouter(prefix="/api/prices", tags=["prices"])


def _enrich_price(price: Price) -> PriceOut:
    out = PriceOut.model_validate(price)
    if price.supplier:
        out.supplier = SupplierOut.model_validate(price.supplier)
    if price.product:
        out.product = ProductOut.model_validate(price.product)
    return out


@router.get("", response_model=List[PriceOut])
def list_prices(
    product_id: Optional[int] = Query(None),
    supplier_id: Optional[int] = Query(None),
    source: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Price)
    if product_id:
        query = query.filter(Price.product_id == product_id)
    if supplier_id:
        query = query.filter(Price.supplier_id == supplier_id)
    if source:
        query = query.filter(Price.source == source)
    prices = query.order_by(Price.last_updated.desc()).all()
    return [_enrich_price(p) for p in prices]


@router.post("", response_model=PriceOut, dependencies=[Depends(require_api_key)])
def upsert_price(payload: PriceCreate, db: Session = Depends(get_db)):
    # Check if price already exists for this product+supplier combo
    existing = db.query(Price).filter(
        Price.product_id == payload.product_id,
        Price.supplier_id == payload.supplier_id,
    ).first()

    if existing:
        for key, val in payload.model_dump(exclude_none=True).items():
            setattr(existing, key, val)
        existing.last_updated = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return _enrich_price(existing)

    price = Price(**payload.model_dump())
    db.add(price)
    db.commit()
    db.refresh(price)
    return _enrich_price(price)


@router.delete("/{price_id}", dependencies=[Depends(require_api_key)])
def delete_price(price_id: int, db: Session = Depends(get_db)):
    price = db.query(Price).filter(Price.id == price_id).first()
    if not price:
        raise HTTPException(status_code=404, detail="Pris ikke funnet")
    db.delete(price)
    db.commit()
    return {"ok": True}


@router.post("/scrape", dependencies=[Depends(require_api_key)])
async def trigger_scrape(
    payload: PriceScrapeRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    from ..services.scraper_service import run_scrape_job
    background_tasks.add_task(run_scrape_job, payload.supplier_ids, payload.product_ids)
    return {"message": "Skraping startet i bakgrunnen", "status": "started"}

