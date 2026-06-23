# LeadFlow AI — API Contracts

> This document defines the contracts between the **Node.js Backend** (Express, port 3001) and the **AI Service** (FastAPI/Python, port 8001).
>
> The backend serves as the main API gateway (port 3000/3001). It proxies AI-related requests to the internal AI service.

---

## 1. Personalization — `POST /api/personalize`

**Purpose:** Generate a personalized outreach message for a lead.

**Request (backend → AI service):**
```json
{
  "lead": {
    "name": "Jane Smith",
    "email": "jane@acme.co",
    "company": "Acme Corp",
    "title": "VP of Engineering",
    "industry": "SaaS",
    "linkedin_bio": "Leading engineering at Acme, previously at Google",
    "company_description": "Acme Corp builds developer tooling for Kubernetes"
  },
  "campaign_context": {
    "product_name": "LeadFlow AI",
    "product_description": "AI sales rep that finds leads and automates outreach",
    "value_proposition": "Save your sales team 10+ hours/week on manual outreach",
    "tone": "professional-friendly"
  },
  "step_number": 1,
  "previous_messages": []
}
```

**Response (AI service → backend):**
```json
{
  "success": true,
  "subject": "Quick question about your outreach process",
  "body": "Hi Jane,\n\nI noticed Acme Corp is building developer tooling for Kubernetes...",
  "personalization_score": 0.92,
  "model_used": "gpt-4o-mini",
  "tokens_used": 245
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Failed to generate message: [reason]",
  "model_used": "gpt-4o-mini"
}
```

---

## 2. Send Email — `POST /api/send-email`

**Purpose:** Send an email via the configured provider (Gmail API or SMTP).

**Request (backend → AI service):**
```json
{
  "to": {
    "name": "Jane Smith",
    "email": "jane@acme.co"
  },
  "from": {
    "name": "Alex from LeadFlow",
    "email": "alex@leadflow.ai"
  },
  "subject": "Quick question about your outreach process",
  "body": "Hi Jane,\n\nI noticed Acme Corp is building developer tooling for Kubernetes...",
  "provider": "gmail",
  "provider_config": {
    "access_token": "ya29...",
    "refresh_token": "1//..."
  },
  "lead_id": "uuid-of-lead",
  "campaign_step_id": "uuid-of-campaign-step"
}
```

**Response:**
```json
{
  "success": true,
  "message_id": "<msg-id@mail.gmail.com>",
  "sent_at": "2026-06-23T12:00:00Z",
  "provider": "gmail"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Failed to send email: [reason]"
}
```

---

## 3. Handle Reply — `POST /api/handle-reply`

**Purpose:** Process an incoming email reply and generate an appropriate auto-response.

**Request (backend → AI service):**
```json
{
  "original_email": {
    "subject": "Quick question about your outreach process",
    "body": "Hi Jane,\n\nI noticed Acme Corp...",
    "sent_at": "2026-06-23T12:00:00Z"
  },
  "incoming_reply": {
    "from": "jane@acme.co",
    "from_name": "Jane Smith",
    "subject": "Re: Quick question about your outreach process",
    "body": "Hi Alex, this sounds interesting. Can you send me more info?",
    "received_at": "2026-06-23T14:30:00Z"
  },
  "lead": {
    "id": "uuid",
    "name": "Jane Smith",
    "company": "Acme Corp",
    "title": "VP of Engineering",
    "email": "jane@acme.co"
  },
  "campaign_context": {
    "product_name": "LeadFlow AI",
    "product_description": "AI sales rep...",
    "value_proposition": "Save 10+ hours/week"
  },
  "thread_history": [
    {"role": "outgoing", "body": "Hi Jane,\n\nI noticed Acme Corp...", "sent_at": "2026-06-23T12:00:00Z"},
    {"role": "incoming", "body": "Hi Alex, this sounds interesting...", "received_at": "2026-06-23T14:30:00Z"}
  ]
}
```

**Response:**
```json
{
  "success": true,
  "should_respond": true,
  "response_body": "Hi Jane, thanks for your interest! I'd be happy to share more...",
  "response_subject": "Re: Quick question about your outreach process",
  "lead_score": 0.85,
  "hot_lead": true,
  "hot_reason": "Explicit interest expressed",
  "suggested_next_action": "book_demo"
}
```

**When no response is needed:**
```json
{
  "success": true,
  "should_respond": false,
  "lead_score": 0.3,
  "hot_lead": false,
  "reason": "Out-of-office auto-reply detected"
}
```

---

## 4. Lead Score — `GET /api/leads/{id}/score`

**Purpose:** Get or compute the score for a specific lead.

**Query Parameters (optional):**
- `refresh` (boolean) — Force re-score instead of returning cached score

**Response:**
```json
{
  "success": true,
  "lead_id": "uuid",
  "score": 0.85,
  "score_factors": {
    "title_relevance": 0.9,
    "company_fit": 0.85,
    "engagement_level": 0.8,
    "industry_match": 0.7,
    "decision_maker_probability": 0.95
  },
  "hot_lead": true,
  "hot_reason": "Explicit interest expressed in reply",
  "last_scored_at": "2026-06-23T14:30:00Z"
}
```

---

## 5. Execute Campaign — `POST /api/campaigns/execute`

**Purpose:** Execute the next step of a campaign for a set of leads.

**Request (backend → AI service):**
```json
{
  "campaign_id": "uuid",
  "campaign_name": "Q3 Outreach - Developer Tools",
  "step": {
    "id": "uuid",
    "step_order": 2,
    "delay_days": 3,
    "subject_template": "Following up: {{product_name}} for {{company}}",
    "body_template": "Hi {{name}},\n\nJust following up on my previous email..."
  },
  "leads": [
    {
      "id": "uuid",
      "name": "Jane Smith",
      "email": "jane@acme.co",
      "company": "Acme Corp",
      "title": "VP of Engineering",
      "personalization_context": {
        "industry": "SaaS",
        "company_size": "50-200",
        "linkedin_summary": "..."
      }
    }
  ],
  "batch_size": 50
}
```

**Response:**
```json
{
  "success": true,
  "campaign_id": "uuid",
  "processed": 50,
  "results": [
    {
      "lead_id": "uuid",
      "status": "sent",
      "message_id": "<msg-id>",
      "personalized_subject": "Following up: LeadFlow AI for Acme Corp",
      "personalized_body": "Hi Jane...",
      "error": null
    }
  ],
  "errors": [],
  "processing_time_ms": 1234
}
```

**Error example in results:**
```json
{
  "success": true,
  "campaign_id": "uuid",
  "processed": 50,
  "results": [...],
  "errors": [
    {
      "lead_id": "uuid",
      "status": "failed",
      "error": "Email provider not configured for user"
    }
  ],
  "processing_time_ms": 1234
}
```

---

## 6. Health Check — `GET /api/ai-health`

**Purpose:** Check if the AI service is healthy.

**Response:**
```json
{
  "status": "ok",
  "service": "leadflow-ai-service",
  "version": "0.1.0",
  "llm_available": true,
  "llm_model": "gpt-4o-mini",
  "uptime_seconds": 3600
}
```

---

## Architecture Notes

- **Backend** (Node.js/Express, port 3001) routes `POST /api/personalize`, `POST /api/send-email`, `POST /api/handle-reply`, `GET /api/leads/:id/score`, `POST /api/campaigns/execute` to the AI service.
- **AI Service** (Python/FastAPI, port 8001) runs on the same host but on a private loopback interface.
- All AI requests go through the backend as a proxy — the frontend never talks directly to the AI service.
- Rate limiting is handled by the backend.
- Authentication/authorization is handled by the backend.