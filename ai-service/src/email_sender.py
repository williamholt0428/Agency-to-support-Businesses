"""
LeadFlow AI — Email Sender.

Sends emails via configured provider (Gmail API, SMTP, or mock).
Now includes real SMTP support using standard library (smtplib + email).
"""

from __future__ import annotations

import asyncio
import logging
import smtplib
import ssl
from datetime import datetime
from email.message import EmailMessage
from typing import Any

from .config import settings

logger = logging.getLogger(__name__)


async def send_email(
    to_name: str,
    to_email: str,
    from_name: str,
    from_email: str,
    subject: str,
    body: str,
    provider: str = "",
    provider_config: dict[str, Any] | None = None,
    lead_id: str = "",
    campaign_step_id: str = "",
) -> dict[str, Any]:
    """
    Send an email and return the result.

    Args:
        to_name: Recipient's name.
        to_email: Recipient's email address.
        from_name: Sender's display name.
        from_email: Sender's email address.
        subject: Email subject line.
        body: Email body (plain text or HTML).
        provider: 'gmail', 'smtp', or 'mock'.
        provider_config: Provider-specific config (tokens, credentials).
        lead_id: Lead identifier for logging.
        campaign_step_id: Campaign step identifier for logging.

    Returns:
        Dict with success status, message_id, sent_at, and provider used.
    """
    provider = provider or settings.email_provider

    if provider == "mock":
        return _send_mock(to_email, subject, body)
    elif provider == "gmail":
        return await _send_gmail(to_email, from_email, subject, body, provider_config)
    elif provider == "smtp":
        return await _send_smtp(to_email, from_email, subject, body, from_name, to_name)
    else:
        logger.warning(f"Unknown provider '{provider}', falling back to mock")
        return _send_mock(to_email, subject, body)


def _send_mock(to_email: str, subject: str, body: str) -> dict[str, Any]:
    """Mock email sending for development and testing."""
    logger.info(f"[MOCK] Sending email to {to_email}: subject='{subject[:50]}...'")
    return {
        "success": True,
        "message_id": f"<mock-{hash(to_email + subject)}@leadflow.ai>",
        "sent_at": datetime.utcnow().isoformat() + "Z",
        "provider": "mock",
    }


async def _send_smtp(
    to_email: str,
    from_email: str,
    subject: str,
    body: str,
    from_name: str = "",
    to_name: str = "",
) -> dict[str, Any]:
    """
    Send email via SMTP with STARTTLS (recommended) or SSL.
    Uses environment variables from config:
      LEADFLOW_SMTP_HOST, LEADFLOW_SMTP_PORT, LEADFLOW_SMTP_USER, LEADFLOW_SMTP_PASSWORD
    """
    if not settings.smtp_host or not settings.smtp_user or not settings.smtp_password:
        error_msg = (
            "SMTP not configured. Set LEADFLOW_SMTP_HOST, LEADFLOW_SMTP_USER, "
            "and LEADFLOW_SMTP_PASSWORD environment variables."
        )
        logger.error(error_msg)
        return {
            "success": False,
            "error": error_msg,
            "provider": "smtp",
        }

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = f"{from_name} <{from_email}>" if from_name else from_email
    msg["To"] = f"{to_name} <{to_email}>" if to_name else to_email

    # Detect if body contains HTML
    if "<html" in body.lower() or "<body" in body.lower() or "<p>" in body.lower():
        msg.set_content("Please view this email in an HTML-capable client.")
        msg.add_alternative(body, subtype="html")
    else:
        msg.set_content(body)

    smtp_port = settings.smtp_port
    use_ssl = smtp_port in (465, 2465)  # Common SSL ports

    try:
        if use_ssl:
            context = ssl.create_default_context()
            server = smtplib.SMTP_SSL(settings.smtp_host, smtp_port, context=context)
        else:
            server = smtplib.SMTP(settings.smtp_host, smtp_port, timeout=30)
            server.starttls(context=ssl.create_default_context())

        server.login(settings.smtp_user, settings.smtp_password)
        server.send_message(msg)
        server.quit()

        message_id = msg.get("Message-ID") or f"<{hash(subject + to_email)}@leadflow.ai>"
        logger.info(f"Email sent successfully via SMTP to {to_email}")

        return {
            "success": True,
            "message_id": message_id,
            "sent_at": datetime.utcnow().isoformat() + "Z",
            "provider": "smtp",
        }

    except smtplib.SMTPAuthenticationError:
        error = "SMTP authentication failed. Check LEADFLOW_SMTP_USER and LEADFLOW_SMTP_PASSWORD."
        logger.error(error)
        return {"success": False, "error": error, "provider": "smtp"}
    except smtplib.SMTPConnectError as e:
        error = f"Failed to connect to SMTP server {settings.smtp_host}:{smtp_port}: {str(e)}"
        logger.error(error)
        return {"success": False, "error": error, "provider": "smtp"}
    except Exception as e:
        logger.exception(f"SMTP send failed to {to_email}")
        return {
            "success": False,
            "error": f"SMTP error: {str(e)}",
            "provider": "smtp",
        }


async def _send_gmail(
    to_email: str,
    from_email: str,
    subject: str,
    body: str,
    config: dict[str, Any] | None,
) -> dict[str, Any]:
    """
    Send via Gmail API (OAuth2). Not yet implemented.
    Recommendation: Use 'smtp' provider with smtp.gmail.com:587 + App Password.
    """
    error_msg = (
        "Gmail API (OAuth2) integration is not yet implemented. "
        "Use LEADFLOW_EMAIL_PROVIDER=smtp with smtp.gmail.com:587 and a Gmail App Password instead."
    )
    logger.warning(error_msg)
    return {
        "success": False,
        "error": error_msg,
        "provider": "gmail",
    }


async def test_smtp_connection() -> dict[str, Any]:
    """
    Lightweight test to validate SMTP configuration and connectivity without sending an email.
    Used by the /api/test-email endpoint.
    """
    if settings.email_provider != "smtp":
        return {
            "success": True,
            "status": "ready",
            "provider": settings.email_provider,
            "message": f"Provider '{settings.email_provider}' selected (no SMTP validation needed)",
        }

    if not settings.smtp_host or not settings.smtp_user or not settings.smtp_password:
        return {
            "success": False,
            "status": "not_configured",
            "provider": "smtp",
            "error": "SMTP credentials not configured. Set LEADFLOW_SMTP_HOST, LEADFLOW_SMTP_USER, and LEADFLOW_SMTP_PASSWORD.",
        }

    smtp_port = settings.smtp_port
    use_ssl = smtp_port in (465, 2465)

    try:
        if use_ssl:
            context = ssl.create_default_context()
            server = smtplib.SMTP_SSL(settings.smtp_host, smtp_port, timeout=10)
        else:
            server = smtplib.SMTP(settings.smtp_host, smtp_port, timeout=10)
            server.starttls(context=ssl.create_default_context())

        server.login(settings.smtp_user, settings.smtp_password)
        server.quit()

        logger.info(f"SMTP test successful to {settings.smtp_host}:{smtp_port}")
        return {
            "success": True,
            "status": "ready",
            "provider": "smtp",
            "host": settings.smtp_host,
            "port": smtp_port,
            "message": "SMTP connection validated successfully (Gmail App Password accepted)",
        }

    except smtplib.SMTPAuthenticationError:
        error = "SMTP authentication failed. For Gmail, this usually means you are using your regular password instead of an App Password. Enable 2FA and generate one at https://myaccount.google.com/apppasswords."
        logger.error(error)
        return {
            "success": False,
            "status": "auth_failed",
            "error": error,
            "provider": "smtp",
        }
    except Exception as e:
        logger.exception("SMTP test failed")
        return {
            "success": False,
            "status": "connection_failed",
            "error": str(e),
            "provider": "smtp",
            "host": settings.smtp_host,
        }
