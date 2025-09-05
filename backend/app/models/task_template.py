from datetime import datetime
from beanie import Document, Link, Indexed
from pydantic import Field
from app.models.user import User


class TaskTemplate(Document):
    name: str
    user_id: Indexed(str)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        collection = "task_templates"
        indexes = [
            "user_id",
        ]

    def __repr__(self) -> str:
        return f"<TaskTemplate {self.name}>"

    def __str__(self) -> str:
        return self.name