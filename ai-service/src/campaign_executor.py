"""
LeadFlow AI — Campaign Execution Engine.

Executes campaign steps: personalizes messages for each lead,
sends them via the email provider, and returns results.
"""

from __future__ import annotations

import asyncio
import logging
import time
from typing import Any

from .email_sender import send_email
from .personalization_engine import CampaignContext, LeadData, generate_personalized_message

logger = logging.getLogger(__name__)


async def execute_campaign_step(
    campaign_id: str,
    campaign_name: str,
    step: dict[str, Any],
    leads: list[dict[str, Any]],
    batch_size: int = 50,
) -> dict[str, Any]:
    """
    Execute a single campaign step across a batch of leads.

    For each lead:
      1. Personalize the message using the step's template + lead data
      2. Send the email via the configured provider
      3. Collect results

    Args:
        campaign_id: UUID of the campaign.
        campaign_name: Human-readable campaign name.
        step: The campaign step to execute (has subject_template, body_template, etc.).
        leads: List of lead dicts to process.
        batch_size: Maximum leads to process in this call.

    Returns:
        Dict with processing results.
    """
    start_time = time.time()
    leads_to_process = leads[:batch_size]
    results: list[dict] = []
    errors: list[dict] = []

    # Build campaign context from step + campaign info
    campaign_context = CampaignContext(
        product_name="LeadFlow AI",
        product_description="AI sales rep that finds leads and automates outreach",
        value_proposition="Save sales teams 10+ hours per week on manual outreach",
        tone="professional-friendly",
    )

    for lead_data in leads_to_process:
        try:
            # Build lead data for personalization
            lead = LeadData(
                name=lead_data.get("name", ""),
                email=lead_data.get("email", ""),
                company=lead_data.get("company", ""),
                title=lead_data.get("title", ""),
                industry=lead_data.get("personalization_context", {}).get("industry", ""),
                linkedin_bio=lead_data.get("personalization_context", {}).get("linkedin_summary", ""),
            )

            # Personalize the message
            personalization = generate_personalized_message(
                lead=lead,
                campaign_context=campaign_context,
                step_number=step.get("step_order", 1),
                previous_messages=[],
            )

            if not personalization.get("success"):
                errors.append({
                    "lead_id": lead_data.get("id", ""),
                    "status": "failed",
                    "error": personalization.get("error", "Personalization failed"),
                })
                continue

            # Send the email
            send_result = await send_email(
                to_name=lead.name or "there",
                to_email=lead.email or "",
                from_name="Alex from LeadFlow",
                from_email="alex@leadflow.ai",
                subject=personalization["subject"],
                body=personalization["body"],
                lead_id=lead_data.get("id", ""),
                campaign_step_id=step.get("id", ""),
            )

            if send_result["success"]:
                results.append({
                    "lead_id": lead_data.get("id", ""),
                    "status": "sent",
                    "message_id": send_result.get("message_id", ""),
                    "personalized_subject": personalization["subject"],
                    "personalized_body": personalization["body"],
                    "error": None,
                })
            else:
                errors.append({
                    "lead_id": lead_data.get("id", ""),
                    "status": "failed",
                    "error": send_result.get("error", "Send failed"),
                })

        except Exception as e:
            logger.exception(f"Failed to process lead {lead_data.get('id', 'unknown')}")
            errors.append({
                "lead_id": lead_data.get("id", ""),
                "status": "failed",
                "error": str(e),
            })

    elapsed_ms = int((time.time() - start_time) * 1000)

    return {
        "success": True,
        "campaign_id": campaign_id,
        "processed": len(results) + len(errors),
        "results": results,
        "errors": errors,
        "processing_time_ms": elapsed_ms,
    }