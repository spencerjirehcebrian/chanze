from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None


class UserInDB(UserBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime