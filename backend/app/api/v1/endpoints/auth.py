from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas.auth import (
    UserRegister, 
    UserLogin, 
    EmailVerification, 
    ForgotPassword, 
    ResetPassword, 
    AuthResponse
)
from app.schemas.user import UserResponse
from app.services.auth_service import auth_service
from app.dependencies import get_current_verified_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserRegister) -> AuthResponse:
    """
    Register a new user with email confirmation
    
    - **email**: User's email address (must be unique)
    - **password**: User's password (minimum 8 characters, must contain uppercase, lowercase, and digit)
    
    Returns a success message and user ID. An email verification link will be sent.
    """
    return await auth_service.register_user(user_data)


@router.post("/verify-email", response_model=AuthResponse)
async def verify_email(verification_data: EmailVerification) -> AuthResponse:
    """
    Verify user email with token from email
    
    - **token**: Email verification token received via email
    
    Returns access token upon successful verification.
    """
    return await auth_service.verify_email(verification_data.token)


@router.post("/login", response_model=AuthResponse)
async def login_user(login_data: UserLogin) -> AuthResponse:
    """
    Authenticate user and return JWT token
    
    - **email**: User's email address
    - **password**: User's password
    
    Returns access token for authenticated requests.
    User must have verified their email address.
    """
    return await auth_service.login_user(login_data)


@router.post("/forgot-password", response_model=AuthResponse)
async def forgot_password(forgot_data: ForgotPassword) -> AuthResponse:
    """
    Request password reset email
    
    - **email**: User's email address
    
    Sends password reset instructions to email if account exists.
    Always returns success message for security.
    """
    return await auth_service.forgot_password(forgot_data.email)


@router.post("/reset-password", response_model=AuthResponse)
async def reset_password(reset_data: ResetPassword) -> AuthResponse:
    """
    Reset password with token from email
    
    - **token**: Password reset token received via email
    - **new_password**: New password (minimum 8 characters, must contain uppercase, lowercase, and digit)
    
    Returns success message upon password reset.
    """
    return await auth_service.reset_password(reset_data.token, reset_data.new_password)


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    current_user: User = Depends(get_current_verified_user)
) -> UserResponse:
    """
    Get current user information
    
    Requires valid JWT token in Authorization header.
    Returns current user's profile information.
    """
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at
    )