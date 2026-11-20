/* DiamondIQ — Phase 4 Express Server & Full Interactive REST API
   Serves all 7 pages, scrypt cookie auth, 8 seeded scenarios with search/filter/sort,
   protected Playbook CRUD, Favorites, Trivia scoring/mastery, 5-Star Ratings, and Stats. */

const path = require('path');
const express = require('express');
const { GoogleGenAI, Type, ThinkingLevel } = require('@google/genai');
const { store } = require('./db');
const { OPENING_DAY_ISO, FUN_FACTS } = require('./data');

const app = express();
app.set('trust proxy', 1);
const PORT = Number(process.env.PORT) || 3000;
const COOKIE_NAME = 'diamondiq_sid';
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const VALID_CLINICS = {
  'bat-drag': {
    title: 'Fix Bat Drag (Rear Elbow Getting Stuck)',
    domain: 'Hitting Mechanics',
    scenarioId: 'launch-angle-exit-velo'
  },
  casting: {
    title: 'Stop Casting & Looping the Barrel',
    domain: 'Hitting Mechanics',
    scenarioId: 'launch-angle-exit-velo'
  },
  'rolling-over': {
    title: 'Fix Rolling Over (Weak Pull-Side Grounders)',
    domain: 'Hitting Mechanics',
    scenarioId: 'xwoba-metrics'
  },
  lunging: {
    title: 'Stop Lunging Forward at Off-Speed Pitches',
    domain: 'Hitting Mechanics',
    scenarioId: 'xwoba-metrics'
  },
  'glove-stab': {
    title: 'Fix Glove Stabbing & Stiff Funneling',
    domain: 'Fielding Mechanics',
    scenarioId: 'force-vs-tag'
  },
  'footwork-cadence': {
    title: 'Fix Flat-Footed Infield Approaches (Right-Left-Catch)',
    domain: 'Fielding Mechanics',
    scenarioId: 'stealing-second'
  },
  'banana-route': {
    title: 'Fix "Banana" Routes on Outfield Fly Balls',
    domain: 'Fielding Mechanics',
    scenarioId: 'tagging-up'
  },
  'crow-hop': {
    title: 'Fix Weak Off-Balance Throws (Crow Hop & Cutoff)',
    domain: 'Fielding Mechanics',
    scenarioId: 'relay-throw'
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
    return res.json({ user, sessionToken: token, needsOnboarding: !user.hasOnboarding });
  } catch (err) {
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
      return res.json({ profile: null });
    }
    const record = await store.getOnboardingProfile(req.user.id);
    return res.json({ profile: record ? record.profile : null, updatedAt: record ? record.updatedAt : null });
  } catch (err) {
    return next(err);
  }
});

function buildDeterministicCoachProfile({
  experienceLevel,
  primaryPosition,
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
    skillTier = iqCorrectCount >= 2 ? 'Varsity / Advanced' : 'Intermediate';
  } else if (expLow.includes('travel') || expLow.includes('high school')) {
    skillTier = iqCorrectCount === 3 ? 'Intermediate' : 'Developing';
  } else if (expLow.includes('beginner')) {
    skillTier = 'Beginner';
  }

  // Match hitting clinic
  let hitClinicId = 'rolling-over';
  let chosenBatId = 'goods-2026';
  let swingDiagnosis = 'Your swing foundation is solid; keeping your top hand palm-up/palm-down 8 inches past contact will unlock higher backspin carry and eliminate rolled-over pull grounders.';
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
    chosenBatId = expLow.includes('varsity') ? 'baum-gold' : 'goods-2026';
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
  const iqBreakdown = missedIq.length === 0
    ? 'Perfect 3/3 on rules & Statcast barrels! Keep pairing situational anticipation with pre-pitch awareness before every ball put in play.'
    : `You scored ${iqCorrectCount}/3 on situational IQ. Review ${missedIq.join(' & ')} inside our 5-Expert Lessons so pre-pitch reads become automatic.`;

  const baseScenarios = [];
  if (!iqChecks[0].correct) baseScenarios.push({ scenarioId: 'force-vs-tag', reason: 'Lock down exactly when to touch the bag vs. tag the runner on infield grounders.' });
  if (!iqChecks[1].correct) baseScenarios.push({ scenarioId: 'infield-fly', reason: 'Clarify automatic outs and base-running traps with runners on 1st & 2nd.' });
  if (!iqChecks[2].correct) baseScenarios.push({ scenarioId: 'launch-angle-exit-velo', reason: 'See how 26°–30° launch angles and 98+ mph exit velo create true Statcast barrels.' });
  const posScenario = posLow.includes('outfield')
    ? { scenarioId: 'relay-throw', reason: 'Align relay targets and hit the cutoff chest smoothly on extra-base hits.' }
    : posLow.includes('catcher')
      ? { scenarioId: 'catcher-framing', reason: 'Steal borderline strikes quietly with strong low-to-high receiving pockets.' }
      : { scenarioId: 'xwoba-metrics', reason: 'Compare quality of contact vs. lucky box-score hits across a full season.' };
  if (baseScenarios.length < 2) baseScenarios.push(posScenario);
  if (baseScenarios.length < 2) baseScenarios.push({ scenarioId: 'stealing-second', reason: 'Read pitcher pickoff timing, jump speed, and infield coverage.' });

  const readinessScore = Math.min(96, Math.max(52, 58 + iqCorrectCount * 8 + (expLow.includes('varsity') ? 14 : expLow.includes('travel') ? 8 : 2)));

  const videoIds = [hitClinicId, fieldClinicId];
  if (hitClinicId !== 'rolling-over' && videoIds.length < 3) videoIds.push('rolling-over');
  else if (fieldClinicId !== 'footwork-cadence' && videoIds.length < 3) videoIds.push('footwork-cadence');

  return {
    createdAt: new Date().toISOString(),
    inputs: { experienceLevel, primaryPosition, hittingSymptom, fieldingSymptom, playerNotes },
    iqCorrectCount,
    iqTotal: 3,
    skillTier,
    readinessScore,
    headline: `${primaryPosition.split(' (')[0]} Plan: Fix ${VALID_CLINICS[hitClinicId].title.split(' (')[0]}`,
    summary: `Tailored for ${experienceLevel.split(' (')[0]} level: tighten ${VALID_CLINICS[hitClinicId].domain.toLowerCase()} first, sharpen ${VALID_CLINICS[fieldClinicId].title.split(' (')[0].toLowerCase()}, and track every cut in the D1 Rapsodo Lab.`,
    swingDiagnosis,
    fieldingDiagnosis,
    iqBreakdown,
    actionableTips: [
      `Watch "${VALID_CLINICS[hitClinicId].title}" in 0.45x Slow-Mo Split View and pause at Stage 3 (Contact) to match your hand & elbow slot.`,
      `Run 3 sets × 10 focused tee swings focusing solely on "${VALID_CLINICS[hitClinicId].title}" before full BP.`,
      `Warm up defense with "${VALID_CLINICS[fieldClinicId].title}" slow-mo footwork reps so transfers stay fluid.`,
      `Step into Charles Schwab Field Omaha (3D Studio) with ${VALID_BATS[chosenBatId].split(' (')[0]} and aim for 1.32+ Smash Factor & 20°–30° launch angles.`
    ],
    videoLinks: videoIds.filter((cid) => VALID_CLINICS[cid]).map((cid) => ({
      clinicId: cid,
      title: VALID_CLINICS[cid].title,
      domain: VALID_CLINICS[cid].domain,
      reason: cid === hitClinicId
        ? 'Primary swing fix matched directly to your reported plate feel.'
        : cid === fieldClinicId
          ? 'Primary defensive drill tailored to your glove/footwork habit.'
          : 'Bonus Rapsodo/contact clinic to build complete barrel control.',
      url: `training.html?clinic=${encodeURIComponent(cid)}&slow=1&bat=${encodeURIComponent(chosenBatId)}`
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
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();

  const body = req.body || {};
  const experienceLevel = String(body.experienceLevel || '').trim();
  const primaryPosition = String(body.primaryPosition || '').trim();
  const hittingSymptom = String(body.hittingSymptom || '').trim();
  const fieldingSymptom = String(body.fieldingSymptom || '').trim();
  const iqForceAnswer = String(body.iqForceAnswer || '').trim();
  const iqInfieldFlyAnswer = String(body.iqInfieldFlyAnswer || '').trim();
  const iqLaunchAngleAnswer = String(body.iqLaunchAngleAnswer || '').trim();
  const playerNotes = String(body.playerNotes || '').trim().slice(0, 800);

  if (!experienceLevel || !primaryPosition || !hittingSymptom || !fieldingSymptom) {
    return res.status(400).json({
      error: 'Please select your experience level, position, swing feel, and fielding feel.'
    });
  }

  // Deterministic Baseball IQ scoring on the 3 rule/stat questions
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
    }
  ];
  const iqCorrectCount = iqChecks.filter((c) => c.correct).length;

  const fallbackParams = {
    experienceLevel,
    primaryPosition,
    hittingSymptom,
    fieldingSymptom,
    iqChecks,
    iqCorrectCount,
    playerNotes
  };

  if (!apiKey) {
    const profile = buildDeterministicCoachProfile(fallbackParams);
    if (req.user) {
      await store.saveOnboardingProfile(req.user.id, profile);
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

  const promptText = `Analyze this baseball player's intake checkup and build a personalized, plain-English scouting report with recommended slow-mo video clinics and cage equipment.

Player Profile:
- Username: ${req.user ? req.user.username : 'Guest Player'}
- Experience Level: ${experienceLevel}
- Primary Position: ${primaryPosition}
- Swing Symptom Reported: ${hittingSymptom}
- Fielding Symptom Reported: ${fieldingSymptom}
- Baseball IQ Check Score: ${iqCorrectCount}/3
  * Q1 (Force Out on runner on 1B, ball hit to SS): ${iqForceAnswer || 'skipped'} (correct: step-2b)
  * Q2 (Infield Fly Rule pop-up with 1B & 2B occupied, <2 outs): ${iqInfieldFlyAnswer || 'skipped'} (correct: batter-out-runners-advance-at-risk)
  * Q3 (Statcast Barrel zone for elevated HRs): ${iqLaunchAngleAnswer || 'skipped'} (correct: 26-30-deg-98-mph)
- Player's Own Words About Swing / Fielding Flaws & Goals: ${playerNotes || '(None typed)'}

Available Playable Training Video Clinics (ONLY pick clinicId from this exact list):
${clinicCatalogText}

Available 5-Expert Rule/Statcast Scenario Lessons (ONLY pick scenarioId from this exact list):
${scenarioCatalogText}

Available 3D Batting Cage Bats (ONLY pick recommendedBatId from this exact list):
${batCatalogText}

Rules:
- Keep language encouraging, crystal clear for a 9th-grade to varsity player, concrete, and accurate to real baseball mechanics & MLB/Statcast rules.
- Pick 2 or 3 most relevant videoLinks matching their swing & fielding symptoms and playerNotes.
- Pick 2 recommendedScenarios matching any IQ gaps or positional focus.
- Pick the single best recommendedBatId matching their swing profile and experience level.`;

  let timeoutHandle;
  try {
    const aiPromise = ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: promptText,
      config: {
        systemInstruction:
          'You are Head Coach AI at DiamondIQ, an encouraging, ultra-clear MLB hitting and fielding biomechanics coach and sabermetrics educator.',
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            skillTier: {
              type: Type.STRING,
              enum: ['Beginner', 'Developing', 'Intermediate', 'Varsity / Advanced']
            },
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
                  clinicId: {
                    type: Type.STRING,
                    enum: Object.keys(VALID_CLINICS)
                  },
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
                  scenarioId: {
                    type: Type.STRING,
                    enum: Object.keys(VALID_SCENARIOS)
                  },
                  reason: { type: Type.STRING }
                },
                required: ['scenarioId', 'reason']
              }
            },
            recommendedBatId: {
              type: Type.STRING,
              enum: Object.keys(VALID_BATS)
            },
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
    });

    const timeoutPromise = new Promise((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(new Error('Coach AI timed out after 25s'));
      }, 25000);
    });

    const response = await Promise.race([aiPromise, timeoutPromise]);
    clearTimeout(timeoutHandle);

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
          url: `training.html?clinic=${encodeURIComponent(v.clinicId)}&slow=1&bat=${encodeURIComponent(chosenBatId)}`
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
        hittingSymptom,
        fieldingSymptom,
        playerNotes
      },
      iqCorrectCount,
      iqTotal: 3,
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
    }

    return res.json({ profile: finalProfile, saved: Boolean(req.user), source: 'gemini' });
  } catch (err) {
    clearTimeout(timeoutHandle);
    console.warn('Gemini Onboarding Quiz fallback triggered:', err && err.message ? err.message : err);
    const profile = buildDeterministicCoachProfile(fallbackParams);
    if (req.user) {
      await store.saveOnboardingProfile(req.user.id, profile);
    }
    return res.json({ profile, saved: Boolean(req.user), source: 'coach-fallback' });
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
