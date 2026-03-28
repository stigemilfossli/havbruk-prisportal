from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from app.models import User, Subscription
import os

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-in-prod")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)


def hash_password(password):
    return pwd_context.hash(password)


def create_access_token(data: dict):
    to_encode = data.copy()
    to_encode["exp"] = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None


def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()


def create_user(db: Session, email: str, password: str, full_name: str, company_name: str):
    user = User(
        email=email,
        hashed_password=hash_password(password),
        full_name=full_name,
        company_name=company_name,
    )
    db.add(user)
    db.flush()
    # Create free subscription
    sub = Subscription(user_id=user.id, plan="free", status="active")
    db.add(sub)
    db.commit()
    db.refresh(user)
    return user


# FastAPI dependency
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.database import get_db

security = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    if not credentials:
        raise HTTPException(status_code=401, detail="Ikke innlogget")
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Ugyldig token")
    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Bruker ikke funnet")
    return user


def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    if not credentials:
        return None
    payload = decode_token(credentials.credentials)
    if not payload:
        return None
    return db.query(User).filter(User.id == payload.get("sub")).first()


def require_plan(plans: list):
    def checker(user: User = Depends(get_current_user)):
        if user.subscription and user.subscription.plan in plans:
            return user
        raise HTTPException(
            status_code=403,
            detail=f"Krever abonnement: {', '.join(plans)}",
        )
    return checker
