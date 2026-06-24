/**
 * Database initialization module.
 *
 * In local development: uses SQLite via better-sqlite3 (persistent).
 * On Vercel (serverless): uses an in-memory store (ephemeral, resets on cold starts).
 *
 * Both implementations expose the same interface via `getDb()`.
 */

import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', '..', 'data', 'leadflow.db');

const IS_VERCEL = !!process.env.VERCEL;

let db = null;

/**
 * Returns the database instance based on the environment.
 * - Local: SQLite database
 * - Vercel: In-memory store (via import of store.js)
 */
export function getDb() {
  if (db) return db;

  if (IS_VERCEL) {
    // On Vercel, use the in-memory store
    // Lazy-imported to avoid loading SQLite native module on Vercel
    const store = createInMemoryStore();
    db = store;
    console.log('[DB] Using in-memory store (Vercel serverless)');
  } else {
    // Local development — SQLite
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    console.log('[DB] Using SQLite (local development)');
  }

  return db;
}

/**
 * Initialize the database schema (runs CREATE TABLE IF NOT EXISTS).
 * For Vercel, this is a no-op since the in-memory store is schema-less.
 */
export function initDb() {
  if (IS_VERCEL) {
    console.log('[DB] Schema init skipped (in-memory store)');
    return getDb();
  }

  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      company TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      stripe_customer_id TEXT,
      subscription_tier TEXT DEFAULT 'trial',
      trial_ends_at TEXT,
      onboarded INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS campaign_steps (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL REFERENCES campaigns(id),
      step_order INTEGER NOT NULL,
      delay_days INTEGER NOT NULL DEFAULT 0,
      subject TEXT,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      campaign_id TEXT REFERENCES campaigns(id),
      email TEXT NOT NULL,
      name TEXT,
      company TEXT,
      title TEXT,
      linkedin_url TEXT,
      status TEXT DEFAULT 'pending',
      score REAL DEFAULT 0.0,
      source TEXT DEFAULT 'manual',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS email_log (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL REFERENCES leads(id),
      campaign_step_id TEXT REFERENCES campaign_steps(id),
      subject TEXT,
      body TEXT,
      sent_at TEXT,
      opened_at TEXT,
      replied_at TEXT,
      status TEXT DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      key_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_used_at TEXT
    );
  `);

  return db;
}

/**
 * Creates an in-memory store with the same interface as SQLite's db.prepare.
 * Returns an object with `prepare(sql)` that returns statement objects
 * with `.run()`, `.get()`, `.all()` methods.
 */
function createInMemoryStore() {
  const tables = {
    users: [],
    campaigns: [],
    campaign_steps: [],
    leads: [],
    email_log: [],
    api_keys: [],
  };

  /**
   * A lightweight prepared-statement-like wrapper.
   * Parses simple SQL to determine operation and table,
   * then acts on the in-memory arrays.
   */
  function prepare(sql) {
    const normalized = sql.trim().toUpperCase();

    // INSERT
    if (normalized.startsWith('INSERT')) {
      return {
        run(...params) {
          // Extract table name and column values
          const match = sql.match(/INSERT\s+INTO\s+(\w+)\s*(?:\(([^)]+)\))?\s*VALUES\s*\(([^)]+)\)/i);
          if (!match) return { changes: 0 };

          const tableName = match[1].toLowerCase();
          const table = tables[tableName];
          if (!table) return { changes: 0 };

          const valueExprs = match[3].split(',').map(v => v.trim());
          const row = {};
          if (match[2]) {
            const cols = match[2].split(',').map(c => c.trim());
            cols.forEach((col, i) => {
              const val = params[i] !== undefined ? params[i] : resolveValue(valueExprs[i]);
              row[col] = val;
            });
          } else {
            // No column list — positional
            valueExprs.forEach((expr, i) => {
              const val = params[i] !== undefined ? params[i] : resolveValue(expr);
              row[i] = val;
            });
          }
          table.push(row);
          return { changes: 1, lastInsertRowid: table.length };
        },
      };
    }

    // SELECT with WHERE and optional ORDER BY / LIMIT / OFFSET
    if (normalized.startsWith('SELECT')) {
      return {
        get(...params) {
          const results = query(sql, params);
          return results[0] || null;
        },
        all(...params) {
          return query(sql, params);
        },
      };
    }

    // UPDATE
    if (normalized.startsWith('UPDATE')) {
      return {
        run(...params) {
          const match = sql.match(/UPDATE\s+(\w+)\s+SET\s+(.+?)(?:\s+WHERE\s+(.+))?$/i);
          if (!match) return { changes: 0 };

          const tableName = match[1].toLowerCase();
          const setClause = match[2];
          const whereClause = match[3];
          const table = tables[tableName];
          if (!table) return { changes: 0 };

          const setPairs = setClause.split(',').map(s => {
            const [col, val] = s.split('=').map(x => x.trim());
            return { col, val };
          });

          const rows = whereClause ? filterRows(table, whereClause, params) : table;
          rows.forEach(row => {
            setPairs.forEach(({ col, val }) => {
              row[col] = resolveParam(val, params);
            });
          });

          return { changes: rows.length };
        },
      };
    }

    // DELETE
    if (normalized.startsWith('DELETE')) {
      return {
        run(...params) {
          const match = sql.match(/DELETE\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+))?$/i);
          if (!match) return { changes: 0 };

          const tableName = match[1].toLowerCase();
          const whereClause = match[2];
          const table = tables[tableName];
          if (!table) return { changes: 0 };

          const toDelete = whereClause ? filterRows(table, whereClause, params) : [...table];
          toDelete.forEach(row => {
            const idx = table.indexOf(row);
            if (idx !== -1) table.splice(idx, 1);
          });

          return { changes: toDelete.length };
        },
      };
    }

    // PRAGMA / CREATE TABLE — no-op on in-memory store
    if (normalized.startsWith('PRAGMA') || normalized.startsWith('CREATE TABLE')) {
      return { run: () => ({ changes: 0 }), get: () => null, all: () => [] };
    }

    return { run: () => ({ changes: 0 }), get: () => null, all: () => [] };
  }

  // Helper functions
  function query(sql, params) {
    const match = sql.match(/SELECT\s+(.+?)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+?))?(?:\s+ORDER\s+BY\s+(.+?))?(?:\s+LIMIT\s+(\d+))?(?:\s+OFFSET\s+(\d+))?$/i);
    if (!match) return [];

    const tableName = match[2].toLowerCase();
    const table = tables[tableName];
    if (!table) return [];

    let rows = match[3] ? filterRows(table, match[3], params) : [...table];

    // ORDER BY
    if (match[4]) {
      const orderParts = match[4].trim().split(/\s+/);
      const orderCol = orderParts[0];
      const orderDir = orderParts[1] && orderParts[1].toUpperCase() === 'DESC' ? -1 : 1;
      rows.sort((a, b) => {
        if (a[orderCol] < b[orderCol]) return -1 * orderDir;
        if (a[orderCol] > b[orderCol]) return 1 * orderDir;
        return 0;
      });
    }

    // LIMIT / OFFSET
    const limit = match[5] ? parseInt(match[5]) : rows.length;
    const offset = match[6] ? parseInt(match[6]) : 0;
    rows = rows.slice(offset, offset + limit);

    // Select columns
    const selectCols = match[1].trim();
    if (selectCols === '*') return rows.map(r => ({ ...r }));

    const cols = selectCols.split(',').map(c => c.trim());
    return rows.map(row => {
      const result = {};
      cols.forEach(col => {
        const cleanCol = col.replace(/\s+\w+$/, ''); // strip alias
        result[cleanCol] = row[cleanCol];
      });
      return result;
    });
  }

  function filterRows(table, whereClause, params) {
    // Very simple WHERE parser — handles basic `col = ?` and `col = value` patterns
    let paramIdx = 0;
    return table.filter(row => {
      // Replace ? with actual params and evaluate
      let expr = whereClause;
      while (expr.includes('?')) {
        expr = expr.replace('?', JSON.stringify(params[paramIdx++]));
      }
      // Split on AND
      const conditions = expr.split(/\s+AND\s+/i);
      return conditions.every(cond => {
        const match = cond.match(/(\w+)\s*(=|!=|>|<|>=|<=|LIKE|IS\s+NOT|IS)\s*(.+)/i);
        if (!match) return true;
        const col = match[1];
        const op = match[2].toUpperCase().replace(/\s+/g, ' ');
        let val = match[3].replace(/^['"]|['"]$/g, '');
        const rowVal = row[col];

        if (op === '=') return String(rowVal) === val || rowVal === val;
        if (op === '!=') return String(rowVal) !== val;
        if (op === 'IS' && val.toUpperCase() === 'NULL') return rowVal === null || rowVal === undefined;
        if (op === 'IS NOT' && val.toUpperCase() === 'NULL') return rowVal !== null && rowVal !== undefined;
        if (op === 'LIKE') return String(rowVal).toLowerCase().includes(val.replace(/%/g, '').toLowerCase());
        return true;
      });
    });
  }

  function resolveValue(expr) {
    const e = expr.trim().toUpperCase();
    if (e === "DATETIME('NOW')" || e === "DATETIME('NOW')") {
      return new Date().toISOString().replace('T', ' ').slice(0, 19);
    }
    return null;
  }

  function resolveParam(val, params) {
    if (val === '?') return params.shift();
    if (val === "datetime('now')") return new Date().toISOString().replace('T', ' ').slice(0, 19);
    return val.replace(/^['"]|['"]$/g, '');
  }

  return { prepare, ...tables };
}