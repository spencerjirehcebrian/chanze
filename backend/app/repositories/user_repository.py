from typing import Optional
from datetime import datetime, timedelta, UTC
from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self):
        super().__init__(User)

    async def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        return await self.get_by_field("email", email)

    async def get_by_verification_token(self, token: str) -> Optional[User]:
        """Get user by email verification token"""
        return await self.get_by_field("email_verification_token", token)

    async def get_by_reset_token(self, token: str) -> Optional[User]:
        """Get user by password reset token"""
        user = await self.get_by_field("password_reset_token", token)
        if user and user.password_reset_expires:
            # Handle timezone-aware comparison
            now_utc = datetime.now(UTC)
            reset_expires = user.password_reset_expires
            if reset_expires.tzinfo is None:
                reset_expires = reset_expires.replace(tzinfo=UTC)
            if reset_expires > now_utc:
                return user
        return None

    async def create_user(self, email: str, password_hash: str, verification_token: str) -> User:
        """Create a new user with verification token"""
        return await self.create(
            email=email,
            password_hash=password_hash,
            email_verification_token=verification_token,
            is_active=True,
            is_verified=False
        )

    async def verify_user(self, user: User) -> User:
        """Mark user as verified and clear verification token"""
        user.is_verified = True
        user.email_verification_token = None
        user.updated_at = datetime.now(UTC)
        await user.save()
        return user

    async def set_reset_token(self, user: User, reset_token: str, expires_hours: int = 1) -> User:
        """Set password reset token with expiration"""
        user.password_reset_token = reset_token
        user.password_reset_expires = datetime.now(UTC) + timedelta(hours=expires_hours)
        user.updated_at = datetime.now(UTC)
        await user.save()
        return user

    async def reset_password(self, user: User, new_password_hash: str) -> User:
        """Reset user password and clear reset token"""
        user.password_hash = new_password_hash
        user.password_reset_token = None
        user.password_reset_expires = None
        user.updated_at = datetime.now(UTC)
        await user.save()
        return user

    async def email_exists(self, email: str) -> bool:
        """Check if email already exists"""
        return await self.exists(email=email)