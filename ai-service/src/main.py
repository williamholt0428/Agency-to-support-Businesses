"""
LeadFlow AI — FastAPI Application Server.

Main entry point for the AI microservice.
Provides endpoints used by the Node.js backend.
"""

from __future__ import annotations

import logging
import time
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .config import LLMProvider, settings
from .campaign_executor import execute_campaign_step
from .email_sender import send_email, test_smtp_connection
from .lead_scorer import score_lead
from .personalization_engine import CampaignContext, LeadData, generate_personalized_message
from .reply_handler import handle_reply

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# Track uptime
_start_time = time.time()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    provider_name = settings.llm_provider.value
    logger.info(f"LeadFlow AI Service starting — LLM provider: {provider_name}")
    if provider_name == "mock":
        logger.warning("Running in MOCK mode. Set LEADFLOW_OPENAI_API_KEY for real LLM.")
    yield
    logger.info("LeadFlow AI Service shutting down")


app = FastAPI(
    title="LeadFlow AI Service",
    version="0.1.0",
    description="AI engine for LeadFlow — personalization, email, reply handling, scoring",
    lifespan=lifespan,
)

# CORS — allow the Node.js backend to call this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Only exposed to backend on loopback
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Request/Response models as dicts (avoiding pydantic dependency in simple routes)
# ---------------------------------------------------------------------------

def _normalize_lead(raw: dict[str, Any]) -> LeadData:
    """Convert a raw dict to a LeadData object."""
    return LeadData.from_dict(raw)


def _normalize_context(raw: dict[str, Any]) -> CampaignContext:
    """Convert a raw dict to a CampaignContext object."""
    return CampaignContext.from_dict(raw)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@app.get("/api/ai-health")
async def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "leadflow-ai-service",
        "version": "0.1.0",
        "llm_available": settings.llm_provider != LLMProvider.MOCK,
        "llm_model": settings.openai_model,
        "uptime_seconds": int(time.time() - _start_time),
    }


@app.post("/api/personalize")
async def personalize(body: dict[str, Any]):
    """
    Generate a personalized outreach message for a lead.

    Request body:
        lead: LeadData dict
        campaign_context: CampaignContext dict
        step_number: int (optional, default 1)
        previous_messages: list (optional)
    """
    try:
        lead = _normalize_lead(body.get("lead", {}))
        context = _normalize_context(body.get("campaign_context", {}))
        step_number = body.get("step_number", 1)
        previous_messages = body.get("previous_messages", [])

        result = generate_personalized_message(
            lead=lead,
            campaign_context=context,
            step_number=step_number,
            previous_messages=previous_messages,
        )
        return result

    except Exception as e:
        logger.exception("Personalization failed")
        raise HTTPException(status_code=500, detail={
            "success": False,
            "error": f"Failed to generate message: {str(e)}",
        })


@app.post("/api/send-email")
async def send_email_endpoint(body: dict[str, Any]):
    """
    Send an email via configured provider.

    Request body:
        to: {name, email}
        from: {name, email}
        subject: str
        body: str
        provider: str (optional)
        provider_config: dict (optional)
        lead_id: str (optional)
        campaign_step_id: str (optional)
    """
    try:
        to = body.get("to", {})
        from_ = body.get("from", {})

        result = await send_email(
            to_name=to.get("name", ""),
            to_email=to.get("email", ""),
            from_name=from_.get("name", ""),
            from_email=from_.get("email", ""),
            subject=body.get("subject", ""),
            body=body.get("body", ""),
            provider=body.get("provider", ""),
            provider_config=body.get("provider_config"),
            lead_id=body.get("lead_id", ""),
            campaign_step_id=body.get("campaign_step_id", ""),
        )
        return result

    except NotImplementedError as e:
        raise HTTPException(status_code=501, detail={
            "success": False,
            "error": str(e),
        })
    except Exception as e:
        logger.exception("Send email failed")
        raise HTTPException(status_code=500, detail={
            "success": False,
            "error": f"Failed to send email: {str(e)}",
        })


@app.post("/api/handle-reply")
async def handle_reply_endpoint(body: dict[str, Any]):
    """
    Process an inbound reply and generate an auto-response if appropriate.

    Request body:
        original_email: {subject, body, sent_at}
        incoming_reply: {from, from_name, subject, body, received_at}
        lead: {id, name, company, title, email}
        campaign_context: {product_name, ...}
        thread_history: list (optional)
    """
    try:
        result = handle_reply(
            original_email=body.get("original_email", {}),
            incoming_reply=body.get("incoming_reply", {}),
            lead=body.get("lead", {}),
            campaign_context=body.get("campaign_context", {}),
            thread_history=body.get("thread_history"),
        )
        return result

    except Exception as e:
        logger.exception("Handle reply failed")
        raise HTTPException(status_code=500, detail={
            "success": False,
            "error": f"Failed to process reply: {str(e)}",
        })


@app.get("/api/leads/{lead_id}/score")
async def get_lead_score(lead_id: str, refresh: bool = False):
    """
    Get or compute the score for a lead.

    Args:
        lead_id: UUID of the lead.
        refresh: If true, re-compute score from scratch.
    """
    # In prototype — no persistent DB here. Returns a generic score.
    # Full implementation would query the backend DB for engagement history.
    try:
        result = score_lead(
            lead={"id": lead_id, "title": "", "company": "", "industry": ""},
            engagement_history=[],
        )
        return {
            "success": True,
            "lead_id": lead_id,
            "score": result["score"],
            "score_factors": result["score_factors"],
            "hot_lead": result.get("hot_lead", False),
            "hot_reason": result.get("hot_reason", ""),
            "last_scored_at": __import__("datetime").datetime.utcnow().isoformat() + "Z",
        }

    except Exception as e:
        logger.exception("Lead scoring failed")
        raise HTTPException(status_code=500, detail={
            "success": False,
            "error": f"Failed to score lead: {str(e)}",
        })


@app.post("/api/campaigns/execute")
async def execute_campaign(body: dict[str, Any]):
    """
    Execute the next step of a campaign for a batch of leads.

    Request body:
        campaign_id: str
        campaign_name: str
        step: {id, step_order, delay_days, subject_template, body_template}
        leads: list of lead dicts
        batch_size: int (optional, default 50)
    """
    try:
        batch_size = body.get("batch_size", 50)
        result = await execute_campaign_step(
            campaign_id=body.get("campaign_id", ""),
            campaign_name=body.get("campaign_name", ""),
            step=body.get("step", {}),
            leads=body.get("leads", []),
            batch_size=batch_size,
        )
        return result

    except Exception as e:
        logger.exception("Campaign execution failed")
        raise HTTPException(status_code=500, detail={
            "success": False,
            "error": f"Failed to execute campaign: {str(e)}",
        })


@app.post("/api/test-email")
async def test_email_endpoint():
    """
    Test endpoint to validate SMTP configuration and connectivity.
    Does NOT send any real email. Returns ready/not_configured/auth_failed states.
    """
    try:
        result = await test_smtp_connection()
        if not result.get("success", False):
            raise HTTPException(status_code=400, detail=result)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Email test failed")
        raise HTTPException(status_code=500, detail={
            "success": False,
            "error": f"Test failed: {str(e)}",
        })


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "src.main:app",
        host=settings.host,
        port=settings.port,
        log_level=settings.log_level,
        reload=False,
    )