from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.config import settings
from app.models.user import User
from app.models.task_template import TaskTemplate
from app.models.task_item import TaskItem


class Database:
    client: AsyncIOMotorClient = None
    database = None


db = Database()


async def connect_to_mongo():
    """Create database connection"""
    db.client = AsyncIOMotorClient(settings.mongodb_url)
    db.database = db.client.get_default_database()
    
    # Initialize Beanie with the document models
    await init_beanie(
        database=db.database,
        document_models=[User, TaskTemplate, TaskItem]
    )


async def close_mongo_connection():
    """Close database connection"""
    if db.client:
        db.client.close()


async def get_database():
    """Get database instance"""
    return db.database