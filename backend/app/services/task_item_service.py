from typing import Optional
from fastapi import HTTPException, status
from app.repositories.task_item_repository import TaskItemRepository
from app.repositories.task_template_repository import TaskTemplateRepository
from app.schemas.task_item import (
    TaskItemCreate, 
    TaskItemUpdate, 
    TaskItemResponse,
    TaskItemsListResponse
)
from app.models.task_item import TaskItem
import logging

logger = logging.getLogger(__name__)


class TaskItemService:
    def __init__(self):
        self.item_repo = TaskItemRepository()
        self.template_repo = TaskTemplateRepository()

    async def create_item(self, item_data: TaskItemCreate, user_id: str) -> TaskItemResponse:
        """Create a new task item"""
        # Validate template_id if provided
        if item_data.template_id:
            template_exists = await self.template_repo.template_exists(
                item_data.template_id, user_id
            )
            if not template_exists:
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

        item = await self.item_repo.create_item(
            name=item_data.name,
            user_id=user_id,
            template_id=item_data.template_id
        )

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
            template_exists = await self.template_repo.template_exists(template_id, user_id)
            if not template_exists:
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

        items = await self.item_repo.get_user_items(user_id, template_id, skip, limit)
        total = await self.item_repo.count_user_items(user_id, template_id)
        
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
        item = await self.item_repo.get_user_item(item_id, user_id)
        
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
        # Check if item exists
        existing_item = await self.item_repo.get_user_item(item_id, user_id)
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
            template_exists = await self.template_repo.template_exists(
                item_data.template_id, user_id
            )
            if not template_exists:
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
        update_data = {}
        if item_data.name is not None:
            update_data["name"] = item_data.name
        if item_data.template_id is not None:
            # Allow setting template_id to None (empty string becomes None)
            update_data["template_id"] = item_data.template_id if item_data.template_id != "" else None

        if not update_data:
            # No updates provided, return current item
            return TaskItemResponse(
                id=str(existing_item.id),
                name=existing_item.name,
                template_id=existing_item.template_id,
                created_at=existing_item.created_at,
                updated_at=existing_item.updated_at
            )

        item = await self.item_repo.update_item(item_id, user_id, **update_data)

        return TaskItemResponse(
            id=str(item.id),
            name=item.name,
            template_id=item.template_id,
            created_at=item.created_at,
            updated_at=item.updated_at
        )

    async def delete_item(self, item_id: str, user_id: str) -> dict:
        """Delete a task item"""
        # Check if item exists
        item = await self.item_repo.get_user_item(item_id, user_id)
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
        await self.item_repo.delete_user_item(item_id, user_id)

        logger.info(f"Deleted item {item_id} for user {user_id}")

        return {"message": "Task item deleted successfully"}


# Global task item service instance
task_item_service = TaskItemService()