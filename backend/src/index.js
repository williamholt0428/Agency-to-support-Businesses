import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

import { initDb } from './db/init.js';
import healthRouter from './routes/health.js';
import leadsRouter from './routes/leads.js';
import campaignsRouter from './routes/campaigns.js';
import authRouter from './routes/auth.js';
import aiProxy from './middleware/aiProxy.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ensure data directory exists (local dev only)
const dataDir = path.join(__dirname, '..', 'data');
if (!process.env.VERCEL && !fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database (async — in-memory on Vercel, SQLite locally)
const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Security middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());

// AI proxy — mounted BEFORE JSON body parser so the request body stream
// is preserved when forwarding to the AI service.
app.use(aiProxy);

// Body parser for non-proxied routes
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// API routes
app.use('/api/health', healthRouter);
app.use('/api/leads', leadsRouter);
app.use('/api/campaigns', campaignsRouter);
app.use('/api/auth', authRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server (only in local dev, not on Vercel)
async function start() {
  await initDb();
  console.log('Database initialized');

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LeadFlow AI backend listening on http://0.0.0.0:${PORT}`);
  });
}

// Only call start() if not on Vercel
if (!process.env.VERCEL) {
  start();
}

export default app;