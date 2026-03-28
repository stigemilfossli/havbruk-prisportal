from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime


# ── Supplier ──────────────────────────────────────────────────────────────────

class SupplierBase(BaseModel):
    name: str
    website: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    region: Optional[str] = None
    categories: Optional[List[str]] = []
    has_online_shop: bool = False


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(SupplierBase):
    name: Optional[str] = None


class SupplierOut(SupplierBase):
    id: int
    created_at: datetime
    price_count: Optional[int] = 0

    class Config:
        from_attributes = True


# ── Product ───────────────────────────────────────────────────────────────────

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: str
    unit: Optional[str] = "stk"
    part_number: Optional[str] = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(ProductBase):
    name: Optional[str] = None
    category: Optional[str] = None


class ProductOut(ProductBase):
    id: int
    created_at: datetime
    price_count: Optional[int] = 0
    lowest_price: Optional[float] = None

    class Config:
        from_attributes = True


# ── Price ─────────────────────────────────────────────────────────────────────

class PriceBase(BaseModel):
    product_id: int
    supplier_id: int
    price: float
    currency: str = "NOK"
    unit: Optional[str] = None
    source: str = "manual"  # manual, scraped, quoted
    notes: Optional[str] = None


class PriceCreate(PriceBase):
    pass


class PriceOut(PriceBase):
    id: int
    last_updated: datetime
    supplier: Optional[SupplierOut] = None
    product: Optional[ProductOut] = None

    class Config:
        from_attributes = True


class PriceScrapeRequest(BaseModel):
    supplier_ids: Optional[List[int]] = None
    product_ids: Optional[List[int]] = None


# ── Quote Request Item ─────────────────────────────────────────────────────────

class QuoteItemBase(BaseModel):
    product_id: int
    quantity: float = 1.0
    unit: Optional[str] = None
    notes: Optional[str] = None


class QuoteItemOut(QuoteItemBase):
    id: int
    product: Optional[ProductOut] = None

    class Config:
        from_attributes = True


# ── Quote Response Item ────────────────────────────────────────────────────────

class QuoteResponseItemBase(BaseModel):
    product_id: int
    unit_price: Optional[float] = None
    currency: str = "NOK"
    delivery_days: Optional[int] = None
    valid_until: Optional[datetime] = None
    notes: Optional[str] = None


class QuoteResponseItemOut(QuoteResponseItemBase):
    id: int
    product: Optional[ProductOut] = None

    class Config:
        from_attributes = True


# ── Quote Response ─────────────────────────────────────────────────────────────

class QuoteResponseOut(BaseModel):
    id: int
    quote_request_id: int
    supplier_id: int
    status: str
    token: Optional[str] = None
    received_at: Optional[datetime] = None
    notes: Optional[str] = None
    supplier: Optional[SupplierOut] = None
    response_items: List[QuoteResponseItemOut] = []

    class Config:
        from_attributes = True


class QuoteResponseSubmit(BaseModel):
    notes: Optional[str] = None
    items: List[QuoteResponseItemBase]


# ── Quote Request ──────────────────────────────────────────────────────────────

class QuoteRequestCreate(BaseModel):
    requester_name: str
    requester_email: str
    requester_company: Optional[str] = None
    items: List[QuoteItemBase]


class QuoteSendRequest(BaseModel):
    supplier_ids: Optional[List[int]] = None  # None = send to all relevant


class QuoteRequestOut(BaseModel):
    id: int
    requester_name: str
    requester_email: str
    requester_company: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime
    items: List[QuoteItemOut] = []
    responses: List[QuoteResponseOut] = []

    class Config:
        from_attributes = True


# ── Misc ──────────────────────────────────────────────────────────────────────

class StatsOut(BaseModel):
    supplier_count: int
    product_count: int
    price_count: int
    recent_updates: int
