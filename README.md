# LeadFlow AI

> An AI sales rep that works 24/7 — finds leads, crafts personalized outreach, sends multi-step campaigns, intelligently handles replies, and flags hot leads.

## Architecture Overview

```
                    ┌─────────────────────────┐
                    │    Public Port 3000      │
                    │  (Vite Dev Server /      │
                    │   Nginx in production)   │
                    └──────────┬──────────────┘
                               │
                    ┌──────────▼──────────────┐
                    │   Frontend (Vite+React) │
                    │   - Dashboard           │
                    │   - Campaign Builder    │
                    │   - Lead Management     │
                    └──────────┬──────────────┘
                               │ /api (proxy)
                    ┌──────────▼──────────────┐
                    │   Backend (Express)      │
                    │   - Auth & Users         │
                    │   - CRUD: Leads          │
                    │   - CRUD: Campaigns      │
                    │   - Dashboard Stats      │
                    └──────────┬──────────────┘
                               │
                    ┌──────────▼──────────────┐
                    │   SQLite (better-sqlite3)│
                    │   - Users               │
                    │   - Leads               │
                    │   - Campaigns/Steps     │
                    │   - Email Log           │
                    └──────────┬──────────────┘
                               │
                    ┌──────────▼──────────────┐
                    │   AI & Automation Layer │
                    │ (AI & Automation Eng.)  │
                    │   - Lead Scoring        │
                    │   - Email Sending       │
                    │   - Reply Handler       │
                    │   - Campaign Executor   │
                    └─────────────────────────┘
```

## Tech Stack

| Layer       | Technology         | Why                                      |
|-------------|--------------------|------------------------------------------|
| Frontend    | React 19 + Vite 6  | Lightweight, fast builds, memory-conscious |
| Backend     | Express (Node.js)  | Minimal overhead, easy to reason about   |
| Database    | SQLite (better-sqlite3) | Zero-config, fast, file-based        |
| AI Layer    | Python FastAPI      | Rich AI/ML ecosystem, async-ready        |
| Proxy       | Vite built-in (dev)| Single origin on port 3000               |

## Project Structure

```
leadflow-app/
├── backend/
│   ├── data/                  # SQLite database files (gitignored)
│   ├── src/
│   │   ├── db/
│   │   │   └── init.js        # Database initialization & schema
│   │   ├── middleware/
│   │   │   └── aiProxy.js     # Proxies AI requests to FastAPI (port 8001)
│   │   ├── routes/
│   │   │   ├── auth.js        # User registration & login
│   │   │   ├── campaigns.js   # Campaign CRUD
│   │   │   ├── health.js      # Health check
│   │   │   └── leads.js       # Lead CRUD & CSV upload
│   │   └── index.js           # Express server entry point
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── api.js             # API client
│   │   ├── App.jsx            # Main app with dashboard
│   │   ├── index.css          # Global styles (dark theme)
│   │   └── main.jsx           # React entry point
│   ├── index.html
│   ├── vite.config.js         # Proxy /api → backend
│   └── package.json
├── ai-service/
│   ├── src/
│   │   ├── main.py                     # FastAPI entry point
│   │   ├── config.py                   # Environment configuration
│   │   ├── personalization_engine.py   # AI message generation
│   │   ├── lead_scorer.py              # Lead scoring engine
│   │   ├── reply_handler.py            # Inbound reply processing
│   │   ├── email_sender.py             # Email sending (mock/Gmail/SMTP)
│   │   └── campaign_executor.py        # Batch campaign execution
│   ├── requirements.txt
│   └── .env.example
├── shared/
│   └── api-contracts.md       # API contracts (both teams align here)
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 20+
- npm
- Python 3.12+

### Install & Run (Development)

```bash
# Terminal 1 — Backend
cd backend
npm install
npm run dev    # Starts on port 3001

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev    # Starts on port 3000, proxies /api → 3001

# Terminal 3 — AI Service
cd ai-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn src.main:app --host 127.0.0.1 --port 8001
```

Then open http://localhost:3000 in your browser.

### API Health Check

```bash
# Backend health
curl http://localhost:3001/api/health

# AI Service health
curl http://localhost:3001/api/ai-health
```

## Development

### API Contracts
See `shared/api-contracts.md` for the full API specification. This is the single source of truth that both the frontend and AI automation layers should align to.

### Conventions
- **ES Modules** throughout (no CommonJS)
- **SQLite** for app data (via `better-sqlite3`)
- All API routes live under `/api/`
- Frontend proxies `/api/*` to the backend in dev mode
- Backend proxies AI-specific routes to the FastAPI service on port 8001
- **Mock mode by default** — set `LEADFLOW_OPENAI_API_KEY` for real AI responses

## License

Proprietary — LeadFlow AI © 2025