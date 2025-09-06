from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from typing import Optional
import os


class Settings(BaseSettings):
    # Database
    mongodb_url: str = "mongodb://localhost:27017/chanze"

    # JWT
    secret_key: str = "your-secret-key-here-change-in-production"
    access_token_expire_minutes: int = 1440  # 24 hours
    algorithm: str = "HS256"

    # Email
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_tls: bool = True
    from_email: str = "noreply@chanze.app"

    # Application
    app_name: str = "Chanze Task Management API"
    frontend_url: str = "http://localhost:3000"
    environment: str = "development"
    debug: bool = False

    # Security
    bcrypt_rounds: int = 12
    email_verification_expire_hours: int = 24
    password_reset_expire_hours: int = 1

    model_config = ConfigDict(
        env_file=[
            ".env.test",       # Highest priority (for tests)
            ".env.development", # Medium priority (for development) 
            ".env",            # Lowest priority (fallback)
        ]
    )


# Determine which env file to use based on environment
def get_env_file() -> str:
    """Get the appropriate env file based on environment."""
    if "pytest" in os.getenv("_", ""):
        return ".env.test"
    elif os.getenv("ENVIRONMENT") == "test":
        return ".env.test"
    elif os.getenv("ENVIRONMENT") == "development":
        return ".env.development" 
    else:
        return ".env"


settings = Settings(_env_file=get_env_file())
