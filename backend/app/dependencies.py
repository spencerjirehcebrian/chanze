from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.security import verify_token
from app.services.auth_service import auth_service
from app.models.user import User
from typing import Optional

# Security scheme for JWT Bearer token
security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> User:
    """Get current authenticated user from JWT token"""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": {
                    "code": "MISSING_TOKEN",
                    "message": "Authentication token is required",
                    "details": {
                        "field": "authorization",
                        "issue": "Authorization header is missing"
                    }
                }
            },
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    
    # Verify token
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": {
                    "code": "INVALID_TOKEN",
                    "message": "Invalid or expired token",
                    "details": {
                        "field": "authorization",
                        "issue": "Token is invalid or has expired"
                    }
                }
            },
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user from token payload
    try:
        user = await auth_service.get_current_user(payload)
        return user
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": {
                    "code": "TOKEN_ERROR",
                    "message": "Error processing token",
                    "details": {
                        "field": "authorization",
                        "issue": "Unable to process authentication token"
                    }
                }
            },
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get current active user (additional check)"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": {
                    "code": "INACTIVE_USER",
                    "message": "User account is inactive",
                    "details": {
                        "field": "user",
                        "issue": "User account has been deactivated"
                    }
                }
            }
        )
    return current_user


async def get_current_verified_user(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """Get current verified user (additional check)"""
    if not current_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": {
                    "code": "UNVERIFIED_USER",
                    "message": "User email is not verified",
                    "details": {
                        "field": "user",
                        "issue": "Email address has not been verified"
                    }
                }
            }
        )
    return current_user