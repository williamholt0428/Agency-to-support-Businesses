/**
 * Vercel serverless function entry point.
 * Re-exports the Express application for the @vercel/node runtime.
 *
 * Vercel routes all /api/* requests to this handler.
 * The Express app handles routing internally.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { initDb } from '../backend/src/db/init.js';
import healthRouter from '../backend/src/routes/health.js';
import leadsRouter from '../backend/src/routes/leads.js';
import campaignsRouter from '../backend/src/routes/campaigns.js';
import authRouter from '../backend/src/routes/auth.js';
import aiProxy from '../backend/src/middleware/aiProxy.js';

// Initialize database (uses in-memory store on Vercel, SQLite locally)
await initDb();

const app = express();

// Security middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());

// AI proxy
app.use(aiProxy);

// Body parser
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

// Export for Vercel serverless runtime
export default app;