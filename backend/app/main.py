from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime, timedelta

from .database import engine, SessionLocal
from . import models
from .seed import seed_database
from .routers import products, suppliers, quotes, prices
from .routers.auth import router as auth_router
from .routers.billing import router as billing_router
from .routers.notes import router as notes_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables and seed if empty
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="Havbruk Prisportal API",
    description="REST API for aquaculture price comparison and quote management",
    version="1.0.0",
    lifespan=lifespan,
)

import os

# Safer CORS configuration
ALLOWED_ORIGINS_STR = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
ALLOWED_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS_STR.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept"],
    expose_headers=["Content-Length", "X-Total-Count"],
    max_age=600,  # 10 minutes cache for preflight requests
)

app.include_router(products.router)
app.include_router(suppliers.router)
app.include_router(quotes.router)
app.include_router(prices.router)
app.include_router(auth_router, prefix="/api/auth")
app.include_router(billing_router, prefix="/api/billing")
app.include_router(notes_router)


@app.get("/")
def root():
    return {"message": "Havbruk Prisportal API", "version": "1.0.0", "docs": "/docs"}


@app.get("/api/stats")
def get_stats(db=None):
    from .database import SessionLocal as SL
    from .models import Supplier, Product, Price
    session = SL()
    try:
        week_ago = datetime.utcnow() - timedelta(days=7)
        return {
            "supplier_count": session.query(Supplier).count(),
            "product_count": session.query(Product).count(),
            "price_count": session.query(Price).count(),
            "recent_updates": session.query(Price).filter(
                Price.last_updated >= week_ago
            ).count(),
        }
    finally:
        session.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
