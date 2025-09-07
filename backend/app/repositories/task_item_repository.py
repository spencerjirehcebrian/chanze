from typing import List, Optional
from datetime import datetime, UTC
from app.models.task_item import TaskItem
from app.repositories.base import BaseRepository


class TaskItemRepository(BaseRepository[TaskItem]):
    def __init__(self):
        super().__init__(TaskItem)

    async def create_item(self, name: str, user_id: str, template_id: Optional[str] = None) -> TaskItem:
        """Create a new task item"""
        return await self.create(
            name=name,
            user_id=user_id,
            template_id=template_id
        )

    async def get_user_items(
        self, 
        user_id: str, 
        template_id: Optional[str] = None, 
        skip: int = 0, 
        limit: int = 50
    ) -> List[TaskItem]:
        """Get all task items for a user, optionally filtered by template"""
        query = {"user_id": user_id}
        if template_id:
            query["template_id"] = template_id
        
        return await TaskItem.find(query).skip(skip).limit(limit).to_list()

    async def get_user_item(self, item_id: str, user_id: str) -> TaskItem | None:
        """Get a specific task item for a user"""
        try:
            item = await TaskItem.get(item_id)
            if item and item.user_id == user_id:
                return item
            return None
        except Exception:
            return None

    async def update_item(self, item_id: str, user_id: str, **kwargs) -> TaskItem | None:
        """Update a task item for a user"""
        item = await self.get_user_item(item_id, user_id)
        if item:
            for key, value in kwargs.items():
                if hasattr(item, key):
                    setattr(item, key, value)
            item.updated_at = datetime.now(UTC)
            await item.save()
            return item
        return None

    async def delete_user_item(self, item_id: str, user_id: str) -> bool:
        """Delete a task item for a user"""
        item = await self.get_user_item(item_id, user_id)
        if item:
            await item.delete()
            return True
        return False

    async def count_user_items(self, user_id: str, template_id: Optional[str] = None) -> int:
        """Count task items for a user, optionally filtered by template"""
        query = {"user_id": user_id}
        if template_id:
            query["template_id"] = template_id
        
        return await TaskItem.find(query).count()

    async def delete_items_by_template(self, template_id: str, user_id: str) -> int:
        """Delete all items associated with a template"""
        items = await TaskItem.find({"template_id": template_id, "user_id": user_id}).to_list()
        count = len(items)
        for item in items:
            await item.delete()
        return count

    async def item_exists(self, item_id: str, user_id: str) -> bool:
        """Check if item exists for user"""
        try:
            item = await TaskItem.get(item_id)
            return item is not None and item.user_id == user_id
        except Exception:
            return False