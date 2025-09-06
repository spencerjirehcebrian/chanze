import pytest
from unittest.mock import AsyncMock, patch, Mock
from datetime import datetime
from app.repositories.task_template_repository import TaskTemplateRepository
from app.models.task_template import TaskTemplate


@pytest.mark.unit
class TestTaskTemplateRepository:
    """Unit tests for TaskTemplateRepository."""
    
    @pytest.fixture
    def repository(self):
        return TaskTemplateRepository()
    
    @pytest.fixture
    def sample_template(self):
        return TaskTemplate(
            name="Test Template",
            user_id="user123",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
    
    def test_repository_initialization(self, repository):
        """Test repository initialization."""
        assert repository.model == TaskTemplate
        assert isinstance(repository, TaskTemplateRepository)
    
    @pytest.mark.asyncio
    async def test_create_template(self, repository):
        """Test creating a new template."""
        with patch.object(repository, 'create', new_callable=AsyncMock) as mock_create:
            mock_template = Mock()
            mock_create.return_value = mock_template
            
            result = await repository.create_template(
                name="Test Template",
                user_id="user123"
            )
            
            mock_create.assert_called_once_with(
                name="Test Template",
                user_id="user123"
            )
            assert result == mock_template
    
    @pytest.mark.asyncio
    async def test_get_user_templates(self, repository):
        """Test getting user templates."""
        mock_query = Mock()
        mock_query.skip.return_value.limit.return_value.to_list = AsyncMock(return_value=["template1", "template2"])
        
        with patch.object(TaskTemplate, 'find', return_value=mock_query) as mock_find:
            result = await repository.get_user_templates("user123", skip=10, limit=20)
            
            mock_find.assert_called_once_with({"user_id": "user123"})
            mock_query.skip.assert_called_once_with(10)
            mock_query.skip.return_value.limit.assert_called_once_with(20)
            assert result == ["template1", "template2"]
    
    @pytest.mark.asyncio
    async def test_get_user_templates_default_params(self, repository):
        """Test getting user templates with default parameters."""
        mock_query = Mock()
        mock_query.skip.return_value.limit.return_value.to_list = AsyncMock(return_value=[])
        
        with patch.object(TaskTemplate, 'find', return_value=mock_query):
            await repository.get_user_templates("user123")
            
            mock_query.skip.assert_called_once_with(0)
            mock_query.skip.return_value.limit.assert_called_once_with(100)
    
    @pytest.mark.asyncio
    async def test_get_user_template_found(self, repository):
        """Test getting a specific user template when found."""
        mock_template = Mock()
        
        with patch.object(TaskTemplate, 'find_one', new_callable=AsyncMock) as mock_find_one:
            mock_find_one.return_value = mock_template
            
            result = await repository.get_user_template("template123", "user123")
            
            mock_find_one.assert_called_once_with({"_id": "template123", "user_id": "user123"})
            assert result == mock_template
    
    @pytest.mark.asyncio
    async def test_get_user_template_not_found(self, repository):
        """Test getting a specific user template when not found."""
        with patch.object(TaskTemplate, 'find_one', new_callable=AsyncMock) as mock_find_one:
            mock_find_one.return_value = None
            
            result = await repository.get_user_template("template123", "user123")
            
            mock_find_one.assert_called_once_with({"_id": "template123", "user_id": "user123"})
            assert result is None
    
    @pytest.mark.asyncio
    async def test_update_template_success(self, repository, sample_template):
        """Test updating a template successfully."""
        sample_template.save = AsyncMock()
        original_updated_at = sample_template.updated_at
        
        with patch.object(repository, 'get_user_template', new_callable=AsyncMock) as mock_get:
            mock_get.return_value = sample_template
            
            result = await repository.update_template(
                "template123", 
                "user123", 
                name="Updated Template"
            )
            
            mock_get.assert_called_once_with("template123", "user123")
            assert sample_template.name == "Updated Template"
            assert sample_template.updated_at > original_updated_at
            sample_template.save.assert_called_once()
            assert result == sample_template
    
    @pytest.mark.asyncio
    async def test_update_template_not_found(self, repository):
        """Test updating a template that doesn't exist."""
        with patch.object(repository, 'get_user_template', new_callable=AsyncMock) as mock_get:
            mock_get.return_value = None
            
            result = await repository.update_template(
                "template123", 
                "user123", 
                name="Updated Template"
            )
            
            mock_get.assert_called_once_with("template123", "user123")
            assert result is None
    
    @pytest.mark.asyncio
    async def test_update_template_invalid_field(self, repository, sample_template):
        """Test updating a template with invalid field."""
        sample_template.save = AsyncMock()
        
        with patch.object(repository, 'get_user_template', new_callable=AsyncMock) as mock_get:
            mock_get.return_value = sample_template
            
            result = await repository.update_template(
                "template123", 
                "user123", 
                invalid_field="value"
            )
            
            # Invalid field should be ignored
            assert not hasattr(sample_template, 'invalid_field')
            sample_template.save.assert_called_once()
            assert result == sample_template
    
    @pytest.mark.asyncio
    async def test_delete_user_template_success(self, repository, sample_template):
        """Test deleting a user template successfully."""
        sample_template.delete = AsyncMock()
        
        with patch.object(repository, 'get_user_template', new_callable=AsyncMock) as mock_get:
            mock_get.return_value = sample_template
            
            result = await repository.delete_user_template("template123", "user123")
            
            mock_get.assert_called_once_with("template123", "user123")
            sample_template.delete.assert_called_once()
            assert result is True
    
    @pytest.mark.asyncio
    async def test_delete_user_template_not_found(self, repository):
        """Test deleting a user template that doesn't exist."""
        with patch.object(repository, 'get_user_template', new_callable=AsyncMock) as mock_get:
            mock_get.return_value = None
            
            result = await repository.delete_user_template("template123", "user123")
            
            mock_get.assert_called_once_with("template123", "user123")
            assert result is False
    
    @pytest.mark.asyncio
    async def test_count_user_templates(self, repository):
        """Test counting user templates."""
        mock_query = Mock()
        mock_query.count = AsyncMock(return_value=5)
        
        with patch.object(TaskTemplate, 'find', return_value=mock_query) as mock_find:
            result = await repository.count_user_templates("user123")
            
            mock_find.assert_called_once_with({"user_id": "user123"})
            mock_query.count.assert_called_once()
            assert result == 5
    
    @pytest.mark.asyncio
    async def test_template_exists_true(self, repository):
        """Test checking if template exists when it does."""
        mock_query = Mock()
        mock_query.count = AsyncMock(return_value=1)
        
        with patch.object(TaskTemplate, 'find', return_value=mock_query) as mock_find:
            result = await repository.template_exists("template123", "user123")
            
            mock_find.assert_called_once_with({"_id": "template123", "user_id": "user123"})
            mock_query.count.assert_called_once()
            assert result is True
    
    @pytest.mark.asyncio
    async def test_template_exists_false(self, repository):
        """Test checking if template exists when it doesn't."""
        mock_query = Mock()
        mock_query.count = AsyncMock(return_value=0)
        
        with patch.object(TaskTemplate, 'find', return_value=mock_query) as mock_find:
            result = await repository.template_exists("template123", "user123")
            
            mock_find.assert_called_once_with({"_id": "template123", "user_id": "user123"})
            mock_query.count.assert_called_once()
            assert result is False