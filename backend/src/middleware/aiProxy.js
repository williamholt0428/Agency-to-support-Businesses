import { createProxyMiddleware } from 'http-proxy-middleware';

const AI_SERVICE_URL = 'http://127.0.0.1:8001';

/**
 * Filter function — only proxy requests that match AI service endpoints.
 * Non-matching requests pass through to regular Express routes.
 */
function aiPathFilter(pathname) {
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
 * Proxy middleware that forwards AI-related requests to the Python FastAPI service.
 * Uses a filter so non-AI requests pass through to normal Express routes.
 */
const aiProxy = createProxyMiddleware({
  filter: aiPathFilter,
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

export default aiProxy;