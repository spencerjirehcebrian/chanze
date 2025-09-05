from datetime import datetime
from pydantic import BaseModel
from typing import Optional


class TaskTemplateBase(BaseModel):
    name: str


class TaskTemplateCreate(TaskTemplateBase):
    pass


class TaskTemplateUpdate(BaseModel):
    name: Optional[str] = None


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