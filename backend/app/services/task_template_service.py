from typing import List
from datetime import datetime, UTC
from fastapi import HTTPException, status
from app.schemas.task_template import (
    TaskTemplateCreate, 
    TaskTemplateUpdate, 
    TaskTemplateResponse,
    TaskTemplatesListResponse
)
from app.models.task_template import TaskTemplate
from app.models.task_item import TaskItem
import logging

logger = logging.getLogger(__name__)


class TaskTemplateService:
    def __init__(self):
        pass

    async def create_template(self, template_data: TaskTemplateCreate, user_id: str) -> TaskTemplateResponse:
        """Create a new task template"""
        template = TaskTemplate(
            name=template_data.name,
            user_id=user_id
        )
        await template.insert()

        return TaskTemplateResponse(
            id=str(template.id),
            name=template.name,
            created_at=template.created_at,
            updated_at=template.updated_at
        )

    async def get_user_templates(self, user_id: str, skip: int = 0, limit: int = 100) -> TaskTemplatesListResponse:
        """Get all templates for a user"""
        templates = await TaskTemplate.find({"user_id": user_id}).skip(skip).limit(limit).to_list()
        total = await TaskTemplate.find({"user_id": user_id}).count()
        
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
        try:
            template = await TaskTemplate.get(template_id)
            if not template or template.user_id != user_id:
                template = None
        except Exception:
            template = None
        
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
        # Check if template exists and belongs to user
        try:
            existing_template = await TaskTemplate.get(template_id)
            if not existing_template or existing_template.user_id != user_id:
                existing_template = None
        except Exception:
            existing_template = None
            
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
        if template_data.name is not None:
            existing_template.name = template_data.name
            existing_template.updated_at = datetime.now(UTC)
            await existing_template.save()
        else:
            # No updates provided, return current template
            pass

        return TaskTemplateResponse(
            id=str(existing_template.id),
            name=existing_template.name,
            created_at=existing_template.created_at,
            updated_at=existing_template.updated_at
        )

    async def delete_template(self, template_id: str, user_id: str) -> dict:
        """Delete a task template and all associated task items"""
        # Check if template exists and belongs to user
        try:
            template = await TaskTemplate.get(template_id)
            if not template or template.user_id != user_id:
                template = None
        except Exception:
            template = None
            
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
        items = await TaskItem.find({"template_id": template_id, "user_id": user_id}).to_list()
        deleted_items_count = len(items)
        for item in items:
            await item.delete()
        
        # Delete the template
        await template.delete()

        logger.info(f"Deleted template {template_id} and {deleted_items_count} associated items for user {user_id}")

        return {
            "message": "Template deleted successfully",
            "deleted_items_count": deleted_items_count
        }


# Global task template service instance
task_template_service = TaskTemplateService()