import pytest
from datetime import datetime, UTC
from pydantic import ValidationError
from app.models.task_item import TaskItem


@pytest.mark.unit
class TestTaskItemModel:
    """Unit tests for TaskItem model."""
    
    def test_task_item_creation_with_required_fields(self):
        """Test creating a task item with only required fields."""
        item_data = {
            "name": "Test Task Item",
            "user_id": "user123"
        }
        item = TaskItem(**item_data)
        
        assert item.name == "Test Task Item"
        assert item.user_id == "user123"
        assert item.template_id is None
        assert isinstance(item.created_at, datetime)
        assert isinstance(item.updated_at, datetime)
    
    def test_task_item_creation_with_all_fields(self):
        """Test creating a task item with all fields."""
        now = datetime.now(UTC)
        
        item_data = {
            "name": "Test Task Item",
            "user_id": "user123",
            "template_id": "template456",
            "created_at": now,
            "updated_at": now
        }
        item = TaskItem(**item_data)
        
        assert item.name == "Test Task Item"
        assert item.user_id == "user123"
        assert item.template_id == "template456"
        assert item.created_at == now
        assert item.updated_at == now
    
    def test_task_item_without_template(self):
        """Test creating a task item without template_id."""
        item = TaskItem(
            name="Standalone Task",
            user_id="user123"
        )
        
        assert item.name == "Standalone Task"
        assert item.user_id == "user123"
        assert item.template_id is None
    
    def test_task_item_with_template(self):
        """Test creating a task item with template_id."""
        item = TaskItem(
            name="Template Task",
            user_id="user123",
            template_id="template456"
        )
        
        assert item.name == "Template Task"
        assert item.user_id == "user123"
        assert item.template_id == "template456"
    
    def test_task_item_missing_required_fields(self):
        """Test task item creation with missing required fields."""
        # Missing name
        with pytest.raises(ValidationError) as exc_info:
            TaskItem(user_id="user123")
        
        errors = exc_info.value.errors()
        assert any(error["loc"] == ("name",) for error in errors)
        
        # Missing user_id
        with pytest.raises(ValidationError) as exc_info:
            TaskItem(name="Test Task")
        
        errors = exc_info.value.errors()
        assert any(error["loc"] == ("user_id",) for error in errors)
    
    def test_task_item_str_representation(self):
        """Test task item string representation."""
        item = TaskItem(
            name="Test Task Item",
            user_id="user123"
        )
        assert str(item) == "Test Task Item"
    
    def test_task_item_repr_representation(self):
        """Test task item repr representation."""
        item = TaskItem(
            name="Test Task Item",
            user_id="user123"
        )
        assert repr(item) == "<TaskItem Test Task Item>"
    
    def test_task_item_model_settings(self):
        """Test task item model settings."""
        assert TaskItem.Settings.collection == "task_items"
        assert "user_id" in TaskItem.Settings.indexes
        assert "template_id" in TaskItem.Settings.indexes
    
    def test_task_item_datetime_defaults(self):
        """Test that datetime fields have proper defaults."""
        item1 = TaskItem(
            name="Task 1",
            user_id="user123"
        )
        
        # Create second item a bit later to test different timestamps
        import time
        time.sleep(0.001)
        
        item2 = TaskItem(
            name="Task 2",
            user_id="user123"
        )
        
        assert item1.created_at != item2.created_at
        assert item1.updated_at != item2.updated_at
        assert isinstance(item1.created_at, datetime)
        assert isinstance(item1.updated_at, datetime)
    
    def test_task_item_name_types(self):
        """Test different name types."""
        # String name
        item = TaskItem(name="String Name", user_id="user123")
        assert item.name == "String Name"
        
        # Name with special characters
        item = TaskItem(name="Task with @#$%^&*()", user_id="user123")
        assert item.name == "Task with @#$%^&*()"
        
        # Unicode name
        item = TaskItem(name="Tâche français 中文", user_id="user123")
        assert item.name == "Tâche français 中文"
    
    def test_task_item_user_id_types(self):
        """Test different user_id types."""
        # String user_id
        item = TaskItem(name="Test", user_id="user123")
        assert item.user_id == "user123"
        
        # ObjectId-like string
        item = TaskItem(name="Test", user_id="507f1f77bcf86cd799439011")
        assert item.user_id == "507f1f77bcf86cd799439011"
        
        # UUID-like string
        item = TaskItem(name="Test", user_id="550e8400-e29b-41d4-a716-446655440000")
        assert item.user_id == "550e8400-e29b-41d4-a716-446655440000"
    
    def test_task_item_template_id_types(self):
        """Test different template_id types."""
        # None template_id
        item = TaskItem(name="Test", user_id="user123", template_id=None)
        assert item.template_id is None
        
        # String template_id
        item = TaskItem(name="Test", user_id="user123", template_id="template123")
        assert item.template_id == "template123"
        
        # ObjectId-like string
        item = TaskItem(name="Test", user_id="user123", template_id="507f1f77bcf86cd799439011")
        assert item.template_id == "507f1f77bcf86cd799439011"
    
    def test_task_item_field_constraints(self):
        """Test field constraints and validation."""
        # Test that user_id field exists and is required
        user_id_field = TaskItem.model_fields["user_id"]
        assert user_id_field.is_required()
        
        # Test that template_id field exists and is optional
        template_id_field = TaskItem.model_fields["template_id"]
        assert not template_id_field.is_required()
    
    def test_task_item_long_name(self):
        """Test task item with very long name."""
        long_name = "x" * 1000
        item = TaskItem(
            name=long_name,
            user_id="user123"
        )
        assert item.name == long_name
        assert len(item.name) == 1000
    
    def test_task_item_template_id_optional(self):
        """Test that template_id is truly optional."""
        # Create without template_id
        item1 = TaskItem(name="Task 1", user_id="user123")
        assert item1.template_id is None
        
        # Create with explicit None
        item2 = TaskItem(name="Task 2", user_id="user123", template_id=None)
        assert item2.template_id is None
        
        # Create with template_id
        item3 = TaskItem(name="Task 3", user_id="user123", template_id="template123")
        assert item3.template_id == "template123"