from pydantic import BaseModel, EmailStr
from typing import Optional


class UserRegister(BaseModel):
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class EmailVerification(BaseModel):
    token: str


class ForgotPassword(BaseModel):
    email: EmailStr


class ResetPassword(BaseModel):
    token: str
    new_password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: Optional[str] = None


class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[str] = None


class AuthResponse(BaseModel):
    message: str
    user_id: Optional[str] = None
    access_token: Optional[str] = None
    token_type: Optional[str] = None