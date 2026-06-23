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
| AI Layer    | Python (TBD)       | Rich AI/ML ecosystem                     |
| Proxy       | Vite built-in (dev)| Single origin on port 3000               |

## Project Structure

```
leadflow-app/
├── backend/
│   ├── data/                  # SQLite database files (gitignored)
│   ├── src/
│   │   ├── db/
│   │   │   └── init.js        # Database initialization & schema
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
├── shared/
│   └── api-contracts.md       # API contracts (both teams align here)
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 20+
- npm

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
```

Then open http://localhost:3000 in your browser.

### API Health Check

```bash
curl http://localhost:3001/api/health
# → {"status":"ok","service":"leadflow-ai","version":"0.1.0",...}
```

## Development

### API Contracts
See `shared/api-contracts.md` for the full API specification. This is the single source of truth that both the frontend and AI automation layers should align to.

### Conventions
- **ES Modules** throughout (no CommonJS)
- **SQLite** for app data (via `better-sqlite3`)
- All API routes live under `/api/`
- Frontend proxies `/api/*` to the backend in dev mode

## License

Proprietary — LeadFlow AI © 2025