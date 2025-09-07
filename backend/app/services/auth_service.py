from datetime import datetime, timedelta, UTC
from typing import Optional
from fastapi import HTTPException, status
from app.services.email_service import email_service
from app.core.security import (
    verify_password, 
    get_password_hash, 
    create_access_token, 
    generate_random_token,
    validate_password
)
from app.config import settings
from app.schemas.auth import UserRegister, UserLogin, AuthResponse
from app.models.user import User
import logging

logger = logging.getLogger(__name__)


class AuthService:
    def __init__(self):
        pass

    async def register_user(self, user_data: UserRegister) -> AuthResponse:
        """Register a new user with email verification"""
        # Check if email already exists
        existing_user = await User.find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "error": {
                        "code": "EMAIL_ALREADY_EXISTS",
                        "message": "An account with this email already exists",
                        "details": {
                            "field": "email",
                            "issue": "Email already exists"
                        }
                    }
                }
            )

        # Validate password
        is_valid, message = validate_password(user_data.password)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": {
                        "code": "VALIDATION_ERROR",
                        "message": message,
                        "details": {
                            "field": "password",
                            "issue": message
                        }
                    }
                }
            )

        # Create user
        password_hash = get_password_hash(user_data.password)
        verification_token = generate_random_token()
        
        user = User(
            email=user_data.email,
            password_hash=password_hash,
            email_verification_token=verification_token,
            is_active=True,
            is_verified=False
        )
        await user.insert()

        # Send verification email
        email_sent = await email_service.send_email_verification(
            to_email=user.email,
            verification_token=verification_token
        )

        if not email_sent:
            logger.warning(f"Failed to send verification email to {user.email}")
            # Still return success - user can request resend later

        return AuthResponse(
            message="Registration successful. Please check your email for verification.",
            user_id=str(user.id)
        )

    async def verify_email(self, token: str) -> AuthResponse:
        """Verify user email with token"""
        user = await User.find_one({"email_verification_token": token})
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": {
                        "code": "INVALID_TOKEN",
                        "message": "Invalid or expired verification token",
                        "details": {
                            "field": "token",
                            "issue": "Token is invalid or has expired"
                        }
                    }
                }
            )

        # Verify user
        user.is_verified = True
        user.email_verification_token = None
        user.updated_at = datetime.now(UTC)
        await user.save()

        # Create access token
        access_token = create_access_token(
            data={"sub": user.email, "user_id": str(user.id)}
        )

        # Send welcome email
        await email_service.send_welcome_email(user.email)

        return AuthResponse(
            message="Email verified successfully",
            user_id=str(user.id),
            access_token=access_token,
            token_type="bearer"
        )

    async def login_user(self, login_data: UserLogin) -> AuthResponse:
        """Authenticate user and return JWT token"""
        user = await User.find_one({"email": login_data.email})
        
        if not user or not verify_password(login_data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "error": {
                        "code": "INVALID_CREDENTIALS",
                        "message": "Incorrect email or password",
                        "details": {
                            "field": "credentials",
                            "issue": "Email or password is incorrect"
                        }
                    }
                }
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": {
                        "code": "ACCOUNT_DISABLED",
                        "message": "Account has been disabled",
                        "details": {
                            "field": "account",
                            "issue": "Account is disabled"
                        }
                    }
                }
            )

        if not user.is_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": {
                        "code": "EMAIL_NOT_VERIFIED",
                        "message": "Please verify your email address before logging in",
                        "details": {
                            "field": "email",
                            "issue": "Email address not verified"
                        }
                    }
                }
            )

        # Create access token
        access_token = create_access_token(
            data={"sub": user.email, "user_id": str(user.id)}
        )

        return AuthResponse(
            message="Login successful",
            user_id=str(user.id),
            access_token=access_token,
            token_type="bearer"
        )

    async def forgot_password(self, email: str) -> AuthResponse:
        """Send password reset email"""
        user = await User.find_one({"email": email})
        
        # Always return success message for security (don't reveal if email exists)
        message = "If email exists, password reset instructions have been sent"
        
        if user and user.is_active and user.is_verified:
            # Generate reset token
            reset_token = generate_random_token()
            
            # Set reset token with expiration
            user.password_reset_token = reset_token
            user.password_reset_expires = datetime.now(UTC) + timedelta(hours=settings.password_reset_expire_hours)
            user.updated_at = datetime.now(UTC)
            await user.save()
            
            # Send reset email
            email_sent = await email_service.send_password_reset(
                to_email=user.email,
                reset_token=reset_token
            )
            
            if not email_sent:
                logger.warning(f"Failed to send password reset email to {user.email}")

        return AuthResponse(message=message)

    async def reset_password(self, token: str, new_password: str) -> AuthResponse:
        """Reset password with token"""
        user = await User.find_one({"password_reset_token": token})
        
        if not user or not user.password_reset_expires:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": {
                        "code": "INVALID_TOKEN",
                        "message": "Invalid or expired reset token",
                        "details": {
                            "field": "token",
                            "issue": "Token is invalid or has expired"
                        }
                    }
                }
            )
        
        # Check if token has expired
        now_utc = datetime.now(UTC)
        reset_expires = user.password_reset_expires
        if reset_expires.tzinfo is None:
            reset_expires = reset_expires.replace(tzinfo=UTC)
        if reset_expires <= now_utc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": {
                        "code": "INVALID_TOKEN",
                        "message": "Invalid or expired reset token",
                        "details": {
                            "field": "token",
                            "issue": "Token is invalid or has expired"
                        }
                    }
                }
            )

        # Validate new password
        is_valid, message = validate_password(new_password)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": {
                        "code": "VALIDATION_ERROR",
                        "message": message,
                        "details": {
                            "field": "new_password",
                            "issue": message
                        }
                    }
                }
            )

        # Reset password
        new_password_hash = get_password_hash(new_password)
        user.password_hash = new_password_hash
        user.password_reset_token = None
        user.password_reset_expires = None
        user.updated_at = datetime.now(UTC)
        await user.save()

        return AuthResponse(message="Password reset successfully")

    async def get_current_user(self, token_payload: dict) -> User:
        """Get current user from JWT token payload"""
        user_id = token_payload.get("user_id")
        email = token_payload.get("sub")
        
        if not user_id or not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )

        user = await User.get(user_id)
        
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )

        return user


# Global auth service instance
auth_service = AuthService()