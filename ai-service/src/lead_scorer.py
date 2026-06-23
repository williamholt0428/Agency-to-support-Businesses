"""
LeadFlow AI — Lead Scoring Engine.

Assigns scores to leads based on fit, engagement, and behavior signals.
Flags "hot leads" that should be prioritized for immediate follow-up.
"""

from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)


def score_lead(
    lead: dict[str, Any],
    engagement_history: list[dict] | None = None,
) -> dict[str, Any]:
    """
    Compute a comprehensive score for a lead.

    Args:
        lead: Lead data dict (id, name, company, title, email, industry, etc.).
        engagement_history: List of past interactions (opens, clicks, replies).

    Returns:
        Dict with score, factors, and hot-lead flags.
    """
    if engagement_history is None:
        engagement_history = []

    factors: dict[str, float] = {}

    # 1. Title / role relevance
    factors["title_relevance"] = _score_title_relevance(lead.get("title", ""))

    # 2. Company fit (based on size, industry match)
    factors["company_fit"] = _score_company_fit(
        lead.get("company", ""),
        lead.get("industry", ""),
    )

    # 3. Engagement level
    factors["engagement_level"] = _score_engagement(engagement_history)

    # 4. Industry match (generic — could be customized per campaign)
    factors["industry_match"] = _score_industry_match(lead.get("industry", ""))

    # 5. Decision-maker probability
    factors["decision_maker_probability"] = _score_decision_maker(
        lead.get("title", ""),
    )

    # Weighted composite score (0-1)
    weights = {
        "title_relevance": 0.25,
        "company_fit": 0.20,
        "engagement_level": 0.30,
        "industry_match": 0.10,
        "decision_maker_probability": 0.15,
    }

    composite_score = sum(
        factors[k] * weights.get(k, 0.0) for k in factors
    )

    # Determine if hot lead
    hot_lead = False
    hot_reason = ""

    # High engagement signals
    if factors["engagement_level"] >= 0.7:
        for event in engagement_history:
            event_type = event.get("type", "")
            content = event.get("content", "").lower()
            if event_type == "reply":
                # Check for buying signals in reply content
                buying_signals = [
                    "demo", "interested", "tell me more", "pricing",
                    "book", "meeting", "call", "let's talk", "yes",
                    "schedule", "sign up", "trial",
                ]
                if any(signal in content for signal in buying_signals):
                    hot_lead = True
                    hot_reason = "Explicit interest expressed in reply"
                    break
                # Out of office check
                ooo_signals = [
                    "out of office", "vacation", "away", "on leave",
                    "not in the office",
                ]
                if any(signal in content for signal in ooo_signals):
                    # Reduce score for OOO
                    composite_score *= 0.5
                    hot_reason = "Out-of-office auto-reply detected"
                    break

    if composite_score >= 0.8 and not hot_lead:
        hot_lead = True
        hot_reason = "High overall score — strong fit detected"

    return {
        "score": round(composite_score, 4),
        "score_factors": factors,
        "hot_lead": hot_lead,
        "hot_reason": hot_reason,
    }


def _score_title_relevance(title: str) -> float:
    """Score how relevant a job title is for buying decisions."""
    title_lower = title.lower()

    # Executive / C-level
    c_level_keywords = ["ceo", "cto", "cfo", "coo", "cmo", "chief", "vp", "vice president",
                        "head of", "director", "founder", "co-founder", "owner"]
    for kw in c_level_keywords:
        if kw in title_lower:
            return 0.95

    # Manager-level / decision-influencer
    manager_keywords = ["manager", "lead", "senior", "staff", "principal", "team lead"]
    for kw in manager_keywords:
        if kw in title_lower:
            return 0.75

    # IC / unclear
    ic_keywords = ["engineer", "developer", "analyst", "associate", "coordinator"]
    for kw in ic_keywords:
        if kw in title_lower:
            return 0.40

    return 0.50  # Neutral default


def _score_company_fit(company: str, industry: str) -> float:
    """Score company fit (simplified — no external enrichment in prototype)."""
    # In production: enrich with Clearbit / Apollo / similar
    # For now, default to medium fit
    score = 0.60

    # Bonus for known SaaS-relevant industries
    high_fit_industries = [
        "saas", "software", "technology", "cloud", "devtools",
        "developer tools", "b2b", "enterprise software",
    ]
    if any(ind in industry.lower() for ind in high_fit_industries):
        score += 0.20

    return min(score, 1.0)


def _score_engagement(events: list[dict]) -> float:
    """Score engagement level based on interaction history."""
    if not events:
        return 0.10  # No engagement

    score = 0.0
    weights = {
        "sent": 0.0,
        "opened": 0.15,
        "clicked": 0.30,
        "replied_positive": 0.80,
        "replied_neutral": 0.40,
        "replied_negative": 0.0,
        "replied": 0.45,
        "bounced": -0.20,
        "unsubscribed": -0.50,
    }

    for event in events:
        event_type = event.get("type", "")
        w = weights.get(event_type, 0.0)
        score += w

    return max(0.0, min(score, 1.0))


def _score_industry_match(industry: str) -> float:
    """Score how well the industry matches B2B SaaS ideal profile."""
    ideal = [
        "saas", "software", "technology", "cloud computing",
        "information technology", "computer software", "internet",
    ]
    if any(ind in industry.lower() for ind in ideal):
        return 0.80

    good = [
        "financial services", "healthcare", "e-commerce",
        "professional services", "consulting", "education technology",
    ]
    if any(ind in industry.lower() for ind in good):
        return 0.65

    return 0.50


def _score_decision_maker(title: str) -> float:
    """Score probability that this person is a decision maker."""
    title_lower = title.lower()

    # Direct budget authority
    high = ["ceo", "cto", "cfo", "founder", "co-founder", "owner", "president",
            "vp of", "vice president of", "head of", "chief"]
    for kw in high:
        if kw in title_lower:
            return 0.95

    # Influencer
    med = ["director of", "manager of", "lead", "team lead"]
    for kw in med:
        if kw in title_lower:
            return 0.75

    return 0.40