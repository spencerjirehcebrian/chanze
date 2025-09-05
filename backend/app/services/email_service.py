import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
from typing import List, Optional
from app.config import settings
from app.utils.email_templates import render_email_verification, render_password_reset

logger = logging.getLogger(__name__)


class EmailService:
    def __init__(self):
        self.smtp_host = settings.smtp_host
        self.smtp_port = settings.smtp_port
        self.smtp_user = settings.smtp_user
        self.smtp_password = settings.smtp_password
        self.from_email = settings.from_email

    async def _send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None
    ) -> bool:
        """Send email using SMTP"""
        try:
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = self.from_email
            message["To"] = to_email

            # Add text part if provided
            if text_body:
                text_part = MIMEText(text_body, "plain")
                message.attach(text_part)

            # Add HTML part
            html_part = MIMEText(html_body, "html")
            message.attach(html_part)

            # Send email
            await aiosmtplib.send(
                message,
                hostname=self.smtp_host,
                port=self.smtp_port,
                start_tls=True,
                username=self.smtp_user,
                password=self.smtp_password,
            )

            logger.info(f"Email sent successfully to {to_email}")
            return True

        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False

    async def send_email_verification(self, to_email: str, verification_token: str) -> bool:
        """Send email verification email"""
        verification_link = f"{settings.frontend_url}/verify-email?token={verification_token}"
        
        subject, html_body = render_email_verification(
            app_name=settings.app_name,
            verification_link=verification_link
        )
        
        return await self._send_email(
            to_email=to_email,
            subject=subject,
            html_body=html_body
        )

    async def send_password_reset(self, to_email: str, reset_token: str) -> bool:
        """Send password reset email"""
        reset_link = f"{settings.frontend_url}/reset-password?token={reset_token}"
        
        subject, html_body = render_password_reset(
            app_name=settings.app_name,
            reset_link=reset_link
        )
        
        return await self._send_email(
            to_email=to_email,
            subject=subject,
            html_body=html_body
        )

    async def send_welcome_email(self, to_email: str) -> bool:
        """Send welcome email after successful verification"""
        subject = f"Welcome to {settings.app_name}!"
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Welcome to {settings.app_name}</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }}
                .container {{ max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Welcome to {settings.app_name}!</h1>
                <p>Your email has been successfully verified and your account is now active.</p>
                <p>You can now start using all the features of {settings.app_name}.</p>
                <p>Best regards,<br>The {settings.app_name} Team</p>
            </div>
        </body>
        </html>
        """
        
        return await self._send_email(
            to_email=to_email,
            subject=subject,
            html_body=html_body
        )


# Global email service instance
email_service = EmailService()