"""Test utility functions and helpers."""

import random
import string
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from httpx import AsyncClient

from app.models.user import User
from app.models.task_template import TaskTemplate
from app.models.task_item import TaskItem
from app.core.security import get_password_hash, create_access_token


def generate_random_string(length: int = 10) -> str:
    """Generate a random string of specified length."""
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))


def generate_random_email() -> str:
    """Generate a random email address for testing."""
    username = generate_random_string(8).lower()
    domain = generate_random_string(5).lower()
    return f"{username}@{domain}.com"


def generate_test_password() -> str:
    """Generate a valid test password."""
    return f"TestPassword{random.randint(100, 999)}!"


async def create_test_user(
    email: Optional[str] = None,
    password: Optional[str] = None,
    is_verified: bool = True,
    is_active: bool = True,
    **kwargs
) -> User:
    """Create a test user with optional parameters."""
    if not email:
        email = generate_random_email()
    if not password:
        password = generate_test_password()
    
    user = User(
        email=email,
        password_hash=get_password_hash(password),
        is_active=is_active,
        is_verified=is_verified,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        **kwargs
    )
    await user.insert()
    return user


async def create_test_task_template(
    user_id: str,
    name: Optional[str] = None,
    **kwargs
) -> TaskTemplate:
    """Create a test task template."""
    if not name:
        name = f"Test Template {generate_random_string(5)}"
    
    template = TaskTemplate(
        name=name,
        user_id=user_id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        **kwargs
    )
    await template.insert()
    return template


async def create_test_task_item(
    user_id: str,
    name: Optional[str] = None,
    template_id: Optional[str] = None,
    **kwargs
) -> TaskItem:
    """Create a test task item."""
    if not name:
        name = f"Test Task {generate_random_string(5)}"
    
    item = TaskItem(
        name=name,
        user_id=user_id,
        template_id=template_id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        **kwargs
    )
    await item.insert()
    return item


def create_auth_headers(user: User) -> Dict[str, str]:
    """Create authorization headers for a user."""
    token = create_access_token(data={"sub": str(user.id)})
    return {"Authorization": f"Bearer {token}"}


async def authenticate_user(client: AsyncClient, email: str, password: str) -> Dict[str, Any]:
    """Authenticate a user and return the response data."""
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password}
    )
    return response.json()


def assert_datetime_close(dt1: datetime, dt2: datetime, delta_seconds: int = 5):
    """Assert that two datetimes are close within delta_seconds."""
    diff = abs((dt1 - dt2).total_seconds())
    assert diff <= delta_seconds, f"Datetimes {dt1} and {dt2} are {diff}s apart, expected <={delta_seconds}s"


def assert_valid_response_structure(data: Dict[str, Any], required_fields: list):
    """Assert that response data has the required structure."""
    for field in required_fields:
        assert field in data, f"Required field '{field}' missing from response"


def assert_error_response(data: Dict[str, Any], expected_code: Optional[str] = None):
    """Assert that the response is a valid error response."""
    assert "error" in data, "Error response should have 'error' field"
    error = data["error"]
    
    required_error_fields = ["code", "message"]
    for field in required_error_fields:
        assert field in error, f"Error response missing '{field}' field"
    
    if expected_code:
        assert error["code"] == expected_code, f"Expected error code '{expected_code}', got '{error['code']}'"


class TestDataFactory:
    """Factory class for creating test data."""
    
    @staticmethod
    def user_registration_data(**overrides) -> Dict[str, Any]:
        """Create valid user registration data."""
        data = {
            "email": generate_random_email(),
            "password": generate_test_password()
        }
        data.update(overrides)
        return data
    
    @staticmethod
    def user_login_data(**overrides) -> Dict[str, Any]:
        """Create valid user login data."""
        data = {
            "email": "test@example.com",
            "password": "testpassword123"
        }
        data.update(overrides)
        return data
    
    @staticmethod
    def task_template_data(**overrides) -> Dict[str, Any]:
        """Create valid task template data."""
        data = {
            "name": f"Test Template {generate_random_string(5)}"
        }
        data.update(overrides)
        return data
    
    @staticmethod
    def task_item_data(**overrides) -> Dict[str, Any]:
        """Create valid task item data."""
        data = {
            "name": f"Test Task {generate_random_string(5)}"
        }
        data.update(overrides)
        return data
    
    @staticmethod
    def invalid_email_data() -> list:
        """Return list of invalid email addresses for testing."""
        return [
            "",
            "invalid",
            "invalid@",
            "@invalid.com",
            "invalid@.com",
            "invalid.com",
            "invalid@com",
            "invalid@invalid@com"
        ]
    
    @staticmethod
    def invalid_password_data() -> list:
        """Return list of invalid passwords for testing."""
        return [
            "",
            "weak",
            "12345678",
            "password",
            "PASSWORD",
            "Password",
            "Pass1",  # Too short
            "passwordwithoutuppercase123",
            "PASSWORDWITHOUTLOWERCASE123",
            "PasswordWithoutNumbers",
        ]


class MockEmailService:
    """Mock email service for testing."""
    
    def __init__(self):
        self.sent_emails = []
        self.should_fail = False
    
    async def send_email_verification(self, to_email: str, verification_token: str) -> bool:
        """Mock email verification sending."""
        if self.should_fail:
            return False
        
        self.sent_emails.append({
            "type": "verification",
            "to": to_email,
            "token": verification_token
        })
        return True
    
    async def send_welcome_email(self, to_email: str) -> bool:
        """Mock welcome email sending."""
        if self.should_fail:
            return False
        
        self.sent_emails.append({
            "type": "welcome",
            "to": to_email
        })
        return True
    
    async def send_password_reset(self, to_email: str, reset_token: str) -> bool:
        """Mock password reset email sending."""
        if self.should_fail:
            return False
        
        self.sent_emails.append({
            "type": "password_reset",
            "to": to_email,
            "token": reset_token
        })
        return True
    
    def get_sent_emails_for(self, email: str, email_type: Optional[str] = None) -> list:
        """Get sent emails for a specific email address and optionally type."""
        emails = [e for e in self.sent_emails if e["to"] == email]
        if email_type:
            emails = [e for e in emails if e["type"] == email_type]
        return emails
    
    def clear_sent_emails(self):
        """Clear the sent emails list."""
        self.sent_emails.clear()


def create_mock_object_id() -> str:
    """Create a mock MongoDB ObjectId string for testing."""
    return ''.join(random.choices('0123456789abcdef', k=24))


def create_expired_datetime(hours_ago: int = 1) -> datetime:
    """Create a datetime that is expired by specified hours."""
    return datetime.utcnow() - timedelta(hours=hours_ago)


def create_future_datetime(hours_ahead: int = 1) -> datetime:
    """Create a datetime that is in the future by specified hours."""
    return datetime.utcnow() + timedelta(hours=hours_ahead)