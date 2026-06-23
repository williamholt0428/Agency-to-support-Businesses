"""
LeadFlow AI — Email Sender.

Sends emails via configured provider (Gmail API, SMTP, or mock).
For the prototype, uses mock mode. Production would integrate with real providers.
"""

from __future__ import annotations

import logging
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
        body: Email body text.
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
        return await _send_smtp(to_email, from_email, subject, body)
    else:
        logger.warning(f"Unknown provider '{provider}', falling back to mock")
        return _send_mock(to_email, subject, body)


def _send_mock(to_email: str, subject: str, body: str) -> dict[str, Any]:
    """Mock email sending for development and testing."""
    logger.info(f"[MOCK] Sending email to {to_email}: subject='{subject[:50]}...'")
    return {
        "success": True,
        "message_id": f"<mock-{id(to_email)}-{id(subject)}@leadflow.ai>",
        "sent_at": __import__("datetime").datetime.utcnow().isoformat() + "Z",
        "provider": "mock",
    }


async def _send_gmail(
    to_email: str,
    from_email: str,
    subject: str,
    body: str,
    config: dict[str, Any] | None,
) -> dict[str, Any]:
    """
    Send via Gmail API.
    Requires valid OAuth2 tokens in provider_config.
    """
    # Placeholder — would use google-auth + google-api-python-client
    raise NotImplementedError(
        "Gmail integration requires OAuth2 setup. "
        "Set LEADFLOW_GMAIL_CLIENT_ID and LEADFLOW_GMAIL_CLIENT_SECRET env vars."
    )


async def _send_smtp(
    to_email: str,
    from_email: str,
    subject: str,
    body: str,
) -> dict[str, Any]:
    """
    Send via SMTP.
    Requires LEADFLOW_SMTP_HOST, LEADFLOW_SMTP_USER, LEADFLOW_SMTP_PASSWORD env vars.
    """
    # Placeholder — would use smtplib + email.mime
    raise NotImplementedError(
        "SMTP integration requires SMTP server configuration. "
        "Set LEADFLOW_SMTP_HOST, LEADFLOW_SMTP_USER, LEADFLOW_SMTP_PASSWORD env vars."
    )