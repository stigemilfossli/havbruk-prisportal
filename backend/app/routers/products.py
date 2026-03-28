from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from ..database import get_db
from ..models import Product, Price, Supplier
from ..schemas import ProductCreate, ProductUpdate, ProductOut, PriceOut

router = APIRouter(prefix="/api/products", tags=["products"])


def _enrich(product: Product, db: Session) -> ProductOut:
    prices = db.query(Price).filter(Price.product_id == product.id).all()
    lowest = min((p.price for p in prices), default=None)
    out = ProductOut.model_validate(product)
    out.price_count = len(prices)
    out.lowest_price = lowest
    return out


@router.get("", response_model=dict)
def list_products(
    q: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Product)
    if q:
        query = query.filter(Product.name.ilike(f"%{q}%"))
    if category:
        query = query.filter(Product.category == category)
    total = query.count()
    products = query.offset(skip).limit(limit).all()
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "items": [_enrich(p, db) for p in products],
    }


@router.get("/categories", response_model=List[str])
def list_categories(db: Session = Depends(get_db)):
    rows = db.query(Product.category).distinct().order_by(Product.category).all()
    return [r[0] for r in rows]


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produkt ikke funnet")
    return _enrich(product, db)


@router.get("/{product_id}/prices", response_model=List[PriceOut])
def get_product_prices(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produkt ikke funnet")
    prices = (
        db.query(Price)
        .filter(Price.product_id == product_id)
        .order_by(Price.price.asc())
        .all()
    )
    result = []
    for p in prices:
        out = PriceOut.model_validate(p)
        if p.supplier:
            from ..schemas import SupplierOut
            out.supplier = SupplierOut.model_validate(p.supplier)
        result.append(out)
    return result


@router.post("", response_model=ProductOut)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)):
    product = Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return _enrich(product, db)


@router.put("/{product_id}", response_model=ProductOut)
def update_product(product_id: int, payload: ProductUpdate, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produkt ikke funnet")
    for key, val in payload.model_dump(exclude_none=True).items():
        setattr(product, key, val)
    db.commit()
    db.refresh(product)
    return _enrich(product, db)


@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produkt ikke funnet")
    db.delete(product)
    db.commit()
    return {"ok": True}
