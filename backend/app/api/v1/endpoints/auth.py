"""Authentication & Account Management API Endpoints."""

from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, Field

from app.core.logging import get_logger
from app.services.auth_service import AuthTokenResponse, UserResponse, auth_service

router = APIRouter(prefix="/auth", tags=["Authentication & User Accounts"])
logger = get_logger("scamshield.api.auth")


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6, max_length=128)
    email: Optional[str] = Field(None, max_length=100)


class LoginRequest(BaseModel):
    username_or_email: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


def get_current_user(authorization: Optional[str] = Header(None)) -> Optional[UserResponse]:
    """Extract and validate bearer session token from Authorization header."""
    if not authorization:
        return None

    parts = authorization.split(" ")
    if len(parts) == 2 and parts[0].lower() == "bearer":
        token = parts[1]
        return auth_service.get_user_by_token(token)
    return None


@router.post("/register", response_model=AuthTokenResponse, status_code=status.HTTP_201_CREATED)
def register(request: RegisterRequest) -> AuthTokenResponse:
    """Create a new user account to sync and protect evidence across devices."""
    try:
        token_bundle = auth_service.register(
            username=request.username,
            password=request.password,
            email=request.email
        )
        logger.info(f"User registered successfully: username='{request.username}', id={token_bundle.user.id}")
        return token_bundle
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as exc:
        logger.error(f"Registration failed: {str(exc)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while creating your account."
        )


@router.post("/login", response_model=AuthTokenResponse, status_code=status.HTTP_200_OK)
def login(request: LoginRequest) -> AuthTokenResponse:
    """Log in to access your synchronized private Evidence Locker."""
    try:
        token_bundle = auth_service.login(
            username_or_email=request.username_or_email,
            password=request.password
        )
        logger.info(f"User logged in: username='{token_bundle.user.username}', id={token_bundle.user.id}")
        return token_bundle
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(ve))
    except Exception as exc:
        logger.error(f"Login failed: {str(exc)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during authentication."
        )


@router.get("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
def get_profile(user: Optional[UserResponse] = Depends(get_current_user)) -> UserResponse:
    """Retrieve the currently authenticated user's profile."""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. Sign in to access synchronized account features."
        )
    return user


@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(authorization: Optional[str] = Header(None)):
    """Log out and invalidate the active session token."""
    if authorization:
        parts = authorization.split(" ")
        if len(parts) == 2 and parts[0].lower() == "bearer":
            auth_service.logout(parts[1])
    return {"success": True, "message": "Successfully signed out."}
