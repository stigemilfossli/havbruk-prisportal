from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from ..database import get_db
from ..dependencies import require_api_key
from ..dependencies.admin import require_admin
from ..models import PriceHistory
from ..services.price_alert_scheduler import trigger_manual_check, trigger_manual_digest
from ..services.price_alert_service import PriceAlertService

router = APIRouter(prefix="/api/alerts", tags=["alerts"])

@router.get("/recent-changes")
def get_recent_changes(
    hours: int = 24,
    db: Session = Depends(get_db),
    _ = Depends(require_api_key)
):
    """Get recent price changes."""
    changes = PriceAlertService.check_price_changes(db, hours)
    
    # Format response
    result = []
    for product_data in changes:
        product = product_data["product"]
        result.append({
            "product_id": product.id,
            "product_name": product.name,
            "product_category": product.category,
            "change_count": len(product_data["changes"]),
            "changes": product_data["changes"]
        })
    
    return {
        "total_changes": len(changes),
        "hours": hours,
        "changes": result
    }

@router.post("/trigger-check", dependencies=[Depends(require_admin)])
def trigger_price_check():
    """Trigger a manual price check."""
    try:
        trigger_manual_check()
        return {"ok": True, "message": "Manual price check triggered"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/trigger-digest", dependencies=[Depends(require_admin)])
def trigger_daily_digest():
    """Trigger a manual daily digest."""
    try:
        trigger_manual_digest()
        return {"ok": True, "message": "Manual daily digest triggered"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats", dependencies=[Depends(require_admin)])
def get_alert_stats(
    days: int = 7,
    db: Session = Depends(get_db)
):
    """Get alert statistics."""
    since = datetime.utcnow() - timedelta(days=days)
    
    # Count price changes
    change_count = db.query(PriceHistory).filter(
        PriceHistory.recorded_at >= since
    ).count()
    
    # Group by day
    daily_stats = db.query(
        func.date(PriceHistory.recorded_at).label("date"),
        func.count(PriceHistory.id).label("count")
    ).filter(
        PriceHistory.recorded_at >= since
    ).group_by(
        func.date(PriceHistory.recorded_at)
    ).order_by(
        func.date(PriceHistory.recorded_at).desc()
    ).all()
    
    return {
        "period_days": days,
        "total_changes": change_count,
        "daily_stats": [
            {"date": stat.date.isoformat(), "count": stat.count}
            for stat in daily_stats
        ]
    }
