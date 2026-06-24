/**
 * In-memory data store for Vercel serverless environment.
 * Mirrors the SQLite schema using plain Maps/arrays.
 * Falls back to SQLite when running locally.
 */

import { v4 as uuidv4 } from 'uuid';

// In-memory tables
const tables = {
  users: new Map(),
  campaigns: new Map(),
  campaign_steps: new Map(),
  leads: new Map(),
  email_log: new Map(),
  api_keys: new Map(),
};

const store = {
  // Users
  users: {
    findByEmail(email) {
      for (const user of tables.users.values()) {
        if (user.email === email) return { ...user };
      }
      return null;
    },
    findById(id) {
      const user = tables.users.get(id);
      return user ? { ...user } : null;
    },
    create({ email, name, company }) {
      const id = uuidv4();
      const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      const user = {
        id,
        email,
        name,
        company: company || null,
        created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
        stripe_customer_id: null,
        subscription_tier: 'trial',
        trial_ends_at: trialEnd,
        onboarded: 0,
      };
      tables.users.set(id, user);
      return { ...user };
    },
  },

  // Leads
  leads: {
    list({ userId, campaignId, status, limit = 50, offset = 0 }) {
      let results = Array.from(tables.leads.values());
      if (userId) results = results.filter(l => l.user_id === userId);
      if (campaignId) results = results.filter(l => l.campaign_id === campaignId);
      if (status) results = results.filter(l => l.status === status);
      results.sort((a, b) => b.created_at.localeCompare(a.created_at));
      const total = results.length;
      results = results.slice(offset, offset + limit);
      return { leads: results.map(r => ({ ...r })), total };
    },
    findById(id) {
      const lead = tables.leads.get(id);
      return lead ? { ...lead } : null;
    },
    create({ userId, email, name, company, title, linkedinUrl, source = 'manual' }) {
      const id = uuidv4();
      const lead = {
        id,
        user_id: userId,
        campaign_id: null,
        email,
        name: name || null,
        company: company || null,
        title: title || null,
        linkedin_url: linkedinUrl || null,
        status: 'pending',
        score: 0,
        source,
        created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
      };
      tables.leads.set(id, lead);
      return { ...lead };
    },
    update(id, fields) {
      const lead = tables.leads.get(id);
      if (!lead) return null;
      Object.assign(lead, fields);
      return { ...lead };
    },
    delete(id) {
      return tables.leads.delete(id);
    },
  },

  // Campaigns
  campaigns: {
    list({ userId }) {
      let results = Array.from(tables.campaigns.values());
      if (userId) results = results.filter(c => c.user_id === userId);
      results.sort((a, b) => b.created_at.localeCompare(a.created_at));
      return { campaigns: results.map(r => ({ ...r })) };
    },
    findById(id) {
      const campaign = tables.campaigns.get(id);
      return campaign ? { ...campaign } : null;
    },
    create({ userId, name }) {
      const id = uuidv4();
      const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
      const campaign = {
        id,
        user_id: userId,
        name,
        status: 'draft',
        created_at: now,
        updated_at: now,
      };
      tables.campaigns.set(id, campaign);
      return { ...campaign };
    },
    update(id, fields) {
      const campaign = tables.campaigns.get(id);
      if (!campaign) return null;
      fields.updated_at = new Date().toISOString().replace('T', ' ').slice(0, 19);
      Object.assign(campaign, fields);
      return { ...campaign };
    },
    delete(id) {
      return tables.campaigns.delete(id);
    },
    getSteps(campaignId) {
      const steps = Array.from(tables.campaign_steps.values())
        .filter(s => s.campaign_id === campaignId)
        .sort((a, b) => a.step_order - b.step_order);
      return steps.map(s => ({ ...s }));
    },
    addStep({ campaignId, stepOrder, delayDays, subject, body }) {
      const id = uuidv4();
      const step = {
        id,
        campaign_id: campaignId,
        step_order: stepOrder,
        delay_days: delayDays || 0,
        subject: subject || null,
        body: body || '',
        created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
      };
      tables.campaign_steps.set(id, step);
      return { ...step };
    },
  },

  // Debug / stats
  stats() {
    return {
      users: tables.users.size,
      leads: tables.leads.size,
      campaigns: tables.campaigns.size,
      campaign_steps: tables.campaign_steps.size,
      email_log: tables.email_log.size,
    };
  },
};

export default store;