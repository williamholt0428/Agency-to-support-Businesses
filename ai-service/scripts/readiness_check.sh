#!/usr/bin/env bash
# =============================================================================
# LeadFlow AI — Readiness Check Script
# =============================================================================
# Validates that the AI service is running and all subsystems are operational.
#
# Usage:
#   ./scripts/readiness_check.sh [BASE_URL]
#
# Default BASE_URL is http://127.0.0.1:8001 (local dev).
# For production: ./scripts/readiness_check.sh https://your-ai-service.onrender.com
# =============================================================================

set -euo pipefail

BASE_URL="${1:-http://127.0.0.1:8001}"
PASS=0
FAIL=0
TOTAL=0

green()  { echo -e "\033[32m✓ $1\033[0m"; }
red()    { echo -e "\033[31m✗ $1\033[0m"; ((FAIL++)); }
check()  { ((TOTAL++)); }

echo "============================================"
echo " LeadFlow AI — Readiness Check"
echo " Target: $BASE_URL"
echo "============================================"
echo ""

# ---------------------------------------------------------------------------
# 0. Service reachable
# ---------------------------------------------------------------------------
echo "--- Service Reachability ---"

check
if curl -sf --connect-timeout 5 "$BASE_URL/api/ai-health" > /dev/null 2>&1; then
    green "Service is reachable at $BASE_URL"
else
    red "Service is NOT reachable at $BASE_URL"
    echo ""
    echo "  Make sure the AI service is running:"
    echo "    cd ai-service && source venv/bin/activate && python -m uvicorn src.main:app --host 0.0.0.0 --port 8001"
    echo ""
    exit 1
fi

# ---------------------------------------------------------------------------
# 1. Health check
# ---------------------------------------------------------------------------
echo ""
echo "--- Health Check ---"

check
HEALTH=$(curl -sf "$BASE_URL/api/ai-health" 2>&1)
STATUS=$(echo "$HEALTH" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status',''))" 2>/dev/null || echo "")
if [ "$STATUS" = "ok" ]; then
    green "GET /api/ai-health → status=ok"
else
    red "GET /api/ai-health → unexpected response: $HEALTH"
fi

# ---------------------------------------------------------------------------
# 2. Readiness (comprehensive)
# ---------------------------------------------------------------------------
echo ""
echo "--- Comprehensive Readiness ---"

check
READINESS=$(curl -sf "$BASE_URL/api/readiness" 2>&1)
READY_STATUS=$(echo "$READINESS" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status',''))" 2>/dev/null || echo "")
if [ "$READY_STATUS" = "ok" ] || [ "$READY_STATUS" = "degraded" ]; then
    green "GET /api/readiness → status=$READY_STATUS"
    echo "$READINESS" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for name, check in data.get('checks', {}).items():
    avail = check.get('available', check.get('configured', '?'))
    status_icon = '  ✓' if avail else '  ✗'
    print(f'{status_icon} {name}: {check}')
" 2>/dev/null || true
else
    red "GET /api/readiness → unexpected response: $READINESS"
fi

# ---------------------------------------------------------------------------
# 3. Personalization engine
# ---------------------------------------------------------------------------
echo ""
echo "--- Personalization Engine ---"

check
PERSONALIZE=$(curl -sf -X POST "$BASE_URL/api/personalize" \
    -H "Content-Type: application/json" \
    -d '{
        "lead": {"name": "Jane Smith", "company": "Acme Corp", "title": "VP Engineering", "industry": "SaaS"},
        "campaign_context": {"product_name": "LeadFlow AI", "product_description": "AI sales rep", "value_proposition": "Save 10+ hours/week", "tone": "professional"},
        "step_number": 1
    }' 2>&1)
P_SUCCESS=$(echo "$PERSONALIZE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('success',''))" 2>/dev/null || echo "")
if [ "$P_SUCCESS" = "True" ]; then
    green "POST /api/personalize → success"
    SUBJECT=$(echo "$PERSONALIZE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('subject','')[:60])" 2>/dev/null || echo "")
    echo "  Subject: $SUBJECT"
else
    red "POST /api/personalize → failed: $PERSONALIZE"
fi

# ---------------------------------------------------------------------------
# 4. Lead scoring
# ---------------------------------------------------------------------------
echo ""
echo "--- Lead Scoring ---"

check
SCORE=$(curl -sf "$BASE_URL/api/leads/test-lead-1/score" 2>&1)
SCORE_VAL=$(echo "$SCORE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('score',0))" 2>/dev/null || echo "0")
HOT=$(echo "$SCORE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('hot_lead',''))" 2>/dev/null || echo "")
if [ -n "$SCORE_VAL" ]; then
    green "GET /api/leads/{id}/score → score=$SCORE_VAL, hot_lead=$HOT"
else
    red "GET /api/leads/{id}/score → failed: $SCORE"
fi

# ---------------------------------------------------------------------------
# 5. Reply handler
# ---------------------------------------------------------------------------
echo ""
echo "--- Reply Handler ---"

check
REPLY=$(curl -sf -X POST "$BASE_URL/api/handle-reply" \
    -H "Content-Type: application/json" \
    -d '{
        "original_email": {"subject": "Quick question", "body": "Hi Jane, would you be open to a chat about LeadFlow AI?"},
        "incoming_reply": {"from": "jane@acme.co", "from_name": "Jane Smith", "subject": "Re: Quick question", "body": "I am interested, can you send more details?"},
        "lead": {"id": "test-1", "name": "Jane Smith", "company": "Acme Corp", "title": "VP Engineering"},
        "campaign_context": {"product_name": "LeadFlow AI"}
    }' 2>&1)
R_SUCCESS=$(echo "$REPLY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('success',''))" 2>/dev/null || echo "")
R_HOT=$(echo "$REPLY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('hot_lead',''))" 2>/dev/null || echo "")
if [ "$R_SUCCESS" = "True" ]; then
    green "POST /api/handle-reply → success, hot_lead=$R_HOT"
else
    red "POST /api/handle-reply → failed: $REPLY"
fi

# ---------------------------------------------------------------------------
# 6. Campaign execution (mock)
# ---------------------------------------------------------------------------
echo ""
echo "--- Campaign Execution ---"

check
CAMPAIGN=$(curl -sf -X POST "$BASE_URL/api/campaigns/execute" \
    -H "Content-Type: application/json" \
    -d '{
        "campaign_id": "test-campaign-1",
        "campaign_name": "Readiness Test Campaign",
        "step": {"id": "step-1", "step_order": 1, "delay_days": 0, "subject_template": "Test", "body_template": "Hi {{name}}"},
        "leads": [
            {"id": "lead-1", "name": "Test Lead", "email": "test@example.com", "company": "TestCo", "title": "CEO", "personalization_context": {"industry": "SaaS"}}
        ],
        "batch_size": 1
    }' 2>&1)
C_SUCCESS=$(echo "$CAMPAIGN" | python3 -c "import sys,json; print(json.load(sys.stdin).get('success',''))" 2>/dev/null || echo "")
C_PROCESSED=$(echo "$CAMPAIGN" | python3 -c "import sys,json; print(json.load(sys.stdin).get('processed',0))" 2>/dev/null || echo "0")
if [ "$C_SUCCESS" = "True" ]; then
    green "POST /api/campaigns/execute → processed=$C_PROCESSED"
else
    red "POST /api/campaigns/execute → failed: $CAMPAIGN"
fi

# ---------------------------------------------------------------------------
# 7. SMTP test
# ---------------------------------------------------------------------------
echo ""
echo "--- SMTP Connectivity ---"

check
SMTP=$(curl -sf "$BASE_URL/api/smtp-test" 2>&1)
SMTP_OK=$(echo "$SMTP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('success',''))" 2>/dev/null || echo "")
SMTP_CFG=$(echo "$SMTP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('configured',''))" 2>/dev/null || echo "")
if [ "$SMTP_CFG" = "False" ]; then
    echo "  ⚠ SMTP not configured (expected in dev/mock mode)"
elif [ "$SMTP_OK" = "True" ]; then
    green "GET /api/smtp-test → SMTP connection verified"
else
    red "GET /api/smtp-test → SMTP connection failed: $SMTP"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "============================================"
echo " Results: $PASS passed, $FAIL failed ($TOTAL checks)"
echo "============================================"

if [ "$FAIL" -gt 0 ]; then
    exit 1
fi
exit 0
