import pytest
from httpx import AsyncClient
from app.models.task_template import TaskTemplate


@pytest.mark.api
class TestTaskTemplateEndpoints:
    """API tests for task template endpoints."""

    @pytest.mark.asyncio
    async def test_create_task_template_success(self, async_client: AsyncClient, auth_headers, clean_db):
        """Test successful task template creation."""
        template_data = {
            "name": "My Test Template"
        }
        
        response = await async_client.post(
            "/api/v1/task-templates", 
            json=template_data, 
            headers=auth_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "My Test Template"
        assert "id" in data
        assert "created_at" in data
        assert "updated_at" in data

    @pytest.mark.asyncio
    async def test_create_task_template_unauthorized(self, async_client: AsyncClient, clean_db):
        """Test task template creation without authentication."""
        template_data = {
            "name": "Test Template"
        }
        
        response = await async_client.post("/api/v1/task-templates", json=template_data)
        
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_create_task_template_validation_error(self, async_client: AsyncClient, auth_headers, clean_db):
        """Test task template creation with validation errors."""
        # Empty name
        template_data = {
            "name": ""
        }
        
        response = await async_client.post(
            "/api/v1/task-templates", 
            json=template_data, 
            headers=auth_headers
        )
        
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_get_task_templates_empty(self, async_client: AsyncClient, auth_headers, clean_db):
        """Test getting task templates when none exist."""
        response = await async_client.get("/api/v1/task-templates", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["templates"] == []
        assert data["total"] == 0
        assert data["skip"] == 0
        assert data["limit"] == 100

    @pytest.mark.asyncio
    async def test_get_task_templates_with_data(self, async_client: AsyncClient, auth_headers, test_task_template):
        """Test getting task templates with existing data."""
        response = await async_client.get("/api/v1/task-templates", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["templates"]) == 1
        assert data["total"] == 1
        assert data["templates"][0]["name"] == test_task_template.name

    @pytest.mark.asyncio
    async def test_get_task_templates_pagination(self, async_client: AsyncClient, auth_headers, test_user, clean_db):
        """Test task template pagination."""
        # Create multiple templates
        for i in range(5):
            template = TaskTemplate(
                name=f"Template {i}",
                user_id=str(test_user.id)
            )
            await template.insert()
        
        # Test with limit
        response = await async_client.get(
            "/api/v1/task-templates?skip=2&limit=2", 
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["templates"]) == 2
        assert data["skip"] == 2
        assert data["limit"] == 2
        assert data["total"] == 5

    @pytest.mark.asyncio
    async def test_get_task_template_success(self, async_client: AsyncClient, auth_headers, test_task_template):
        """Test getting a specific task template."""
        template_id = str(test_task_template.id)
        
        response = await async_client.get(
            f"/api/v1/task-templates/{template_id}", 
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == template_id
        assert data["name"] == test_task_template.name

    @pytest.mark.asyncio
    async def test_get_task_template_not_found(self, async_client: AsyncClient, auth_headers, clean_db):
        """Test getting a non-existent task template."""
        fake_id = "507f1f77bcf86cd799439011"
        
        response = await async_client.get(
            f"/api/v1/task-templates/{fake_id}", 
            headers=auth_headers
        )
        
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_get_task_template_unauthorized(self, async_client: AsyncClient, test_task_template):
        """Test getting a task template without authentication."""
        template_id = str(test_task_template.id)
        
        response = await async_client.get(f"/api/v1/task-templates/{template_id}")
        
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_update_task_template_success(self, async_client: AsyncClient, auth_headers, test_task_template):
        """Test successful task template update."""
        template_id = str(test_task_template.id)
        update_data = {
            "name": "Updated Template Name"
        }
        
        response = await async_client.put(
            f"/api/v1/task-templates/{template_id}",
            json=update_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Template Name"
        assert data["id"] == template_id

    @pytest.mark.asyncio
    async def test_update_task_template_not_found(self, async_client: AsyncClient, auth_headers, clean_db):
        """Test updating a non-existent task template."""
        fake_id = "507f1f77bcf86cd799439011"
        update_data = {
            "name": "Updated Name"
        }
        
        response = await async_client.put(
            f"/api/v1/task-templates/{fake_id}",
            json=update_data,
            headers=auth_headers
        )
        
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_update_task_template_validation_error(self, async_client: AsyncClient, auth_headers, test_task_template):
        """Test updating task template with validation errors."""
        template_id = str(test_task_template.id)
        update_data = {
            "name": ""  # Empty name should fail validation
        }
        
        response = await async_client.put(
            f"/api/v1/task-templates/{template_id}",
            json=update_data,
            headers=auth_headers
        )
        
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_delete_task_template_success(self, async_client: AsyncClient, auth_headers, test_task_template):
        """Test successful task template deletion."""
        template_id = str(test_task_template.id)
        
        response = await async_client.delete(
            f"/api/v1/task-templates/{template_id}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "deleted_items_count" in data

    @pytest.mark.asyncio
    async def test_delete_task_template_not_found(self, async_client: AsyncClient, auth_headers, clean_db):
        """Test deleting a non-existent task template."""
        fake_id = "507f1f77bcf86cd799439011"
        
        response = await async_client.delete(
            f"/api/v1/task-templates/{fake_id}",
            headers=auth_headers
        )
        
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_task_template_unauthorized(self, async_client: AsyncClient, test_task_template):
        """Test deleting task template without authentication."""
        template_id = str(test_task_template.id)
        
        response = await async_client.delete(f"/api/v1/task-templates/{template_id}")
        
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_task_template_isolation_between_users(
        self, 
        async_client: AsyncClient, 
        multiple_test_users, 
        clean_db
    ):
        """Test that users can only access their own templates."""
        user1 = multiple_test_users[0]
        user2 = multiple_test_users[1]
        
        # Create template for user1
        template1 = TaskTemplate(
            name="User 1 Template",
            user_id=str(user1.id)
        )
        await template1.insert()
        
        # Create auth headers for user2
        from app.core.security import create_access_token
        user2_token = create_access_token(data={"sub": user2.email, "user_id": str(user2.id)})
        user2_headers = {"Authorization": f"Bearer {user2_token}"}
        
        # User2 tries to access user1's template
        response = await async_client.get(
            f"/api/v1/task-templates/{str(template1.id)}",
            headers=user2_headers
        )
        
        assert response.status_code == 404  # Should not find user1's template

    @pytest.mark.asyncio
    async def test_query_parameter_validation(self, async_client: AsyncClient, auth_headers, clean_db):
        """Test query parameter validation."""
        # Test negative skip
        response = await async_client.get(
            "/api/v1/task-templates?skip=-1",
            headers=auth_headers
        )
        assert response.status_code == 422
        
        # Test limit too high
        response = await async_client.get(
            "/api/v1/task-templates?limit=1000",
            headers=auth_headers
        )
        assert response.status_code == 422
        
        # Test zero limit
        response = await async_client.get(
            "/api/v1/task-templates?limit=0",
            headers=auth_headers
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_invalid_template_id_format(self, async_client: AsyncClient, auth_headers, clean_db):
        """Test with invalid template ID format."""
        invalid_id = "invalid-id-format"
        
        response = await async_client.get(
            f"/api/v1/task-templates/{invalid_id}",
            headers=auth_headers
        )
        
        # Should return 404 or 422 depending on validation
        assert response.status_code in [404, 422]