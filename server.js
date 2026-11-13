/* DiamondIQ — Node.js + Express Server (Phases 3 & 4)
   Serves static front-end pages, scrypt session authentication, PostgreSQL API routes,
   8 seeded scenarios, protected playbook CRUD, favorites, and trivia scoring. */
const express = require('express');
const path = require('path');
const { createStore } = require('./db');
const seedData = require('./data');

const PORT = Number(process.env.PORT) || 5000;
const COOKIE_NAME = 'diamondiq_sid';
const ROOT_DIR = __dirname;

const app = express();
const store = createStore();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

function parseCookies(req) {
  const header = req.headers.cookie || '';
  const map = {};
  header.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx > 0) {
      const k = pair.slice(0, idx).trim();
      const v = pair.slice(idx + 1).trim();
      map[k] = decodeURIComponent(v);
    }
  });
  return map;
}

function setSessionCookie(res, token, expiresAt) {
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Expires=${expiresAt.toUTCString()}`
  ];
  res.setHeader('Set-Cookie', parts.join('; '));
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

// Attach authenticated user if session cookie is valid
app.use(async (req, _res, next) => {
  try {
    const cookies = parseCookies(req);
    const token = cookies[COOKIE_NAME];
    req.sessionToken = token || null;
    req.user = token ? await store.getSessionUser(token) : null;
    next();
  } catch (err) {
    next(err);
  }
});

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Please log in to save favorites or manage your playbook.' });
  }
  next();
}

/* =========================================================
   Health & Stats
   ========================================================= */
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, app: 'DiamondIQ', storage: store.mode });
});

app.get('/api/stats', async (req, res, next) => {
  try {
    const target = new Date(seedData.openingDayIso).getTime();
    const daysUntilOpeningDay = Math.max(0, Math.ceil((target - Date.now()) / (1000 * 60 * 60 * 24)));
    const scenarios = await store.listScenarios();

    if (!req.user) {
      return res.json({
        daysUntilOpeningDay,
        totalScenarios: scenarios.length,
        favoritesCount: 0,
        masteredCount: 0,
        playbookCount: 0,
        authenticated: false
      });
    }

    const [favs, mastered, notes] = await Promise.all([
      store.getFavorites(req.user.id),
      store.getMastered(req.user.id),
      store.listPlaybookEntries(req.user.id)
    ]);

    res.json({
      daysUntilOpeningDay,
      totalScenarios: scenarios.length,
      favoritesCount: favs.length,
      masteredCount: mastered.length,
      playbookCount: notes.length,
      authenticated: true
    });
  } catch (err) {
    next(err);
  }
});

/* =========================================================
   Authentication Endpoints (scrypt + session cookies)
   ========================================================= */
app.get('/api/auth/me', (req, res) => {
  res.json({ user: req.user || null });
});

app.post('/api/auth/register', async (req, res, next) => {
  try {
    const username = String(req.body.username || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ error: 'Username must be between 3 and 30 characters.' });
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
      return res.status(400).json({ error: 'Username may only use letters, numbers, underscores, dots, or hyphens.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    const user = await store.createUser({ username, email, password });
    const session = await store.createSession(user.id);
    setSessionCookie(res, session.token, session.expiresAt);
    res.status(201).json({ user: { id: user.id, username: user.username, email: user.email } });
  } catch (err) {
    if (err.statusCode === 409) {
      return res.status(409).json({ error: err.message });
    }
    next(err);
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const identifier = String(req.body.identifier || '').trim();
    const password = String(req.body.password || '');

    if (identifier.length < 3 || password.length < 8) {
      return res.status(400).json({ error: 'Enter your username/email and password (8+ characters).' });
    }

    const user = await store.authenticateUser({ identifier, password });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username/email or password. Please try again.' });
    }

    const session = await store.createSession(user.id);
    setSessionCookie(res, session.token, session.expiresAt);
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

app.post('/api/auth/logout', async (req, res, next) => {
  try {
    if (req.sessionToken) {
      await store.deleteSession(req.sessionToken);
    }
    clearSessionCookie(res);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/* =========================================================
   Scenarios & Trivia Quiz Endpoints
   ========================================================= */
app.get('/api/scenarios', async (req, res, next) => {
  try {
    let items = await store.listScenarios();
    const q = String(req.query.q || '').trim().toLowerCase();
    const category = String(req.query.category || 'all').trim().toLowerCase();
    const sort = String(req.query.sort || 'az').trim().toLowerCase();

    if (category === 'fundamental' || category === 'analytics') {
      items = items.filter((s) => s.category === category);
    }
    if (q) {
      items = items.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.shortSummary.toLowerCase().includes(q) ||
          s.quickTakeaway.toLowerCase().includes(q) ||
          s.categoryLabel.toLowerCase().includes(q)
      );
    }

    if (sort === 'difficulty') {
      items.sort((a, b) => a.difficulty - b.difficulty);
    } else if (sort === 'popularity') {
      items.sort((a, b) => b.popularity - a.popularity);
    } else {
      items.sort((a, b) => a.title.localeCompare(b.title));
    }

    res.json({ scenarios: items });
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
    res.json({ scenario });
  } catch (err) {
    next(err);
  }
});

app.post('/api/scenarios/:id/trivia', async (req, res, next) => {
  try {
    const scenario = await store.getScenarioById(req.params.id);
    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found.' });
    }
    const chosen = Number(req.body.choiceIndex);
    if (!Number.isInteger(chosen) || chosen < 0 || chosen >= scenario.trivia.options.length) {
      return res.status(400).json({ error: 'Select an answer choice first before checking.' });
    }
    const correct = chosen === scenario.trivia.correctIndex;
    let mastered = false;
    if (correct && req.user) {
      await store.recordMastered(req.user.id, scenario.id);
      mastered = true;
    }
    res.json({
      correct,
      explanation: scenario.trivia.explanation,
      mastered,
      authenticated: Boolean(req.user)
    });
  } catch (err) {
    next(err);
  }
});

app.get('/api/scenarios/:id/rating', async (req, res, next) => {
  try {
    const scenario = await store.getScenarioById(req.params.id);
    if (!scenario) return res.status(404).json({ error: 'Scenario not found.' });
    const rating = await store.getScenarioRating(scenario.id, req.user ? req.user.id : null);
    res.json(rating);
  } catch (err) {
    next(err);
  }
});

app.post('/api/scenarios/:id/rating', requireAuth, async (req, res, next) => {
  try {
    const scenario = await store.getScenarioById(req.params.id);
    if (!scenario) return res.status(404).json({ error: 'Scenario not found.' });
    const stars = Number(req.body.stars);
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5 stars.' });
    }
    const rating = await store.setScenarioRating(req.user.id, scenario.id, stars);
    res.json(rating);
  } catch (err) {
    next(err);
  }
});

/* =========================================================
   Protected Favorites Endpoints
   ========================================================= */
app.get('/api/favorites', async (req, res, next) => {
  try {
    if (!req.user) {
      return res.json({ favorites: [], authenticated: false });
    }
    const favs = await store.getFavorites(req.user.id);
    res.json({ favorites: favs, authenticated: true });
  } catch (err) {
    next(err);
  }
});

app.post('/api/favorites/:scenarioId', requireAuth, async (req, res, next) => {
  try {
    const scenario = await store.getScenarioById(req.params.scenarioId);
    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found.' });
    }
    const favs = await store.addFavorite(req.user.id, scenario.id);
    res.status(201).json({ favorites: favs });
  } catch (err) {
    next(err);
  }
});

app.delete('/api/favorites/:scenarioId', requireAuth, async (req, res, next) => {
  try {
    const favs = await store.removeFavorite(req.user.id, req.params.scenarioId);
    res.json({ favorites: favs });
  } catch (err) {
    next(err);
  }
});

/* =========================================================
   Protected Playbook CRUD Endpoints
   ========================================================= */
function validatePlaybookPayload(body) {
  const title = String(body.title || '').trim();
  const noteBody = String(body.body || '').trim();
  const rating = Number(body.rating);
  if (title.length < 2 || title.length > 120) {
    return { error: 'Play name must be between 2 and 120 characters.' };
  }
  if (noteBody.length < 4 || noteBody.length > 2000) {
    return { error: 'Strategy notes must be between 4 and 2,000 characters.' };
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: 'Difficulty rating must be between 1 and 5.' };
  }
  return { title, body: noteBody, rating };
}

app.get('/api/playbook', requireAuth, async (req, res, next) => {
  try {
    const entries = await store.listPlaybookEntries(req.user.id);
    res.json({ entries });
  } catch (err) {
    next(err);
  }
});

app.post('/api/playbook', requireAuth, async (req, res, next) => {
  try {
    const parsed = validatePlaybookPayload(req.body);
    if (parsed.error) return res.status(400).json({ error: parsed.error });
    const entry = await store.createPlaybookEntry(req.user.id, parsed);
    res.status(201).json({ entry });
  } catch (err) {
    next(err);
  }
});

app.put('/api/playbook/:id', requireAuth, async (req, res, next) => {
  try {
    const parsed = validatePlaybookPayload(req.body);
    if (parsed.error) return res.status(400).json({ error: parsed.error });
    const entry = await store.updatePlaybookEntry(req.user.id, req.params.id, parsed);
    res.json({ entry });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    next(err);
  }
});

app.delete('/api/playbook/:id', requireAuth, async (req, res, next) => {
  try {
    await store.deletePlaybookEntry(req.user.id, req.params.id);
    res.json({ ok: true });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    next(err);
  }
});

/* =========================================================
   Clean Routes & Static Front-End Assets
   ========================================================= */
const CLEAN_ROUTES = {
  '/': 'index.html',
  '/scenarios': 'scenarios.html',
  '/detail': 'detail.html',
  '/compare': 'compare.html',
  '/playbook': 'playbook.html',
  '/login': 'login.html',
  '/register': 'register.html'
};

Object.entries(CLEAN_ROUTES).forEach(([routePath, fileName]) => {
  app.get(routePath, (_req, res) => {
    res.sendFile(path.join(ROOT_DIR, fileName));
  });
});

// Serve static assets from root (HTML/CSS/JS/images), blocking hidden dotfiles and server code
app.use((req, res, next) => {
  const blocked = ['/server.js', '/db.js', '/package.json', '/package-lock.json', '/.env', '/.env.example'];
  if (blocked.includes(req.path) || req.path.startsWith('/.')) {
    return res.status(404).send('Not found');
  }
  next();
});

app.use(express.static(ROOT_DIR, { index: 'index.html' }));

// 404 fallback
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found.' });
  }
  res
    .status(404)
    .send(
      '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>404 — DiamondIQ</title><link rel="stylesheet" href="/styles.css"></head>' +
        '<body><main class="container" style="padding:4rem 1rem;text-align:center;"><h1>404 — Page not found</h1>' +
        '<p style="margin:1rem 0;color:var(--text-secondary);">That base is empty. Let’s get you back to the ballpark.</p>' +
        '<a class="btn btn-primary" href="/index.html">Back to DiamondIQ Home</a></main></body></html>'
    );
});

// Error handler
app.use((err, req, res, _next) => {
  console.error('Server error:', err);
  if (req.path.startsWith('/api/')) {
    return res.status(500).json({ error: 'Something went wrong on the server. Please try again.' });
  }
  res.status(500).send('Internal server error');
});

store
  .init()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`DiamondIQ running on http://0.0.0.0:${PORT} (${store.mode} store)`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize DiamondIQ store:', err);
    process.exit(1);
  });
