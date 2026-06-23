"""
LeadFlow AI — Personalization Engine.

Takes lead data (name, company, role, context) and generates
personalized outreach messages using an LLM (or mock fallback).
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any

from .config import LLMProvider, settings

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Pydantic-like models for type safety (avoiding pydantic dep in engine)
# ---------------------------------------------------------------------------

class LeadData:
    """Information about a lead."""

    def __init__(
        self,
        name: str = "",
        email: str = "",
        company: str = "",
        title: str = "",
        industry: str = "",
        linkedin_bio: str = "",
        company_description: str = "",
    ):
        self.name = name
        self.email = email
        self.company = company
        self.title = title
        self.industry = industry
        self.linkedin_bio = linkedin_bio
        self.company_description = company_description

    def to_dict(self) -> dict[str, str]:
        return {
            "name": self.name,
            "email": self.email,
            "company": self.company,
            "title": self.title,
            "industry": self.industry,
            "linkedin_bio": self.linkedin_bio,
            "company_description": self.company_description,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "LeadData":
        return cls(
            name=data.get("name", ""),
            email=data.get("email", ""),
            company=data.get("company", ""),
            title=data.get("title", ""),
            industry=data.get("industry", ""),
            linkedin_bio=data.get("linkedin_bio", ""),
            company_description=data.get("company_description", ""),
        )


class CampaignContext:
    """Information about the campaign/product being promoted."""

    def __init__(
        self,
        product_name: str = "",
        product_description: str = "",
        value_proposition: str = "",
        tone: str = "professional-friendly",
    ):
        self.product_name = product_name
        self.product_description = product_description
        self.value_proposition = value_proposition
        self.tone = tone

    def to_dict(self) -> dict[str, str]:
        return {
            "product_name": self.product_name,
            "product_description": self.product_description,
            "value_proposition": self.value_proposition,
            "tone": self.tone,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "CampaignContext":
        return cls(
            product_name=data.get("product_name", ""),
            product_description=data.get("product_description", ""),
            value_proposition=data.get("value_proposition", ""),
            tone=data.get("tone", "professional-friendly"),
        )


# ---------------------------------------------------------------------------
# The LLM client wrapper
# ---------------------------------------------------------------------------

class LLMClient:
    """Thin wrapper around the LLM provider."""

    def __init__(self):
        self.provider = settings.llm_provider
        self._openai_client = None

    def _get_openai_client(self):
        if self._openai_client is None:
            import openai
            self._openai_client = openai.OpenAI(api_key=settings.openai_api_key)
        return self._openai_client

    def complete(self, system_prompt: str, user_prompt: str) -> str:
        """Send a completion request to the LLM and return the text response."""
        if self.provider == LLMProvider.OPENAI:
            return self._openai_complete(system_prompt, user_prompt)
        else:
            return self._mock_complete(system_prompt, user_prompt)

    def _openai_complete(self, system_prompt: str, user_prompt: str) -> str:
        try:
            client = self._get_openai_client()
            response = client.chat.completions.create(
                model=settings.openai_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                max_tokens=settings.openai_max_tokens,
                temperature=settings.openai_temperature,
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            logger.error(f"OpenAI API call failed: {e}")
            if settings.enable_mock_fallback:
                logger.warning("Falling back to mock response")
                return self._mock_complete(system_prompt, user_prompt)
            raise

    def _mock_complete(self, system_prompt: str, user_prompt: str) -> str:
        """Generate a plausible mock response without an API call."""
        # Extract lead name from user prompt
        name_match = re.search(r'"name":\s*"([^"]+)"', user_prompt)
        name = name_match.group(1) if name_match else "there"

        company_match = re.search(r'"company":\s*"([^"]+)"', user_prompt)
        company = company_match.group(1) if company_match else "your company"

        product_match = re.search(r'"product_name":\s*"([^"]+)"', user_prompt)
        product = product_match.group(1) if product_match else "our product"

        # Generate contextual mock output
        return json.dumps({
            "subject": f"Helping {company} scale their outreach",
            "body": (
                f"Hi {name},\n\n"
                f"I've been following {company}'s work in the space and "
                f"thought I'd reach out. We've been helping similar teams "
                f"streamline their sales outreach with {product}.\n\n"
                f"Would you be open to a quick chat next week to see if "
                f"there's a fit?\n\n"
                f"Best,\nAlex"
            ),
        })


# Global LLM client instance
_llm_client: LLMClient | None = None


def get_llm_client() -> LLMClient:
    global _llm_client
    if _llm_client is None:
        _llm_client = LLMClient()
    return _llm_client


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def generate_personalized_message(
    lead: LeadData,
    campaign_context: CampaignContext,
    step_number: int = 1,
    previous_messages: list[dict] | None = None,
) -> dict[str, Any]:
    """
    Generate a personalized outreach message for a lead.

    Args:
        lead: Information about the lead.
        campaign_context: Context about the campaign/product.
        step_number: Which step in the sequence (1 = first touch).
        previous_messages: Previous messages in the thread (for follow-ups).

    Returns:
        Dict with 'subject', 'body', 'personalization_score', etc.
    """
    llm = get_llm_client()

    system_prompt = (
        "You are an expert B2B sales outreach writer for a company called "
        f"{campaign_context.product_name}. {campaign_context.product_description}. "
        f"Value proposition: {campaign_context.value_proposition}. "
        f"Tone: {campaign_context.tone}. "
        "Write concise, personalized, human-sounding outreach messages. "
        "Never sound like spam. Use the lead's specific context to show you've done research. "
        "Keep subject lines under 60 characters. Keep body under 150 words. "
        "Output ONLY valid JSON with keys 'subject' and 'body'."
    )

    user_prompt = json.dumps({
        "lead": lead.to_dict(),
        "campaign_context": campaign_context.to_dict(),
        "step_number": step_number,
        "previous_messages": previous_messages or [],
    })

    raw_response = llm.complete(system_prompt, user_prompt)

    # Parse JSON from response (handle potential wrapping)
    try:
        # Try to extract JSON if the LLM wraps it in markdown
        json_match = re.search(r'\{.*\}', raw_response, re.DOTALL)
        if json_match:
            result = json.loads(json_match.group(0))
        else:
            result = json.loads(raw_response)
    except (json.JSONDecodeError, AttributeError):
        logger.warning(f"Failed to parse LLM response as JSON: {raw_response[:200]}")
        # Fallback to mock
        fallback = _generate_fallback_message(lead, campaign_context, step_number)
        result = {"subject": fallback[0], "body": fallback[1]}

    # Ensure expected keys
    subject = result.get("subject", "")
    body = result.get("body", "")

    if not body:
        fallback = _generate_fallback_message(lead, campaign_context, step_number)
        subject = fallback[0]
        body = fallback[1]

    return {
        "success": True,
        "subject": subject,
        "body": body,
        "personalization_score": _compute_personalization_score(lead, body),
        "model_used": settings.openai_model if settings.llm_provider == LLMProvider.OPENAI else "mock",
        "tokens_used": 0,  # Would need token counting for real usage
    }


def _generate_fallback_message(
    lead: LeadData,
    ctx: CampaignContext,
    step_number: int,
) -> tuple[str, str]:
    """Generate a template-based fallback message."""
    name = lead.name or "there"
    company = lead.company or "your company"
    product = ctx.product_name or "our product"

    if step_number == 1:
        subject = f"Quick question about {company}"
        body = (
            f"Hi {name},\n\n"
            f"I noticed {company} is doing interesting work in {lead.industry or 'your space'}. "
            f"We built {product} to help teams like yours "
            f"{ctx.value_proposition.lower() or 'streamline their sales process'}.\n\n"
            f"Would you be open to a brief chat next week?\n\n"
            f"Best,\nAlex"
        )
    else:
        subject = f"Following up — {product} for {company}"
        body = (
            f"Hi {name},\n\n"
            f"Just following up on my previous message. "
            f"I'd love to show you how {product} can help {company} "
            f"{ctx.value_proposition.lower() or 'save time on outreach'}.\n\n"
            f"Would 15 minutes next week work?\n\n"
            f"Best,\nAlex"
        )

    return subject, body


def _compute_personalization_score(lead: LeadData, body: str) -> float:
    """
    Compute a heuristic score (0-1) for how personalized a message is.
    Higher = more personalization signals detected.
    """
    score = 0.3  # Base score
    body_lower = body.lower()

    # Check for name usage
    if lead.name and lead.name.lower().split()[0] in body_lower:
        score += 0.2

    # Check for company reference
    if lead.company and lead.company.lower() in body_lower:
        score += 0.2

    # Check for title/role reference
    if lead.title and lead.title.lower() in body_lower:
        score += 0.15

    # Check for industry mention
    if lead.industry and lead.industry.lower() in body_lower:
        score += 0.15

    return min(score, 1.0)