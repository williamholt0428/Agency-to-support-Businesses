import { Router } from 'express';
import { getDb } from '../db/init.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// List leads for a user
router.get('/', (req, res) => {
  const { userId, campaignId, status, limit = 50, offset = 0 } = req.query;
  const db = getDb();
  let query = 'SELECT * FROM leads WHERE 1=1';
  const params = [];

  if (userId) { query += ' AND user_id = ?'; params.push(userId); }
  if (campaignId) { query += ' AND campaign_id = ?'; params.push(campaignId); }
  if (status) { query += ' AND status = ?'; params.push(status); }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const leads = db.prepare(query).all(...params);
  res.json({ leads, total: leads.length });
});

// Upload leads (CSV parse endpoint)
router.post('/upload', (req, res) => {
  const { userId, leads } = req.body;

  if (!userId || !Array.isArray(leads) || leads.length === 0) {
    return res.status(400).json({ error: 'userId and leads array required' });
  }

  const db = getDb();
  const insert = db.prepare(`
    INSERT INTO leads (id, user_id, email, name, company, title, linkedin_url, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const inserted = [];
  const transaction = db.transaction(() => {
    for (const lead of leads) {
      const id = uuidv4();
      insert.run(id, userId, lead.email, lead.name || null, lead.company || null, lead.title || null, lead.linkedin_url || null, 'csv_upload');
      inserted.push({ id, email: lead.email });
    }
  });

  transaction();
  res.status(201).json({ message: `${inserted.length} leads imported`, leads: inserted });
});

// Get single lead
router.get('/:id', (req, res) => {
  const db = getDb();
  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  res.json(lead);
});

// Update lead status
router.patch('/:id', (req, res) => {
  const db = getDb();
  const { status, score } = req.body;
  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  if (status) db.prepare('UPDATE leads SET status = ? WHERE id = ?').run(status, req.params.id);
  if (score !== undefined) db.prepare('UPDATE leads SET score = ? WHERE id = ?').run(score, req.params.id);

  const updated = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// Delete lead
router.delete('/:id', (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM leads WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Lead not found' });
  res.json({ message: 'Lead deleted' });
});

export default router;