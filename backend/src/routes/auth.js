import { Router } from 'express';
import { getDb } from '../db/init.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Register / signup (stub — will integrate with proper auth later)
router.post('/register', (req, res) => {
  const { email, name, company } = req.body;
  if (!email || !name) {
    return res.status(400).json({ error: 'email and name required' });
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'User already exists' });
  }

  const id = uuidv4();
  const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(`
    INSERT INTO users (id, email, name, company, subscription_tier, trial_ends_at, onboarded)
    VALUES (?, ?, ?, ?, 'trial', ?, 0)
  `).run(id, email, name, company || null, trialEnd);

  const user = db.prepare('SELECT id, email, name, company, subscription_tier, trial_ends_at, onboarded FROM users WHERE id = ?').get(id);
  res.status(201).json({ user });
});

// Login (stub — returns user if exists)
router.post('/login', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email required' });

  const db = getDb();
  const user = db.prepare('SELECT id, email, name, company, subscription_tier, trial_ends_at, onboarded FROM users WHERE email = ?').get(email);
  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json({ user });
});

// Get current user
router.get('/me/:id', (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id, email, name, company, subscription_tier, trial_ends_at, onboarded FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

export default router;