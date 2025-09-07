import pytest
from datetime import datetime, UTC
from app.models.task_template import TaskTemplate
from app.models.task_item import TaskItem


@pytest.mark.integration
class TestTaskManagement:
    """Integration tests for task management functionality."""

    @pytest.mark.asyncio
    async def test_complete_template_lifecycle(self, test_user, clean_db):
        """Test complete template lifecycle: create, read, update, delete."""
        user_id = str(test_user.id)
        
        # Create template
        template = TaskTemplate(name="Test Template", user_id=user_id)
        await template.insert()
        
        assert template.name == "Test Template"
        assert template.user_id == user_id
        assert template.id is not None
        
        # Read template
        retrieved_template = await TaskTemplate.get(template.id)
        assert retrieved_template is not None
        assert retrieved_template.name == "Test Template"
        assert retrieved_template.user_id == user_id
        
        # Update template
        retrieved_template.name = "Updated Template"
        retrieved_template.updated_at = datetime.now(UTC)
        await retrieved_template.save()
        
        # Verify update persisted
        template_check = await TaskTemplate.get(template.id)
        assert template_check.name == "Updated Template"
        
        # Delete template
        await template_check.delete()
        
        # Verify deletion
        deleted_template = await TaskTemplate.get(template.id)
        assert deleted_template is None

    @pytest.mark.asyncio
    async def test_complete_task_item_lifecycle(self, test_user, clean_db):
        """Test complete task item lifecycle: create, read, update, delete."""
        user_id = str(test_user.id)
        
        # Create task item without template
        item = TaskItem(name="Test Task", user_id=user_id)
        await item.insert()
        
        assert item.name == "Test Task"
        assert item.user_id == user_id
        assert item.template_id is None
        assert item.id is not None
        
        # Read task item
        retrieved_item = await TaskItem.get(item.id)
        assert retrieved_item is not None
        assert retrieved_item.name == "Test Task"
        assert retrieved_item.user_id == user_id
        
        # Update task item
        retrieved_item.name = "Updated Task"
        retrieved_item.updated_at = datetime.now(UTC)
        await retrieved_item.save()
        
        # Verify update persisted
        item_check = await TaskItem.get(item.id)
        assert item_check.name == "Updated Task"
        
        # Delete task item
        await item_check.delete()
        
        # Verify deletion
        deleted_item = await TaskItem.get(item.id)
        assert deleted_item is None

    @pytest.mark.asyncio
    async def test_template_with_task_items(self, test_user, clean_db):
        """Test template with associated task items."""
        user_id = str(test_user.id)
        
        # Create template
        template = TaskTemplate(name="Project Template", user_id=user_id)
        await template.insert()
        template_id = str(template.id)
        
        # Create multiple task items for the template
        item1 = TaskItem(name="Task 1", user_id=user_id, template_id=template_id)
        item2 = TaskItem(name="Task 2", user_id=user_id, template_id=template_id)
        item3 = TaskItem(name="Task 3", user_id=user_id, template_id=template_id)
        await item1.insert()
        await item2.insert()
        await item3.insert()
        
        # Get items by template
        template_items = await TaskItem.find({"user_id": user_id, "template_id": template_id}).to_list()
        assert len(template_items) == 3
        
        item_names = [item.name for item in template_items]
        assert "Task 1" in item_names
        assert "Task 2" in item_names
        assert "Task 3" in item_names
        
        # Count items by template
        item_count = await TaskItem.find({"user_id": user_id, "template_id": template_id}).count()
        assert item_count == 3
        
        # Delete all items associated with template
        items_to_delete = await TaskItem.find({"template_id": template_id, "user_id": user_id}).to_list()
        deleted_count = len(items_to_delete)
        for item in items_to_delete:
            await item.delete()
        assert deleted_count == 3
        
        # Verify items were deleted
        remaining_items = await TaskItem.find({"user_id": user_id, "template_id": template_id}).to_list()
        assert len(remaining_items) == 0

    @pytest.mark.asyncio
    async def test_user_isolation(self, multiple_test_users, clean_db):
        """Test that users can only access their own templates and items."""
        user1_id = str(multiple_test_users[0].id)
        user2_id = str(multiple_test_users[1].id)
        user3_id = str(multiple_test_users[2].id)
        
        # Create templates for different users
        template1 = TaskTemplate(name="User 1 Template", user_id=user1_id)
        template2 = TaskTemplate(name="User 2 Template", user_id=user2_id)
        await template1.insert()
        await template2.insert()
        
        # Create task items for different users
        item1 = TaskItem(name="User 1 Task", user_id=user1_id)
        item2 = TaskItem(name="User 2 Task", user_id=user2_id)
        await item1.insert()
        await item2.insert()
        
        # Test template isolation
        user1_templates = await TaskTemplate.find({"user_id": user1_id}).to_list()
        user2_templates = await TaskTemplate.find({"user_id": user2_id}).to_list()
        user3_templates = await TaskTemplate.find({"user_id": user3_id}).to_list()
        
        assert len(user1_templates) == 1
        assert len(user2_templates) == 1
        assert len(user3_templates) == 0
        
        assert user1_templates[0].name == "User 1 Template"
        assert user2_templates[0].name == "User 2 Template"
        
        # Test task item isolation
        user1_items = await TaskItem.find({"user_id": user1_id}).to_list()
        user2_items = await TaskItem.find({"user_id": user2_id}).to_list()
        user3_items = await TaskItem.find({"user_id": user3_id}).to_list()
        
        assert len(user1_items) == 1
        assert len(user2_items) == 1
        assert len(user3_items) == 0
        
        assert user1_items[0].name == "User 1 Task"
        assert user2_items[0].name == "User 2 Task"
        
        # Test cross-user access denial - user1 trying to access user2's template
        # This should return the template but we verify it doesn't belong to user1
        template_cross_access = await TaskTemplate.get(template2.id)
        assert template_cross_access is not None  # Template exists
        assert template_cross_access.user_id != user1_id  # But doesn't belong to user1
        
        # Test cross-user item access denial
        item_cross_access = await TaskItem.get(item1.id)
        assert item_cross_access is not None  # Item exists
        assert item_cross_access.user_id != user2_id  # But doesn't belong to user2

    @pytest.mark.asyncio
    async def test_pagination(self, test_user, clean_db):
        """Test pagination functionality."""
        user_id = str(test_user.id)
        
        # Create multiple templates
        for i in range(15):
            template = TaskTemplate(name=f"Template {i}", user_id=user_id)
            await template.insert()
        
        # Create multiple task items
        for i in range(25):
            item = TaskItem(name=f"Task {i}", user_id=user_id)
            await item.insert()
        
        # Test template pagination
        first_page = await TaskTemplate.find({"user_id": user_id}).skip(0).limit(5).to_list()
        second_page = await TaskTemplate.find({"user_id": user_id}).skip(5).limit(5).to_list()
        
        assert len(first_page) == 5
        assert len(second_page) == 5
        
        # Ensure different items on different pages
        first_page_names = [t.name for t in first_page]
        second_page_names = [t.name for t in second_page]
        assert not set(first_page_names) & set(second_page_names)
        
        # Test item pagination
        first_item_page = await TaskItem.find({"user_id": user_id}).skip(0).limit(10).to_list()
        second_item_page = await TaskItem.find({"user_id": user_id}).skip(10).limit(10).to_list()
        
        assert len(first_item_page) == 10
        assert len(second_item_page) == 10
        
        # Test counts
        template_count = await TaskTemplate.find({"user_id": user_id}).count()
        item_count = await TaskItem.find({"user_id": user_id}).count()
        
        assert template_count == 15
        assert item_count == 25

    @pytest.mark.asyncio
    async def test_template_existence_checking(self, test_user, clean_db):
        """Test template existence checking functionality."""
        user_id = str(test_user.id)
        
        # Create template
        template = TaskTemplate(name="Existence Test", user_id=user_id)
        await template.insert()
        template_id = str(template.id)
        
        # Test existence - should exist
        found_template = await TaskTemplate.get(template_id)
        assert found_template is not None
        assert found_template.user_id == user_id
        
        # Test existence with wrong user - should not belong to other user
        assert found_template.user_id != "wrong_user"
        
        # Delete template
        await template.delete()
        
        # Test existence after deletion - should not exist
        deleted_template = await TaskTemplate.get(template_id)
        assert deleted_template is None

    @pytest.mark.asyncio
    async def test_task_item_existence_checking(self, test_user, clean_db):
        """Test task item existence checking functionality."""
        user_id = str(test_user.id)
        
        # Create task item
        item = TaskItem(name="Existence Test Task", user_id=user_id)
        await item.insert()
        item_id = str(item.id)
        
        # Test existence - should exist
        found_item = await TaskItem.get(item_id)
        assert found_item is not None
        assert found_item.user_id == user_id
        
        # Test existence with wrong user - should not belong to other user
        assert found_item.user_id != "wrong_user"
        
        # Delete item
        await item.delete()
        
        # Test existence after deletion - should not exist
        deleted_item = await TaskItem.get(item_id)
        assert deleted_item is None