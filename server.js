/* DiamondIQ — Express Server & REST API
   Serves the 7 HTML/CSS/JS pages and full REST API for auth,
   8 seeded baseball scenarios, trivia scoring, ratings, favorites,
   and protected user-owned Playbook CRUD. */

const express = require('express');
const path = require('path');
const { store } = require('./db');
const { OPENING_DAY_ISO, EXPERT_PROFILES, FUN_FACTS } = require('./data');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const COOKIE_NAME = 'diamondiq_sid';
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

app.use(express.json({ limit: '100kb' }));

function parseCookies(cookieHeader) {
  const result = {};
  if (!cookieHeader || typeof cookieHeader !== 'string') return result;
  for (const part of cookieHeader.split(';')) {
    const eqIdx = part.indexOf('=');
    if (eqIdx === -1) continue;
    const key = part.slice(0, eqIdx).trim();
    const val = part.slice(eqIdx + 1).trim();
    if (key) {
      try {
        result[key] = decodeURIComponent(val);
      } catch {
        result[key] = val;
      }
    }
  }
  return result;
}

function setSessionCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE_MS
  });
}

function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/'
  });
}

async function attachUser(req, _res, next) {
  try {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[COOKIE_NAME];
    req.sessionToken = token || null;
    req.user = token ? await store.getUserBySession(token) : null;
    next();
  } catch (err) {
    next(err);
  }
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Please log in to continue.' });
  }
  return next();
}

app.use('/api', attachUser);

/* =========================================================
   Health, Stats & Fun Facts
   ========================================================= */
app.get('/api/health', async (_req, res) => {
  res.json({ ok: true, storage: store.mode });
});

app.get('/api/stats', async (req, res, next) => {
  try {
    const scenarios = await store.listScenarios();
    const now = Date.now();
    const openingMs = new Date(OPENING_DAY_ISO).getTime();
    const daysUntilOpeningDay = Math.max(0, Math.ceil((openingMs - now) / (1000 * 60 * 60 * 24)));
    const userStats = req.user ? await store.getUserStats(req.user.id) : null;

    res.json({
      openingDayIso: OPENING_DAY_ISO,
      daysUntilOpeningDay,
      totalScenarios: scenarios.length,
      expertsCount: EXPERT_PROFILES.length,
      experts: EXPERT_PROFILES,
      funFacts: FUN_FACTS,
      userStats
    });
  } catch (err) {
    next(err);
  }
});

/* =========================================================
   Authentication
   ========================================================= */
app.get('/api/auth/me', (req, res) => {
  res.json({ user: req.user || null });
});

app.post('/api/auth/register', async (req, res, next) => {
  try {
    const { username, email, password } = req.body || {};
    const cleanUser = typeof username === 'string' ? username.trim() : '';
    const cleanEmail = typeof email === 'string' ? email.trim() : '';
    const cleanPass = typeof password === 'string' ? password : '';

    if (!/^[a-zA-Z0-9_-]{3,30}$/.test(cleanUser)) {
      return res.status(400).json({
        error: 'Username must be 3–30 characters (letters, numbers, _ or -).'
      });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || cleanEmail.length > 120) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (cleanPass.length < 8 || cleanPass.length > 128) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    const user = await store.createUser({
      username: cleanUser,
      email: cleanEmail,
      password: cleanPass
    });
    const token = await store.createSession(user.id);
    setSessionCookie(res, token);
    return res.status(201).json({ user });
  } catch (err) {
    if (err.code === 'CONFLICT') {
      return res.status(409).json({ error: err.message });
    }
    return next(err);
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const { identifier, password } = req.body || {};
    const cleanId = typeof identifier === 'string' ? identifier.trim() : '';
    const cleanPass = typeof password === 'string' ? password : '';

    if (!cleanId || !cleanPass) {
      return res.status(400).json({ error: 'Enter your username/email and password.' });
    }

    const user = await store.verifyUserCredentials(cleanId, cleanPass);
    if (!user) {
      return res.status(401).json({ error: 'Wrong username/email or password. Try again!' });
    }

    const token = await store.createSession(user.id);
    setSessionCookie(res, token);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});

app.post('/api/auth/logout', async (req, res, next) => {
  try {
    if (req.sessionToken) {
      await store.deleteSession(req.sessionToken);
    }
    clearSessionCookie(res);
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

/* =========================================================
   Scenarios, Trivia & Ratings
   ========================================================= */
app.get('/api/scenarios', async (req, res, next) => {
  try {
    const { q = '', category = 'all', sort = 'az' } = req.query;
    const scenarios = await store.listScenarios({
      q: String(q),
      category: String(category),
      sort: String(sort)
    });
    res.json({ scenarios });
  } catch (err) {
    next(err);
  }
});

app.get('/api/scenarios/:id', async (req, res, next) => {
  try {
    const scenario = await store.getScenarioById(req.params.id);
    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found.' });
    }
    return res.json({ scenario });
  } catch (err) {
    return next(err);
  }
});

app.post('/api/scenarios/:id/trivia', async (req, res, next) => {
  try {
    const scenario = await store.getScenarioById(req.params.id);
    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found.' });
    }
    const answer = typeof req.body?.answer === 'string' ? req.body.answer.trim().toLowerCase() : '';
    if (!answer) {
      return res.status(400).json({ error: 'Please pick an answer before checking.' });
    }

    const correct = answer === scenario.trivia.correctKey;
    let mastered = false;
    if (correct && req.user) {
      mastered = await store.markTriviaMastered(req.user.id, scenario.id);
    }

    return res.json({
      correct,
      correctKey: scenario.trivia.correctKey,
      explanation: correct
        ? scenario.trivia.explanation
        : 'Not quite! Read the 5-expert breakdown above for a hint and try another choice.',
      mastered
    });
  } catch (err) {
    return next(err);
  }
});

app.get('/api/scenarios/:id/rating', async (req, res, next) => {
  try {
    const scenario = await store.getScenarioById(req.params.id);
    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found.' });
    }
    const rating = await store.getScenarioRating(scenario.id, req.user?.id || null);
    return res.json(rating);
  } catch (err) {
    return next(err);
  }
});

app.post('/api/scenarios/:id/rating', requireAuth, async (req, res, next) => {
  try {
    const scenario = await store.getScenarioById(req.params.id);
    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found.' });
    }
    const stars = Number(req.body?.stars);
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5 stars.' });
    }
    const rating = await store.upsertScenarioRating(scenario.id, req.user.id, stars);
    return res.json(rating);
  } catch (err) {
    return next(err);
  }
});

/* =========================================================
   Favorites
   ========================================================= */
app.get('/api/favorites', async (req, res, next) => {
  try {
    if (!req.user) return res.json({ favorites: [] });
    const favorites = await store.listFavorites(req.user.id);
    return res.json({ favorites });
  } catch (err) {
    return next(err);
  }
});

app.post('/api/favorites/:scenarioId', requireAuth, async (req, res, next) => {
  try {
    const scenario = await store.getScenarioById(req.params.scenarioId);
    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found.' });
    }
    const favorites = await store.addFavorite(req.user.id, scenario.id);
    return res.json({ favorites });
  } catch (err) {
    return next(err);
  }
});

app.delete('/api/favorites/:scenarioId', requireAuth, async (req, res, next) => {
  try {
    const favorites = await store.removeFavorite(req.user.id, req.params.scenarioId);
    return res.json({ favorites });
  } catch (err) {
    return next(err);
  }
});

/* =========================================================
   Protected Playbook CRUD
   ========================================================= */
function validatePlaybookPayload(bodyObj) {
  const title = typeof bodyObj?.title === 'string' ? bodyObj.title.trim() : '';
  const body = typeof bodyObj?.body === 'string' ? bodyObj.body.trim() : '';
  const rating = Number(bodyObj?.rating);

  if (title.length < 1 || title.length > 120) {
    return { error: 'Play name is required (max 120 characters).' };
  }
  if (body.length < 1 || body.length > 2000) {
    return { error: 'Strategy notes are required (max 2000 characters).' };
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: 'Difficulty rating must be between 1 and 5.' };
  }
  return { title, body, rating };
}

app.get('/api/playbook', requireAuth, async (req, res, next) => {
  try {
    const entries = await store.listPlaybookEntries(req.user.id);
    return res.json({ entries });
  } catch (err) {
    return next(err);
  }
});

app.post('/api/playbook', requireAuth, async (req, res, next) => {
  try {
    const parsed = validatePlaybookPayload(req.body);
    if (parsed.error) return res.status(400).json({ error: parsed.error });
    const entry = await store.createPlaybookEntry(req.user.id, parsed);
    return res.status(201).json({ entry });
  } catch (err) {
    return next(err);
  }
});

app.put('/api/playbook/:id', requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid playbook entry ID.' });
    }
    const parsed = validatePlaybookPayload(req.body);
    if (parsed.error) return res.status(400).json({ error: parsed.error });

    const result = await store.updatePlaybookEntry(id, req.user.id, parsed);
    if (result.status === 'not_found') return res.status(404).json({ error: 'Playbook entry not found.' });
    if (result.status === 'forbidden') return res.status(403).json({ error: 'You can only edit your own playbook entries.' });
    return res.json({ entry: result.entry });
  } catch (err) {
    return next(err);
  }
});

app.delete('/api/playbook/:id', requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid playbook entry ID.' });
    }
    const result = await store.deletePlaybookEntry(id, req.user.id);
    if (result.status === 'not_found') return res.status(404).json({ error: 'Playbook entry not found.' });
    if (result.status === 'forbidden') return res.status(403).json({ error: 'You can only delete your own playbook entries.' });
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

/* =========================================================
   Static Assets & Fallback
   ========================================================= */
app.use(express.static(__dirname));

app.use('/api', (err, _req, res, _next) => {
  console.error('API Error:', err);
  res.status(500).json({ error: 'Something went wrong on the server. Please try again.' });
});

app.use((_req, res) => {
  res
    .status(404)
    .send(
      '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>404 — DiamondIQ</title>' +
      '<link rel="stylesheet" href="/styles.css"></head><body>' +
      '<main class="container"><h1>404 — Page not found</h1>' +
      '<p>That base is empty! <a href="/index.html">Go back to DiamondIQ Home</a>.</p></main></body></html>'
    );
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`DiamondIQ running on http://0.0.0.0:${PORT} (storage: ${store.mode})`);
});
