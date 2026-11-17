/* DiamondIQ — Phase 4 Database & Auth Layer
   Supports PostgreSQL (via pg + DATABASE_URL) with automatic
   local file persistence (.diamondiq-store.json) when DATABASE_URL is unset. */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Pool } = require('pg');
const { SCENARIOS } = require('./data');

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const LOCAL_STORE_PATH = path.join(__dirname, '.diamondiq-store.json');

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
   Local Persistent Store (when DATABASE_URL is unset)
   ========================================================= */
function createLocalStore() {
  let nextUserId = 1;
  let nextEntryId = 1;
  let users = []; // { id, username, email, passwordHash, createdAt }
  const sessions = new Map(); // token -> { token, userId, expiresAt }
  const scenarios = SCENARIOS.map((s) => ({ ...s }));
  let playbookEntries = []; // { id, userId, title, body, rating, createdAt, updatedAt }
  let favorites = []; // { userId, scenarioId, createdAt }
  let triviaMastered = []; // { userId, scenarioId, createdAt }
  let scenarioRatings = []; // { userId, scenarioId, stars, updatedAt }

  function loadFromDisk() {
    try {
      if (!fs.existsSync(LOCAL_STORE_PATH)) return;
      const raw = JSON.parse(fs.readFileSync(LOCAL_STORE_PATH, 'utf8'));
      if (Number.isInteger(raw.nextUserId)) nextUserId = raw.nextUserId;
      if (Number.isInteger(raw.nextEntryId)) nextEntryId = raw.nextEntryId;
      if (Array.isArray(raw.users)) users = raw.users;
      if (Array.isArray(raw.playbookEntries)) playbookEntries = raw.playbookEntries;
      if (Array.isArray(raw.favorites)) favorites = raw.favorites;
      if (Array.isArray(raw.triviaMastered)) triviaMastered = raw.triviaMastered;
      if (Array.isArray(raw.scenarioRatings)) scenarioRatings = raw.scenarioRatings;
      if (Array.isArray(raw.sessions)) {
        for (const s of raw.sessions) {
          if (s && s.token && s.expiresAt > Date.now()) sessions.set(s.token, s);
        }
      }
    } catch (err) {
      console.warn('Could not read local store file, starting fresh:', err.message);
    }
  }

  function saveToDisk() {
    try {
      const payload = {
        nextUserId,
        nextEntryId,
        users,
        sessions: Array.from(sessions.values()),
        playbookEntries,
        favorites,
        triviaMastered,
        scenarioRatings
      };
      const tmpPath = `${LOCAL_STORE_PATH}.tmp`;
      fs.writeFileSync(tmpPath, JSON.stringify(payload, null, 2), 'utf8');
      fs.renameSync(tmpPath, LOCAL_STORE_PATH);
    } catch (err) {
      console.warn('Could not persist local store file:', err.message);
    }
  }

  loadFromDisk();

  function toPublicUser(u) {
    return u ? { id: u.id, username: u.username, email: u.email, createdAt: u.createdAt } : null;
  }

  return {
    mode: 'local-file',
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
      saveToDisk();
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
      saveToDisk();
      return token;
    },

    async getUserBySession(token) {
      if (!token) return null;
      const sess = sessions.get(token);
      if (!sess) return null;
      if (Date.now() > sess.expiresAt) {
        sessions.delete(token);
        saveToDisk();
        return null;
      }
      const user = users.find((u) => u.id === sess.userId);
      return toPublicUser(user);
    },

    async deleteSession(token) {
      if (token) {
        sessions.delete(token);
        saveToDisk();
      }
    },

    async listScenarios({ q = '', category = 'all', sort = 'az', userId = null } = {}) {
      let list = [...scenarios];
      const needle = String(q || '').trim().toLowerCase();
      if (needle) {
        list = list.filter(
          (s) =>
            s.title.toLowerCase().includes(needle) ||
            s.shortSummary.toLowerCase().includes(needle) ||
            s.quickTakeaway.toLowerCase().includes(needle) ||
            s.categoryLabel.toLowerCase().includes(needle)
        );
      }

      if (category === 'saved') {
        if (!userId) {
          list = [];
        } else {
          const savedIds = new Set(
            favorites.filter((f) => f.userId === userId).map((f) => f.scenarioId)
          );
          list = list.filter((s) => savedIds.has(s.id));
        }
      } else if (category === 'fundamental' || category === 'analytics') {
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

    async listPlaybookEntries(userId) {
      return playbookEntries
        .filter((e) => e.userId === userId)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
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
      saveToDisk();
      return entry;
    },

    async updatePlaybookEntry(userId, entryId, { title, body, rating }) {
      const entry = playbookEntries.find((e) => e.id === entryId);
      if (!entry) return { status: 'not_found' };
      if (entry.userId !== userId) return { status: 'forbidden' };
      entry.title = title;
      entry.body = body;
      entry.rating = rating;
      entry.updatedAt = new Date().toISOString();
      saveToDisk();
      return { status: 'ok', entry };
    },

    async deletePlaybookEntry(userId, entryId) {
      const idx = playbookEntries.findIndex((e) => e.id === entryId);
      if (idx === -1) return { status: 'not_found' };
      if (playbookEntries[idx].userId !== userId) return { status: 'forbidden' };
      playbookEntries.splice(idx, 1);
      saveToDisk();
      return { status: 'ok' };
    },

    async listFavorites(userId) {
      if (!userId) return [];
      return favorites.filter((f) => f.userId === userId).map((f) => f.scenarioId);
    },

    async addFavorite(userId, scenarioId) {
      const exists = favorites.some((f) => f.userId === userId && f.scenarioId === scenarioId);
      if (!exists) {
        favorites.push({ userId, scenarioId, createdAt: new Date().toISOString() });
        saveToDisk();
      }
      return this.listFavorites(userId);
    },

    async removeFavorite(userId, scenarioId) {
      favorites = favorites.filter((f) => !(f.userId === userId && f.scenarioId === scenarioId));
      saveToDisk();
      return this.listFavorites(userId);
    },

    async markTriviaMastered(userId, scenarioId) {
      if (!userId) return [];
      const exists = triviaMastered.some((m) => m.userId === userId && m.scenarioId === scenarioId);
      if (!exists) {
        triviaMastered.push({ userId, scenarioId, createdAt: new Date().toISOString() });
        saveToDisk();
      }
      return this.listTriviaMastered(userId);
    },

    async listTriviaMastered(userId) {
      if (!userId) return [];
      return triviaMastered.filter((m) => m.userId === userId).map((m) => m.scenarioId);
    },

    async getScenarioRating(scenarioId, userId = null) {
      const rows = scenarioRatings.filter((r) => r.scenarioId === scenarioId);
      const count = rows.length;
      const average = count
        ? Number((rows.reduce((sum, r) => sum + r.stars, 0) / count).toFixed(1))
        : 0;
      const mine = userId ? rows.find((r) => r.userId === userId) : null;
      return { average, count, userStars: mine ? mine.stars : 0 };
    },

    async setScenarioRating(userId, scenarioId, stars) {
      const existing = scenarioRatings.find(
        (r) => r.userId === userId && r.scenarioId === scenarioId
      );
      if (existing) {
        existing.stars = stars;
        existing.updatedAt = new Date().toISOString();
      } else {
        scenarioRatings.push({
          userId,
          scenarioId,
          stars,
          updatedAt: new Date().toISOString()
        });
      }
      saveToDisk();
      return this.getScenarioRating(scenarioId, userId);
    },

    async getUserStats(userId) {
      return {
        scenariosCount: scenarios.length,
        masteredCount: userId
          ? triviaMastered.filter((m) => m.userId === userId).length
          : 0,
        favoritesCount: userId
          ? favorites.filter((f) => f.userId === userId).length
          : 0,
        playbookCount: userId
          ? playbookEntries.filter((e) => e.userId === userId).length
          : 0
      };
    }
  };
}

/* =========================================================
   PostgreSQL Store (when DATABASE_URL is configured)
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

    async listScenarios({ q = '', category = 'all', sort = 'az', userId = null } = {}) {
      await this.ensureReady();
      const res = await pool.query('SELECT * FROM scenarios ORDER BY title ASC');
      let list = res.rows.map(mapScenarioRow);
      const needle = String(q || '').trim().toLowerCase();
      if (needle) {
        list = list.filter(
          (s) =>
            s.title.toLowerCase().includes(needle) ||
            s.shortSummary.toLowerCase().includes(needle) ||
            s.quickTakeaway.toLowerCase().includes(needle) ||
            s.categoryLabel.toLowerCase().includes(needle)
        );
      }

      if (category === 'saved') {
        if (!userId) {
          list = [];
        } else {
          const favIds = new Set(await this.listFavorites(userId));
          list = list.filter((s) => favIds.has(s.id));
        }
      } else if (category === 'fundamental' || category === 'analytics') {
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
      await this.ensureReady();
      const res = await pool.query('SELECT * FROM scenarios WHERE id = $1', [id]);
      return res.rows[0] ? mapScenarioRow(res.rows[0]) : null;
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

    async updatePlaybookEntry(userId, entryId, { title, body, rating }) {
      await this.ensureReady();
      const existing = await pool.query('SELECT user_id FROM playbook_entries WHERE id = $1', [
        entryId
      ]);
      if (existing.rows.length === 0) return { status: 'not_found' };
      if (existing.rows[0].user_id !== userId) return { status: 'forbidden' };
      const res = await pool.query(
        `UPDATE playbook_entries
         SET title = $1, body = $2, rating = $3, updated_at = NOW()
         WHERE id = $4 AND user_id = $5
         RETURNING *`,
        [title, body, rating, entryId, userId]
      );
      return { status: 'ok', entry: mapEntryRow(res.rows[0]) };
    },

    async deletePlaybookEntry(userId, entryId) {
      await this.ensureReady();
      const existing = await pool.query('SELECT user_id FROM playbook_entries WHERE id = $1', [
        entryId
      ]);
      if (existing.rows.length === 0) return { status: 'not_found' };
      if (existing.rows[0].user_id !== userId) return { status: 'forbidden' };
      await pool.query('DELETE FROM playbook_entries WHERE id = $1 AND user_id = $2', [
        entryId,
        userId
      ]);
      return { status: 'ok' };
    },

    async listFavorites(userId) {
      if (!userId) return [];
      await this.ensureReady();
      const res = await pool.query(
        'SELECT scenario_id FROM favorites WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
      return res.rows.map((r) => r.scenario_id);
    },

    async addFavorite(userId, scenarioId) {
      await this.ensureReady();
      await pool.query(
        `INSERT INTO favorites (user_id, scenario_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, scenario_id) DO NOTHING`,
        [userId, scenarioId]
      );
      return this.listFavorites(userId);
    },

    async removeFavorite(userId, scenarioId) {
      await this.ensureReady();
      await pool.query('DELETE FROM favorites WHERE user_id = $1 AND scenario_id = $2', [
        userId,
        scenarioId
      ]);
      return this.listFavorites(userId);
    },

    async markTriviaMastered(userId, scenarioId) {
      if (!userId) return [];
      await this.ensureReady();
      await pool.query(
        `INSERT INTO trivia_mastered (user_id, scenario_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, scenario_id) DO NOTHING`,
        [userId, scenarioId]
      );
      return this.listTriviaMastered(userId);
    },

    async listTriviaMastered(userId) {
      if (!userId) return [];
      await this.ensureReady();
      const res = await pool.query(
        'SELECT scenario_id FROM trivia_mastered WHERE user_id = $1',
        [userId]
      );
      return res.rows.map((r) => r.scenario_id);
    },

    async getScenarioRating(scenarioId, userId = null) {
      await this.ensureReady();
      const agg = await pool.query(
        'SELECT COUNT(*)::int AS count, COALESCE(AVG(stars), 0)::float AS avg FROM scenario_ratings WHERE scenario_id = $1',
        [scenarioId]
      );
      const count = agg.rows[0].count;
      const average = count ? Number(agg.rows[0].avg.toFixed(1)) : 0;
      let userStars = 0;
      if (userId) {
        const mine = await pool.query(
          'SELECT stars FROM scenario_ratings WHERE scenario_id = $1 AND user_id = $2',
          [scenarioId, userId]
        );
        if (mine.rows[0]) userStars = mine.rows[0].stars;
      }
      return { average, count, userStars };
    },

    async setScenarioRating(userId, scenarioId, stars) {
      await this.ensureReady();
      await pool.query(
        `INSERT INTO scenario_ratings (user_id, scenario_id, stars, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (user_id, scenario_id) DO UPDATE SET
           stars = EXCLUDED.stars,
           updated_at = NOW()`,
        [userId, scenarioId, stars]
      );
      return this.getScenarioRating(scenarioId, userId);
    },

    async getUserStats(userId) {
      await this.ensureReady();
      const sCount = await pool.query('SELECT COUNT(*)::int AS c FROM scenarios');
      if (!userId) {
        return {
          scenariosCount: sCount.rows[0].c,
          masteredCount: 0,
          favoritesCount: 0,
          playbookCount: 0
        };
      }
      const [mRes, fRes, pRes] = await Promise.all([
        pool.query('SELECT COUNT(*)::int AS c FROM trivia_mastered WHERE user_id = $1', [userId]),
        pool.query('SELECT COUNT(*)::int AS c FROM favorites WHERE user_id = $1', [userId]),
        pool.query('SELECT COUNT(*)::int AS c FROM playbook_entries WHERE user_id = $1', [userId])
      ]);
      return {
        scenariosCount: sCount.rows[0].c,
        masteredCount: mRes.rows[0].c,
        favoritesCount: fRes.rows[0].c,
        playbookCount: pRes.rows[0].c
      };
    }
  };
}

const localFallback = createLocalStore();
const dbUrl = (process.env.DATABASE_URL || '').trim();
const primaryStore = dbUrl ? createPostgresStore(dbUrl) : localFallback;

module.exports = {
  store: primaryStore
};
