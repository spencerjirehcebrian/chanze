from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional


class TaskTemplateBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)


class TaskTemplateCreate(TaskTemplateBase):
    pass


class TaskTemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)


class TaskTemplateInDB(TaskTemplateBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TaskTemplateResponse(TaskTemplateBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TaskTemplatesListResponse(BaseModel):
    templates: list[TaskTemplateResponse]
    total: int
    limit: int
    skip: int