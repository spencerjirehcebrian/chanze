import pytest
from app.repositories.task_template_repository import TaskTemplateRepository
from app.repositories.task_item_repository import TaskItemRepository
from app.models.task_template import TaskTemplate
from app.models.task_item import TaskItem


@pytest.mark.integration
class TestTaskManagement:
    """Integration tests for task management functionality."""

    @pytest.fixture
    def template_repo(self):
        return TaskTemplateRepository()

    @pytest.fixture
    def item_repo(self):
        return TaskItemRepository()

    @pytest.mark.asyncio
    async def test_complete_template_lifecycle(self, template_repo, test_user, clean_db):
        """Test complete template lifecycle: create, read, update, delete."""
        user_id = str(test_user.id)
        
        # Create template
        template = await template_repo.create_template("Test Template", user_id)
        
        assert template.name == "Test Template"
        assert template.user_id == user_id
        assert template.id is not None
        
        # Read template
        retrieved_template = await template_repo.get_user_template(str(template.id), user_id)
        assert retrieved_template is not None
        assert retrieved_template.name == "Test Template"
        
        # Update template
        updated_template = await template_repo.update_template(
            str(template.id), 
            user_id, 
            name="Updated Template"
        )
        assert updated_template.name == "Updated Template"
        
        # Verify update persisted
        template_check = await template_repo.get_user_template(str(template.id), user_id)
        assert template_check.name == "Updated Template"
        
        # Delete template
        deleted = await template_repo.delete_user_template(str(template.id), user_id)
        assert deleted is True
        
        # Verify deletion
        deleted_template = await template_repo.get_user_template(str(template.id), user_id)
        assert deleted_template is None

    @pytest.mark.asyncio
    async def test_complete_task_item_lifecycle(self, item_repo, test_user, clean_db):
        """Test complete task item lifecycle: create, read, update, delete."""
        user_id = str(test_user.id)
        
        # Create task item without template
        item = await item_repo.create_item("Test Task", user_id)
        
        assert item.name == "Test Task"
        assert item.user_id == user_id
        assert item.template_id is None
        assert item.id is not None
        
        # Read task item
        retrieved_item = await item_repo.get_user_item(str(item.id), user_id)
        assert retrieved_item is not None
        assert retrieved_item.name == "Test Task"
        
        # Update task item
        updated_item = await item_repo.update_item(
            str(item.id), 
            user_id, 
            name="Updated Task"
        )
        assert updated_item.name == "Updated Task"
        
        # Verify update persisted
        item_check = await item_repo.get_user_item(str(item.id), user_id)
        assert item_check.name == "Updated Task"
        
        # Delete task item
        deleted = await item_repo.delete_user_item(str(item.id), user_id)
        assert deleted is True
        
        # Verify deletion
        deleted_item = await item_repo.get_user_item(str(item.id), user_id)
        assert deleted_item is None

    @pytest.mark.asyncio
    async def test_template_with_task_items(self, template_repo, item_repo, test_user, clean_db):
        """Test template with associated task items."""
        user_id = str(test_user.id)
        
        # Create template
        template = await template_repo.create_template("Project Template", user_id)
        template_id = str(template.id)
        
        # Create multiple task items for the template
        item1 = await item_repo.create_item("Task 1", user_id, template_id)
        item2 = await item_repo.create_item("Task 2", user_id, template_id)
        item3 = await item_repo.create_item("Task 3", user_id, template_id)
        
        # Get items by template
        template_items = await item_repo.get_user_items(user_id, template_id=template_id)
        assert len(template_items) == 3
        
        item_names = [item.name for item in template_items]
        assert "Task 1" in item_names
        assert "Task 2" in item_names
        assert "Task 3" in item_names
        
        # Count items by template
        item_count = await item_repo.count_user_items(user_id, template_id)
        assert item_count == 3
        
        # Delete all items associated with template
        deleted_count = await item_repo.delete_items_by_template(template_id, user_id)
        assert deleted_count == 3
        
        # Verify items were deleted
        remaining_items = await item_repo.get_user_items(user_id, template_id=template_id)
        assert len(remaining_items) == 0

    @pytest.mark.asyncio
    async def test_user_isolation(self, template_repo, item_repo, multiple_test_users, clean_db):
        """Test that users can only access their own templates and items."""
        user1_id = str(multiple_test_users[0].id)
        user2_id = str(multiple_test_users[1].id)
        user3_id = str(multiple_test_users[2].id)
        
        # Create templates for different users
        template1 = await template_repo.create_template("User 1 Template", user1_id)
        template2 = await template_repo.create_template("User 2 Template", user2_id)
        
        # Create task items for different users
        item1 = await item_repo.create_item("User 1 Task", user1_id)
        item2 = await item_repo.create_item("User 2 Task", user2_id)
        
        # Test template isolation
        user1_templates = await template_repo.get_user_templates(user1_id)
        user2_templates = await template_repo.get_user_templates(user2_id)
        user3_templates = await template_repo.get_user_templates(user3_id)
        
        assert len(user1_templates) == 1
        assert len(user2_templates) == 1
        assert len(user3_templates) == 0
        
        assert user1_templates[0].name == "User 1 Template"
        assert user2_templates[0].name == "User 2 Template"
        
        # Test task item isolation
        user1_items = await item_repo.get_user_items(user1_id)
        user2_items = await item_repo.get_user_items(user2_id)
        user3_items = await item_repo.get_user_items(user3_id)
        
        assert len(user1_items) == 1
        assert len(user2_items) == 1
        assert len(user3_items) == 0
        
        assert user1_items[0].name == "User 1 Task"
        assert user2_items[0].name == "User 2 Task"
        
        # Test cross-user access denial
        user1_cannot_access_user2_template = await template_repo.get_user_template(
            str(template2.id), user1_id
        )
        assert user1_cannot_access_user2_template is None
        
        user2_cannot_access_user1_item = await item_repo.get_user_item(
            str(item1.id), user2_id
        )
        assert user2_cannot_access_user1_item is None

    @pytest.mark.asyncio
    async def test_pagination(self, template_repo, item_repo, test_user, clean_db):
        """Test pagination functionality."""
        user_id = str(test_user.id)
        
        # Create multiple templates
        for i in range(15):
            await template_repo.create_template(f"Template {i}", user_id)
        
        # Create multiple task items
        for i in range(25):
            await item_repo.create_item(f"Task {i}", user_id)
        
        # Test template pagination
        first_page = await template_repo.get_user_templates(user_id, skip=0, limit=5)
        second_page = await template_repo.get_user_templates(user_id, skip=5, limit=5)
        
        assert len(first_page) == 5
        assert len(second_page) == 5
        
        # Ensure different items on different pages
        first_page_names = [t.name for t in first_page]
        second_page_names = [t.name for t in second_page]
        assert not set(first_page_names) & set(second_page_names)
        
        # Test item pagination
        first_item_page = await item_repo.get_user_items(user_id, skip=0, limit=10)
        second_item_page = await item_repo.get_user_items(user_id, skip=10, limit=10)
        
        assert len(first_item_page) == 10
        assert len(second_item_page) == 10
        
        # Test counts
        template_count = await template_repo.count_user_templates(user_id)
        item_count = await item_repo.count_user_items(user_id)
        
        assert template_count == 15
        assert item_count == 25

    @pytest.mark.asyncio
    async def test_template_existence_checking(self, template_repo, test_user, clean_db):
        """Test template existence checking functionality."""
        user_id = str(test_user.id)
        
        # Create template
        template = await template_repo.create_template("Existence Test", user_id)
        template_id = str(template.id)
        
        # Test existence - should exist
        exists = await template_repo.template_exists(template_id, user_id)
        assert exists is True
        
        # Test existence with wrong user - should not exist for other user
        exists_wrong_user = await template_repo.template_exists(template_id, "wrong_user")
        assert exists_wrong_user is False
        
        # Delete template
        await template_repo.delete_user_template(template_id, user_id)
        
        # Test existence after deletion - should not exist
        exists_after_delete = await template_repo.template_exists(template_id, user_id)
        assert exists_after_delete is False

    @pytest.mark.asyncio
    async def test_task_item_existence_checking(self, item_repo, test_user, clean_db):
        """Test task item existence checking functionality."""
        user_id = str(test_user.id)
        
        # Create task item
        item = await item_repo.create_item("Existence Test Task", user_id)
        item_id = str(item.id)
        
        # Test existence - should exist
        exists = await item_repo.item_exists(item_id, user_id)
        assert exists is True
        
        # Test existence with wrong user - should not exist for other user
        exists_wrong_user = await item_repo.item_exists(item_id, "wrong_user")
        assert exists_wrong_user is False
        
        # Delete item
        await item_repo.delete_user_item(item_id, user_id)
        
        # Test existence after deletion - should not exist
        exists_after_delete = await item_repo.item_exists(item_id, user_id)
        assert exists_after_delete is False