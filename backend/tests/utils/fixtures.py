"""Additional test fixtures and utilities."""

import pytest
import pytest_asyncio
from datetime import datetime, timedelta
from typing import List

from app.models.user import User
from app.models.task_template import TaskTemplate
from app.models.task_item import TaskItem
from app.core.security import hash_password
from tests.utils.helpers import (
    generate_random_email, 
    generate_test_password,
    create_auth_headers
)


@pytest_asyncio.fixture
async def users_factory(clean_db):
    """Factory fixture for creating multiple users."""
    created_users = []
    
    async def _create_users(count: int = 1, verified: bool = True, active: bool = True) -> List[User]:
        users = []
        for i in range(count):
            user = User(
                email=generate_random_email(),
                password_hash=hash_password(generate_test_password()),
                is_active=active,
                is_verified=verified,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            await user.insert()
            users.append(user)
            created_users.append(user)
        return users
    
    yield _create_users
    
    # Cleanup
    for user in created_users:
        try:
            await user.delete()
        except:
            pass  # User might already be deleted


@pytest_asyncio.fixture
async def templates_factory(clean_db):
    """Factory fixture for creating multiple task templates."""
    created_templates = []
    
    async def _create_templates(user_id: str, count: int = 1, name_prefix: str = "Template") -> List[TaskTemplate]:
        templates = []
        for i in range(count):
            template = TaskTemplate(
                name=f"{name_prefix} {i}",
                user_id=user_id,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            await template.insert()
            templates.append(template)
            created_templates.append(template)
        return templates
    
    yield _create_templates
    
    # Cleanup
    for template in created_templates:
        try:
            await template.delete()
        except:
            pass  # Template might already be deleted


@pytest_asyncio.fixture
async def items_factory(clean_db):
    """Factory fixture for creating multiple task items."""
    created_items = []
    
    async def _create_items(
        user_id: str, 
        count: int = 1, 
        template_id: str = None,
        name_prefix: str = "Task"
    ) -> List[TaskItem]:
        items = []
        for i in range(count):
            item = TaskItem(
                name=f"{name_prefix} {i}",
                user_id=user_id,
                template_id=template_id,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            await item.insert()
            items.append(item)
            created_items.append(item)
        return items
    
    yield _create_items
    
    # Cleanup
    for item in created_items:
        try:
            await item.delete()
        except:
            pass  # Item might already be deleted


@pytest_asyncio.fixture
async def user_with_expired_tokens(clean_db):
    """Create a user with expired tokens for testing."""
    user = User(
        email=generate_random_email(),
        password_hash=hash_password(generate_test_password()),
        is_active=True,
        is_verified=False,
        email_verification_token="expired_verification_token",
        password_reset_token="expired_reset_token",
        password_reset_expires=datetime.utcnow() - timedelta(hours=2),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    await user.insert()
    yield user
    try:
        await user.delete()
    except:
        pass


@pytest_asyncio.fixture
async def user_with_valid_reset_token(clean_db):
    """Create a user with valid password reset token."""
    user = User(
        email=generate_random_email(),
        password_hash=hash_password(generate_test_password()),
        is_active=True,
        is_verified=True,
        password_reset_token="valid_reset_token",
        password_reset_expires=datetime.utcnow() + timedelta(hours=1),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    await user.insert()
    yield user
    try:
        await user.delete()
    except:
        pass


@pytest.fixture
def auth_headers_factory():
    """Factory for creating auth headers for different users."""
    def _create_auth_headers(user: User) -> dict:
        return create_auth_headers(user)
    return _create_auth_headers


@pytest_asyncio.fixture
async def complete_user_setup(clean_db):
    """Create a complete user setup with templates and items."""
    # Create user
    user = User(
        email=generate_random_email(),
        password_hash=hash_password(generate_test_password()),
        is_active=True,
        is_verified=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    await user.insert()
    
    # Create templates
    templates = []
    for i in range(3):
        template = TaskTemplate(
            name=f"Template {i}",
            user_id=str(user.id),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        await template.insert()
        templates.append(template)
    
    # Create items (some with templates, some without)
    items = []
    for i in range(5):
        template_id = str(templates[i % len(templates)].id) if i < 3 else None
        item = TaskItem(
            name=f"Task {i}",
            user_id=str(user.id),
            template_id=template_id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        await item.insert()
        items.append(item)
    
    yield {
        "user": user,
        "templates": templates,
        "items": items,
        "auth_headers": create_auth_headers(user)
    }
    
    # Cleanup
    try:
        for item in items:
            await item.delete()
        for template in templates:
            await template.delete()
        await user.delete()
    except:
        pass


@pytest.fixture
def pagination_params():
    """Common pagination parameters for testing."""
    return {
        "valid": [
            {"skip": 0, "limit": 10},
            {"skip": 5, "limit": 5},
            {"skip": 10, "limit": 50},
            {"skip": 0, "limit": 500}  # max limit
        ],
        "invalid": [
            {"skip": -1, "limit": 10},  # negative skip
            {"skip": 0, "limit": 0},    # zero limit
            {"skip": 0, "limit": 501},  # limit too high
            {"skip": 0, "limit": -1}    # negative limit
        ]
    }


@pytest.fixture
def sample_validation_data():
    """Sample data for testing validation scenarios."""
    return {
        "valid_emails": [
            "test@example.com",
            "user.name@domain.co.uk",
            "test+tag@example.org",
            "123@example.com"
        ],
        "invalid_emails": [
            "",
            "invalid",
            "invalid@",
            "@invalid.com",
            "invalid@.com",
            "invalid.com",
            "invalid@com"
        ],
        "valid_passwords": [
            "ValidPassword123!",
            "AnotherGood1@",
            "Strong1Password#",
            "Complex123$Pass"
        ],
        "invalid_passwords": [
            "",
            "weak",
            "12345678",
            "password",
            "PASSWORD",
            "Password",
            "Pass1",  # too short
            "passwordwithoutuppercase123",
            "PASSWORDWITHOUTLOWERCASE123",
            "PasswordWithoutNumbers"
        ]
    }