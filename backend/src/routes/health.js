import { Router } from 'express';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8001';

const router = Router();

router.get('/', async (_req, res) => {
  let aiStatus = 'unknown';
  let aiDetail = null;
  let emailProvider = 'mock';

  // AI Service check
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const aiRes = await fetch(`${AI_SERVICE_URL}/api/ai-health`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (aiRes.ok) {
      aiStatus = 'ok';
      aiDetail = await aiRes.json();
    } else {
      aiStatus = 'degraded';
    }
  } catch (err) {
    aiStatus = 'unavailable';
    aiDetail = { error: err.message };
  }

  // Email provider status (from AI service config or env)
  if (process.env.LEADFLOW_EMAIL_PROVIDER) {
    emailProvider = process.env.LEADFLOW_EMAIL_PROVIDER;
  }

  const overallStatus = (aiStatus === 'ok' && emailProvider !== 'mock') ? 'ok' : 'degraded';

  res.json({
    status: overallStatus,
    service: 'leadflow-ai',
    version: '0.2.0',
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL ? 'production (Vercel)' : 'development',
    components: {
      backend: { status: 'ok', db: process.env.VERCEL ? 'in-memory' : 'sqlite' },
      ai_service: { status: aiStatus, url: AI_SERVICE_URL, detail: aiDetail },
      email: { provider: emailProvider, status: emailProvider === 'mock' ? 'mock' : 'configured' },
    },
    recommendations: overallStatus !== 'ok' ? [
      'Set OPENAI_API_KEY for real personalization',
      'Configure SMTP credentials (LEADFLOW_SMTP_*) for real email sending',
      'Deploy AI service separately for production scale'
    ] : []
  });
});

export default router;
