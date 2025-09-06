import pytest
from unittest.mock import AsyncMock, patch, Mock
from datetime import datetime, timedelta
from app.repositories.user_repository import UserRepository
from app.models.user import User


@pytest.mark.unit
class TestUserRepository:
    """Unit tests for UserRepository."""
    
    @pytest.fixture
    def repository(self):
        return UserRepository()
    
    @pytest.fixture
    def sample_user(self):
        return User(
            email="test@example.com",
            password_hash="hashed_password",
            is_active=True,
            is_verified=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
    
    def test_repository_initialization(self, repository):
        """Test repository initialization."""
        assert repository.model == User
        assert isinstance(repository, UserRepository)
    
    @pytest.mark.asyncio
    async def test_get_by_email(self, repository):
        """Test getting user by email."""
        with patch.object(repository, 'get_by_field', new_callable=AsyncMock) as mock_get:
            mock_user = Mock()
            mock_get.return_value = mock_user
            
            result = await repository.get_by_email("test@example.com")
            
            mock_get.assert_called_once_with("email", "test@example.com")
            assert result == mock_user
    
    @pytest.mark.asyncio
    async def test_get_by_verification_token(self, repository):
        """Test getting user by verification token."""
        with patch.object(repository, 'get_by_field', new_callable=AsyncMock) as mock_get:
            mock_user = Mock()
            mock_get.return_value = mock_user
            
            result = await repository.get_by_verification_token("verification_token")
            
            mock_get.assert_called_once_with("email_verification_token", "verification_token")
            assert result == mock_user
    
    @pytest.mark.asyncio
    async def test_get_by_reset_token_valid(self, repository):
        """Test getting user by reset token with valid expiration."""
        mock_user = Mock()
        mock_user.password_reset_expires = datetime.utcnow() + timedelta(minutes=30)
        
        with patch.object(repository, 'get_by_field', new_callable=AsyncMock) as mock_get:
            mock_get.return_value = mock_user
            
            result = await repository.get_by_reset_token("reset_token")
            
            mock_get.assert_called_once_with("password_reset_token", "reset_token")
            assert result == mock_user
    
    @pytest.mark.asyncio
    async def test_get_by_reset_token_expired(self, repository):
        """Test getting user by reset token with expired token."""
        mock_user = Mock()
        mock_user.password_reset_expires = datetime.utcnow() - timedelta(minutes=30)
        
        with patch.object(repository, 'get_by_field', new_callable=AsyncMock) as mock_get:
            mock_get.return_value = mock_user
            
            result = await repository.get_by_reset_token("reset_token")
            
            mock_get.assert_called_once_with("password_reset_token", "reset_token")
            assert result is None
    
    @pytest.mark.asyncio
    async def test_get_by_reset_token_no_expiration(self, repository):
        """Test getting user by reset token with no expiration set."""
        mock_user = Mock()
        mock_user.password_reset_expires = None
        
        with patch.object(repository, 'get_by_field', new_callable=AsyncMock) as mock_get:
            mock_get.return_value = mock_user
            
            result = await repository.get_by_reset_token("reset_token")
            
            mock_get.assert_called_once_with("password_reset_token", "reset_token")
            assert result is None
    
    @pytest.mark.asyncio
    async def test_get_by_reset_token_not_found(self, repository):
        """Test getting user by reset token when token doesn't exist."""
        with patch.object(repository, 'get_by_field', new_callable=AsyncMock) as mock_get:
            mock_get.return_value = None
            
            result = await repository.get_by_reset_token("invalid_token")
            
            mock_get.assert_called_once_with("password_reset_token", "invalid_token")
            assert result is None
    
    @pytest.mark.asyncio
    async def test_create_user(self, repository):
        """Test creating a new user."""
        with patch.object(repository, 'create', new_callable=AsyncMock) as mock_create:
            mock_user = Mock()
            mock_create.return_value = mock_user
            
            result = await repository.create_user(
                email="test@example.com",
                password_hash="hashed_password",
                verification_token="verification_token"
            )
            
            mock_create.assert_called_once_with(
                email="test@example.com",
                password_hash="hashed_password",
                email_verification_token="verification_token",
                is_active=True,
                is_verified=False
            )
            assert result == mock_user
    
    @pytest.mark.asyncio
    async def test_verify_user(self, repository, sample_user):
        """Test verifying a user."""
        sample_user.save = AsyncMock()
        original_updated_at = sample_user.updated_at
        
        result = await repository.verify_user(sample_user)
        
        assert sample_user.is_verified is True
        assert sample_user.email_verification_token is None
        assert sample_user.updated_at > original_updated_at
        sample_user.save.assert_called_once()
        assert result == sample_user
    
    @pytest.mark.asyncio
    async def test_set_reset_token(self, repository, sample_user):
        """Test setting reset token."""
        sample_user.save = AsyncMock()
        original_updated_at = sample_user.updated_at
        
        result = await repository.set_reset_token(
            sample_user, 
            "reset_token", 
            expires_hours=2
        )
        
        assert sample_user.password_reset_token == "reset_token"
        assert sample_user.password_reset_expires > datetime.utcnow()
        assert sample_user.updated_at > original_updated_at
        sample_user.save.assert_called_once()
        assert result == sample_user
    
    @pytest.mark.asyncio
    async def test_set_reset_token_default_expiry(self, repository, sample_user):
        """Test setting reset token with default expiry."""
        sample_user.save = AsyncMock()
        
        await repository.set_reset_token(sample_user, "reset_token")
        
        # Check that expiry is approximately 1 hour from now
        expected_expiry = datetime.utcnow() + timedelta(hours=1)
        time_diff = abs((sample_user.password_reset_expires - expected_expiry).total_seconds())
        assert time_diff < 5  # Within 5 seconds
    
    @pytest.mark.asyncio
    async def test_reset_password(self, repository, sample_user):
        """Test resetting user password."""
        sample_user.save = AsyncMock()
        sample_user.password_reset_token = "reset_token"
        sample_user.password_reset_expires = datetime.utcnow() + timedelta(hours=1)
        original_updated_at = sample_user.updated_at
        
        result = await repository.reset_password(sample_user, "new_hashed_password")
        
        assert sample_user.password_hash == "new_hashed_password"
        assert sample_user.password_reset_token is None
        assert sample_user.password_reset_expires is None
        assert sample_user.updated_at > original_updated_at
        sample_user.save.assert_called_once()
        assert result == sample_user
    
    @pytest.mark.asyncio
    async def test_email_exists(self, repository):
        """Test checking if email exists."""
        with patch.object(repository, 'exists', new_callable=AsyncMock) as mock_exists:
            mock_exists.return_value = True
            
            result = await repository.email_exists("test@example.com")
            
            mock_exists.assert_called_once_with(email="test@example.com")
            assert result is True
    
    @pytest.mark.asyncio
    async def test_email_exists_false(self, repository):
        """Test checking if email exists when it doesn't."""
        with patch.object(repository, 'exists', new_callable=AsyncMock) as mock_exists:
            mock_exists.return_value = False
            
            result = await repository.email_exists("nonexistent@example.com")
            
            mock_exists.assert_called_once_with(email="nonexistent@example.com")
            assert result is False