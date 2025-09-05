# Chanze Backend API

FastAPI backend service for Chanze - Email authentication & task management system.

## Features

- 🔐 **Email Authentication**: Registration, verification, login, password reset
- 📝 **Task Management**: Create and manage task templates and task items
- 🛡️ **Security**: JWT tokens, bcrypt password hashing, input validation
- 📧 **Email Service**: HTML email templates with SMTP support
- 🗄️ **MongoDB**: Document-based storage with Beanie ODM
- 🐳 **Docker**: Full containerization with docker-compose
- 📚 **API Documentation**: Interactive Swagger/OpenAPI docs

## Tech Stack

- **FastAPI** - Modern Python web framework
- **MongoDB** - Document database
- **Beanie** - Async ODM for MongoDB
- **JWT** - JSON Web Tokens for authentication
- **bcrypt** - Password hashing
- **SMTP** - Email service
- **Docker** - Containerization

## Quick Start

### Using Docker (Recommended)

1. **Clone and navigate to the backend directory**
2. **Copy environment template:**
   ```bash
   cp .env.example .env
   ```

3. **Configure environment variables in `.env`:**
   - Set your SMTP credentials for email functionality
   - Change the SECRET_KEY for production

4. **Start services:**
   ```bash
   docker-compose up -d
   ```

5. **API will be available at:**
   - API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs
   - MongoDB Admin: http://localhost:8081

### Local Development

1. **Prerequisites:**
   - Python 3.11+
   - MongoDB running locally

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run the application:**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

## API Endpoints

### Authentication (`/api/v1/auth`)

- `POST /auth/register` - Register new user
- `POST /auth/verify-email` - Verify email with token
- `POST /auth/login` - User login
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with token
- `GET /auth/me` - Get current user info

### Task Templates (`/api/v1/task-templates`)

- `GET /task-templates` - Get user's templates
- `POST /task-templates` - Create new template
- `GET /task-templates/{id}` - Get specific template
- `PUT /task-templates/{id}` - Update template
- `DELETE /task-templates/{id}` - Delete template

### Task Items (`/api/v1/task-items`)

- `GET /task-items` - Get user's task items (with optional template filter)
- `POST /task-items` - Create new task item
- `GET /task-items/{id}` - Get specific task item
- `PUT /task-items/{id}` - Update task item
- `DELETE /task-items/{id}` - Delete task item

## Authentication Flow

1. **Register** with email/password
2. **Verify email** using token from email
3. **Login** to get JWT access token
4. **Include JWT token** in Authorization header: `Bearer <token>`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URL` | MongoDB connection string | `mongodb://localhost:27017/chanze` |
| `SECRET_KEY` | JWT secret key | Required |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT token expiration | `1440` (24 hours) |
| `SMTP_HOST` | Email SMTP host | `smtp.gmail.com` |
| `SMTP_PORT` | Email SMTP port | `587` |
| `SMTP_USER` | Email username | Required |
| `SMTP_PASSWORD` | Email password | Required |
| `FROM_EMAIL` | Sender email address | `noreply@chanze.app` |
| `FRONTEND_URL` | Frontend URL for email links | `http://localhost:3000` |
| `DEBUG` | Enable debug mode | `false` |

## Database Schema

### Users Collection
```json
{
  "_id": "ObjectId",
  "email": "user@example.com",
  "password_hash": "bcrypt_hash",
  "is_active": true,
  "is_verified": false,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "email_verification_token": "token_string",
  "password_reset_token": "reset_token",
  "password_reset_expires": "2024-01-01T01:00:00Z"
}
```

### Task Templates Collection
```json
{
  "_id": "ObjectId",
  "name": "Daily Tasks",
  "user_id": "user_object_id",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### Task Items Collection
```json
{
  "_id": "ObjectId",
  "name": "Complete project",
  "user_id": "user_object_id",
  "template_id": "template_object_id",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

## Email Templates

The system includes HTML email templates for:
- **Email Verification**: Welcome email with verification link
- **Password Reset**: Password reset instructions
- **Welcome Email**: Sent after successful email verification

## Error Handling

All API errors follow a consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {
      "field": "field_name",
      "issue": "Specific issue description"
    }
  }
}
```

## Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with 12 rounds
- **Email Verification**: Required for account activation
- **Password Reset**: Time-limited reset tokens
- **Input Validation**: Pydantic schema validation
- **CORS**: Configurable cross-origin requests

## Development

### Project Structure

```
app/
├── main.py                 # FastAPI application entry point
├── config.py              # Configuration settings
├── dependencies.py        # FastAPI dependencies
├── api/v1/                # API version 1
│   ├── api.py             # API router
│   └── endpoints/         # API endpoints
├── core/                  # Core functionality
│   ├── database.py        # Database connection
│   └── security.py        # Security utilities
├── models/                # MongoDB models
├── schemas/               # Pydantic schemas
├── repositories/          # Data access layer
├── services/              # Business logic
└── utils/                 # Utility functions
```

### Adding New Features

1. **Create model** in `models/`
2. **Add schema** in `schemas/`
3. **Implement repository** in `repositories/`
4. **Add service logic** in `services/`
5. **Create endpoints** in `api/v1/endpoints/`
6. **Update router** in `api/v1/api.py`

## Production Deployment

### Security Checklist

- [ ] Change `SECRET_KEY` to a strong random value
- [ ] Set `DEBUG=false`
- [ ] Configure proper SMTP service
- [ ] Use MongoDB Atlas or dedicated instance
- [ ] Set up HTTPS with SSL certificates
- [ ] Configure proper CORS origins
- [ ] Set up logging and monitoring
- [ ] Use environment-specific configuration

### Docker Production

```bash
# Build production image
docker build -t chanze-api:latest .

# Run with production environment
docker run -d \
  --name chanze-api \
  -p 8000:8000 \
  --env-file .env.production \
  chanze-api:latest
```

## Testing

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest

# Run with coverage
pytest --cov=app
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.