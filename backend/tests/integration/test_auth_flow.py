import pytest
from datetime import datetime, timedelta
from app.services.auth_service import auth_service
from app.models.user import User
from app.schemas.auth import UserRegister, UserLogin
from app.core.security import hash_password, generate_random_token


@pytest.mark.integration
class TestAuthenticationFlow:
    """Integration tests for complete authentication flow."""

    @pytest.mark.asyncio
    async def test_complete_registration_flow(self, clean_db):
        """Test complete user registration flow."""
        # Register user
        user_data = UserRegister(
            email="integration@example.com",
            password="IntegrationTest123!"
        )
        
        # Mock email service to avoid sending actual emails
        with pytest.MonkeyPatch.context() as m:
            mock_email_sent = True
            m.setattr("app.services.email_service.email_service.send_email_verification", 
                     lambda *args, **kwargs: mock_email_sent)
            
            registration_response = await auth_service.register_user(user_data)
        
        # Verify registration response
        assert registration_response.message == "Registration successful. Please check your email for verification."
        assert registration_response.user_id is not None
        assert registration_response.access_token is None
        
        # Verify user was created in database
        user = await User.find_one({"email": "integration@example.com"})
        assert user is not None
        assert user.is_verified is False
        assert user.email_verification_token is not None
        
        # Verify email with token
        verification_token = user.email_verification_token
        
        # Mock welcome email
        with pytest.MonkeyPatch.context() as m:
            m.setattr("app.services.email_service.email_service.send_welcome_email", 
                     lambda *args, **kwargs: True)
            
            verification_response = await auth_service.verify_email(verification_token)
        
        # Verify email verification response
        assert verification_response.message == "Email verified successfully"
        assert verification_response.access_token is not None
        assert verification_response.token_type == "bearer"
        
        # Verify user is now verified
        user = await User.get(user.id)
        assert user.is_verified is True
        assert user.email_verification_token is None
    
    @pytest.mark.asyncio
    async def test_complete_login_flow(self, test_user):
        """Test complete login flow."""
        login_data = UserLogin(
            email="test@example.com",
            password="testpassword123"
        )
        
        login_response = await auth_service.login_user(login_data)
        
        # Verify login response
        assert login_response.message == "Login successful"
        assert login_response.user_id == str(test_user.id)
        assert login_response.access_token is not None
        assert login_response.token_type == "bearer"
    
    @pytest.mark.asyncio
    async def test_complete_password_reset_flow(self, test_user):
        """Test complete password reset flow."""
        original_password_hash = test_user.password_hash
        
        # Request password reset
        with pytest.MonkeyPatch.context() as m:
            m.setattr("app.services.email_service.email_service.send_password_reset", 
                     lambda *args, **kwargs: True)
            
            reset_request_response = await auth_service.forgot_password(test_user.email)
        
        # Verify reset request response
        assert "password reset instructions have been sent" in reset_request_response.message
        
        # Get updated user with reset token
        user = await User.get(test_user.id)
        assert user.password_reset_token is not None
        assert user.password_reset_expires is not None
        assert user.password_reset_expires > datetime.utcnow()
        
        # Reset password with token
        reset_token = user.password_reset_token
        new_password = "NewStrongPassword123!"
        
        reset_response = await auth_service.reset_password(reset_token, new_password)
        
        # Verify reset response
        assert reset_response.message == "Password reset successfully"
        
        # Verify password was changed
        user = await User.get(test_user.id)
        assert user.password_hash != original_password_hash
        assert user.password_reset_token is None
        assert user.password_reset_expires is None
        
        # Verify user can login with new password
        login_data = UserLogin(email=test_user.email, password=new_password)
        login_response = await auth_service.login_user(login_data)
        assert login_response.access_token is not None
    
    @pytest.mark.asyncio
    async def test_expired_verification_token(self, clean_db):
        """Test behavior with expired verification token."""
        # Create unverified user manually
        user = User(
            email="expired@example.com",
            password_hash=hash_password("testpassword123"),
            is_active=True,
            is_verified=False,
            email_verification_token="expired_token"
        )
        await user.insert()
        
        # Try to verify with token (should work since we don't have expiration logic yet)
        with pytest.MonkeyPatch.context() as m:
            m.setattr("app.services.email_service.email_service.send_welcome_email", 
                     lambda *args, **kwargs: True)
            
            verification_response = await auth_service.verify_email("expired_token")
            assert verification_response.access_token is not None
    
    @pytest.mark.asyncio
    async def test_expired_password_reset_token(self, clean_db):
        """Test behavior with expired password reset token."""
        # Create user with expired reset token
        user = User(
            email="reset@example.com",
            password_hash=hash_password("testpassword123"),
            is_active=True,
            is_verified=True,
            password_reset_token="expired_reset_token",
            password_reset_expires=datetime.utcnow() - timedelta(hours=2)
        )
        await user.insert()
        
        # Try to reset password with expired token
        with pytest.raises(Exception) as exc_info:
            await auth_service.reset_password("expired_reset_token", "NewPassword123!")
        
        # Should get invalid token error
        assert "INVALID_TOKEN" in str(exc_info.value.detail)
    
    @pytest.mark.asyncio
    async def test_login_with_unverified_email(self, unverified_test_user):
        """Test login attempt with unverified email."""
        login_data = UserLogin(
            email="unverified@example.com",
            password="testpassword123"
        )
        
        with pytest.raises(Exception) as exc_info:
            await auth_service.login_user(login_data)
        
        assert "EMAIL_NOT_VERIFIED" in str(exc_info.value.detail)
    
    @pytest.mark.asyncio
    async def test_duplicate_email_registration(self, test_user):
        """Test registration with duplicate email."""
        user_data = UserRegister(
            email=test_user.email,
            password="AnotherPassword123!"
        )
        
        with pytest.raises(Exception) as exc_info:
            await auth_service.register_user(user_data)
        
        assert "EMAIL_ALREADY_EXISTS" in str(exc_info.value.detail)
    
    @pytest.mark.asyncio
    async def test_get_current_user_integration(self, test_user):
        """Test getting current user from valid token payload."""
        token_payload = {
            "user_id": str(test_user.id),
            "sub": test_user.email
        }
        
        current_user = await auth_service.get_current_user(token_payload)
        
        assert current_user.id == test_user.id
        assert current_user.email == test_user.email
        assert current_user.is_active is True
        assert current_user.is_verified is True