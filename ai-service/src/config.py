"""
LeadFlow AI — Configuration module.

Loads all settings from environment variables with sensible defaults.
Never hardcode API keys — always use environment variables.
"""

from __future__ import annotations

import os
from enum import Enum

from pydantic_settings import BaseSettings


class LLMProvider(str, Enum):
    """Supported LLM providers."""
    OPENAI = "openai"
    MOCK = "mock"  # Local mock for dev/testing without API key


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # --- Server ---
    host: str = "127.0.0.1"
    port: int = 8001
    log_level: str = "info"

    # --- LLM Configuration ---
    llm_provider: LLMProvider = LLMProvider.MOCK
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    openai_max_tokens: int = 1024
    openai_temperature: float = 0.7

    # --- Email Provider ---
    email_provider: str = "mock"  # "gmail", "smtp", or "mock"
    gmail_client_id: str = ""
    gmail_client_secret: str = ""
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""

    # --- Feature Flags ---
    enable_mock_fallback: bool = True

    model_config = {"env_prefix": "LEADFLOW_", "case_sensitive": False}


# Global singleton
settings = Settings()

# Also check for plain OPENAI_API_KEY as fallback
if not settings.openai_api_key:
    settings.openai_api_key = os.environ.get("OPENAI_API_KEY", "")

# Auto-detect provider from key presence
if settings.openai_api_key and settings.llm_provider == LLMProvider.MOCK:
    settings.llm_provider = LLMProvider.OPENAI