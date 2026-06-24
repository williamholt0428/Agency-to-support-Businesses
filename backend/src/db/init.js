/**
 * Database initialization module.
 *
 * In local development: uses SQLite via better-sqlite3 (persistent).
 * On Vercel (serverless): uses an in-memory store (ephemeral).
 *
 * The in-memory store mimics better-sqlite3's .prepare().run()/.get()/.all() API
 * so the existing route files work without changes.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', '..', 'data', 'leadflow.db');

const IS_VERCEL = !!process.env.VERCEL;

let db = null;

export async function initDb() {
  if (db) return db;

  if (IS_VERCEL) {
    db = createMemoryDb();
    console.log('[DB] Using in-memory store (Vercel)');
  } else {
    // Dynamic import to avoid loading native module on Vercel
    const { default: Database } = await import('better-sqlite3');
    // Ensure data directory exists
    const { existsSync, mkdirSync } = await import('node:fs');
    const dataDir = path.join(__dirname, '..', '..', 'data');
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }

    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
        company TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')),
        stripe_customer_id TEXT, subscription_tier TEXT DEFAULT 'trial',
        trial_ends_at TEXT, onboarded INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS campaigns (
        id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id),
        name TEXT NOT NULL, status TEXT DEFAULT 'draft',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS campaign_steps (
        id TEXT PRIMARY KEY, campaign_id TEXT NOT NULL REFERENCES campaigns(id),
        step_order INTEGER NOT NULL, delay_days INTEGER NOT NULL DEFAULT 0,
        subject TEXT, body TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id),
        campaign_id TEXT REFERENCES campaigns(id), email TEXT NOT NULL,
        name TEXT, company TEXT, title TEXT, linkedin_url TEXT,
        status TEXT DEFAULT 'pending', score REAL DEFAULT 0.0,
        source TEXT DEFAULT 'manual',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS email_log (
        id TEXT PRIMARY KEY, lead_id TEXT NOT NULL REFERENCES leads(id),
        campaign_step_id TEXT REFERENCES campaign_steps(id),
        subject TEXT, body TEXT, sent_at TEXT, opened_at TEXT,
        replied_at TEXT, status TEXT DEFAULT 'pending'
      );
      CREATE TABLE IF NOT EXISTS api_keys (
        id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id),
        name TEXT NOT NULL, key_hash TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')), last_used_at TEXT
      );
    `);
    console.log('[DB] Using SQLite (local)');
  }

  return db;
}

export function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  return db;
}

// ---------------------------------------------------------------------------
// In-memory database that mimics better-sqlite3 API
// ---------------------------------------------------------------------------

function createMemoryDb() {
  const tables = {
    users: new Map(),
    campaigns: new Map(),
    campaign_steps: new Map(),
    leads: new Map(),
    email_log: new Map(),
    api_keys: new Map(),
  };

  function prepare(sql) {
    const upper = sql.trim().toUpperCase();

    if (upper.startsWith('CREATE TABLE') || upper.startsWith('PRAGMA')) {
      return { run: () => ({ changes: 0 }), get: () => null, all: () => [] };
    }
    if (upper.startsWith('SELECT')) {
      return { get: (...params) => selectOne(sql, params), all: (...params) => selectAll(sql, params) };
    }
    if (upper.startsWith('INSERT')) return { run: (...params) => insert(sql, params) };
    if (upper.startsWith('UPDATE')) return { run: (...params) => update(sql, params) };
    if (upper.startsWith('DELETE')) return { run: (...params) => deleteRows(sql, params) };
    return { run: () => ({ changes: 0 }), get: () => null, all: () => [] };
  }

  function tableName(sql) {
    const m = sql.match(/(?:FROM|INTO|UPDATE)\s+(\w+)/i);
    return m ? m[1].toLowerCase() : null;
  }

  function where(rows, clause, params) {
    if (!clause) return rows;
    let pi = 0;
    return rows.filter(row => {
      const parts = clause.split(/\s+AND\s+/i);
      return parts.every(part => {
        part = part.trim();
        const eq = part.match(/^(\w+)\s*=\s*\?$/);
        if (eq) {
          const val = params[pi++];
          if (val === null || val === undefined) return row[eq[1]] === null || row[eq[1]] === undefined;
          return String(row[eq[1]]) === String(val);
        }
        if (/^(\w+)\s+IS\s+NOT\s+NULL$/i.test(part)) return row[RegExp.$1] !== null && row[RegExp.$1] !== undefined;
        if (/^(\w+)\s+IS\s+NULL$/i.test(part)) return row[RegExp.$1] === null || row[RegExp.$1] === undefined;
        const eqLit = part.match(/^(\w+)\s*=\s*'([^']*)'$/);
        if (eqLit) return String(row[eqLit[1]]) === eqLit[2];
        const like = part.match(/^(\w+)\s+LIKE\s+'([^']*)'$/i);
        if (like) return String(row[like[1]] || '').toLowerCase().includes(like[2].replace(/%/g, '').toLowerCase());
        if (part === '1=1') return true;
        return true;
      });
    });
  }

  function selectOne(sql, params) {
    const rows = selectAll(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  function selectAll(sql, params) {
    const tName = tableName(sql);
    if (!tName || !tables[tName]) return [];

    let rows = Array.from(tables[tName].values());

    const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER\s+BY|\s+LIMIT|\s+OFFSET|$)/i);
    if (whereMatch) rows = where(rows, whereMatch[1], [...params]);

    const orderMatch = sql.match(/ORDER\s+BY\s+(\w+)(?:\s+(ASC|DESC))?/i);
    if (orderMatch) {
      const col = orderMatch[1];
      const dir = orderMatch[2] && orderMatch[2].toUpperCase() === 'DESC' ? -1 : 1;
      rows.sort((a, b) => { return ((a[col] || '') < (b[col] || '') ? -1 : 1) * dir; });
    }

    let limit = rows.length, offset = 0;
    const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
    if (limitMatch) limit = parseInt(limitMatch[1]);
    const offsetMatch = sql.match(/OFFSET\s+(\d+)/i);
    if (offsetMatch) offset = parseInt(offsetMatch[1]);
    rows = rows.slice(offset, offset + limit);

    const selectMatch = sql.match(/SELECT\s+(.+?)\s+FROM/i);
    if (!selectMatch) return rows.map(r => ({ ...r }));
    const cols = selectMatch[1].trim();
    if (cols === '*') return rows.map(r => ({ ...r }));
    const colList = cols.split(',').map(c => c.trim().split(/\s+/)[0]);
    return rows.map(row => { const obj = {}; colList.forEach(c => { obj[c] = row[c]; }); return obj; });
  }

  function insert(sql, params) {
    const tName = tableName(sql);
    if (!tName || !tables[tName]) return { changes: 0 };
    const m = sql.match(/INSERT\s+INTO\s+\w+\s*(?:\(([^)]+)\))?\s*VALUES\s*\(([^)]+)\)/i);
    if (!m) return { changes: 0 };
    const colNames = m[1] ? m[1].split(',').map(c => c.trim()) : [];
    const valExprs = m[2].split(',').map(v => v.trim());
    const row = {};
    let pi = 0;
    colNames.forEach((col, i) => {
      if (valExprs[i] === '?') row[col] = params[pi++];
      else if (/^datetime\('now'\)$/i.test(valExprs[i])) row[col] = new Date().toISOString().replace('T', ' ').slice(0, 19);
      else row[col] = valExprs[i].replace(/^['"]|['"]$/g, '');
    });
    tables[tName].set(row.id || `${tName}-${Date.now()}-${Math.random()}`, row);
    return { changes: 1, lastInsertRowid: tables[tName].size };
  }

  function update(sql, params) {
    const tName = tableName(sql);
    if (!tName || !tables[tName]) return { changes: 0 };
    const setMatch = sql.match(/SET\s+(.+?)(?:\s+WHERE|$)/i);
    if (!setMatch) return { changes: 0 };
    const setParts = setMatch[1].split(',').map(s => s.trim());
    const whereMatch = sql.match(/WHERE\s+(.+)/i);
    const rows = whereMatch
      ? where(Array.from(tables[tName].values()), whereMatch[1], [...params.slice(setParts.length)])
      : Array.from(tables[tName].values());
    let pi = 0;
    rows.forEach(row => {
      setParts.forEach(part => {
        const [col, val] = part.split('=').map(s => s.trim());
        if (val === '?') row[col] = params[pi++];
        else if (/^datetime\('now'\)$/i.test(val)) row[col] = new Date().toISOString().replace('T', ' ').slice(0, 19);
        else row[col] = val.replace(/^['"]|['"]$/g, '');
      });
    });
    return { changes: rows.length };
  }

  function deleteRows(sql, params) {
    const tName = tableName(sql);
    if (!tName || !tables[tName]) return { changes: 0 };
    const whereMatch = sql.match(/WHERE\s+(.+)/i);
    const rows = whereMatch
      ? where(Array.from(tables[tName].values()), whereMatch[1], [...params])
      : Array.from(tables[tName].values());
    rows.forEach(row => {
      for (const [key, val] of tables[tName]) {
        if (val === row) { tables[tName].delete(key); break; }
      }
    });
    return { changes: rows.length };
  }

  return { prepare };
}