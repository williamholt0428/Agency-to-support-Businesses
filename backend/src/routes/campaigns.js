import { Router } from 'express';
import { getDb } from '../db/init.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// List campaigns for a user
router.get('/', (req, res) => {
  const { userId } = req.query;
  const db = getDb();
  let query = 'SELECT * FROM campaigns WHERE 1=1';
  const params = [];

  if (userId) { query += ' AND user_id = ?'; params.push(userId); }
  query += ' ORDER BY created_at DESC';

  const campaigns = db.prepare(query).all(...params);
  res.json({ campaigns });
});

// Create campaign
router.post('/', (req, res) => {
  const { userId, name, steps } = req.body;
  if (!userId || !name) {
    return res.status(400).json({ error: 'userId and name required' });
  }

  const db = getDb();
  const campaignId = uuidv4();

  const insertCampaign = db.prepare(`
    INSERT INTO campaigns (id, user_id, name) VALUES (?, ?, ?)
  `);

  const insertStep = db.prepare(`
    INSERT INTO campaign_steps (id, campaign_id, step_order, delay_days, subject, body)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    insertCampaign.run(campaignId, userId, name);

    if (Array.isArray(steps)) {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        insertStep.run(uuidv4(), campaignId, i, step.delay_days || 0, step.subject || null, step.body || '');
      }
    }
  });

  transaction();

  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(campaignId);
  res.status(201).json(campaign);
});

// Get campaign with steps
router.get('/:id', (req, res) => {
  const db = getDb();
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

  const steps = db.prepare('SELECT * FROM campaign_steps WHERE campaign_id = ? ORDER BY step_order').all(req.params.id);
  res.json({ ...campaign, steps });
});

// Update campaign
router.patch('/:id', (req, res) => {
  const db = getDb();
  const { name, status } = req.body;
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

  if (name) db.prepare('UPDATE campaigns SET name = ?, updated_at = datetime(\'now\') WHERE id = ?').run(name, req.params.id);
  if (status) db.prepare('UPDATE campaigns SET status = ?, updated_at = datetime(\'now\') WHERE id = ?').run(status, req.params.id);

  const updated = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// Delete campaign
router.delete('/:id', (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM campaigns WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Campaign not found' });
  res.json({ message: 'Campaign deleted' });
});

export default router;