import pytest
from unittest.mock import AsyncMock, patch, Mock
from fastapi import HTTPException, status
from app.services.auth_service import AuthService
from app.schemas.auth import UserRegister, UserLogin, AuthResponse
from app.models.user import User


@pytest.mark.unit
class TestAuthService:
    """Unit tests for AuthService."""
    
    @pytest.fixture
    def service(self):
        return AuthService()
    
    @pytest.fixture
    def sample_user_data(self):
        return UserRegister(
            email="test@example.com",
            password="ValidPassword123!"
        )
    
    @pytest.fixture
    def sample_user(self):
        from bson import ObjectId
        mock_user = Mock()
        mock_user.id = ObjectId()
        mock_user.email = "test@example.com"
        mock_user.password_hash = "hashed_password"
        mock_user.is_active = True
        mock_user.is_verified = True
        mock_user.save = AsyncMock()
        return mock_user
    
    def test_service_initialization(self, service):
        """Test service initialization."""
        assert isinstance(service, AuthService)
    
    @pytest.mark.asyncio
    async def test_register_user_success(self, service, sample_user_data):
        """Test successful user registration."""
        # Create mock user instance first
        mock_user_instance = Mock()
        mock_user_instance.id = "user123"
        mock_user_instance.email = "test@example.com"
        mock_user_instance.insert = AsyncMock()
        
        with patch('app.services.auth_service.User') as mock_user_class, \
             patch('app.services.auth_service.validate_password') as mock_validate, \
             patch('app.services.auth_service.get_password_hash') as mock_hash, \
             patch('app.services.auth_service.generate_random_token') as mock_token, \
             patch('app.services.auth_service.email_service') as mock_email_service:
            
            # Setup User class mock with find_one as AsyncMock
            mock_user_class.find_one = AsyncMock(return_value=None)  # No existing user
            mock_user_class.return_value = mock_user_instance
            
            # Setup other mocks
            mock_validate.return_value = (True, None)
            mock_hash.return_value = "hashed_password"
            mock_token.return_value = "verification_token"
            mock_email_service.send_email_verification = AsyncMock(return_value=True)
            
            result = await service.register_user(sample_user_data)
            
            # Verify calls
            mock_user_class.find_one.assert_called_once_with({"email": "test@example.com"})
            mock_validate.assert_called_once_with("ValidPassword123!")
            mock_hash.assert_called_once_with("ValidPassword123!")
            mock_user_class.assert_called_once()
            mock_user_instance.insert.assert_called_once()
            
            # Verify result
            assert isinstance(result, AuthResponse)
            assert result.message == "Registration successful. Please check your email for verification."
            assert result.user_id == "user123"
    
    @pytest.mark.asyncio
    async def test_register_user_email_exists(self, service, sample_user_data):
        """Test registration with existing email."""
        existing_user = Mock(email="test@example.com")
        
        with patch('app.models.user.User.find_one', new_callable=AsyncMock) as mock_find:
            mock_find.return_value = existing_user  # User already exists
            
            with pytest.raises(HTTPException) as exc_info:
                await service.register_user(sample_user_data)
            
            assert exc_info.value.status_code == status.HTTP_409_CONFLICT
            assert "EMAIL_ALREADY_EXISTS" in str(exc_info.value.detail)
            mock_find.assert_called_once_with({"email": "test@example.com"})
    
    @pytest.mark.asyncio
    async def test_register_user_invalid_password(self, service, sample_user_data):
        """Test registration with invalid password."""
        with patch('app.models.user.User.find_one', new_callable=AsyncMock) as mock_find, \
             patch('app.services.auth_service.validate_password') as mock_validate:
            
            mock_find.return_value = None  # Email doesn't exist
            mock_validate.return_value = (False, "Password is too weak")
            
            with pytest.raises(HTTPException) as exc_info:
                await service.register_user(sample_user_data)
            
            assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
            assert "VALIDATION_ERROR" in str(exc_info.value.detail)
            mock_find.assert_called_once_with({"email": "test@example.com"})
    
    @pytest.mark.asyncio
    async def test_verify_email_success(self, service):
        """Test successful email verification."""
        mock_user = Mock(id="user123", email="test@example.com")
        mock_user.is_verified = False
        mock_user.email_verification_token = "verification_token"
        mock_user.save = AsyncMock()
        
        with patch('app.models.user.User.find_one', new_callable=AsyncMock) as mock_find, \
             patch('app.services.auth_service.create_access_token') as mock_token, \
             patch('app.services.auth_service.email_service') as mock_email_service:
            
            mock_find.return_value = mock_user
            mock_token.return_value = "access_token"
            mock_email_service.send_welcome_email = AsyncMock()
            
            result = await service.verify_email("verification_token")
            
            mock_find.assert_called_once_with({"email_verification_token": "verification_token"})
            mock_user.save.assert_called_once()
            mock_email_service.send_welcome_email.assert_called_once_with("test@example.com")
            
            # Verify user was marked as verified
            assert mock_user.is_verified is True
            assert mock_user.email_verification_token is None
            
            assert isinstance(result, AuthResponse)
            assert result.message == "Email verified successfully"
            assert result.access_token == "access_token"
    
    @pytest.mark.asyncio
    async def test_verify_email_invalid_token(self, service):
        """Test email verification with invalid token."""
        with patch('app.models.user.User.find_one', new_callable=AsyncMock) as mock_find:
            mock_find.return_value = None
            
            with pytest.raises(HTTPException) as exc_info:
                await service.verify_email("invalid_token")
            
            assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
            assert "INVALID_TOKEN" in str(exc_info.value.detail)
            mock_find.assert_called_once_with({"email_verification_token": "invalid_token"})
    
    @pytest.mark.asyncio
    async def test_login_user_success(self, service, sample_user):
        """Test successful user login."""
        login_data = UserLogin(email="test@example.com", password="correct_password")
        
        with patch('app.models.user.User.find_one', new_callable=AsyncMock) as mock_find, \
             patch('app.services.auth_service.verify_password') as mock_verify, \
             patch('app.services.auth_service.create_access_token') as mock_token:
            
            mock_find.return_value = sample_user
            mock_verify.return_value = True
            mock_token.return_value = "access_token"
            
            result = await service.login_user(login_data)
            
            mock_find.assert_called_once_with({"email": "test@example.com"})
            mock_verify.assert_called_once_with("correct_password", "hashed_password")
            
            assert isinstance(result, AuthResponse)
            assert result.message == "Login successful"
            assert result.access_token == "access_token"
    
    @pytest.mark.asyncio
    async def test_login_user_invalid_credentials(self, service):
        """Test login with invalid credentials."""
        login_data = UserLogin(email="test@example.com", password="wrong_password")
        
        with patch('app.models.user.User.find_one', new_callable=AsyncMock) as mock_find:
            mock_find.return_value = None
            
            with pytest.raises(HTTPException) as exc_info:
                await service.login_user(login_data)
            
            assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
            assert "INVALID_CREDENTIALS" in str(exc_info.value.detail)
            mock_find.assert_called_once_with({"email": "test@example.com"})
    
    @pytest.mark.asyncio
    async def test_login_user_inactive_account(self, service, sample_user):
        """Test login with inactive account."""
        sample_user.is_active = False
        login_data = UserLogin(email="test@example.com", password="correct_password")
        
        with patch('app.models.user.User.find_one', new_callable=AsyncMock) as mock_find, \
             patch('app.services.auth_service.verify_password') as mock_verify:
            
            mock_find.return_value = sample_user
            mock_verify.return_value = True
            
            with pytest.raises(HTTPException) as exc_info:
                await service.login_user(login_data)
            
            assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
            assert "ACCOUNT_DISABLED" in str(exc_info.value.detail)
            mock_find.assert_called_once_with({"email": "test@example.com"})
    
    @pytest.mark.asyncio
    async def test_login_user_unverified_email(self, service, sample_user):
        """Test login with unverified email."""
        sample_user.is_verified = False
        login_data = UserLogin(email="test@example.com", password="correct_password")
        
        with patch('app.models.user.User.find_one', new_callable=AsyncMock) as mock_find, \
             patch('app.services.auth_service.verify_password') as mock_verify:
            
            mock_find.return_value = sample_user
            mock_verify.return_value = True
            
            with pytest.raises(HTTPException) as exc_info:
                await service.login_user(login_data)
            
            assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
            assert "EMAIL_NOT_VERIFIED" in str(exc_info.value.detail)
            mock_find.assert_called_once_with({"email": "test@example.com"})
    
    @pytest.mark.asyncio
    async def test_forgot_password_success(self, service, sample_user):
        """Test successful forgot password request."""
        with patch('app.models.user.User.find_one', new_callable=AsyncMock) as mock_find, \
             patch('app.services.auth_service.generate_random_token') as mock_token, \
             patch('app.services.auth_service.email_service') as mock_email_service:
            
            mock_find.return_value = sample_user
            mock_token.return_value = "reset_token"
            mock_email_service.send_password_reset = AsyncMock(return_value=True)
            
            result = await service.forgot_password("test@example.com")
            
            mock_find.assert_called_once_with({"email": "test@example.com"})
            sample_user.save.assert_called_once()
            assert sample_user.password_reset_token == "reset_token"
            
            assert isinstance(result, AuthResponse)
            assert "password reset instructions have been sent" in result.message
    
    @pytest.mark.asyncio
    async def test_forgot_password_nonexistent_user(self, service):
        """Test forgot password with nonexistent user."""
        with patch('app.models.user.User.find_one', new_callable=AsyncMock) as mock_find:
            mock_find.return_value = None
            
            result = await service.forgot_password("nonexistent@example.com")
            
            mock_find.assert_called_once_with({"email": "nonexistent@example.com"})
            # Should still return success message for security
            assert isinstance(result, AuthResponse)
            assert "password reset instructions have been sent" in result.message
    
    @pytest.mark.asyncio
    async def test_reset_password_success(self, service, sample_user):
        """Test successful password reset."""
        from datetime import datetime, timedelta, UTC
        
        sample_user.password_reset_token = "reset_token"
        sample_user.password_reset_expires = datetime.now(UTC) + timedelta(hours=1)
        
        with patch('app.models.user.User.find_one', new_callable=AsyncMock) as mock_find, \
             patch('app.services.auth_service.validate_password') as mock_validate, \
             patch('app.services.auth_service.get_password_hash') as mock_hash:
            
            mock_find.return_value = sample_user
            mock_validate.return_value = (True, None)
            mock_hash.return_value = "new_hashed_password"
            
            result = await service.reset_password("reset_token", "NewPassword123!")
            
            mock_find.assert_called_once_with({"password_reset_token": "reset_token"})
            mock_validate.assert_called_once_with("NewPassword123!")
            mock_hash.assert_called_once_with("NewPassword123!")
            sample_user.save.assert_called_once()
            
            # Verify password was updated and tokens cleared
            assert sample_user.password_hash == "new_hashed_password"
            assert sample_user.password_reset_token is None
            assert sample_user.password_reset_expires is None
            
            assert isinstance(result, AuthResponse)
            assert result.message == "Password reset successfully"
    
    @pytest.mark.asyncio
    async def test_reset_password_invalid_token(self, service):
        """Test password reset with invalid token."""
        with patch('app.models.user.User.find_one', new_callable=AsyncMock) as mock_find:
            mock_find.return_value = None
            
            with pytest.raises(HTTPException) as exc_info:
                await service.reset_password("invalid_token", "NewPassword123!")
            
            assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
            assert "INVALID_TOKEN" in str(exc_info.value.detail)
            mock_find.assert_called_once_with({"password_reset_token": "invalid_token"})
    
    @pytest.mark.asyncio
    async def test_get_current_user_success(self, service, sample_user):
        """Test getting current user successfully."""
        token_payload = {"user_id": "user123", "sub": "test@example.com"}
        
        with patch('app.models.user.User.get', new_callable=AsyncMock) as mock_get:
            mock_get.return_value = sample_user
            
            result = await service.get_current_user(token_payload)
            
            mock_get.assert_called_once_with("user123")
            assert result == sample_user
    
    @pytest.mark.asyncio
    async def test_get_current_user_invalid_payload(self, service):
        """Test getting current user with invalid payload."""
        token_payload = {"user_id": "user123"}  # Missing sub
        
        with pytest.raises(HTTPException) as exc_info:
            await service.get_current_user(token_payload)
        
        assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
        assert "Invalid token payload" in str(exc_info.value.detail)
    
    @pytest.mark.asyncio
    async def test_get_current_user_not_found(self, service):
        """Test getting current user when user not found."""
        token_payload = {"user_id": "user123", "sub": "test@example.com"}
        
        with patch('app.models.user.User.get', new_callable=AsyncMock) as mock_get:
            mock_get.return_value = None
            
            with pytest.raises(HTTPException) as exc_info:
                await service.get_current_user(token_payload)
            
            assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
            assert "User not found or inactive" in str(exc_info.value.detail)
            mock_get.assert_called_once_with("user123")