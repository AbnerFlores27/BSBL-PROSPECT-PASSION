/* DiamondIQ — Phase 4 Express Server & Full Interactive REST API
   Serves all 7 pages, scrypt cookie auth, 8 seeded scenarios with search/filter/sort,
   protected Playbook CRUD, Favorites, Trivia scoring/mastery, 5-Star Ratings, and Stats. */

const fs = require('fs');
const path = require('path');
const express = require('express');
const { GoogleGenAI, Type } = require('@google/genai');
const { store } = require('./db');
const { OPENING_DAY_ISO, FUN_FACTS } = require('./data');

// Load optional .env values if not already provided by the runtime environment
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const k = trimmed.slice(0, eq).trim();
      let v = trimmed.slice(eq + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (k && !(k in process.env)) {
        process.env[k] = v;
      }
    }
  }
} catch {
  /* ignore optional .env read errors */
}

const GEMINI_MODEL = 'gemini-3.1-flash-lite';

function getGeminiApiKey() {
  const k = (process.env.GEMINI_API_KEY || '').trim();
  if (!k || k === 'undefined' || k === 'null') return '';
  return k;
}

async function callWithTimeout(ai, params, timeoutMs) {
  let timeoutHandle;
  try {
    const aiPromise = ai.models.generateContent(params);
    const timeoutPromise = new Promise((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(new Error('Gemini coaching request timed out'));
      }, timeoutMs);
    });
    const res = await Promise.race([aiPromise, timeoutPromise]);
    clearTimeout(timeoutHandle);
    return res;
  } catch (err) {
    clearTimeout(timeoutHandle);
    throw err;
  }
}

async function generateWithRetry(ai, params, timeoutMs = 20000) {
  let lastErr;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await callWithTimeout(
        ai,
        {
          ...params,
          model: GEMINI_MODEL
        },
        timeoutMs
      );
    } catch (err) {
      lastErr = err;
      const msg = String(err && err.message ? err.message : err || '');
      const status = Number(err && (err.status || err.statusCode)) || 0;
      const isNonRetryable =
        status === 400 ||
        status === 401 ||
        status === 403 ||
        status === 404 ||
        /API_KEY|PERMISSION_DENIED|NOT_FOUND|unauthorized/i.test(msg);
      console.warn(`Gemini attempt ${attempt + 1} (${GEMINI_MODEL}) failed:`, status || '', msg);
      if (attempt === 0 && !isNonRetryable) {
        await new Promise((r) => setTimeout(r, 600));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

function classifyGeminiError(err) {
  const msg = String(err && err.message ? err.message : err || '');
  const status = Number(err && (err.status || err.statusCode)) || 0;
  if (status === 400 || status === 401 || status === 403 || /API_KEY_INVALID|API key|PERMISSION_DENIED|unauthorized/i.test(msg)) {
    return {
      httpStatus: 403,
      message: 'Coach Jax could not authenticate with GEMINI_API_KEY. Please check or update your GEMINI_API_KEY in Settings > Secrets.'
    };
  }
  if (status === 429 || /RESOURCE_EXHAUSTED|quota|rate limit/i.test(msg)) {
    return {
      httpStatus: 429,
      message: 'Coach Jax hit a temporary rate or quota limit. Wait a moment and try again, or verify your key quota in Settings > Secrets.'
    };
  }
  if (status === 404 || /NOT_FOUND|not found|unsupported/i.test(msg)) {
    return {
      httpStatus: 502,
      message: 'Coach Jax hit an upstream model configuration error. Please try again in a moment.'
    };
  }
  return {
    httpStatus: 502,
    message: 'Coach Jax could not reach the AI coaching service right now. Please try again in a second.'
  };
}

const app = express();
app.set('trust proxy', 1);
const PORT = Number(process.env.PORT) || 3000;
const COOKIE_NAME = 'diamondiq_sid';
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const VALID_CLINICS = {
  'bat-drag': {
    title: 'Keep Your Hands Connected (Bat Drag Fix)',
    domain: 'Hitting Mechanics',
    scenarioId: 'launch-angle-exit-velo',
    youtube: { label: 'MLB Bat Drag Fix Drill (YouGoProBaseball)', url: 'https://www.youtube.com/watch?v=bkXB66PSKvw' }
  },
  casting: {
    title: 'Stay Short & Inside the Ball (Stop Casting)',
    domain: 'Hitting Mechanics',
    scenarioId: 'launch-angle-exit-velo',
    youtube: { label: 'Improve Your Bat Path (Antonelli Baseball)', url: 'https://www.youtube.com/watch?v=oh9rdbm6ne8' }
  },
  'rolling-over': {
    title: 'Drive Line Drives (Stop Rolling Over)',
    domain: 'Hitting Mechanics',
    scenarioId: 'xwoba-metrics',
    youtube: { label: 'Why You Roll Over & Fix (Ultimate Baseball Training)', url: 'https://www.youtube.com/watch?v=0Qa-GRJ7CE0' }
  },
  lunging: {
    title: 'Stay Balanced on Off-Speed & Timing',
    domain: 'Hitting Mechanics',
    scenarioId: 'xwoba-metrics',
    youtube: { label: 'Keep Your Load with Stride (DNA Sports)', url: 'https://www.youtube.com/watch?v=FQus_SP0DKQ' }
  },
  'glove-stab': {
    title: 'Soft Hands & Infield Funnel Routine',
    domain: 'Fielding Mechanics',
    scenarioId: 'force-vs-tag',
    youtube: { label: 'Infield Hands Routine (Antonelli Baseball)', url: 'https://www.youtube.com/watch?v=WoSNZqN5G9E' }
  },
  'footwork-cadence': {
    title: 'Infield Footwork & Smooth Exchanges',
    domain: 'Fielding Mechanics',
    scenarioId: 'stealing-second',
    youtube: { label: 'Infield Footwork Drills (Antonelli Baseball)', url: 'https://www.youtube.com/watch?v=0_Z3vLKtVl4' }
  },
  'banana-route': {
    title: '45° Outfield Drop Step & Direct Routes',
    domain: 'Fielding Mechanics',
    scenarioId: 'tagging-up',
    youtube: { label: 'Outfield Drop Step Guide (Antonelli Baseball)', url: 'https://www.youtube.com/watch?v=tH9-7NyhtTg' }
  },
  'crow-hop': {
    title: 'Clean Crow Hop & Relay Throws',
    domain: 'Fielding Mechanics',
    scenarioId: 'relay-throw',
    youtube: { label: 'Outfield Crow Hop vs. Step Behind (Ultimate Baseball Training)', url: 'https://www.youtube.com/watch?v=vMU7ds_WpiM' }
  }
};

const VALID_BATS = {
  'baum-gold': 'Baum Bat Gold (PermaWood Composite -3)',
  'goods-2026': '2026 DeMarini The Goods (Black/Red/Teal Hybrid -3)',
  'goods-2022': '2022 DeMarini The Goods (Chrome Silver/Red Hybrid -3)',
  'combat-rodeo': 'Combat MFG Spec-A1 Rodeo (Cream/Maroon 1-Pc Alloy -3)',
  'combat-blue': 'Combat Spec-A1 Members Club Blue (Powder Blue 1-Pc Alloy -3)'
};

const VALID_SCENARIOS = {
  'force-vs-tag': 'Force Out vs. Tag Out',
  'infield-fly': 'The Infield Fly Rule',
  'stealing-second': 'Stealing 2nd Base',
  'launch-angle-exit-velo': 'Launch Angle & Exit Velocity',
  'catcher-framing': 'Catcher Framing & Strike Zone',
  'relay-throw': 'Relay & Cutoff Throws',
  'xwoba-metrics': 'xwOBA vs. Batting Average',
  'tagging-up': 'Tagging Up on Fly Balls'
};

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

function isSecureRequest(req) {
  const xfProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim().toLowerCase();
  return Boolean(req.secure || xfProto === 'https');
}

function setSessionCookie(req, res, token) {
  const secure = isSecureRequest(req);
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: secure ? 'none' : 'lax',
    secure,
    partitioned: secure,
    path: '/',
    maxAge: COOKIE_MAX_AGE_MS
  });
}

function clearSessionCookie(req, res) {
  const secure = isSecureRequest(req);
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: secure ? 'none' : 'lax',
    secure,
    partitioned: secure,
    path: '/'
  });
}

async function attachUser(req, _res, next) {
  try {
    const cookies = parseCookies(req.headers.cookie);
    const authHeader = String(req.headers.authorization || '').trim();
    const bearerToken = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : '';
    const token = cookies[COOKIE_NAME] || bearerToken || null;
    req.sessionToken = token;
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
   Health & Dashboard Stats
   ========================================================= */
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, phase: 5, storage: store.mode });
});

app.get('/api/stats', async (req, res, next) => {
  try {
    const userStats = await store.getUserStats(req.user ? req.user.id : null);
    const now = Date.now();
    const target = new Date(OPENING_DAY_ISO).getTime();
    const daysUntilOpeningDay = Math.max(0, Math.ceil((target - now) / (1000 * 60 * 60 * 24)));
    res.json({
      openingDayIso: OPENING_DAY_ISO,
      daysUntilOpeningDay,
      facts: FUN_FACTS,
      ...userStats
    });
  } catch (err) {
    next(err);
  }
});

/* =========================================================
   Authentication (Register / Login / Logout / Me)
   ========================================================= */
app.get('/api/auth/me', (req, res) => {
  res.json({ user: req.user || null });
});

app.post('/api/auth/register', async (req, res, next) => {
  try {
    const { username, email, password, preferences } = req.body || {};
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
      password: cleanPass,
      preferences
    });
    const token = await store.createSession(user.id);
    setSessionCookie(req, res, token);
    return res.status(201).json({ user, sessionToken: token, isNewUser: true, needsOnboarding: true });
  } catch (err) {
    if (err.code === 'CONFLICT') {
      return res.status(409).json({ error: err.message });
    }
    if (err.code === '23505') {
      return res.status(409).json({ error: 'That username or email is already taken.' });
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
    setSessionCookie(req, res, token);
    return res.json({
      user,
      sessionToken: token,
      needsOnboarding: !user.hasOnboarding && !user.onboardingSkipped
    });
  } catch (err) {
    return next(err);
  }
});

app.put('/api/auth/profile', requireAuth, async (req, res, next) => {
  try {
    const body = req.body || {};
    const cleanUser = typeof body.username === 'string' ? body.username.trim() : undefined;
    const cleanEmail = typeof body.email === 'string' ? body.email.trim() : undefined;
    if (cleanUser !== undefined && !/^[a-zA-Z0-9_-]{3,30}$/.test(cleanUser)) {
      return res.status(400).json({
        error: 'Username must be 3–30 characters (letters, numbers, _ or -).'
      });
    }
    if (cleanEmail !== undefined && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || cleanEmail.length > 120)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    const updated = await store.updateUserProfile(req.user.id, {
      username: cleanUser,
      email: cleanEmail,
      preferences: body.preferences
    });
    if (!updated) {
      return res.status(404).json({ error: 'User account not found.' });
    }
    return res.json({ user: updated });
  } catch (err) {
    if (err.code === 'CONFLICT' || err.code === '23505') {
      return res.status(409).json({ error: err.message || 'That username or email is already taken.' });
    }
    return next(err);
  }
});

app.post('/api/auth/logout', async (req, res, next) => {
  try {
    if (req.sessionToken) {
      await store.deleteSession(req.sessionToken);
    }
    clearSessionCookie(req, res);
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

/* =========================================================
   AI First-Time Player Checkup Quiz & Onboarding Profile
   ========================================================= */
app.get('/api/onboarding/me', async (req, res, next) => {
  try {
    if (!req.user) {
      return res.json({ profile: null, onboardingSkipped: false, preferences: null });
    }
    const record = await store.getOnboardingProfile(req.user.id);
    return res.json({
      profile: record ? record.profile : null,
      updatedAt: record ? record.updatedAt : null,
      onboardingSkipped: Boolean(req.user.onboardingSkipped),
      preferences: req.user.preferences || null
    });
  } catch (err) {
    return next(err);
  }
});

app.post('/api/onboarding/skip', requireAuth, async (req, res, next) => {
  try {
    const user = await store.setOnboardingSkipped(req.user.id, true);
    return res.json({ ok: true, user });
  } catch (err) {
    return next(err);
  }
});

function buildDeterministicCoachProfile({
  experienceLevel,
  primaryPosition,
  battingHand,
  throwingHand,
  primaryGoal,
  hittingSymptom,
  fieldingSymptom,
  iqChecks,
  iqCorrectCount,
  playerNotes
}) {
  const expLow = experienceLevel.toLowerCase();
  const hitLow = hittingSymptom.toLowerCase();
  const fieldLow = fieldingSymptom.toLowerCase();
  const posLow = primaryPosition.toLowerCase();
  const noteLow = playerNotes.toLowerCase();

  let skillTier = 'Developing';
  if (expLow.includes('varsity') || expLow.includes('college')) {
    skillTier = iqCorrectCount >= 3 ? 'Varsity / Advanced' : 'Intermediate';
  } else if (expLow.includes('travel') || expLow.includes('high school')) {
    skillTier = iqCorrectCount >= 3 ? 'Intermediate' : 'Developing';
  } else if (expLow.includes('beginner')) {
    skillTier = 'Beginner';
  }

  // Match hitting clinic
  let hitClinicId = 'rolling-over';
  let chosenBatId = 'goods-2026';
  let swingDiagnosis = 'Your swing foundation is solid; keeping your top/rear palm facing up and bottom/lead palm facing down for 8+ inches past contact unlocks higher backspin carry and eliminates rolled-over pull grounders.';
  let batReason = '2026 DeMarini The Goods (-3) rewards clean lower-half turn and held barrel extension with towering 26°–30° carries.';

  if (hitLow.includes('bat drag') || hitLow.includes('late on fastballs') || noteLow.includes('jam')) {
    hitClinicId = 'bat-drag';
    chosenBatId = 'baum-gold';
    swingDiagnosis = 'Your rear elbow appears to fire ahead of your hands at swing launch, flattening the barrel behind the hitting zone on inside fastballs.';
    batReason = 'Baum Bat Gold (-3) PermaWood composite gives honest sweet-spot feedback so you feel tight hip-to-hand connection immediately.';
  } else if (hitLow.includes('casting') || hitLow.includes('loops wide') || noteLow.includes('loop')) {
    hitClinicId = 'casting';
    chosenBatId = 'combat-blue';
    swingDiagnosis = 'Your hands are sweeping slightly away from your torso early, lengthening your swing arc and reducing inside-pitch adjustability.';
    batReason = 'Combat Spec-A1 Members Club Blue (-3) swings balanced and quick so your knob stays tight inside the baseball.';
  } else if (hitLow.includes('lunging') || hitLow.includes('drift') || noteLow.includes('changeup') || noteLow.includes('curve')) {
    hitClinicId = 'lunging';
    chosenBatId = 'combat-rodeo';
    swingDiagnosis = 'Your weight and head drift onto a locking front leg early, making breaking balls and changeups tough to square up.';
    batReason = 'Combat Spec-A1 Rodeo (-3) offers responsive 1-piece barrel feedback while building front-side block timing against Mix pitches.';
  } else if (hitLow.includes('square the ball up')) {
    hitClinicId = 'rolling-over';
    chosenBatId = expLow.includes('varsity') || expLow.includes('college') ? 'baum-gold' : 'goods-2026';
    swingDiagnosis = 'Strong barrel feel — focusing on slight upward attack (+8° to +13°) and holding top-hand posture past contact turns hard liners into deep home runs.';
  }

  // Match fielding clinic
  let fieldClinicId = 'glove-stab';
  let fieldingDiagnosis = 'Working your open glove triangle out in front of your eyes and funneling softly toward your belt prevents bad hops and speeds up throwing exchanges.';

  if (fieldLow.includes('footwork') || fieldLow.includes('heels')) {
    fieldClinicId = 'footwork-cadence';
    fieldingDiagnosis = 'Replacing flat-footed waits with rhythmic "Right—Left—Catch—Right—Throw" footwork puts body momentum smoothly behind every throw across the diamond.';
  } else if (fieldLow.includes('banana') || fieldLow.includes('fly balls') || posLow.includes('outfield')) {
    fieldClinicId = 'banana-route';
    fieldingDiagnosis = 'Snapping your hips open into an immediate 45° drop-step and pumping both arms straight to the landing spot adds 10+ feet of outfield range.';
  } else if (fieldLow.includes('crow hop') || fieldLow.includes('carry')) {
    fieldClinicId = 'crow-hop';
    fieldingDiagnosis = 'Switching from a tall vertical bounce to a low, linear crow-hop skim preserves forward speed and produces flat, biting relay throws.';
  } else if (fieldLow.includes('clean glove')) {
    fieldClinicId = posLow.includes('outfield') ? 'crow-hop' : 'footwork-cadence';
    fieldingDiagnosis = 'With clean hands already in place, tightening transfer rhythm and downhill throw alignment will shave tenths of a second off outs.';
  }

  const missedIq = iqChecks.filter((c) => !c.correct).map((c) => c.label);
  const iqTotal = iqChecks.length;
  const iqBreakdown = missedIq.length === 0
    ? `Perfect ${iqTotal}/${iqTotal} on rules, cutoff reads & Statcast barrels! Pair that game awareness with daily cage reps.`
    : `You scored ${iqCorrectCount}/${iqTotal} on situational IQ. Review ${missedIq.join(', ')} inside our 5-Expert Lessons so pre-pitch reads become automatic.`;

  const baseScenarios = [];
  if (iqChecks[0] && !iqChecks[0].correct) baseScenarios.push({ scenarioId: 'force-vs-tag', reason: 'Lock down exactly when to touch the bag vs. tag the runner on infield grounders.' });
  if (iqChecks[1] && !iqChecks[1].correct) baseScenarios.push({ scenarioId: 'infield-fly', reason: 'Clarify automatic outs and base-running traps with runners on 1st & 2nd.' });
  if (iqChecks[2] && !iqChecks[2].correct) baseScenarios.push({ scenarioId: 'launch-angle-exit-velo', reason: 'See how 26°–30° launch angles and 98+ mph exit velo create true Statcast barrels.' });
  if (iqChecks[3] && !iqChecks[3].correct) baseScenarios.push({ scenarioId: 'relay-throw', reason: 'Master cutoff positioning and hitting the chest on gap doubles.' });
  const posScenario = posLow.includes('outfield')
    ? { scenarioId: 'relay-throw', reason: 'Align relay targets and hit the cutoff chest smoothly on extra-base hits.' }
    : posLow.includes('catcher')
      ? { scenarioId: 'catcher-framing', reason: 'Steal borderline strikes quietly with strong low-to-high receiving pockets.' }
      : { scenarioId: 'xwoba-metrics', reason: 'Compare quality of contact vs. lucky box-score hits across a full season.' };
  if (baseScenarios.length < 2) baseScenarios.push(posScenario);
  if (baseScenarios.length < 2) baseScenarios.push({ scenarioId: 'stealing-second', reason: 'Read pitcher pickoff timing, jump speed, and infield coverage.' });

  const readinessScore = Math.min(97, Math.max(52, 54 + iqCorrectCount * 7 + (expLow.includes('varsity') || expLow.includes('college') ? 14 : expLow.includes('travel') ? 8 : 2)));

  const videoIds = [hitClinicId, fieldClinicId];
  if (hitClinicId !== 'rolling-over' && videoIds.length < 3) videoIds.push('rolling-over');
  else if (fieldClinicId !== 'footwork-cadence' && videoIds.length < 3) videoIds.push('footwork-cadence');

  const handTag = battingHand === 'L' ? 'Lefty' : 'Righty';
  return {
    createdAt: new Date().toISOString(),
    inputs: {
      experienceLevel,
      primaryPosition,
      battingHand,
      throwingHand,
      primaryGoal,
      hittingSymptom,
      fieldingSymptom,
      playerNotes
    },
    iqCorrectCount,
    iqTotal,
    skillTier,
    readinessScore,
    headline: `${handTag} ${primaryPosition.split(' (')[0]} Plan: Fix ${VALID_CLINICS[hitClinicId].title.split(' (')[0]}`,
    summary: `Tailored for ${experienceLevel.split(' (')[0]} (${handTag} Bats / ${throwingHand === 'L' ? 'LHP/L' : 'RHP/R'} Throws): focus on ${primaryGoal || 'barrel consistency'}, clean up ${VALID_CLINICS[hitClinicId].domain.toLowerCase()}, and sharpen ${VALID_CLINICS[fieldClinicId].title.split(' (')[0].toLowerCase()}.`,
    swingDiagnosis,
    fieldingDiagnosis,
    iqBreakdown,
    actionableTips: [
      `Hitting Cue — Open "${VALID_CLINICS[hitClinicId].title}" in the Training Lab for 3 quick cues and a verified YouTube coach demo.`,
      `Cage Drill — Run 3×10 tee reps focusing on your simple contact cue before facing live arms or the pitching machine.`,
      `Fielding Cue — Practice "${VALID_CLINICS[fieldClinicId].title}" with short 10-minute footwork & soft-hand reps.`,
      `Game IQ & Bat — Test ${VALID_BATS[chosenBatId].split(' (')[0]} in the 3D Stadium (${handTag} box) targeting balanced timing and clean line drives.`
    ],
    videoLinks: videoIds.filter((cid) => VALID_CLINICS[cid]).map((cid) => ({
      clinicId: cid,
      title: VALID_CLINICS[cid].title,
      domain: VALID_CLINICS[cid].domain,
      reason: cid === hitClinicId
        ? 'Primary swing focus matched to your reported plate feel.'
        : cid === fieldClinicId
          ? 'Primary defensive drill tailored to your glove and footwork.'
          : 'Bonus contact routine to build everyday consistency.',
      url: `training.html?clinic=${encodeURIComponent(cid)}#video-clinic-section`
    })),
    recommendedScenarios: baseScenarios.slice(0, 2).map((s) => ({
      scenarioId: s.scenarioId,
      title: VALID_SCENARIOS[s.scenarioId],
      reason: s.reason,
      url: `detail.html?id=${encodeURIComponent(s.scenarioId)}`
    })),
    recommendedBatId: chosenBatId,
    recommendedBatName: VALID_BATS[chosenBatId],
    batReason
  };
}

app.post('/api/ai/onboarding-quiz', async (req, res) => {
  const apiKey = getGeminiApiKey();

  const body = req.body || {};
  const experienceLevel = String(body.experienceLevel || '').trim();
  const primaryPosition = String(body.primaryPosition || '').trim();
  const battingHand = body.battingHand === 'L' ? 'L' : 'R';
  const throwingHand = body.throwingHand === 'L' ? 'L' : 'R';
  const primaryGoal = String(body.primaryGoal || 'More consistent barrels & defense').trim().slice(0, 120);
  const hittingSymptom = String(body.hittingSymptom || '').trim();
  const fieldingSymptom = String(body.fieldingSymptom || '').trim();
  const iqForceAnswer = String(body.iqForceAnswer || '').trim();
  const iqInfieldFlyAnswer = String(body.iqInfieldFlyAnswer || '').trim();
  const iqLaunchAngleAnswer = String(body.iqLaunchAngleAnswer || '').trim();
  const iqCutoffAnswer = String(body.iqCutoffAnswer || '').trim();
  const playerNotes = String(body.playerNotes || '').trim().slice(0, 800);

  if (!experienceLevel || !primaryPosition || !hittingSymptom || !fieldingSymptom) {
    return res.status(400).json({
      error: 'Please select your experience level, position, swing feel, and fielding feel.'
    });
  }

  // Deterministic Baseball IQ scoring across 4 rule/fielding/Statcast questions
  const iqChecks = [
    {
      label: 'Force Out vs. Tag Out',
      correct: iqForceAnswer === 'step-2b',
      answer: iqForceAnswer
    },
    {
      label: 'Infield Fly Rule',
      correct: iqInfieldFlyAnswer === 'batter-out-runners-advance-at-risk',
      answer: iqInfieldFlyAnswer
    },
    {
      label: 'Barrel Launch Angle & Exit Velo',
      correct: iqLaunchAngleAnswer === '26-30-deg-98-mph',
      answer: iqLaunchAngleAnswer
    },
    {
      label: 'Cutoff & Relay Alignment',
      correct: iqCutoffAnswer === 'cutoff-lines-up-relay',
      answer: iqCutoffAnswer
    }
  ];
  const iqCorrectCount = iqChecks.filter((c) => c.correct).length;
  const iqTotal = iqChecks.length;

  const fallbackParams = {
    experienceLevel,
    primaryPosition,
    battingHand,
    throwingHand,
    primaryGoal,
    hittingSymptom,
    fieldingSymptom,
    iqChecks,
    iqCorrectCount,
    playerNotes
  };

  const syncUserPrefs = async (chosenBatId) => {
    if (!req.user) return;
    await store.updateUserProfile(req.user.id, {
      preferences: {
        battingHand,
        throwingHand,
        defaultBat: chosenBatId
      }
    });
  };

  if (!apiKey) {
    const profile = buildDeterministicCoachProfile(fallbackParams);
    if (req.user) {
      await store.saveOnboardingProfile(req.user.id, profile);
      await syncUserPrefs(profile.recommendedBatId);
    }
    return res.json({ profile, saved: Boolean(req.user), source: 'coach-rules' });
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
  });

  const clinicCatalogText = Object.entries(VALID_CLINICS)
    .map(([id, info]) => `- "${id}": ${info.title} (${info.domain})`)
    .join('\n');
  const scenarioCatalogText = Object.entries(VALID_SCENARIOS)
    .map(([id, title]) => `- "${id}": ${title}`)
    .join('\n');
  const batCatalogText = Object.entries(VALID_BATS)
    .map(([id, label]) => `- "${id}": ${label}`)
    .join('\n');

  const promptText = `Analyze this baseball player's 5-step intake checkup and build a personalized, concise scouting report with hitting AND fielding tips, slow-mo video clinic links, and cage equipment.

Player Profile:
- Username: ${req.user ? req.user.username : 'Guest Player'}
- Experience Level: ${experienceLevel}
- Primary Position: ${primaryPosition} (Bats: ${battingHand}, Throws: ${throwingHand})
- Season Focus Goal: ${primaryGoal}
- Swing Symptom Reported: ${hittingSymptom}
- Fielding Symptom Reported: ${fieldingSymptom}
- Baseball & Defense IQ Score: ${iqCorrectCount}/${iqTotal}
  * Q1 (Force Out on runner on 1B, ball hit to SS): ${iqForceAnswer || 'skipped'} (correct: step-2b)
  * Q2 (Infield Fly Rule pop-up with 1B & 2B occupied, <2 outs): ${iqInfieldFlyAnswer || 'skipped'} (correct: batter-out-runners-advance-at-risk)
  * Q3 (Statcast Barrel zone for elevated HRs): ${iqLaunchAngleAnswer || 'skipped'} (correct: 26-30-deg-98-mph)
  * Q4 (Double into LCF gap relay responsibility): ${iqCutoffAnswer || 'skipped'} (correct: cutoff-lines-up-relay)
- Player's Own Notes: ${playerNotes || '(None typed)'}

Available Playable Training Video Clinics (ONLY pick clinicId from this exact list):
${clinicCatalogText}

Available 5-Expert Rule/Statcast Scenario Lessons (ONLY pick scenarioId from this exact list):
${scenarioCatalogText}

Available 3D Batting Cage Bats (ONLY pick recommendedBatId from this exact list):
${batCatalogText}

Rules:
- Keep language encouraging, crystal clear, concrete, and accurate to real baseball mechanics & MLB/Statcast rules.
- Include at least 1 hitting cue, 1 fielding cue, and 1 cage drill inside actionableTips.
- Pick 2 or 3 most relevant videoLinks matching their swing & fielding symptoms and playerNotes.
- Pick 2 recommendedScenarios matching any IQ gaps or positional focus.
- Pick the single best recommendedBatId matching their swing profile and experience level.`;

  try {
    const response = await generateWithRetry(
      ai,
      {
        model: GEMINI_MODEL,
        contents: promptText,
        config: {
          systemInstruction:
            'You are Coach Jax at DiamondIQ, a patient, ultra-clear MLB and youth baseball coach who helps both complete beginners and players fixing mechanical flaws.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              skillTier: { type: Type.STRING },
              readinessScore: { type: Type.INTEGER },
              headline: { type: Type.STRING },
              summary: { type: Type.STRING },
              swingDiagnosis: { type: Type.STRING },
              fieldingDiagnosis: { type: Type.STRING },
              iqBreakdown: { type: Type.STRING },
              actionableTips: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              videoLinks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    clinicId: { type: Type.STRING },
                    reason: { type: Type.STRING }
                  },
                  required: ['clinicId', 'reason']
                }
              },
              recommendedScenarios: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    scenarioId: { type: Type.STRING },
                    reason: { type: Type.STRING }
                  },
                  required: ['scenarioId', 'reason']
                }
              },
              recommendedBatId: { type: Type.STRING },
              batReason: { type: Type.STRING }
            },
            required: [
              'skillTier',
              'readinessScore',
              'headline',
              'summary',
              'swingDiagnosis',
              'fieldingDiagnosis',
              'iqBreakdown',
              'actionableTips',
              'videoLinks',
              'recommendedScenarios',
              'recommendedBatId',
              'batReason'
            ]
          }
        }
      },
      20000
    );

    const parsed = JSON.parse(response.text || '{}');
    const chosenBatId = VALID_BATS[parsed.recommendedBatId] ? parsed.recommendedBatId : 'goods-2026';

    const enrichedVideos = (Array.isArray(parsed.videoLinks) ? parsed.videoLinks : [])
      .filter((v) => v && VALID_CLINICS[v.clinicId])
      .slice(0, 3)
      .map((v) => {
        const meta = VALID_CLINICS[v.clinicId];
        return {
          clinicId: v.clinicId,
          title: meta.title,
          domain: meta.domain,
          reason: String(v.reason || ''),
          url: `training.html?clinic=${encodeURIComponent(v.clinicId)}#video-clinic-section`
        };
      });

    const enrichedScenarios = (Array.isArray(parsed.recommendedScenarios) ? parsed.recommendedScenarios : [])
      .filter((s) => s && VALID_SCENARIOS[s.scenarioId])
      .slice(0, 2)
      .map((s) => ({
        scenarioId: s.scenarioId,
        title: VALID_SCENARIOS[s.scenarioId],
        reason: String(s.reason || ''),
        url: `detail.html?id=${encodeURIComponent(s.scenarioId)}`
      }));

    const finalProfile = {
      createdAt: new Date().toISOString(),
      inputs: {
        experienceLevel,
        primaryPosition,
        battingHand,
        throwingHand,
        primaryGoal,
        hittingSymptom,
        fieldingSymptom,
        playerNotes
      },
      iqCorrectCount,
      iqTotal,
      skillTier: parsed.skillTier || 'Developing',
      readinessScore: Math.max(25, Math.min(99, Number(parsed.readinessScore) || 68)),
      headline: String(parsed.headline || 'Personalized DiamondIQ Player Plan'),
      summary: String(parsed.summary || ''),
      swingDiagnosis: String(parsed.swingDiagnosis || ''),
      fieldingDiagnosis: String(parsed.fieldingDiagnosis || ''),
      iqBreakdown: String(parsed.iqBreakdown || ''),
      actionableTips: Array.isArray(parsed.actionableTips) ? parsed.actionableTips.slice(0, 5) : [],
      videoLinks: enrichedVideos,
      recommendedScenarios: enrichedScenarios,
      recommendedBatId: chosenBatId,
      recommendedBatName: VALID_BATS[chosenBatId],
      batReason: String(parsed.batReason || '')
    };

    if (req.user) {
      await store.saveOnboardingProfile(req.user.id, finalProfile);
      await syncUserPrefs(chosenBatId);
    }

    return res.json({ profile: finalProfile, saved: Boolean(req.user), source: 'gemini' });
  } catch (err) {
    console.warn('Gemini Onboarding Quiz fallback triggered:', err && err.message ? err.message : err);
    const profile = buildDeterministicCoachProfile(fallbackParams);
    if (req.user) {
      await store.saveOnboardingProfile(req.user.id, profile);
      await syncUserPrefs(profile.recommendedBatId);
    }
    return res.json({ profile, saved: Boolean(req.user), source: 'coach-fallback' });
  }
});

/* =========================================================
   Coach Jax — Conversational Baseball AI Coach (Gemini API)
   ========================================================= */
app.post('/api/ai/jax', async (req, res) => {
  const apiKey = getGeminiApiKey();
  const body = req.body || {};
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message || message.length > 1200) {
    return res.status(400).json({ error: 'Ask Coach Jax a baseball question (1–1,200 characters).' });
  }

  if (!apiKey) {
    return res.status(503).json({
      error: 'Coach Jax AI needs GEMINI_API_KEY set in Settings > Secrets (or .env) to reply.'
    });
  }

  const rawHistory = Array.isArray(body.history) ? body.history.slice(-10) : [];
  const cleanHistory = rawHistory
    .filter((m) => m && (m.role === 'user' || m.role === 'jax') && typeof m.text === 'string' && m.text.trim())
    .map((m) => ({
      role: m.role === 'jax' ? 'Coach Jax' : 'Player',
      text: m.text.trim().slice(0, 600)
    }));

  let playerContextText = 'Guest player (no saved profile yet).';
  if (req.user) {
    const saved = await store.getOnboardingProfile(req.user.id);
    const prefs = req.user.preferences || {};
    const p = saved && saved.profile ? saved.profile : null;
    playerContextText = p
      ? `Username: ${req.user.username} | Level: ${p.inputs?.experienceLevel || 'N/A'} | Position: ${p.inputs?.primaryPosition || 'N/A'} | Bats/Throws: ${prefs.battingHand || 'R'}/${prefs.throwingHand || 'R'} | Swing Symptom: ${p.inputs?.hittingSymptom || 'N/A'} | Fielding Symptom: ${p.inputs?.fieldingSymptom || 'N/A'} | Saved Bat: ${prefs.defaultBat || p.recommendedBatId || 'goods-2026'}`
      : `Username: ${req.user.username} | Bats/Throws: ${prefs.battingHand || 'R'}/${prefs.throwingHand || 'R'} | Preferred Bat: ${prefs.defaultBat || 'goods-2026'}`;
  }

  const clinicCatalogText = Object.entries(VALID_CLINICS)
    .map(([id, info]) => `- "${id}": ${info.title} (${info.domain})`)
    .join('\n');
  const scenarioCatalogText = Object.entries(VALID_SCENARIOS)
    .map(([id, title]) => `- "${id}": ${title}`)
    .join('\n');
  const batCatalogText = Object.entries(VALID_BATS)
    .map(([id, label]) => `- "${id}": ${label}`)
    .join('\n');

  const historyBlock = cleanHistory.length
    ? cleanHistory.map((h) => `${h.role}: ${h.text}`).join('\n')
    : '(First message in conversation)';

  const promptText = `You are Coach Jax — DiamondIQ's patient, encouraging, practical baseball coach built specifically to help BOTH complete beginners learning baseball AND experienced players fixing mechanical flaws (bat drag, casting, rolling over, lunging, infield glove stabbing, flat footwork, banana routes, crow hop throws, bat choice, timing, or rules).

Player Context:
${playerContextText}

Recent Conversation:
${historyBlock}

Player's Current Question:
${message}

Available DiamondIQ Short Drill Guides & Real YouTube Links (pick 1–2 relevant IDs if helpful):
${clinicCatalogText}

Available 5-Expert Rule & Analytics Lessons (pick 1–2 relevant IDs if helpful):
${scenarioCatalogText}

Available 3D Cage Bats (pick best match if relevant, else "goods-2026"):
${batCatalogText}

Coaching Guidelines:
- Speak in plain, friendly, beginner-accessible English—translate any baseball jargon briefly in 4–6 words so beginners never feel lost, while still giving sharp, concrete mechanical fixes for players with flaws.
- Structure reply tightly (3–5 short sentences): (1) validate what's happening and why, (2) give 1 clear mental feel cue to try on their very next rep.
- In actionableTips, provide 2–4 short 10-minute drills anyone can do on a tee, with a partner, or in the 3D Stadium.
- Put 1–2 relevant clinic IDs in recommendedClinicIds so the player can jump straight into our Training Lab and curated YouTube coaching videos.`;

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
  });

  try {
    const response = await generateWithRetry(
      ai,
      {
        model: GEMINI_MODEL,
        contents: promptText,
        config: {
          systemInstruction:
            'You are Coach Jax at DiamondIQ, a warm, crystal-clear baseball hitting, fielding, rules, and gear coach for beginners and players fixing flaws. Never fabricate URLs; select clinicIds and scenarioIds strictly from the allowed enum values.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: { type: Type.STRING },
              actionableTips: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              recommendedClinicIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              recommendedScenarioIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              youtubeTopics: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              recommendedBatId: { type: Type.STRING }
            },
            required: ['reply', 'actionableTips', 'recommendedClinicIds', 'recommendedScenarioIds', 'youtubeTopics', 'recommendedBatId']
          }
        }
      },
      12000
    );

    const parsed = JSON.parse(response.text || '{}');
    const chosenBatId = VALID_BATS[parsed.recommendedBatId] ? parsed.recommendedBatId : 'goods-2026';

    const clinicIds = (Array.isArray(parsed.recommendedClinicIds) ? parsed.recommendedClinicIds : [])
      .filter((id, idx, arr) => VALID_CLINICS[id] && arr.indexOf(id) === idx)
      .slice(0, 2);

    const videoLinks = clinicIds.map((id) => ({
      clinicId: id,
      title: VALID_CLINICS[id].title,
      domain: VALID_CLINICS[id].domain,
      url: `training.html?clinic=${encodeURIComponent(id)}#video-clinic-section`
    }));

    const recommendedScenarios = (Array.isArray(parsed.recommendedScenarioIds) ? parsed.recommendedScenarioIds : [])
      .filter((id, idx, arr) => VALID_SCENARIOS[id] && arr.indexOf(id) === idx)
      .slice(0, 2)
      .map((id) => ({
        scenarioId: id,
        title: VALID_SCENARIOS[id],
        url: `detail.html?id=${encodeURIComponent(id)}`
      }));

    const curatedYts = clinicIds
      .map((id) => VALID_CLINICS[id].youtube)
      .filter(Boolean);

    const searchYts = (Array.isArray(parsed.youtubeTopics) ? parsed.youtubeTopics : [])
      .filter((t) => typeof t === 'string' && t.trim().length > 2)
      .slice(0, 1)
      .map((topic) => {
        const cleanTopic = topic.trim().slice(0, 80);
        return {
          label: `Search YouTube: ${cleanTopic}`,
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanTopic)}`
        };
      });

    const youtubeLinks = [...curatedYts, ...searchYts].slice(0, 3);

    return res.json({
      coach: 'Jax',
      reply: String(parsed.reply || '').trim(),
      actionableTips: (Array.isArray(parsed.actionableTips) ? parsed.actionableTips : [])
        .map((t) => String(t).trim())
        .filter(Boolean)
        .slice(0, 4),
      videoLinks,
      recommendedScenarios,
      youtubeLinks,
      recommendedBatId: chosenBatId,
      recommendedBatName: VALID_BATS[chosenBatId]
    });
  } catch (err) {
    console.error('Coach Jax Gemini error:', err && err.message ? err.message : err);
    const classified = classifyGeminiError(err);
    return res.status(classified.httpStatus).json({
      error: classified.message
    });
  }
});

/* =========================================================
   Scenarios (Search, Category Filter, Sort, Trivia, Ratings)
   ========================================================= */
app.get('/api/scenarios', async (req, res, next) => {
  try {
    const { q = '', category = 'all', sort = 'az' } = req.query;
    const scenarios = await store.listScenarios({
      q: String(q),
      category: String(category),
      sort: String(sort),
      userId: req.user ? req.user.id : null
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
    const masteredList = req.user ? await store.listTriviaMastered(req.user.id) : [];
    const favoritesList = req.user ? await store.listFavorites(req.user.id) : [];
    return res.json({
      scenario,
      mastered: masteredList.includes(scenario.id),
      isFavorite: favoritesList.includes(scenario.id)
    });
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
    const { answerKey } = req.body || {};
    if (!answerKey || typeof answerKey !== 'string') {
      return res.status(400).json({ error: 'Pick an answer first.' });
    }
    const correct = answerKey === scenario.trivia.correctKey;
    if (correct && req.user) {
      await store.markTriviaMastered(req.user.id, scenario.id);
    }
    return res.json({
      correct,
      correctKey: scenario.trivia.correctKey,
      explanation: scenario.trivia.explanation,
      mastered: Boolean(correct && req.user)
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
    const rating = await store.getScenarioRating(
      scenario.id,
      req.user ? req.user.id : null
    );
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
    const rating = await store.setScenarioRating(req.user.id, scenario.id, stars);
    return res.json(rating);
  } catch (err) {
    return next(err);
  }
});

/* =========================================================
   Favorites (Saved Scenarios)
   ========================================================= */
app.get('/api/favorites', async (req, res, next) => {
  try {
    const favorites = req.user ? await store.listFavorites(req.user.id) : [];
    res.json({ favorites });
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
    const favorites = await store.addFavorite(req.user.id, scenario.id);
    return res.status(201).json({ favorites });
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
   Playbook CRUD (Protected + Server Ownership Checks)
   ========================================================= */
function validatePlaybookPayload(payload) {
  const title = typeof payload?.title === 'string' ? payload.title.trim() : '';
  const body = typeof payload?.body === 'string' ? payload.body.trim() : '';
  const rating = Number(payload?.rating);

  if (title.length < 2 || title.length > 120) {
    return { error: 'Play name must be between 2 and 120 characters.' };
  }
  if (body.length < 3 || body.length > 2000) {
    return { error: 'Strategy notes must be between 3 and 2,000 characters.' };
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: 'Difficulty rating must be between 1 and 5.' };
  }
  return { title, body, rating };
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
    if (parsed.error) {
      return res.status(400).json({ error: parsed.error });
    }
    const entry = await store.createPlaybookEntry(req.user.id, parsed);
    return res.status(201).json({ entry });
  } catch (err) {
    return next(err);
  }
});

app.put('/api/playbook/:id', requireAuth, async (req, res, next) => {
  try {
    const entryId = Number(req.params.id);
    if (!Number.isInteger(entryId) || entryId <= 0) {
      return res.status(400).json({ error: 'Invalid playbook entry ID.' });
    }
    const parsed = validatePlaybookPayload(req.body);
    if (parsed.error) {
      return res.status(400).json({ error: parsed.error });
    }
    const result = await store.updatePlaybookEntry(req.user.id, entryId, parsed);
    if (result.status === 'not_found') {
      return res.status(404).json({ error: 'Playbook entry not found.' });
    }
    if (result.status === 'forbidden') {
      return res.status(403).json({ error: 'You can only edit your own playbook entries.' });
    }
    return res.json({ entry: result.entry });
  } catch (err) {
    return next(err);
  }
});

app.delete('/api/playbook/:id', requireAuth, async (req, res, next) => {
  try {
    const entryId = Number(req.params.id);
    if (!Number.isInteger(entryId) || entryId <= 0) {
      return res.status(400).json({ error: 'Invalid playbook entry ID.' });
    }
    const result = await store.deletePlaybookEntry(req.user.id, entryId);
    if (result.status === 'not_found') {
      return res.status(404).json({ error: 'Playbook entry not found.' });
    }
    if (result.status === 'forbidden') {
      return res.status(403).json({ error: 'You can only delete your own playbook entries.' });
    }
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

/* =========================================================
   Static Assets & Fallback
   ========================================================= */
app.get('/favicon.ico', (_req, res) => res.status(204).end());

app.use('/vendor/three', express.static(path.join(__dirname, 'node_modules', 'three')));
app.use(express.static(__dirname));

app.use('/api', (err, _req, res, _next) => {
  console.error('API Error:', { code: err.code || 'UNKNOWN', message: err.message || 'Unknown error' });
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
  console.log(`DiamondIQ Phases 1-5 running on http://0.0.0.0:${PORT} (storage: ${store.mode})`);
});
