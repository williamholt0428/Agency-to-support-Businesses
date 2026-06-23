"""
LeadFlow AI — Reply Handler.

Processes inbound email replies, generates contextual auto-responses,
detects buying signals, and flags hot leads.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any

from .config import settings
from .lead_scorer import score_lead
from .personalization_engine import LLMClient, get_llm_client

logger = logging.getLogger(__name__)

# Out-of-office detection patterns
OOO_PATTERNS = [
    "out of office", "out of the office", "on vacation", "on leave",
    "away from my desk", "not checking email", "will be back",
    "unavailable", "automatic reply", "auto-reply",
]

# Unsubscribe / negative patterns
NEGATIVE_PATTERNS = [
    "unsubscribe", "not interested", "stop emailing", "remove me",
    "spam", "do not contact", "leave me alone", "not a good fit",
    "please stop",
]

# Positive / buying signal patterns
POSITIVE_PATTERNS = [
    "interested", "tell me more", "demo", "pricing", "book a",
    "schedule", "call", "meeting", "let's talk", "yes please",
    "would love to", "sign me up", "trial", "see it", "show me",
    "sounds good", "free to chat", "good time to",
]


def handle_reply(
    original_email: dict[str, Any],
    incoming_reply: dict[str, Any],
    lead: dict[str, Any],
    campaign_context: dict[str, Any],
    thread_history: list[dict] | None = None,
) -> dict[str, Any]:
    """
    Process an incoming email reply and determine the appropriate response.

    Args:
        original_email: The last email sent to the lead.
        incoming_reply: The reply received from the lead.
        lead: Lead information.
        campaign_context: Campaign/product context.
        thread_history: Full email thread history.

    Returns:
        Dict with should_respond, response_body, lead_score, hot_lead flags.
    """
    reply_body = incoming_reply.get("body", "")
    reply_body_lower = reply_body.lower()

    # --- Detect out-of-office ---
    if _detect_ooo(reply_body_lower):
        lead_score_data = score_lead(lead)
        return {
            "success": True,
            "should_respond": False,
            "lead_score": lead_score_data["score"],
            "hot_lead": False,
            "reason": "Out-of-office auto-reply detected",
            "score_factors": lead_score_data["score_factors"],
        }

    # --- Detect unsubscribe / negative ---
    is_negative = _detect_negative(reply_body_lower)
    if is_negative:
        lead_score_data = score_lead(lead, [
            {"type": "replied_negative", "content": reply_body},
        ])
        return {
            "success": True,
            "should_respond": False,
            "lead_score": lead_score_data["score"],
            "hot_lead": False,
            "reason": "Negative response — lead requested no further contact",
            "score_factors": lead_score_data["score_factors"],
        }

    # --- Detect buying signals ---
    is_positive = _detect_positive(reply_body_lower)
    engagement_history = [{"type": "replied", "content": reply_body}]
    if is_positive:
        engagement_history = [{"type": "replied_positive", "content": reply_body}]

    # Score the lead
    lead_score_data = score_lead(lead, engagement_history)

    # If talking to a human with a substantive reply, generate auto-response
    if thread_history is None:
        thread_history = []

    llm = get_llm_client()
    response = _generate_reply(
        llm,
        original_email,
        incoming_reply,
        lead,
        campaign_context,
        thread_history,
    )

    suggested_action = "monitor"
    if is_positive:
        suggested_action = "book_demo"
    elif lead_score_data.get("hot_lead"):
        suggested_action = "priority_follow_up"

    return {
        "success": True,
        "should_respond": True,
        "response_subject": f"Re: {incoming_reply.get('subject', original_email.get('subject', ''))}",
        "response_body": response,
        "lead_score": lead_score_data["score"],
        "score_factors": lead_score_data.get("score_factors", {}),
        "hot_lead": lead_score_data.get("hot_lead", False),
        "hot_reason": lead_score_data.get("hot_reason", ""),
        "suggested_next_action": suggested_action,
    }


def _detect_ooo(body_lower: str) -> bool:
    """Detect if the reply is an out-of-office auto-reply."""
    for pattern in OOO_PATTERNS:
        if pattern in body_lower:
            return True
    return False


def _detect_negative(body_lower: str) -> bool:
    """Detect if the reply expresses disinterest."""
    for pattern in NEGATIVE_PATTERNS:
        if pattern in body_lower:
            return True
    return False


def _detect_positive(body_lower: str) -> bool:
    """Detect if the reply expresses interest."""
    for pattern in POSITIVE_PATTERNS:
        if pattern in body_lower:
            return True
    return False


def _generate_reply(
    llm: LLMClient,
    original_email: dict[str, Any],
    incoming_reply: dict[str, Any],
    lead: dict[str, Any],
    campaign_context: dict[str, Any],
    thread_history: list[dict],
) -> str:
    """Generate a contextual auto-response to the lead's reply."""
    system_prompt = (
        "You are an expert B2B sales representative handling an inbound reply. "
        f"Your company is {campaign_context.get('product_name', 'our company')}. "
        f"Description: {campaign_context.get('product_description', '')}. "
        f"Tone: {campaign_context.get('tone', 'professional-friendly')}. "
        "Write a natural, human-sounding response that addresses what the lead asked about. "
        "If they ask a question, answer it clearly. If they express interest, offer to book a demo. "
        "Keep responses under 120 words. Do NOT sound robotic or salesy."
    )

    user_prompt = json.dumps({
        "lead": {
            "name": lead.get("name", ""),
            "company": lead.get("company", ""),
            "title": lead.get("title", ""),
        },
        "our_last_message": original_email.get("body", ""),
        "their_reply": incoming_reply.get("body", ""),
        "campaign_context": campaign_context,
        "thread_history": thread_history[-5:] if thread_history else [],
    })

    raw = llm.complete(system_prompt, user_prompt)

    # Try to clean up any JSON wrapping
    try:
        parsed = json.loads(raw)
        if isinstance(parsed, dict) and "body" in parsed:
            return parsed["body"]
        if isinstance(parsed, dict) and "response" in parsed:
            return parsed["response"]
    except json.JSONDecodeError:
        pass

    return raw.strip()