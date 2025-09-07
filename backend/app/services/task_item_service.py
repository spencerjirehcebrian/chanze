from typing import Optional
from datetime import datetime, UTC
from fastapi import HTTPException, status
from app.schemas.task_item import (
    TaskItemCreate, 
    TaskItemUpdate, 
    TaskItemResponse,
    TaskItemsListResponse
)
from app.models.task_item import TaskItem
from app.models.task_template import TaskTemplate
import logging

logger = logging.getLogger(__name__)


class TaskItemService:
    def __init__(self):
        pass

    async def create_item(self, item_data: TaskItemCreate, user_id: str) -> TaskItemResponse:
        """Create a new task item"""
        # Validate template_id if provided
        if item_data.template_id:
            try:
                template = await TaskTemplate.get(item_data.template_id)
                if not template or template.user_id != user_id:
                    template = None
            except Exception:
                template = None
                
            if not template:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "error": {
                            "code": "TEMPLATE_NOT_FOUND",
                            "message": "Template not found",
                            "details": {
                                "field": "template_id",
                                "issue": "Template does not exist or does not belong to user"
                            }
                        }
                    }
                )

        item = TaskItem(
            name=item_data.name,
            user_id=user_id,
            template_id=item_data.template_id
        )
        await item.insert()

        return TaskItemResponse(
            id=str(item.id),
            name=item.name,
            template_id=item.template_id,
            created_at=item.created_at,
            updated_at=item.updated_at
        )

    async def get_user_items(
        self, 
        user_id: str, 
        template_id: Optional[str] = None,
        skip: int = 0, 
        limit: int = 50
    ) -> TaskItemsListResponse:
        """Get all task items for a user, optionally filtered by template"""
        # Validate template_id if provided
        if template_id:
            try:
                template = await TaskTemplate.get(template_id)
                if not template or template.user_id != user_id:
                    template = None
            except Exception:
                template = None
                
            if not template:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "error": {
                            "code": "TEMPLATE_NOT_FOUND",
                            "message": "Template not found",
                            "details": {
                                "field": "template_id",
                                "issue": "Template does not exist or does not belong to user"
                            }
                        }
                    }
                )

        query = {"user_id": user_id}
        if template_id:
            query["template_id"] = template_id
        
        items = await TaskItem.find(query).skip(skip).limit(limit).to_list()
        total = await TaskItem.find(query).count()
        
        item_responses = [
            TaskItemResponse(
                id=str(item.id),
                name=item.name,
                template_id=item.template_id,
                created_at=item.created_at,
                updated_at=item.updated_at
            )
            for item in items
        ]

        return TaskItemsListResponse(
            items=item_responses,
            total=total,
            limit=limit,
            skip=skip
        )

    async def get_item(self, item_id: str, user_id: str) -> TaskItemResponse:
        """Get a specific task item"""
        try:
            item = await TaskItem.get(item_id)
            if not item or item.user_id != user_id:
                item = None
        except Exception:
            item = None
        
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "error": {
                        "code": "ITEM_NOT_FOUND",
                        "message": "Task item not found",
                        "details": {
                            "field": "item_id",
                            "issue": "Item does not exist or does not belong to user"
                        }
                    }
                }
            )

        return TaskItemResponse(
            id=str(item.id),
            name=item.name,
            template_id=item.template_id,
            created_at=item.created_at,
            updated_at=item.updated_at
        )

    async def update_item(
        self, 
        item_id: str, 
        item_data: TaskItemUpdate, 
        user_id: str
    ) -> TaskItemResponse:
        """Update a task item"""
        # Check if item exists and belongs to user
        try:
            existing_item = await TaskItem.get(item_id)
            if not existing_item or existing_item.user_id != user_id:
                existing_item = None
        except Exception:
            existing_item = None
            
        if not existing_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "error": {
                        "code": "ITEM_NOT_FOUND",
                        "message": "Task item not found",
                        "details": {
                            "field": "item_id",
                            "issue": "Item does not exist or does not belong to user"
                        }
                    }
                }
            )

        # Validate template_id if being updated
        if item_data.template_id is not None and item_data.template_id != "":
            try:
                template = await TaskTemplate.get(item_data.template_id)
                if not template or template.user_id != user_id:
                    template = None
            except Exception:
                template = None
                
            if not template:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "error": {
                            "code": "TEMPLATE_NOT_FOUND",
                            "message": "Template not found",
                            "details": {
                                "field": "template_id",
                                "issue": "Template does not exist or does not belong to user"
                            }
                        }
                    }
                )

        # Update fields that are provided
        updated = False
        if item_data.name is not None:
            existing_item.name = item_data.name
            updated = True
        if item_data.template_id is not None:
            # Allow setting template_id to None (empty string becomes None)
            existing_item.template_id = item_data.template_id if item_data.template_id != "" else None
            updated = True

        if updated:
            existing_item.updated_at = datetime.now(UTC)
            await existing_item.save()

        return TaskItemResponse(
            id=str(existing_item.id),
            name=existing_item.name,
            template_id=existing_item.template_id,
            created_at=existing_item.created_at,
            updated_at=existing_item.updated_at
        )

    async def delete_item(self, item_id: str, user_id: str) -> dict:
        """Delete a task item"""
        # Check if item exists and belongs to user
        try:
            item = await TaskItem.get(item_id)
            if not item or item.user_id != user_id:
                item = None
        except Exception:
            item = None
            
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "error": {
                        "code": "ITEM_NOT_FOUND",
                        "message": "Task item not found",
                        "details": {
                            "field": "item_id",
                            "issue": "Item does not exist or does not belong to user"
                        }
                    }
                }
            )

        # Delete the item
        await item.delete()

        logger.info(f"Deleted item {item_id} for user {user_id}")

        return {"message": "Task item deleted successfully"}


# Global task item service instance
task_item_service = TaskItemService()