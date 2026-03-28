from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    website = Column(String(300))
    email = Column(String(200))
    phone = Column(String(50))
    region = Column(String(200))
    categories = Column(JSON, default=list)  # list of category strings
    has_online_shop = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    prices = relationship("Price", back_populates="supplier", cascade="all, delete-orphan")
    quote_responses = relationship("QuoteResponse", back_populates="supplier", cascade="all, delete-orphan")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(300), nullable=False, index=True)
    description = Column(Text)
    category = Column(String(100), nullable=False, index=True)
    unit = Column(String(50), default="stk")  # meter, liter, stk, kg, etc.
    part_number = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)

    prices = relationship("Price", back_populates="product", cascade="all, delete-orphan")
    quote_items = relationship("QuoteRequestItem", back_populates="product")
    quote_response_items = relationship("QuoteResponseItem", back_populates="product")


class Price(Base):
    __tablename__ = "prices"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    price = Column(Float, nullable=False)
    currency = Column(String(10), default="NOK")
    unit = Column(String(50))
    source = Column(String(20), default="manual")  # manual, scraped, quoted
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    notes = Column(Text)

    product = relationship("Product", back_populates="prices")
    supplier = relationship("Supplier", back_populates="prices")


class QuoteRequest(Base):
    __tablename__ = "quote_requests"

    id = Column(Integer, primary_key=True, index=True)
    requester_name = Column(String(200), nullable=False)
    requester_email = Column(String(200), nullable=False)
    requester_company = Column(String(200))
    status = Column(String(20), default="draft")  # draft, sent, partial, complete
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    items = relationship("QuoteRequestItem", back_populates="quote_request", cascade="all, delete-orphan")
    responses = relationship("QuoteResponse", back_populates="quote_request", cascade="all, delete-orphan")


class QuoteRequestItem(Base):
    __tablename__ = "quote_request_items"

    id = Column(Integer, primary_key=True, index=True)
    quote_request_id = Column(Integer, ForeignKey("quote_requests.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Float, default=1.0)
    unit = Column(String(50))
    notes = Column(Text)

    quote_request = relationship("QuoteRequest", back_populates="items")
    product = relationship("Product", back_populates="quote_items")


class QuoteResponse(Base):
    __tablename__ = "quote_responses"

    id = Column(Integer, primary_key=True, index=True)
    quote_request_id = Column(Integer, ForeignKey("quote_requests.id"), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    status = Column(String(20), default="pending")  # pending, received, declined
    token = Column(String(100), unique=True, index=True)
    received_at = Column(DateTime)
    notes = Column(Text)

    quote_request = relationship("QuoteRequest", back_populates="responses")
    supplier = relationship("Supplier", back_populates="quote_responses")
    response_items = relationship("QuoteResponseItem", back_populates="quote_response", cascade="all, delete-orphan")


class QuoteResponseItem(Base):
    __tablename__ = "quote_response_items"

    id = Column(Integer, primary_key=True, index=True)
    quote_response_id = Column(Integer, ForeignKey("quote_responses.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    unit_price = Column(Float)
    currency = Column(String(10), default="NOK")
    delivery_days = Column(Integer)
    valid_until = Column(DateTime)
    notes = Column(Text)

    quote_response = relationship("QuoteResponse", back_populates="response_items")
    product = relationship("Product", back_populates="quote_response_items")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    company_name = Column(String)
    full_name = Column(String)
    role = Column(String, default="buyer")  # "buyer", "supplier", "admin"
    stripe_customer_id = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    subscription = relationship("Subscription", back_populates="user", uselist=False)


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    stripe_subscription_id = Column(String, nullable=True)
    stripe_price_id = Column(String, nullable=True)
    plan = Column(String, default="free")  # "free", "basis", "pro", "enterprise"
    status = Column(String, default="active")  # "active", "canceled", "past_due", "trialing"
    current_period_end = Column(DateTime, nullable=True)
    cancel_at_period_end = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user = relationship("User", back_populates="subscription")


class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=True)
    title = Column(String(300), default="")
    content = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
