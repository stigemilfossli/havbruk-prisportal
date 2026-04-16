from fastapi import APIRouter, Depends, HTTPException, Response
import re
from pydantic import BaseModel, ConfigDict, field_validator
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.database import get_db
from app.services.auth_service import (
    verify_password,
    create_access_token,
    get_user_by_email,
    create_user,
    get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)
from app.models import User
from app.utils.security import validate_password_strength, validate_email

router = APIRouter(tags=["auth"])


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    company_name: str

    @field_validator('email')
    @classmethod
    def validate_email_format(cls, v):
        if not validate_email(v):
            raise ValueError('Invalid email format')
        return v.lower()

    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        is_valid, error_message = validate_password_strength(v)
        if not is_valid:
            raise ValueError(error_message)
        return v

    @field_validator('full_name')
    @classmethod
    def sanitize_full_name(cls, v):
        v = re.sub(r'[<>"\']', '', v)
        if len(v) > 100:
            raise ValueError('Name too long')
        return v.strip()

    @field_validator('company_name')
    @classmethod
    def sanitize_company_name(cls, v):
        if v:
            v = re.sub(r'[<>"\']', '', v)
            if len(v) > 200:
                raise ValueError('Company name too long')
        return v.strip()


class LoginRequest(BaseModel):
    email: str
    password: str

    @field_validator('email')
    @classmethod
    def validate_email_format(cls, v):
        if not validate_email(v):
            raise ValueError('Invalid email format')
        return v.lower()


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
def register(body: RegisterRequest, response: Response, db: Session = Depends(get_db)):
    # Check if email already exists
    if get_user_by_email(db, body.email):
        raise HTTPException(status_code=400, detail="E-post er allerede registrert")
    
    # Create user
    user = create_user(
        db,
        email=body.email,
        password=body.password,
        full_name=body.full_name,
        company_name=body.company_name,
    )
    
    # Create token
    token = create_access_token({"sub": user.id})
    
    # Set httpOnly cookie
    response.set_cookie(
        key="auth_token",
        value=token,
        httponly=True,
        secure=True,  # Use True in production with HTTPS
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )
    
    return TokenResponse(
        access_token=token,
        user=_build_user_response(user),
    )


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = get_user_by_email(db, body.email)
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Feil e-post eller passord")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Brukerkontoen er deaktivert")
    
    # Create token
    token = create_access_token({"sub": user.id})
    
    # Set httpOnly cookie
    response.set_cookie(
        key="auth_token",
        value=token,
        httponly=True,
        secure=True,  # Use True in production with HTTPS
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )
    
    return TokenResponse(
        access_token=token,
        user=_build_user_response(user),
    )


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return _build_user_response(current_user)


@router.post("/logout")
def logout(response: Response):
    # Clear the cookie
    response.delete_cookie(
        key="auth_token",
        path="/",
    )
    return {"ok": True, "message": "Logget ut"}
