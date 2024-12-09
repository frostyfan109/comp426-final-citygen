from fastapi import Request
from fastapi_mail import FastMail, ConnectionConfig, MessageSchema

from app.models import UserModel
from app.settings import settings

mail_conf = ConnectionConfig(
    MAIL_USERNAME=settings.mail_username,
    MAIL_PASSWORD=settings.mail_password,
    MAIL_FROM=settings.mail_from,
    MAIL_PORT=settings.mail_port,
    MAIL_SERVER=settings.mail_server,
    MAIL_FROM_NAME=settings.mail_from_name,
    MAIL_STARTTLS=settings.mail_starttls,
    MAIL_SSL_TLS=settings.mail_ssl_tls
) if settings.mail_enabled else None

fast_mail = FastMail(mail_conf) if settings.mail_enabled else None

async def send_reset_password_email(user: UserModel, token: str, request: Request):
    if not settings.mail_enabled: return

    origin = f"{ request.url.scheme}://{ request.url.hostname }"
    if request.url.port: origin += f":{ request.url.port }"

    reset_link = f"{ origin }/api/v1/auth/reset-password/{ token }"
    await fast_mail.send_message(MessageSchema(
        subject="Password Reset Request",
        recipients=[user.email],
        body=f"Click the following link to reset your password: { reset_link }",
        subtype="html"
    ))