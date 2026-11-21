/* DiamondIQ — Phase 2, 3 & 4 Client Controller
   Theme toggle, mobile nav, auth state, interactive play diagrams,
   Scenario search/filter/sort/pagination, Trivia scoring, 5-Star ratings,
   Compare tool, Favorites, and full Playbook CRUD. */
(function () {
  'use strict';

  const THEME_KEY = 'diamondiq_theme';
  let currentUser = null;
  let toastTimer = null;

  const EXPERT_DESCRIPTIONS = [
    {
      role: '01 · Baseball Fundamentals',
      title: 'Youth Baseball Coach',
      focus: 'Real rules, where to throw the ball, and simple game-day footwork cues you can use right away.'
    },
    {
      role: '02 · Baseball Stats',
      title: 'Sabermetrics Analyst',
      focus: 'Modern Statcast numbers like launch angle, exit velocity, and xwOBA translated into Low / Medium / High gauges.'
    },
    {
      role: '03 · How It Works',
      title: 'Web Dev Mentor',
      focus: 'How baseball rules map cleanly to database tables, REST routes, and interactive browser controls.'
    },
    {
      role: '04 · Design & Clarity',
      title: 'UI/UX Designer',
      focus: 'High-contrast colors, readable numbers, and clear field drawings that work on laptops and phones.'
    },
    {
      role: '05 · Beginner Take',
      title: 'Rookie Player',
      focus: 'Honest, plain-English "aha!" takeaways so new fans never get stuck in confusing rulebook words.'
    }
  ];

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  const SESSION_TOKEN_KEY = 'diamondiq_sid_fallback';

  function getStoredSessionToken() {
    try {
      return localStorage.getItem(SESSION_TOKEN_KEY) || '';
    } catch {
      return '';
    }
  }

  function setStoredSessionToken(token) {
    try {
      if (token) localStorage.setItem(SESSION_TOKEN_KEY, token);
      else localStorage.removeItem(SESSION_TOKEN_KEY);
    } catch {
      /* ignore */
    }
  }

  function safeNextUrl(raw) {
    if (!raw || typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    if (/^[a-zA-Z0-9_-]+\.html(\?[a-zA-Z0-9_=&%+-]*)?(#[a-zA-Z0-9_-]+)?$/.test(trimmed)) {
      return trimmed;
    }
    return null;
  }

  function getAuthHeaders(extraHeaders = {}) {
    const token = getStoredSessionToken();
    const base = { 'Content-Type': 'application/json', ...extraHeaders };
    if (token) base.Authorization = `Bearer ${token}`;
    return base;
  }

  window.diamondiqAuth = {
    getHeaders: getAuthHeaders,
    safeNextUrl,
    getToken: getStoredSessionToken,
    setToken: setStoredSessionToken
  };

  const SAVED_PREFS_KEY = 'diamondiq_saved_prefs';

  function loadSavedPrefs() {
    try {
      const raw = localStorage.getItem(SAVED_PREFS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function savePrefs(patch) {
    try {
      const cur = loadSavedPrefs();
      const next = { ...cur, ...patch };
      delete next.password;
      localStorage.setItem(SAVED_PREFS_KEY, JSON.stringify(next));
      return next;
    } catch {
      return {};
    }
  }

  async function api(url, options = {}) {
    const config = {
      credentials: 'same-origin',
      ...options,
      headers: getAuthHeaders(options.headers || {})
    };
    const res = await fetch(url, config);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || `Request failed (${res.status})`);
      err.status = res.status;
      throw err;
    }
    return data;
  }

  function showToast(message) {
    let el = document.getElementById('diamondiq-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'diamondiq-toast';
      el.className = 'toast';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add('is-visible');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.classList.remove('is-visible');
    }, 2800);
  }

  function setBanner(el, type, message) {
    if (!el) return;
    el.className = 'feedback-banner';
    if (!message) {
      el.textContent = '';
      return;
    }
    if (type === 'success') el.classList.add('is-success');
    else if (type === 'warning') el.classList.add('is-warning');
    else el.classList.add('is-error');
    el.textContent = message;
  }

  function getTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    const isDark = theme === 'dark';
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    try {
      localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    } catch {
      /* ignore */
    }
    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.setAttribute('aria-pressed', String(isDark));
      btn.innerHTML = isDark
        ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg><span>Day Mode</span>'
        : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg><span>Night Mode</span>';
    }
  }

  /* =========================================================
     Tactical Baseball Diamond & Analytics Diagrams (MLB Broadcast Vector Art)
     step = 0 (Setup), 1 (The Play), 2 (Key Rule / Result)
     ========================================================= */
  let svgUidCounter = 0;

  function renderBaseballMarkup(cx, cy, r = 8.5) {
    const k = r * 0.56;
    return `
      <g>
        <ellipse cx="${cx + 1.5}" cy="${cy + r + 1.5}" rx="${r * 0.85}" ry="${r * 0.35}" fill="rgba(0,0,0,0.42)"/>
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffff" stroke="#94a3b8" stroke-width="1"/>
        <circle cx="${cx - r * 0.25}" cy="${cy - r * 0.25}" r="${r * 0.35}" fill="rgba(255,255,255,0.9)"/>
        <path d="M ${cx - r * 0.45} ${cy - r * 0.78} Q ${cx - k * 0.15} ${cy} ${cx - r * 0.45} ${cy + r * 0.78}" fill="none" stroke="#dc2626" stroke-width="1.4" stroke-linecap="round"/>
        <path d="M ${cx + r * 0.45} ${cy - r * 0.78} Q ${cx + k * 0.15} ${cy} ${cx + r * 0.45} ${cy + r * 0.78}" fill="none" stroke="#dc2626" stroke-width="1.4" stroke-linecap="round"/>
      </g>`;
  }

  function renderFielderFigure(cx, cy, label, active = false) {
    const bodyCol = active ? '#0ea5e9' : '#334155';
    const helmetCol = active ? '#0284c7' : '#1e293b';
    const strokeCol = active ? '#e0f2fe' : '#94a3b8';
    return `
      <g transform="translate(${cx}, ${cy})">
        <ellipse cx="0" cy="8.5" rx="7.5" ry="3" fill="rgba(0,0,0,0.42)"/>
        ${active ? '<circle cx="0" cy="-1" r="13" fill="rgba(56,189,248,0.22)" stroke="#38bdf8" stroke-width="1.2"/>' : ''}
        <!-- Athletic Fielder Stance -->
        <path d="M -5 7 L -3 1 L 3 1 L 5 7" fill="none" stroke="#e2e8f0" stroke-width="2.1" stroke-linecap="round"/>
        <rect x="-5.5" y="-5" width="11" height="8" rx="3" fill="${bodyCol}" stroke="${strokeCol}" stroke-width="1"/>
        <!-- Glove on Side -->
        <circle cx="-6.8" cy="-1.5" r="2.6" fill="#92400e" stroke="#fbbf24" stroke-width="0.7"/>
        <!-- Cap & Visor -->
        <circle cx="0" cy="-8.5" r="3.8" fill="#fed7aa"/>
        <path d="M -4 -9 A 4 4 0 0 1 4 -9 Z" fill="${helmetCol}"/>
        <rect x="-2" y="-9.2" width="5.5" height="1.4" rx="0.6" fill="${helmetCol}"/>
        <!-- Label Chip -->
        <rect x="-9.5" y="9.5" width="19" height="10" rx="3" fill="rgba(10,18,32,0.88)" stroke="${active ? '#38bdf8' : 'rgba(255,255,255,0.25)'}" stroke-width="0.9"/>
        <text x="0" y="16.5" text-anchor="middle" font-size="6.8" font-weight="800" fill="${active ? '#7dd3fc' : '#f8fafc'}">${label}</text>
      </g>`;
  }

  function renderRunnerFigure(cx, cy, label = 'RUN') {
    return `
      <g transform="translate(${cx}, ${cy})">
        <ellipse cx="0" cy="8" rx="7" ry="2.6" fill="rgba(0,0,0,0.45)"/>
        <path d="M -4.5 7 L -1 1 L 4 6.5" fill="none" stroke="#fef08a" stroke-width="2.1" stroke-linecap="round"/>
        <rect x="-4.5" y="-5" width="9" height="7.5" rx="2.5" fill="#dc2626" stroke="#fecaca" stroke-width="1"/>
        <circle cx="0" cy="-8.2" r="3.6" fill="#fed7aa"/>
        <path d="M -4 -8.8 A 4 4 0 0 1 4 -8.8 Z" fill="#b91c1c"/>
        <rect x="-11" y="9" width="22" height="10" rx="3" fill="#b91c1c" stroke="#fecaca" stroke-width="0.8"/>
        <text x="0" y="16" text-anchor="middle" font-size="6.5" font-weight="800" fill="#ffffff">${label}</text>
      </g>`;
  }

  function renderDiagramSvg(diagram, step = 1) {
    if (!diagram) return '';
    const uid = ++svgUidCounter;

    if (diagram.mode === 'statcast-arc') {
      const showBarrel = step >= 1;
      const showNote = step === 2;
      return `
        <svg class="diamond-svg" viewBox="0 0 400 250" role="img" aria-label="${escapeHtml(diagram.callout)}">
          <defs>
            <linearGradient id="sky_${uid}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#06101e"/>
              <stop offset="58%" stop-color="#112848"/>
              <stop offset="100%" stop-color="#1d4a6e"/>
            </linearGradient>
            <linearGradient id="turf_${uid}" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#14532d"/>
              <stop offset="50%" stop-color="#22864a"/>
              <stop offset="100%" stop-color="#14532d"/>
            </linearGradient>
            <linearGradient id="cone_${uid}" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.42"/>
              <stop offset="100%" stop-color="#22c55e" stop-opacity="0.06"/>
            </linearGradient>
            <linearGradient id="hrGlow_${uid}" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#38bdf8"/>
              <stop offset="55%" stop-color="#22d3ee"/>
              <stop offset="100%" stop-color="#fbbf24"/>
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="400" height="250" rx="12" fill="url(#sky_${uid})"/>

          <!-- Stadium Light Towers & Upper Bleachers Behind Fence -->
          <line x1="348" y1="138" x2="348" y2="42" stroke="#64748b" stroke-width="3.2"/>
          <rect x="331" y="34" width="34" height="12" rx="2.5" fill="#e0f2fe" stroke="#93c5fd" stroke-width="1"/>
          <polygon points="318,168 398,128 398,210 318,210" fill="#17253e" stroke="#334155" stroke-width="1.2"/>
          <line x1="322" y1="175" x2="396" y2="140" stroke="rgba(148,163,184,0.28)" stroke-width="2"/>
          <line x1="322" y1="186" x2="396" y2="152" stroke="rgba(148,163,184,0.28)" stroke-width="2"/>
          <line x1="322" y1="197" x2="396" y2="164" stroke="rgba(148,163,184,0.28)" stroke-width="2"/>

          <!-- Mowed Turf & Dirt Batter's Box -->
          <rect x="0" y="206" width="400" height="44" fill="url(#turf_${uid})"/>
          <rect x="14" y="203" width="58" height="9" rx="3" fill="#b77b47"/>
          <line x1="12" y1="206" x2="392" y2="206" stroke="rgba(255,255,255,0.65)" stroke-width="1.5"/>

          <!-- Distance Yardage Markers -->
          <text x="150" y="222" text-anchor="middle" font-size="8.5" font-weight="700" fill="rgba(255,255,255,0.55)">200 FT</text>
          <text x="235" y="222" text-anchor="middle" font-size="8.5" font-weight="700" fill="rgba(255,255,255,0.55)">300 FT</text>

          <!-- Padded 400ft Outfield Wall -->
          <rect x="308" y="164" width="12" height="42" rx="2" fill="#1d4ed8" stroke="#93c5fd" stroke-width="1.2"/>
          <rect x="306" y="161" width="16" height="5" rx="2" fill="#facc15"/>
          <text x="314" y="224" text-anchor="middle" font-size="9" font-weight="800" fill="#fde68a">400 FT WALL</text>

          <!-- Batter Swinging at Home Plate -->
          <g transform="translate(36, 174)">
            <ellipse cx="4" cy="30" rx="14" ry="3.5" fill="rgba(0,0,0,0.45)"/>
            <path d="M 0 12 L -5 29 M 2 12 L 10 29" stroke="#e2e8f0" stroke-width="3.2" stroke-linecap="round"/>
            <rect x="-4" y="-1" width="9" height="15" rx="3" fill="#1d4ed8" stroke="#93c5fd" stroke-width="0.8"/>
            <circle cx="1" cy="-6" r="5" fill="#fed7aa"/>
            <path d="M -4 -7 A 5 5 0 0 1 6 -7 Z" fill="#0f172a"/>
            <line x1="5" y1="4" x2="27" y2="-11" stroke="#f59e0b" stroke-width="3.2" stroke-linecap="round"/>
          </g>

          <!-- Barrel Zone Cone & Flight Comparisons -->
          <polygon points="54,180 388,54 388,128" fill="url(#cone_${uid})"/>
          <path d="M 54 182 L 195 205" fill="none" stroke="rgba(251,191,36,0.75)" stroke-width="2" stroke-dasharray="4 4"/>
          <path d="M 54 180 Q 172 142 296 184" fill="none" stroke="rgba(226,232,240,0.8)" stroke-width="2" stroke-dasharray="4 4"/>
          <path d="M 54 180 Q 110 34 180 202" fill="none" stroke="rgba(248,113,113,0.78)" stroke-width="2" stroke-dasharray="4 4"/>
          ${
            showBarrel
              ? `<path class="svg-flow-arc" d="M 54 180 Q 198 22 372 142" fill="none" stroke="url(#hrGlow_${uid})" stroke-width="4.8" stroke-linecap="round"/>
                 <circle cx="372" cy="142" r="5" fill="#fbbf24"/>
                 <rect x="148" y="64" width="136" height="20" rx="4" fill="rgba(10,18,32,0.85)" stroke="#38bdf8" stroke-width="1"/>
                 <text x="216" y="78" text-anchor="middle" font-size="9.5" font-weight="800" fill="#7dd3fc">92 FT APEX · 416 FT HR!</text>`
              : ''
          }
          ${showBarrel ? renderBaseballMarkup(252, 88, 7.5) : renderBaseballMarkup(58, 178, 7.5)}
          <text x="145" y="54" text-anchor="start" font-size="9" font-weight="700" fill="#fca5a5">52° Pop-Up</text>
          <text x="278" y="160" text-anchor="end" font-size="9" font-weight="700" fill="#cbd5e1">14° Liner</text>
          <rect x="12" y="10" width="246" height="26" rx="6" fill="rgba(10,18,32,0.9)" stroke="#38bdf8" stroke-width="1.2"/>
          <text x="135" y="27" text-anchor="middle" font-size="10.2" font-weight="800" fill="#f8fafc">${showNote ? 'BARREL: 98+ MPH · 26°–30° · OVER WALL' : 'ELEVATED 26°–30° BARREL ZONE'}</text>
        </svg>`;
    }

    if (diagram.mode === 'framing-zone') {
      const ballY = step === 0 ? 172 : step === 1 ? 156 : 145;
      return `
        <svg class="diamond-svg" viewBox="0 0 400 250" role="img" aria-label="${escapeHtml(diagram.callout)}">
          <defs>
            <linearGradient id="fg_${uid}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#091526"/>
              <stop offset="66%" stop-color="#16324f"/>
              <stop offset="100%" stop-color="#6b4426"/>
            </linearGradient>
            <marker id="fArr_${uid}" markerWidth="7" markerHeight="7" refX="4" refY="3.5" orient="auto">
              <path d="M0,0 L7,3.5 L0,7 Z" fill="#38bdf8"/>
            </marker>
          </defs>
          <rect x="0" y="0" width="400" height="250" rx="12" fill="url(#fg_${uid})"/>
          <!-- Stadium Turf & Mound Distance -->
          <rect x="0" y="108" width="400" height="74" fill="#14532d" opacity="0.62"/>
          <ellipse cx="200" cy="118" rx="48" ry="10" fill="#9a6437" opacity="0.72"/>
          <circle cx="200" cy="100" r="3.5" fill="#e2e8f0" opacity="0.7"/>
          <rect x="196" y="104" width="8" height="12" rx="2" fill="#1d4ed8" opacity="0.7"/>

          <!-- Batter in Stance Left Box -->
          <g opacity="0.38" fill="#cbd5e1">
            <circle cx="88" cy="56" r="11"/>
            <path d="M 74 72 Q 88 68 102 74 L 106 135 L 96 196 L 84 196 L 85 138 L 72 196 L 62 196 Z"/>
            <line x1="98" y1="88" x2="128" y2="46" stroke="#f59e0b" stroke-width="5" stroke-linecap="round"/>
          </g>
          <!-- Chalk Boxes & Home Plate -->
          <rect x="42" y="196" width="90" height="42" fill="none" stroke="rgba(255,255,255,0.48)" stroke-width="2"/>
          <rect x="268" y="196" width="90" height="42" fill="none" stroke="rgba(255,255,255,0.48)" stroke-width="2"/>
          <polygon points="164,202 236,202 236,214 200,228 164,214" fill="#ffffff" stroke="#94a3b8" stroke-width="1.5"/>

          <!-- Stitched Rawhide Leather Catcher Mitt -->
          <g transform="translate(200, ${ballY + 8})">
            <ellipse cx="0" cy="2" rx="34" ry="27" fill="rgba(0,0,0,0.45)"/>
            <ellipse cx="0" cy="0" rx="31" ry="25" fill="#85451d" stroke="#f59e0b" stroke-width="2"/>
            <ellipse cx="-2" cy="-2" rx="18" ry="15" fill="#592a0e" stroke="#b45309" stroke-width="1.2"/>
            <path d="M -20 -9 Q 0 -22 20 -9" fill="none" stroke="#fbbf24" stroke-width="1.8" stroke-dasharray="3 2"/>
          </g>

          <!-- Shadow Border + 3x3 Glass Strike Zone -->
          <rect x="132" y="38" width="136" height="146" rx="10" fill="rgba(56,189,248,0.08)" stroke="#38bdf8" stroke-width="2" stroke-dasharray="6 4"/>
          <rect x="148" y="52" width="104" height="118" rx="4" fill="rgba(15,23,42,0.34)" stroke="#f8fafc" stroke-width="2.2"/>
          <line x1="183" y1="52" x2="183" y2="170" stroke="rgba(255,255,255,0.32)" stroke-width="1"/>
          <line x1="217" y1="52" x2="217" y2="170" stroke="rgba(255,255,255,0.32)" stroke-width="1"/>
          <line x1="148" y1="91" x2="252" y2="91" stroke="rgba(255,255,255,0.32)" stroke-width="1"/>
          <line x1="148" y1="130" x2="252" y2="130" stroke="rgba(255,255,255,0.32)" stroke-width="1"/>
          ${renderBaseballMarkup(200, ballY, 9)}
          ${step >= 1 ? `<path class="svg-flow-arc" d="M 200 176 L 200 138" stroke="#38bdf8" stroke-width="3.2" marker-end="url(#fArr_${uid})"/>` : ''}
          <rect x="65" y="10" width="270" height="22" rx="5" fill="rgba(10,18,32,0.9)" stroke="#38bdf8" stroke-width="1"/>
          <text x="200" y="25" text-anchor="middle" font-size="10.2" font-weight="800" fill="#f8fafc">${step === 2 ? 'HOLD QUIET TARGET IN SHADOW ZONE' : 'PULL BORDERLINE PITCH UP INTO ZONE'}</text>
        </svg>`;
    }

    if (diagram.mode === 'xwoba-scale') {
      const fillW = step === 0 ? 115 : step === 1 ? 202 : 272;
      const valText = step === 0 ? '.320' : step === 1 ? '.385' : '.650';
      return `
        <svg class="diamond-svg" viewBox="0 0 400 250" role="img" aria-label="${escapeHtml(diagram.callout)}">
          <defs>
            <linearGradient id="xw_${uid}" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#38bdf8"/>
              <stop offset="55%" stop-color="#fbbf24"/>
              <stop offset="100%" stop-color="#ef4444"/>
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="400" height="250" rx="12" fill="#0c1729"/>
          <rect x="14" y="14" width="372" height="222" rx="10" fill="#13223a" stroke="#2d4368" stroke-width="1.5"/>
          <text x="200" y="38" text-anchor="middle" font-size="13" font-weight="800" fill="#f8fafc">Same Barrel Contact · Different Fielder Luck</text>

          <!-- Left Mini Diamond: Lineout -->
          <rect x="28" y="48" width="164" height="68" rx="7" fill="#0d1829" stroke="#334155"/>
          <path d="M 110 108 L 80 76 Q 110 56 140 76 Z" fill="#14532d"/>
          <line class="svg-flow-arc" x1="110" y1="106" x2="96" y2="75" stroke="#f87171" stroke-width="2.2"/>
          <circle cx="96" cy="75" r="4" fill="#ef4444" stroke="#fff" stroke-width="1"/>
          <text x="110" y="64" text-anchor="middle" font-size="8.8" font-weight="800" fill="#fca5a5">SS LINEOUT · .000 AVG</text>
          <text x="110" y="112" text-anchor="middle" font-size="9.5" font-weight="700" fill="#38bdf8">105 mph · 16° → ${valText} xwOBA</text>

          <!-- Right Mini Diamond: Gap Double -->
          <rect x="208" y="48" width="164" height="68" rx="7" fill="#0d1829" stroke="#334155"/>
          <path d="M 290 108 L 260 76 Q 290 56 320 76 Z" fill="#14532d"/>
          <line class="svg-flow-arc" x1="290" y1="106" x2="314" y2="66" stroke="#4ade80" stroke-width="2.2"/>
          <circle cx="314" cy="66" r="4" fill="#22c55e" stroke="#fff" stroke-width="1"/>
          <text x="290" y="64" text-anchor="middle" font-size="8.8" font-weight="800" fill="#86efac">GAP DOUBLE · 1.000 AVG</text>
          <text x="290" y="112" text-anchor="middle" font-size="9.5" font-weight="700" fill="#38bdf8">105 mph · 16° → ${valText} xwOBA</text>

          <rect x="44" y="132" width="312" height="22" rx="11" fill="#091322" stroke="#2d4266"/>
          <rect x="44" y="132" width="${fillW}" height="22" rx="11" fill="url(#xw_${uid})"/>
          <circle cx="154" cy="143" r="6" fill="#0f1b2e" stroke="#f8fafc" stroke-width="2"/>
          <circle cx="240" cy="143" r="6" fill="#0f1b2e" stroke="#f8fafc" stroke-width="2"/>
          <circle cx="309" cy="143" r="6" fill="#0f1b2e" stroke="#f8fafc" stroke-width="2"/>
          <text x="154" y="172" text-anchor="middle" font-size="10.2" font-weight="700" fill="#cbd5e1">.320 Avg</text>
          <text x="240" y="172" text-anchor="middle" font-size="10.2" font-weight="700" fill="#fde68a">.370 Great</text>
          <text x="309" y="172" text-anchor="middle" font-size="10.2" font-weight="700" fill="#fca5a5">.400+ MVP</text>
          <rect x="38" y="186" width="324" height="34" rx="6" fill="rgba(10,18,32,0.92)" stroke="#38bdf8" stroke-width="1"/>
          <text x="200" y="207" text-anchor="middle" font-size="10.2" font-weight="700" fill="#f8fafc">Measures Contact Speed &amp; Angle — Zero Defense Luck</text>
        </svg>`;
    }

    // Broadcast Stadium Diamond ViewBox 400 x 250 with 3D Bleacher Wall + Realistic Fielder Silhouettes
    const coords = {
      HOME: [200, 214],
      '1B': [286, 138],
      '2B': [200, 68],
      '3B': [114, 138],
      P: [200, 144],
      SS: [152, 84],
      '2BF': [248, 84],
      '1BF': [274, 118],
      '3BF': [126, 118],
      LF: [80, 46],
      CF: [200, 30],
      RF: [320, 46]
    };

    const occupied = new Set(diagram.occupiedBases || []);
    const highlight = step === 0 ? '' : diagram.highlightBase || '';
    const fromPt = coords[diagram.throwFrom] || coords.SS;
    const toPt = coords[diagram.throwTo] || coords['2B'];

    const baseSquare = (name, cx, cy) => {
      const isOccupied = occupied.has(name);
      const isHighlight = highlight === name;
      const fill = isHighlight ? '#38bdf8' : isOccupied ? '#f87171' : '#ffffff';
      return `
        <g>
          ${isHighlight ? `<circle cx="${cx}" cy="${cy}" r="18" fill="rgba(56,189,248,0.28)" stroke="#38bdf8" stroke-width="2"/>` : ''}
          <rect x="${cx - 7.5}" y="${cy - 5.5}" width="16" height="16" rx="2" transform="rotate(45 ${cx} ${cy + 2})" fill="rgba(0,0,0,0.4)"/>
          <rect x="${cx - 8}" y="${cy - 8}" width="16" height="16" rx="2.5" transform="rotate(45 ${cx} ${cy})" fill="${fill}" stroke="#0f172a" stroke-width="1.8"/>
          ${isOccupied ? renderRunnerFigure(cx + (name === '1B' ? 14 : -14), cy - 16, 'RUN') : ''}
        </g>`;
    };

    const fieldersMarkup = `
      ${renderFielderFigure(coords.P[0], coords.P[1], 'P', false)}
      ${renderFielderFigure(coords['3BF'][0], coords['3BF'][1], '3B', false)}
      ${renderFielderFigure(coords['1BF'][0], coords['1BF'][1], '1B', false)}
      ${renderFielderFigure(coords['2BF'][0], coords['2BF'][1], '2B', diagram.mode === 'infield-force' || diagram.mode === 'steal-2b')}
      ${renderFielderFigure(coords.SS[0], coords.SS[1], 'SS', diagram.mode === 'infield-force' || diagram.mode === 'infield-fly' || diagram.mode === 'relay-throw')}
      ${renderFielderFigure(coords.LF[0], coords.LF[1], 'LF', diagram.mode === 'relay-throw')}
      ${renderFielderFigure(coords.CF[0], coords.CF[1], 'CF', diagram.mode === 'tag-up')}
      ${renderFielderFigure(coords.RF[0], coords.RF[1], 'RF', false)}
    `;

    let throwPath = '';
    if (step >= 1) {
      if (diagram.mode === 'relay-throw') {
        throwPath = `
          <path d="M ${coords.LF[0]} ${coords.LF[1]} Q 112 72 ${coords.SS[0]} ${coords.SS[1]}" fill="none" stroke="rgba(0,0,0,0.34)" stroke-width="5" transform="translate(0,4)"/>
          <path class="svg-flow-arc" d="M ${coords.LF[0]} ${coords.LF[1]} Q 112 62 ${coords.SS[0]} ${coords.SS[1]}" fill="none" stroke="#38bdf8" stroke-width="3"/>
          <path d="M ${coords.SS[0]} ${coords.SS[1]} Q 186 146 ${coords.HOME[0]} ${coords.HOME[1]}" fill="none" stroke="rgba(0,0,0,0.34)" stroke-width="5" transform="translate(0,4)"/>
          <path class="svg-flow-arc" d="M ${coords.SS[0]} ${coords.SS[1]} Q 186 136 ${coords.HOME[0]} ${coords.HOME[1]}" fill="none" stroke="#38bdf8" stroke-width="3" marker-end="url(#tArr_${uid})"/>
          <rect x="${coords.SS[0] - 13}" y="${coords.SS[1] - 24}" width="26" height="12" rx="3" fill="#0ea5e9" stroke="#e0f2fe" stroke-width="1"/>
          <text x="${coords.SS[0]}" y="${coords.SS[1] - 15}" text-anchor="middle" font-size="7.5" font-weight="800" fill="#ffffff">CUT</text>
          ${renderBaseballMarkup(coords.LF[0], coords.LF[1], 7)}`;
      } else {
        const mx = (fromPt[0] + toPt[0]) / 2 + (fromPt[0] < toPt[0] ? -12 : 12);
        const my = (fromPt[1] + toPt[1]) / 2 - 18;
        throwPath = `
          <path d="M ${fromPt[0]} ${fromPt[1]} Q ${mx} ${my + 8} ${toPt[0]} ${toPt[1]}" fill="none" stroke="rgba(0,0,0,0.3)" stroke-width="5"/>
          <path class="svg-flow-arc" d="M ${fromPt[0]} ${fromPt[1]} Q ${mx} ${my} ${toPt[0]} ${toPt[1]}" fill="none" stroke="#38bdf8" stroke-width="3" marker-end="url(#tArr_${uid})"/>
          ${renderBaseballMarkup(fromPt[0], fromPt[1], 6.5)}`;
      }
    }

    let runnerArrow = '';
    if (step >= 1) {
      if (diagram.mode === 'steal-2b' || diagram.mode === 'infield-force') {
        runnerArrow = `<path class="svg-flow-arc" d="M 274 128 Q 248 98 216 74" fill="none" stroke="#fde047" stroke-width="3" marker-end="url(#rArr_${uid})"/>`;
      } else if (diagram.mode === 'tag-up') {
        runnerArrow = `<path class="svg-flow-arc" d="M 122 146 Q 152 178 184 202" fill="none" stroke="#fde047" stroke-width="3" marker-end="url(#rArr_${uid})"/>`;
      }
    }

    const banner =
      step === 2
        ? `<rect x="14" y="218" width="372" height="24" rx="5" fill="rgba(10,18,32,0.92)" stroke="#38bdf8" stroke-width="1.2"/>
           <text x="200" y="234" text-anchor="middle" font-size="9.8" font-weight="800" fill="#f8fafc">${escapeHtml(diagram.callout.slice(0, 56))}</text>`
        : '';

    return `
      <svg class="diamond-svg" viewBox="0 0 400 250" role="img" aria-label="${escapeHtml(diagram.callout)}">
        <defs>
          <pattern id="mow_${uid}" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="11" height="22" fill="#175c35"/>
            <rect x="11" width="11" height="22" fill="#217846"/>
          </pattern>
          <radialGradient id="clay_${uid}" cx="50%" cy="55%" r="55%">
            <stop offset="0%" stop-color="#d4955c"/>
            <stop offset="100%" stop-color="#9e6231"/>
          </radialGradient>
          <marker id="tArr_${uid}" markerWidth="7" markerHeight="7" refX="4.5" refY="3.5" orient="auto">
            <path d="M0,0 L7,3.5 L0,7 Z" fill="#38bdf8"/>
          </marker>
          <marker id="rArr_${uid}" markerWidth="7" markerHeight="7" refX="4.5" refY="3.5" orient="auto">
            <path d="M0,0 L7,3.5 L0,7 Z" fill="#fde047"/>
          </marker>
        </defs>
        <!-- Stadium Bleacher Frame, Warning Track & Outfield Wall -->
        <rect x="0" y="0" width="400" height="250" rx="12" fill="#0b1727"/>
        <path d="M 4 56 Q 200 -34 396 56 L 396 250 L 4 250 Z" fill="#17253e"/>
        <path d="M 10 66 Q 200 -24 390 66 L 390 250 L 10 250 Z" fill="#8f532c"/>
        <path d="M 16 74 Q 200 -10 384 74 L 384 250 L 16 250 Z" fill="url(#mow_${uid})"/>
        <path d="M 10 66 Q 200 -24 390 66" fill="none" stroke="#1e40af" stroke-width="6"/>
        <path d="M 10 63 Q 200 -27 390 63" fill="none" stroke="#facc15" stroke-width="2"/>

        <!-- Infield Clay Apron & Cutout Grass -->
        <path d="M 54 140 Q 200 6 346 140 L 200 242 Z" fill="url(#clay_${uid})" stroke="rgba(255,255,255,0.28)" stroke-width="1.5"/>
        <polygon points="200,76 270,138 200,198 130,138" fill="url(#mow_${uid})"/>

        <!-- Chalk Foul Lines + Dugout Shelters -->
        <line x1="200" y1="214" x2="18" y2="68" stroke="rgba(255,255,255,0.8)" stroke-width="2.2"/>
        <line x1="200" y1="214" x2="382" y2="68" stroke="rgba(255,255,255,0.8)" stroke-width="2.2"/>
        <polygon points="72,172 102,196 95,206 65,182" fill="#0f172a" stroke="#64748b" stroke-width="1.2"/>
        <polygon points="328,172 298,196 305,206 335,182" fill="#0f172a" stroke="#64748b" stroke-width="1.2"/>

        <!-- Pitcher's Mound + Rubber -->
        <circle cx="200" cy="142" r="16" fill="url(#clay_${uid})" stroke="rgba(255,255,255,0.4)" stroke-width="1.1"/>
        <rect x="193" y="140.5" width="14" height="3.2" rx="1" fill="#ffffff"/>

        <!-- Home Plate Dirt Circle & Batter Boxes -->
        <circle cx="200" cy="212" r="22" fill="url(#clay_${uid})" stroke="rgba(255,255,255,0.32)" stroke-width="1"/>
        <rect x="180" y="204" width="10" height="17" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="1"/>
        <rect x="210" y="204" width="10" height="17" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="1"/>

        ${fieldersMarkup}
        ${throwPath}
        ${runnerArrow}
        ${baseSquare('2B', 200, 68)}
        ${baseSquare('1B', 286, 138)}
        ${baseSquare('3B', 114, 138)}
        <polygon points="192,208 208,208 208,215 200,222 192,215" fill="${highlight === 'HOME' ? '#38bdf8' : '#ffffff'}" stroke="#0f172a" stroke-width="1.6"/>
        <text x="309" y="142" font-size="11" font-weight="800" fill="#ffffff" style="paint-order:stroke;stroke:#0f172a;stroke-width:3px;">1B</text>
        <text x="200" y="50" text-anchor="middle" font-size="11" font-weight="800" fill="#ffffff" style="paint-order:stroke;stroke:#0f172a;stroke-width:3px;">2B</text>
        <text x="91" y="142" text-anchor="end" font-size="11" font-weight="800" fill="#ffffff" style="paint-order:stroke;stroke:#0f172a;stroke-width:3px;">3B</text>
        ${banner}
      </svg>`;
  }

  /* =========================================================
     Global Auth Nav Sync
     ========================================================= */
  async function syncAuthNav() {
    try {
      const data = await api('/api/auth/me');
      currentUser = data.user || null;
    } catch {
      currentUser = null;
    }

    const nav = document.getElementById('site-nav');
    if (nav) {
      const existingLogout = document.getElementById('nav-logout-btn');
      if (existingLogout) existingLogout.remove();
      const loginLink = nav.querySelector('a[href="login.html"]');

      if (currentUser) {
        if (loginLink) loginLink.style.display = 'none';
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'nav-logout-btn';
        btn.className = 'btn btn-ghost btn-sm';
        btn.textContent = `Log Out (${currentUser.username})`;
        btn.addEventListener('click', async () => {
          try {
            await api('/api/auth/logout', { method: 'POST' });
            setStoredSessionToken(null);
            currentUser = null;
            showToast('Logged out.');
            await syncAuthNav();
            if (document.getElementById('home')) await initHomePage();
            if (document.getElementById('library')) await initScenariosPage();
            if (document.getElementById('playbook')) await initPlaybookPage();
          } catch {
            /* ignore */
          }
        });
        nav.appendChild(btn);
      } else if (loginLink) {
        loginLink.style.display = '';
      }
    }
    return currentUser;
  }

  /* =========================================================
     Page 1: Home Dashboard
     ========================================================= */
  async function initHomePage() {
    if (!document.getElementById('home')) return;

    // 0. Gameday Studio mode switcher (Hit Lab vs Featured Play)
    const studioTabs = document.getElementById('studio-tabs');
    const panelHitlab = document.getElementById('studio-panel-hitlab');
    const panelPlay = document.getElementById('studio-panel-play');
    const setStudioMode = (mode) => {
      if (!panelHitlab || !panelPlay || !studioTabs) return;
      const isPlay = mode === 'play';
      panelHitlab.hidden = isPlay;
      panelPlay.hidden = !isPlay;
      studioTabs.querySelectorAll('[data-studio]').forEach((b) => {
        b.setAttribute('aria-pressed', String(b.dataset.studio === mode));
      });
    };
    if (studioTabs) {
      studioTabs.onclick = (e) => {
        const btn = e.target.closest('[data-studio]');
        if (!btn) return;
        setStudioMode(btn.dataset.studio);
      };
    }
    const heroHitBtn = document.getElementById('hero-open-hitlab');
    if (heroHitBtn) {
      heroHitBtn.onclick = () => setStudioMode('hitlab');
    }
    const heroPlayBtn = document.getElementById('hero-open-featured');
    if (heroPlayBtn) {
      heroPlayBtn.onclick = () => setStudioMode('play');
    }

    // 1. Live stats & fun facts
    try {
      const stats = await api('/api/stats');
      const countEl = document.getElementById('kpi-countdown');
      const masteredEl = document.getElementById('kpi-mastered');
      const savedNotesEl = document.getElementById('kpi-saved-notes');
      const savedSubEl = document.getElementById('kpi-saved-sub');

      if (countEl) countEl.textContent = `${stats.daysUntilOpeningDay}d`;
      if (masteredEl) masteredEl.textContent = `${stats.masteredCount} / ${stats.scenariosCount}`;
      if (savedNotesEl) savedNotesEl.textContent = String(stats.favoritesCount + stats.playbookCount);
      if (savedSubEl) {
        if (currentUser) {
          savedSubEl.textContent = `${stats.favoritesCount} saved · ${stats.playbookCount} notes`;
        } else {
          savedSubEl.innerHTML = '<a href="login.html">Log in</a> or <a href="register.html">Sign up</a> to save';
        }
      }

      const factTextEl = document.getElementById('fun-fact-text');
      const nextFactBtn = document.getElementById('next-fact-btn');
      if (factTextEl && nextFactBtn && Array.isArray(stats.facts) && stats.facts.length > 0) {
        let factIndex = 0;
        factTextEl.textContent = stats.facts[0];
        nextFactBtn.onclick = () => {
          factIndex = (factIndex + 1) % stats.facts.length;
          factTextEl.textContent = stats.facts[factIndex];
        };
      }
    } catch {
      /* ignore */
    }

    // 2. Featured play interactive stepper
    const stage = document.getElementById('home-diamond-stage');
    const stepBtnsWrap = document.getElementById('home-step-btns');
    const stepNote = document.getElementById('home-step-note');
    if (stage && stepBtnsWrap) {
      try {
        const { scenario } = await api('/api/scenarios/force-vs-tag');
        const notes = [
          'Setup: Runner on 1st base. Batter hits a sharp ground ball toward shortstop.',
          'The Play: Runner on 1st is forced to run to 2nd — fielder only needs to touch 2nd base.',
          scenario.keyRule
        ];
        const setStep = (idx) => {
          stage.innerHTML = renderDiagramSvg(scenario.diagram, idx);
          if (stepNote) stepNote.textContent = notes[idx] || notes[0];
          stepBtnsWrap.querySelectorAll('[data-step]').forEach((b) => {
            b.setAttribute('aria-pressed', String(Number(b.dataset.step) === idx));
          });
        };
        setStep(1);
        stepBtnsWrap.onclick = (e) => {
          const btn = e.target.closest('[data-step]');
          if (!btn) return;
          setStep(Number(btn.dataset.step));
        };
      } catch {
        /* ignore */
      }
    }

    // 3. Interactive MLB-Style Pitching + Mini PCI + HitTrax Stadium Simulator + 5 Real Bats
    const BATS = {
      'baum-gold': {
        id: 'baum-gold',
        name: 'Baum Bat Gold',
        shortLabel: 'Baum',
        meta: 'AAA Pro Maple Gold Edition · Slight End-Load · 2.505" Barrel',
        desc: 'High-gloss jet-black maple-composite finish with metallic gold Baum oval medallion, gold BBCOR .50 stamp, cupped black tip, and solid-wood crack.',
        construction: '1pc-wood',
        weightMod: 0.986,
        popMod: 0.976,
        cor: 0.456,
        moi: 1.08,
        sweetSpot: 0.85,
        taperSharpness: 1.48,
        launchLift: 0.0,
        soundType: 'wood',
        barrelColor: '#111318',
        barrelHi: '#343946',
        barrelLo: '#060709',
        taperColor: '#0e1014',
        handleColor: '#0a0b0e',
        accentColor: '#eab308',
        trimColor: '#d4af37',
        capColor: '#0a0b0e',
        capStyle: 'cupped'
      },
      'goods-2026': {
        id: 'goods-2026',
        name: '2026 DeMarini The Goods',
        shortLabel: 'GOODS',
        meta: '2-Piece Hybrid · Heavy End-Load · 2 5/8" Barrel',
        desc: 'Pale ice-blue X14 Alloy barrel paired with black 1375 composite handle, red arrow/stencil graphics, notched black Tremor end cap, and deep damped thud.',
        construction: '2pc',
        cuffColor: '#181a20',
        cuffTrim: '#334155',
        weightMod: 0.990,
        popMod: 1.048,
        cor: 0.518,
        moi: 1.13,
        sweetSpot: 0.96,
        taperSharpness: 1.12,
        launchLift: 1.5,
        soundType: 'hybrid',
        barrelColor: '#9beae4',
        barrelHi: '#d8faf7',
        barrelLo: '#61c9c1',
        taperColor: '#9beae4',
        handleColor: '#12141a',
        accentColor: '#ef4444',
        trimColor: '#181a20',
        capColor: '#0b0d12',
        capStyle: 'tremor'
      },
      'goods-2022': {
        id: 'goods-2022',
        name: '2022 DeMarini The Goods',
        shortLabel: 'The GOODS',
        meta: 'Half+Half Hybrid · Classic End-Load · 2 5/8" Barrel',
        desc: 'Brushed metallic chrome silver X14 Alloy barrel + matte black Paraflex composite handle with monochromatic black graphics and loud metallic ping-crack.',
        construction: '2pc',
        cuffColor: '#18191e',
        cuffTrim: '#334155',
        weightMod: 0.996,
        popMod: 1.036,
        cor: 0.510,
        moi: 1.09,
        sweetSpot: 0.98,
        taperSharpness: 1.08,
        launchLift: 1.2,
        soundType: 'hybrid',
        barrelColor: '#cbd5e1',
        barrelHi: '#f8fafc',
        barrelLo: '#7b8798',
        taperColor: '#b8c3d0',
        handleColor: '#14151a',
        accentColor: '#111827',
        trimColor: '#111827',
        capColor: '#0e1015',
        capStyle: 'dish'
      },
      'combat-rodeo': {
        id: 'combat-rodeo',
        name: 'Combat MFG Spec-A1 Rodeo',
        shortLabel: 'NOT MY FIRST RODEO!',
        meta: '1-Piece SFX Alloy · Balanced Whip · Crimson Grip',
        desc: 'Vintage buttercream barrel & taper, crimson-red perforated grip & flared pommel, western bronco art ("Not My First Rodeo!"), and loud Combat thwack.',
        construction: '1pc',
        weightMod: 1.026,
        popMod: 1.022,
        cor: 0.506,
        moi: 0.95,
        sweetSpot: 1.07,
        taperSharpness: 0.88,
        launchLift: 0.8,
        soundType: 'combat',
        barrelColor: '#f2e3be',
        barrelHi: '#fcf6e6',
        barrelLo: '#d4c193',
        taperColor: '#f2e3be',
        handleColor: '#f2e3be',
        gripColor: '#991b1b',
        accentColor: '#991b1b',
        trimColor: '#b45309',
        capColor: '#f2e3be',
        knobColor: '#88131d',
        capStyle: 'flared'
      },
      'combat-blue': {
        id: 'combat-blue',
        name: 'Combat Spec-A1 Members Club Blue',
        shortLabel: 'Members Only',
        meta: '1-Piece Country Club Alloy · Ultra-Balanced · Widest Sweet Spot',
        desc: 'Powder sky-blue 1-piece SFX barrel & handle with sky-blue grip, royal blue flared knob & end cap, gold pinstripes, and crisp alloy thwack.',
        construction: '1pc',
        weightMod: 1.032,
        popMod: 1.018,
        cor: 0.503,
        moi: 0.92,
        sweetSpot: 1.11,
        taperSharpness: 0.84,
        launchLift: 0.6,
        soundType: 'combat',
        barrelColor: '#87defb',
        barrelHi: '#d4f3fe',
        barrelLo: '#53bee8',
        taperColor: '#87defb',
        handleColor: '#87defb',
        gripColor: '#94e4fc',
        accentColor: '#1e3a8a',
        trimColor: '#d4af37',
        capColor: '#1e3a8a',
        knobColor: '#1e3a8a',
        capStyle: 'flared'
      }
    };

    const STADIUM_TIERS = {
      pro: ['fenway', 'dodger', 'oracle', 'wrigley', 'yankee'],
      college: ['omaha', 'lsu', 'missst', 'vandy', 'texas'],
      hs: ['hs-central', 'hs-oakridge', 'hs-coastal', 'hs-valley', 'hs-metro'],
      cage: ['cage']
    };

    const STADIUMS = {
      fenway: {
        id: 'fenway',
        tier: 'pro',
        shortName: 'Fenway Park',
        name: 'Fenway Park (Boston)',
        dimsLabel: 'Fenway Park · 310 LF · 390 CF · 302 RF',
        skyTop: '#071426',
        skyMid: '#132a4a',
        skyLow: '#24476e',
        wallColor: '#2d5a42',
        wallCap: '#facc15',
        subBanner: 'GREEN MONSTER · 37 FT',
        subBanner2: 'PESKY POLE · 302 FT',
        airDensity: 1.005,
        wallDist(phi) {
          return phi < 0
            ? 390 - Math.pow(Math.abs(phi) / 0.785, 1.35) * 80
            : 390 - Math.pow(phi / 0.785, 1.25) * 88;
        },
        wallHeight(phi) {
          return phi <= -0.25 ? 37 : phi <= 0.1 ? 17 : 5;
        }
      },
      dodger: {
        id: 'dodger',
        tier: 'pro',
        shortName: 'Dodger Stadium',
        name: 'Dodger Stadium (LA)',
        dimsLabel: 'Dodger Stadium · 330 LF · 395 CF · 330 RF',
        skyTop: '#0b1834',
        skyMid: '#233b6e',
        skyLow: '#6e4c6b',
        wallColor: '#005a9c',
        wallCap: '#facc15',
        subBanner: 'CHAVEZ RAVINE',
        subBanner2: '395 CENTER FIELD',
        airDensity: 0.985,
        wallDist(phi) {
          return 330 + Math.cos((phi / 0.785) * Math.PI * 0.5) * 65;
        },
        wallHeight() {
          return 8;
        }
      },
      oracle: {
        id: 'oracle',
        tier: 'pro',
        shortName: 'Oracle Park',
        name: 'Oracle Park (SF)',
        dimsLabel: 'Oracle Park · 339 LF · 399 CF · 309 RF',
        skyTop: '#071726',
        skyMid: '#13324a',
        skyLow: '#2c5b75',
        wallColor: '#0f2830',
        wallCap: '#f97316',
        subBanner: 'TRIPLES ALLEY · 421',
        subBanner2: 'MCCOVEY COVE · 24 FT',
        airDensity: 1.015,
        wallDist(phi) {
          if (phi < 0) return 339 + Math.cos((phi / 0.785) * Math.PI * 0.5) * 60;
          if (phi < 0.36) return 399 + Math.sin((phi / 0.36) * Math.PI) * 18;
          return 404 - ((phi - 0.36) / 0.425) * 95;
        },
        wallHeight(phi) {
          return phi >= 0.35 ? 24 : 8;
        }
      },
      wrigley: {
        id: 'wrigley',
        tier: 'pro',
        shortName: 'Wrigley Field',
        name: 'Wrigley Field (Chicago)',
        dimsLabel: 'Wrigley Field · 355 LF · 400 CF · 353 RF',
        skyTop: '#081b2c',
        skyMid: '#153959',
        skyLow: '#2d5c78',
        wallColor: '#14532d',
        wallCap: '#eab308',
        subBanner: 'FRIENDLY CONFINES',
        subBanner2: 'IVY BRICK · 11.5 FT',
        airDensity: 0.99,
        wallDist(phi) {
          return phi < 0
            ? 355 + Math.cos((phi / 0.785) * Math.PI * 0.5) * 45
            : 353 + Math.cos((phi / 0.785) * Math.PI * 0.5) * 47;
        },
        wallHeight() {
          return 11.5;
        }
      },
      yankee: {
        id: 'yankee',
        tier: 'pro',
        shortName: 'Yankee Stadium',
        name: 'Yankee Stadium (NY)',
        dimsLabel: 'Yankee Stadium · 318 LF · 408 CF · 314 RF',
        skyTop: '#061121',
        skyMid: '#122645',
        skyLow: '#21406b',
        wallColor: '#0d2240',
        wallCap: '#f8fafc',
        subBanner: 'BRONX · MONUMENT PARK',
        subBanner2: 'SHORT PORCH · 314 RF',
        airDensity: 1.002,
        wallDist(phi) {
          return phi < 0
            ? 318 + Math.cos((phi / 0.785) * Math.PI * 0.5) * 90
            : 314 + Math.cos((phi / 0.785) * Math.PI * 0.5) * 94;
        },
        wallHeight() {
          return 8;
        }
      },
      omaha: {
        id: 'omaha',
        tier: 'college',
        shortName: 'Omaha CWS',
        name: 'Charles Schwab Field (Omaha)',
        dimsLabel: 'Omaha CWS · 335 LF · 408 CF · 335 RF',
        skyTop: '#08182e',
        skyMid: '#153257',
        skyLow: '#2b557c',
        wallColor: '#0f3f2b',
        wallCap: '#fbbf24',
        subBanner: 'COLLEGE WORLD SERIES',
        subBanner2: 'OMAHA · NEBRASKA',
        airDensity: 0.965,
        wallDist(phi) {
          return 335 + Math.cos((phi / 0.785) * Math.PI * 0.5) * 73;
        },
        wallHeight() {
          return 8.5;
        }
      },
      lsu: {
        id: 'lsu',
        tier: 'college',
        shortName: 'LSU Alex Box',
        name: 'Alex Box Stadium (LSU)',
        dimsLabel: 'Alex Box (LSU) · 330 LF · 405 CF · 330 RF',
        skyTop: '#161130',
        skyMid: '#372357',
        skyLow: '#6e3b5c',
        wallColor: '#1a4a33',
        wallCap: '#facc15',
        subBanner: 'BATON ROUGE · SEC',
        subBanner2: 'INTIMIDATOR PILE',
        airDensity: 1.008,
        wallDist(phi) {
          return 330 + Math.cos((phi / 0.785) * Math.PI * 0.5) * 75;
        },
        wallHeight() {
          return 10;
        }
      },
      missst: {
        id: 'missst',
        tier: 'college',
        shortName: 'Miss St Noble',
        name: 'Dude Noble Field (Miss. State)',
        dimsLabel: 'Dude Noble (MSU) · 330 LF · 390 CF · 330 RF',
        skyTop: '#0b182c',
        skyMid: '#242947',
        skyLow: '#4f3b49',
        wallColor: '#5c1424',
        wallCap: '#e2e8f0',
        subBanner: 'LEFT FIELD LOUNGE',
        subBanner2: 'STARKVILLE · SEC',
        airDensity: 0.992,
        wallDist(phi) {
          return 330 + Math.cos((phi / 0.785) * Math.PI * 0.5) * 60;
        },
        wallHeight() {
          return 9;
        }
      },
      vandy: {
        id: 'vandy',
        tier: 'college',
        shortName: 'Vandy Hawkins',
        name: 'Hawkins Field (Vanderbilt)',
        dimsLabel: 'Hawkins Field · 310 LF · 400 CF · 330 RF',
        skyTop: '#0a1426',
        skyMid: '#1f2b42',
        skyLow: '#3a465c',
        wallColor: '#1c1917',
        wallCap: '#cfb87c',
        subBanner: 'NASHVILLE MONSTER · 35 FT',
        subBanner2: 'VANDERBILT · SEC',
        airDensity: 0.995,
        wallDist(phi) {
          return phi < 0
            ? 310 + Math.cos((phi / 0.785) * Math.PI * 0.5) * 90
            : 330 + Math.cos((phi / 0.785) * Math.PI * 0.5) * 70;
        },
        wallHeight(phi) {
          return phi <= -0.25 ? 35 : 8;
        }
      },
      texas: {
        id: 'texas',
        tier: 'college',
        shortName: 'Texas Disch-Falk',
        name: 'UFCU Disch-Falk (Texas)',
        dimsLabel: 'Disch-Falk · 340 LF · 400 CF · 325 RF',
        skyTop: '#161124',
        skyMid: '#3d243b',
        skyLow: '#6e3a32',
        wallColor: '#8c3b0b',
        wallCap: '#f8fafc',
        subBanner: 'AUSTIN · LONGHORNS',
        subBanner2: 'DISCH-FALK FIELD',
        airDensity: 0.982,
        wallDist(phi) {
          return phi < 0
            ? 340 + Math.cos((phi / 0.785) * Math.PI * 0.5) * 60
            : 325 + Math.cos((phi / 0.785) * Math.PI * 0.5) * 75;
        },
        wallHeight() {
          return 8;
        }
      },
      'hs-central': {
        id: 'hs-central',
        tier: 'hs',
        shortName: 'Central High',
        name: 'Central High Field',
        dimsLabel: 'Central High · 315 LF · 375 CF · 315 RF',
        skyTop: '#0b1e36',
        skyMid: '#1d456b',
        skyLow: '#3b739c',
        wallColor: '#1e3a5f',
        wallCap: '#facc15',
        subBanner: 'VARSITY DIAMOND',
        subBanner2: '375 CENTER',
        airDensity: 1.0,
        wallDist(phi) {
          return 315 + Math.cos((phi / 0.785) * Math.PI * 0.5) * 60;
        },
        wallHeight() {
          return 6;
        }
      },
      'hs-oakridge': {
        id: 'hs-oakridge',
        tier: 'hs',
        shortName: 'Oak Ridge Prep',
        name: 'Oak Ridge Prep Field',
        dimsLabel: 'Oak Ridge Prep · 310 LF · 370 CF · 310 RF',
        skyTop: '#0b2230',
        skyMid: '#1b4754',
        skyLow: '#3d746e',
        wallColor: '#14532d',
        wallCap: '#fbbf24',
        subBanner: 'OAK RIDGE PREP',
        subBanner2: '370 CENTER',
        airDensity: 0.995,
        wallDist(phi) {
          return 310 + Math.cos((phi / 0.785) * Math.PI * 0.5) * 60;
        },
        wallHeight() {
          return 6;
        }
      },
      'hs-coastal': {
        id: 'hs-coastal',
        tier: 'hs',
        shortName: 'Coastal Pines',
        name: 'Coastal Pines Complex',
        dimsLabel: 'Coastal Pines · 320 LF · 385 CF · 320 RF',
        skyTop: '#071c34',
        skyMid: '#124670',
        skyLow: '#35799e',
        wallColor: '#0369a1',
        wallCap: '#fde047',
        subBanner: 'COASTAL PINES',
        subBanner2: 'SHOWCASE FIELD',
        airDensity: 1.012,
        wallDist(phi) {
          return 320 + Math.cos((phi / 0.785) * Math.PI * 0.5) * 65;
        },
        wallHeight() {
          return 6;
        }
      },
      'hs-valley': {
        id: 'hs-valley',
        tier: 'hs',
        shortName: 'Valley View',
        name: 'Valley View HS Diamond',
        dimsLabel: 'Valley View · 305 LF · 365 CF · 305 RF',
        skyTop: '#14152e',
        skyMid: '#3b2954',
        skyLow: '#70445e',
        wallColor: '#7c2d12',
        wallCap: '#fbbf24',
        subBanner: 'HIGH DESERT',
        subBanner2: '365 CENTER',
        airDensity: 0.955,
        wallDist(phi) {
          return 305 + Math.cos((phi / 0.785) * Math.PI * 0.5) * 60;
        },
        wallHeight() {
          return 6;
        }
      },
      'hs-metro': {
        id: 'hs-metro',
        tier: 'hs',
        shortName: 'Metro Varsity',
        name: 'Metro Varsity Park',
        dimsLabel: 'Metro Varsity · 312 LF · 378 CF · 312 RF',
        skyTop: '#091529',
        skyMid: '#193159',
        skyLow: '#2e5185',
        wallColor: '#312e81',
        wallCap: '#f8fafc',
        subBanner: 'METRO VARSITY',
        subBanner2: '378 CENTER',
        airDensity: 1.0,
        wallDist(phi) {
          return 312 + Math.cos((phi / 0.785) * Math.PI * 0.5) * 66;
        },
        wallHeight() {
          return 6;
        }
      },
      cage: {
        id: 'cage',
        tier: 'cage',
        shortName: 'D1 Rapsodo Lab',
        name: 'D1 Rapsodo Lab',
        dimsLabel: 'D1 Rapsodo Lab · 400 FT Simulated',
        skyTop: '#070d18',
        skyMid: '#0e1b2f',
        skyLow: '#142742',
        wallColor: '#1e3a5f',
        wallCap: '#fbbf24',
        airDensity: 1.0,
        wallDist() {
          return 400;
        },
        wallHeight() {
          return 28;
        }
      }
    };

    const PITCH_TYPES = {
      fastball: {
        name: '4-Seam Fastball',
        mphMin: 91,
        mphMax: 95,
        rpmMin: 2260,
        rpmMax: 2490,
        spinAxisClock: '12:45',
        spinAxisDeg: 22,
        spinEff: 94,
        ivbIn: 17.2,
        hbIn: 8.4,
        magX: 4.5,
        magY: 16.4
      },
      slider: {
        name: 'Sharp Slider',
        mphMin: 82,
        mphMax: 86,
        rpmMin: 2440,
        rpmMax: 2740,
        spinAxisClock: '9:30',
        spinAxisDeg: 285,
        spinEff: 48,
        ivbIn: 2.1,
        hbIn: -12.4,
        magX: -14.8,
        magY: 2.4
      },
      curve: {
        name: '12-6 Curveball',
        mphMin: 74,
        mphMax: 78,
        rpmMin: 2520,
        rpmMax: 2860,
        spinAxisClock: '6:30',
        spinAxisDeg: 195,
        spinEff: 86,
        ivbIn: -12.8,
        hbIn: -4.6,
        magX: -4.4,
        magY: -12.0
      },
      changeup: {
        name: 'Fade Changeup',
        mphMin: 79,
        mphMax: 83,
        rpmMin: 1640,
        rpmMax: 1890,
        spinAxisClock: '2:15',
        spinAxisDeg: 68,
        spinEff: 90,
        ivbIn: 6.2,
        hbIn: 14.4,
        magX: 11.8,
        magY: 5.5
      }
    };

    const cageCanvas = document.getElementById('cage-canvas');
    const sprayCanvas = document.getElementById('hittrax-spray-canvas');
    const rapsodoViewTabs = document.getElementById('rapsodo-view-tabs');
    const batRack = document.getElementById('bat-rack');
    const stadiumTierTabs = document.getElementById('stadium-tier-tabs');
    const stadiumTabs = document.getElementById('stadium-tabs');
    const deliveryTabs = document.getElementById('delivery-tabs');
    const pitchTabs = document.getElementById('pitch-tabs');
    const windTabs = document.getElementById('wind-tabs');
    const batterHandTabs = document.getElementById('batter-hand-tabs');
    const pitcherHandTabs = document.getElementById('pitcher-hand-tabs');
    const cameraTabs = document.getElementById('camera-tabs');
    const swingBtn = document.getElementById('cage-swing-btn');
    const demoBtn = document.getElementById('cage-demo-btn');
    const pciModeBtn = document.getElementById('cage-pci-mode-btn');
    const soundBtn = document.getElementById('cage-sound-btn');
    const pitchNote = document.getElementById('cage-pitch-note');
    const evEl = document.getElementById('hitlab-ev');
    const laEl = document.getElementById('hitlab-la');
    const distEl = document.getElementById('hitlab-dist');
    const apexEl = document.getElementById('hitlab-apex');
    const spinEl = document.getElementById('hitlab-spin');
    const outEl = document.getElementById('hitlab-outcome');
    const rapBatSpeedEl = document.getElementById('rapsodo-batspeed');
    const rapSmashEl = document.getElementById('rapsodo-smash');
    const rapAttackEl = document.getElementById('rapsodo-attack');
    const rapBreakEl = document.getElementById('rapsodo-break');
    const rapAxisEl = document.getElementById('rapsodo-axis');
    const rapCarryEl = document.getElementById('rapsodo-carry');
    const batSpecMeta = document.getElementById('bat-spec-meta');
    const batSpecName = document.getElementById('bat-spec-name');
    const batSpecDesc = document.getElementById('bat-spec-desc');
    const batPreviewSvg = document.getElementById('bat-preview-svg');
    const sprayLabel = document.getElementById('spray-stadium-label');
    const sessionPill = document.getElementById('session-count-pill');
    const sprayClearBtn = document.getElementById('spray-clear-btn');
    const countReadout = document.getElementById('count-readout');

    const testBatSoundBtn = document.getElementById('test-bat-sound-btn');

    function renderBatSvg(bat) {
      const isWood = bat.id === 'baum-gold';
      const isGoods26 = bat.id === 'goods-2026';
      const isGoods22 = bat.id === 'goods-2022';
      const isRodeo = bat.id === 'combat-rodeo';
      const isBlue = bat.id === 'combat-blue';

      const cuff =
        bat.construction === '2pc'
          ? `<rect x="128" y="12.6" width="16" height="18.8" rx="2.5" fill="${bat.cuffColor}" stroke="${bat.cuffTrim}" stroke-width="1.3"/>
             <line x1="136" y1="13" x2="136" y2="31" stroke="rgba(255,255,255,0.22)" stroke-width="1"/>`
          : '';

      const woodCrest = isWood
        ? `<ellipse cx="164" cy="22" rx="26" ry="6.2" fill="url(#goldOval)" stroke="#ca8a04" stroke-width="0.9"/>
           <text x="164" y="24.8" text-anchor="middle" font-family="Georgia,serif" font-size="8.5" font-weight="800" fill="#111318">Baum</text>
           <rect x="218" y="19" width="14" height="6" rx="1" fill="none" stroke="#d4af37" stroke-width="0.9"/>
           <text x="225" y="23.8" text-anchor="middle" font-size="4.6" font-weight="700" fill="#eab308">.50</text>`
        : '';

      const gripBase = bat.gripColor || bat.handleColor;
      const gripWrap = isRodeo
        ? `<rect x="22" y="16.8" width="82" height="10.4" rx="2" fill="#991b1b"/>
           <path d="M 28 17 L 36 27 M 40 17 L 48 27 M 52 17 L 60 27 M 64 17 L 72 27 M 76 17 L 84 27 M 88 17 L 96 27" stroke="rgba(254,226,226,0.4)" stroke-width="1.3"/>
           <rect x="100" y="16.4" width="6" height="11.2" rx="1" fill="#dc2626"/>`
        : isBlue
          ? `<rect x="22" y="16.8" width="82" height="10.4" rx="2" fill="#9be7fd"/>
             <path d="M 28 17 L 36 27 M 40 17 L 48 27 M 52 17 L 60 27 M 64 17 L 72 27 M 76 17 L 84 27 M 88 17 L 96 27" stroke="rgba(255,255,255,0.55)" stroke-width="1.3"/>`
          : `<rect x="22" y="16.8" width="82" height="10.4" rx="2" fill="#111318"/>
             <path d="M 28 17 L 35 27 M 40 17 L 47 27 M 52 17 L 59 27 M 64 17 L 71 27 M 76 17 L 83 27 M 88 17 L 95 27" stroke="rgba(255,255,255,0.22)" stroke-width="1.5"/>`;

      const barrelDetails = isGoods26
        ? `<polygon points="222,10.5 236,10.5 242,14.5 236,18.5 222,18.5 228,14.5" fill="#ef4444"/>
           <polygon points="262,25.5 278,25.5 284,29.5 278,33.5 262,33.5 268,29.5" fill="#ef4444"/>
           <polygon points="288,25.5 304,25.5 310,29.5 304,33.5 288,33.5 294,29.5" fill="#ef4444"/>
           <rect x="164" y="18" width="12" height="8" rx="1.5" fill="#1e293b"/>`
        : isGoods22
          ? `<circle cx="290" cy="22" r="7.5" fill="#111827"/>
             <rect x="176" y="18.5" width="16" height="7" rx="1" fill="none" stroke="#111827" stroke-width="1.1"/>
             <text x="184" y="23.8" text-anchor="middle" font-size="5" font-weight="800" fill="#111827">.50</text>`
          : isRodeo
            ? `<rect x="158" y="18.5" width="12" height="6.5" rx="1" fill="none" stroke="#991b1b" stroke-width="0.9"/>
               <circle cx="192" cy="22" r="4.5" fill="none" stroke="#b45309" stroke-width="1.1"/>`
            : isBlue
              ? `<rect x="160" y="9.8" width="2" height="24.4" fill="#d4af37"/>
                 <rect x="163" y="9.8" width="1.8" height="24.4" fill="#1e3a8a"/>
                 <rect x="316" y="9.8" width="2" height="24.4" fill="#d4af37"/>
                 <rect x="319" y="9.8" width="2" height="24.4" fill="#1e3a8a"/>
                 <polygon points="292,15 304,15 306,22 298,28 290,22" fill="#1e3a8a" stroke="#eab308" stroke-width="1.1"/>`
              : '';

      const capMarkup =
        bat.capStyle === 'tremor' || bat.capStyle === 'dish'
          ? `<path d="M 323 10 L 335 12.2 L 335 31.8 L 323 34 Z" fill="${bat.capColor}"/><line x1="330" y1="13" x2="330" y2="31" stroke="#334155" stroke-width="1.8" stroke-dasharray="2.5 2"/>`
          : bat.capStyle === 'flared'
            ? `<rect x="323" y="9.5" width="9.5" height="25" rx="3.5" fill="${bat.capColor}" stroke="${isBlue ? '#172554' : 'rgba(0,0,0,0.16)'}" stroke-width="1"/>`
            : `<rect x="323" y="10" width="9" height="24" rx="3" fill="${bat.barrelColor}"/><ellipse cx="331" cy="22" rx="2.2" ry="8.5" fill="#1e1b18"/>`;

      const textFill = isWood ? 'transparent' : isGoods26 ? '#181a20' : isRodeo ? '#991b1b' : isBlue ? '#1e3a8a' : '#111827';
      const knobFill = bat.knobColor || '#0f1218';

      return `
        <svg viewBox="0 0 344 44" role="img" aria-label="${escapeHtml(bat.name)}">
          <defs>
            <linearGradient id="bsvg_${bat.id}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="${bat.barrelLo}"/>
              <stop offset="16%" stop-color="${bat.barrelColor}"/>
              <stop offset="36%" stop-color="${bat.barrelHi}"/>
              <stop offset="68%" stop-color="${bat.barrelColor}"/>
              <stop offset="100%" stop-color="${bat.barrelLo}"/>
            </linearGradient>
            <linearGradient id="goldOval" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#ca8a04"/>
              <stop offset="50%" stop-color="#fef08a"/>
              <stop offset="100%" stop-color="#eab308"/>
            </linearGradient>
          </defs>
          <ellipse cx="176" cy="39" rx="154" ry="3.5" fill="rgba(0,0,0,0.45)"/>
          <ellipse cx="18" cy="22" rx="6.2" ry="9.8" fill="${knobFill}" stroke="rgba(255,255,255,0.28)" stroke-width="1"/>
          <rect x="22" y="17" width="112" height="10" rx="2" fill="${bat.handleColor}"/>
          ${gripWrap}
          <polygon points="104,17 162,10 162,34 104,27" fill="${bat.taperColor}"/>
          <rect x="160" y="9.5" width="166" height="25" rx="4.5" fill="url(#bsvg_${bat.id})"/>
          <line x1="166" y1="14.5" x2="320" y2="14.5" stroke="rgba(255,255,255,${isGoods22 ? '0.68' : isWood ? '0.45' : '0.42'})" stroke-width="1.6" stroke-linecap="round"/>
          ${barrelDetails}
          ${woodCrest}
          ${cuff}
          ${capMarkup}
          ${isWood ? '' : `<text x="242" y="25.2" text-anchor="middle" font-size="${isRodeo ? '7.2' : '8.8'}" font-weight="800" font-style="${isBlue ? 'italic' : 'normal'}" font-family="${isBlue ? 'Georgia,serif' : 'sans-serif'}" letter-spacing="${isRodeo ? '0.4' : '1.0'}" fill="${textFill}" opacity="0.95">${bat.shortLabel}</text>`}
        </svg>`;
    }

    if (cageCanvas) {
      const hudCanvas = document.getElementById('pci-hud-canvas');
      const hctx = hudCanvas ? hudCanvas.getContext('2d') : null;
      const LOG_W = 800;
      const LOG_H = 450;

      const WIND_PRESETS = {
        calm: { label: 'Calm 0 mph', vx: 0, vy: 0 },
        out10: { label: '10 mph Out to CF', vx: 0, vy: 14.67 },
        in12: { label: '12 mph In from CF', vx: 0, vy: -17.6 },
        cross8: { label: '8 mph L->R Cross', vx: 11.73, vy: 2.0 }
      };

      const urlParams = new URLSearchParams(window.location.search);
      const urlBat = urlParams.get('bat');
      const savedUserPrefs = (currentUser && currentUser.preferences) || loadSavedPrefs();
      let activeBatId =
        urlBat && BATS[urlBat]
          ? urlBat
          : savedUserPrefs.defaultBat && BATS[savedUserPrefs.defaultBat]
            ? savedUserPrefs.defaultBat
            : 'goods-2026';
      let activeStadiumId =
        savedUserPrefs.preferredStadium && STADIUMS[savedUserPrefs.preferredStadium]
          ? savedUserPrefs.preferredStadium
          : 'omaha';
      let activeStadiumTier = (STADIUMS[activeStadiumId] && STADIUMS[activeStadiumId].tier) || 'college';
      let activeTelemetryView = 'spray'; // 'spray' | 'arc' | 'zone'
      let selectedPitchType = 'mix';
      let activeWindId = 'calm';
      let batterHand = savedUserPrefs.battingHand === 'L' ? 'L' : 'R'; // 'R' | 'L'
      let pitcherHand = 'R'; // 'R' | 'L'
      let activeDeliveryMode = 'pitcher'; // 'pitcher' | 'machine'
      let activeCameraMode = 'pov';
      let autoPciMode = false;
      let soundOn = true;
      let audioCtx = null;
      let cageEngaged = false;
      let engine3D = null;
      let sizeObserver = null;

      if (batRack) {
        batRack.querySelectorAll('[data-bat]').forEach((b) => {
          b.setAttribute('aria-pressed', String(b.dataset.bat === activeBatId));
        });
      }
      if (batterHandTabs) {
        batterHandTabs.querySelectorAll('[data-bhand]').forEach((b) => {
          b.setAttribute('aria-pressed', String(b.dataset.bhand === batterHand));
        });
      }

      // Session / Rapsodo Game State
      const session = {
        balls: 0,
        strikes: 0,
        outs: 0,
        hits: 0,
        hrs: 0,
        sprays: [],
        lastHit: null,
        lastPitch: null
      };

      // Mini PCI in normalized strike-zone coords: x in [-1.5..1.5], y in [-1.5..1.5]
      // y < 0 = TOP of strike zone (screen up), y > 0 = BOTTOM of strike zone (screen down)
      const pci = {
        x: 0,
        y: 0.14,
        targetX: 0,
        targetY: 0.14
      };

      const keysDown = new Set();

      // Animation State Machine: 'idle' | 'windup' | 'pitch' | 'flight'
      const sim = {
        phase: 'idle',
        t: 0,
        lastTs: 0,
        camT: 0,
        rapAnimT: 1,
        rapZoneAnimT: 1,
        pitch: null,
        pitchPos: null,
        pciLiveX: 0,
        pciLiveY: 0.14,
        deliveryMode: activeDeliveryMode,
        umpCall: '',
        umpCallTimer: 0,
        finishStyle: 'two-hand',
        swingTriggered: false,
        swingPressT: null,
        swingT: 0,
        swingAngle: -0.42,
        swingTargetX: 0,
        swingTargetY: 2.65,
        followThroughTimer: 0,
        contactResolved: false,
        flashTimer: 0,
        flashColor: '#38bdf8',
        impactBurstId: 0,
        impactPos: null,
        windVec: { x: 0, y: 0 },
        calloutText: '',
        calloutSub: '',
        calloutTimer: 0,
        demoAutoSwing: false,
        flight: null,
        flightCur: null,
        flightPoints: null,
        flightMaxIdx: 0,
        flightColor: '#38bdf8',
        flightFair: true
      };

      function sync3DSize() {
        if (!engine3D || !cageCanvas) return;
        const w = Math.max(320, cageCanvas.clientWidth || LOG_W);
        const h = Math.max(180, cageCanvas.clientHeight || LOG_H);
        engine3D.resize(w, h);
      }

      function tryInit3D() {
        if (engine3D || typeof window.createStadium3DEngine !== 'function') return;
        try {
          engine3D = window.createStadium3DEngine(cageCanvas, BATS, STADIUMS);
          engine3D.setStadium(activeStadiumId);
          engine3D.setBat(activeBatId);
          engine3D.setBatterHand(batterHand);
          engine3D.setPitcherHand(pitcherHand);
          if (engine3D.setDeliveryMode) engine3D.setDeliveryMode(activeDeliveryMode);
          engine3D.setCameraMode(activeCameraMode);
          sync3DSize();
          if (typeof ResizeObserver === 'function' && !sizeObserver) {
            sizeObserver = new ResizeObserver(sync3DSize);
            sizeObserver.observe(cageCanvas);
          } else {
            window.addEventListener('resize', sync3DSize);
          }
        } catch (err) {
          console.error('3D stadium init failed:', err);
          if (pitchNote) {
            pitchNote.textContent = '3D WebGL viewport could not start on this browser GPU; 2D Rapsodo spray & HUD remain active.';
          }
        }
      }
      tryInit3D();
      if (!engine3D) {
        window.addEventListener('diamondiq-3d-ready', tryInit3D, { once: true });
      }

      let noiseBuffer = null;
      let masterBus = null;
      let cageConvolver = null;
      let stadiumConvolver = null;
      let cageWetGain = null;
      let stadiumWetGain = null;
      const batSoundCache = {};

      // Deterministic smooth PRNG so each synthesized PCM transient & acoustic IR is crisp and artifact-free
      function makeSeededRand(seed) {
        let s = seed | 0;
        return () => {
          s = (s * 1664525 + 1013904223) | 0;
          return ((s >>> 0) / 4294967296) * 2 - 1;
        };
      }

      function buildAcousticIR(ctx, kind) {
        const sr = ctx.sampleRate;
        const isCage = kind === 'cage';
        const dur = isCage ? 0.42 : 1.45;
        const len = Math.floor(sr * dur);
        const ir = ctx.createBuffer(2, len, sr);
        const rnd = makeSeededRand(isCage ? 3107 : 7411);

        // Realistic physical room/park reflections:
        // Cage: side padding/netting (9ms, 19ms), arched ceiling trusses (31ms, 52ms), far target tarp (110ms)
        // Outdoor Stadium: plate dirt & backstop wall (18ms, 39ms), dugouts (68ms, 92ms), concrete seating bowl (148ms, 235ms), scoreboard slapback (345ms)
        const taps = isCage
          ? [
              [0.009, 0.28, -0.35],
              [0.019, 0.24, 0.4],
              [0.031, 0.20, 0.0],
              [0.054, 0.14, -0.25],
              [0.088, 0.09, 0.25],
              [0.142, 0.05, 0.0]
            ]
          : [
              [0.018, 0.22, -0.15],
              [0.039, 0.20, 0.28],
              [0.068, 0.18, -0.55],
              [0.094, 0.16, 0.55],
              [0.152, 0.14, -0.35],
              [0.238, 0.11, 0.38],
              [0.345, 0.08, 0.0]
            ];

        for (let c = 0; c < 2; c++) {
          const d = ir.getChannelData(c);
          let lp = 0;
          let lp2 = 0;
          const tailDecay = isCage ? 9.5 : 3.2;
          const tailAmp = isCage ? 0.11 : 0.16;
          for (let i = 0; i < len; i++) {
            const t = i / sr;
            const n = rnd();
            // Air absorption warm lowpass filter on diffuse tail
            lp = lp * (isCage ? 0.72 : 0.86) + n * (isCage ? 0.28 : 0.14);
            lp2 = lp2 * 0.82 + lp * 0.18;
            const env = Math.exp(-t * tailDecay) * (1 - Math.exp(-t * 140));
            d[i] = lp2 * env * tailAmp;
          }
          taps.forEach(([sec, amp, pan]) => {
            const idx = Math.floor(sec * sr);
            const panGain = c === 0 ? Math.max(0.25, 1 - pan * 0.5) : Math.max(0.25, 1 + pan * 0.5);
            if (idx > 2 && idx + 24 < len) {
              for (let k = 0; k < 20; k++) {
                d[idx + k] += amp * panGain * Math.exp(-k * 0.28) * (k === 0 ? 1 : 0.45 * rnd());
              }
            }
          });
        }
        return ir;
      }

      function ensureAudioBus() {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        if (!audioCtx) audioCtx = new Ctx();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        if (!masterBus) {
          const comp = audioCtx.createDynamicsCompressor();
          comp.threshold.value = -5;
          comp.knee.value = 10;
          comp.ratio.value = 4.2;
          comp.attack.value = 0.001;
          comp.release.value = 0.16;
          const master = audioCtx.createGain();
          master.gain.value = 0.94;
          comp.connect(master);
          master.connect(audioCtx.destination);
          masterBus = comp;

          cageConvolver = audioCtx.createConvolver();
          cageConvolver.buffer = buildAcousticIR(audioCtx, 'cage');
          cageWetGain = audioCtx.createGain();
          cageWetGain.gain.value = 0.46;
          cageConvolver.connect(cageWetGain);
          cageWetGain.connect(masterBus);

          stadiumConvolver = audioCtx.createConvolver();
          stadiumConvolver.buffer = buildAcousticIR(audioCtx, 'stadium');
          stadiumWetGain = audioCtx.createGain();
          stadiumWetGain.gain.value = 0.56;
          stadiumConvolver.connect(stadiumWetGain);
          stadiumWetGain.connect(masterBus);
        }
        if (!noiseBuffer) {
          const len = Math.floor(audioCtx.sampleRate * 1.4);
          noiseBuffer = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
          const data = noiseBuffer.getChannelData(0);
          let b0 = 0;
          for (let i = 0; i < len; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.85 * b0 + white * 0.25;
            data[i] = Math.max(-1, Math.min(1, b0));
          }
        }
        return audioCtx;
      }

      // Physical Baseball Acoustic PCM Synthesis:
      // Real Hertzian compression shockwave + band-shaped wood/alloy crack transient + damped barrel shell resonances
      function getBatImpactBuffer(ctx, kind, barrelFactor) {
        const sweetBucket = barrelFactor < 0.62 ? 'jam' : 'sweet';
        const key = `${kind}:${sweetBucket}`;
        if (batSoundCache[key]) return batSoundCache[key];

        const sr = ctx.sampleRate;
        const durSec =
          kind === 'combat-rodeo' || kind === 'combat-blue'
            ? 0.46
            : kind === 'goods-2022'
              ? 0.24
              : kind === 'goods-2026'
                ? 0.14
                : 0.075;
        const len = Math.floor(sr * durSec);
        const buf = ctx.createBuffer(1, len, sr);
        const ch = buf.getChannelData(0);
        const rnd = makeSeededRand(kind.length * 9137 + (sweetBucket === 'sweet' ? 42 : 99));

        const isOffCenter = barrelFactor < 0.62;
        const fScale = isOffCenter ? 0.86 : 1.0;

        let lpFast = 0;
        let lpMid = 0;
        let lpSlow = 0;
        let bpState = 0;

        for (let i = 0; i < len; i++) {
          const t = i / sr;
          // 1. Sub-millisecond Hertzian cowhide-on-barrel asymmetric pressure N-wave
          let hertz = 0;
          if (t < 0.00085) {
            const u = t / 0.00085;
            hertz = Math.sin(u * Math.PI) * 1.15 - (u > 0.45 ? 0.35 * Math.sin(((u - 0.45) / 0.55) * Math.PI) : 0);
          }

          // 2. Multi-band leather & grain crack (shaped around 1.2kHz–3.8kHz, free of white static hiss)
          const rawN = rnd();
          lpFast = lpFast * 0.36 + rawN * 0.64;
          lpMid = lpMid * 0.72 + lpFast * 0.28;
          lpSlow = lpSlow * 0.89 + lpMid * 0.11;
          bpState = bpState * 0.58 + (lpFast - lpMid) * 0.42;
          const crackSnap = (lpFast - lpSlow) * Math.exp(-t * 280) + bpState * Math.exp(-t * 175);

          let sample = 0;
          if (kind === 'baum-gold' || kind === 'wood') {
            // 1. Baum Bat Gold (-3) AAA Pro Maple Composite:
            // Authentic MLB broadcast dry wood shotgun CRACK! Ultra-tight 18-32ms impulse, crisp fibrous wood body, ZERO hollow "tok" sine.
            const attack = 1 - Math.exp(-t * 6800);
            const transient = crackSnap * 1.65 + (lpMid - lpSlow) * Math.exp(-t * 135) * 0.82;
            const impactBody = Math.sin(2 * Math.PI * (245 + 135 * Math.exp(-t * 320)) * t) * Math.exp(-t * 145) * 0.34;
            const mapleSnap1 = Math.sin(2 * Math.PI * (790 * fScale) * t) * Math.exp(-t * 210) * 0.18;
            const mapleSnap2 = Math.sin(2 * Math.PI * (1620 * fScale) * t) * Math.exp(-t * 265) * 0.14;
            const woodGrain = Math.sin(2 * Math.PI * (2520 * fScale) * t) * Math.exp(-t * 310) * 0.09;
            sample = (hertz * 0.96 + transient + impactBody + mapleSnap1 + mapleSnap2 + woodGrain) * attack;
          } else if (kind === 'goods-2026') {
            // 2. 2026 DeMarini The Goods (-3) — Thick-Wall X14 Alloy Barrel + Composite Handle:
            // Heavy, authoritative college BBCOR THWACK-KLACK (~115ms) — deep leather crunch + tightly damped solid X14 shell modes.
            const attack = 1 - Math.exp(-t * 5800);
            const leatherCrunch = crackSnap * 1.38 + (lpMid - lpSlow) * Math.exp(-t * 120) * 0.65;
            const barrelKick = Math.sin(2 * Math.PI * (285 + 165 * Math.exp(-t * 240)) * t) * Math.exp(-t * 95) * 0.42;
            const x14a = Math.sin(2 * Math.PI * (1115 * fScale) * t) * Math.exp(-t * 52) * 0.24;
            const x14b = Math.sin(2 * Math.PI * (1122 * fScale) * t) * Math.exp(-t * 55) * 0.14;
            const x14c = Math.sin(2 * Math.PI * (1685 * fScale) * t) * Math.exp(-t * 62) * 0.22;
            const x14d = Math.sin(2 * Math.PI * (2320 * fScale) * t) * Math.exp(-t * 78) * 0.14;
            sample = (hertz * 0.94 + leatherCrunch + barrelKick + x14a + x14b + x14c + x14d) * attack;
          } else if (kind === 'goods-2022' || kind === 'hybrid') {
            // 3. 2022 DeMarini The Goods (-3): Brushed chrome X14 alloy heavy crack + ~210ms controlled alloy ring
            const attack = 1 - Math.exp(-t * 5400);
            const crack = crackSnap * 1.15 + (lpMid - lpSlow) * Math.exp(-t * 115) * 0.48;
            const kick = Math.sin(2 * Math.PI * (270 + 150 * Math.exp(-t * 220)) * t) * Math.exp(-t * 82) * 0.36;
            const m1a = Math.sin(2 * Math.PI * (1240 * fScale) * t) * Math.exp(-t * 22) * 0.26;
            const m1b = Math.sin(2 * Math.PI * (1247 * fScale) * t) * Math.exp(-t * 24) * 0.15;
            const m2 = Math.sin(2 * Math.PI * (1890 * fScale) * t) * Math.exp(-t * 15) * 0.32;
            const m3 = Math.sin(2 * Math.PI * (2590 * fScale) * t) * Math.exp(-t * 24) * 0.17;
            sample = (hertz * 0.9 + crack + kick + m1a + m1b + m2 + m3) * attack;
          } else {
            // 4 & 5. Combat Spec-A1 Rodeo & Members Club Blue: Thin-wall 1-piece SFX Alloy "KRRACK-PINGGG!"
            const base = kind === 'combat-blue' ? 1.045 : 1.0;
            const attack = 1 - Math.exp(-t * 5600);
            const crack = crackSnap * 1.12 + (lpMid - lpSlow) * Math.exp(-t * 125) * 0.44;
            const kick = Math.sin(2 * Math.PI * (260 + 145 * Math.exp(-t * 215)) * t) * Math.exp(-t * 80) * 0.32;
            const r1 = Math.sin(2 * Math.PI * (1375 * base * fScale) * t) * Math.exp(-t * 15) * 0.22;
            const r2a = Math.sin(2 * Math.PI * (2145 * base * fScale) * t) * Math.exp(-t * 7.6) * 0.44;
            const r2b = Math.sin(2 * Math.PI * (2152 * base * fScale) * t) * Math.exp(-t * 8.0) * 0.3;
            const r3 = Math.sin(2 * Math.PI * (3060 * base * fScale) * t) * Math.exp(-t * 11.5) * 0.2;
            sample = (hertz * 0.9 + crack + kick + r1 + r2a + r2b + r3) * attack;
          }

          if (isOffCenter) {
            // Stung off-end/hands buzz
            sample += Math.sin(2 * Math.PI * 172 * t) * Math.exp(-t * 36) * 0.18;
          }
          ch[i] = sample;
        }

        // Normalize cleanly to 0.86 peak amplitude — zero hard clipping!
        let peak = 0;
        for (let i = 0; i < len; i++) {
          const a = Math.abs(ch[i]);
          if (a > peak) peak = a;
        }
        const norm = peak > 0 ? 0.86 / peak : 1;
        for (let i = 0; i < len; i++) ch[i] *= norm;

        batSoundCache[key] = buf;
        return buf;
      }

      function spawnNoiseBurst(ctx, dest, startTime, dur, filterType, freqStart, freqEnd, q, gainPeak) {
        const src = ctx.createBufferSource();
        src.buffer = noiseBuffer;
        src.loop = true;
        const filt = ctx.createBiquadFilter();
        filt.type = filterType;
        filt.Q.value = q;
        filt.frequency.setValueAtTime(freqStart, startTime);
        if (freqEnd !== freqStart) {
          filt.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), startTime + dur);
        }
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, startTime);
        g.gain.linearRampToValueAtTime(gainPeak, startTime + Math.min(0.002, dur * 0.15));
        g.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);
        src.connect(filt);
        filt.connect(g);
        g.connect(dest);
        src.start(startTime);
        src.stop(startTime + dur + 0.02);
      }

      function spawnModalTone(ctx, dest, startTime, dur, type, freqStart, freqEnd, gainPeak) {
        const osc = ctx.createOscillator();
        osc.type = type;
        osc.frequency.setValueAtTime(freqStart, startTime);
        if (freqEnd !== freqStart) {
          osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqEnd), startTime + dur);
        }
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, startTime);
        g.gain.linearRampToValueAtTime(gainPeak, startTime + 0.0015);
        g.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);
        osc.connect(g);
        g.connect(dest);
        osc.start(startTime);
        osc.stop(startTime + dur + 0.02);
      }

      function playBatAudio(kind, barrelFactor = 0.85, isHr = false, stadiumId = activeStadiumId, forcePlay = false) {
        if (!soundOn && !forcePlay) return;
        try {
          const ctx = ensureAudioBus();
          if (!ctx || !masterBus) return;
          const now = ctx.currentTime;
          const power = Math.max(0.55, Math.min(1.08, 0.62 + barrelFactor * 0.44));
          const convolver = stadiumId === 'cage' ? cageConvolver : stadiumConvolver;

          if (kind === 'whiff') {
            spawnNoiseBurst(ctx, masterBus, now, 0.115, 'bandpass', 320, 820, 1.6, 0.24);
            spawnNoiseBurst(ctx, masterBus, now + 0.09, 0.032, 'bandpass', 1050, 420, 1.1, 0.34);
            spawnModalTone(ctx, masterBus, now + 0.09, 0.048, 'triangle', 148, 60, 0.28);
            return;
          }

          if (kind === 'mitt') {
            spawnNoiseBurst(ctx, masterBus, now, 0.026, 'bandpass', 1180, 460, 1.2, 0.44);
            spawnModalTone(ctx, masterBus, now, 0.048, 'triangle', 152, 56, 0.38);
            if (convolver) spawnNoiseBurst(ctx, convolver, now, 0.026, 'bandpass', 950, 400, 1.0, 0.22);
            return;
          }

          if (kind === 'wall') {
            spawnNoiseBurst(ctx, masterBus, now, 0.055, 'bandpass', 420, 130, 1.0, 0.56);
            spawnModalTone(ctx, masterBus, now, 0.09, 'triangle', 112, 42, 0.5);
            if (convolver) spawnModalTone(ctx, convolver, now, 0.08, 'triangle', 110, 44, 0.34);
            return;
          }

          if (kind === 'net') {
            // Soft braided-nylon batting cage mesh catch & flutter (zero metal ping!)
            spawnNoiseBurst(ctx, masterBus, now, 0.068, 'bandpass', 620, 210, 0.9, 0.48);
            spawnModalTone(ctx, masterBus, now, 0.055, 'triangle', 145, 58, 0.32);
            if (cageConvolver) spawnNoiseBurst(ctx, cageConvolver, now, 0.06, 'bandpass', 520, 220, 0.9, 0.28);
            return;
          }

          if (kind === 'seat') {
            // Authentic MLB The Show molded stadium seat CLACK + aluminum bracket ping + stadium echo!
            spawnNoiseBurst(ctx, masterBus, now, 0.034, 'bandpass', 1650, 480, 1.2, 0.54);
            spawnModalTone(ctx, masterBus, now, 0.065, 'triangle', 320, 135, 0.42);
            spawnModalTone(ctx, masterBus, now, 0.11, 'sine', 1480, 1440, 0.22);
            spawnModalTone(ctx, masterBus, now, 0.09, 'sine', 2240, 2190, 0.14);
            if (convolver) {
              spawnNoiseBurst(ctx, convolver, now, 0.036, 'bandpass', 1350, 460, 1.1, 0.45);
              spawnModalTone(ctx, convolver, now, 0.11, 'sine', 1480, 1440, 0.2);
            }
            return;
          }

          if (kind === 'concrete') {
            // Masonry bleacher step / aisle bounce
            spawnNoiseBurst(ctx, masterBus, now, 0.038, 'bandpass', 780, 240, 1.1, 0.46);
            spawnModalTone(ctx, masterBus, now, 0.06, 'triangle', 190, 68, 0.4);
            if (convolver) spawnNoiseBurst(ctx, convolver, now, 0.04, 'bandpass', 700, 250, 1.0, 0.38);
            return;
          }

          const buf = getBatImpactBuffer(ctx, kind, barrelFactor);
          const src = ctx.createBufferSource();
          src.buffer = buf;
          src.playbackRate.value = 0.985 + Math.random() * 0.03;

          const hitGain = ctx.createGain();
          hitGain.gain.value = power;
          src.connect(hitGain);
          hitGain.connect(masterBus);
          if (convolver) hitGain.connect(convolver);
          src.start(now);
        } catch {
          /* ignore */
        }
      }

      if (testBatSoundBtn) {
        testBatSoundBtn.onclick = () => {
          cageEngaged = true;
          playBatAudio(activeBatId, 0.94, false, activeStadiumId, true);
          testBatSoundBtn.classList.remove('is-ringing');
          void testBatSoundBtn.offsetWidth;
          testBatSoundBtn.classList.add('is-ringing');
          setTimeout(() => {
            testBatSoundBtn.classList.remove('is-ringing');
          }, 520);
        };
      }

      function updateBatDom() {
        const bat = BATS[activeBatId] || BATS['goods-2026'];
        if (batSpecMeta) batSpecMeta.textContent = bat.meta;
        if (batSpecName) batSpecName.textContent = bat.name;
        if (batSpecDesc) batSpecDesc.textContent = bat.desc;
        if (batPreviewSvg) batPreviewSvg.innerHTML = renderBatSvg(bat);
        if (engine3D) engine3D.setBat(activeBatId);
      }

      function popStatReadouts() {
        [evEl, laEl, distEl, apexEl, spinEl, outEl].forEach((el) => {
          if (!el) return;
          el.classList.remove('is-popped');
          void el.offsetWidth;
          el.classList.add('is-popped');
        });
      }

      function animateStatText(el, fromVal, toVal, formatter, duration = 460) {
        if (!el || toVal == null || Number.isNaN(toVal)) return;
        const start = performance.now();
        const step = (now) => {
          const u = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - u, 3);
          const cur = fromVal + (toVal - fromVal) * eased;
          el.textContent = formatter(cur, u >= 1);
          if (u < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }

      function updateSessionDom(hitInfo = null) {
        if (hitInfo) {
          if (evEl) {
            if (hitInfo.exitVelo != null) animateStatText(evEl, 0, Number(hitInfo.exitVelo), (v, done) => `${done ? hitInfo.exitVelo : v.toFixed(1)} mph`);
            else evEl.textContent = '-- mph';
          }
          if (laEl) {
            if (hitInfo.launchAngle != null) animateStatText(laEl, 0, Number(hitInfo.launchAngle), (v, done) => `${done ? hitInfo.launchAngle : Math.round(v)}°`);
            else laEl.textContent = '--°';
          }
          if (distEl) {
            if (hitInfo.dist != null) animateStatText(distEl, 0, Number(hitInfo.dist), (v, done) => `${done ? hitInfo.dist : Math.round(v)} ft`);
            else distEl.textContent = '-- ft';
          }
          if (apexEl) {
            if (hitInfo.apex != null && hitInfo.hangTime != null) {
              animateStatText(apexEl, 0, Number(hitInfo.apex), (v, done) => `${done ? hitInfo.apex : Math.round(v)} ft · ${hitInfo.hangTime}s`);
            } else {
              apexEl.textContent = hitInfo.apex != null ? `${hitInfo.apex} ft` : '-- ft';
            }
          }
          if (spinEl) {
            if (hitInfo.backspinRpm != null) {
              animateStatText(spinEl, 0, Number(hitInfo.backspinRpm), (v, done) => {
                const n = done ? hitInfo.backspinRpm : Math.round(v);
                return `${n >= 0 ? '+' : ''}${n} rpm`;
              });
            } else {
              spinEl.textContent = '-- rpm';
            }
          }
          if (outEl) {
            outEl.textContent = hitInfo.outcome || 'Step In Box';
            outEl.style.color = hitInfo.color || 'var(--accent)';
          }
          if (rapBatSpeedEl) rapBatSpeedEl.textContent = hitInfo.batSpeed != null ? `${hitInfo.batSpeed} mph` : '-- mph';
          if (rapSmashEl) rapSmashEl.textContent = hitInfo.smashFactor != null ? `${hitInfo.smashFactor}` : '--';
          if (rapAttackEl) rapAttackEl.textContent = hitInfo.attackAngle != null ? `${hitInfo.attackAngle > 0 ? '+' : ''}${hitInfo.attackAngle}°` : '--°';
          if (rapBreakEl) {
            const p = hitInfo.pitchMeta || session.lastPitch;
            rapBreakEl.textContent = p ? `${p.ivbIn > 0 ? '+' : ''}${p.ivbIn}" / ${p.hbIn > 0 ? '+' : ''}${p.hbIn}"` : '-- / --';
          }
          if (rapAxisEl) {
            const p = hitInfo.pitchMeta || session.lastPitch;
            rapAxisEl.textContent = hitInfo.battedSpinAxis
              ? `${hitInfo.battedSpinAxis} · ${hitInfo.spinEff || 92}%`
              : p
                ? `${p.spinAxisClock} · ${p.spinEff}%`
                : '-- · --%';
          }
          if (rapCarryEl) {
            rapCarryEl.textContent = hitInfo.carryDist != null
              ? `${hitInfo.carryDist} ft · ${hitInfo.xba || '.---'}`
              : '-- ft · .---';
          }
          popStatReadouts();
        }
        if (sessionPill) sessionPill.textContent = `${session.hrs} HR · ${session.hits} Hits`;
        if (countReadout) countReadout.textContent = `Count: ${session.balls}-${session.strikes} · Outs: ${session.outs}`;
        drawTelemetryCanvas();
      }

      function drawSprayChart() {
        drawTelemetryCanvas();
      }

      function drawTelemetryCanvas() {
        if (!sprayCanvas) return;
        const sctx = sprayCanvas.getContext('2d');
        const w = sprayCanvas.width;
        const h = sprayCanvas.height;
        const st = STADIUMS[activeStadiumId] || STADIUMS.omaha;
        if (sprayLabel) sprayLabel.textContent = `${st.dimsLabel} · ${pitcherHand}HP v ${batterHand}HB`;

        sctx.clearRect(0, 0, w, h);
        sctx.fillStyle = '#091322';
        sctx.fillRect(0, 0, w, h);

        const inFlight = sim.phase === 'flight' && sim.flight;
        const revAnim = Math.min(1, sim.rapAnimT || 0);
        const zoneAnim = Math.min(1, sim.rapZoneAnimT || 0);

        if (activeTelemetryView === 'arc') {
          // VIEW 2: Live Animated Rapsodo Side-View Height vs Distance Flight Arc
          const fl = inFlight ? sim.flight : session.lastHit;
          const padL = 34;
          const padR = 14;
          const padT = 22;
          const padB = 26;
          const plotW = w - padL - padR;
          const plotH = h - padT - padB;
          const maxX = 460;
          const maxZ = Math.max(125, fl ? Math.ceil((fl.apex + 20) / 25) * 25 : 140);

          sctx.strokeStyle = 'rgba(255,255,255,0.1)';
          sctx.lineWidth = 1;
          [100, 200, 300, 400].forEach((ft) => {
            const gx = padL + (ft / maxX) * plotW;
            sctx.beginPath();
            sctx.moveTo(gx, padT);
            sctx.lineTo(gx, padT + plotH);
            sctx.stroke();
            sctx.fillStyle = '#94a3b8';
            sctx.font = '600 9px "IBM Plex Mono", monospace';
            sctx.textAlign = 'center';
            sctx.fillText(`${ft}`, gx, h - 8);
          });
          [50, 100].forEach((ftZ) => {
            if (ftZ > maxZ) return;
            const gy = padT + plotH - (ftZ / maxZ) * plotH;
            sctx.beginPath();
            sctx.moveTo(padL, gy);
            sctx.lineTo(padL + plotW, gy);
            sctx.stroke();
            sctx.fillStyle = '#94a3b8';
            sctx.font = '600 9px "IBM Plex Mono", monospace';
            sctx.textAlign = 'right';
            sctx.fillText(`${ftZ}ft`, padL - 4, gy + 3);
          });

          sctx.strokeStyle = 'rgba(74, 222, 128, 0.55)';
          sctx.lineWidth = 1.6;
          sctx.beginPath();
          sctx.moveTo(padL, padT + plotH);
          sctx.lineTo(padL + plotW, padT + plotH);
          sctx.stroke();

          const wallPhi = fl ? Math.max(-0.785, Math.min(0.785, (fl.sprayDeg * Math.PI) / 180)) : 0;
          const wallDist = st.wallDist(wallPhi);
          const wallH = st.wallHeight(wallPhi);
          const wx = padL + (wallDist / maxX) * plotW;
          const whPx = (wallH / maxZ) * plotH;
          sctx.fillStyle = st.wallCap;
          sctx.fillRect(wx - 2, padT + plotH - Math.max(8, whPx), 4, Math.max(8, whPx));
          sctx.fillStyle = '#fde68a';
          sctx.font = '600 8.5px "IBM Plex Mono", monospace';
          sctx.textAlign = 'center';
          sctx.fillText(`WALL ${Math.round(wallDist)}`, wx, padT + plotH - Math.max(12, whPx + 4));

          if (fl && Array.isArray(fl.points) && fl.points.length > 1) {
            const drawMaxIdx = inFlight
              ? Math.max(1, sim.flightMaxIdx || 1)
              : Math.max(1, Math.floor((0.25 + revAnim * 0.75) * (fl.points.length - 1)));
            sctx.beginPath();
            let lastPx = padL;
            let lastPy = padT + plotH;
            for (let idx = 0; idx <= Math.min(drawMaxIdx, fl.points.length - 1); idx++) {
              const pt = fl.points[idx];
              const dist = Math.hypot(pt.x, pt.y);
              lastPx = padL + Math.min(1, dist / maxX) * plotW;
              lastPy = padT + plotH - Math.min(1, pt.z / maxZ) * plotH;
              if (idx === 0) sctx.moveTo(lastPx, lastPy);
              else sctx.lineTo(lastPx, lastPy);
            }
            sctx.strokeStyle = fl.color || '#38bdf8';
            sctx.lineWidth = 2.6;
            sctx.stroke();

            // Live Moving Baseball Tracer Dot
            sctx.fillStyle = '#f8fafc';
            sctx.beginPath();
            sctx.arc(lastPx, lastPy, 4.0, 0, Math.PI * 2);
            sctx.fill();
            sctx.strokeStyle = fl.color || '#38bdf8';
            sctx.lineWidth = 1.6;
            sctx.stroke();

            if (!inFlight || fl.playTime >= (fl.apexTime || 99)) {
              const apexDist = Math.hypot(fl.apexPos.x, fl.apexPos.y);
              const ax = padL + Math.min(1, apexDist / maxX) * plotW;
              const ay = padT + plotH - Math.min(1, fl.apexPos.z / maxZ) * plotH;
              sctx.fillStyle = '#fde047';
              sctx.beginPath();
              sctx.arc(ax, ay, 3.6, 0, Math.PI * 2);
              sctx.fill();
              if (!inFlight) {
                sctx.font = '700 9.5px "IBM Plex Mono", monospace';
                sctx.textAlign = 'left';
                sctx.fillText(`APEX ${fl.apex}ft`, Math.min(w - 76, ax + 6), Math.max(padT + 10, ay - 4));
              }
            }

            sctx.fillStyle = '#e2e8f0';
            sctx.font = '600 10px "IBM Plex Mono", monospace';
            sctx.textAlign = 'left';
            if (inFlight) {
              const cur = sim.flightCur || fl.points[0];
              const liveDist = Math.round(Math.hypot(cur.x, cur.y));
              sctx.fillText(`LIVE FLIGHT · ${liveDist}ft · H ${Math.round(cur.z)}ft`, padL, 14);
            } else {
              sctx.fillText(`LA ${fl.launchAngle}° · CARRY ${fl.carryDist}ft · TOTAL ${fl.dist}ft`, padL, 14);
            }
          } else {
            sctx.fillStyle = '#94a3b8';
            sctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
            sctx.textAlign = 'center';
            sctx.fillText('Make contact to plot full Rapsodo side flight arc & wall clearance', w / 2, h / 2);
          }
          return;
        }

        if (activeTelemetryView === 'zone') {
          // VIEW 3: Live Animated Rapsodo Strike Zone Break Comet + Sweeping Spin Axis Clock Dial
          const zx = 22;
          const zy = 32;
          const zw = 112;
          const zh = 148;
          sctx.strokeStyle = 'rgba(248, 250, 252, 0.72)';
          sctx.lineWidth = 1.6;
          sctx.strokeRect(zx, zy, zw, zh);
          sctx.strokeStyle = 'rgba(248, 250, 252, 0.2)';
          sctx.lineWidth = 1;
          for (let g = 1; g <= 2; g++) {
            sctx.beginPath();
            sctx.moveTo(zx + (zw * g) / 3, zy);
            sctx.lineTo(zx + (zw * g) / 3, zy + zh);
            sctx.stroke();
            sctx.beginPath();
            sctx.moveTo(zx, zy + (zh * g) / 3);
            sctx.lineTo(zx + zw, zy + (zh * g) / 3);
            sctx.stroke();
          }

          sctx.fillStyle = '#94a3b8';
          sctx.font = '600 9.5px "IBM Plex Mono", monospace';
          sctx.textAlign = 'center';
          sctx.fillText(`STRIKE ZONE · ${pitcherHand}HP`, zx + zw / 2, 18);

          const lp = session.lastPitch;
          const zProg = sim.phase === 'pitch' ? Math.min(1, sim.t) : zoneAnim;
          if (lp) {
            const ppx = zx + zw / 2 + lp.endX * (zw * 0.44);
            const ppy = zy + zh / 2 + lp.endY * (zh * 0.44);
            const sx = ppx - (lp.hbIn / 20) * 26;
            const sy = ppy + (lp.ivbIn / 20) * 24;
            const curX = sx + (ppx - sx) * zProg;
            const curY = sy + (ppy - sy) * zProg;

            sctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
            sctx.lineWidth = 2.2;
            sctx.beginPath();
            sctx.moveTo(sx, sy);
            sctx.lineTo(curX, curY);
            sctx.stroke();

            sctx.fillStyle = '#f8fafc';
            sctx.beginPath();
            sctx.arc(curX, curY, 5.2, 0, Math.PI * 2);
            sctx.fill();
            sctx.strokeStyle = '#ef4444';
            sctx.lineWidth = 1.4;
            sctx.stroke();
          }

          // Right Side: Circular Rapsodo Spin Axis Clock Dial with Sweeping Needle + RPM Gauge Arc
          const cx = w - 92;
          const cy = h / 2 + 8;
          const cr = 54;
          sctx.fillStyle = '#94a3b8';
          sctx.font = '600 9.5px "IBM Plex Mono", monospace';
          sctx.textAlign = 'center';
          sctx.fillText('SPIN AXIS CLOCK', cx, 18);

          sctx.beginPath();
          sctx.arc(cx, cy, cr, 0, Math.PI * 2);
          sctx.fillStyle = 'rgba(15, 29, 52, 0.9)';
          sctx.fill();
          sctx.strokeStyle = 'rgba(56, 189, 248, 0.32)';
          sctx.lineWidth = 1.8;
          sctx.stroke();

          [12, 3, 6, 9].forEach((hr) => {
            const ang = (hr / 12) * Math.PI * 2 - Math.PI / 2;
            sctx.fillStyle = '#cbd5e1';
            sctx.font = '700 9px "IBM Plex Mono", monospace';
            sctx.fillText(String(hr), cx + Math.cos(ang) * (cr - 10), cy + Math.sin(ang) * (cr - 10) + 3);
          });

          if (lp) {
            const rpmRatio = Math.min(1, (lp.pitchRpm || 2200) / 3000) * zProg;
            sctx.strokeStyle = '#22c55e';
            sctx.lineWidth = 2.6;
            sctx.beginPath();
            sctx.arc(cx, cy, cr + 4, -Math.PI / 2, -Math.PI / 2 + rpmRatio * Math.PI * 2);
            sctx.stroke();

            const targetRad = ((lp.spinAxisDeg || 20) * Math.PI) / 180 - Math.PI / 2;
            const startRad = -Math.PI / 2;
            const sweepRad = startRad + (targetRad - startRad) * (1 - Math.pow(1 - zProg, 2));
            sctx.strokeStyle = '#38bdf8';
            sctx.lineWidth = 3;
            sctx.beginPath();
            sctx.moveTo(cx, cy);
            sctx.lineTo(cx + Math.cos(sweepRad) * (cr - 18), cy + Math.sin(sweepRad) * (cr - 18));
            sctx.stroke();
            sctx.fillStyle = '#fde047';
            sctx.beginPath();
            sctx.arc(cx, cy, 4, 0, Math.PI * 2);
            sctx.fill();

            sctx.fillStyle = '#f8fafc';
            sctx.font = '700 10px "IBM Plex Mono", monospace';
            sctx.fillText(`${lp.pitchRpm} RPM · ${lp.spinAxisClock}`, cx, h - 10);
            sctx.textAlign = 'left';
            sctx.fillText(`IVB ${lp.ivbIn > 0 ? '+' : ''}${lp.ivbIn}" · HB ${lp.hbIn > 0 ? '+' : ''}${lp.hbIn}"`, zx, h - 10);
          } else {
            sctx.fillStyle = '#94a3b8';
            sctx.font = '600 9.5px "IBM Plex Mono", monospace';
            sctx.fillText('Throw pitch for Spin', cx, h - 10);
          }
          return;
        }

        // VIEW 1: Classic Animated Spray Chart (College Stadium Geometry)
        const ox = w / 2;
        const oy = h - 18;
        const pxPerFt = (h - 38) / 435;

        sctx.beginPath();
        sctx.moveTo(ox, oy);
        for (let i = 0; i <= 30; i++) {
          const phi = -0.785 + (i / 30) * 1.57;
          const d = (st.wallDist(phi) + 8) * pxPerFt;
          sctx.lineTo(ox + Math.sin(phi) * d, oy - Math.cos(phi) * d);
        }
        sctx.closePath();
        sctx.fillStyle = '#5c341a';
        sctx.fill();

        sctx.beginPath();
        sctx.moveTo(ox, oy);
        for (let i = 0; i <= 30; i++) {
          const phi = -0.785 + (i / 30) * 1.57;
          const d = st.wallDist(phi) * pxPerFt;
          sctx.lineTo(ox + Math.sin(phi) * d, oy - Math.cos(phi) * d);
        }
        sctx.closePath();
        const turfGrad = sctx.createRadialGradient(ox, oy, 10, ox, oy, 420 * pxPerFt);
        turfGrad.addColorStop(0, '#1f7a44');
        turfGrad.addColorStop(1, '#124728');
        sctx.fillStyle = turfGrad;
        sctx.fill();

        sctx.fillStyle = '#a36839';
        sctx.beginPath();
        sctx.arc(ox, oy - 75 * pxPerFt, 48 * pxPerFt, Math.PI * 1.15, Math.PI * 1.85);
        sctx.lineTo(ox, oy);
        sctx.closePath();
        sctx.fill();

        sctx.beginPath();
        for (let i = 0; i <= 30; i++) {
          const phi = -0.785 + (i / 30) * 1.57;
          const d = st.wallDist(phi) * pxPerFt;
          const px = ox + Math.sin(phi) * d;
          const py = oy - Math.cos(phi) * d;
          if (i === 0) sctx.moveTo(px, py);
          else sctx.lineTo(px, py);
        }
        sctx.strokeStyle = st.wallCap;
        sctx.lineWidth = 2.6;
        sctx.stroke();

        sctx.strokeStyle = 'rgba(255,255,255,0.5)';
        sctx.lineWidth = 1;
        [-0.785, 0.785].forEach((phi) => {
          const d = st.wallDist(phi) * pxPerFt;
          sctx.beginPath();
          sctx.moveTo(ox, oy);
          sctx.lineTo(ox + Math.sin(phi) * d, oy - Math.cos(phi) * d);
          sctx.stroke();
        });

        [200, 300, 400].forEach((ft) => {
          sctx.beginPath();
          sctx.arc(ox, oy, ft * pxPerFt, -Math.PI * 0.75, -Math.PI * 0.25);
          sctx.strokeStyle = 'rgba(255,255,255,0.14)';
          sctx.stroke();
        });

        // Live In-Flight Radar Tracer Dot on Spray Chart
        if (inFlight && sim.flightCur) {
          const lx = ox + sim.flightCur.x * pxPerFt;
          const ly = oy - sim.flightCur.y * pxPerFt;
          sctx.strokeStyle = sim.flightColor || '#38bdf8';
          sctx.setLineDash([4, 3]);
          sctx.lineWidth = 1.8;
          sctx.beginPath();
          sctx.moveTo(ox, oy);
          sctx.lineTo(lx, ly);
          sctx.stroke();
          sctx.setLineDash([]);
          sctx.fillStyle = '#fde047';
          sctx.beginPath();
          sctx.arc(lx, ly, 3.8, 0, Math.PI * 2);
          sctx.fill();
        }

        // Plotted HitTrax / Rapsodo Spray Shots with Animated Reveal Sweep + Impact Ripple
        session.sprays.forEach((sp, i) => {
          const isLatest = i === session.sprays.length - 1;
          const tBeam = isLatest ? revAnim : 1;
          const sx = ox + sp.xFt * pxPerFt * tBeam;
          const sy = oy - sp.yFt * pxPerFt * tBeam;
          sctx.beginPath();
          sctx.moveTo(ox, oy);
          sctx.lineTo(sx, sy);
          sctx.strokeStyle = sp.color;
          sctx.globalAlpha = isLatest ? 0.94 : 0.38;
          sctx.lineWidth = isLatest ? 2.4 : 1.2;
          sctx.stroke();

          if (isLatest && revAnim < 0.99) {
            sctx.beginPath();
            sctx.arc(sx, sy, 4 + revAnim * 12, 0, Math.PI * 2);
            sctx.strokeStyle = sp.color;
            sctx.globalAlpha = 1 - revAnim;
            sctx.lineWidth = 1.8;
            sctx.stroke();
          }

          sctx.beginPath();
          sctx.arc(sx, sy, sp.isHr ? 4.5 : 3.2, 0, Math.PI * 2);
          sctx.fillStyle = sp.color;
          sctx.globalAlpha = 1;
          sctx.fill();
        });
      }

      // Exact Empty Stadium Stepped Seat Surface Query matching stadium3d.js tiers
      function getSeatTierInfo(st, phi, pastWall) {
        if (pastWall < 8) return null;
        let tiers;
        if (st.tier === 'pro') {
          tiers = [
            { startPhi: -0.78, endPhi: 0.78, dOff: 12, dSpan: 56, y0: 9, y1: 34, steps: 9 },
            { startPhi: -0.78, endPhi: -0.18, dOff: 74, dSpan: 44, y0: 40, y1: 64, steps: 7 },
            { startPhi: 0.18, endPhi: 0.78, dOff: 74, dSpan: 44, y0: 40, y1: 64, steps: 7 }
          ];
        } else if (st.tier === 'hs') {
          tiers = [
            { startPhi: -0.74, endPhi: -0.26, dOff: 12, dSpan: 22, y0: 3.5, y1: 14, steps: 5 },
            { startPhi: 0.26, endPhi: 0.74, dOff: 12, dSpan: 22, y0: 3.5, y1: 14, steps: 5 }
          ];
        } else if (st.id === 'omaha' || st.id === 'vandy') {
          tiers = [
            { startPhi: -0.78, endPhi: 0.78, dOff: 12, dSpan: 48, y0: 9, y1: 31, steps: 8 },
            { startPhi: -0.78, endPhi: -0.22, dOff: 66, dSpan: 36, y0: 37, y1: 54, steps: 6 },
            { startPhi: 0.22, endPhi: 0.78, dOff: 66, dSpan: 36, y0: 37, y1: 54, steps: 6 }
          ];
        } else if (st.id === 'lsu' || st.id === 'texas') {
          tiers = [
            { startPhi: -0.78, endPhi: 0.78, dOff: 10, dSpan: 50, y0: 10, y1: 34, steps: 8 },
            { startPhi: -0.78, endPhi: 0.78, dOff: 66, dSpan: 38, y0: 39, y1: 57, steps: 6 }
          ];
        } else {
          tiers = [
            { startPhi: -0.76, endPhi: -0.18, dOff: 10, dSpan: 44, y0: 12, y1: 34, steps: 6 },
            { startPhi: 0.18, endPhi: 0.76, dOff: 10, dSpan: 46, y0: 10, y1: 32, steps: 7 },
            { startPhi: -0.78, endPhi: 0.78, dOff: 62, dSpan: 40, y0: 38, y1: 58, steps: 6 }
          ];
        }

        for (const tc of tiers) {
          if (phi >= tc.startPhi && phi <= tc.endPhi && pastWall >= tc.dOff && pastWall <= tc.dOff + tc.dSpan) {
            const frac = (pastWall - tc.dOff) / tc.dSpan;
            const stepIdx = Math.min(tc.steps - 1, Math.floor(frac * tc.steps));
            const stepH = (tc.y1 - tc.y0) / tc.steps;
            return {
              floorZ: tc.y0 + stepIdx * stepH + 1.45,
              isSeat: st.tier !== 'hs' && (stepIdx % 2 === 0 || frac < 0.85),
              isUpper: tc.dOff > 50
            };
          }
        }
        return { floorZ: Math.min(58, 12 + pastWall * 0.44), isSeat: false, isUpper: pastWall > 62 };
      }

      // Unrestricted Outdoor RK4 Projection (used for Rapsodo virtual outdoor distance when hitting inside Enclosed Batting Cage)
      function simulateOutdoorProjection(exitVelo, launchDeg, sprayDeg, backspinRpm, sidespinRpm, startPos, targetSt) {
        const st = targetSt || STADIUMS.omaha;
        const wind = WIND_PRESETS[activeWindId] || WIND_PRESETS.calm;
        const v0 = exitVelo * 1.46667;
        const theta = (launchDeg * Math.PI) / 180;
        const phi = (sprayDeg * Math.PI) / 180;
        let x = startPos ? startPos.x : 0;
        let y = startPos ? startPos.y : 1.4;
        let z = startPos ? Math.max(1.2, startPos.z) : 2.65;
        let vx = v0 * Math.cos(theta) * Math.sin(phi);
        let vy = v0 * Math.cos(theta) * Math.cos(phi);
        let vz = v0 * Math.sin(theta);
        const K = 0.00531 * (st.airDensity || 1.0);
        let wx = (backspinRpm * 2 * Math.PI) / 60;
        let wz = -(sidespinRpm * 2 * Math.PI) / 60;
        const dt = 1 / 90;
        let apex = z;
        let t = 0;
        let isHr = false;
        let wallHit = false;
        let carryDist = null;
        const fair = Math.abs(sprayDeg) <= 45;
        const deriv = (cvx, cvy, cvz, cwx, cwz) => {
          const rvx = cvx - wind.vx;
          const rvy = cvy - wind.vy;
          const rvz = cvz;
          const rsp = Math.hypot(rvx, rvy, rvz);
          if (rsp < 0.05) return { ax: 0, ay: 0, az: -32.174 };
          const spinMag = Math.hypot(cwx, cwz);
          const spinFactor = (0.12 * spinMag) / rsp;
          const cd = 0.295 + 0.145 * Math.min(0.48, spinFactor);
          const cl = spinFactor > 0.004 ? 1 / (2.32 + 0.4 / spinFactor) : 0;
          const drag = K * cd * rsp;
          const mag = spinMag > 0.1 ? (K * cl * rsp) / spinMag : 0;
          return {
            ax: -drag * rvx + mag * (-cwz * rvy),
            ay: -drag * rvy + mag * (cwz * rvx - cwx * rvz),
            az: -32.174 - drag * rvz + mag * (cwx * rvy)
          };
        };
        for (let step = 0; step < 720; step++) {
          t += dt;
          if (Math.hypot(vx, vy, vz) < 1.8 && z <= 0.16) break;
          if (z <= 0.16 && Math.abs(vz) < 4.5 && step > 10) {
            vx *= Math.max(0, 1 - 2.4 * dt);
            vy *= Math.max(0, 1 - 2.4 * dt);
            vz = 0;
            z = 0.14;
            x += vx * dt;
            y += vy * dt;
          } else {
            const k1 = deriv(vx, vy, vz, wx, wz);
            const k2 = deriv(vx + 0.5 * dt * k1.ax, vy + 0.5 * dt * k1.ay, vz + 0.5 * dt * k1.az, wx, wz);
            const k3 = deriv(vx + 0.5 * dt * k2.ax, vy + 0.5 * dt * k2.ay, vz + 0.5 * dt * k2.az, wx, wz);
            const k4 = deriv(vx + dt * k3.ax, vy + dt * k3.ay, vz + dt * k3.az, wx, wz);
            vx += (dt / 6) * (k1.ax + 2 * k2.ax + 2 * k3.ax + k4.ax);
            vy += (dt / 6) * (k1.ay + 2 * k2.ay + 2 * k3.ay + k4.ay);
            vz += (dt / 6) * (k1.az + 2 * k2.az + 2 * k3.az + k4.az);
            x += vx * dt;
            y += vy * dt;
            z += vz * dt;
          }
          if (z > apex) apex = z;
          const horiz = Math.hypot(x, y);
          const curPhi = Math.atan2(x, Math.max(1, y));
          if (fair && !isHr && !wallHit && Math.abs(curPhi) <= 0.785) {
            const wDist = st.wallDist(curPhi);
            if (horiz >= wDist) {
              if (z > st.wallHeight(curPhi)) isHr = true;
              else {
                wallHit = true;
                if (carryDist === null) carryDist = Math.round(horiz);
                vx *= -0.55;
                vy *= -0.55;
                vz = Math.max(2, vz * 0.5);
              }
            }
          }
          if (z <= 0.14 && vz < 0) {
            if (carryDist === null) carryDist = Math.round(horiz);
            if (!isHr && Math.abs(vz) > 4.5) {
              z = 0.16;
              vz = Math.abs(vz) * 0.4;
              vx *= 0.72;
              vy *= 0.72;
            } else {
              z = 0.14;
              vz = 0;
            }
          }
        }
        return {
          dist: Math.round(Math.hypot(x, y)),
          carryDist: carryDist || Math.round(Math.hypot(x, y)),
          apex: Math.round(apex),
          hangTime: Number(t.toFixed(2)),
          isHr,
          wallHit,
          endX: x,
          endY: y
        };
      }

      // True 4th-Order Runge-Kutta (RK4) 120Hz Aerodynamics with Cage Net Containment & Stadium Seat Bounces
      function simulateBallFlight(bat, exitVelo, launchDeg, sprayDeg, backspinRpm = 1900, sidespinRpm = 0, startPos = null) {
        const st = STADIUMS[activeStadiumId] || STADIUMS.omaha;
        const isCage = st.id === 'cage';
        const wind = isCage ? { vx: 0, vy: 0 } : WIND_PRESETS[activeWindId] || WIND_PRESETS.calm;
        const v0 = exitVelo * 1.46667; // mph -> ft/s
        const theta = (launchDeg * Math.PI) / 180;
        const phi = (sprayDeg * Math.PI) / 180;

        let x = startPos ? startPos.x : 0;
        let y = startPos ? startPos.y : 1.4;
        let z = startPos ? Math.max(1.2, startPos.z) : 2.65;
        let vx = v0 * Math.cos(theta) * Math.sin(phi);
        let vy = v0 * Math.cos(theta) * Math.cos(phi);
        let vz = v0 * Math.sin(theta);

        const airDensity = st.airDensity || 1.0;
        const K = 0.00531 * airDensity;
        let wx = (backspinRpm * 2 * Math.PI) / 60;
        let wz = -(sidespinRpm * 2 * Math.PI) / 60;

        const dt = 1 / 120;
        const points = [{ x, y, z, t: 0 }];
        let apex = z;
        let apexTime = 0;
        let apexPos = { x, y, z };
        let t = 0;
        let isHr = false;
        let wallHit = false;
        let wallHitTime = null;
        let netHitTime = null;
        let netHit2Time = null;
        let seatHitTime = null;
        let seatBounce2Time = null;
        let seatSoundType = 'seat';
        let seatBounces = 0;
        let hangTime = null;
        let carryDist = null;
        let fenceClearTime = null;
        const fair = Math.abs(sprayDeg) <= 45;

        const deriv = (cvx, cvy, cvz, cwx, cwz) => {
          const rvx = cvx - wind.vx;
          const rvy = cvy - wind.vy;
          const rvz = cvz;
          const rsp = Math.hypot(rvx, rvy, rvz);
          if (rsp < 0.05) return { ax: 0, ay: 0, az: -32.174 };
          const spinMag = Math.hypot(cwx, cwz);
          const spinFactor = (0.12 * spinMag) / rsp;
          const cd = 0.295 + 0.145 * Math.min(0.48, spinFactor);
          const cl = spinFactor > 0.004 ? 1 / (2.32 + 0.4 / spinFactor) : 0;
          const drag = K * cd * rsp;
          const mag = spinMag > 0.1 ? (K * cl * rsp) / spinMag : 0;
          return {
            ax: -drag * rvx + mag * (-cwz * rvy),
            ay: -drag * rvy + mag * (cwz * rvx - cwx * rvz),
            az: -32.174 - drag * rvz + mag * (cwx * rvy)
          };
        };

        const CAGE_HALF_W = 57.5;
        const CAGE_FAR_Y = 294.5;
        const CAGE_BACKSTOP_Y = -15.2;

        for (let step = 0; step < 1020; step++) {
          t += dt;
          const sp = Math.hypot(vx, vy, vz);
          if (sp < 1.8 && z <= 0.16) break;

          if (z <= 0.16 && Math.abs(vz) < 4.5 && step > 10) {
            const onDirt = Math.hypot(x, y) < 135;
            const friction = onDirt ? 1.85 : 2.55;
            vx *= Math.max(0, 1 - friction * dt);
            vy *= Math.max(0, 1 - friction * dt);
            vz = 0;
            z = 0.14;
            x += vx * dt;
            y += vy * dt;
          } else {
            const k1 = deriv(vx, vy, vz, wx, wz);
            const k2 = deriv(vx + 0.5 * dt * k1.ax, vy + 0.5 * dt * k1.ay, vz + 0.5 * dt * k1.az, wx, wz);
            const k3 = deriv(vx + 0.5 * dt * k2.ax, vy + 0.5 * dt * k2.ay, vz + 0.5 * dt * k2.az, wx, wz);
            const k4 = deriv(vx + dt * k3.ax, vy + dt * k3.ay, vz + dt * k3.az, wx, wz);

            const vxMid = vx + (dt / 12) * (k1.ax + 2 * k2.ax + 2 * k3.ax + k4.ax);
            const vyMid = vy + (dt / 12) * (k1.ay + 2 * k2.ay + 2 * k3.ay + k4.ay);
            const vzMid = vz + (dt / 12) * (k1.az + 2 * k2.az + 2 * k3.az + k4.az);

            vx += (dt / 6) * (k1.ax + 2 * k2.ax + 2 * k3.ax + k4.ax);
            vy += (dt / 6) * (k1.ay + 2 * k2.ay + 2 * k3.ay + k4.ay);
            vz += (dt / 6) * (k1.az + 2 * k2.az + 2 * k3.az + k4.az);

            x += vxMid * dt;
            y += vyMid * dt;
            z += vzMid * dt;

            wx *= 1 - 0.06 * dt;
            wz *= 1 - 0.06 * dt;
          }

          if (z > apex) {
            apex = z;
            apexTime = t;
            apexPos = { x, y, z };
          }

          // Strict Physical Containment inside Enclosed Pro Batting Cage (walls, curved ceiling net, back wall/net & catcher net)
          if (isCage) {
            let hitCageMesh = false;
            if (Math.abs(x) >= CAGE_HALF_W) {
              x = Math.sign(x) * CAGE_HALF_W;
              vx = -vx * 0.24;
              vy *= 0.42;
              vz *= 0.65;
              hitCageMesh = true;
            }
            const roofH = 33.4 * (1 - 0.36 * Math.min(1, (x / 58) * (x / 58)));
            if (z >= roofH) {
              z = roofH - 0.15;
              vz = -Math.max(4, Math.abs(vz) * 0.28);
              vx *= 0.48;
              vy *= 0.48;
              hitCageMesh = true;
            }
            if (y >= CAGE_FAR_Y) {
              y = CAGE_FAR_Y - 0.15;
              vy = -Math.max(5, Math.abs(vy) * (z < 14 ? 0.45 : 0.22));
              vx *= 0.45;
              vz *= 0.55;
              hitCageMesh = true;
            }
            if (y <= CAGE_BACKSTOP_Y) {
              y = CAGE_BACKSTOP_Y + 0.15;
              vy = Math.abs(vy) * 0.28;
              vx *= 0.45;
              vz *= 0.6;
              hitCageMesh = true;
            }
            if (hitCageMesh) {
              if (netHitTime === null) {
                netHitTime = t;
                if (hangTime === null) hangTime = t;
                if (carryDist === null) carryDist = Math.round(Math.hypot(x, y));
              } else if (netHit2Time === null && t - netHitTime > 0.18) {
                netHit2Time = t;
              }
              wx *= 0.2;
              wz *= 0.2;
            }
          }

          if (step % 2 === 0) points.push({ x, y, z: Math.max(0.14, z), t });

          const horiz = Math.hypot(x, y);
          const curPhi = Math.atan2(x, Math.max(1, y));

          if (!isCage && fair && !isHr && !wallHit && Math.abs(curPhi) <= 0.785) {
            const wDist = st.wallDist(curPhi);
            const wH = st.wallHeight(curPhi);
            if (horiz >= wDist) {
              if (z > wH) {
                isHr = true;
                fenceClearTime = t;
              } else {
                wallHit = true;
                wallHitTime = t;
                if (carryDist === null) carryDist = Math.round(horiz);
                const nx = -x / Math.max(1, horiz);
                const ny = -y / Math.max(1, horiz);
                const vn = vx * nx + vy * ny;
                if (vn < 0) {
                  vx -= 1.48 * vn * nx;
                  vy -= 1.48 * vn * ny;
                }
                vx *= 0.82;
                vy *= 0.82;
                vz = Math.max(2, vz * 0.52);
              }
            }
          }

          // Stepped Empty Stadium Seat / Bleacher Ricochet Physics (MLB The Show seat bounces!)
          if (!isCage && isHr) {
            const curWall = st.wallDist(Math.max(-0.785, Math.min(0.785, curPhi)));
            const pastWall = Math.max(0, horiz - curWall);
            const seatInfo = getSeatTierInfo(st, curPhi, pastWall);
            if (seatInfo && z <= seatInfo.floorZ && vz < 0) {
              z = seatInfo.floorZ;
              if (hangTime === null) hangTime = t;
              if (carryDist === null) carryDist = Math.round(horiz);
              if (seatHitTime === null) {
                seatHitTime = t;
                seatSoundType = seatInfo.isSeat ? 'seat' : 'concrete';
              } else if (seatBounce2Time === null && t - seatHitTime > 0.16) {
                seatBounce2Time = t;
              }
              seatBounces++;
              if (Math.abs(vz) > 5.5 && seatBounces < 3) {
                vz = Math.abs(vz) * 0.44;
                // Ricochet forward/sideways slightly off molded seat back or concrete step
                vx *= 0.56;
                vy *= 0.56;
                z += 0.25;
                points.push({ x, y, z, t });
              } else {
                points.push({ x, y, z, t });
                break;
              }
            }
          }

          if (z <= 0.14 && vz < 0) {
            if (hangTime === null) hangTime = t;
            if (carryDist === null) carryDist = Math.round(horiz);
            if (!isHr && Math.abs(vz) > 4.5 && points.length < 360) {
              z = 0.16;
              const onDirt = horiz < 135;
              const eVert = onDirt ? 0.48 : 0.38;
              vz = Math.abs(vz) * eVert;
              const spinKick = backspinRpm < -200 ? 1.04 : backspinRpm > 1600 ? 0.74 : 0.86;
              vx *= (onDirt ? 0.84 : 0.74) * spinKick;
              vy *= (onDirt ? 0.84 : 0.74) * spinKick;
              wx *= 0.35;
              wz *= 0.4;
            } else {
              z = 0.14;
              vz = 0;
            }
          }
        }

        const last = points[points.length - 1];
        // When inside the D1 Rapsodo Lab Cage, compute true virtual outdoor projection for Rapsodo stats while keeping 3D ball inside cage!
        const outdoorProj = isCage
          ? simulateOutdoorProjection(exitVelo, launchDeg, sprayDeg, backspinRpm, sidespinRpm, startPos, STADIUMS.omaha)
          : null;

        const finalDist = outdoorProj ? outdoorProj.dist : Math.round(Math.hypot(last.x, last.y));
        const finalCarry = outdoorProj ? outdoorProj.carryDist : carryDist != null ? carryDist : finalDist;
        const finalApex = outdoorProj ? Math.max(Math.round(apex), outdoorProj.apex) : Math.round(apex);
        const finalHang = outdoorProj ? outdoorProj.hangTime : Number((hangTime != null ? hangTime : t).toFixed(2));
        const reportIsHr = fair && (outdoorProj ? outdoorProj.isHr : isHr);
        const reportWallHit = fair && (outdoorProj ? outdoorProj.wallHit : wallHit);
        const reportEndX = outdoorProj ? outdoorProj.endX : last.x;
        const reportEndY = outdoorProj ? outdoorProj.endY : last.y;

        // Expected Batting Average (xBA) heuristic matching Statcast EV/LA buckets
        let xbaNum = 0.08;
        if (fair) {
          if (reportIsHr) xbaNum = 0.99;
          else if (launchDeg >= 10 && launchDeg <= 28 && exitVelo >= 94) xbaNum = 0.68 + Math.min(0.27, (exitVelo - 94) * 0.025);
          else if (launchDeg >= 8 && launchDeg <= 22 && exitVelo >= 85) xbaNum = 0.44 + (exitVelo - 85) * 0.02;
          else if (launchDeg < 6 && exitVelo >= 95) xbaNum = 0.38;
          else if (launchDeg > 40) xbaNum = 0.06;
          else xbaNum = 0.21;
        }
        const xba = fair ? `.${String(Math.round(Math.min(0.999, Math.max(0.01, xbaNum)) * 1000)).padStart(3, '0')}` : '.000';

        let outcome = 'Out';
        let color = '#94a3b8';
        if (!fair) {
          outcome = 'Foul Ball';
          color = '#fbbf24';
        } else if (reportIsHr) {
          outcome = finalDist >= 425 ? 'UPPER DECK BOMB!' : 'HOME RUN!';
          color = '#38bdf8';
        } else if (reportWallHit) {
          outcome = 'DOUBLE OFF WALL!';
          color = '#22c55e';
        } else if (launchDeg < 8) {
          outcome = exitVelo >= 95 ? 'Hard Single!' : 'Ground Out';
          color = exitVelo >= 95 ? '#22c55e' : '#fbbf24';
        } else if (launchDeg <= 22 && exitVelo >= 92) {
          outcome = finalDist >= 260 ? 'Gap Double!' : 'Line Drive Single!';
          color = '#22c55e';
        } else if (launchDeg > 42 && finalDist < 220) {
          outcome = 'Infield Pop-Up';
          color = '#f87171';
        } else {
          outcome = finalDist >= 325 ? 'Deep Warning-Track Fly' : 'Fly Out';
          color = '#fbbf24';
        }

        // Exact Post-Flight Reveal Time so Rapsodo telemetry & score never spoil the hit immediately at contact!
        const revealTime = isCage
          ? Math.max(0.55, netHitTime != null ? netHitTime : Math.min(t, 0.9))
          : !fair
            ? Math.min(t, Math.max(0.75, hangTime != null ? hangTime : 1.15))
            : reportIsHr
              ? Math.max(0.9, seatHitTime != null ? seatHitTime : fenceClearTime != null ? fenceClearTime + 0.25 : t * 0.85)
              : reportWallHit
                ? Math.max(0.9, wallHitTime != null ? wallHitTime + 0.15 : t * 0.8)
                : Math.max(0.75, hangTime != null ? hangTime : t * 0.85);

        return {
          points,
          dist: finalDist,
          carryDist: finalCarry,
          apex: finalApex,
          apexTime,
          apexPos,
          hangTime: finalHang,
          xba,
          exitVelo: Number(exitVelo.toFixed(1)),
          launchAngle: Math.round(launchDeg),
          sprayDeg: Math.round(sprayDeg),
          backspinRpm: Math.round(backspinRpm),
          sidespinRpm: Math.round(sidespinRpm),
          outcome,
          isHr: reportIsHr,
          wallHit: reportWallHit,
          wallHitTime,
          wallThudPlayed: false,
          netHitTime,
          netThudPlayed: false,
          netHit2Time,
          net2Played: false,
          seatHitTime,
          seatBounce2Time,
          seatSoundType,
          seatSoundPlayed: false,
          seatBounce2Played: false,
          fair,
          color,
          endX: reportEndX,
          endY: reportEndY,
          revealTime,
          telemetryRevealed: false,
          totalTime: t
        };
      }

      function mirrorClockLabel(clockStr) {
        const parts = String(clockStr || '12:00').split(':');
        const h = Number(parts[0]) || 12;
        const m = Number(parts[1]) || 0;
        const totalMin = ((12 * 60 - ((h % 12) * 60 + m)) + 720) % 720;
        const mh = Math.floor(totalMin / 60) || 12;
        const mm = totalMin % 60;
        return `${mh}:${String(mm).padStart(2, '0')}`;
      }

      // Precompute realistic RK4 pitched baseball path from RHP (+0.88), LHP (-0.88), or Dual-Wheel Pitching Machine (0, 3.85)
      function precomputePitchTrajectory(mph, typeKey, endX, endY, isDemo, hand = pitcherHand, deliveryMode = activeDeliveryMode) {
        const spec = PITCH_TYPES[typeKey] || PITCH_TYPES.fastball;
        const isMachine = deliveryMode === 'machine';
        const pSign = hand === 'L' ? -1 : 1;
        const speedFtS = mph * 1.46667;
        const targetX = endX * 0.88;
        const targetY = 2.65 - endY * 1.0;
        const dur = isDemo ? 0.68 : Math.max(0.54, Math.min(0.84, 57 / speedFtS));

        const magX = isDemo ? 0 : isMachine ? spec.magX * pSign * 0.52 : spec.magX * pSign;
        const magY = isDemo ? 16.5 : spec.magY;

        const startX = isMachine ? 0 : 0.88 * pSign;
        const startY = isMachine ? 3.85 : 6.12;
        const startZ = isMachine ? -54.5 : -55.0;
        const ayTotal = -32.174 + magY;
        const axTotal = magX;
        const vx0 = (targetX - startX - 0.5 * axTotal * dur * dur) / dur;
        const vy0 = (targetY - startY - 0.5 * ayTotal * dur * dur) / dur;
        const vz0 = (0 - startZ) / dur;

        const samples = [];
        const steps = 60;
        for (let i = 0; i <= steps; i++) {
          const p = (i / steps) * 1.06;
          const t = p * dur;
          const dragScale = 1 - 0.036 * t;
          samples.push({
            x: startX + vx0 * t * dragScale + 0.5 * axTotal * t * t,
            y: Math.max(0.32, startY + vy0 * t + 0.5 * ayTotal * t * t),
            z: startZ + vz0 * t * (1 - 0.025 * t)
          });
        }
        return {
          dur,
          samples,
          targetX,
          targetY,
          hbIn: Number((spec.hbIn * pSign * (isMachine ? 0.52 : 1)).toFixed(1)),
          spinAxisDeg: pSign === 1 ? spec.spinAxisDeg : (360 - spec.spinAxisDeg) % 360,
          spinAxisClock: pSign === 1 ? spec.spinAxisClock : mirrorClockLabel(spec.spinAxisClock),
          descendDeg: Math.atan2(vy0 + ayTotal * dur, vz0) * (180 / Math.PI)
        };
      }

      function launchPitch(isDemoHr = false) {
        if (sim.phase === 'windup' || sim.phase === 'pitch') return;
        const keys = ['fastball', 'slider', 'curve', 'changeup'];
        const chosenKey = isDemoHr
          ? 'fastball'
          : selectedPitchType === 'mix'
            ? keys[Math.floor(Math.random() * keys.length)]
            : selectedPitchType;
        const spec = PITCH_TYPES[chosenKey] || PITCH_TYPES.fastball;
        const mph = isDemoHr
          ? 89
          : Math.round(spec.mphMin + Math.random() * (spec.mphMax - spec.mphMin));
        const pitchRpm = Math.round(spec.rpmMin + Math.random() * (spec.rpmMax - spec.rpmMin));

        const endX = isDemoHr ? 0.03 : (Math.random() - 0.5) * 1.72;
        const endY = isDemoHr ? 0.02 : (Math.random() - 0.5) * 1.62;
        const traj = precomputePitchTrajectory(mph, chosenKey, endX, endY, isDemoHr, pitcherHand, activeDeliveryMode);

        sim.phase = 'windup';
        sim.t = 0;
        sim.camT = 0;
        sim.rapZoneAnimT = 0;
        sim.umpCall = '';
        sim.umpCallTimer = 0;
        sim.deliveryMode = activeDeliveryMode;
        sim.swingTriggered = false;
        sim.swingPressT = null;
        sim.swingT = 0;
        sim.swingAngle = -0.42;
        sim.swingTargetX = traj.targetX;
        sim.swingTargetY = traj.targetY;
        sim.contactResolved = false;
        sim.demoAutoSwing = isDemoHr;
        sim.pitchPos = null;
        sim.flightCur = null;
        sim.flightPoints = null;
        sim.flightMaxIdx = 0;
        const sourceTag = activeDeliveryMode === 'machine' ? 'Machine' : `${pitcherHand}HP`;
        sim.pitch = {
          typeKey: chosenKey,
          name: isDemoHr ? `89 mph Centerpiece 4-Seam (${sourceTag})` : `${mph} mph ${spec.name} (${sourceTag})`,
          mph,
          pitchRpm,
          spinAxisClock: traj.spinAxisClock,
          spinAxisDeg: traj.spinAxisDeg,
          spinEff: spec.spinEff,
          ivbIn: spec.ivbIn,
          hbIn: traj.hbIn,
          dur: traj.dur,
          samples: traj.samples,
          descendDeg: traj.descendDeg,
          endX,
          endY
        };
        session.lastPitch = sim.pitch;
        if (swingBtn) swingBtn.textContent = 'SWING! (Space)';
        if (pitchNote) {
          pitchNote.textContent = `${sim.pitch.name} (${pitchRpm} rpm · ${traj.spinAxisClock}) · vs ${batterHand}HB`;
        }
      }

      function triggerSwingPress() {
        if (sim.phase !== 'pitch' || sim.swingTriggered || sim.contactResolved || !sim.pitch) return;
        sim.swingTriggered = true;
        sim.swingPressT = sim.t;
        sim.swingT = 0;
        sim.finishStyle = Math.random() < 0.52 ? 'one-hand' : 'two-hand';
      }

      function finalizeFlightTelemetry(fl) {
        if (!fl || fl.telemetryRevealed) return;
        fl.telemetryRevealed = true;
        sim.rapAnimT = 0;
        sim.rapZoneAnimT = 0;
        const rep = fl.pendingHitReport;
        if (!rep) return;

        session.lastHit = fl;
        if (!fl.fair) {
          if (session.strikes < 2) session.strikes++;
          sim.calloutText = 'FOUL BALL';
          sim.calloutSub = `${fl.exitVelo} mph · ${fl.launchAngle}° · ${fl.backspinRpm} rpm`;
        } else {
          session.balls = 0;
          session.strikes = 0;
          if (fl.isHr || fl.wallHit || fl.outcome.includes('Single') || fl.outcome.includes('Double')) {
            session.hits++;
            if (fl.isHr) session.hrs++;
          } else {
            session.outs = (session.outs + 1) % 3;
          }
          session.sprays.push({
            xFt: fl.endX,
            yFt: fl.endY,
            dist: fl.dist,
            carryDist: fl.carryDist,
            apex: fl.apex,
            isHr: fl.isHr,
            color: fl.color,
            stadiumId: activeStadiumId
          });
          if (session.sprays.length > 24) session.sprays.shift();
          sim.calloutText = fl.outcome;
          sim.calloutSub = `${fl.dist} FT (${fl.carryDist} CARRY) · ${fl.exitVelo} MPH · SMASH ${rep.smashFactor}`;
        }
        sim.calloutTimer = 2.9;

        updateSessionDom(rep);
        if (pitchNote) {
          const spinWord = fl.backspinRpm >= 0 ? `${fl.backspinRpm} rpm backspin` : `${Math.abs(fl.backspinRpm)} rpm topspin`;
          pitchNote.textContent = `${fl.outcome} — ${fl.dist} ft (${fl.carryDist} ft carry · ${fl.launchAngle}° · ${spinWord})`;
        }
      }

      function resolveSwing() {
        if (sim.phase !== 'pitch' || sim.contactResolved || !sim.pitch) return;
        sim.contactResolved = true;
        const bat = BATS[activeBatId] || BATS['goods-2026'];
        const hSign = batterHand === 'L' ? -1 : 1; // +1 = RHB, -1 = LHB
        const hasPlatoonEdge = batterHand !== pitcherHand;

        const timingErr = (sim.swingPressT != null ? sim.swingPressT : sim.t) - 0.94;
        const absTime = Math.abs(timingErr);

        let curPciX = pci.x;
        let curPciY = pci.y;
        if (sim.demoAutoSwing) {
          curPciX = sim.pitch.endX;
          curPciY = sim.pitch.endY + 0.24;
        } else if (autoPciMode) {
          curPciX = sim.pitch.endX + (Math.random() - 0.5) * 0.1;
          curPciY = sim.pitch.endY + 0.22 + (Math.random() - 0.5) * 0.12;
        }

        // Record MLB The Show style post-swing PCI vs Pitch visual feedback
        sim.swingFeedback = {
          pciX: curPciX,
          pciY: curPciY,
          pitchX: sim.pitch.endX,
          pitchY: sim.pitch.endY,
          timer: 2.5
        };

        const dx = curPciX - sim.pitch.endX;
        const underBallOffset = curPciY - sim.pitch.endY; // >0 = PCI below ball -> loft & backspin
        const distFromSweet = Math.hypot(dx * 0.88, underBallOffset * 0.96);

        const maxReach = 0.98 * bat.sweetSpot * (hasPlatoonEdge ? 1.04 : 0.98);
        if (absTime > 0.24 || distFromSweet > maxReach) {
          playBatAudio('whiff');
          sim.followThroughTimer = 0.3;
          session.strikes++;
          let call = 'Swinging Strike';
          if (session.strikes >= 3) {
            call = 'Strikeout!';
            session.balls = 0;
            session.strikes = 0;
            session.outs = (session.outs + 1) % 3;
          }
          sim.calloutText = call.toUpperCase();
          sim.calloutSub = absTime > 0.24 ? (timingErr < 0 ? 'Too Early' : 'Too Late') : 'Missed PCI';
          sim.calloutTimer = 1.4;
          updateSessionDom({ exitVelo: null, launchAngle: null, dist: null, apex: null, hangTime: null, backspinRpm: null, outcome: call, color: '#f87171' });
          if (swingBtn) swingBtn.textContent = 'Throw Pitch';
          return;
        }

        // Refined MOI / COR Bat-Ball Physics:
        // Low-MOI 1-piece SFX bats swing fastest; High-MOI X14 end-load Goods bats convert mass into peak EV; Wood punishes off-center miss hits sharply.
        const radialRatio = distFromSweet / maxReach;
        const isTrueBarrel = radialRatio <= 0.39 && absTime <= 0.11;
        const sharpness = bat.taperSharpness || 1.0;
        const radialCurve = isTrueBarrel
          ? Math.max(0.92, 1 - radialRatio * 0.16)
          : Math.max(0.28, 1 - Math.pow(radialRatio, 1.85) * 0.68 * sharpness);
        const timingCurve = absTime <= 0.085 ? 1.0 : Math.max(0.44, 1 - (absTime - 0.085) * 2.25);
        const sweetSpotEff = Math.max(0.2, radialCurve * timingCurve);

        const swingMph = Number((sim.demoAutoSwing ? 82.0 * bat.weightMod : (73.5 + sweetSpotEff * 10.6) * bat.weightMod).toFixed(1));
        const moiInertiaBoost = 1 + ((bat.moi || 1.0) - 1.0) * 0.12 * sweetSpotEff;
        const collisionQ = (bat.cor || 0.5) * 0.425 * bat.popMod * (0.94 + 0.09 * sweetSpotEff);
        const exitVelo = Math.min(
          117.5,
          collisionQ * sim.pitch.mph + (1 + collisionQ) * swingMph * moiInertiaBoost * (0.81 + 0.22 * sweetSpotEff)
        );
        const smashFactor = Number((exitVelo / Math.max(55, swingMph)).toFixed(2));
        const attackAngle = Math.round((isTrueBarrel ? 11 : 9 + Math.max(-4, Math.min(8, underBallOffset * 14))) + (bat.launchLift || 0));

        // Oblique Bat-Ball Gear Effect: attack angle + vertical offset + end-load loft drives launch angle & backspin RPM
        const pitchDesc = sim.pitch.descendDeg || -7.5;
        let launchDeg = sim.demoAutoSwing
          ? 27 + (bat.launchLift || 0) * 0.4
          : isTrueBarrel
            ? 24 + (bat.launchLift || 0) + Math.max(-4, Math.min(7, underBallOffset * 26)) + (Math.random() - 0.5) * 2.0
            : 14.5 + (bat.launchLift || 0) * 0.6 + underBallOffset * 42 - pitchDesc * 0.2 + (Math.random() - 0.5) * 2.4;
        launchDeg = Math.max(-10, Math.min(56, launchDeg));

        const backspinRpm = sim.demoAutoSwing
          ? 2220
          : isTrueBarrel
            ? Math.round(2060 + underBallOffset * 950)
            : Math.max(-1900, Math.min(3500, 1340 + underBallOffset * 2900 + (launchDeg - 15) * 26));

        // Handedness-accurate spray physics: RHB early timing pulls LF (-sprayDeg), LHB early timing pulls RF (+sprayDeg)!
        let sprayDeg = sim.demoAutoSwing ? -14 * hSign : timingErr * 148 * hSign + dx * 20;
        if (isTrueBarrel && Math.abs(sprayDeg) > 36) sprayDeg = Math.sign(sprayDeg) * 34;
        if (absTime > 0.165) {
          sprayDeg = (timingErr < 0 ? -56 : 56) * hSign;
        }
        sprayDeg = Math.max(-68, Math.min(68, sprayDeg));

        const sidespinRpm = Math.max(-1450, Math.min(1450, sprayDeg * 25 + dx * 420));

        const contactStart = {
          x: sim.pitch.endX * 0.88,
          y: 1.5 - timingErr * 3.5,
          z: 2.65 - sim.pitch.endY * 1.0
        };

        sim.flashTimer = 1;
        sim.impactBurstId++;
        sim.impactPos = { x: contactStart.x, y: contactStart.z, z: -contactStart.y };

        const flight = simulateBallFlight(bat, exitVelo, launchDeg, sprayDeg, backspinRpm, sidespinRpm, contactStart);
        playBatAudio(bat.id, sweetSpotEff, flight.isHr, activeStadiumId);
        sim.flashColor = flight.color;

        const battedSpinAxisClock =
          Math.abs(sprayDeg) < 9 ? '12:00' : sprayDeg < 0 ? (sprayDeg < -24 ? '11:15' : '11:45') : sprayDeg > 24 ? '12:45' : '12:15';
        const pendingHitReport = {
          exitVelo: flight.exitVelo,
          launchAngle: flight.launchAngle,
          dist: flight.dist,
          carryDist: flight.carryDist,
          apex: flight.apex,
          hangTime: flight.hangTime,
          backspinRpm: flight.backspinRpm,
          batSpeed: swingMph,
          smashFactor,
          attackAngle,
          xba: flight.xba,
          pitchMeta: sim.pitch,
          battedSpinAxis: battedSpinAxisClock,
          spinEff: isTrueBarrel ? 96 : 89,
          outcome: flight.outcome,
          color: flight.color
        };

        sim.flight = { ...flight, playTime: 0, pendingHitReport };
        sim.flightPoints = flight.points;
        sim.flightColor = flight.color;
        sim.flightFair = flight.fair;
        sim.flightMaxIdx = 0;
        sim.flightCur = flight.points[0];
        sim.phase = 'flight';
        sim.t = 0;

        // Delayed Rapsodo Tracking State — stats reveal after ball lands/hits wall or net!
        sim.calloutText = '';
        sim.calloutSub = '';
        sim.calloutTimer = 0;
        if (evEl) evEl.textContent = 'Tracking...';
        if (laEl) laEl.textContent = 'Tracking...';
        if (distEl) distEl.textContent = 'In Flight...';
        if (apexEl) apexEl.textContent = '-- ft';
        if (spinEl) spinEl.textContent = '-- rpm';
        if (outEl) {
          outEl.textContent = 'Ball In Flight';
          outEl.style.color = '#38bdf8';
        }
        if (rapBatSpeedEl) rapBatSpeedEl.textContent = '-- mph';
        if (rapSmashEl) rapSmashEl.textContent = '--';
        if (rapAttackEl) rapAttackEl.textContent = '--°';
        if (rapCarryEl) rapCarryEl.textContent = '-- ft · .---';
        if (pitchNote) {
          pitchNote.textContent = 'Rapsodo radar tracking ball flight — stats will post after landing!';
        }
        if (swingBtn) swingBtn.textContent = 'Throw Pitch';
      }

      // Compute pixel-exact Strike Zone HUD rectangle projected through live 3D camera!
      function getStrikeZoneHudRect() {
        if (engine3D) {
          const tl = engine3D.projectWorldToNorm(-0.88, 3.65, 0);
          const br = engine3D.projectWorldToNorm(0.88, 1.65, 0);
          const x = tl.nx * LOG_W;
          const y = tl.ny * LOG_H;
          const w = Math.max(76, (br.nx - tl.nx) * LOG_W);
          const h = Math.max(76, (br.ny - tl.ny) * LOG_H);
          return { x, y, w, h, cx: x + w / 2, cy: y + h / 2 };
        }
        return { x: LOG_W / 2 - 58, y: 222, w: 116, h: 110, cx: LOG_W / 2, cy: 277 };
      }

      function scheduleNextFrame() {
        if (engine3D && engine3D.isSoftwareGl) {
          setTimeout(() => requestAnimationFrame(renderFrame), 16);
        } else {
          requestAnimationFrame(renderFrame);
        }
      }

      function renderFrame(ts) {
        const dt = sim.lastTs ? Math.min(0.05, (ts - sim.lastTs) / 1000) : 0.016;
        sim.lastTs = ts;

        // Keyboard PCI movement
        const spd = 2.6 * dt;
        if (keysDown.has('ArrowLeft') || keysDown.has('a') || keysDown.has('A')) pci.targetX -= spd;
        if (keysDown.has('ArrowRight') || keysDown.has('d') || keysDown.has('D')) pci.targetX += spd;
        if (keysDown.has('ArrowUp') || keysDown.has('w') || keysDown.has('W')) pci.targetY -= spd;
        if (keysDown.has('ArrowDown') || keysDown.has('s') || keysDown.has('S')) pci.targetY += spd;
        pci.targetX = Math.max(-1.45, Math.min(1.45, pci.targetX));
        pci.targetY = Math.max(-1.45, Math.min(1.45, pci.targetY));
        pci.x += (pci.targetX - pci.x) * Math.min(1, dt * 18);
        pci.y += (pci.targetY - pci.y) * Math.min(1, dt * 18);
        sim.pciLiveX = pci.x;
        sim.pciLiveY = pci.y;
        sim.deliveryMode = activeDeliveryMode;
        if (sim.umpCallTimer > 0) {
          sim.umpCallTimer = Math.max(0, sim.umpCallTimer - dt);
          if (sim.umpCallTimer === 0) sim.umpCall = '';
        }

        const desiredCam = sim.phase === 'flight' ? 1 : 0;
        sim.camT += (desiredCam - sim.camT) * Math.min(1, dt * 5.2);

        const st = STADIUMS[activeStadiumId] || STADIUMS.omaha;
        const bat = BATS[activeBatId] || BATS['goods-2026'];

        // Advance State Machine & Compute 3D World Ball Positions
        if (sim.phase === 'windup') {
          sim.t += dt / (activeDeliveryMode === 'machine' ? 0.16 : 0.42);
          if (sim.t >= 1) {
            sim.phase = 'pitch';
            sim.t = 0;
          }
        } else if (sim.phase === 'pitch' && sim.pitch) {
          sim.t += dt / sim.pitch.dur;
          const pFrac = Math.min(1, sim.t / 1.06);
          const samples = sim.pitch.samples;
          if (samples && samples.length > 1) {
            const fIdx = pFrac * (samples.length - 1);
            const i0 = Math.floor(fIdx);
            const i1 = Math.min(samples.length - 1, i0 + 1);
            const alpha = fIdx - i0;
            sim.pitchPos = {
              x: samples[i0].x + (samples[i1].x - samples[i0].x) * alpha,
              y: samples[i0].y + (samples[i1].y - samples[i0].y) * alpha,
              z: samples[i0].z + (samples[i1].z - samples[i0].z) * alpha
            };
          }

          if (sim.demoAutoSwing || autoPciMode) {
            pci.targetX = sim.pitch.endX;
            pci.targetY = sim.pitch.endY + (sim.demoAutoSwing ? 0.28 : 0.22);
          }

          if (sim.demoAutoSwing && !sim.swingTriggered && sim.t >= 0.87) {
            triggerSwingPress();
          }

          // Smooth bat whip synchronization: bat physically sweeps to home plate to collide directly with the baseball!
          if (sim.swingTriggered && sim.phase === 'pitch') {
            sim.swingT += dt * 13.5;
            sim.swingAngle = Math.min(0.44, -0.42 + Math.min(1, sim.swingT) * 0.86);
            if (!sim.contactResolved && ((sim.swingT >= 0.92 && sim.t >= 0.90) || (sim.swingT >= 0.96 && sim.swingPressT >= 0.88) || (sim.t >= 1.05 && sim.swingT >= 0.85))) {
              sim.swingAngle = 0.36; // Exact barrel-at-plate contact frame!
              resolveSwing();
            }
          }

          if (sim.t >= 1.06 && sim.phase === 'pitch') {
            if (sim.swingTriggered && !sim.contactResolved) {
              // Hold plate-crossing briefly so late swing finishes whipping to the ball instead of calling a strike!
              sim.t = 1.06;
            } else {
              if (!sim.contactResolved) {
                playBatAudio('mitt');
                const isStrike = Math.abs(sim.pitch.endX) <= 1.05 && Math.abs(sim.pitch.endY) <= 1.05;
                let call = isStrike ? 'Called Strike' : 'Ball';
                let umpAction = isStrike ? 'strike' : 'ball';
                if (isStrike) {
                  session.strikes++;
                  if (session.strikes >= 3) {
                    call = 'Called Strikeout!';
                    umpAction = 'strikeout';
                    session.balls = 0;
                    session.strikes = 0;
                    session.outs = (session.outs + 1) % 3;
                  }
                } else {
                  session.balls++;
                  if (session.balls >= 4) {
                    call = 'Base on Balls!';
                    session.balls = 0;
                    session.strikes = 0;
                  }
                }
                sim.umpCall = umpAction;
                sim.umpCallTimer = 1.45;
                sim.calloutText = call.toUpperCase();
                sim.calloutSub = sim.pitch.name;
                sim.calloutTimer = 1.25;
                updateSessionDom({ exitVelo: null, launchAngle: null, dist: null, apex: null, hangTime: null, backspinRpm: null, outcome: call, color: isStrike ? '#f87171' : '#38bdf8' });
                if (swingBtn) swingBtn.textContent = 'Throw Pitch';
              }
              sim.phase = 'idle';
            }
          }
        } else if (sim.phase === 'flight' && sim.flight) {
          const fl = sim.flight;
          fl.playTime += dt * 1.05;
          sim.swingAngle = Math.min(0.95, sim.swingAngle + dt * 5.2);

          if (fl.wallHit && !fl.wallThudPlayed && fl.wallHitTime && fl.playTime >= fl.wallHitTime) {
            fl.wallThudPlayed = true;
            playBatAudio('wall', 0.65, false, activeStadiumId);
          }
          if (fl.netHitTime && !fl.netThudPlayed && fl.playTime >= fl.netHitTime) {
            fl.netThudPlayed = true;
            playBatAudio('net', 0.72, false, activeStadiumId);
          }
          if (fl.netHit2Time && !fl.net2Played && fl.playTime >= fl.netHit2Time) {
            fl.net2Played = true;
            playBatAudio('net', 0.45, false, activeStadiumId);
          }
          if (fl.seatHitTime && !fl.seatSoundPlayed && fl.playTime >= fl.seatHitTime) {
            fl.seatSoundPlayed = true;
            playBatAudio(fl.seatSoundType || 'seat', 0.85, fl.isHr, activeStadiumId);
          }
          if (fl.seatBounce2Time && !fl.seatBounce2Played && fl.playTime >= fl.seatBounce2Time) {
            fl.seatBounce2Played = true;
            playBatAudio('concrete', 0.52, fl.isHr, activeStadiumId);
          }
          if (!fl.telemetryRevealed && fl.playTime >= fl.revealTime) {
            finalizeFlightTelemetry(fl);
          }

          const progress = Math.min(1, fl.playTime / Math.max(0.8, fl.totalTime));
          const maxIdx = Math.max(1, Math.floor(progress * (fl.points.length - 1)));
          sim.flightMaxIdx = maxIdx;
          sim.flightCur = fl.points[maxIdx];

          if (fl.playTime >= fl.totalTime + 1.15) {
            if (!fl.telemetryRevealed) finalizeFlightTelemetry(fl);
            sim.phase = 'idle';
            sim.swingAngle = -0.42;
          }
        } else if (sim.followThroughTimer > 0) {
          sim.followThroughTimer = Math.max(0, sim.followThroughTimer - dt);
          sim.swingAngle = Math.min(0.95, sim.swingAngle + dt * 5.2);
        } else {
          sim.swingAngle += ((-0.42 + Math.sin(ts * 0.0022) * 0.028) - sim.swingAngle) * Math.min(1, dt * 8);
        }

        if (sim.rapAnimT < 1) {
          sim.rapAnimT = Math.min(1, sim.rapAnimT + dt * 1.45);
          if (activeTelemetryView !== 'zone') drawTelemetryCanvas();
        }
        if (sim.rapZoneAnimT < 1) {
          sim.rapZoneAnimT = Math.min(1, sim.rapZoneAnimT + dt * 1.55);
          if (activeTelemetryView === 'zone') drawTelemetryCanvas();
        }
        if (sim.phase === 'pitch' && activeTelemetryView === 'zone') {
          drawTelemetryCanvas();
        }
        if (sim.phase === 'flight' && (activeTelemetryView === 'arc' || activeTelemetryView === 'spray')) {
          drawTelemetryCanvas();
        }

        // Render True 3D Three.js Ballpark on #cage-canvas
        if (engine3D) {
          engine3D.updateAndRender(sim, dt);
        }

        // Draw Transparent Broadcast HUD Overlay on #pci-hud-canvas
        if (hctx) {
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          const hw = LOG_W * dpr;
          const hh = LOG_H * dpr;
          if (hudCanvas.width !== hw || hudCanvas.height !== hh) {
            hudCanvas.width = hw;
            hudCanvas.height = hh;
          }
          hctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          hctx.clearRect(0, 0, LOG_W, LOG_H);

          const zr = getStrikeZoneHudRect();
          const zoneAlpha = Math.max(0, 1 - sim.camT * 1.9);

          if (zoneAlpha > 0.02) {
            hctx.save();
            hctx.globalAlpha = zoneAlpha;

            // 3x3 Glass Strike Zone
            hctx.fillStyle = 'rgba(10, 18, 32, 0.14)';
            hctx.fillRect(zr.x, zr.y, zr.w, zr.h);
            hctx.strokeStyle = 'rgba(248, 250, 252, 0.72)';
            hctx.lineWidth = 1.8;
            hctx.strokeRect(zr.x, zr.y, zr.w, zr.h);

            hctx.strokeStyle = 'rgba(248, 250, 252, 0.24)';
            hctx.lineWidth = 1;
            for (let g = 1; g <= 2; g++) {
              hctx.beginPath();
              hctx.moveTo(zr.x + (zr.w * g) / 3, zr.y);
              hctx.lineTo(zr.x + (zr.w * g) / 3, zr.y + zr.h);
              hctx.stroke();
              hctx.beginPath();
              hctx.moveTo(zr.x, zr.y + (zr.h * g) / 3);
              hctx.lineTo(zr.x + zr.w, zr.y + (zr.h * g) / 3);
              hctx.stroke();
            }

            // MLB The Show 3-Layer Dynamic PCI Reticle (Outer Coverage Arcs + Inner Curved Barrel Wings + 3 Sweet-Spot Pips)
            const drawPciX = zr.cx + pci.x * (zr.w * 0.5);
            const drawPciY = zr.cy + pci.y * (zr.h * 0.5);
            const rxOuter = 32 * bat.sweetSpot;
            const ryOuter = 21 * bat.sweetSpot;
            const rxInner = 16 * bat.sweetSpot;
            const ryInner = 10.5 * bat.sweetSpot;

            const inTimingWin = sim.phase === 'pitch' && sim.t >= 0.82 && sim.t <= 1.04;
            const pciAccent = inTimingWin ? '#22c55e' : autoPciMode ? '#fbbf24' : '#38bdf8';

            // 1. Segmented Outer Coverage Wing Brackets (left & right arcs)
            hctx.strokeStyle = pciAccent;
            hctx.globalAlpha = zoneAlpha * 0.72;
            hctx.lineWidth = 2.0;
            [
              [-0.82, 0.82],
              [Math.PI - 0.82, Math.PI + 0.82]
            ].forEach(([a0, a1]) => {
              hctx.beginPath();
              hctx.ellipse(drawPciX, drawPciY, rxOuter, ryOuter, 0, a0, a1);
              hctx.stroke();
            });

            // 2. Inner Barrel Brackets + Translucent Zone Glow
            hctx.globalAlpha = zoneAlpha;
            hctx.fillStyle = inTimingWin ? 'rgba(34, 197, 94, 0.22)' : 'rgba(56, 189, 248, 0.16)';
            hctx.beginPath();
            hctx.ellipse(drawPciX, drawPciY, rxInner, ryInner, 0, 0, Math.PI * 2);
            hctx.fill();
            hctx.strokeStyle = '#ffffff';
            hctx.lineWidth = 1.6;
            [
              [-0.95, 0.95],
              [Math.PI - 0.95, Math.PI + 0.95]
            ].forEach(([a0, a1]) => {
              hctx.beginPath();
              hctx.ellipse(drawPciX, drawPciY, rxInner, ryInner, 0, a0, a1);
              hctx.stroke();
            });

            // 3. Three Vertical MLB The Show Barrel Diamonds / Pips
            [-5.2, 0, 5.2].forEach((dy, idx) => {
              hctx.fillStyle = idx === 1 ? (inTimingWin ? '#4ade80' : '#fde047') : 'rgba(255,255,255,0.88)';
              hctx.beginPath();
              hctx.arc(drawPciX, drawPciY + dy, idx === 1 ? 3.0 : 1.9, 0, Math.PI * 2);
              hctx.fill();
            });

            // Post-Swing MLB The Show Plate Feedback Box (shows exact PCI placement vs Pitch after contact/whiff)
            if (sim.swingFeedback && sim.swingFeedback.timer > 0) {
              sim.swingFeedback.timer = Math.max(0, sim.swingFeedback.timer - dt);
              const fb = sim.swingFeedback;
              const fbPxX = zr.cx + fb.pitchX * (zr.w * 0.5);
              const fbPxY = zr.cy + fb.pitchY * (zr.h * 0.5);
              const fbPcX = zr.cx + fb.pciX * (zr.w * 0.5);
              const fbPcY = zr.cy + fb.pciY * (zr.h * 0.5);
              hctx.save();
              hctx.globalAlpha = Math.min(1, fb.timer) * zoneAlpha * 0.92;
              hctx.strokeStyle = 'rgba(253, 224, 71, 0.72)';
              hctx.setLineDash([3, 3]);
              hctx.beginPath();
              hctx.ellipse(fbPcX, fbPcY, rxInner, ryInner, 0, 0, Math.PI * 2);
              hctx.stroke();
              hctx.setLineDash([]);
              hctx.fillStyle = '#ffffff';
              hctx.strokeStyle = '#ef4444';
              hctx.lineWidth = 1.6;
              hctx.beginPath();
              hctx.arc(fbPxX, fbPxY, 4.4, 0, Math.PI * 2);
              hctx.fill();
              hctx.stroke();
              hctx.restore();
            }

            // Shrinking Timing Ring around Plate Target during incoming pitch
            if (sim.phase === 'pitch' && sim.pitch) {
              const targetPx = zr.cx + sim.pitch.endX * (zr.w * 0.5);
              const targetPy = zr.cy + sim.pitch.endY * (zr.h * 0.5);
              const p = Math.min(1.06, sim.t);
              const ringR = Math.max(8, (1 - Math.min(1, p)) * 42 + 8);
              const inWindow = p >= 0.82 && p <= 1.04;
              hctx.strokeStyle = inWindow ? '#22c55e' : 'rgba(255,255,255,0.6)';
              hctx.lineWidth = inWindow ? 2.6 : 1.4;
              hctx.setLineDash([4, 3]);
              hctx.beginPath();
              hctx.arc(targetPx, targetPy, ringR, 0, Math.PI * 2);
              hctx.stroke();
              hctx.setLineDash([]);
            }
            hctx.restore();
          }

          // Contact Impact Flash
          if (sim.flashTimer > 0) {
            sim.flashTimer = Math.max(0, sim.flashTimer - dt * 4);
            hctx.save();
            hctx.strokeStyle = sim.flashColor;
            hctx.globalAlpha = sim.flashTimer;
            hctx.lineWidth = 3;
            hctx.beginPath();
            hctx.arc(zr.cx, zr.cy, (1 - sim.flashTimer) * 48 + 10, 0, Math.PI * 2);
            hctx.stroke();
            hctx.restore();
          }

          // Clean Broadcast Bat & Stadium Corner Tags
          hctx.fillStyle = 'rgba(10, 18, 32, 0.82)';
          hctx.fillRect(14, 12, 248, 28);
          hctx.strokeStyle = bat.accentColor;
          hctx.lineWidth = 1.4;
          hctx.strokeRect(14, 12, 248, 28);
          hctx.fillStyle = '#f8fafc';
          hctx.font = '700 11px "Outfit", sans-serif';
          hctx.textAlign = 'left';
          hctx.fillText(`${bat.name.toUpperCase()}`, 24, 30);

          hctx.fillStyle = 'rgba(10, 18, 32, 0.82)';
          hctx.fillRect(LOG_W - 184, 12, 170, 28);
          hctx.strokeStyle = 'rgba(255,255,255,0.22)';
          hctx.strokeRect(LOG_W - 184, 12, 170, 28);
          hctx.fillStyle = '#fde68a';
          hctx.font = '700 10.5px "IBM Plex Mono", monospace';
          hctx.textAlign = 'right';
          hctx.fillText(`${st.name.toUpperCase()}`, LOG_W - 24, 30);

          // Broadcast Outcome Banner
          if (sim.calloutTimer > 0) {
            sim.calloutTimer = Math.max(0, sim.calloutTimer - dt);
            hctx.save();
            hctx.globalAlpha = Math.min(1, sim.calloutTimer * 2);
            hctx.fillStyle = 'rgba(10, 18, 32, 0.9)';
            hctx.fillRect(LOG_W / 2 - 155, 48, 310, 44);
            hctx.strokeStyle = sim.flashColor || '#38bdf8';
            hctx.lineWidth = 1.6;
            hctx.strokeRect(LOG_W / 2 - 155, 48, 310, 44);
            hctx.fillStyle = sim.flashColor || '#38bdf8';
            hctx.font = '700 14px "Outfit", sans-serif';
            hctx.textAlign = 'center';
            hctx.fillText(sim.calloutText, LOG_W / 2, 67);
            hctx.fillStyle = '#e2e8f0';
            hctx.font = '600 10.5px "IBM Plex Mono", monospace';
            hctx.fillText(sim.calloutSub, LOG_W / 2, 83);
            hctx.restore();
          }
        }

        scheduleNextFrame();
      }

      // Pointer / Mouse / Touch PCI Aiming inside Canvas
      function movePciFromEvent(clientX, clientY) {
        const rect = cageCanvas.getBoundingClientRect();
        const nx = ((clientX - rect.left) / rect.width) * LOG_W;
        const ny = ((clientY - rect.top) / rect.height) * LOG_H;
        const zr = getStrikeZoneHudRect();
        pci.targetX = Math.max(-1.45, Math.min(1.45, (nx - zr.cx) / (zr.w * 0.5)));
        pci.targetY = Math.max(-1.45, Math.min(1.45, (ny - zr.cy) / (zr.h * 0.5)));
      }

      cageCanvas.addEventListener('pointermove', (e) => {
        cageEngaged = true;
        if (!autoPciMode) movePciFromEvent(e.clientX, e.clientY);
      });

      cageCanvas.addEventListener('pointerdown', (e) => {
        cageEngaged = true;
        if (!autoPciMode) movePciFromEvent(e.clientX, e.clientY);
        if (sim.phase === 'pitch') {
          triggerSwingPress();
        }
      });

      document.addEventListener('keydown', (e) => {
        const tag = document.activeElement?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        if (!cageEngaged) return;
        keysDown.add(e.key);
        if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
          e.preventDefault();
        }
        if (e.key === ' ') {
          if (sim.phase === 'pitch') {
            triggerSwingPress();
          } else if (sim.phase === 'idle') {
            launchPitch(false);
          }
        }
      });
      document.addEventListener('keyup', (e) => keysDown.delete(e.key));

      if (batRack) {
        batRack.onclick = (e) => {
          const btn = e.target.closest('[data-bat]');
          if (!btn) return;
          cageEngaged = true;
          activeBatId = btn.dataset.bat;
          batRack.querySelectorAll('[data-bat]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
          updateBatDom();
        };
      }

      function renderStadiumButtonsForTier(tierKey, selectedId) {
        const tierIds = STADIUM_TIERS[tierKey] || STADIUM_TIERS.college;
        activeStadiumTier = tierKey;
        activeStadiumId = tierIds.includes(selectedId) ? selectedId : tierIds[0];

        if (stadiumTierTabs) {
          stadiumTierTabs.querySelectorAll('[data-tier]').forEach((b) => {
            b.setAttribute('aria-pressed', String(b.dataset.tier === tierKey));
          });
        }
        if (stadiumTabs) {
          stadiumTabs.innerHTML = tierIds
            .map((id) => {
              const stSpec = STADIUMS[id];
              return `<button type="button" class="segmented-btn" data-stadium="${escapeHtml(id)}" aria-pressed="${String(id === activeStadiumId)}">${escapeHtml(stSpec ? stSpec.shortName : id)}</button>`;
            })
            .join('');
        }
        if (engine3D) engine3D.setStadium(activeStadiumId);
        drawSprayChart();
      }

      if (stadiumTierTabs) {
        stadiumTierTabs.onclick = (e) => {
          const btn = e.target.closest('[data-tier]');
          if (!btn) return;
          cageEngaged = true;
          const nextTier = btn.dataset.tier || 'college';
          renderStadiumButtonsForTier(nextTier, activeStadiumId);
          const activeSpec = STADIUMS[activeStadiumId];
          if (pitchNote && activeSpec) {
            pitchNote.textContent = `${activeSpec.dimsLabel} · Ready in ${nextTier.toUpperCase()} tier.`;
          }
        };
      }

      if (stadiumTabs) {
        stadiumTabs.onclick = (e) => {
          const btn = e.target.closest('[data-stadium]');
          if (!btn) return;
          cageEngaged = true;
          const nextId = btn.dataset.stadium;
          if (!STADIUMS[nextId]) return;
          activeStadiumId = nextId;
          activeStadiumTier = STADIUMS[nextId].tier || activeStadiumTier;
          stadiumTabs.querySelectorAll('[data-stadium]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
          if (engine3D) engine3D.setStadium(activeStadiumId);
          drawSprayChart();
        };
      }

      if (deliveryTabs) {
        deliveryTabs.onclick = (e) => {
          const btn = e.target.closest('[data-delivery]');
          if (!btn) return;
          cageEngaged = true;
          activeDeliveryMode = btn.dataset.delivery === 'machine' ? 'machine' : 'pitcher';
          sim.deliveryMode = activeDeliveryMode;
          deliveryTabs.querySelectorAll('[data-delivery]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
          if (engine3D && engine3D.setDeliveryMode) engine3D.setDeliveryMode(activeDeliveryMode);
          if (pitchNote) {
            pitchNote.textContent =
              activeDeliveryMode === 'machine'
                ? 'Dual-wheel pitching machine active — steady release plane.'
                : `Live ${pitcherHand}HP on the mound — windup & release active.`;
          }
        };
      }

      if (pitchTabs) {
        pitchTabs.onclick = (e) => {
          const btn = e.target.closest('[data-pitch]');
          if (!btn) return;
          cageEngaged = true;
          selectedPitchType = btn.dataset.pitch;
          pitchTabs.querySelectorAll('[data-pitch]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
        };
      }

      if (windTabs) {
        windTabs.onclick = (e) => {
          const btn = e.target.closest('[data-wind]');
          if (!btn) return;
          cageEngaged = true;
          activeWindId = btn.dataset.wind;
          const wSpec = WIND_PRESETS[activeWindId] || WIND_PRESETS.calm;
          sim.windVec = { x: wSpec.vx, y: wSpec.vy };
          windTabs.querySelectorAll('[data-wind]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
          if (pitchNote) pitchNote.textContent = `Wind set to ${wSpec.label} · RK4 physics updated.`;
        };
      }

      if (batterHandTabs) {
        batterHandTabs.onclick = (e) => {
          const btn = e.target.closest('[data-bhand]');
          if (!btn) return;
          cageEngaged = true;
          batterHand = btn.dataset.bhand === 'L' ? 'L' : 'R';
          batterHandTabs.querySelectorAll('[data-bhand]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
          if (engine3D && engine3D.setBatterHand) engine3D.setBatterHand(batterHand);
          drawTelemetryCanvas();
          if (pitchNote) pitchNote.textContent = `Batter set to ${batterHand === 'L' ? 'Left-Handed (LHB)' : 'Right-Handed (RHB)'} · Pull & 3D box mirrored.`;
        };
      }

      if (pitcherHandTabs) {
        pitcherHandTabs.onclick = (e) => {
          const btn = e.target.closest('[data-phand]');
          if (!btn) return;
          cageEngaged = true;
          pitcherHand = btn.dataset.phand === 'L' ? 'L' : 'R';
          pitcherHandTabs.querySelectorAll('[data-phand]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
          if (engine3D && engine3D.setPitcherHand) engine3D.setPitcherHand(pitcherHand);
          drawTelemetryCanvas();
          if (pitchNote) pitchNote.textContent = `Pitcher set to ${pitcherHand === 'L' ? 'Left-Handed (LHP)' : 'Right-Handed (RHP)'} · Release & horizontal break mirrored.`;
        };
      }

      if (cameraTabs) {
        cameraTabs.onclick = (e) => {
          const btn = e.target.closest('[data-cam]');
          if (!btn) return;
          cageEngaged = true;
          activeCameraMode = btn.dataset.cam;
          cameraTabs.querySelectorAll('[data-cam]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
          if (engine3D && engine3D.setCameraMode) engine3D.setCameraMode(activeCameraMode);
        };
      }

      if (swingBtn) {
        swingBtn.onclick = () => {
          cageEngaged = true;
          if (sim.phase === 'pitch') {
            triggerSwingPress();
          } else {
            launchPitch(false);
          }
        };
      }

      if (demoBtn) {
        demoBtn.onclick = () => {
          cageEngaged = true;
          if (sim.phase === 'windup' || sim.phase === 'pitch') return;
          launchPitch(true);
        };
      }

      if (pciModeBtn) {
        pciModeBtn.onclick = () => {
          cageEngaged = true;
          autoPciMode = !autoPciMode;
          pciModeBtn.setAttribute('aria-pressed', String(autoPciMode));
          pciModeBtn.textContent = autoPciMode ? 'PCI: Auto' : 'PCI: Manual';
        };
      }

      if (soundBtn) {
        soundBtn.onclick = () => {
          soundOn = !soundOn;
          soundBtn.setAttribute('aria-pressed', String(soundOn));
          soundBtn.textContent = soundOn ? 'Sound: On' : 'Sound: Off';
        };
      }

      if (sprayClearBtn) {
        sprayClearBtn.onclick = () => {
          session.sprays = [];
          session.lastHit = null;
          session.hits = 0;
          session.hrs = 0;
          session.balls = 0;
          session.strikes = 0;
          session.outs = 0;
          updateSessionDom({
            exitVelo: null,
            launchAngle: null,
            dist: null,
            carryDist: null,
            apex: null,
            batSpeed: null,
            smashFactor: null,
            attackAngle: null,
            outcome: 'Telemetry Cleared',
            color: 'var(--accent)'
          });
        };
      }

      if (rapsodoViewTabs) {
        rapsodoViewTabs.onclick = (e) => {
          const btn = e.target.closest('[data-rview]');
          if (!btn) return;
          activeTelemetryView = btn.dataset.rview;
          rapsodoViewTabs.querySelectorAll('[data-rview]').forEach((b) => {
            b.setAttribute('aria-pressed', String(b === btn));
          });
          drawTelemetryCanvas();
        };
      }

      renderStadiumButtonsForTier(activeStadiumTier, activeStadiumId);
      updateBatDom();
      updateSessionDom();
      requestAnimationFrame(renderFrame);
    }

    // 4. Interactive 5-Expert Roster switcher
    const rosterList = document.getElementById('expert-roster-list');
    const spotRole = document.getElementById('roster-spot-role');
    const spotTitle = document.getElementById('roster-spot-title');
    const spotFocus = document.getElementById('roster-spot-focus');
    if (rosterList && spotRole && spotTitle && spotFocus) {
      rosterList.onclick = (e) => {
        const btn = e.target.closest('[data-expert]');
        if (!btn) return;
        const idx = Number(btn.dataset.expert);
        const exp = EXPERT_DESCRIPTIONS[idx];
        if (!exp) return;
        spotRole.textContent = exp.role;
        spotTitle.textContent = exp.title;
        spotFocus.textContent = exp.focus;
        rosterList.querySelectorAll('[data-expert]').forEach((b) => {
          b.setAttribute('aria-pressed', String(b === btn));
        });
      };
    }
  }

  /* =========================================================
     Page 2: Scenario Library (Search, Filter, Sort, Pagination, Favorites)
     ========================================================= */
  async function initScenariosPage() {
    const listEl = document.getElementById('scenario-list');
    if (!listEl) return;

    const searchBox = document.getElementById('search-box');
    const catTabs = document.getElementById('category-tabs');
    const sortBy = document.getElementById('sort-by');
    const perPageSelect = document.getElementById('per-page');
    const countEl = document.getElementById('scenario-count');
    const emptyEl = document.getElementById('empty-state');
    const emptyMsgEl = document.getElementById('empty-state-msg');
    const pageBar = document.getElementById('pagination-bar');
    const prevBtn = document.getElementById('prev-page-btn');
    const nextBtn = document.getElementById('next-page-btn');
    const pageIndicator = document.getElementById('page-indicator');

    let activeCategory = 'all';
    let currentPage = 1;
    let favoriteIds = new Set();
    let lastScenarios = [];

    const diffWord = (d) => (d === 1 ? 'Easy' : d === 2 ? 'Medium' : 'Advanced');

    async function refreshFavorites() {
      try {
        const res = await api('/api/favorites');
        favoriteIds = new Set(res.favorites || []);
      } catch {
        favoriteIds = new Set();
      }
    }

    function renderGrid() {
      const total = lastScenarios.length;
      if (countEl) countEl.textContent = `${total} ${total === 1 ? 'play' : 'plays'}`;

      if (total === 0) {
        listEl.innerHTML = '';
        if (emptyEl) emptyEl.hidden = false;
        if (emptyMsgEl) {
          if (activeCategory === 'saved' && !currentUser) {
            emptyMsgEl.textContent = 'Log in to view your saved favorite plays!';
          } else if (activeCategory === 'saved') {
            emptyMsgEl.textContent = 'No favorite plays yet. Click "Save" on any play card to bookmark it.';
          } else {
            emptyMsgEl.textContent = 'No plays match your search. Try a different keyword!';
          }
        }
        if (pageBar) pageBar.hidden = true;
        return;
      }

      if (emptyEl) emptyEl.hidden = true;
      const perVal = perPageSelect ? perPageSelect.value : 'all';
      const pageSize = perVal === 'all' ? total : Number(perVal) || 6;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      if (currentPage > totalPages) currentPage = totalPages;

      const start = (currentPage - 1) * pageSize;
      const pageItems = lastScenarios.slice(start, start + pageSize);

      if (pageBar) {
        pageBar.hidden = totalPages <= 1;
        if (pageIndicator) pageIndicator.textContent = `Page ${currentPage} of ${totalPages}`;
        if (prevBtn) prevBtn.disabled = currentPage <= 1;
        if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
      }

      listEl.innerHTML = pageItems
        .map((s) => {
          const isFav = favoriteIds.has(s.id);
          const bars = [1, 2, 3]
            .map((n) => `<span class="${n <= s.difficulty ? 'is-on' : ''}"></span>`)
            .join('');
          return `
          <li>
            <article class="card scenario-card">
              <div>
                <div class="card-diagram-thumb">${renderDiagramSvg(s.diagram, 1)}</div>
                <div class="meta-line">
                  <span>${escapeHtml(s.categoryLabel)}</span>
                  <span aria-hidden="true">·</span>
                  <span>${diffWord(s.difficulty)}</span>
                  <span aria-hidden="true">·</span>
                  <span class="mini-meter" role="img" aria-label="Difficulty ${s.difficulty} of 3">${bars}</span>
                </div>
                <h2><a href="detail.html?id=${encodeURIComponent(s.id)}">${escapeHtml(s.title)}</a></h2>
                <p class="scenario-desc">${escapeHtml(s.shortSummary)}</p>
              </div>
              <div class="card-footer-row">
                <a class="btn btn-primary btn-sm" href="detail.html?id=${encodeURIComponent(s.id)}">Open Breakdown</a>
                <button type="button" class="btn btn-secondary btn-sm btn-fav ${isFav ? 'is-saved' : ''}" data-fav-id="${escapeHtml(s.id)}" aria-pressed="${isFav}">
                  ${isFav ? 'Saved' : 'Save'}
                </button>
              </div>
            </article>
          </li>`;
        })
        .join('');
    }

    async function fetchAndRender() {
      const q = searchBox ? searchBox.value.trim() : '';
      const sort = sortBy ? sortBy.value : 'az';
      const params = new URLSearchParams({ q, category: activeCategory, sort });
      if (emptyEl) emptyEl.hidden = true;
      if (!lastScenarios.length) {
        listEl.innerHTML = '<li class="card" style="grid-column:1/-1;color:var(--text-secondary);">Loading plays...</li>';
      }
      try {
        await refreshFavorites();
        const data = await api(`/api/scenarios?${params.toString()}`);
        lastScenarios = data.scenarios || [];
        renderGrid();
      } catch {
        listEl.innerHTML = '';
        if (emptyEl && emptyMsgEl) {
          emptyMsgEl.textContent = 'Could not load plays right now. Please refresh the page.';
          emptyEl.hidden = false;
        }
        showToast('Could not load scenarios.');
      }
    }

    if (searchBox) {
      let timer = null;
      searchBox.oninput = () => {
        currentPage = 1;
        clearTimeout(timer);
        timer = setTimeout(fetchAndRender, 140);
      };
    }

    if (catTabs) {
      catTabs.onclick = (e) => {
        const btn = e.target.closest('[data-cat]');
        if (!btn) return;
        activeCategory = btn.dataset.cat;
        currentPage = 1;
        catTabs.querySelectorAll('[data-cat]').forEach((b) => {
          b.setAttribute('aria-pressed', String(b === btn));
        });
        fetchAndRender();
      };
    }

    if (sortBy) {
      sortBy.onchange = () => {
        currentPage = 1;
        fetchAndRender();
      };
    }

    if (perPageSelect) {
      perPageSelect.onchange = () => {
        currentPage = 1;
        renderGrid();
      };
    }

    if (prevBtn) {
      prevBtn.onclick = () => {
        if (currentPage > 1) {
          currentPage--;
          renderGrid();
        }
      };
    }

    if (nextBtn) {
      nextBtn.onclick = () => {
        currentPage++;
        renderGrid();
      };
    }

    listEl.onclick = async (e) => {
      const favBtn = e.target.closest('[data-fav-id]');
      if (!favBtn || favBtn.disabled) return;
      if (!currentUser) {
        showToast('Log in first — opening Log In page...');
        setTimeout(() => {
          window.location.href = 'login.html?next=scenarios.html';
        }, 700);
        return;
      }
      const sid = favBtn.dataset.favId;
      const isSaved = favoriteIds.has(sid);
      favBtn.disabled = true;
      try {
        const res = await api(`/api/favorites/${encodeURIComponent(sid)}`, {
          method: isSaved ? 'DELETE' : 'POST'
        });
        favoriteIds = new Set(res.favorites || []);
        showToast(isSaved ? 'Removed from saved plays.' : 'Saved to favorites!');
        if (activeCategory === 'saved') {
          await fetchAndRender();
        } else {
          renderGrid();
        }
      } catch (err) {
        favBtn.disabled = false;
        showToast(err.message);
      }
    };

    await fetchAndRender();
  }

  /* =========================================================
     Page 3: Scenario Deep-Dive (Interactive Stage, 5 Experts, Rating, Trivia)
     ========================================================= */
  async function initDetailPage() {
    if (!document.getElementById('deep-dive')) return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id') || 'force-vs-tag';

    try {
      const { scenario, mastered, isFavorite } = await api(`/api/scenarios/${encodeURIComponent(id)}`);
      let savedFav = Boolean(isFavorite);

      document.title = `DiamondIQ — ${scenario.title}`;
      document.getElementById('detail-category').textContent = `${scenario.categoryLabel} · Scenario Deep-Dive`;
      document.getElementById('detail-title').textContent = scenario.title;
      document.getElementById('detail-summary').textContent = scenario.quickTakeaway;
      document.getElementById('detail-key-rule').textContent = scenario.keyRule;

      const masteredNote = document.getElementById('detail-mastered-note');
      if (masteredNote) masteredNote.hidden = !mastered;

      // Favorite toggle
      const favBtn = document.getElementById('detail-fav-btn');
      const syncFavBtn = () => {
        if (!favBtn) return;
        favBtn.setAttribute('aria-pressed', String(savedFav));
        favBtn.classList.toggle('is-saved', savedFav);
        favBtn.textContent = savedFav ? 'Saved Play' : 'Save Play';
      };
      syncFavBtn();

      if (favBtn) {
        favBtn.onclick = async () => {
          if (favBtn.disabled) return;
          if (!currentUser) {
            showToast('Log in first — opening Log In page...');
            setTimeout(() => {
              window.location.href = `login.html?next=${encodeURIComponent(`detail.html?id=${scenario.id}`)}`;
            }, 700);
            return;
          }
          favBtn.disabled = true;
          try {
            await api(`/api/favorites/${encodeURIComponent(scenario.id)}`, {
              method: savedFav ? 'DELETE' : 'POST'
            });
            savedFav = !savedFav;
            syncFavBtn();
            showToast(savedFav ? 'Saved to favorites!' : 'Removed from favorites.');
          } catch (err) {
            showToast(err.message);
          } finally {
            favBtn.disabled = false;
          }
        };
      }

      // Interactive Play Stepper Stage
      const stage = document.getElementById('detail-diamond-stage');
      const stepGroup = document.getElementById('detail-step-controls');
      const capEl = document.getElementById('detail-diagram-caption');
      const stepDescriptions = [
        `Setup: ${scenario.shortSummary}`,
        scenario.diagram?.caption || scenario.quickTakeaway,
        `${scenario.diagram?.callout || ''} — ${scenario.keyRule}`
      ];

      const setDetailStep = (idx) => {
        if (stage) stage.innerHTML = renderDiagramSvg(scenario.diagram, idx);
        if (capEl) capEl.textContent = stepDescriptions[idx] || stepDescriptions[1];
        if (stepGroup) {
          stepGroup.querySelectorAll('[data-dstep]').forEach((b) => {
            b.setAttribute('aria-pressed', String(Number(b.dataset.dstep) === idx));
          });
        }
      };
      setDetailStep(1);
      if (stepGroup) {
        stepGroup.onclick = (e) => {
          const btn = e.target.closest('[data-dstep]');
          if (!btn) return;
          setDetailStep(Number(btn.dataset.dstep));
        };
      }

      // 5-Star Rating Widget
      const ratingStars = document.getElementById('rating-stars');
      const ratingSummary = document.getElementById('rating-summary');
      const renderRating = (rating) => {
        if (ratingSummary) {
          ratingSummary.textContent = rating.count
            ? `${rating.average} / 5 (${rating.count} ${rating.count === 1 ? 'vote' : 'votes'})`
            : 'No ratings yet';
        }
        if (ratingStars) {
          ratingStars.querySelectorAll('[data-star]').forEach((b) => {
            const val = Number(b.dataset.star);
            b.classList.toggle('is-filled', val <= (rating.userStars || 0));
          });
        }
      };

      try {
        const ratingData = await api(`/api/scenarios/${encodeURIComponent(scenario.id)}/rating`);
        renderRating(ratingData);
      } catch {
        /* ignore */
      }

      if (ratingStars) {
        ratingStars.onclick = async (e) => {
          const btn = e.target.closest('[data-star]');
          if (!btn || btn.disabled) return;
          if (!currentUser) {
            showToast('Log in first — opening Log In page...');
            setTimeout(() => {
              window.location.href = `login.html?next=${encodeURIComponent(`detail.html?id=${scenario.id}`)}`;
            }, 700);
            return;
          }
          const stars = Number(btn.dataset.star);
          btn.disabled = true;
          try {
            const updated = await api(`/api/scenarios/${encodeURIComponent(scenario.id)}/rating`, {
              method: 'POST',
              body: JSON.stringify({ stars })
            });
            renderRating(updated);
            showToast(`Rated ${stars} out of 5 stars!`);
          } catch (err) {
            showToast(err.message);
          } finally {
            btn.disabled = false;
          }
        };
      }

      // 3-Tier Stat Meters
      const metersGrid = document.getElementById('meters-grid');
      if (metersGrid && Array.isArray(scenario.meters)) {
        metersGrid.innerHTML = scenario.meters
          .map((m) => {
            const segs = [1, 2, 3]
              .map((n) => `<span class="meter-seg ${n <= m.level ? 'is-active' : ''}"></span>`)
              .join('');
            return `
              <div class="meter-card">
                <div class="meter-head">
                  <span class="meter-name">${escapeHtml(m.name)}</span>
                  <span class="meter-tier">${escapeHtml(m.tier)}</span>
                </div>
                <div class="meter-track" role="img" aria-label="${escapeHtml(m.name)}: ${escapeHtml(m.tier)}">
                  ${segs}
                </div>
                <p class="meter-caption">${escapeHtml(m.caption)}</p>
              </div>`;
          })
          .join('');
      }

      // 3x2 Expert Cards
      const expertMeta = [
        { num: '01', key: 'coach', role: 'Baseball Fundamentals', title: 'Youth Baseball Coach', summary: "Coach's Call" },
        { num: '02', key: 'analyst', role: 'Baseball Stats', title: 'Sabermetrics Analyst', summary: 'By the Numbers' },
        { num: '03', key: 'dev', role: 'How It Works', title: 'Web Dev Mentor', summary: 'Behind the Page' },
        { num: '04', key: 'designer', role: 'Design & Clarity', title: 'UI/UX Designer', summary: 'Design Notes' },
        { num: '05', key: 'rookie', role: 'Beginner Take', title: 'Rookie Player', summary: 'Rookie Take' }
      ];
      const isMobile = window.innerWidth < 768;
      const expertGrid = document.getElementById('expert-grid');
      if (expertGrid) {
        const cardsHtml = expertMeta
          .map((em, idx) => {
            const openAttr = !isMobile || idx === 0 ? 'open' : '';
            return `
              <article class="card expert-card">
                <p class="kicker-line">${em.num} · ${escapeHtml(em.role)}</p>
                <h3>${escapeHtml(em.title)}</h3>
                <details ${openAttr}>
                  <summary>${escapeHtml(em.summary)}</summary>
                  <p>${escapeHtml(scenario.experts?.[em.key] || '')}</p>
                </details>
              </article>`;
          })
          .join('');
        const summaryCardHtml = `
          <article class="card summary-card">
            <p class="kicker-line">Key Rule</p>
            <h3>Official Takeaway</h3>
            <p>${escapeHtml(scenario.keyRule)}</p>
            <p style="margin-top:0.75rem;margin-bottom:0;"><a href="compare.html">Compare this play with another</a></p>
          </article>`;
        expertGrid.innerHTML = cardsHtml + summaryCardHtml;
      }

      // Trivia Quiz
      const qEl = document.getElementById('trivia-question');
      const optsEl = document.getElementById('trivia-options');
      const triviaForm = document.getElementById('trivia-form');
      const triviaFeedback = document.getElementById('trivia-feedback');
      if (qEl && optsEl && scenario.trivia) {
        qEl.textContent = scenario.trivia.question;
        optsEl.innerHTML = scenario.trivia.options
          .map(
            (opt) => `
            <label class="trivia-option">
              <input type="radio" name="trivia" value="${escapeHtml(opt.key)}">
              <span>${escapeHtml(opt.text)}</span>
            </label>`
          )
          .join('');
      }

      if (triviaForm) {
        const triviaBtn = triviaForm.querySelector('button[type="submit"]');
        triviaForm.onsubmit = async (e) => {
          e.preventDefault();
          const chosen = triviaForm.querySelector('input[name="trivia"]:checked');
          if (!chosen) {
            setBanner(triviaFeedback, 'warning', 'Pick an answer choice first!');
            return;
          }
          if (triviaBtn) {
            triviaBtn.disabled = true;
            triviaBtn.textContent = 'Checking...';
          }
          try {
            const res = await api(`/api/scenarios/${encodeURIComponent(scenario.id)}/trivia`, {
              method: 'POST',
              body: JSON.stringify({ answerKey: chosen.value })
            });
            if (res.correct) {
              const extra = res.mastered
                ? ' Saved to your mastered plays!'
                : !currentUser
                  ? ' Log in to save your mastery badge.'
                  : '';
              setBanner(triviaFeedback, 'success', `${res.explanation}${extra}`);
              if (res.mastered && masteredNote) masteredNote.hidden = false;
            } else {
              setBanner(triviaFeedback, 'error', `Not quite — ${res.explanation}`);
            }
          } catch (err) {
            setBanner(triviaFeedback, 'error', err.message);
          } finally {
            if (triviaBtn) {
              triviaBtn.disabled = false;
              triviaBtn.textContent = 'Check Answer';
            }
          }
        };
      }
    } catch (err) {
      const titleEl = document.getElementById('detail-title');
      const sumEl = document.getElementById('detail-summary');
      const ruleEl = document.getElementById('detail-key-rule');
      if (titleEl) titleEl.textContent = 'Play not found';
      if (sumEl) {
        sumEl.innerHTML = `${escapeHtml(err.message || 'Could not load this play.')} <a href="scenarios.html">Return to Scenario Library</a>.`;
      }
      if (ruleEl) ruleEl.textContent = 'Pick any of the 8 plays from the Scenario Library.';
    }
  }

  /* =========================================================
     Page 4: Dynamic Play & Stat Comparison
     ========================================================= */
  async function initComparePage() {
    if (!document.getElementById('compare')) return;
    const selA = document.getElementById('play-a');
    const selB = document.getElementById('play-b');
    const thA = document.getElementById('compare-th-a');
    const thB = document.getElementById('compare-th-b');
    const tbody = document.getElementById('compare-tbody');
    const verdict = document.getElementById('compare-verdict');
    if (!selA || !selB || !tbody) return;

    try {
      const { scenarios } = await api('/api/scenarios');
      if (!scenarios || scenarios.length < 2) return;

      const optionsHtml = scenarios
        .map((s) => `<option value="${escapeHtml(s.id)}">${escapeHtml(s.title)}</option>`)
        .join('');
      selA.innerHTML = optionsHtml;
      selB.innerHTML = optionsHtml;

      const defaultA = scenarios.find((s) => s.id === 'force-vs-tag')?.id || scenarios[0].id;
      const defaultB = scenarios.find((s) => s.id === 'tagging-up')?.id || scenarios[1].id;
      selA.value = defaultA;
      selB.value = defaultB;

      const renderBarCell = (meter) => {
        if (!meter) return '<td>—</td>';
        const pct = Math.round((meter.level / 3) * 100);
        return `
          <td>
            <div class="compare-bar-wrap">
              <div class="compare-bar" aria-hidden="true"><div class="compare-bar-fill" style="width:${pct}%;"></div></div>
              <span><strong>${escapeHtml(meter.tier)}</strong> — ${escapeHtml(meter.caption)}</span>
            </div>
          </td>`;
      };

      const renderCompare = () => {
        const a = scenarios.find((s) => s.id === selA.value) || scenarios[0];
        const b = scenarios.find((s) => s.id === selB.value) || scenarios[1];

        if (thA) thA.textContent = a.title;
        if (thB) thB.textContent = b.title;

        tbody.innerHTML = `
          <tr>
            <th scope="row">Category</th>
            <td>${escapeHtml(a.categoryLabel)}</td>
            <td>${escapeHtml(b.categoryLabel)}</td>
          </tr>
          <tr>
            <th scope="row">${escapeHtml(a.meters[0]?.name || 'Execution Difficulty')}</th>
            ${renderBarCell(a.meters[0])}
            ${renderBarCell(b.meters[0])}
          </tr>
          <tr>
            <th scope="row">${escapeHtml(a.meters[1]?.name || 'Tactical Risk')}</th>
            ${renderBarCell(a.meters[1])}
            ${renderBarCell(b.meters[1])}
          </tr>
          <tr>
            <th scope="row">${escapeHtml(a.meters[2]?.name || 'Game Impact')}</th>
            ${renderBarCell(a.meters[2])}
            ${renderBarCell(b.meters[2])}
          </tr>
          <tr>
            <th scope="row">Beginner Takeaway</th>
            <td>${escapeHtml(a.experts?.rookie || a.shortSummary)}</td>
            <td>${escapeHtml(b.experts?.rookie || b.shortSummary)}</td>
          </tr>`;

        if (verdict) {
          if (a.id === b.id) {
            verdict.textContent = `You selected "${a.title}" on both sides. Pick a different second play to compare!`;
          } else if (a.difficulty === b.difficulty) {
            verdict.textContent = `Both plays have the same difficulty level (${a.difficulty}/3). ${a.title} focuses on ${a.categoryLabel.toLowerCase()}, while ${b.title} focuses on ${b.categoryLabel.toLowerCase()}.`;
          } else {
            const easier = a.difficulty < b.difficulty ? a : b;
            const harder = a.difficulty < b.difficulty ? b : a;
            verdict.textContent = `${easier.title} (difficulty ${easier.difficulty}/3) is easier to learn first. ${harder.title} (difficulty ${harder.difficulty}/3) takes extra timing and reading of the game.`;
          }
        }
      };

      selA.onchange = renderCompare;
      selB.onchange = renderCompare;
      renderCompare();
    } catch {
      /* ignore */
    }
  }

  /* =========================================================
     Page 5: My Playbook (Full CRUD + Favorites Shelf)
     ========================================================= */
  async function initPlaybookPage() {
    if (!document.getElementById('playbook')) return;
    const loginNote = document.getElementById('playbook-login-note');
    const userBadge = document.getElementById('playbook-user-badge');
    const form = document.getElementById('playbook-form');
    const editIdInput = document.getElementById('playbook-edit-id');
    const addHeading = document.getElementById('add-heading');
    const titleInput = document.getElementById('note-title');
    const bodyInput = document.getElementById('note-body');
    const ratingSelect = document.getElementById('note-rating');
    const submitBtn = document.getElementById('playbook-submit-btn');
    const cancelBtn = document.getElementById('playbook-cancel-btn');
    const feedback = document.getElementById('playbook-feedback');
    const entriesList = document.getElementById('playbook-entries');
    const emptyState = document.getElementById('playbook-empty');
    const favList = document.getElementById('favorites-list');
    const favEmpty = document.getElementById('favorites-empty');

    const resetForm = () => {
      if (editIdInput) editIdInput.value = '';
      if (titleInput) titleInput.value = '';
      if (bodyInput) bodyInput.value = '';
      if (ratingSelect) ratingSelect.value = '3';
      if (addHeading) addHeading.textContent = 'Add a Play Note';
      if (submitBtn) submitBtn.textContent = 'Add to Playbook';
      if (cancelBtn) cancelBtn.hidden = true;
    };

    const aiCard = document.getElementById('playbook-ai-card');
    const aiKicker = document.getElementById('pb-ai-kicker');
    const aiHeading = document.getElementById('pb-ai-heading');
    const aiSummary = document.getElementById('pb-ai-summary');
    const aiTipsWrap = document.getElementById('pb-ai-tips');
    const aiLinksWrap = document.getElementById('pb-ai-links');
    const prefsCard = document.getElementById('playbook-prefs-card');
    const prefsForm = document.getElementById('playbook-prefs-form');
    const prefsFeedback = document.getElementById('pb-prefs-feedback');

    const loadAiProfile = async () => {
      if (!aiCard) return;
      try {
        const data = await api('/api/onboarding/me');
        const profile = data && data.profile;
        if (!profile) {
          aiCard.hidden = false;
          if (aiKicker) {
            aiKicker.textContent = data && data.onboardingSkipped
              ? 'Skipped Onboarding · Ready Anytime'
              : 'New Feature · AI Player Checkup';
          }
          if (aiHeading) aiHeading.textContent = 'Get Your Personal Swing & Fielding Plan';
          if (aiSummary) {
            aiSummary.textContent = data && data.onboardingSkipped
              ? 'You skipped the initial checkup quiz earlier. Take it whenever you want for custom slow-mo drills and cage bat recommendations, or chat with Coach Jax anytime.'
              : 'Take our 1-minute AI quiz to get tailored fix tips, slow-mo video links, and a matched 3D cage bat.';
          }
          if (aiTipsWrap) {
            aiTipsWrap.hidden = true;
            aiTipsWrap.innerHTML = '';
          }
          if (aiLinksWrap) aiLinksWrap.innerHTML = '';
          const retakeBtn = document.getElementById('pb-ai-retake-link');
          if (retakeBtn) retakeBtn.textContent = 'Take AI Player Quiz';
          return;
        }
        aiCard.hidden = false;
        if (aiKicker) aiKicker.textContent = `${profile.skillTier} · Readiness ${profile.readinessScore}/100 · IQ ${profile.iqCorrectCount}/${profile.iqTotal}`;
        if (aiHeading) aiHeading.textContent = profile.headline || 'Your AI Scouting Profile';
        if (aiSummary) aiSummary.textContent = profile.summary || '';
        if (aiTipsWrap && Array.isArray(profile.actionableTips) && profile.actionableTips.length) {
          aiTipsWrap.hidden = false;
          aiTipsWrap.innerHTML = profile.actionableTips.map((t) => `<li>${escapeHtml(t)}</li>`).join('');
        }
        if (aiLinksWrap) {
          const vids = (profile.videoLinks || []).map(
            (v) => `<a class="btn btn-secondary btn-sm" href="${escapeHtml(v.url)}">Video: ${escapeHtml(v.title)}</a>`
          );
          if (profile.recommendedBatId) {
            vids.push(`<a class="btn btn-secondary btn-sm" href="index.html?bat=${encodeURIComponent(profile.recommendedBatId)}#gameday-studio">Test Bat: ${escapeHtml((profile.recommendedBatName || '').split(' (')[0])}</a>`);
          }
          aiLinksWrap.innerHTML = vids.join('');
        }
      } catch {
        /* ignore */
      }
    };

    if (!currentUser) {
      if (aiCard) aiCard.hidden = true;
      if (prefsCard) prefsCard.hidden = true;
      if (loginNote) loginNote.hidden = false;
      if (userBadge) userBadge.hidden = true;
      if (entriesList) entriesList.innerHTML = '';
      if (emptyState) emptyState.hidden = false;
      if (favList) favList.innerHTML = '';
      if (favEmpty) favEmpty.hidden = false;
      if (form) {
        form.onsubmit = (e) => {
          e.preventDefault();
          setBanner(feedback, 'warning', 'Please log in first to save notes.');
        };
      }
      return;
    }

    if (loginNote) loginNote.hidden = true;
    if (userBadge) {
      userBadge.hidden = false;
      userBadge.textContent = `Signed in as ${currentUser.username}`;
    }

    let entries = [];

    const renderEntries = () => {
      if (!entriesList || !emptyState) return;
      if (entries.length === 0) {
        entriesList.innerHTML = '';
        emptyState.hidden = false;
        return;
      }
      emptyState.hidden = true;
      entriesList.innerHTML = entries
        .map((entry) => {
          const bars = [1, 2, 3, 4, 5]
            .map((n) => `<span class="${n <= entry.rating ? 'is-on' : ''}"></span>`)
            .join('');
          const dateStr = new Date(entry.updatedAt || entry.createdAt).toLocaleDateString();
          return `
          <li>
            <article class="card" data-entry-id="${entry.id}">
              <div class="meta-line">
                <span>Difficulty ${entry.rating}/5</span>
                <span aria-hidden="true">·</span>
                <span class="mini-meter" aria-hidden="true">${bars}</span>
                <span aria-hidden="true">·</span>
                <span>Updated ${escapeHtml(dateStr)}</span>
              </div>
              <h3 style="margin-bottom:0.35rem;">${escapeHtml(entry.title)}</h3>
              <p style="color:var(--text-secondary);white-space:pre-line;margin-bottom:0.85rem;">${escapeHtml(entry.body)}</p>
              <div style="display:flex;flex-wrap:wrap;gap:0.5rem;">
                <button type="button" class="btn btn-secondary btn-sm" data-action="edit" data-id="${entry.id}">Edit</button>
                <button type="button" class="btn btn-danger btn-sm" data-action="delete" data-id="${entry.id}">Delete</button>
              </div>
              <div class="delete-confirm" id="confirm-${entry.id}" hidden>
                <span>Delete this note?</span>
                <button type="button" class="btn btn-danger btn-sm" data-action="confirm-delete" data-id="${entry.id}">Yes, Delete</button>
                <button type="button" class="btn btn-ghost btn-sm" data-action="cancel-delete" data-id="${entry.id}">Cancel</button>
              </div>
            </article>
          </li>`;
        })
        .join('');
    };

    const loadEntries = async () => {
      try {
        const data = await api('/api/playbook');
        entries = data.entries || [];
        renderEntries();
      } catch (err) {
        setBanner(feedback, 'error', err.message);
      }
    };

    const loadFavorites = async () => {
      if (!favList || !favEmpty) return;
      try {
        const [{ favorites }, { scenarios }] = await Promise.all([
          api('/api/favorites'),
          api('/api/scenarios')
        ]);
        const favScenarios = (favorites || [])
          .map((fid) => scenarios.find((s) => s.id === fid))
          .filter(Boolean);
        if (favScenarios.length === 0) {
          favList.innerHTML = '';
          favEmpty.hidden = false;
          return;
        }
        favEmpty.hidden = true;
        favList.innerHTML = favScenarios
          .map(
            (s) => `
          <li>
            <article class="card">
              <div class="meta-line">${escapeHtml(s.categoryLabel)}</div>
              <h3 style="margin-bottom:0.25rem;"><a href="detail.html?id=${encodeURIComponent(s.id)}">${escapeHtml(s.title)}</a></h3>
              <p style="color:var(--text-secondary);margin-bottom:0.75rem;">${escapeHtml(s.shortSummary)}</p>
              <div style="display:flex;flex-wrap:wrap;gap:0.5rem;">
                <a class="btn btn-primary btn-sm" href="detail.html?id=${encodeURIComponent(s.id)}">Open Play</a>
                <button type="button" class="btn btn-ghost btn-sm" data-remove-fav="${escapeHtml(s.id)}">Remove</button>
              </div>
            </article>
          </li>`
          )
          .join('');
      } catch {
        /* ignore */
      }
    };

    if (cancelBtn) {
      cancelBtn.onclick = () => {
        resetForm();
        setBanner(feedback, '', '');
      };
    }

    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();
        setBanner(feedback, '', '');
        const title = titleInput.value.trim();
        const body = bodyInput.value.trim();
        const rating = Number(ratingSelect.value);
        const editId = editIdInput.value ? Number(editIdInput.value) : null;

        if (title.length < 2) {
          setBanner(feedback, 'error', 'Play name needs at least 2 characters.');
          return;
        }
        if (body.length < 3) {
          setBanner(feedback, 'error', 'Strategy notes need at least 3 characters.');
          return;
        }

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.classList.add('is-loading');
          submitBtn.textContent = editId ? 'Saving changes...' : 'Saving note...';
        }
        try {
          if (editId) {
            await api(`/api/playbook/${editId}`, {
              method: 'PUT',
              body: JSON.stringify({ title, body, rating })
            });
            showToast('Playbook note updated!');
            setBanner(feedback, 'success', 'Note updated.');
          } else {
            await api('/api/playbook', {
              method: 'POST',
              body: JSON.stringify({ title, body, rating })
            });
            showToast('Playbook note saved!');
            setBanner(feedback, 'success', 'Added to your playbook.');
          }
          resetForm();
          await loadEntries();
        } catch (err) {
          setBanner(feedback, 'error', err.message);
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.classList.remove('is-loading');
            submitBtn.textContent = editIdInput && editIdInput.value ? 'Save Changes' : 'Add to Playbook';
          }
        }
      };
    }

    if (entriesList) {
      entriesList.onclick = async (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const action = btn.dataset.action;
        const id = Number(btn.dataset.id);

        if (action === 'edit') {
          const item = entries.find((x) => x.id === id);
          if (!item) return;
          editIdInput.value = String(item.id);
          titleInput.value = item.title;
          bodyInput.value = item.body;
          ratingSelect.value = String(item.rating);
          if (addHeading) addHeading.textContent = 'Edit Play Note';
          if (submitBtn) submitBtn.textContent = 'Save Changes';
          if (cancelBtn) cancelBtn.hidden = false;
          setBanner(feedback, '', '');
          titleInput.focus();
        } else if (action === 'delete') {
          const confirmBox = document.getElementById(`confirm-${id}`);
          if (confirmBox) confirmBox.hidden = false;
        } else if (action === 'cancel-delete') {
          const confirmBox = document.getElementById(`confirm-${id}`);
          if (confirmBox) confirmBox.hidden = true;
        } else if (action === 'confirm-delete') {
          try {
            await api(`/api/playbook/${id}`, { method: 'DELETE' });
            showToast('Note deleted.');
            if (editIdInput.value === String(id)) resetForm();
            await loadEntries();
          } catch (err) {
            setBanner(feedback, 'error', err.message);
          }
        }
      };
    }

    if (favList) {
      favList.onclick = async (e) => {
        const btn = e.target.closest('[data-remove-fav]');
        if (!btn) return;
        const sid = btn.dataset.removeFav;
        try {
          await api(`/api/favorites/${encodeURIComponent(sid)}`, { method: 'DELETE' });
          showToast('Removed from favorites.');
          await loadFavorites();
        } catch (err) {
          showToast(err.message);
        }
      };
    }

    if (prefsCard && prefsForm) {
      prefsCard.hidden = false;
      const pUserEl = document.getElementById('pb-prof-username');
      const pEmailEl = document.getElementById('pb-prof-email');
      const pBatsEl = document.getElementById('pb-prof-bats');
      const pThrowsEl = document.getElementById('pb-prof-throws');
      const pStadiumEl = document.getElementById('pb-prof-stadium');
      const pBatEl = document.getElementById('pb-prof-bat');
      const pSaveBtn = document.getElementById('pb-prefs-save-btn');
      const curPrefs = currentUser.preferences || {};

      if (pUserEl) pUserEl.value = currentUser.username || '';
      if (pEmailEl) pEmailEl.value = currentUser.email || '';
      if (pBatsEl) pBatsEl.value = curPrefs.battingHand === 'L' ? 'L' : 'R';
      if (pThrowsEl) pThrowsEl.value = curPrefs.throwingHand === 'L' ? 'L' : 'R';
      if (pStadiumEl && curPrefs.preferredStadium) pStadiumEl.value = curPrefs.preferredStadium;
      if (pBatEl && curPrefs.defaultBat) pBatEl.value = curPrefs.defaultBat;

      prefsForm.onsubmit = async (e) => {
        e.preventDefault();
        setBanner(prefsFeedback, '', '');
        const username = pUserEl ? pUserEl.value.trim() : undefined;
        const email = pEmailEl ? pEmailEl.value.trim() : undefined;
        const chosenStadium = pStadiumEl ? pStadiumEl.value : 'omaha';
        const tierMap = {
          fenway: 'pro', dodger: 'pro', oracle: 'pro', wrigley: 'pro', yankee: 'pro',
          omaha: 'college', lsu: 'college', missst: 'college', vandy: 'college', texas: 'college',
          'hs-central': 'hs', 'hs-oakridge': 'hs', 'hs-coastal': 'hs', 'hs-valley': 'hs', 'hs-metro': 'hs',
          cage: 'cage'
        };
        const preferences = {
          battingHand: pBatsEl && pBatsEl.value === 'L' ? 'L' : 'R',
          throwingHand: pThrowsEl && pThrowsEl.value === 'L' ? 'L' : 'R',
          preferredTier: tierMap[chosenStadium] || 'college',
          preferredStadium: chosenStadium,
          defaultBat: pBatEl ? pBatEl.value : 'goods-2026'
        };
        if (pSaveBtn) {
          pSaveBtn.disabled = true;
          pSaveBtn.classList.add('is-loading');
          pSaveBtn.textContent = 'Saving...';
        }
        try {
          const data = await api('/api/auth/profile', {
            method: 'PUT',
            body: JSON.stringify({ username, email, preferences })
          });
          if (data && data.user) {
            currentUser = data.user;
            if (userBadge) userBadge.textContent = `Signed in as ${currentUser.username}`;
            savePrefs({ ...preferences, username: currentUser.username });
            await syncAuthNav();
          }
          showToast('Account & training preferences saved!');
          setBanner(prefsFeedback, 'success', 'Saved! Your home cage and Coach Jax context now use these defaults.');
        } catch (err) {
          setBanner(prefsFeedback, 'error', err.message || 'Could not update profile.');
        } finally {
          if (pSaveBtn) {
            pSaveBtn.disabled = false;
            pSaveBtn.classList.remove('is-loading');
            pSaveBtn.textContent = 'Save Account Preferences';
          }
        }
      };
    }

    await Promise.all([loadEntries(), loadFavorites(), loadAiProfile()]);
  }

  /* =========================================================
     Auth Pages (Login & Register)
     ========================================================= */
  function initAuthForms() {
    const pageParams = new URLSearchParams(window.location.search);
    const nextUrl = safeNextUrl(pageParams.get('next'));

    // Password visibility toggle buttons
    document.querySelectorAll('[data-toggle-pw]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const input = document.getElementById(btn.dataset.togglePw);
        if (!input) return;
        const isShowing = input.type === 'text';
        input.type = isShowing ? 'password' : 'text';
        btn.setAttribute('aria-pressed', String(!isShowing));
        btn.setAttribute('aria-label', isShowing ? 'Show password' : 'Hide password');
        btn.textContent = isShowing ? 'Show' : 'Hide';
      });
    });

    // Live password strength indicator on Register
    const regPassInput = document.getElementById('reg-pass');
    const regPassFill = document.getElementById('reg-pass-fill');
    const regPassLabel = document.getElementById('reg-pass-label');
    if (regPassInput && regPassFill && regPassLabel) {
      const updatePwStrength = () => {
        const v = regPassInput.value;
        if (!v) {
          regPassFill.style.setProperty('--pw-scale', '0');
          regPassFill.dataset.tier = '';
          regPassLabel.textContent = 'Use 8+ chars with letters & numbers';
          return;
        }
        let score = 0;
        if (v.length >= 8) score++;
        if (v.length >= 12) score++;
        if (/[a-z]/.test(v) && /[A-Z]/.test(v)) score++;
        if (/\d/.test(v)) score++;
        if (/[^a-zA-Z0-9]/.test(v)) score++;
        const scale = Math.max(0.2, Math.min(1, score / 5));
        regPassFill.style.setProperty('--pw-scale', String(scale));
        if (v.length < 8 || score <= 1) {
          regPassFill.dataset.tier = 'weak';
          regPassLabel.textContent = v.length < 8 ? `Too short (${v.length}/8 chars)` : 'Weak — add numbers or capitals';
        } else if (score <= 2) {
          regPassFill.dataset.tier = 'fair';
          regPassLabel.textContent = 'Fair — add a number or symbol for extra safety';
        } else if (score <= 3) {
          regPassFill.dataset.tier = 'good';
          regPassLabel.textContent = 'Good password';
        } else {
          regPassFill.dataset.tier = 'strong';
          regPassLabel.textContent = 'Strong password!';
        }
      };
      regPassInput.addEventListener('input', updatePwStrength);
    }

    // Interactive Scored Baseball Login Quiz & Instant Coach Tips (on both Login & Register)
    const AUTH_FOCUS_GUIDE = {
      'hitting-power': {
        clinic: 'rolling-over',
        bat: 'goods-2026',
        title: 'On-Plane Extension & Elevated Backspin',
        tips: [
          'Coil into your back hip, match the downward pitch plane (+6° to +13° attack angle), and hold top/rear hand palm-up and bottom/lead hand palm-down 8+ inches past home plate.',
          'Resist rolling your top wrist early — extend cleanly through the inner seam so line drives carry 26°–30° into the gap.'
        ]
      },
      'hitting-timing': {
        clinic: 'bat-drag',
        bat: 'baum-gold',
        title: 'Lower-Half Lead & Tight Inside Path',
        tips: [
          'Fire your belt buckle toward the pitcher FIRST while keeping your rear elbow slotted cleanly beside your ribcage — never let your elbow pass your hands.',
          'Drive the bat knob inside the baseball with stacked hands, then test tight sweet-spot feedback with Baum Bat Gold (-3).'
        ]
      },
      'fielding-hands': {
        clinic: 'glove-stab',
        bat: 'goods-2022',
        title: 'Out-Front Glove Triangle & Rhythm Footwork',
        tips: [
          'Sink your hips low, present an open glove triangle out in front of your eyes, and softly funnel grounders into your midsection.',
          'Approach every ball with "Right—Left—Catch—Right—Throw" cadence so momentum flows cleanly toward 1st base.'
        ]
      },
      'fielding-routes': {
        clinic: 'banana-route',
        bat: 'combat-blue',
        title: '45° Drop-Step & Low Linear Crow Hop',
        tips: [
          'Whip your back hip 45° immediately on deep flies and pump both arms with your glove tucked until the final three steps.',
          'Skim low across the grass with a level head on your crow hop rather than jumping high vertically so relay throws bite flat.'
        ]
      }
    };

    const AUTH_MINI_QUESTIONS = [
      {
        id: 'mq1',
        q: '1. High 92 mph fastball at the top of the zone: which bat path avoids weak pop-ups?',
        options: [
          { k: 'a', label: 'Match downward plane (+8°) & stay inside ball', correct: true },
          { k: 'b', label: 'Drop back shoulder sharply (+25° steep uppercut)', correct: false }
        ],
        explain: 'Staying above/inside the high heater at +6° to +10° produces true backspin line drives instead of foul pop-ups.'
      },
      {
        id: 'mq2',
        q: '2. Why does a low-MOI 1-piece bat (Combat Spec-A1) differ from an end-loaded 2-piece?',
        options: [
          { k: 'a', label: 'Faster bat whip & wider sweet spot for late catch-up', correct: true },
          { k: 'b', label: 'Heavier tip inertia with narrower wood-style sweet spot', correct: false }
        ],
        explain: 'Lower MOI swings faster for pitch recognition; end-loaded bats boost max exit velocity on squared barrels.'
      },
      {
        id: 'mq3',
        q: '3. Runners on 1st & 2nd, 0 outs, routine pop-up to shortstop. What rule applies?',
        options: [
          { k: 'a', label: 'Infield Fly Rule — batter is out immediately', correct: true },
          { k: 'b', label: 'Must let the ball drop to turn an easy double play', correct: false }
        ],
        explain: 'With <2 outs and runners on 1st & 2nd (or loaded), Umpires call Infield Fly so defense cannot intentionally drop it.'
      }
    ];

    let selectedAuthFocus = 'hitting-power';
    const miniAnswers = {};
    const focusOptsWrap = document.getElementById('auth-focus-options');
    const skillLevelEl = document.getElementById('auth-skill-level');
    const miniQuizEl = document.getElementById('auth-mini-quiz');
    const miniScoreEl = document.getElementById('auth-quiz-score');
    const tipsPreviewEl = document.getElementById('auth-instant-tips');

    function renderAuthMiniQuiz() {
      if (!miniQuizEl) return;
      let correctCount = 0;
      let answeredCount = 0;
      AUTH_MINI_QUESTIONS.forEach((item) => {
        const picked = miniAnswers[item.id];
        if (picked) {
          answeredCount++;
          const opt = item.options.find((o) => o.k === picked);
          if (opt && opt.correct) correctCount++;
        }
      });
      if (miniScoreEl) {
        miniScoreEl.textContent = answeredCount > 0 ? `${correctCount} / ${AUTH_MINI_QUESTIONS.length} Correct (${answeredCount}/3)` : '0 / 3 Scored';
      }
      miniQuizEl.innerHTML = AUTH_MINI_QUESTIONS.map((item) => {
        const picked = miniAnswers[item.id];
        const chosenOpt = picked ? item.options.find((o) => o.k === picked) : null;
        const cardCls = chosenOpt ? (chosenOpt.correct ? ' is-correct' : ' is-wrong') : '';
        return `
          <div class="auth-mini-q${cardCls}">
            <div class="auth-mini-q-title">${escapeHtml(item.q)}</div>
            <div class="auth-mini-opts">
              ${item.options
                .map((opt) => {
                  let cls = 'auth-mini-opt';
                  if (picked === opt.k) cls += opt.correct ? ' is-right' : ' is-wrong';
                  return `<button type="button" class="${cls}" data-mq="${item.id}" data-mk="${opt.k}" aria-pressed="${picked === opt.k}">${escapeHtml(opt.label)}</button>`;
                })
                .join('')}
            </div>
            ${chosenOpt ? `<div class="auth-mini-explain">${chosenOpt.correct ? 'Correct — ' : 'Coach Fix — '}${escapeHtml(item.explain)}</div>` : ''}
          </div>`;
      }).join('');
    }

    function renderAuthTipsPreview() {
      const guide = AUTH_FOCUS_GUIDE[selectedAuthFocus] || AUTH_FOCUS_GUIDE['hitting-power'];
      const lvl = skillLevelEl ? skillLevelEl.value : 'Rec / Little League (Learning core skills)';
      const score = AUTH_MINI_QUESTIONS.reduce((acc, q) => {
        const opt = q.options.find((o) => o.k === miniAnswers[q.id]);
        return acc + (opt && opt.correct ? 1 : 0);
      }, 0);
      try {
        localStorage.setItem('diamondiq_auth_focus', JSON.stringify({ focus: selectedAuthFocus, level: lvl, loginQuizScore: score }));
      } catch {
        /* ignore */
      }
      if (!tipsPreviewEl) return;
      tipsPreviewEl.innerHTML = `
        <strong>Coach AI Quick Tips (${escapeHtml(guide.title)}):</strong>
        <ul>${guide.tips.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ul>
        <div style="margin-top:0.25rem;display:flex;flex-wrap:wrap;gap:0.5rem;align-items:center;">
          <a href="training.html?clinic=${encodeURIComponent(guide.clinic)}&slow=1&bat=${encodeURIComponent(guide.bat)}#video-clinic-section" style="font-weight:700;font-size:0.8rem;">Watch Slow-Mo Tutorial &rarr;</a>
          <span style="color:var(--text-muted);">·</span>
          <a href="training.html#diagnostic-quiz-section" style="font-weight:700;font-size:0.8rem;">20-Q Flaw Quiz &rarr;</a>
          <span style="color:var(--text-muted);">·</span>
          <a href="index.html?bat=${encodeURIComponent(guide.bat)}#gameday-studio" style="font-weight:700;font-size:0.8rem;">Test Bat in 3D &rarr;</a>
        </div>`;
    }

    if (miniQuizEl) {
      miniQuizEl.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-mq]');
        if (!btn) return;
        miniAnswers[btn.dataset.mq] = btn.dataset.mk;
        renderAuthMiniQuiz();
        renderAuthTipsPreview();
      });
      renderAuthMiniQuiz();
    }

    if (focusOptsWrap) {
      focusOptsWrap.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-focus]');
        if (!btn) return;
        selectedAuthFocus = btn.dataset.focus;
        focusOptsWrap.querySelectorAll('[data-focus]').forEach((b) => {
          b.setAttribute('aria-pressed', String(b === btn));
        });
        renderAuthTipsPreview();
      });
      if (skillLevelEl) skillLevelEl.addEventListener('change', renderAuthTipsPreview);
      renderAuthTipsPreview();
    }

    // Preserve ?next= across login <-> register switch links
    if (nextUrl) {
      document.querySelectorAll('a[href="register.html"], a[href="login.html"]').forEach((link) => {
        const base = link.getAttribute('href').split('?')[0];
        link.setAttribute('href', `${base}?next=${encodeURIComponent(nextUrl)}`);
      });
    }

    const buildOnboardingUrl = () => {
      const lvl = skillLevelEl ? skillLevelEl.value : '';
      const qp = new URLSearchParams({ welcome: '1', focus: selectedAuthFocus });
      if (lvl) qp.set('level', lvl);
      return `onboarding.html?${qp.toString()}`;
    };

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      const errEl = document.getElementById('login-error');
      const userEl = document.getElementById('login-user');
      const rememberCheck = document.getElementById('login-remember');
      const openQuizCheck = document.getElementById('login-open-quiz');
      const submitBtn = document.getElementById('login-submit-btn') || loginForm.querySelector('button[type="submit"]');

      const savedLocal = loadSavedPrefs();
      if (userEl && savedLocal.rememberMe && savedLocal.username) {
        userEl.value = savedLocal.username;
        if (rememberCheck) rememberCheck.checked = true;
      }
      if (skillLevelEl && savedLocal.skillLevel) {
        skillLevelEl.value = savedLocal.skillLevel;
      }

      loginForm.onsubmit = async (e) => {
        e.preventDefault();
        setBanner(errEl, '', '');
        const identifier = userEl ? userEl.value.trim() : '';
        const password = document.getElementById('login-pass').value;
        if (!identifier) {
          setBanner(errEl, 'error', 'Enter your username or email.');
          return;
        }
        if (password.length < 8) {
          setBanner(errEl, 'error', 'Password must be at least 8 characters.');
          return;
        }
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.classList.add('is-loading');
          submitBtn.textContent = 'Logging in...';
        }
        try {
          const data = await api('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ identifier, password })
          });
          if (data && data.sessionToken) setStoredSessionToken(data.sessionToken);
          const wantsRemember = rememberCheck ? rememberCheck.checked : false;
          savePrefs({
            rememberMe: wantsRemember,
            username: wantsRemember ? (data.user?.username || identifier) : '',
            skillLevel: skillLevelEl ? skillLevelEl.value : '',
            ...(data.user?.preferences || {})
          });
          const wantsQuiz = openQuizCheck ? openQuizCheck.checked : false;
          if (nextUrl) {
            window.location.href = nextUrl;
          } else if (wantsQuiz || (data && data.needsOnboarding)) {
            window.location.href = buildOnboardingUrl();
          } else {
            window.location.href = 'playbook.html';
          }
        } catch (err) {
          setBanner(errEl, 'error', err.message);
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.classList.remove('is-loading');
            submitBtn.textContent = 'Log In & Continue';
          }
        }
      };
    }

    const regForm = document.getElementById('register-form');
    if (regForm) {
      const errEl = document.getElementById('register-error');
      const batsEl = document.getElementById('reg-bats');
      const throwsEl = document.getElementById('reg-throws');
      const rememberCheck = document.getElementById('reg-remember');
      const regSkipQuiz = document.getElementById('reg-skip-quiz');
      const submitBtn = document.getElementById('reg-submit-btn') || regForm.querySelector('button[type="submit"]');
      regForm.onsubmit = async (e) => {
        e.preventDefault();
        setBanner(errEl, '', '');
        const username = document.getElementById('reg-user').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-pass').value;
        const guide = AUTH_FOCUS_GUIDE[selectedAuthFocus] || AUTH_FOCUS_GUIDE['hitting-power'];
        const preferences = {
          battingHand: batsEl && batsEl.value === 'L' ? 'L' : 'R',
          throwingHand: throwsEl && throwsEl.value === 'L' ? 'L' : 'R',
          defaultBat: guide.bat || 'goods-2026'
        };

        if (!/^[a-zA-Z0-9_-]{3,30}$/.test(username)) {
          setBanner(errEl, 'error', 'Username must be 3–30 characters (letters, numbers, _ or -).');
          return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          setBanner(errEl, 'error', 'Please enter a valid email address.');
          return;
        }
        if (password.length < 8) {
          setBanner(errEl, 'error', 'Password must be at least 8 characters.');
          return;
        }

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.classList.add('is-loading');
          submitBtn.textContent = 'Creating account...';
        }
        try {
          const data = await api('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password, preferences })
          });
          if (data && data.sessionToken) setStoredSessionToken(data.sessionToken);
          const wantsRemember = rememberCheck ? rememberCheck.checked : true;
          savePrefs({
            rememberMe: wantsRemember,
            username: wantsRemember ? username : '',
            skillLevel: skillLevelEl ? skillLevelEl.value : '',
            ...preferences
          });
          if (regSkipQuiz && regSkipQuiz.checked) {
            await api('/api/onboarding/skip', { method: 'POST' }).catch(() => {});
            window.location.href = nextUrl || 'index.html';
          } else {
            window.location.href = nextUrl || buildOnboardingUrl();
          }
        } catch (err) {
          setBanner(errEl, 'error', err.message);
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.classList.remove('is-loading');
            submitBtn.textContent = 'Create Account & Start Quiz';
          }
        }
      };
    }
  }

  /* =========================================================
     Coach Jax — Global Conversational Baseball AI Drawer
     ========================================================= */
  function initCoachJaxWidget() {
    if (document.getElementById('coach-jax-launcher')) return;

    const launcher = document.createElement('button');
    launcher.type = 'button';
    launcher.id = 'coach-jax-launcher';
    launcher.className = 'jax-launcher';
    launcher.setAttribute('aria-haspopup', 'dialog');
    launcher.setAttribute('aria-expanded', 'false');
    launcher.innerHTML = `
      <span class="jax-avatar" aria-hidden="true">JX</span>
      <span>Ask Coach Jax</span>`;

    const drawer = document.createElement('aside');
    drawer.id = 'coach-jax-drawer';
    drawer.className = 'jax-drawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'false');
    drawer.setAttribute('aria-labelledby', 'jax-drawer-title');
    drawer.hidden = true;
    drawer.innerHTML = `
      <div class="rgb-led-rail rgb-led-rail--studio" aria-hidden="true"></div>
      <div class="jax-drawer-head">
        <div style="display:flex;align-items:center;gap:0.65rem;">
          <span class="jax-avatar jax-avatar--lg" aria-hidden="true">JX</span>
          <div>
            <h2 id="jax-drawer-title" style="margin:0;font-size:1.05rem;">Coach Jax</h2>
            <p style="margin:0;font-size:0.78rem;color:var(--text-secondary);">Hitting, Fielding &amp; Game IQ AI Coach</p>
          </div>
        </div>
        <button type="button" id="jax-close-btn" class="btn btn-ghost btn-sm" aria-label="Close Coach Jax">Close</button>
      </div>
      <div class="jax-starter-chips" id="jax-starter-chips">
        <button type="button" class="jax-chip" data-jax-q="I keep rolling over pull-side grounders. How do I fix my swing?">Fix Rollovers</button>
        <button type="button" class="jax-chip" data-jax-q="I'm late on high inside fastballs (bat drag). What drill fixes it?">Fix Bat Drag</button>
        <button type="button" class="jax-chip" data-jax-q="How do I stop taking banana routes on deep outfield fly balls?">Outfield Routes</button>
        <button type="button" class="jax-chip" data-jax-q="What is the difference between Baum Bat Gold and 2026 The Goods?">Bat Fit Advice</button>
      </div>
      <div class="jax-messages" id="jax-messages" aria-live="polite"></div>
      <form class="jax-input-row" id="jax-chat-form" novalidate>
        <label class="sr-only" for="jax-chat-input">Ask Coach Jax a baseball question</label>
        <input type="text" id="jax-chat-input" maxlength="1200" placeholder="Ask Coach Jax about swings, fielding, rules, or bats..." autocomplete="off" required>
        <button type="submit" id="jax-send-btn" class="btn btn-primary btn-sm">Send</button>
      </form>`;

    document.body.appendChild(launcher);
    document.body.appendChild(drawer);

    const messagesEl = document.getElementById('jax-messages');
    const chatForm = document.getElementById('jax-chat-form');
    const chatInput = document.getElementById('jax-chat-input');
    const sendBtn = document.getElementById('jax-send-btn');
    const closeBtn = document.getElementById('jax-close-btn');
    const chipsWrap = document.getElementById('jax-starter-chips');

    const chatHistory = [
      {
        role: 'jax',
        text: "Hey, I'm Coach Jax. Tell me what's feeling off at the plate, in the field, or with your pitch approach—and I'll give you straight fixes, slow-mo clinic links, and YouTube drill videos."
      }
    ];

    function safeYouTubeHref(url) {
      return typeof url === 'string' && url.startsWith('https://www.youtube.com/') ? url : '';
    }

    function safeLocalHref(url) {
      return typeof url === 'string' && /^(training|detail|index|scenarios|compare|playbook|onboarding)\.html/.test(url) ? url : '';
    }

    function appendMessageBubble(msg) {
      const wrap = document.createElement('div');
      wrap.className = `jax-msg ${msg.role === 'user' ? 'jax-msg--user' : msg.isError ? 'jax-msg--error' : 'jax-msg--jax'}`;

      const bodyP = document.createElement('p');
      bodyP.className = 'jax-msg-text';
      bodyP.textContent = msg.text;
      wrap.appendChild(bodyP);

      if (Array.isArray(msg.actionableTips) && msg.actionableTips.length) {
        const ul = document.createElement('ul');
        ul.className = 'jax-tips-list';
        msg.actionableTips.forEach((tip) => {
          const li = document.createElement('li');
          li.textContent = tip;
          ul.appendChild(li);
        });
        wrap.appendChild(ul);
      }

      const links = [];
      (msg.videoLinks || []).forEach((v) => {
        const href = safeLocalHref(v.url);
        if (href) links.push({ label: `Video Lab: ${v.title}`, href, external: false });
      });
      (msg.recommendedScenarios || []).forEach((s) => {
        const href = safeLocalHref(s.url);
        if (href) links.push({ label: `Rule Lesson: ${s.title}`, href, external: false });
      });
      (msg.youtubeLinks || []).forEach((y) => {
        const href = safeYouTubeHref(y.url);
        if (href) links.push({ label: `YouTube: ${y.label}`, href, external: true });
      });
      if (msg.recommendedBatId && msg.recommendedBatName) {
        links.push({
          label: `Test ${msg.recommendedBatName.split(' (')[0]} in 3D`,
          href: `index.html?bat=${encodeURIComponent(msg.recommendedBatId)}#gameday-studio`,
          external: false
        });
      }

      if (links.length) {
        const linkRow = document.createElement('div');
        linkRow.className = 'jax-links-row';
        links.forEach((lnk) => {
          const a = document.createElement('a');
          a.className = 'jax-link-card';
          a.href = lnk.href;
          a.textContent = lnk.label;
          if (lnk.external) {
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
          }
          linkRow.appendChild(a);
        });
        wrap.appendChild(linkRow);
      }

      messagesEl.appendChild(wrap);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    appendMessageBubble(chatHistory[0]);

    function openDrawer(prefillPrompt) {
      drawer.hidden = false;
      launcher.setAttribute('aria-expanded', 'true');
      if (prefillPrompt && chatInput) {
        chatInput.value = prefillPrompt;
      }
      if (chatInput) chatInput.focus();
    }

    function closeDrawer() {
      drawer.hidden = true;
      launcher.setAttribute('aria-expanded', 'false');
    }

    launcher.addEventListener('click', () => {
      if (drawer.hidden) openDrawer();
      else closeDrawer();
    });
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !drawer.hidden) closeDrawer();
    });
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-open-jax]');
      if (trigger) {
        openDrawer(trigger.dataset.jaxPrompt || '');
      }
    });

    let sending = false;
    async function sendJaxQuestion(text) {
      const clean = String(text || '').trim();
      if (!clean || sending) return;
      sending = true;
      if (chatInput) chatInput.value = '';
      if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.textContent = '...';
      }

      const userMsg = { role: 'user', text: clean };
      chatHistory.push(userMsg);
      appendMessageBubble(userMsg);

      const typingEl = document.createElement('div');
      typingEl.className = 'jax-msg jax-msg--jax jax-msg--typing';
      typingEl.textContent = 'Coach Jax is reviewing your mechanics...';
      messagesEl.appendChild(typingEl);
      messagesEl.scrollTop = messagesEl.scrollHeight;

      try {
        const res = await api('/api/ai/jax', {
          method: 'POST',
          body: JSON.stringify({
            message: clean,
            history: chatHistory.slice(-10).map((m) => ({ role: m.role, text: m.text }))
          })
        });
        typingEl.remove();
        const jaxMsg = {
          role: 'jax',
          text: res.reply || 'Keep your hands inside the ball and drive cleanly through center field.',
          actionableTips: res.actionableTips || [],
          videoLinks: res.videoLinks || [],
          recommendedScenarios: res.recommendedScenarios || [],
          youtubeLinks: res.youtubeLinks || [],
          recommendedBatId: res.recommendedBatId || '',
          recommendedBatName: res.recommendedBatName || ''
        };
        chatHistory.push({ role: 'jax', text: jaxMsg.text });
        appendMessageBubble(jaxMsg);
      } catch (err) {
        typingEl.remove();
        appendMessageBubble({
          role: 'jax',
          isError: true,
          text: err && err.message ? err.message : 'Coach Jax could not connect right now. Check server configuration and try again.'
        });
      } finally {
        sending = false;
        if (sendBtn) {
          sendBtn.disabled = false;
          sendBtn.textContent = 'Send';
        }
        if (chatInput && !drawer.hidden) chatInput.focus();
      }
    }

    if (chipsWrap) {
      chipsWrap.addEventListener('click', (e) => {
        const chip = e.target.closest('[data-jax-q]');
        if (!chip) return;
        sendJaxQuestion(chip.dataset.jaxQ);
      });
    }

    if (chatForm) {
      chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (chatInput) sendJaxQuestion(chatInput.value);
      });
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    let saved = 'light';
    try {
      if (localStorage.getItem(THEME_KEY) === 'dark') saved = 'dark';
    } catch {
      saved = 'light';
    }
    applyTheme(saved);

    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const next = getTheme() === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        showToast(next === 'dark' ? 'Switched to Night Mode.' : 'Switched to Day Mode.');
      });
    }

    const navToggle = document.getElementById('nav-toggle');
    const siteNav = document.getElementById('site-nav');
    if (navToggle && siteNav) {
      const closeNav = (returnFocus = false) => {
        if (!siteNav.classList.contains('is-open')) return;
        siteNav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        if (returnFocus) navToggle.focus();
      };
      navToggle.addEventListener('click', () => {
        const isOpen = siteNav.classList.toggle('is-open');
        navToggle.setAttribute('aria-expanded', String(isOpen));
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeNav(true);
      });
      window.addEventListener('resize', () => {
        if (window.innerWidth >= 768) closeNav(false);
      });
    }

    await syncAuthNav();
    initAuthForms();
    await initHomePage();
    await initScenariosPage();
    await initDetailPage();
    await initComparePage();
    await initPlaybookPage();
    initCoachJaxWidget();
  });
})();
