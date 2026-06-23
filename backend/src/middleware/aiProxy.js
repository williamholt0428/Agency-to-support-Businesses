import { createProxyMiddleware } from 'http-proxy-middleware';

const AI_SERVICE_URL = 'http://127.0.0.1:8001';

/**
 * Check if a request path should be proxied to the AI service.
 * Uses full path (e.g., /api/ai-health, /api/personalize).
 */
function isAiPath(pathname) {
  return (
    pathname === '/api/ai-health' ||
    pathname === '/api/personalize' ||
    pathname === '/api/send-email' ||
    pathname === '/api/handle-reply' ||
    pathname === '/api/campaigns/execute' ||
    /^\/api\/leads\/[^/]+\/score$/.test(pathname)
  );
}

/**
 * Creates the proxy middleware configured for the AI service.
 * Uses a filter so non-AI requests pass through to normal Express routes.
 */
const aiProxyMiddleware = createProxyMiddleware({
  filter: isAiPath,
  target: AI_SERVICE_URL,
  changeOrigin: true,

  // Timeout if AI service is down
  proxyTimeout: 30000,
  timeout: 30000,

  // Forward all headers (auth, cookies, content-type, etc.)
  on: {
    proxyReq: (proxyReq, req) => {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[AI Proxy] ${req.method} ${req.url} → ${AI_SERVICE_URL}${req.url}`);
      }
    },

    error: (err, req, res) => {
      console.error(`[AI Proxy] Error proxying ${req.method} ${req.url}:`, err.message);
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: `AI service unavailable: ${err.message}`,
        }));
      }
    },
  },
});

/**
 * Express-style middleware wrapper.
 * Mounted at root level so `req.path` includes the full `/api/...` prefix.
 */
export default function aiProxy(req, res, next) {
  if (isAiPath(req.path)) {
    return aiProxyMiddleware(req, res, next);
  }
  next();
}