from datetime import datetime
from typing import Optional
from beanie import Document, Indexed
from pydantic import Field


class TaskItem(Document):
    name: str
    user_id: Indexed(str)
    template_id: Optional[Indexed(str)] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        collection = "task_items"
        indexes = [
            "user_id",
            "template_id",
        ]

    def __repr__(self) -> str:
        return f"<TaskItem {self.name}>"

    def __str__(self) -> str:
        return self.name