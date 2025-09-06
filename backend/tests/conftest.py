import asyncio
import pytest
import pytest_asyncio
from datetime import datetime, timedelta
from typing import AsyncGenerator, Generator
from httpx import AsyncClient
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from fastapi.testclient import TestClient

from app.main import app
from app.config import settings
from app.models.user import User
from app.models.task_template import TaskTemplate
from app.models.task_item import TaskItem
from app.core.security import create_access_token, get_password_hash
from app.core.database import connect_to_mongo, close_mongo_connection

# Note: Test settings are loaded automatically from .env.test when running pytest


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_test_db():
    """Set up test database connection."""
    # Settings are automatically loaded from .env.test when running pytest
    
    # Connect to test database using the URL from settings
    client = AsyncIOMotorClient(settings.mongodb_url)
    
    # Extract database name from the mongodb_url
    from urllib.parse import urlparse
    parsed_url = urlparse(settings.mongodb_url)
    db_name = parsed_url.path.lstrip('/')
    database = client.get_database(db_name)
    
    # Initialize Beanie with the document models
    await init_beanie(
        database=database,
        document_models=[User, TaskTemplate, TaskItem]
    )
    
    yield
    
    # Clean up
    await client.drop_database(db_name)
    client.close()


@pytest_asyncio.fixture
async def clean_db(setup_test_db):
    """Clean database before each test."""
    await User.delete_all()
    await TaskTemplate.delete_all()
    await TaskItem.delete_all()


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    """Create a test client."""
    with TestClient(app) as test_client:
        yield test_client


@pytest_asyncio.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    """Create an async test client."""
    async with AsyncClient(app=app, base_url="http://testserver") as ac:
        yield ac


@pytest_asyncio.fixture
async def test_user(clean_db) -> User:
    """Create a test user."""
    user = User(
        email="test@example.com",
        password_hash=get_password_hash("testpassword123"),
        is_active=True,
        is_verified=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    await user.insert()
    return user


@pytest_asyncio.fixture
async def unverified_test_user(clean_db) -> User:
    """Create an unverified test user."""
    user = User(
        email="unverified@example.com",
        password_hash=get_password_hash("testpassword123"),
        is_active=True,
        is_verified=False,
        email_verification_token="test_verification_token",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    await user.insert()
    return user


@pytest_asyncio.fixture
async def test_user_with_reset_token(clean_db) -> User:
    """Create a test user with password reset token."""
    user = User(
        email="reset@example.com",
        password_hash=get_password_hash("testpassword123"),
        is_active=True,
        is_verified=True,
        password_reset_token="test_reset_token",
        password_reset_expires=datetime.utcnow() + timedelta(hours=1),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    await user.insert()
    return user


@pytest_asyncio.fixture
async def auth_headers(test_user: User) -> dict:
    """Create authorization headers for test user."""
    token = create_access_token(data={"sub": str(test_user.id)})
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def test_task_template(test_user: User) -> TaskTemplate:
    """Create a test task template."""
    template = TaskTemplate(
        name="Test Template",
        user_id=str(test_user.id),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    await template.insert()
    return template


@pytest_asyncio.fixture
async def test_task_item(test_user: User, test_task_template: TaskTemplate) -> TaskItem:
    """Create a test task item."""
    item = TaskItem(
        name="Test Task Item",
        user_id=str(test_user.id),
        template_id=str(test_task_template.id),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    await item.insert()
    return item


@pytest_asyncio.fixture
async def multiple_test_users(clean_db) -> list[User]:
    """Create multiple test users."""
    users = []
    for i in range(3):
        user = User(
            email=f"user{i}@example.com",
            password_hash=get_password_hash("testpassword123"),
            is_active=True,
            is_verified=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        await user.insert()
        users.append(user)
    return users


@pytest.fixture
def sample_user_data() -> dict:
    """Sample user registration data."""
    return {
        "email": "newuser@example.com",
        "password": "NewPassword123!"
    }


@pytest.fixture
def sample_task_template_data() -> dict:
    """Sample task template data."""
    return {
        "name": "Sample Template"
    }


@pytest.fixture
def sample_task_item_data() -> dict:
    """Sample task item data."""
    return {
        "name": "Sample Task Item"
    }