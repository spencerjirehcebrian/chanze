from fastapi import APIRouter, HTTPException, status, Depends, Query
from app.schemas.task_item import (
    TaskItemCreate, 
    TaskItemUpdate, 
    TaskItemResponse,
    TaskItemsListResponse
)
from app.services.task_item_service import task_item_service
from app.dependencies import get_current_verified_user
from app.models.user import User
from typing import Optional

router = APIRouter(prefix="/task-items", tags=["task-items"])


@router.get("", response_model=TaskItemsListResponse)
async def get_task_items(
    template_id: Optional[str] = Query(None, description="Filter by template ID"),
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(50, ge=1, le=500, description="Number of items to return"),
    current_user: User = Depends(get_current_verified_user)
) -> TaskItemsListResponse:
    """
    Get all task items for authenticated user
    
    - **template_id**: Optional template ID to filter items (default: None - returns all items)
    - **skip**: Number of items to skip for pagination (default: 0)
    - **limit**: Maximum number of items to return (default: 50, max: 500)
    
    Returns list of user's task items with pagination metadata.
    """
    return await task_item_service.get_user_items(
        user_id=str(current_user.id),
        template_id=template_id,
        skip=skip,
        limit=limit
    )


@router.post("", response_model=TaskItemResponse, status_code=status.HTTP_201_CREATED)
async def create_task_item(
    item_data: TaskItemCreate,
    current_user: User = Depends(get_current_verified_user)
) -> TaskItemResponse:
    """
    Create a new task item
    
    - **name**: Name of the task item
    - **template_id**: Optional template ID to associate with this item
    
    Returns the created task item with metadata.
    """
    return await task_item_service.create_item(
        item_data=item_data,
        user_id=str(current_user.id)
    )


@router.get("/{item_id}", response_model=TaskItemResponse)
async def get_task_item(
    item_id: str,
    current_user: User = Depends(get_current_verified_user)
) -> TaskItemResponse:
    """
    Get a specific task item by ID
    
    - **item_id**: ID of the task item to retrieve
    
    Returns the task item if it exists and belongs to the user.
    """
    return await task_item_service.get_item(
        item_id=item_id,
        user_id=str(current_user.id)
    )


@router.put("/{item_id}", response_model=TaskItemResponse)
async def update_task_item(
    item_id: str,
    item_data: TaskItemUpdate,
    current_user: User = Depends(get_current_verified_user)
) -> TaskItemResponse:
    """
    Update a task item
    
    - **item_id**: ID of the task item to update
    - **name**: New name for the task item (optional)
    - **template_id**: New template ID to associate with this item (optional, use empty string to remove)
    
    Returns the updated task item.
    """
    return await task_item_service.update_item(
        item_id=item_id,
        item_data=item_data,
        user_id=str(current_user.id)
    )


@router.delete("/{item_id}")
async def delete_task_item(
    item_id: str,
    current_user: User = Depends(get_current_verified_user)
) -> dict:
    """
    Delete a task item
    
    - **item_id**: ID of the task item to delete
    
    Returns success message upon deletion.
    """
    return await task_item_service.delete_item(
        item_id=item_id,
        user_id=str(current_user.id)
    )