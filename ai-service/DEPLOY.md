# LeadFlow AI — AI Service Deployment

## Overview

The AI service is a Python FastAPI application. It can be deployed to several free hosting platforms.

**Current status:** The service runs in **mock mode** by default (no API key needed). Set `OPENAI_API_KEY` or `LEADFLOW_OPENAI_API_KEY` environment variable for real OpenAI-powered personalization.

## Option 1: Render (Recommended for FastAPI)

[render.com](https://render.com) — Free tier includes 512 MB RAM, sleeps after 15 min of inactivity.

### Steps
1. Fork/push this repo to GitHub
2. On Render dashboard, click **New +** → **Web Service**
3. Connect your GitHub repo
4. Configure:
   - **Name:** `leadflow-ai-service`
   - **Region:** Choose closest
   - **Branch:** `main`
   - **Root Directory:** `ai-service`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn src.main:app --host 0.0.0.0 --port $PORT`
   - **Plan:** Free
5. Add environment variables in Render dashboard:
   - `LEADFLOW_OPENAI_API_KEY` (optional — for real AI)
   - `LEADFLOW_LOG_LEVEL=info`
6. Click **Deploy**

The Procfile at `ai-service/Procfile` will also work for automatic detection.

## Option 2: PythonAnywhere

[pythonanywhere.com](https://pythonanywhere.com) — Free tier, no credit card needed.

### Steps
1. Create a PythonAnywhere account
2. Open a **Bash console** and clone the repo:
   ```bash
   git clone https://github.com/williamholt0428/Agency-to-support-Businesses.git
   cd Agency-to-support-Businesses/ai-service
   ```
3. Create a virtualenv:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```
4. Go to the **Web** tab → **Add a new web app**
   - Choose **Manual configuration**
   - Python version: **3.12**
5. In the **Code** section:
   - **Working directory:** `/home/your-username/Agency-to-support-Businesses/ai-service`
   - **WSGI configuration file:** Point to the project's `wsgi.py`
6. In the **Virtualenv** section:
   - Enter: `/home/your-username/Agency-to-support-Businesses/ai-service/venv`
7. Add environment variables (Web tab → Environment variables):
   - `LEADFLOW_OPENAI_API_KEY`
8. Click **Reload**

> Note: The `wsgi.py` file uses `a2wsgi.ASGIMiddleware` to wrap FastAPI for WSGI compatibility.

## Option 3: Koyeb

[koyeb.com](https://koyeb.com) — Free tier, always-on, supports Docker and buildpacks.

### Steps
1. Push repo to GitHub
2. Create a Koyeb account
3. **Create App** → connect GitHub → select `williamholt0428/Agency-to-support-Businesses`
4. Set **Builder** to **Buildpack**
5. Set **Run command:** `uvicorn src.main:app --host 0.0.0.0 --port $PORT`
6. Set **Work directory:** `ai-service`
7. Add env vars and deploy

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | No (mock mode) | OpenAI API key for real AI |
| `LEADFLOW_OPENAI_API_KEY` | No | Same as above (LeadFlow prefix) |
| `LEADFLOW_LOG_LEVEL` | No | `info`, `debug`, `warning` (default: `info`) |
| `PORT` | Auto | Set by hosting platform (Render, Heroku) |
| `LEADFLOW_EMAIL_PROVIDER` | No | `mock`, `gmail`, `smtp` (default: `mock`) |

## Architecture Note

The AI service is designed to run as a **sidecar** to the main Node.js backend:

```
Frontend (3000) → Backend (3001) → AI Service (8001)
```

The backend proxies AI-specific routes to this service via `aiProxy.js` middleware.
In production, deploy this service and point the backend's `AI_SERVICE_URL` env var to its public URL.

## Health Check

Once deployed, verify the service is running:

```bash
curl https://your-service-url/api/ai-health
# → {"status":"ok","service":"leadflow-ai-service","version":"0.1.0",...}
```