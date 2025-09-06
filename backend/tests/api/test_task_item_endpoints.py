import pytest
from httpx import AsyncClient
from app.models.task_item import TaskItem


@pytest.mark.api
class TestTaskItemEndpoints:
    """API tests for task item endpoints."""

    @pytest.mark.asyncio
    async def test_create_task_item_success(self, async_client: AsyncClient, auth_headers, clean_db):
        """Test successful task item creation."""
        item_data = {
            "name": "My Test Task"
        }
        
        response = await async_client.post(
            "/api/v1/task-items", 
            json=item_data, 
            headers=auth_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "My Test Task"
        assert "id" in data
        assert "created_at" in data
        assert "updated_at" in data
        assert data["template_id"] is None

    @pytest.mark.asyncio
    async def test_create_task_item_with_template(self, async_client: AsyncClient, auth_headers, test_task_template):
        """Test task item creation with template association."""
        item_data = {
            "name": "Template Task",
            "template_id": str(test_task_template.id)
        }
        
        response = await async_client.post(
            "/api/v1/task-items", 
            json=item_data, 
            headers=auth_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Template Task"
        assert data["template_id"] == str(test_task_template.id)

    @pytest.mark.asyncio
    async def test_create_task_item_unauthorized(self, async_client: AsyncClient, clean_db):
        """Test task item creation without authentication."""
        item_data = {
            "name": "Test Task"
        }
        
        response = await async_client.post("/api/v1/task-items", json=item_data)
        
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_create_task_item_validation_error(self, async_client: AsyncClient, auth_headers, clean_db):
        """Test task item creation with validation errors."""
        # Empty name
        item_data = {
            "name": ""
        }
        
        response = await async_client.post(
            "/api/v1/task-items", 
            json=item_data, 
            headers=auth_headers
        )
        
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_get_task_items_empty(self, async_client: AsyncClient, auth_headers, clean_db):
        """Test getting task items when none exist."""
        response = await async_client.get("/api/v1/task-items", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
        assert data["total"] == 0
        assert data["skip"] == 0
        assert data["limit"] == 50

    @pytest.mark.asyncio
    async def test_get_task_items_with_data(self, async_client: AsyncClient, auth_headers, test_task_item):
        """Test getting task items with existing data."""
        response = await async_client.get("/api/v1/task-items", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["total"] == 1
        assert data["items"][0]["name"] == test_task_item.name

    @pytest.mark.asyncio
    async def test_get_task_items_filtered_by_template(
        self, 
        async_client: AsyncClient, 
        auth_headers, 
        test_task_template,
        test_user,
        clean_db
    ):
        """Test getting task items filtered by template."""
        template_id = str(test_task_template.id)
        
        # Create items with and without template
        item_with_template = TaskItem(
            name="With Template",
            user_id=str(test_user.id),
            template_id=template_id
        )
        await item_with_template.insert()
        
        item_without_template = TaskItem(
            name="Without Template",
            user_id=str(test_user.id),
            template_id=None
        )
        await item_without_template.insert()
        
        # Get items filtered by template
        response = await async_client.get(
            f"/api/v1/task-items?template_id={template_id}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["name"] == "With Template"
        assert data["items"][0]["template_id"] == template_id

    @pytest.mark.asyncio
    async def test_get_task_items_pagination(self, async_client: AsyncClient, auth_headers, test_user, clean_db):
        """Test task item pagination."""
        # Create multiple items
        for i in range(7):
            item = TaskItem(
                name=f"Task {i}",
                user_id=str(test_user.id)
            )
            await item.insert()
        
        # Test with limit and skip
        response = await async_client.get(
            "/api/v1/task-items?skip=2&limit=3", 
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 3
        assert data["skip"] == 2
        assert data["limit"] == 3
        assert data["total"] == 7

    @pytest.mark.asyncio
    async def test_get_task_item_success(self, async_client: AsyncClient, auth_headers, test_task_item):
        """Test getting a specific task item."""
        item_id = str(test_task_item.id)
        
        response = await async_client.get(
            f"/api/v1/task-items/{item_id}", 
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == item_id
        assert data["name"] == test_task_item.name

    @pytest.mark.asyncio
    async def test_get_task_item_not_found(self, async_client: AsyncClient, auth_headers, clean_db):
        """Test getting a non-existent task item."""
        fake_id = "507f1f77bcf86cd799439011"
        
        response = await async_client.get(
            f"/api/v1/task-items/{fake_id}", 
            headers=auth_headers
        )
        
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_get_task_item_unauthorized(self, async_client: AsyncClient, test_task_item):
        """Test getting a task item without authentication."""
        item_id = str(test_task_item.id)
        
        response = await async_client.get(f"/api/v1/task-items/{item_id}")
        
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_update_task_item_success(self, async_client: AsyncClient, auth_headers, test_task_item):
        """Test successful task item update."""
        item_id = str(test_task_item.id)
        update_data = {
            "name": "Updated Task Name"
        }
        
        response = await async_client.put(
            f"/api/v1/task-items/{item_id}",
            json=update_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Task Name"
        assert data["id"] == item_id

    @pytest.mark.asyncio
    async def test_update_task_item_template_association(
        self, 
        async_client: AsyncClient, 
        auth_headers, 
        test_task_item, 
        test_task_template
    ):
        """Test updating task item template association."""
        item_id = str(test_task_item.id)
        template_id = str(test_task_template.id)
        
        update_data = {
            "template_id": template_id
        }
        
        response = await async_client.put(
            f"/api/v1/task-items/{item_id}",
            json=update_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["template_id"] == template_id

    @pytest.mark.asyncio
    async def test_update_task_item_not_found(self, async_client: AsyncClient, auth_headers, clean_db):
        """Test updating a non-existent task item."""
        fake_id = "507f1f77bcf86cd799439011"
        update_data = {
            "name": "Updated Name"
        }
        
        response = await async_client.put(
            f"/api/v1/task-items/{fake_id}",
            json=update_data,
            headers=auth_headers
        )
        
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_update_task_item_validation_error(self, async_client: AsyncClient, auth_headers, test_task_item):
        """Test updating task item with validation errors."""
        item_id = str(test_task_item.id)
        update_data = {
            "name": ""  # Empty name should fail validation
        }
        
        response = await async_client.put(
            f"/api/v1/task-items/{item_id}",
            json=update_data,
            headers=auth_headers
        )
        
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_delete_task_item_success(self, async_client: AsyncClient, auth_headers, test_task_item):
        """Test successful task item deletion."""
        item_id = str(test_task_item.id)
        
        response = await async_client.delete(
            f"/api/v1/task-items/{item_id}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data

    @pytest.mark.asyncio
    async def test_delete_task_item_not_found(self, async_client: AsyncClient, auth_headers, clean_db):
        """Test deleting a non-existent task item."""
        fake_id = "507f1f77bcf86cd799439011"
        
        response = await async_client.delete(
            f"/api/v1/task-items/{fake_id}",
            headers=auth_headers
        )
        
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_task_item_unauthorized(self, async_client: AsyncClient, test_task_item):
        """Test deleting task item without authentication."""
        item_id = str(test_task_item.id)
        
        response = await async_client.delete(f"/api/v1/task-items/{item_id}")
        
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_task_item_isolation_between_users(
        self, 
        async_client: AsyncClient, 
        multiple_test_users, 
        clean_db
    ):
        """Test that users can only access their own task items."""
        user1 = multiple_test_users[0]
        user2 = multiple_test_users[1]
        
        # Create task item for user1
        item1 = TaskItem(
            name="User 1 Task",
            user_id=str(user1.id)
        )
        await item1.insert()
        
        # Create auth headers for user2
        from app.core.security import create_access_token
        user2_token = create_access_token(data={"sub": str(user2.id)})
        user2_headers = {"Authorization": f"Bearer {user2_token}"}
        
        # User2 tries to access user1's task item
        response = await async_client.get(
            f"/api/v1/task-items/{str(item1.id)}",
            headers=user2_headers
        )
        
        assert response.status_code == 404  # Should not find user1's item

    @pytest.mark.asyncio
    async def test_query_parameter_validation(self, async_client: AsyncClient, auth_headers, clean_db):
        """Test query parameter validation."""
        # Test negative skip
        response = await async_client.get(
            "/api/v1/task-items?skip=-1",
            headers=auth_headers
        )
        assert response.status_code == 422
        
        # Test limit too high
        response = await async_client.get(
            "/api/v1/task-items?limit=1000",
            headers=auth_headers
        )
        assert response.status_code == 422
        
        # Test zero limit
        response = await async_client.get(
            "/api/v1/task-items?limit=0",
            headers=auth_headers
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_invalid_item_id_format(self, async_client: AsyncClient, auth_headers, clean_db):
        """Test with invalid item ID format."""
        invalid_id = "invalid-id-format"
        
        response = await async_client.get(
            f"/api/v1/task-items/{invalid_id}",
            headers=auth_headers
        )
        
        # Should return 404 or 422 depending on validation
        assert response.status_code in [404, 422]

    @pytest.mark.asyncio
    async def test_create_task_item_with_invalid_template(self, async_client: AsyncClient, auth_headers, clean_db):
        """Test creating task item with invalid template ID."""
        item_data = {
            "name": "Test Task",
            "template_id": "507f1f77bcf86cd799439011"  # Non-existent template
        }
        
        response = await async_client.post(
            "/api/v1/task-items", 
            json=item_data, 
            headers=auth_headers
        )
        
        # Should handle invalid template ID appropriately
        # The actual behavior depends on service implementation
        assert response.status_code in [201, 400, 404]