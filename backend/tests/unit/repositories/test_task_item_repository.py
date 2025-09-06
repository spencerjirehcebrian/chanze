import pytest
from unittest.mock import AsyncMock, patch, Mock
from datetime import datetime
from app.repositories.task_item_repository import TaskItemRepository
from app.models.task_item import TaskItem


@pytest.mark.unit
class TestTaskItemRepository:
    """Unit tests for TaskItemRepository."""
    
    @pytest.fixture
    def repository(self):
        return TaskItemRepository()
    
    @pytest.fixture
    def sample_task_item(self):
        return TaskItem(
            name="Test Task",
            user_id="user123",
            template_id="template123",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
    
    def test_repository_initialization(self, repository):
        """Test repository initialization."""
        assert repository.model == TaskItem
        assert isinstance(repository, TaskItemRepository)
    
    @pytest.mark.asyncio
    async def test_create_item_with_template(self, repository):
        """Test creating a task item with template."""
        with patch.object(repository, 'create', new_callable=AsyncMock) as mock_create:
            mock_item = Mock()
            mock_create.return_value = mock_item
            
            result = await repository.create_item(
                name="Test Task",
                user_id="user123",
                template_id="template123"
            )
            
            mock_create.assert_called_once_with(
                name="Test Task",
                user_id="user123",
                template_id="template123"
            )
            assert result == mock_item
    
    @pytest.mark.asyncio
    async def test_create_item_without_template(self, repository):
        """Test creating a task item without template."""
        with patch.object(repository, 'create', new_callable=AsyncMock) as mock_create:
            mock_item = Mock()
            mock_create.return_value = mock_item
            
            result = await repository.create_item(
                name="Test Task",
                user_id="user123"
            )
            
            mock_create.assert_called_once_with(
                name="Test Task",
                user_id="user123",
                template_id=None
            )
            assert result == mock_item
    
    @pytest.mark.asyncio
    async def test_get_user_items_all(self, repository):
        """Test getting all user items."""
        mock_query = Mock()
        mock_query.skip.return_value.limit.return_value.to_list = AsyncMock(return_value=["item1", "item2"])
        
        with patch.object(TaskItem, 'find', return_value=mock_query) as mock_find:
            result = await repository.get_user_items("user123", skip=5, limit=10)
            
            mock_find.assert_called_once_with({"user_id": "user123"})
            mock_query.skip.assert_called_once_with(5)
            mock_query.skip.return_value.limit.assert_called_once_with(10)
            assert result == ["item1", "item2"]
    
    @pytest.mark.asyncio
    async def test_get_user_items_by_template(self, repository):
        """Test getting user items filtered by template."""
        mock_query = Mock()
        mock_query.skip.return_value.limit.return_value.to_list = AsyncMock(return_value=["item1"])
        
        with patch.object(TaskItem, 'find', return_value=mock_query) as mock_find:
            result = await repository.get_user_items(
                "user123", 
                template_id="template123", 
                skip=0, 
                limit=50
            )
            
            mock_find.assert_called_once_with({
                "user_id": "user123", 
                "template_id": "template123"
            })
            assert result == ["item1"]
    
    @pytest.mark.asyncio
    async def test_get_user_items_default_params(self, repository):
        """Test getting user items with default parameters."""
        mock_query = Mock()
        mock_query.skip.return_value.limit.return_value.to_list = AsyncMock(return_value=[])
        
        with patch.object(TaskItem, 'find', return_value=mock_query):
            await repository.get_user_items("user123")
            
            mock_query.skip.assert_called_once_with(0)
            mock_query.skip.return_value.limit.assert_called_once_with(50)
    
    @pytest.mark.asyncio
    async def test_get_user_item_found(self, repository):
        """Test getting a specific user item when found."""
        mock_item = Mock()
        
        with patch.object(TaskItem, 'find_one', new_callable=AsyncMock) as mock_find_one:
            mock_find_one.return_value = mock_item
            
            result = await repository.get_user_item("item123", "user123")
            
            mock_find_one.assert_called_once_with({"_id": "item123", "user_id": "user123"})
            assert result == mock_item
    
    @pytest.mark.asyncio
    async def test_get_user_item_not_found(self, repository):
        """Test getting a specific user item when not found."""
        with patch.object(TaskItem, 'find_one', new_callable=AsyncMock) as mock_find_one:
            mock_find_one.return_value = None
            
            result = await repository.get_user_item("item123", "user123")
            
            mock_find_one.assert_called_once_with({"_id": "item123", "user_id": "user123"})
            assert result is None
    
    @pytest.mark.asyncio
    async def test_update_item_success(self, repository, sample_task_item):
        """Test updating a task item successfully."""
        sample_task_item.save = AsyncMock()
        original_updated_at = sample_task_item.updated_at
        
        with patch.object(repository, 'get_user_item', new_callable=AsyncMock) as mock_get:
            mock_get.return_value = sample_task_item
            
            result = await repository.update_item(
                "item123", 
                "user123", 
                name="Updated Task"
            )
            
            mock_get.assert_called_once_with("item123", "user123")
            assert sample_task_item.name == "Updated Task"
            assert sample_task_item.updated_at > original_updated_at
            sample_task_item.save.assert_called_once()
            assert result == sample_task_item
    
    @pytest.mark.asyncio
    async def test_update_item_not_found(self, repository):
        """Test updating a task item that doesn't exist."""
        with patch.object(repository, 'get_user_item', new_callable=AsyncMock) as mock_get:
            mock_get.return_value = None
            
            result = await repository.update_item(
                "item123", 
                "user123", 
                name="Updated Task"
            )
            
            mock_get.assert_called_once_with("item123", "user123")
            assert result is None
    
    @pytest.mark.asyncio
    async def test_delete_user_item_success(self, repository, sample_task_item):
        """Test deleting a user item successfully."""
        sample_task_item.delete = AsyncMock()
        
        with patch.object(repository, 'get_user_item', new_callable=AsyncMock) as mock_get:
            mock_get.return_value = sample_task_item
            
            result = await repository.delete_user_item("item123", "user123")
            
            mock_get.assert_called_once_with("item123", "user123")
            sample_task_item.delete.assert_called_once()
            assert result is True
    
    @pytest.mark.asyncio
    async def test_delete_user_item_not_found(self, repository):
        """Test deleting a user item that doesn't exist."""
        with patch.object(repository, 'get_user_item', new_callable=AsyncMock) as mock_get:
            mock_get.return_value = None
            
            result = await repository.delete_user_item("item123", "user123")
            
            mock_get.assert_called_once_with("item123", "user123")
            assert result is False
    
    @pytest.mark.asyncio
    async def test_count_user_items_all(self, repository):
        """Test counting all user items."""
        mock_query = Mock()
        mock_query.count = AsyncMock(return_value=10)
        
        with patch.object(TaskItem, 'find', return_value=mock_query) as mock_find:
            result = await repository.count_user_items("user123")
            
            mock_find.assert_called_once_with({"user_id": "user123"})
            mock_query.count.assert_called_once()
            assert result == 10
    
    @pytest.mark.asyncio
    async def test_count_user_items_by_template(self, repository):
        """Test counting user items by template."""
        mock_query = Mock()
        mock_query.count = AsyncMock(return_value=5)
        
        with patch.object(TaskItem, 'find', return_value=mock_query) as mock_find:
            result = await repository.count_user_items("user123", template_id="template123")
            
            mock_find.assert_called_once_with({
                "user_id": "user123", 
                "template_id": "template123"
            })
            mock_query.count.assert_called_once()
            assert result == 5
    
    @pytest.mark.asyncio
    async def test_delete_items_by_template(self, repository):
        """Test deleting all items by template."""
        mock_item1 = Mock()
        mock_item1.delete = AsyncMock()
        mock_item2 = Mock()
        mock_item2.delete = AsyncMock()
        
        mock_query = Mock()
        mock_query.to_list = AsyncMock(return_value=[mock_item1, mock_item2])
        
        with patch.object(TaskItem, 'find', return_value=mock_query) as mock_find:
            result = await repository.delete_items_by_template("template123", "user123")
            
            mock_find.assert_called_once_with({
                "template_id": "template123", 
                "user_id": "user123"
            })
            mock_query.to_list.assert_called_once()
            mock_item1.delete.assert_called_once()
            mock_item2.delete.assert_called_once()
            assert result == 2
    
    @pytest.mark.asyncio
    async def test_delete_items_by_template_no_items(self, repository):
        """Test deleting items by template when no items exist."""
        mock_query = Mock()
        mock_query.to_list = AsyncMock(return_value=[])
        
        with patch.object(TaskItem, 'find', return_value=mock_query) as mock_find:
            result = await repository.delete_items_by_template("template123", "user123")
            
            mock_find.assert_called_once_with({
                "template_id": "template123", 
                "user_id": "user123"
            })
            assert result == 0
    
    @pytest.mark.asyncio
    async def test_item_exists_true(self, repository):
        """Test checking if item exists when it does."""
        mock_query = Mock()
        mock_query.count = AsyncMock(return_value=1)
        
        with patch.object(TaskItem, 'find', return_value=mock_query) as mock_find:
            result = await repository.item_exists("item123", "user123")
            
            mock_find.assert_called_once_with({"_id": "item123", "user_id": "user123"})
            mock_query.count.assert_called_once()
            assert result is True
    
    @pytest.mark.asyncio
    async def test_item_exists_false(self, repository):
        """Test checking if item exists when it doesn't."""
        mock_query = Mock()
        mock_query.count = AsyncMock(return_value=0)
        
        with patch.object(TaskItem, 'find', return_value=mock_query) as mock_find:
            result = await repository.item_exists("item123", "user123")
            
            mock_find.assert_called_once_with({"_id": "item123", "user_id": "user123"})
            mock_query.count.assert_called_once()
            assert result is False