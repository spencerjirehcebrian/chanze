from pydantic import BaseModel
from typing import Optional, Any


class ErrorDetail(BaseModel):
    field: Optional[str] = None
    issue: str


class ErrorResponse(BaseModel):
    code: str
    message: str
    details: Optional[ErrorDetail] = None


class HTTPError(BaseModel):
    error: ErrorResponse