import Dexie from 'dexie';

export const db = new Dexie('PawPrintDB');

db.version(1).stores({
  surveys: 'id, status, token, updated_at',
  sessions: 'id, survey_id, status, started_at',
  answers: 'id, session_id, survey_id, question_id',
  panel_campaigns: 'id, survey_id, status',
  themes: 'id, survey_id',
});

// ── Migration helper: import existing localStorage data into IndexedDB ──
export async function migrateFromLocalStorage() {
  const tables = ['surveys', 'sessions', 'answers', 'panel_campaigns', 'themes'];
  for (const table of tables) {
    const key = 'sl_' + table;
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    try {
      const rows = JSON.parse(raw);
      if (Array.isArray(rows) && rows.length > 0) {
        const existing = await db[table].count();
        if (existing === 0) {
          await db[table].bulkPut(rows);
          console.log(`Migrated ${rows.length} rows to IndexedDB: ${table}`);
        }
      }
    } catch (e) {
      console.warn(`Migration failed for ${table}:`, e);
    }
  }
}

// ── DB helper that mirrors the old LS API but uses IndexedDB ──
// All methods are async. Components should use React hooks (see useDB).
export const DB = {
  async all(table) {
    return db[table].toArray();
  },
  async find(table, id) {
    return db[table].get(id);
  },
  async insert(table, row) {
    await db[table].put(row);
    return row;
  },
  async update(table, id, changes) {
    const existing = await db[table].get(id);
    if (existing) {
      await db[table].put({ ...existing, ...changes });
    }
  },
  async remove(table, id) {
    await db[table].delete(id);
  },
  async where(table, pred) {
    const all = await db[table].toArray();
    return all.filter(pred);
  },
  async bulkRemove(table, ids) {
    await db[table].bulkDelete(ids);
  },
};

export const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
export const now = () => new Date().toISOString();
