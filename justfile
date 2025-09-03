# Chanze Project Task Runner

set shell := ["bash", "-c"]
set dotenv-load

# Project directories
frontend_dir := "chanze-frontend"
supabase_dir := "chanze-supabase"

# Docker compose files
compose_files := "-f docker-compose.yml -f ./dev/docker-compose.dev.yml"

# Default recipe - show available commands
default:
    @echo "Chanze Development Commands"
    @echo "=========================="
    @echo ""
    @just --list

# Start the full development environment
dev-full: supabase-up frontend-dev

# Stop the full development environment
dev-stop: supabase-down

# Clean restart of entire environment
dev-restart: supabase-down-clean supabase-up

# Supabase container management
supabase-up:
    #!/usr/bin/env bash
    echo "Starting Supabase containers..."
    cd {{supabase_dir}} && docker compose {{compose_files}} up

supabase-up-detached:
    #!/usr/bin/env bash
    echo "Starting Supabase containers in background..."
    cd {{supabase_dir}} && docker compose {{compose_files}} up -d

supabase-down:
    #!/usr/bin/env bash
    echo "Stopping Supabase containers..."
    cd {{supabase_dir}} && docker compose {{compose_files}} down

supabase-down-clean:
    #!/usr/bin/env bash
    echo "Stopping Supabase containers and cleaning volumes..."
    cd {{supabase_dir}} && docker compose {{compose_files}} down -v --remove-orphans

supabase-logs service="":
    #!/usr/bin/env bash
    cd {{supabase_dir}}
    if [ -z "{{service}}" ]; then
        docker compose {{compose_files}} logs -f
    else
        docker compose {{compose_files}} logs -f {{service}}
    fi

supabase-status:
    #!/usr/bin/env bash
    echo "Checking Supabase container status..."
    cd {{supabase_dir}} && docker compose {{compose_files}} ps

supabase-reset: supabase-down
    #!/usr/bin/env bash
    echo "Resetting Supabase environment..."
    cd {{supabase_dir}} && ./reset.sh

# Frontend development commands
frontend-dev:
    #!/usr/bin/env bash
    echo "Starting frontend development server..."
    cd {{frontend_dir}} && npm run dev

frontend-dev-host host="0.0.0.0":
    #!/usr/bin/env bash
    echo "Starting frontend development server on {{host}}..."
    cd {{frontend_dir}} && npm run dev -- --host {{host}}

frontend-build:
    #!/usr/bin/env bash
    echo "Building frontend for production..."
    cd {{frontend_dir}} && npm run build

frontend-lint:
    #!/usr/bin/env bash
    echo "Running frontend linter..."
    cd {{frontend_dir}} && npm run lint

frontend-lint-fix:
    #!/usr/bin/env bash
    echo "Running frontend linter with auto-fix..."
    cd {{frontend_dir}} && npm run lint -- --fix

frontend-preview: frontend-build
    #!/usr/bin/env bash
    echo "Starting preview server..."
    cd {{frontend_dir}} && npm run preview

frontend-clean:
    #!/usr/bin/env bash
    echo "Cleaning frontend build artifacts..."
    cd {{frontend_dir}} && rm -rf dist node_modules/.vite

# Package management
frontend-install:
    #!/usr/bin/env bash
    echo "Installing frontend dependencies..."
    cd {{frontend_dir}} && npm install

frontend-update:
    #!/usr/bin/env bash
    echo "Updating frontend dependencies..."
    cd {{frontend_dir}} && npm update

# Development workflow commands
setup: frontend-install supabase-up-detached
    @echo "Development environment setup complete!"
    @echo "Frontend dev server: just dev"
    @echo "View logs: just logs"

teardown: supabase-down-clean frontend-clean
    @echo "Environment cleaned up!"

# Health checks
health-check:
    #!/usr/bin/env bash
    echo "Checking development environment health..."
    echo ""
    echo "Supabase containers:"
    cd {{supabase_dir}} && docker compose {{compose_files}} ps
    echo ""
    echo "Frontend dependencies:"
    cd {{frontend_dir}} && npm list --depth=0 2>/dev/null || echo "Run 'just frontend-install' first"

# Convenient aliases
alias up := supabase-up
alias up-bg := supabase-up-detached
alias down := supabase-down
alias clean := supabase-down-clean
alias reset := supabase-reset
alias logs := supabase-logs
alias status := supabase-status
alias dev := frontend-dev
alias build := frontend-build
alias lint := frontend-lint
alias preview := frontend-preview
alias install := frontend-install