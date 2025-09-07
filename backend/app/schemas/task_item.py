from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional


class TaskItemBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    template_id: Optional[str] = None


class TaskItemCreate(TaskItemBase):
    pass


class TaskItemUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    template_id: Optional[str] = None


class TaskItemInDB(TaskItemBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime


class TaskItemResponse(TaskItemBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    created_at: datetime
    updated_at: datetime


class TaskItemsListResponse(BaseModel):
    items: list[TaskItemResponse]
    total: int
    limit: int
    skip: int