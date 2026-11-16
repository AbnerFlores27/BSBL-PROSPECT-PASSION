/* DiamondIQ — Data Persistence & Auth Layer
   Supports PostgreSQL (via pg + DATABASE_URL) with automatic,
   API-compatible in-memory fallback when DATABASE_URL is unset. */

const crypto = require('crypto');
const { Pool } = require('pg');
const { SCENARIOS } = require('./data');

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== 'string' || !storedHash.includes(':')) {
    return false;
  }
  const [salt, keyHex] = storedHash.split(':');
  const keyBuf = Buffer.from(keyHex, 'hex');
  const derivedBuf = crypto.scryptSync(password, salt, 64);
  if (keyBuf.length !== derivedBuf.length) return false;
  return crypto.timingSafeEqual(keyBuf, derivedBuf);
}

/* =========================================================
   In-Memory Store (active when DATABASE_URL is unset)
   ========================================================= */
function createMemoryStore() {
  let nextUserId = 1;
  let nextEntryId = 1;

  const users = []; // { id, username, email, passwordHash, createdAt }
  const sessions = new Map(); // token -> { token, userId, expiresAt }
  const scenarios = SCENARIOS.map((s) => ({ ...s }));
  const playbookEntries = []; // { id, userId, title, body, rating, createdAt, updatedAt }
  const favorites = new Map(); // userId -> Set<scenarioId>
  const triviaMastered = new Map(); // userId -> Set<scenarioId>
  const scenarioRatings = new Map(); // scenarioId -> Map<userId, stars>

  function toPublicUser(u) {
    return u ? { id: u.id, username: u.username, email: u.email, createdAt: u.createdAt } : null;
  }

  return {
    mode: 'memory',
    async ensureReady() {
      return;
    },

    async createUser({ username, email, password }) {
      const normUser = username.trim().toLowerCase();
      const normEmail = email.trim().toLowerCase();
      const conflict = users.find(
        (u) => u.username.toLowerCase() === normUser || u.email.toLowerCase() === normEmail
      );
      if (conflict) {
        const field = conflict.email.toLowerCase() === normEmail ? 'email' : 'username';
        const err = new Error(`That ${field} is already taken.`);
        err.code = 'CONFLICT';
        throw err;
      }
      const user = {
        id: nextUserId++,
        username: username.trim(),
        email: normEmail,
        passwordHash: hashPassword(password),
        createdAt: new Date().toISOString()
      };
      users.push(user);
      return toPublicUser(user);
    },

    async verifyUserCredentials(identifier, password) {
      const needle = identifier.trim().toLowerCase();
      const user = users.find(
        (u) => u.username.toLowerCase() === needle || u.email.toLowerCase() === needle
      );
      if (!user || !verifyPassword(password, user.passwordHash)) {
        return null;
      }
      return toPublicUser(user);
    },

    async createSession(userId) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = Date.now() + SESSION_TTL_MS;
      sessions.set(token, { token, userId, expiresAt });
      return token;
    },

    async getUserBySession(token) {
      if (!token) return null;
      const sess = sessions.get(token);
      if (!sess) return null;
      if (Date.now() > sess.expiresAt) {
        sessions.delete(token);
        return null;
      }
      const user = users.find((u) => u.id === sess.userId);
      return toPublicUser(user);
    },

    async deleteSession(token) {
      if (token) sessions.delete(token);
    },

    async listScenarios({ q = '', category = 'all', sort = 'az' } = {}) {
      let list = [...scenarios];
      const query = String(q || '').trim().toLowerCase();
      if (query) {
        list = list.filter(
          (s) =>
            s.title.toLowerCase().includes(query) ||
            s.shortSummary.toLowerCase().includes(query) ||
            s.quickTakeaway.toLowerCase().includes(query) ||
            s.categoryLabel.toLowerCase().includes(query)
        );
      }
      if (category && category !== 'all') {
        list = list.filter((s) => s.category === category);
      }
      if (sort === 'difficulty') {
        list.sort((a, b) => a.difficulty - b.difficulty || a.title.localeCompare(b.title));
      } else if (sort === 'popularity') {
        list.sort((a, b) => b.popularity - a.popularity || a.title.localeCompare(b.title));
      } else {
        list.sort((a, b) => a.title.localeCompare(b.title));
      }
      return list;
    },

    async getScenarioById(id) {
      return scenarios.find((s) => s.id === id) || null;
    },

    async listFavorites(userId) {
      if (!userId) return [];
      const set = favorites.get(userId);
      return set ? Array.from(set) : [];
    },

    async addFavorite(userId, scenarioId) {
      if (!favorites.has(userId)) favorites.set(userId, new Set());
      favorites.get(userId).add(scenarioId);
      return Array.from(favorites.get(userId));
    },

    async removeFavorite(userId, scenarioId) {
      if (favorites.has(userId)) favorites.get(userId).delete(scenarioId);
      return this.listFavorites(userId);
    },

    async markTriviaMastered(userId, scenarioId) {
      if (!userId) return false;
      if (!triviaMastered.has(userId)) triviaMastered.set(userId, new Set());
      triviaMastered.get(userId).add(scenarioId);
      return true;
    },

    async getUserStats(userId) {
      if (!userId) {
        return { masteredCount: 0, favoritesCount: 0, playbookCount: 0 };
      }
      const masteredCount = triviaMastered.get(userId)?.size || 0;
      const favoritesCount = favorites.get(userId)?.size || 0;
      const playbookCount = playbookEntries.filter((e) => e.userId === userId).length;
      return { masteredCount, favoritesCount, playbookCount };
    },

    async getScenarioRating(scenarioId, userId) {
      const map = scenarioRatings.get(scenarioId);
      if (!map || map.size === 0) {
        return { average: 0, count: 0, userStars: null };
      }
      const values = Array.from(map.values());
      const sum = values.reduce((acc, v) => acc + v, 0);
      const average = Math.round((sum / values.length) * 10) / 10;
      const userStars = userId && map.has(userId) ? map.get(userId) : null;
      return { average, count: values.length, userStars };
    },

    async upsertScenarioRating(scenarioId, userId, stars) {
      if (!scenarioRatings.has(scenarioId)) scenarioRatings.set(scenarioId, new Map());
      scenarioRatings.get(scenarioId).set(userId, stars);
      return this.getScenarioRating(scenarioId, userId);
    },

    async listPlaybookEntries(userId) {
      return playbookEntries
        .filter((e) => e.userId === userId)
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    },

    async createPlaybookEntry(userId, { title, body, rating }) {
      const now = new Date().toISOString();
      const entry = {
        id: nextEntryId++,
        userId,
        title,
        body,
        rating,
        createdAt: now,
        updatedAt: now
      };
      playbookEntries.push(entry);
      return entry;
    },

    async updatePlaybookEntry(id, userId, { title, body, rating }) {
      const entry = playbookEntries.find((e) => e.id === Number(id));
      if (!entry) return { status: 'not_found' };
      if (entry.userId !== userId) return { status: 'forbidden' };
      entry.title = title;
      entry.body = body;
      entry.rating = rating;
      entry.updatedAt = new Date().toISOString();
      return { status: 'ok', entry };
    },

    async deletePlaybookEntry(id, userId) {
      const idx = playbookEntries.findIndex((e) => e.id === Number(id));
      if (idx === -1) return { status: 'not_found' };
      if (playbookEntries[idx].userId !== userId) return { status: 'forbidden' };
      playbookEntries.splice(idx, 1);
      return { status: 'ok' };
    }
  };
}

/* =========================================================
   PostgreSQL Store (active when DATABASE_URL is configured)
   ========================================================= */
function createPostgresStore(connectionString) {
  const pool = new Pool({
    connectionString,
    max: 10,
    connectionTimeoutMillis: 10000
  });

  pool.on('error', (err) => {
    console.error('Unexpected PostgreSQL pool error:', err);
  });

  let initPromise = null;

  async function initSchemaAndSeed() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS scenarios (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        category_label TEXT NOT NULL,
        difficulty INTEGER NOT NULL,
        popularity INTEGER NOT NULL,
        short_summary TEXT NOT NULL,
        quick_takeaway TEXT NOT NULL,
        key_rule TEXT NOT NULL,
        meters_json JSONB NOT NULL,
        diagram_json JSONB NOT NULL,
        experts_json JSONB NOT NULL,
        trivia_json JSONB NOT NULL
      );
      CREATE TABLE IF NOT EXISTS playbook_entries (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS favorites (
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        scenario_id TEXT NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, scenario_id)
      );
      CREATE TABLE IF NOT EXISTS trivia_mastered (
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        scenario_id TEXT NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, scenario_id)
      );
      CREATE TABLE IF NOT EXISTS scenario_ratings (
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        scenario_id TEXT NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
        stars INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, scenario_id)
      );
    `);

    for (const s of SCENARIOS) {
      await pool.query(
        `INSERT INTO scenarios (
          id, title, category, category_label, difficulty, popularity,
          short_summary, quick_takeaway, key_rule,
          meters_json, diagram_json, experts_json, trivia_json
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          category = EXCLUDED.category,
          category_label = EXCLUDED.category_label,
          difficulty = EXCLUDED.difficulty,
          popularity = EXCLUDED.popularity,
          short_summary = EXCLUDED.short_summary,
          quick_takeaway = EXCLUDED.quick_takeaway,
          key_rule = EXCLUDED.key_rule,
          meters_json = EXCLUDED.meters_json,
          diagram_json = EXCLUDED.diagram_json,
          experts_json = EXCLUDED.experts_json,
          trivia_json = EXCLUDED.trivia_json`,
        [
          s.id,
          s.title,
          s.category,
          s.categoryLabel,
          s.difficulty,
          s.popularity,
          s.shortSummary,
          s.quickTakeaway,
          s.keyRule,
          JSON.stringify(s.meters),
          JSON.stringify(s.diagram),
          JSON.stringify(s.experts),
          JSON.stringify(s.trivia)
        ]
      );
    }
  }

  function mapScenarioRow(row) {
    return {
      id: row.id,
      title: row.title,
      category: row.category,
      categoryLabel: row.category_label,
      difficulty: row.difficulty,
      popularity: row.popularity,
      shortSummary: row.short_summary,
      quickTakeaway: row.quick_takeaway,
      keyRule: row.key_rule,
      meters: row.meters_json,
      diagram: row.diagram_json,
      experts: row.experts_json,
      trivia: row.trivia_json
    };
  }

  function mapEntryRow(row) {
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      body: row.body,
      rating: row.rating,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  return {
    mode: 'postgres',
    async ensureReady() {
      if (!initPromise) {
        initPromise = initSchemaAndSeed().catch((err) => {
          initPromise = null;
          throw err;
        });
      }
      return initPromise;
    },

    async createUser({ username, email, password }) {
      await this.ensureReady();
      const normEmail = email.trim().toLowerCase();
      const cleanUser = username.trim();
      const existing = await pool.query(
        'SELECT username, email FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($2)',
        [cleanUser, normEmail]
      );
      if (existing.rows.length > 0) {
        const field = existing.rows[0].email.toLowerCase() === normEmail ? 'email' : 'username';
        const err = new Error(`That ${field} is already taken.`);
        err.code = 'CONFLICT';
        throw err;
      }
      const res = await pool.query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
        [cleanUser, normEmail, hashPassword(password)]
      );
      const r = res.rows[0];
      return { id: r.id, username: r.username, email: r.email, createdAt: r.created_at };
    },

    async verifyUserCredentials(identifier, password) {
      await this.ensureReady();
      const needle = identifier.trim().toLowerCase();
      const res = await pool.query(
        'SELECT id, username, email, password_hash, created_at FROM users WHERE LOWER(username) = $1 OR LOWER(email) = $1',
        [needle]
      );
      if (res.rows.length === 0) return null;
      const row = res.rows[0];
      if (!verifyPassword(password, row.password_hash)) return null;
      return { id: row.id, username: row.username, email: row.email, createdAt: row.created_at };
    },

    async createSession(userId) {
      await this.ensureReady();
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
      await pool.query(
        'INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, $3)',
        [token, userId, expiresAt]
      );
      return token;
    },

    async getUserBySession(token) {
      if (!token) return null;
      await this.ensureReady();
      const res = await pool.query(
        `SELECT u.id, u.username, u.email, u.created_at, s.expires_at
         FROM sessions s
         JOIN users u ON u.id = s.user_id
         WHERE s.token = $1`,
        [token]
      );
      if (res.rows.length === 0) return null;
      const row = res.rows[0];
      if (new Date(row.expires_at).getTime() < Date.now()) {
        await pool.query('DELETE FROM sessions WHERE token = $1', [token]);
        return null;
      }
      return { id: row.id, username: row.username, email: row.email, createdAt: row.created_at };
    },

    async deleteSession(token) {
      if (!token) return;
      await this.ensureReady();
      await pool.query('DELETE FROM sessions WHERE token = $1', [token]);
    },

    async listScenarios({ q = '', category = 'all', sort = 'az' } = {}) {
      await this.ensureReady();
      const where = [];
      const params = [];
      if (q && q.trim()) {
        params.push(`%${q.trim().toLowerCase()}%`);
        where.push(
          `(LOWER(title) LIKE $${params.length} OR LOWER(short_summary) LIKE $${params.length} OR LOWER(quick_takeaway) LIKE $${params.length})`
        );
      }
      if (category && category !== 'all') {
        params.push(category);
        where.push(`category = $${params.length}`);
      }
      let orderBy = 'title ASC';
      if (sort === 'difficulty') orderBy = 'difficulty ASC, title ASC';
      if (sort === 'popularity') orderBy = 'popularity DESC, title ASC';
      const sql = `SELECT * FROM scenarios ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY ${orderBy}`;
      const res = await pool.query(sql, params);
      return res.rows.map(mapScenarioRow);
    },

    async getScenarioById(id) {
      await this.ensureReady();
      const res = await pool.query('SELECT * FROM scenarios WHERE id = $1', [id]);
      return res.rows[0] ? mapScenarioRow(res.rows[0]) : null;
    },

    async listFavorites(userId) {
      if (!userId) return [];
      await this.ensureReady();
      const res = await pool.query('SELECT scenario_id FROM favorites WHERE user_id = $1', [userId]);
      return res.rows.map((r) => r.scenario_id);
    },

    async addFavorite(userId, scenarioId) {
      await this.ensureReady();
      await pool.query(
        'INSERT INTO favorites (user_id, scenario_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [userId, scenarioId]
      );
      return this.listFavorites(userId);
    },

    async removeFavorite(userId, scenarioId) {
      await this.ensureReady();
      await pool.query('DELETE FROM favorites WHERE user_id = $1 AND scenario_id = $2', [userId, scenarioId]);
      return this.listFavorites(userId);
    },

    async markTriviaMastered(userId, scenarioId) {
      if (!userId) return false;
      await this.ensureReady();
      await pool.query(
        'INSERT INTO trivia_mastered (user_id, scenario_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [userId, scenarioId]
      );
      return true;
    },

    async getUserStats(userId) {
      if (!userId) return { masteredCount: 0, favoritesCount: 0, playbookCount: 0 };
      await this.ensureReady();
      const [m, f, p] = await Promise.all([
        pool.query('SELECT COUNT(*)::int AS cnt FROM trivia_mastered WHERE user_id = $1', [userId]),
        pool.query('SELECT COUNT(*)::int AS cnt FROM favorites WHERE user_id = $1', [userId]),
        pool.query('SELECT COUNT(*)::int AS cnt FROM playbook_entries WHERE user_id = $1', [userId])
      ]);
      return {
        masteredCount: m.rows[0].cnt,
        favoritesCount: f.rows[0].cnt,
        playbookCount: p.rows[0].cnt
      };
    },

    async getScenarioRating(scenarioId, userId) {
      await this.ensureReady();
      const agg = await pool.query(
        'SELECT COALESCE(ROUND(AVG(stars)::numeric, 1), 0) AS avg, COUNT(*)::int AS cnt FROM scenario_ratings WHERE scenario_id = $1',
        [scenarioId]
      );
      let userStars = null;
      if (userId) {
        const u = await pool.query(
          'SELECT stars FROM scenario_ratings WHERE scenario_id = $1 AND user_id = $2',
          [scenarioId, userId]
        );
        if (u.rows[0]) userStars = u.rows[0].stars;
      }
      return {
        average: Number(agg.rows[0].avg) || 0,
        count: agg.rows[0].cnt,
        userStars
      };
    },

    async upsertScenarioRating(scenarioId, userId, stars) {
      await this.ensureReady();
      await pool.query(
        `INSERT INTO scenario_ratings (user_id, scenario_id, stars, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (user_id, scenario_id)
         DO UPDATE SET stars = EXCLUDED.stars, updated_at = NOW()`,
        [userId, scenarioId, stars]
      );
      return this.getScenarioRating(scenarioId, userId);
    },

    async listPlaybookEntries(userId) {
      await this.ensureReady();
      const res = await pool.query(
        'SELECT * FROM playbook_entries WHERE user_id = $1 ORDER BY updated_at DESC, id DESC',
        [userId]
      );
      return res.rows.map(mapEntryRow);
    },

    async createPlaybookEntry(userId, { title, body, rating }) {
      await this.ensureReady();
      const res = await pool.query(
        `INSERT INTO playbook_entries (user_id, title, body, rating)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [userId, title, body, rating]
      );
      return mapEntryRow(res.rows[0]);
    },

    async updatePlaybookEntry(id, userId, { title, body, rating }) {
      await this.ensureReady();
      const existing = await pool.query('SELECT user_id FROM playbook_entries WHERE id = $1', [id]);
      if (existing.rows.length === 0) return { status: 'not_found' };
      if (existing.rows[0].user_id !== userId) return { status: 'forbidden' };
      const res = await pool.query(
        `UPDATE playbook_entries
         SET title = $1, body = $2, rating = $3, updated_at = NOW()
         WHERE id = $4 AND user_id = $5
         RETURNING *`,
        [title, body, rating, id, userId]
      );
      return { status: 'ok', entry: mapEntryRow(res.rows[0]) };
    },

    async deletePlaybookEntry(id, userId) {
      await this.ensureReady();
      const existing = await pool.query('SELECT user_id FROM playbook_entries WHERE id = $1', [id]);
      if (existing.rows.length === 0) return { status: 'not_found' };
      if (existing.rows[0].user_id !== userId) return { status: 'forbidden' };
      await pool.query('DELETE FROM playbook_entries WHERE id = $1 AND user_id = $2', [id, userId]);
      return { status: 'ok' };
    }
  };
}

const memoryFallback = createMemoryStore();
const dbUrl = (process.env.DATABASE_URL || '').trim();
const primaryStore = dbUrl ? createPostgresStore(dbUrl) : memoryFallback;

module.exports = {
  store: primaryStore
};
