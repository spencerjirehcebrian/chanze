# Chanze Task Management App - Justfile
# Run `just --list` to see all available commands

# Default recipe - show help
default:
    @just --list

# =============================================================================
# Docker Compose Commands
# =============================================================================

# Start all services in development mode
up:
    docker-compose up -d 

# Start all services and follow logs
up-logs:
    docker-compose up

# Stop all services
down:
    docker-compose down

# Stop all services and remove volumes (DESTRUCTIVE)
down-clean:
    docker-compose down -v --remove-orphans

# Restart all services
restart:
    docker-compose restart

# View logs for all services
logs:
    docker-compose logs -f

# View logs for specific service
logs-service service:
    docker-compose logs -f {{service}}

# =============================================================================
# Build Commands
# =============================================================================

# Build all Docker images
build:
    docker-compose build

# Build specific service
build-service service:
    docker-compose build {{service}}

# Build without cache
build-clean:
    docker-compose build --no-cache

# Pull latest base images and rebuild
rebuild:
    docker-compose pull
    docker-compose build --no-cache
    docker-compose up -d

# =============================================================================
# Development Commands
# =============================================================================

# Install backend dependencies locally
install-backend:
    cd backend && pip install -r requirements.txt

# Install frontend dependencies locally
install-frontend:
    cd frontend && npm install

# Install all dependencies locally
install-all: install-backend install-frontend

# Run backend locally (requires MongoDB running)
dev-backend:
    cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Run frontend locally
dev-frontend:
    cd frontend && npm run dev

# Format backend code
format-backend:
    cd backend && python -m black . && python -m isort .

# Lint backend code
lint-backend:
    cd backend && python -m flake8 . && python -m mypy .

# Format frontend code
format-frontend:
    cd frontend && npm run lint

# =============================================================================
# Database Commands
# =============================================================================

# Connect to MongoDB shell
db-shell:
    docker-compose exec mongodb mongosh -u admin -p password123 --authenticationDatabase admin chanze

# Import sample data
db-import:
    @echo "Add your data import commands here"

# Backup database
db-backup:
    docker-compose exec mongodb mongodump -u admin -p password123 --authenticationDatabase admin --db chanze --out /tmp/backup
    docker-compose cp mongodb:/tmp/backup ./backups/$(date +%Y%m%d_%H%M%S)

# Reset database (DESTRUCTIVE)
db-reset:
    docker-compose exec mongodb mongosh -u admin -p password123 --authenticationDatabase admin chanze --eval "db.dropDatabase()"
    docker-compose restart mongodb

# =============================================================================
# Email & External Services
# =============================================================================

# Open MailPit web interface
mailpit:
    @echo "Opening Mailpit at http://localhost:8025"
    open http://localhost:8025 || xdg-open http://localhost:8025

# Open Mongo Express web interface
mongo-express:
    @echo "Opening Mongo Express at http://localhost:8081"
    open http://localhost:8081 || xdg-open http://localhost:8081

# Open frontend application
app:
    @echo "Opening application at http://localhost:3000"
    open http://localhost:3000 || xdg-open http://localhost:3000

# Open backend API docs
api-docs:
    @echo "Opening API documentation at http://localhost:8000/docs"
    open http://localhost:8000/docs || xdg-open http://localhost:8000/docs

# =============================================================================
# Testing Commands
# =============================================================================

# Run backend tests
test-backend:
    cd backend && python -m pytest -v

# Run backend tests with coverage
test-backend-coverage:
    cd backend && python -m pytest -v --cov=. --cov-report=html

# Run frontend tests
test-frontend:
    cd frontend && npm test

# Run all tests
test-all: test-backend test-frontend



# =============================================================================
# Cleanup Commands
# =============================================================================

# Remove unused Docker images and containers
clean-docker:
    docker system prune -f

# Remove all Docker volumes (DESTRUCTIVE)
clean-volumes:
    docker volume prune -f

# Clean everything (DESTRUCTIVE)
clean-all:
    docker-compose down -v --remove-orphans
    docker system prune -af
    docker volume prune -f

# Remove node_modules and Python cache
clean-deps:
    rm -rf frontend/node_modules
    find backend -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
    find backend -name "*.pyc" -delete 2>/dev/null || true

# =============================================================================
# Status & Monitoring Commands
# =============================================================================

# Show status of all services
status:
    docker-compose ps

# Show resource usage
stats:
    docker stats

# Health check all services
health:
    @echo "Checking service health..."
    @echo "Backend API:"
    @curl -s http://localhost:8000/health || echo "Backend not responding"
    @echo "Frontend:"
    @curl -s http://localhost:3000 > /dev/null && echo "Frontend OK" || echo "Frontend not responding"
    @echo "MongoDB:"
    @docker-compose exec mongodb mongosh -u admin -p password123 --authenticationDatabase admin --quiet --eval "print('MongoDB OK')" || echo "MongoDB not responding"
    @echo "Mailpit:"
    @curl -s http://localhost:8025 > /dev/null && echo "Mailpit OK" || echo "Mailpit not responding"

# =============================================================================
# Utility Commands
# =============================================================================

# Generate requirements.txt from pyproject.toml
generate-requirements:
    cd backend && pip-compile pyproject.toml --output-file requirements.txt

# Update dependencies
update-deps:
    cd backend && pip install --upgrade pip && pip install -r requirements.txt --upgrade
    cd frontend && npm update

# Create a new migration (customize as needed)
migration name:
    @echo "Creating migration: {{name}}"
    # Add your migration creation logic here

# Setup development environment from scratch
setup:
    @echo "Setting up Chanze development environment..."
    just build
    just up
    @echo "Waiting for services to start..."
    sleep 10
    just health
    @echo "Setup complete! Run 'just app' to open the application"

# =============================================================================
# Documentation Commands
# =============================================================================

# Generate API documentation
docs-api:
    @echo "API docs available at http://localhost:8000/docs"
    just api-docs

# Show project info
info:
    @echo "Chanze Task Management Application"
    @echo "Frontend: React + TypeScript (Port 3000)"
    @echo "Backend: FastAPI + Python (Port 8000)"
    @echo "Database: MongoDB (Port 27017)"
    @echo "Email: MailHog (Port 8025)"
    @echo "DB Admin: Mongo Express (Port 8081)"
    @echo ""
    @echo "Quick start: just setup"
    @echo "Run 'just --list' for all commands"