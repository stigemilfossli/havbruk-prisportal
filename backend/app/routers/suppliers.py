from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from ..database import get_db
from ..dependencies import require_api_key
from ..models import Supplier, Price
from ..schemas import SupplierCreate, SupplierUpdate, SupplierOut

router = APIRouter(prefix="/api/suppliers", tags=["suppliers"])


def _enrich(supplier: Supplier, db: Session) -> SupplierOut:
    price_count = db.query(Price).filter(Price.supplier_id == supplier.id).count()
    out = SupplierOut.model_validate(supplier)
    out.price_count = price_count
    return out


@router.get("", response_model=List[SupplierOut])
def list_suppliers(
    category: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    suppliers = db.query(Supplier).all()
    result = []
    for s in suppliers:
        if category and category not in (s.categories or []):
            continue
        if region and region.lower() not in (s.region or "").lower():
            continue
        result.append(_enrich(s, db))
    return result


@router.get("/{supplier_id}", response_model=SupplierOut)
def get_supplier(supplier_id: int, db: Session = Depends(get_db)):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Leverandør ikke funnet")
    return _enrich(supplier, db)


@router.post("", response_model=SupplierOut, dependencies=[Depends(require_api_key)])
def create_supplier(payload: SupplierCreate, db: Session = Depends(get_db)):
    supplier = Supplier(**payload.model_dump())
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return _enrich(supplier, db)


@router.put("/{supplier_id}", response_model=SupplierOut, dependencies=[Depends(require_api_key)])
def update_supplier(supplier_id: int, payload: SupplierUpdate, db: Session = Depends(get_db)):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Leverandør ikke funnet")
    for key, val in payload.model_dump(exclude_none=True).items():
        setattr(supplier, key, val)
    db.commit()
    db.refresh(supplier)
    return _enrich(supplier, db)


@router.delete("/{supplier_id}", dependencies=[Depends(require_api_key)])
def delete_supplier(supplier_id: int, db: Session = Depends(get_db)):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Leverandør ikke funnet")
    db.delete(supplier)
    db.commit()
    return {"ok": True}
