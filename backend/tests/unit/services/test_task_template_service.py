import pytest
from unittest.mock import AsyncMock, patch, Mock
from fastapi import HTTPException, status
from app.services.task_template_service import TaskTemplateService
from app.schemas.task_template import TaskTemplateCreate, TaskTemplateUpdate, TaskTemplateResponse
from app.models.task_template import TaskTemplate


@pytest.mark.unit
class TestTaskTemplateService:
    """Unit tests for TaskTemplateService."""
    
    @pytest.fixture
    def service(self):
        return TaskTemplateService()
    
    @pytest.fixture
    def sample_template_data(self):
        return TaskTemplateCreate(name="Test Template")
    
    def test_service_initialization(self, service):
        """Test service initialization."""
        assert isinstance(service, TaskTemplateService)
    
    @pytest.mark.asyncio
    async def test_create_template_success(self, service, sample_template_data):
        """Test successful template creation."""
        mock_template = Mock()
        mock_template.id = "template123"
        mock_template.name = "Test Template"
        mock_template.created_at = "2024-01-01T00:00:00Z"
        mock_template.updated_at = "2024-01-01T00:00:00Z"
        mock_template.insert = AsyncMock()
        
        with patch('app.services.task_template_service.TaskTemplate') as mock_template_class:
            mock_template_class.return_value = mock_template
            
            result = await service.create_template(sample_template_data, "user123")
            
            # Verify template was created
            mock_template_class.assert_called_once()
            mock_template.insert.assert_called_once()
            
            # Verify result
            assert isinstance(result, TaskTemplateResponse)
            assert result.id == "template123"
            assert result.name == "Test Template"
    
    @pytest.mark.asyncio
    async def test_get_template_success(self, service):
        """Test successful template retrieval."""
        mock_template = Mock()
        mock_template.id = "template123"
        mock_template.name = "Test Template"
        mock_template.user_id = "user123"
        mock_template.created_at = "2024-01-01T00:00:00Z"
        mock_template.updated_at = "2024-01-01T00:00:00Z"
        
        with patch('app.models.task_template.TaskTemplate.get', new_callable=AsyncMock) as mock_get:
            mock_get.return_value = mock_template
            
            result = await service.get_template("template123", "user123")
            
            mock_get.assert_called_once_with("template123")
            assert isinstance(result, TaskTemplateResponse)
            assert result.id == "template123"
            assert result.name == "Test Template"
    
    @pytest.mark.asyncio
    async def test_get_template_not_found(self, service):
        """Test template retrieval when template not found."""
        with patch('app.models.task_template.TaskTemplate.get', new_callable=AsyncMock) as mock_get:
            mock_get.return_value = None
            
            with pytest.raises(HTTPException) as exc_info:
                await service.get_template("nonexistent", "user123")
            
            assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
            assert "TEMPLATE_NOT_FOUND" in str(exc_info.value.detail)
    
    @pytest.mark.asyncio
    async def test_get_template_wrong_user(self, service):
        """Test template retrieval with wrong user."""
        mock_template = Mock()
        mock_template.user_id = "other_user"
        
        with patch('app.models.task_template.TaskTemplate.get', new_callable=AsyncMock) as mock_get:
            mock_get.return_value = mock_template
            
            with pytest.raises(HTTPException) as exc_info:
                await service.get_template("template123", "user123")
            
            assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
            assert "TEMPLATE_NOT_FOUND" in str(exc_info.value.detail)