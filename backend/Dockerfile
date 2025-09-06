# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry using the official installer
RUN curl -sSL https://install.python-poetry.org | python3 - && \
    echo 'export PATH="/root/.local/bin:$PATH"' >> ~/.bashrc

# Add Poetry to PATH
ENV PATH="/root/.local/bin:$PATH"

# Configure Poetry - disable virtual environment creation
ENV POETRY_NO_INTERACTION=1 \
    POETRY_VENV_IN_PROJECT=false \
    POETRY_CACHE_DIR=/tmp/poetry_cache \
    POETRY_VENV_CREATE=false

# Copy Poetry configuration files
COPY pyproject.toml poetry.lock* ./

# Configure Poetry and install dependencies globally
RUN poetry config virtualenvs.create false && \
    poetry install --only=main --no-root && \
    rm -rf $POETRY_CACHE_DIR

# Copy application code
COPY . .

# Verify uvicorn is available
RUN which uvicorn && uvicorn --version

# Expose port
EXPOSE 8000

# Default command
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]