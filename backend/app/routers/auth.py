from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.services.auth_service import (
    verify_password,
    create_access_token,
    get_user_by_email,
    create_user,
    get_current_user,
)
from app.models import User

router = APIRouter(tags=["auth"])


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    company_name: str


class LoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str | None
    company_name: str | None
    role: str
    plan: str
    subscription_status: str
    current_period_end: datetime | None

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ── Helpers ───────────────────────────────────────────────────────────────────

def _build_user_response(user: User) -> UserResponse:
    sub = user.subscription
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        company_name=user.company_name,
        role=user.role,
        plan=sub.plan if sub else "free",
        subscription_status=sub.status if sub else "active",
        current_period_end=sub.current_period_end if sub else None,
    )


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/register", response_model=TokenResponse)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    if get_user_by_email(db, body.email):
        raise HTTPException(status_code=400, detail="E-post er allerede registrert")
    user = create_user(
        db,
        email=body.email,
        password=body.password,
        full_name=body.full_name,
        company_name=body.company_name,
    )
    token = create_access_token({"sub": user.id})
    return TokenResponse(
        access_token=token,
        user=_build_user_response(user),
    )


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = get_user_by_email(db, body.email)
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Feil e-post eller passord")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Brukerkontoen er deaktivert")
    token = create_access_token({"sub": user.id})
    return TokenResponse(
        access_token=token,
        user=_build_user_response(user),
    )


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return _build_user_response(current_user)


@router.post("/logout")
def logout():
    return {"ok": True, "message": "Logget ut"}
