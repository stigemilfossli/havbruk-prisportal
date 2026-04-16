from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text, JSON, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
from .models_price_history import PriceHistory


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    website = Column(String(500))
    email = Column(String(200))
    phone = Column(String(50))
    region = Column(String(100))
    categories = Column(JSON)  # List of strings
    has_online_shop = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    prices = relationship("Price", back_populates="supplier", cascade="all, delete-orphan")
    quote_responses = relationship("QuoteResponse", back_populates="supplier")

    # Indexes for common queries
    __table_args__ = (
        Index('idx_supplier_categories', 'categories', postgresql_using='gin'),
        Index('idx_supplier_region', 'region'),
        Index('idx_supplier_has_online_shop', 'has_online_shop'),
    )


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    description = Column(Text)
    category = Column(String(100), nullable=False, index=True)
    unit = Column(String(50), default="stk")
    part_number = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    prices = relationship("Price", back_populates="product", cascade="all, delete-orphan")
    quote_items = relationship("QuoteItem", back_populates="product")
    quote_response_items = relationship("QuoteResponseItem", back_populates="product")

    # Indexes for common queries
    __table_args__ = (
        Index('idx_product_category_name', 'category', 'name'),
        Index('idx_product_part_number', 'part_number'),
    )


class Price(Base):
    __tablename__ = "prices"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False, index=True)
    price = Column(Float, nullable=False)
    currency = Column(String(3), default="NOK")
    unit = Column(String(50))
    source = Column(String(50), default="manual")  # manual, scraped, quoted
    notes = Column(Text)
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    product = relationship("Product", back_populates="prices")
    supplier = relationship("Supplier", back_populates="prices")
    history = relationship("PriceHistory", back_populates="price_record", cascade="all, delete-orphan")

    # Indexes for common queries
    __table_args__ = (
        Index('idx_price_product_supplier', 'product_id', 'supplier_id', unique=True),
        Index('idx_price_last_updated', 'last_updated'),
        Index('idx_price_source', 'source'),
        Index('idx_price_product_price', 'product_id', 'price'),
    )


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(200), unique=True, nullable=False, index=True)
    hashed_password = Column(String(200), nullable=False)
    full_name = Column(String(200))
    company_name = Column(String(200))
    role = Column(String(50), default="user")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    subscription = relationship("Subscription", back_populates="user", uselist=False, cascade="all, delete-orphan")
    quote_requests = relationship("QuoteRequest", back_populates="user")

    # Indexes
    __table_args__ = (
        Index('idx_user_email_lower', func.lower(email), unique=True),
        Index('idx_user_is_active', 'is_active'),
    )


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    plan = Column(String(50), default="free")
    status = Column(String(50), default="active")
    current_period_end = Column(DateTime(timezone=True))
    stripe_customer_id = Column(String(200))
    stripe_subscription_id = Column(String(200))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="subscription")

    # Indexes
    __table_args__ = (
        Index('idx_subscription_plan_status', 'plan', 'status'),
        Index('idx_subscription_current_period_end', 'current_period_end'),
    )


class QuoteRequest(Base):
    __tablename__ = "quote_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), index=True)
    requester_name = Column(String(200), nullable=False)
    requester_email = Column(String(200), nullable=False)
    requester_company = Column(String(200))
    status = Column(String(50), default="draft")  # draft, sent, partial, complete
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="quote_requests")
    items = relationship("QuoteItem", back_populates="quote_request", cascade="all, delete-orphan")
    responses = relationship("QuoteResponse", back_populates="quote_request", cascade="all, delete-orphan")

    # Indexes
    __table_args__ = (
        Index('idx_quote_request_status', 'status'),
        Index('idx_quote_request_created_at', 'created_at'),
        Index('idx_quote_request_user', 'user_id'),
    )


class QuoteItem(Base):
    __tablename__ = "quote_items"

    id = Column(Integer, primary_key=True, index=True)
    quote_request_id = Column(Integer, ForeignKey("quote_requests.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    quantity = Column(Float, default=1.0)
    unit = Column(String(50))
    notes = Column(Text)

    # Relationships
    quote_request = relationship("QuoteRequest", back_populates="items")
    product = relationship("Product", back_populates="quote_items")

    # Indexes
    __table_args__ = (
        Index('idx_quote_item_quote_product', 'quote_request_id', 'product_id'),
    )


class QuoteResponse(Base):
    __tablename__ = "quote_responses"

    id = Column(Integer, primary_key=True, index=True)
    quote_request_id = Column(Integer, ForeignKey("quote_requests.id", ondelete="CASCADE"), nullable=False, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), default="pending")  # pending, received, declined
    token = Column(String(100), unique=True, index=True)
    received_at = Column(DateTime(timezone=True))
    notes = Column(Text)

    # Relationships
    quote_request = relationship("QuoteRequest", back_populates="responses")
    supplier = relationship("Supplier", back_populates="quote_responses")
    response_items = relationship("QuoteResponseItem", back_populates="quote_response", cascade="all, delete-orphan")

    # Indexes
    __table_args__ = (
        Index('idx_quote_response_token', 'token', unique=True),
        Index('idx_quote_response_status', 'status'),
        Index('idx_quote_response_received_at', 'received_at'),
        Index('idx_quote_response_quote_supplier', 'quote_request_id', 'supplier_id', unique=True),
    )


class QuoteResponseItem(Base):
    __tablename__ = "quote_response_items"

    id = Column(Integer, primary_key=True, index=True)
    quote_response_id = Column(Integer, ForeignKey("quote_responses.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    unit_price = Column(Float)
    currency = Column(String(3), default="NOK")
    delivery_days = Column(Integer)
    valid_until = Column(DateTime(timezone=True))
    notes = Column(Text)

    # Relationships
    quote_response = relationship("QuoteResponse", back_populates="response_items")
    product = relationship("Product", back_populates="quote_response_items")

    # Indexes
    __table_args__ = (
        Index('idx_quote_response_item_response_product', 'quote_response_id', 'product_id'),
        Index('idx_quote_response_item_unit_price', 'unit_price'),
    )


class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Indexes
    __table_args__ = (
        Index('idx_note_updated_at', 'updated_at'),
        Index('idx_note_title', 'title'),
    )
