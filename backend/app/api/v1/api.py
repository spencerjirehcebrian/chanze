from fastapi import APIRouter
from app.api.v1.endpoints import auth, task_templates, task_items

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router)
api_router.include_router(task_templates.router)
api_router.include_router(task_items.router)