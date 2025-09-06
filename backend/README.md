# Chanze Backend API

> FastAPI backend for Chanze - A task management system with email authentication and template-based task organization.

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+**
- **Poetry** (for dependency management)
- **MongoDB** (local installation or Docker)
- **Git**

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd chanze/backend

# Install dependencies
poetry install

# Activate virtual environment
poetry shell
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

**Required Environment Variables:**
```env
# Database
MONGODB_URL=mongodb://localhost:27017/chanze

# JWT Security
SECRET_KEY=your-super-secret-jwt-key-change-in-production-must-be-at-least-32-characters
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Email (for authentication)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@chanze.app

# Application
FRONTEND_URL=http://localhost:3000
DEBUG=true
```

### 3. Database Setup

**Option A: Local MongoDB**
```bash
# Install MongoDB
brew install mongodb/brew/mongodb-community
brew services start mongodb/brew/mongodb-community
```

**Option B: Docker MongoDB**
```bash
# Run MongoDB container
docker run --name chanze-mongo -p 27017:27017 -d mongo:latest
```

### 4. Run the Application

```bash
# Development server with hot reload
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or using Python directly
poetry run python -m app.main
```

**API will be available at:**
- **API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## 📁 Project Structure

```
app/
├── api/v1/               # API endpoints
│   ├── endpoints/        # Route handlers
│   │   ├── auth.py       # Authentication routes
│   │   ├── task_templates.py
│   │   └── task_items.py
│   └── api.py           # API router configuration
├── core/                # Core functionality
│   ├── database.py      # MongoDB connection
│   └── security.py      # JWT, password hashing
├── models/              # Beanie ODM models
│   ├── user.py          # User document model
│   ├── task_template.py # Task template model
│   └── task_item.py     # Task item model
├── repositories/        # Data access layer
│   ├── base.py          # Base repository
│   ├── user_repository.py
│   ├── task_template_repository.py
│   └── task_item_repository.py
├── services/            # Business logic layer
│   ├── auth_service.py  # Authentication business logic
│   ├── email_service.py # Email sending service
│   ├── task_template_service.py
│   └── task_item_service.py
├── schemas/             # Pydantic schemas for API
│   ├── auth.py          # Authentication schemas
│   ├── user.py          # User response schemas
│   ├── task_template.py # Template schemas
│   └── task_item.py     # Task item schemas
├── utils/               # Utility functions
├── config.py            # Application configuration
├── dependencies.py      # FastAPI dependencies
└── main.py             # Application entry point

tests/
├── unit/               # Unit tests
│   ├── models/         # Model validation tests
│   ├── repositories/   # Repository logic tests
│   └── services/       # Service logic tests
├── integration/        # Integration tests
├── api/               # API endpoint tests
└── utils/             # Test utilities and fixtures
```

## 🏗️ Architecture Overview

The application follows **Clean Architecture** principles:

1. **API Layer** (`app/api/`) - FastAPI routes and request/response handling
2. **Service Layer** (`app/services/`) - Business logic and orchestration
3. **Repository Layer** (`app/repositories/`) - Data access abstraction
4. **Model Layer** (`app/models/`) - Data models using Beanie ODM

**Key Design Patterns:**
- **Repository Pattern** - Data access abstraction
- **Service Pattern** - Business logic encapsulation
- **Dependency Injection** - Loose coupling via FastAPI's DI system
- **Factory Pattern** - Test data factories for consistent testing

## 🔐 Authentication System

### User Registration Flow
1. **POST** `/api/v1/auth/register` - Register new user
2. Email verification sent to user
3. **POST** `/api/v1/auth/verify-email` - Verify email with token
4. User can now log in

### Login Flow
1. **POST** `/api/v1/auth/login` - Authenticate user
2. Returns JWT access token
3. Include token in `Authorization: Bearer <token>` header

### Password Reset Flow
1. **POST** `/api/v1/auth/forgot-password` - Request reset
2. **POST** `/api/v1/auth/reset-password` - Reset with token

## 📋 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/verify-email` - Email verification
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/forgot-password` - Password reset request
- `POST /api/v1/auth/reset-password` - Password reset
- `GET /api/v1/auth/me` - Get current user

### Task Templates
- `GET /api/v1/task-templates` - List user templates
- `POST /api/v1/task-templates` - Create template
- `GET /api/v1/task-templates/{id}` - Get template
- `PUT /api/v1/task-templates/{id}` - Update template
- `DELETE /api/v1/task-templates/{id}` - Delete template

### Task Items
- `GET /api/v1/task-items` - List user tasks
- `POST /api/v1/task-items` - Create task
- `GET /api/v1/task-items/{id}` - Get task
- `PUT /api/v1/task-items/{id}` - Update task
- `DELETE /api/v1/task-items/{id}` - Delete task

## 🧪 Testing

### Running Tests

```bash
# Run all tests
poetry run pytest

# Run with coverage
poetry run pytest --cov=app --cov-report=html

# Run specific test categories
poetry run pytest tests/unit/          # Unit tests only
poetry run pytest tests/integration/   # Integration tests only
poetry run pytest tests/api/          # API tests only

# Run with verbose output
poetry run pytest -v

# Run specific test file
poetry run pytest tests/unit/models/test_user.py -v
```

### Test Structure

- **Unit Tests** (`tests/unit/`) - Test individual components in isolation
  - Model validation and business logic
  - Repository methods with mocked database
  - Service methods with mocked dependencies

- **Integration Tests** (`tests/integration/`) - Test component interactions
  - Complete authentication flow
  - Task management workflows with real database

- **API Tests** (`tests/api/`) - Test HTTP endpoints
  - Request/response validation
  - Authentication and authorization
  - Error handling and edge cases

### Test Coverage

The test suite includes **80+ tests** covering:
- ✅ **Model validation** (Pydantic schema validation)
- ✅ **Repository layer** (Database operations)
- ✅ **Service layer** (Business logic)
- ✅ **API endpoints** (HTTP request/response)
- ✅ **Authentication & Authorization**
- ✅ **Error handling and edge cases**

**Target Coverage**: >85%

## 🛠️ Development Workflow

### Adding a New Feature

1. **Create Model** (if needed)
   ```python
   # app/models/new_model.py
   from beanie import Document
   
   class NewModel(Document):
       field: str
       
       class Settings:
           collection = "new_models"
   ```

2. **Create Repository**
   ```python
   # app/repositories/new_model_repository.py
   from app.repositories.base import BaseRepository
   from app.models.new_model import NewModel
   
   class NewModelRepository(BaseRepository[NewModel]):
       def __init__(self):
           super().__init__(NewModel)
   ```

3. **Create Service**
   ```python
   # app/services/new_model_service.py
   class NewModelService:
       def __init__(self):
           self.repo = NewModelRepository()
   ```

4. **Create API Schemas**
   ```python
   # app/schemas/new_model.py
   from pydantic import BaseModel
   
   class NewModelCreate(BaseModel):
       field: str
   ```

5. **Create API Endpoints**
   ```python
   # app/api/v1/endpoints/new_models.py
   from fastapi import APIRouter
   
   router = APIRouter(prefix="/new-models", tags=["new-models"])
   ```

6. **Write Tests**
   - Unit tests for each layer
   - Integration tests for workflows
   - API tests for endpoints

### Database Migrations

Beanie handles schema evolution automatically, but for major changes:

1. **Update Model** - Modify the model definition
2. **Migration Script** - Create migration if needed
3. **Test Migration** - Verify with test database

### Code Style

- **Format**: Use automatic formatting (built into most IDEs)
- **Type Hints**: Always use type hints
- **Docstrings**: Document public methods and classes
- **Error Handling**: Use FastAPI's HTTPException with consistent error format

## 🐳 Docker Development

### Using Docker

```bash
# Build image
docker build -t chanze-backend .

# Run with Docker Compose (if available)
docker-compose up -d

# Run container manually
docker run -d \
  --name chanze-backend \
  -p 8000:8000 \
  --env-file .env \
  chanze-backend
```

### Development with Docker

1. **MongoDB Container**:
   ```bash
   docker run --name chanze-mongo -p 27017:27017 -d mongo:latest
   ```

2. **Application Container**:
   ```bash
   docker build -t chanze-backend .
   docker run -p 8000:8000 --link chanze-mongo:mongo chanze-backend
   ```

## 🔧 Troubleshooting

### Common Issues

**1. MongoDB Connection Errors**
```bash
# Check if MongoDB is running
brew services list | grep mongodb
# or
docker ps | grep mongo

# Check connection string in .env
MONGODB_URL=mongodb://localhost:27017/chanze
```

**2. Poetry Dependencies**
```bash
# Clear cache and reinstall
poetry cache clear pypi --all
poetry install --no-cache
```

**3. Import Errors**
```bash
# Make sure you're in the poetry shell
poetry shell

# Or run with poetry prefix
poetry run python -m app.main
```

**4. Test Database Issues**
```bash
# Tests use separate test database
# Make sure MongoDB is running
# Tests automatically clean up data
```

**5. Email Configuration**
- Use **App Passwords** for Gmail (not regular password)
- Enable 2FA and generate app-specific password
- For development, you can disable email sending

### Environment Issues

**Python Version**
```bash
# Check Python version
python --version  # Should be 3.8+

# Check Poetry Python
poetry env info
```

**Port Conflicts**
```bash
# Check what's using port 8000
lsof -i :8000

# Use different port
uvicorn app.main:app --port 8001
```

## 📚 Additional Resources

### Documentation
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Beanie ODM Documentation](https://beanie-odm.dev/)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- [Poetry Documentation](https://python-poetry.org/docs/)

### Development Tools
- **API Testing**: Use `/docs` endpoint for interactive testing
- **Database GUI**: MongoDB Compass or Studio 3T
- **Code Editor**: VS Code with Python extension

### Learning Resources
- **Clean Architecture**: Understanding the layered approach
- **FastAPI Best Practices**: Async/await patterns
- **MongoDB with Python**: Beanie ODM patterns
- **JWT Authentication**: Token-based auth concepts

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Write tests** for your changes
4. **Ensure tests pass**: `poetry run pytest`
5. **Commit changes**: `git commit -m 'Add amazing feature'`
6. **Push to branch**: `git push origin feature/amazing-feature`
7. **Create Pull Request**

### Code Review Checklist

- [ ] Tests written and passing
- [ ] Code follows project structure
- [ ] API endpoints documented
- [ ] Error handling implemented
- [ ] Type hints included
- [ ] Security considerations addressed

---

## 🎯 Getting Help

**For new developers:**
1. **Start with Quick Start** - Get the basic setup running
2. **Explore API docs** - Visit `/docs` to understand endpoints
3. **Run tests** - Familiarize yourself with the test suite
4. **Read the code** - Start with `app/main.py` and follow imports

**Questions?** 
- Check existing issues in the repository
- Review API documentation at `/docs`
- Look at test files for usage examples

**Happy coding! 🚀**