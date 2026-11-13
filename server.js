const crypto = require('crypto');
const express = require('express');
const path = require('path');
const { promisify } = require('util');
const { pool } = require('./db');

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const SESSION_COOKIE = 'diamondiq_session';
const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000;
const scryptAsync = promisify(crypto.scrypt);

app.set('trust proxy', 1);
app.use(express.json({ limit: '10kb' }));

function publicUser(row) {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    createdAt: row.created_at,
  };
}

function sessionCookieOptions(req, expiresAt) {
  return {
    httpOnly: true,
    secure: req.secure,
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  };
}

function readSessionToken(req) {
  const cookieHeader = req.headers.cookie || '';
  const cookie = cookieHeader.split(';').map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  if (!cookie) return null;
  const token = cookie.slice(SESSION_COOKIE.length + 1);
  return /^[A-Za-z0-9_-]{43}$/.test(token) ? token : null;
}

function hashSessionToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function createSession(userId, client = pool) {
  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await client.query(
    'INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)',
    [hashSessionToken(token), userId, expiresAt],
  );
  return { token, expiresAt };
}

function setSessionCookie(req, res, session) {
  res.cookie(SESSION_COOKIE, session.token, sessionCookieOptions(req, session.expiresAt));
}

async function currentUser(req) {
  const token = readSessionToken(req);
  if (!token) return null;
  const result = await pool.query(
    `SELECT u.id, u.username, u.email, u.created_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = $1 AND s.expires_at > NOW()`,
    [hashSessionToken(token)],
  );
  return result.rows[0] || null;
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const derivedKey = await scryptAsync(password, salt, 64, {
    N: 16384,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
  return `scrypt$16384$8$1$${salt.toString('base64url')}$${derivedKey.toString('base64url')}`;
}

async function verifyPassword(password, storedHash) {
  const parts = storedHash.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, cost, blockSize, parallelization, saltText, keyText] = parts;
  if (cost !== '16384' || blockSize !== '8' || parallelization !== '1') return false;
  try {
    const salt = Buffer.from(saltText, 'base64url');
    const expected = Buffer.from(keyText, 'base64url');
    if (salt.length !== 16 || expected.length !== 64) return false;
    const actual = await scryptAsync(password, salt, expected.length, {
      N: 16384,
      r: 8,
      p: 1,
      maxmem: 64 * 1024 * 1024,
    });
    return crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

app.use('/api/auth', (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

app.get('/api/auth/me', async (req, res, next) => {
  try {
    const user = await currentUser(req);
    res.json({ user: user ? publicUser(user) : null });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/register', async (req, res, next) => {
  let client;
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Send your account details to register.' });
    }
    const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const emailNormalized = email.toLowerCase();

    if (!/^[A-Za-z0-9_]{3,30}$/.test(username)) {
      return res.status(400).json({ error: 'Username must be 3–30 characters using letters, numbers, or underscores.' });
    }
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Enter a valid email address.' });
    }
    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({ error: 'Password must be 8–128 characters.' });
    }

    const passwordHash = await hashPassword(password);
    client = await pool.connect();
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO users (username, username_normalized, email, email_normalized, password_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, created_at`,
      [username, username.toLowerCase(), email, emailNormalized, passwordHash],
    );
    const user = result.rows[0];
    const session = await createSession(user.id, client);
    await client.query('COMMIT');
    setSessionCookie(req, res, session);
    return res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch {
        // The connection may already have closed after a failed commit.
      }
    }
    if (error.code === '23505') {
      return res.status(409).json({ error: 'That username or email is already registered. Try signing in instead.' });
    }
    return next(error);
  } finally {
    if (client) client.release();
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Enter your username or email and password.' });
    }
    const identifier = typeof req.body.identifier === 'string' ? req.body.identifier.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Enter your username or email and password.' });
    }

    const result = await pool.query(
      `SELECT id, username, email, created_at, password_hash
         FROM users
        WHERE username_normalized = $1 OR email_normalized = $1
        LIMIT 1`,
      [identifier],
    );
    const user = result.rows[0];
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return res.status(401).json({ error: 'Username/email or password is incorrect.' });
    }

    const session = await createSession(user.id);
    setSessionCookie(req, res, session);
    return res.json({ user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/auth/logout', async (req, res, next) => {
  try {
    const token = readSessionToken(req);
    if (token) {
      await pool.query('DELETE FROM sessions WHERE token_hash = $1', [hashSessionToken(token)]);
    }
    res.clearCookie(SESSION_COOKIE, {
      httpOnly: true,
      secure: req.secure,
      sameSite: 'lax',
      path: '/',
    });
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

app.use('/api', (error, _req, res, _next) => {
  console.error('API request failed:', error.message);
  res.status(500).json({ error: 'The request could not be completed. Please try again.' });
});

app.use(express.static(__dirname));

app.use((_req, res) => {
  res
    .status(404)
    .send(
      '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>404 — DiamondIQ</title>' +
      '<link rel="stylesheet" href="/styles.css"></head><body>' +
      '<main class="container"><h1>404 — Page not found</h1>' +
      '<p>That base is empty! <a href="/index.html">Go back to DiamondIQ Home</a>.</p></main></body></html>',
    );
});

async function start() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is missing. Connect a Replit PostgreSQL database before starting DiamondIQ.');
  }
  await pool.query('SELECT 1');
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DiamondIQ running on port ${PORT}`);
  });
}

start().catch((error) => {
  console.error(`DiamondIQ could not start: ${error.message}`);
  process.exit(1);
});

const sessionCleanup = setInterval(() => {
  pool.query('DELETE FROM sessions WHERE expires_at <= NOW()')
    .catch((error) => console.error('Expired session cleanup failed:', error.message));
}, 60 * 60 * 1000);
sessionCleanup.unref();

module.exports = app;
