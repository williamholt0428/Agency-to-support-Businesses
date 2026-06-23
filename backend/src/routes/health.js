import { Router } from 'express';

const AI_SERVICE_URL = 'http://127.0.0.1:8001';

const router = Router();

router.get('/', async (_req, res) => {
  // Check AI service health
  let aiStatus = 'unknown';
  let aiDetail = null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

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
  } catch {
    aiStatus = 'unavailable';
  }

  const overallStatus = aiStatus === 'ok' ? 'ok' : 'degraded';

  res.json({
    status: overallStatus,
    service: 'leadflow-ai',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    components: {
      backend: { status: 'ok' },
      ai_service: { status: aiStatus, detail: aiDetail },
    },
  });
});

export default router;