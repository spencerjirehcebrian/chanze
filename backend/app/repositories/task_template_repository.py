from typing import List
from datetime import datetime, UTC
from app.models.task_template import TaskTemplate
from app.repositories.base import BaseRepository


class TaskTemplateRepository(BaseRepository[TaskTemplate]):
    def __init__(self):
        super().__init__(TaskTemplate)

    async def create_template(self, name: str, user_id: str) -> TaskTemplate:
        """Create a new task template"""
        return await self.create(
            name=name,
            user_id=user_id
        )

    async def get_user_templates(self, user_id: str, skip: int = 0, limit: int = 100) -> List[TaskTemplate]:
        """Get all templates for a user"""
        return await TaskTemplate.find({"user_id": user_id}).skip(skip).limit(limit).to_list()

    async def get_user_template(self, template_id: str, user_id: str) -> TaskTemplate | None:
        """Get a specific template for a user"""
        try:
            template = await TaskTemplate.get(template_id)
            if template and template.user_id == user_id:
                return template
            return None
        except Exception:
            return None

    async def update_template(self, template_id: str, user_id: str, **kwargs) -> TaskTemplate | None:
        """Update a template for a user"""
        template = await self.get_user_template(template_id, user_id)
        if template:
            for key, value in kwargs.items():
                if hasattr(template, key):
                    setattr(template, key, value)
            template.updated_at = datetime.now(UTC)
            await template.save()
            return template
        return None

    async def delete_user_template(self, template_id: str, user_id: str) -> bool:
        """Delete a template for a user"""
        template = await self.get_user_template(template_id, user_id)
        if template:
            await template.delete()
            return True
        return False

    async def count_user_templates(self, user_id: str) -> int:
        """Count templates for a user"""
        return await TaskTemplate.find({"user_id": user_id}).count()

    async def template_exists(self, template_id: str, user_id: str) -> bool:
        """Check if template exists for user"""
        try:
            template = await TaskTemplate.get(template_id)
            return template is not None and template.user_id == user_id
        except Exception:
            return False