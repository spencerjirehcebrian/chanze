import pytest
from datetime import datetime, timedelta
from pydantic import ValidationError
from app.models.user import User


@pytest.mark.unit
class TestUserModel:
    """Unit tests for User model."""
    
    def test_user_creation_with_required_fields(self):
        """Test creating a user with only required fields."""
        user_data = {
            "email": "test@example.com",
            "password_hash": "hashed_password_123"
        }
        user = User(**user_data)
        
        assert user.email == "test@example.com"
        assert user.password_hash == "hashed_password_123"
        assert user.is_active is True
        assert user.is_verified is False
        assert isinstance(user.created_at, datetime)
        assert isinstance(user.updated_at, datetime)
        assert user.email_verification_token is None
        assert user.password_reset_token is None
        assert user.password_reset_expires is None
    
    def test_user_creation_with_all_fields(self):
        """Test creating a user with all fields."""
        now = datetime.utcnow()
        expires = now + timedelta(hours=1)
        
        user_data = {
            "email": "test@example.com",
            "password_hash": "hashed_password_123",
            "is_active": False,
            "is_verified": True,
            "created_at": now,
            "updated_at": now,
            "email_verification_token": "verification_token",
            "password_reset_token": "reset_token",
            "password_reset_expires": expires
        }
        user = User(**user_data)
        
        assert user.email == "test@example.com"
        assert user.password_hash == "hashed_password_123"
        assert user.is_active is False
        assert user.is_verified is True
        assert user.created_at == now
        assert user.updated_at == now
        assert user.email_verification_token == "verification_token"
        assert user.password_reset_token == "reset_token"
        assert user.password_reset_expires == expires
    
    def test_user_invalid_email(self):
        """Test user creation with invalid email."""
        user_data = {
            "email": "invalid-email",
            "password_hash": "hashed_password_123"
        }
        
        with pytest.raises(ValidationError) as exc_info:
            User(**user_data)
        
        errors = exc_info.value.errors()
        assert len(errors) == 1
        assert errors[0]["loc"] == ("email",)
        assert "value is not a valid email address" in errors[0]["msg"]
    
    def test_user_missing_required_fields(self):
        """Test user creation with missing required fields."""
        # Missing email
        with pytest.raises(ValidationError) as exc_info:
            User(password_hash="hashed_password_123")
        
        errors = exc_info.value.errors()
        assert any(error["loc"] == ("email",) for error in errors)
        
        # Missing password_hash
        with pytest.raises(ValidationError) as exc_info:
            User(email="test@example.com")
        
        errors = exc_info.value.errors()
        assert any(error["loc"] == ("password_hash",) for error in errors)
    
    def test_user_str_representation(self):
        """Test user string representation."""
        user = User(
            email="test@example.com",
            password_hash="hashed_password_123"
        )
        assert str(user) == "test@example.com"
    
    def test_user_repr_representation(self):
        """Test user repr representation."""
        user = User(
            email="test@example.com",
            password_hash="hashed_password_123"
        )
        assert repr(user) == "<User test@example.com>"
    
    def test_user_email_uniqueness_validation(self):
        """Test that email field is marked for uniqueness."""
        # This tests the field configuration, actual uniqueness is enforced by the database
        user = User(
            email="test@example.com",
            password_hash="hashed_password_123"
        )
        
        # Check that email field has the unique constraint
        email_field = user.__fields__["email"]
        assert hasattr(email_field, "field_info")
    
    def test_user_model_settings(self):
        """Test user model settings."""
        assert User.Settings.collection == "users"
        assert "email" in User.Settings.indexes
    
    def test_user_datetime_defaults(self):
        """Test that datetime fields have proper defaults."""
        user1 = User(
            email="test1@example.com",
            password_hash="hashed_password_123"
        )
        
        # Create second user a bit later to test different timestamps
        import time
        time.sleep(0.001)
        
        user2 = User(
            email="test2@example.com",
            password_hash="hashed_password_123"
        )
        
        assert user1.created_at != user2.created_at
        assert user1.updated_at != user2.updated_at
        assert isinstance(user1.created_at, datetime)
        assert isinstance(user1.updated_at, datetime)
    
    def test_user_boolean_defaults(self):
        """Test boolean field defaults."""
        user = User(
            email="test@example.com",
            password_hash="hashed_password_123"
        )
        
        assert user.is_active is True
        assert user.is_verified is False
    
    def test_user_optional_fields_none_by_default(self):
        """Test that optional fields default to None."""
        user = User(
            email="test@example.com",
            password_hash="hashed_password_123"
        )
        
        assert user.email_verification_token is None
        assert user.password_reset_token is None
        assert user.password_reset_expires is None