from typing import List
from fastapi import HTTPException, status
from app.repositories.task_template_repository import TaskTemplateRepository
from app.repositories.task_item_repository import TaskItemRepository
from app.schemas.task_template import (
    TaskTemplateCreate, 
    TaskTemplateUpdate, 
    TaskTemplateResponse,
    TaskTemplatesListResponse
)
from app.models.task_template import TaskTemplate
import logging

logger = logging.getLogger(__name__)


class TaskTemplateService:
    def __init__(self):
        self.template_repo = TaskTemplateRepository()
        self.item_repo = TaskItemRepository()

    async def create_template(self, template_data: TaskTemplateCreate, user_id: str) -> TaskTemplateResponse:
        """Create a new task template"""
        template = await self.template_repo.create_template(
            name=template_data.name,
            user_id=user_id
        )

        return TaskTemplateResponse(
            id=str(template.id),
            name=template.name,
            created_at=template.created_at,
            updated_at=template.updated_at
        )

    async def get_user_templates(self, user_id: str, skip: int = 0, limit: int = 100) -> TaskTemplatesListResponse:
        """Get all templates for a user"""
        templates = await self.template_repo.get_user_templates(user_id, skip, limit)
        total = await self.template_repo.count_user_templates(user_id)
        
        template_responses = [
            TaskTemplateResponse(
                id=str(template.id),
                name=template.name,
                created_at=template.created_at,
                updated_at=template.updated_at
            )
            for template in templates
        ]

        return TaskTemplatesListResponse(
            templates=template_responses,
            total=total,
            skip=skip,
            limit=limit
        )

    async def get_template(self, template_id: str, user_id: str) -> TaskTemplateResponse:
        """Get a specific template"""
        template = await self.template_repo.get_user_template(template_id, user_id)
        
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "error": {
                        "code": "TEMPLATE_NOT_FOUND",
                        "message": "Task template not found",
                        "details": {
                            "field": "template_id",
                            "issue": "Template does not exist or does not belong to user"
                        }
                    }
                }
            )

        return TaskTemplateResponse(
            id=str(template.id),
            name=template.name,
            created_at=template.created_at,
            updated_at=template.updated_at
        )

    async def update_template(
        self, 
        template_id: str, 
        template_data: TaskTemplateUpdate, 
        user_id: str
    ) -> TaskTemplateResponse:
        """Update a task template"""
        # Check if template exists
        existing_template = await self.template_repo.get_user_template(template_id, user_id)
        if not existing_template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "error": {
                        "code": "TEMPLATE_NOT_FOUND",
                        "message": "Task template not found",
                        "details": {
                            "field": "template_id",
                            "issue": "Template does not exist or does not belong to user"
                        }
                    }
                }
            )

        # Update fields that are provided
        update_data = {}
        if template_data.name is not None:
            update_data["name"] = template_data.name

        if not update_data:
            # No updates provided, return current template
            return TaskTemplateResponse(
                id=str(existing_template.id),
                name=existing_template.name,
                created_at=existing_template.created_at,
                updated_at=existing_template.updated_at
            )

        template = await self.template_repo.update_template(
            template_id, user_id, **update_data
        )

        return TaskTemplateResponse(
            id=str(template.id),
            name=template.name,
            created_at=template.created_at,
            updated_at=template.updated_at
        )

    async def delete_template(self, template_id: str, user_id: str) -> dict:
        """Delete a task template and all associated task items"""
        # Check if template exists
        template = await self.template_repo.get_user_template(template_id, user_id)
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "error": {
                        "code": "TEMPLATE_NOT_FOUND",
                        "message": "Task template not found",
                        "details": {
                            "field": "template_id",
                            "issue": "Template does not exist or does not belong to user"
                        }
                    }
                }
            )

        # Delete all task items associated with this template
        deleted_items_count = await self.item_repo.delete_items_by_template(template_id, user_id)
        
        # Delete the template
        await self.template_repo.delete_user_template(template_id, user_id)

        logger.info(f"Deleted template {template_id} and {deleted_items_count} associated items for user {user_id}")

        return {
            "message": "Template deleted successfully",
            "deleted_items_count": deleted_items_count
        }


# Global task template service instance
task_template_service = TaskTemplateService()