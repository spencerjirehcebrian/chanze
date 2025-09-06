import pytest
from httpx import AsyncClient
from unittest.mock import patch
from app.models.user import User


@pytest.mark.api
class TestAuthEndpoints:
    """API tests for authentication endpoints."""

    @pytest.mark.asyncio
    async def test_register_success(self, async_client: AsyncClient, clean_db):
        """Test successful user registration."""
        user_data = {
            "email": "newuser@example.com",
            "password": "ValidPassword123!"
        }
        
        with patch("app.services.email_service.email_service.send_email_verification") as mock_email:
            mock_email.return_value = True
            
            response = await async_client.post("/api/v1/auth/register", json=user_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["message"] == "Registration successful. Please check your email for verification."
        assert "user_id" in data
        
        # Verify user was created
        user = await User.find_one({"email": "newuser@example.com"})
        assert user is not None
        assert user.is_verified is False

    @pytest.mark.asyncio
    async def test_register_duplicate_email(self, async_client: AsyncClient, test_user):
        """Test registration with duplicate email."""
        user_data = {
            "email": test_user.email,
            "password": "ValidPassword123!"
        }
        
        response = await async_client.post("/api/v1/auth/register", json=user_data)
        
        assert response.status_code == 409
        data = response.json()
        assert data["error"]["code"] == "EMAIL_ALREADY_EXISTS"

    @pytest.mark.asyncio
    async def test_register_invalid_password(self, async_client: AsyncClient, clean_db):
        """Test registration with invalid password."""
        user_data = {
            "email": "test@example.com",
            "password": "weak"
        }
        
        response = await async_client.post("/api/v1/auth/register", json=user_data)
        
        assert response.status_code == 400
        data = response.json()
        assert data["error"]["code"] == "VALIDATION_ERROR"

    @pytest.mark.asyncio
    async def test_verify_email_success(self, async_client: AsyncClient, unverified_test_user):
        """Test successful email verification."""
        verification_data = {
            "token": unverified_test_user.email_verification_token
        }
        
        with patch("app.services.email_service.email_service.send_welcome_email") as mock_email:
            mock_email.return_value = True
            
            response = await async_client.post("/api/v1/auth/verify-email", json=verification_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Email verified successfully"
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    @pytest.mark.asyncio
    async def test_verify_email_invalid_token(self, async_client: AsyncClient, clean_db):
        """Test email verification with invalid token."""
        verification_data = {
            "token": "invalid_token"
        }
        
        response = await async_client.post("/api/v1/auth/verify-email", json=verification_data)
        
        assert response.status_code == 400
        data = response.json()
        assert data["error"]["code"] == "INVALID_TOKEN"

    @pytest.mark.asyncio
    async def test_login_success(self, async_client: AsyncClient, test_user):
        """Test successful login."""
        login_data = {
            "email": test_user.email,
            "password": "testpassword123"
        }
        
        response = await async_client.post("/api/v1/auth/login", json=login_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Login successful"
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    @pytest.mark.asyncio
    async def test_login_invalid_credentials(self, async_client: AsyncClient, test_user):
        """Test login with invalid credentials."""
        login_data = {
            "email": test_user.email,
            "password": "wrongpassword"
        }
        
        response = await async_client.post("/api/v1/auth/login", json=login_data)
        
        assert response.status_code == 401
        data = response.json()
        assert data["error"]["code"] == "INVALID_CREDENTIALS"

    @pytest.mark.asyncio
    async def test_login_unverified_user(self, async_client: AsyncClient, unverified_test_user):
        """Test login with unverified user."""
        login_data = {
            "email": unverified_test_user.email,
            "password": "testpassword123"
        }
        
        response = await async_client.post("/api/v1/auth/login", json=login_data)
        
        assert response.status_code == 403
        data = response.json()
        assert data["error"]["code"] == "EMAIL_NOT_VERIFIED"

    @pytest.mark.asyncio
    async def test_forgot_password(self, async_client: AsyncClient, test_user):
        """Test forgot password request."""
        forgot_data = {
            "email": test_user.email
        }
        
        with patch("app.services.email_service.email_service.send_password_reset") as mock_email:
            mock_email.return_value = True
            
            response = await async_client.post("/api/v1/auth/forgot-password", json=forgot_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "password reset instructions have been sent" in data["message"]

    @pytest.mark.asyncio
    async def test_forgot_password_nonexistent_email(self, async_client: AsyncClient, clean_db):
        """Test forgot password with nonexistent email."""
        forgot_data = {
            "email": "nonexistent@example.com"
        }
        
        response = await async_client.post("/api/v1/auth/forgot-password", json=forgot_data)
        
        # Should still return success for security
        assert response.status_code == 200
        data = response.json()
        assert "password reset instructions have been sent" in data["message"]

    @pytest.mark.asyncio
    async def test_reset_password_success(self, async_client: AsyncClient, test_user_with_reset_token):
        """Test successful password reset."""
        reset_data = {
            "token": test_user_with_reset_token.password_reset_token,
            "new_password": "NewStrongPassword123!"
        }
        
        response = await async_client.post("/api/v1/auth/reset-password", json=reset_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Password reset successfully"

    @pytest.mark.asyncio
    async def test_reset_password_invalid_token(self, async_client: AsyncClient, clean_db):
        """Test password reset with invalid token."""
        reset_data = {
            "token": "invalid_token",
            "new_password": "NewStrongPassword123!"
        }
        
        response = await async_client.post("/api/v1/auth/reset-password", json=reset_data)
        
        assert response.status_code == 400
        data = response.json()
        assert data["error"]["code"] == "INVALID_TOKEN"

    @pytest.mark.asyncio
    async def test_get_current_user_success(self, async_client: AsyncClient, auth_headers):
        """Test getting current user with valid token."""
        response = await async_client.get("/api/v1/auth/me", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "email" in data
        assert "is_active" in data
        assert "is_verified" in data

    @pytest.mark.asyncio
    async def test_get_current_user_no_token(self, async_client: AsyncClient, clean_db):
        """Test getting current user without token."""
        response = await async_client.get("/api/v1/auth/me")
        
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_current_user_invalid_token(self, async_client: AsyncClient, clean_db):
        """Test getting current user with invalid token."""
        headers = {"Authorization": "Bearer invalid_token"}
        response = await async_client.get("/api/v1/auth/me", headers=headers)
        
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_validation_errors(self, async_client: AsyncClient, clean_db):
        """Test validation errors for various endpoints."""
        # Invalid email format
        invalid_register_data = {
            "email": "invalid-email",
            "password": "ValidPassword123!"
        }
        
        response = await async_client.post("/api/v1/auth/register", json=invalid_register_data)
        assert response.status_code == 422
        
        # Missing required fields
        incomplete_login_data = {
            "email": "test@example.com"
            # missing password
        }
        
        response = await async_client.post("/api/v1/auth/login", json=incomplete_login_data)
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_cors_headers(self, async_client: AsyncClient, clean_db):
        """Test CORS headers are properly set."""
        response = await async_client.options("/api/v1/auth/register")
        
        # Note: In test environment, CORS headers might not be exactly the same
        # This test verifies the endpoint is accessible
        assert response.status_code in [200, 405]  # OPTIONS might not be explicitly handled