/* DiamondIQ — Database Layer (PostgreSQL via Replit DATABASE_URL + In-Memory Fallback)
   Uses parameterized SQL queries, scrypt password hashing, and automatic schema + seed setup. */
const crypto = require('crypto');
const { Pool } = require('pg');
const seedData = require('./data');

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password, storedHash) {
  const parts = String(storedHash || '').split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const keyBuf = Buffer.from(keyHex, 'hex');
  const derivedBuf = crypto.scryptSync(password, salt, 64);
  if (keyBuf.length !== derivedBuf.length) return false;
  return crypto.timingSafeEqual(keyBuf, derivedBuf);
}

function createToken() {
  return crypto.randomBytes(32).toString('hex');
}

/* =========================================================
   PostgreSQL Implementation (Active when DATABASE_URL is set)
   ========================================================= */
function createPostgresStore(connectionString) {
  const useSsl =
    connectionString.includes('sslmode=require') ||
    process.env.PGSSLMODE === 'require' ||
    process.env.NODE_ENV === 'production';

  const pool = new Pool({
    connectionString,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined
  });

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

  async function init() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
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

    for (const s of seedData.scenarios) {
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

  return {
    mode: 'postgres',
    init,

    async createUser({ username, email, password }) {
      const cleanUser = username.trim();
      const cleanEmail = email.trim().toLowerCase();
      const existing = await pool.query(
        'SELECT id FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($2)',
        [cleanUser, cleanEmail]
      );
      if (existing.rows.length > 0) {
        const err = new Error('An account with that username or email already exists.');
        err.statusCode = 409;
        throw err;
      }
      const passwordHash = hashPassword(password);
      const result = await pool.query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
        [cleanUser, cleanEmail, passwordHash]
      );
      return result.rows[0];
    },

    async authenticateUser({ identifier, password }) {
      const clean = identifier.trim();
      const result = await pool.query(
        'SELECT id, username, email, password_hash FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1)',
        [clean]
      );
      const user = result.rows[0];
      if (!user || !verifyPassword(password, user.password_hash)) {
        return null;
      }
      return { id: user.id, username: user.username, email: user.email };
    },

    async createSession(userId) {
      const token = createToken();
      const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
      await pool.query(
        'INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, $3)',
        [token, userId, expiresAt]
      );
      return { token, expiresAt };
    },

    async getSessionUser(token) {
      if (!token) return null;
      const result = await pool.query(
        `SELECT u.id, u.username, u.email, s.expires_at
         FROM sessions s
         JOIN users u ON u.id = s.user_id
         WHERE s.token = $1`,
        [token]
      );
      const row = result.rows[0];
      if (!row) return null;
      if (new Date(row.expires_at).getTime() < Date.now()) {
        await pool.query('DELETE FROM sessions WHERE token = $1', [token]);
        return null;
      }
      return { id: row.id, username: row.username, email: row.email };
    },

    async deleteSession(token) {
      if (!token) return;
      await pool.query('DELETE FROM sessions WHERE token = $1', [token]);
    },

    async listScenarios() {
      const result = await pool.query('SELECT * FROM scenarios ORDER BY title ASC');
      return result.rows.map(mapScenarioRow);
    },

    async getScenarioById(id) {
      const result = await pool.query('SELECT * FROM scenarios WHERE id = $1', [id]);
      return result.rows[0] ? mapScenarioRow(result.rows[0]) : null;
    },

    async getFavorites(userId) {
      const result = await pool.query(
        'SELECT scenario_id FROM favorites WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
      return result.rows.map((r) => r.scenario_id);
    },

    async addFavorite(userId, scenarioId) {
      await pool.query(
        'INSERT INTO favorites (user_id, scenario_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [userId, scenarioId]
      );
      return this.getFavorites(userId);
    },

    async removeFavorite(userId, scenarioId) {
      await pool.query(
        'DELETE FROM favorites WHERE user_id = $1 AND scenario_id = $2',
        [userId, scenarioId]
      );
      return this.getFavorites(userId);
    },

    async getMastered(userId) {
      const result = await pool.query(
        'SELECT scenario_id FROM trivia_mastered WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
      return result.rows.map((r) => r.scenario_id);
    },

    async recordMastered(userId, scenarioId) {
      await pool.query(
        'INSERT INTO trivia_mastered (user_id, scenario_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [userId, scenarioId]
      );
      return this.getMastered(userId);
    },

    async getScenarioRating(scenarioId, userId) {
      const agg = await pool.query(
        'SELECT COALESCE(ROUND(AVG(stars)::numeric, 1), 0) AS avg, COUNT(*)::int AS count FROM scenario_ratings WHERE scenario_id = $1',
        [scenarioId]
      );
      let userStars = null;
      if (userId) {
        const mine = await pool.query(
          'SELECT stars FROM scenario_ratings WHERE scenario_id = $1 AND user_id = $2',
          [scenarioId, userId]
        );
        userStars = mine.rows[0] ? mine.rows[0].stars : null;
      }
      return { average: Number(agg.rows[0].avg), count: agg.rows[0].count, userStars };
    },

    async setScenarioRating(userId, scenarioId, stars) {
      await pool.query(
        `INSERT INTO scenario_ratings (user_id, scenario_id, stars, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (user_id, scenario_id) DO UPDATE SET stars = EXCLUDED.stars, updated_at = NOW()`,
        [userId, scenarioId, stars]
      );
      return this.getScenarioRating(scenarioId, userId);
    },

    async listPlaybookEntries(userId) {
      const result = await pool.query(
        `SELECT id, user_id, title, body, rating, created_at, updated_at
         FROM playbook_entries
         WHERE user_id = $1
         ORDER BY updated_at DESC, id DESC`,
        [userId]
      );
      return result.rows;
    },

    async createPlaybookEntry(userId, { title, body, rating }) {
      const result = await pool.query(
        `INSERT INTO playbook_entries (user_id, title, body, rating)
         VALUES ($1, $2, $3, $4)
         RETURNING id, user_id, title, body, rating, created_at, updated_at`,
        [userId, title, body, rating]
      );
      return result.rows[0];
    },

    async updatePlaybookEntry(userId, entryId, { title, body, rating }) {
      const check = await pool.query('SELECT user_id FROM playbook_entries WHERE id = $1', [entryId]);
      if (!check.rows[0]) {
        const err = new Error('Playbook entry not found.');
        err.statusCode = 404;
        throw err;
      }
      if (check.rows[0].user_id !== userId) {
        const err = new Error('You can only edit your own playbook entries.');
        err.statusCode = 403;
        throw err;
      }
      const result = await pool.query(
        `UPDATE playbook_entries
         SET title = $1, body = $2, rating = $3, updated_at = NOW()
         WHERE id = $4 AND user_id = $5
         RETURNING id, user_id, title, body, rating, created_at, updated_at`,
        [title, body, rating, entryId, userId]
      );
      return result.rows[0];
    },

    async deletePlaybookEntry(userId, entryId) {
      const check = await pool.query('SELECT user_id FROM playbook_entries WHERE id = $1', [entryId]);
      if (!check.rows[0]) {
        const err = new Error('Playbook entry not found.');
        err.statusCode = 404;
        throw err;
      }
      if (check.rows[0].user_id !== userId) {
        const err = new Error('You can only delete your own playbook entries.');
        err.statusCode = 403;
        throw err;
      }
      await pool.query('DELETE FROM playbook_entries WHERE id = $1 AND user_id = $2', [entryId, userId]);
    }
  };
}

/* =========================================================
   In-Memory Store Fallback (Used when DATABASE_URL is unset)
   ========================================================= */
function createMemoryStore() {
  let nextUserId = 1;
  let nextEntryId = 1;
  const users = [];
  const sessions = new Map();
  const scenarios = seedData.scenarios.map((s) => JSON.parse(JSON.stringify(s)));
  const playbookEntries = [];
  const favorites = new Map(); // userId -> Set(scenarioId)
  const mastered = new Map(); // userId -> Set(scenarioId)
  const ratings = new Map(); // scenarioId -> Map(userId -> stars)

  return {
    mode: 'memory',
    async init() {
      console.log('DiamondIQ running with in-memory store (set DATABASE_URL for PostgreSQL persistence).');
    },

    async createUser({ username, email, password }) {
      const cleanUser = username.trim();
      const cleanEmail = email.trim().toLowerCase();
      const dup = users.find(
        (u) => u.username.toLowerCase() === cleanUser.toLowerCase() || u.email.toLowerCase() === cleanEmail
      );
      if (dup) {
        const err = new Error('An account with that username or email already exists.');
        err.statusCode = 409;
        throw err;
      }
      const user = {
        id: nextUserId++,
        username: cleanUser,
        email: cleanEmail,
        password_hash: hashPassword(password),
        created_at: new Date().toISOString()
      };
      users.push(user);
      return { id: user.id, username: user.username, email: user.email, created_at: user.created_at };
    },

    async authenticateUser({ identifier, password }) {
      const clean = identifier.trim().toLowerCase();
      const user = users.find(
        (u) => u.username.toLowerCase() === clean || u.email.toLowerCase() === clean
      );
      if (!user || !verifyPassword(password, user.password_hash)) {
        return null;
      }
      return { id: user.id, username: user.username, email: user.email };
    },

    async createSession(userId) {
      const token = createToken();
      const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
      sessions.set(token, { userId, expiresAt: expiresAt.getTime() });
      return { token, expiresAt };
    },

    async getSessionUser(token) {
      if (!token) return null;
      const sess = sessions.get(token);
      if (!sess) return null;
      if (sess.expiresAt < Date.now()) {
        sessions.delete(token);
        return null;
      }
      const user = users.find((u) => u.id === sess.userId);
      return user ? { id: user.id, username: user.username, email: user.email } : null;
    },

    async deleteSession(token) {
      if (token) sessions.delete(token);
    },

    async listScenarios() {
      return scenarios.slice().sort((a, b) => a.title.localeCompare(b.title));
    },

    async getScenarioById(id) {
      return scenarios.find((s) => s.id === id) || null;
    },

    async getFavorites(userId) {
      return Array.from(favorites.get(userId) || []);
    },

    async addFavorite(userId, scenarioId) {
      if (!favorites.has(userId)) favorites.set(userId, new Set());
      favorites.get(userId).add(scenarioId);
      return this.getFavorites(userId);
    },

    async removeFavorite(userId, scenarioId) {
      if (favorites.has(userId)) favorites.get(userId).delete(scenarioId);
      return this.getFavorites(userId);
    },

    async getMastered(userId) {
      return Array.from(mastered.get(userId) || []);
    },

    async recordMastered(userId, scenarioId) {
      if (!mastered.has(userId)) mastered.set(userId, new Set());
      mastered.get(userId).add(scenarioId);
      return this.getMastered(userId);
    },

    async getScenarioRating(scenarioId, userId) {
      const byUser = ratings.get(scenarioId);
      if (!byUser || byUser.size === 0) {
        return { average: 0, count: 0, userStars: null };
      }
      let sum = 0;
      byUser.forEach((v) => { sum += v; });
      return {
        average: Number((sum / byUser.size).toFixed(1)),
        count: byUser.size,
        userStars: userId && byUser.has(userId) ? byUser.get(userId) : null
      };
    },

    async setScenarioRating(userId, scenarioId, stars) {
      if (!ratings.has(scenarioId)) ratings.set(scenarioId, new Map());
      ratings.get(scenarioId).set(userId, stars);
      return this.getScenarioRating(scenarioId, userId);
    },

    async listPlaybookEntries(userId) {
      return playbookEntries
        .filter((e) => e.user_id === userId)
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    },

    async createPlaybookEntry(userId, { title, body, rating }) {
      const now = new Date().toISOString();
      const entry = {
        id: nextEntryId++,
        user_id: userId,
        title,
        body,
        rating,
        created_at: now,
        updated_at: now
      };
      playbookEntries.unshift(entry);
      return entry;
    },

    async updatePlaybookEntry(userId, entryId, { title, body, rating }) {
      const entry = playbookEntries.find((e) => e.id === Number(entryId));
      if (!entry) {
        const err = new Error('Playbook entry not found.');
        err.statusCode = 404;
        throw err;
      }
      if (entry.user_id !== userId) {
        const err = new Error('You can only edit your own playbook entries.');
        err.statusCode = 403;
        throw err;
      }
      entry.title = title;
      entry.body = body;
      entry.rating = rating;
      entry.updated_at = new Date().toISOString();
      return entry;
    },

    async deletePlaybookEntry(userId, entryId) {
      const idx = playbookEntries.findIndex((e) => e.id === Number(entryId));
      if (idx === -1) {
        const err = new Error('Playbook entry not found.');
        err.statusCode = 404;
        throw err;
      }
      if (playbookEntries[idx].user_id !== userId) {
        const err = new Error('You can only delete your own playbook entries.');
        err.statusCode = 403;
        throw err;
      }
      playbookEntries.splice(idx, 1);
    }
  };
}

function createStore() {
  if (process.env.DATABASE_URL) {
    return createPostgresStore(process.env.DATABASE_URL);
  }
  return createMemoryStore();
}

module.exports = { createStore };
