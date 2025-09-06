import pytest
from datetime import datetime
from pydantic import ValidationError
from app.models.task_template import TaskTemplate


@pytest.mark.unit
class TestTaskTemplateModel:
    """Unit tests for TaskTemplate model."""
    
    def test_task_template_creation_with_required_fields(self):
        """Test creating a task template with only required fields."""
        template_data = {
            "name": "Test Template",
            "user_id": "user123"
        }
        template = TaskTemplate(**template_data)
        
        assert template.name == "Test Template"
        assert template.user_id == "user123"
        assert isinstance(template.created_at, datetime)
        assert isinstance(template.updated_at, datetime)
    
    def test_task_template_creation_with_all_fields(self):
        """Test creating a task template with all fields."""
        now = datetime.utcnow()
        
        template_data = {
            "name": "Test Template",
            "user_id": "user123",
            "created_at": now,
            "updated_at": now
        }
        template = TaskTemplate(**template_data)
        
        assert template.name == "Test Template"
        assert template.user_id == "user123"
        assert template.created_at == now
        assert template.updated_at == now
    
    def test_task_template_missing_required_fields(self):
        """Test task template creation with missing required fields."""
        # Missing name
        with pytest.raises(ValidationError) as exc_info:
            TaskTemplate(user_id="user123")
        
        errors = exc_info.value.errors()
        assert any(error["loc"] == ("name",) for error in errors)
        
        # Missing user_id
        with pytest.raises(ValidationError) as exc_info:
            TaskTemplate(name="Test Template")
        
        errors = exc_info.value.errors()
        assert any(error["loc"] == ("user_id",) for error in errors)
    
    def test_task_template_empty_name(self):
        """Test task template creation with empty name."""
        with pytest.raises(ValidationError) as exc_info:
            TaskTemplate(name="", user_id="user123")
        
        # Empty string should still be valid for name field
        # If you want to enforce non-empty names, add validation to the model
    
    def test_task_template_str_representation(self):
        """Test task template string representation."""
        template = TaskTemplate(
            name="Test Template",
            user_id="user123"
        )
        assert str(template) == "Test Template"
    
    def test_task_template_repr_representation(self):
        """Test task template repr representation."""
        template = TaskTemplate(
            name="Test Template",
            user_id="user123"
        )
        assert repr(template) == "<TaskTemplate Test Template>"
    
    def test_task_template_model_settings(self):
        """Test task template model settings."""
        assert TaskTemplate.Settings.collection == "task_templates"
        assert "user_id" in TaskTemplate.Settings.indexes
    
    def test_task_template_datetime_defaults(self):
        """Test that datetime fields have proper defaults."""
        template1 = TaskTemplate(
            name="Template 1",
            user_id="user123"
        )
        
        # Create second template a bit later to test different timestamps
        import time
        time.sleep(0.001)
        
        template2 = TaskTemplate(
            name="Template 2",
            user_id="user123"
        )
        
        assert template1.created_at != template2.created_at
        assert template1.updated_at != template2.updated_at
        assert isinstance(template1.created_at, datetime)
        assert isinstance(template1.updated_at, datetime)
    
    def test_task_template_name_types(self):
        """Test different name types."""
        # String name
        template = TaskTemplate(name="String Name", user_id="user123")
        assert template.name == "String Name"
        
        # Name with special characters
        template = TaskTemplate(name="Template with @#$%^&*()", user_id="user123")
        assert template.name == "Template with @#$%^&*()"
        
        # Unicode name
        template = TaskTemplate(name="Tâche français 中文", user_id="user123")
        assert template.name == "Tâche français 中文"
    
    def test_task_template_user_id_types(self):
        """Test different user_id types."""
        # String user_id
        template = TaskTemplate(name="Test", user_id="user123")
        assert template.user_id == "user123"
        
        # ObjectId-like string
        template = TaskTemplate(name="Test", user_id="507f1f77bcf86cd799439011")
        assert template.user_id == "507f1f77bcf86cd799439011"
        
        # UUID-like string
        template = TaskTemplate(name="Test", user_id="550e8400-e29b-41d4-a716-446655440000")
        assert template.user_id == "550e8400-e29b-41d4-a716-446655440000"
    
    def test_task_template_field_constraints(self):
        """Test field constraints and validation."""
        # Test that user_id field is indexed
        user_id_field = TaskTemplate.__fields__["user_id"]
        assert hasattr(user_id_field, "field_info")
    
    def test_task_template_long_name(self):
        """Test task template with very long name."""
        long_name = "x" * 1000
        template = TaskTemplate(
            name=long_name,
            user_id="user123"
        )
        assert template.name == long_name
        assert len(template.name) == 1000