from datetime import datetime
from pydantic import BaseModel
from typing import Optional


class TaskItemBase(BaseModel):
    name: str
    template_id: Optional[str] = None


class TaskItemCreate(TaskItemBase):
    pass


class TaskItemUpdate(BaseModel):
    name: Optional[str] = None
    template_id: Optional[str] = None


class TaskItemInDB(TaskItemBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TaskItemResponse(TaskItemBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TaskItemsListResponse(BaseModel):
    items: list[TaskItemResponse]
    total: int
    limit: int
    skip: int