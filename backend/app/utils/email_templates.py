from jinja2 import Template


EMAIL_VERIFICATION_TEMPLATE = Template("""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Verify Your Email Address</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; }
        .header { text-align: center; margin-bottom: 30px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to {{ app_name }}!</h1>
        </div>
        
        <p>Hello,</p>
        
        <p>Thank you for signing up for {{ app_name }}. To complete your registration, please verify your email address by clicking the button below:</p>
        
        <div style="text-align: center;">
            <a href="{{ verification_link }}" class="button">Verify Email Address</a>
        </div>
        
        <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #007bff;">{{ verification_link }}</p>
        
        <p><strong>This link will expire in 24 hours.</strong></p>
        
        <p>If you didn't create an account with {{ app_name }}, you can safely ignore this email.</p>
        
        <div class="footer">
            <p>Best regards,<br>The {{ app_name }} Team</p>
        </div>
    </div>
</body>
</html>
""")

PASSWORD_RESET_TEMPLATE = Template("""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reset Your Password</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; }
        .header { text-align: center; margin-bottom: 30px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
        .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset Request</h1>
        </div>
        
        <p>Hello,</p>
        
        <p>You requested to reset your password for your {{ app_name }} account. Click the button below to create a new password:</p>
        
        <div style="text-align: center;">
            <a href="{{ reset_link }}" class="button">Reset Password</a>
        </div>
        
        <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #dc3545;">{{ reset_link }}</p>
        
        <div class="warning">
            <strong>Important:</strong> This link will expire in 1 hour for security reasons.
        </div>
        
        <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
        
        <div class="footer">
            <p>Best regards,<br>The {{ app_name }} Team</p>
        </div>
    </div>
</body>
</html>
""")


def render_email_verification(app_name: str, verification_link: str) -> tuple[str, str]:
    """Render email verification template"""
    subject = f"Verify Your Email Address - {app_name}"
    html_body = EMAIL_VERIFICATION_TEMPLATE.render(
        app_name=app_name,
        verification_link=verification_link
    )
    return subject, html_body


def render_password_reset(app_name: str, reset_link: str) -> tuple[str, str]:
    """Render password reset template"""
    subject = f"Reset Your Password - {app_name}"
    html_body = PASSWORD_RESET_TEMPLATE.render(
        app_name=app_name,
        reset_link=reset_link
    )
    return subject, html_body