from fastapi import APIRouter, HTTPException, status, Depends, Query
from app.schemas.task_template import (
    TaskTemplateCreate, 
    TaskTemplateUpdate, 
    TaskTemplateResponse,
    TaskTemplatesListResponse
)
from app.services.task_template_service import task_template_service
from app.dependencies import get_current_verified_user
from app.models.user import User
from typing import Optional

router = APIRouter(prefix="/task-templates", tags=["task-templates"])


@router.get("", response_model=TaskTemplatesListResponse)
async def get_task_templates(
    skip: int = Query(0, ge=0, description="Number of templates to skip"),
    limit: int = Query(100, ge=1, le=500, description="Number of templates to return"),
    current_user: User = Depends(get_current_verified_user)
) -> TaskTemplatesListResponse:
    """
    Get all task templates for authenticated user
    
    - **skip**: Number of templates to skip for pagination (default: 0)
    - **limit**: Maximum number of templates to return (default: 100, max: 500)
    
    Returns list of user's task templates with metadata.
    """
    return await task_template_service.get_user_templates(
        user_id=str(current_user.id),
        skip=skip,
        limit=limit
    )


@router.post("", response_model=TaskTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_task_template(
    template_data: TaskTemplateCreate,
    current_user: User = Depends(get_current_verified_user)
) -> TaskTemplateResponse:
    """
    Create a new task template
    
    - **name**: Name of the task template
    
    Returns the created task template with metadata.
    """
    return await task_template_service.create_template(
        template_data=template_data,
        user_id=str(current_user.id)
    )


@router.get("/{template_id}", response_model=TaskTemplateResponse)
async def get_task_template(
    template_id: str,
    current_user: User = Depends(get_current_verified_user)
) -> TaskTemplateResponse:
    """
    Get a specific task template by ID
    
    - **template_id**: ID of the task template to retrieve
    
    Returns the task template if it exists and belongs to the user.
    """
    return await task_template_service.get_template(
        template_id=template_id,
        user_id=str(current_user.id)
    )


@router.put("/{template_id}", response_model=TaskTemplateResponse)
async def update_task_template(
    template_id: str,
    template_data: TaskTemplateUpdate,
    current_user: User = Depends(get_current_verified_user)
) -> TaskTemplateResponse:
    """
    Update a task template
    
    - **template_id**: ID of the task template to update
    - **name**: New name for the task template (optional)
    
    Returns the updated task template.
    """
    return await task_template_service.update_template(
        template_id=template_id,
        template_data=template_data,
        user_id=str(current_user.id)
    )


@router.delete("/{template_id}")
async def delete_task_template(
    template_id: str,
    current_user: User = Depends(get_current_verified_user)
) -> dict:
    """
    Delete a task template and all associated task items
    
    - **template_id**: ID of the task template to delete
    
    Deletes the template and all task items associated with it.
    Returns success message and count of deleted items.
    """
    return await task_template_service.delete_template(
        template_id=template_id,
        user_id=str(current_user.id)
    )