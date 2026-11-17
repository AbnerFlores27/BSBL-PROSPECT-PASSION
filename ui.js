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

  async function api(url, options = {}) {
    const config = {
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
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
        shortLabel: 'BAUM GOLD',
        meta: 'PermaWood Composite · Slight End-Load · 2.505" Barrel',
        desc: 'Glazed maple wood finish over a composite core. Narrower pro-wood barrel with crisp atomic crack sound and pro exit velocity.',
        construction: '1pc-wood',
        weightMod: 0.985,
        popMod: 0.975,
        sweetSpot: 0.86,
        soundType: 'wood',
        barrelColor: '#d49b4b',
        barrelHi: '#f3cb83',
        barrelLo: '#9a621f',
        taperColor: '#b87a2a',
        handleColor: '#1a130e',
        accentColor: '#f59e0b',
        trimColor: '#111827',
        capColor: '#18120c',
        capStyle: 'cupped'
      },
      'goods-2026': {
        id: 'goods-2026',
        name: '2026 DeMarini The Goods',
        shortLabel: '26 GOODS',
        meta: '2-Piece Hybrid · Heavy End-Load · 2 5/8" Barrel',
        desc: 'Matte black X14 Alloy Barrel with red/teal accents, stiff 1375 Composite Handle, and notched Tremor End Cap for towering bombs.',
        construction: '2pc',
        cuffColor: '#ef4444',
        cuffTrim: '#2dd4bf',
        weightMod: 0.992,
        popMod: 1.045,
        sweetSpot: 0.96,
        soundType: 'hybrid',
        barrelColor: '#1e2430',
        barrelHi: '#475569',
        barrelLo: '#0d1117',
        taperColor: '#111827',
        handleColor: '#0f172a',
        accentColor: '#2dd4bf',
        trimColor: '#ef4444',
        capColor: '#090d14',
        capStyle: 'tremor'
      },
      'goods-2022': {
        id: 'goods-2022',
        name: '2022 DeMarini The Goods',
        shortLabel: '22 GOODS',
        meta: 'Half+Half Hybrid · Classic End-Load · 2 5/8" Barrel',
        desc: 'Signature brushed chrome silver X14 Alloy barrel + black Paraflex Plus composite handle with crimson red graphics and smooth whip.',
        construction: '2pc',
        cuffColor: '#dc2626',
        cuffTrim: '#18181b',
        weightMod: 0.998,
        popMod: 1.033,
        sweetSpot: 0.98,
        soundType: 'hybrid',
        barrelColor: '#cbd5e1',
        barrelHi: '#ffffff',
        barrelLo: '#64748b',
        taperColor: '#334155',
        handleColor: '#18181b',
        accentColor: '#dc2626',
        trimColor: '#0f172a',
        capColor: '#18181b',
        capStyle: 'dish'
      },
      'combat-rodeo': {
        id: 'combat-rodeo',
        name: 'Combat MFG Spec-A1 Rodeo',
        shortLabel: 'RODEO A1',
        meta: '1-Piece SFX Alloy · Balanced Whip · Clinch Tan Grip',
        desc: 'Antique cream barrel with deep maroon & burnt-orange western stripes, seamless 1-piece taper, tan Clinch grip, and loud Combat thwack.',
        construction: '1pc',
        weightMod: 1.024,
        popMod: 1.02,
        sweetSpot: 1.06,
        soundType: 'combat',
        barrelColor: '#efe4ce',
        barrelHi: '#fffbf2',
        barrelLo: '#cbb898',
        taperColor: '#7f1d1d',
        handleColor: '#854d0e',
        accentColor: '#7f1d1d',
        trimColor: '#ea580c',
        capColor: '#7f1d1d',
        capStyle: 'flared'
      },
      'combat-blue': {
        id: 'combat-blue',
        name: 'Combat Spec-A1 Members Club Blue',
        shortLabel: 'CLUB BLUE',
        meta: '1-Piece Country Club Alloy · Ultra-Balanced · Widest Sweet Spot',
        desc: 'Powder sky-blue SFX alloy barrel with navy & gold Country Club bands, argyle navy handle grip, and the widest sweet-spot forgiveness.',
        construction: '1pc',
        weightMod: 1.028,
        popMod: 1.016,
        sweetSpot: 1.1,
        soundType: 'combat',
        barrelColor: '#67c1f5',
        barrelHi: '#d8f1ff',
        barrelLo: '#2b7ec1',
        taperColor: '#1e3a8a',
        handleColor: '#172554',
        accentColor: '#1e3a8a',
        trimColor: '#facc15',
        capColor: '#172554',
        capStyle: 'flared'
      }
    };

    const STADIUMS = {
      fenway: {
        id: 'fenway',
        name: 'Fenway Park',
        dimsLabel: 'Fenway Park · 310 LF · 420 CF · 302 RF',
        skyTop: '#071426',
        skyMid: '#122949',
        skyLow: '#1b3d64',
        wallColor: '#1b4d38',
        wallCap: '#fbbf24',
        wallDist(phi) {
          // phi in [-0.785 .. +0.785] (-45 LF to +45 RF)
          if (phi < -0.18) return 310 + ((phi + 0.785) / 0.605) * 68;
          if (phi < 0.16) return 388 + Math.cos(((phi - 0.02) / 0.18) * Math.PI * 0.5) * 32;
          return 380 - ((phi - 0.16) / 0.625) * 78;
        },
        wallHeight(phi) {
          if (phi < -0.15) return 37; // Iconic Green Monster!
          if (phi < 0.12) return 17;
          return 5; // Pesky's Pole corner
        }
      },
      wrigley: {
        id: 'wrigley',
        name: 'Wrigley Field',
        dimsLabel: 'Wrigley Field · 355 LF · 400 CF · 353 RF',
        skyTop: '#0b1c36',
        skyMid: '#19375f',
        skyLow: '#2b557c',
        wallColor: '#255c32',
        wallCap: '#b45309',
        wallDist(phi) {
          return 354 + Math.cos((phi / 0.785) * Math.PI * 0.5) * 46;
        },
        wallHeight() {
          return 11.5; // Brick + Ivy
        }
      },
      dodger: {
        id: 'dodger',
        name: 'Dodger Stadium',
        dimsLabel: 'Dodger Stadium · 330 LF · 395 CF · 330 RF',
        skyTop: '#161130',
        skyMid: '#372357',
        skyLow: '#7a3c4a',
        wallColor: '#1d4ed8',
        wallCap: '#fbbf24',
        wallDist(phi) {
          return 330 + Math.cos((phi / 0.785) * Math.PI * 0.5) * 65;
        },
        wallHeight() {
          return 9;
        }
      },
      cage: {
        id: 'cage',
        name: 'Indoor HitTrax Cage',
        dimsLabel: 'Indoor HitTrax · 400 FT Simulated Net',
        skyTop: '#070d18',
        skyMid: '#0e1b2f',
        skyLow: '#142742',
        wallColor: '#1e3a5f',
        wallCap: '#fbbf24',
        wallDist() {
          return 400;
        },
        wallHeight() {
          return 28;
        }
      }
    };

    const PITCH_TYPES = {
      fastball: { name: '4-Seam Fastball', mphMin: 91, mphMax: 95, dur: 0.6, dropFt: 1.0, breakX: 0.14 },
      slider: { name: 'Sharp Slider', mphMin: 82, mphMax: 85, dur: 0.7, dropFt: 2.1, breakX: -0.58 },
      curve: { name: '12-6 Curveball', mphMin: 74, mphMax: 78, dur: 0.8, dropFt: 3.6, breakX: -0.15 },
      changeup: { name: 'Fade Changeup', mphMin: 79, mphMax: 83, dur: 0.75, dropFt: 2.5, breakX: 0.42 }
    };

    const cageCanvas = document.getElementById('cage-canvas');
    const sprayCanvas = document.getElementById('hittrax-spray-canvas');
    const batRack = document.getElementById('bat-rack');
    const stadiumTabs = document.getElementById('stadium-tabs');
    const pitchTabs = document.getElementById('pitch-tabs');
    const swingBtn = document.getElementById('cage-swing-btn');
    const demoBtn = document.getElementById('cage-demo-btn');
    const pciModeBtn = document.getElementById('cage-pci-mode-btn');
    const soundBtn = document.getElementById('cage-sound-btn');
    const pitchNote = document.getElementById('cage-pitch-note');
    const evEl = document.getElementById('hitlab-ev');
    const laEl = document.getElementById('hitlab-la');
    const distEl = document.getElementById('hitlab-dist');
    const apexEl = document.getElementById('hitlab-apex');
    const outEl = document.getElementById('hitlab-outcome');
    const batSpecMeta = document.getElementById('bat-spec-meta');
    const batSpecName = document.getElementById('bat-spec-name');
    const batSpecDesc = document.getElementById('bat-spec-desc');
    const batPreviewSvg = document.getElementById('bat-preview-svg');
    const sprayLabel = document.getElementById('spray-stadium-label');
    const sessionPill = document.getElementById('session-count-pill');
    const sprayClearBtn = document.getElementById('spray-clear-btn');
    const countReadout = document.getElementById('count-readout');

    function renderBatSvg(bat) {
      const cuff =
        bat.construction === '2pc'
          ? `<rect x="132" y="12.5" width="15" height="19" rx="2.5" fill="${bat.cuffColor}" stroke="${bat.cuffTrim}" stroke-width="1.5"/>
             <line x1="139.5" y1="13" x2="139.5" y2="31" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>`
          : '';
      const woodGrain =
        bat.construction === '1pc-wood'
          ? `<line x1="168" y1="15" x2="320" y2="15" stroke="rgba(120,53,15,0.34)" stroke-width="1.1"/>
             <line x1="172" y1="21" x2="316" y2="21" stroke="rgba(120,53,15,0.22)" stroke-width="1"/>
             <line x1="168" y1="28" x2="320" y2="28" stroke="rgba(120,53,15,0.28)" stroke-width="1.1"/>`
          : '';
      const argyleGrip =
        bat.id === 'combat-blue'
          ? `<path d="M 32 17 L 40 27 M 44 17 L 52 27 M 56 17 L 64 27 M 68 17 L 76 27 M 80 17 L 88 27 M 92 17 L 100 27 M 40 17 L 32 27 M 52 17 L 44 27 M 64 17 L 56 27 M 76 17 L 68 27 M 88 17 L 80 27" stroke="rgba(250,204,21,0.52)" stroke-width="1.3"/>`
          : `<path d="M 30 17 L 37 27 M 42 17 L 49 27 M 54 17 L 61 27 M 66 17 L 73 27 M 78 17 L 85 27 M 90 17 L 97 27" stroke="rgba(255,255,255,0.26)" stroke-width="1.6"/>`;
      const capMarkup =
        bat.capStyle === 'tremor'
          ? `<path d="M 324 10 L 334 12.5 L 334 31.5 L 324 34 Z" fill="${bat.capColor}"/><line x1="331.5" y1="14" x2="331.5" y2="30" stroke="${bat.accentColor}" stroke-width="1.6" stroke-dasharray="3 2"/>`
          : bat.capStyle === 'flared'
            ? `<rect x="323" y="9.5" width="10" height="25" rx="4" fill="${bat.capColor}" stroke="${bat.trimColor}" stroke-width="1.2"/>`
            : `<rect x="324" y="10" width="9" height="24" rx="3.5" fill="${bat.capColor}"/>`;

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
            <linearGradient id="hsvg_${bat.id}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#090d14"/>
              <stop offset="40%" stop-color="${bat.handleColor}"/>
              <stop offset="100%" stop-color="#05080d"/>
            </linearGradient>
          </defs>
          <!-- Drop Shadow -->
          <ellipse cx="176" cy="39" rx="154" ry="3.5" fill="rgba(0,0,0,0.45)"/>
          <!-- Knob -->
          <ellipse cx="18" cy="22" rx="6" ry="9.5" fill="${bat.trimColor || '#0f172a'}" stroke="rgba(255,255,255,0.34)" stroke-width="1"/>
          <!-- Handle -->
          <rect x="22" y="17" width="84" height="10" rx="2" fill="url(#hsvg_${bat.id})"/>
          ${argyleGrip}
          <!-- Taper -->
          <polygon points="104,17 162,10 162,34 104,27" fill="${bat.taperColor}"/>
          <!-- 3D Shaded Cylindrical Barrel -->
          <rect x="160" y="9.5" width="166" height="25" rx="4.5" fill="url(#bsvg_${bat.id})"/>
          ${woodGrain}
          <!-- Glossy Specular Highlight Line -->
          <line x1="166" y1="15" x2="320" y2="15" stroke="rgba(255,255,255,0.38)" stroke-width="1.5" stroke-linecap="round"/>
          <!-- Barrel Graphic Bands & Model Label -->
          <rect x="172" y="9.5" width="8" height="25" fill="${bat.accentColor}"/>
          <rect x="183" y="9.5" width="4" height="25" fill="${bat.trimColor || '#ffffff'}"/>
          <rect x="292" y="9.5" width="10" height="25" fill="${bat.accentColor}" opacity="0.9"/>
          ${cuff}
          ${capMarkup}
          <text x="238" y="25.2" text-anchor="middle" font-size="9.4" font-weight="800" letter-spacing="1.2" fill="${bat.id === 'goods-2026' ? '#f8fafc' : '#0f172a'}" opacity="0.94">${bat.shortLabel}</text>
        </svg>`;
    }

    if (cageCanvas) {
      const hudCanvas = document.getElementById('pci-hud-canvas');
      const hctx = hudCanvas ? hudCanvas.getContext('2d') : null;
      const LOG_W = 800;
      const LOG_H = 450;

      let activeBatId = 'goods-2026';
      let activeStadiumId = 'fenway';
      let selectedPitchType = 'mix';
      let autoPciMode = false;
      let soundOn = true;
      let audioCtx = null;
      let cageEngaged = false;
      let engine3D = null;

      // Session / Game State
      const session = {
        balls: 0,
        strikes: 0,
        outs: 0,
        hits: 0,
        hrs: 0,
        sprays: []
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
        pitch: null,
        pitchPos: null,
        swingTriggered: false,
        swingT: 0,
        swingAngle: -0.42,
        contactResolved: false,
        flashTimer: 0,
        flashColor: '#38bdf8',
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

      function tryInit3D() {
        if (engine3D || typeof window.createStadium3DEngine !== 'function') return;
        try {
          engine3D = window.createStadium3DEngine(cageCanvas, BATS, STADIUMS);
          engine3D.setStadium(activeStadiumId);
          engine3D.setBat(activeBatId);
          const dpr = engine3D.isSoftwareGl ? Math.min(window.devicePixelRatio || 1, 1.25) : Math.min(window.devicePixelRatio || 1, 2);
          engine3D.resize(Math.round(LOG_W * dpr), Math.round(LOG_H * dpr));
        } catch (err) {
          console.error('3D stadium init failed:', err);
        }
      }
      tryInit3D();
      if (!engine3D) {
        window.addEventListener('diamondiq-3d-ready', tryInit3D, { once: true });
      }

      function playBatAudio(kind) {
        if (!soundOn) return;
        try {
          const Ctx = window.AudioContext || window.webkitAudioContext;
          if (!Ctx) return;
          if (!audioCtx) audioCtx = new Ctx();
          if (audioCtx.state === 'suspended') audioCtx.resume();
          const now = audioCtx.currentTime;
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          if (kind === 'wood') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(240, now);
            osc.frequency.exponentialRampToValueAtTime(70, now + 0.08);
            gain.gain.setValueAtTime(0.45, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
          } else if (kind === 'combat') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1080, now);
            osc.frequency.exponentialRampToValueAtTime(760, now + 0.25);
            gain.gain.setValueAtTime(0.28, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.27);
          } else if (kind === 'whiff') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(190, now);
            osc.frequency.exponentialRampToValueAtTime(110, now + 0.09);
            gain.gain.setValueAtTime(0.16, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
          } else {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(610, now);
            osc.frequency.exponentialRampToValueAtTime(420, now + 0.22);
            gain.gain.setValueAtTime(0.32, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
          }
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now);
          osc.stop(now + 0.28);
        } catch {
          /* ignore */
        }
      }

      function updateBatDom() {
        const bat = BATS[activeBatId] || BATS['goods-2026'];
        if (batSpecMeta) batSpecMeta.textContent = bat.meta;
        if (batSpecName) batSpecName.textContent = bat.name;
        if (batSpecDesc) batSpecDesc.textContent = bat.desc;
        if (batPreviewSvg) batPreviewSvg.innerHTML = renderBatSvg(bat);
        if (engine3D) engine3D.setBat(activeBatId);
      }

      function updateSessionDom(hitInfo = null) {
        if (hitInfo) {
          if (evEl) evEl.textContent = hitInfo.exitVelo != null ? `${hitInfo.exitVelo} mph` : '-- mph';
          if (laEl) laEl.textContent = hitInfo.launchAngle != null ? `${hitInfo.launchAngle}°` : '--°';
          if (distEl) distEl.textContent = hitInfo.dist != null ? `${hitInfo.dist} ft` : '-- ft';
          if (apexEl) apexEl.textContent = hitInfo.apex != null ? `${hitInfo.apex} ft` : '-- ft';
          if (outEl) {
            outEl.textContent = hitInfo.outcome || 'Pitch Ready';
            outEl.style.color = hitInfo.color || 'var(--accent)';
          }
        }
        if (sessionPill) sessionPill.textContent = `${session.hrs} HR · ${session.hits} Hits`;
        if (countReadout) countReadout.textContent = `Count: ${session.balls}-${session.strikes} · Outs: ${session.outs}`;
        drawSprayChart();
      }

      function drawSprayChart() {
        if (!sprayCanvas) return;
        const sctx = sprayCanvas.getContext('2d');
        const w = sprayCanvas.width;
        const h = sprayCanvas.height;
        const st = STADIUMS[activeStadiumId] || STADIUMS.fenway;
        if (sprayLabel) sprayLabel.textContent = st.dimsLabel;

        sctx.clearRect(0, 0, w, h);
        sctx.fillStyle = '#091322';
        sctx.fillRect(0, 0, w, h);

        const ox = w / 2;
        const oy = h - 18;
        const pxPerFt = (h - 38) / 435;

        // Warning Track Edge
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

        // Turf Outfield Wedge with Mowed Grass Radial Glow
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

        // Infield dirt diamond
        sctx.fillStyle = '#a36839';
        sctx.beginPath();
        sctx.arc(ox, oy - 75 * pxPerFt, 48 * pxPerFt, Math.PI * 1.15, Math.PI * 1.85);
        sctx.lineTo(ox, oy);
        sctx.closePath();
        sctx.fill();

        // Outfield Wall Outline
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

        // Foul Lines
        sctx.strokeStyle = 'rgba(255,255,255,0.5)';
        sctx.lineWidth = 1;
        [-0.785, 0.785].forEach((phi) => {
          const d = st.wallDist(phi) * pxPerFt;
          sctx.beginPath();
          sctx.moveTo(ox, oy);
          sctx.lineTo(ox + Math.sin(phi) * d, oy - Math.cos(phi) * d);
          sctx.stroke();
        });

        // Distance rings
        [200, 300, 400].forEach((ft) => {
          sctx.beginPath();
          sctx.arc(ox, oy, ft * pxPerFt, -Math.PI * 0.75, -Math.PI * 0.25);
          sctx.strokeStyle = 'rgba(255,255,255,0.14)';
          sctx.stroke();
        });

        // Plotted HitTrax Spray Shots
        session.sprays.forEach((sp, i) => {
          const sx = ox + sp.xFt * pxPerFt;
          const sy = oy - sp.yFt * pxPerFt;
          sctx.beginPath();
          sctx.moveTo(ox, oy);
          sctx.lineTo(sx, sy);
          sctx.strokeStyle = sp.color;
          sctx.globalAlpha = i === session.sprays.length - 1 ? 0.92 : 0.4;
          sctx.lineWidth = i === session.sprays.length - 1 ? 2.2 : 1.2;
          sctx.stroke();

          sctx.beginPath();
          sctx.arc(sx, sy, sp.isHr ? 4.4 : 3.2, 0, Math.PI * 2);
          sctx.fillStyle = sp.color;
          sctx.globalAlpha = 1;
          sctx.fill();
        });
      }

      // Compute authentic 3D ball flight (ft, sub-stepped gravity + drag + Magnus backspin lift)
      function simulateBallFlight(bat, exitVelo, launchDeg, sprayDeg) {
        const st = STADIUMS[activeStadiumId] || STADIUMS.fenway;
        const v0 = exitVelo * 1.46667;
        const theta = (launchDeg * Math.PI) / 180;
        const phi = (sprayDeg * Math.PI) / 180;

        let x = 0;
        let y = 2.0;
        let z = 3.0;
        let vx = v0 * Math.cos(theta) * Math.sin(phi);
        let vy = v0 * Math.cos(theta) * Math.cos(phi);
        let vz = v0 * Math.sin(theta);

        const dt = 1 / 90;
        const points = [{ x, y, z, t: 0 }];
        let apex = z;
        let t = 0;
        let isHr = false;
        let wallHit = false;
        const fair = Math.abs(sprayDeg) <= 45;

        for (let step = 0; step < 650; step++) {
          t += dt;
          const speed = Math.hypot(vx, vy, vz);
          const drag = 0.00205 * speed;
          const spinCarry = launchDeg > 8 && launchDeg < 45 ? 0.072 * speed : 0.025 * speed;

          const ax = -drag * vx;
          const ay = -drag * vy;
          const az = -32.174 - drag * vz + spinCarry;

          vx += ax * dt;
          vy += ay * dt;
          vz += az * dt;

          x += vx * dt;
          y += vy * dt;
          z += vz * dt;

          if (z > apex) apex = z;
          if (step % 2 === 0) points.push({ x, y, z: Math.max(0, z), t });

          const horiz = Math.hypot(x, y);
          const curPhi = Math.atan2(x, Math.max(1, y));
          if (fair && !isHr && !wallHit && Math.abs(curPhi) <= 0.785) {
            const wDist = st.wallDist(curPhi);
            const wH = st.wallHeight(curPhi);
            if (horiz >= wDist) {
              if (z > wH || st.id === 'cage') {
                isHr = z > wH || (st.id === 'cage' && launchDeg >= 16);
              } else {
                wallHit = true;
                vy = -vy * 0.35;
                vx = vx * 0.45;
                vz = Math.max(4, vz * 0.4);
              }
            }
          }

          if (z <= 0) {
            if (!isHr && Math.abs(vz) > 18 && points.length < 280) {
              z = 0.1;
              vz = Math.abs(vz) * 0.34;
              vx *= 0.68;
              vy *= 0.68;
            } else {
              break;
            }
          }
        }

        const last = points[points.length - 1];
        const finalDist = Math.round(Math.hypot(last.x, last.y));
        const finalApex = Math.round(apex);

        let outcome = 'Out';
        let color = '#94a3b8';
        if (!fair) {
          outcome = 'Foul Ball';
          color = '#fbbf24';
        } else if (isHr) {
          outcome = finalDist >= 425 ? 'UPPER DECK BOMB!' : 'HOME RUN!';
          color = '#38bdf8';
        } else if (wallHit) {
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
          outcome = finalDist >= 320 ? 'Deep Warning-Track Fly' : 'Fly Out';
          color = '#fbbf24';
        }

        return {
          points,
          dist: finalDist,
          apex: finalApex,
          exitVelo: Number(exitVelo.toFixed(1)),
          launchAngle: Math.round(launchDeg),
          sprayDeg: Math.round(sprayDeg),
          outcome,
          isHr: fair && isHr,
          wallHit,
          fair,
          color,
          endX: last.x,
          endY: last.y,
          totalTime: t
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
          ? 86
          : Math.round(spec.mphMin + Math.random() * (spec.mphMax - spec.mphMin));

        const endX = isDemoHr ? 0.04 : (Math.random() - 0.5) * 1.75;
        const endY = isDemoHr ? 0.0 : (Math.random() - 0.5) * 1.65;

        sim.phase = 'windup';
        sim.t = 0;
        sim.camT = 0;
        sim.swingTriggered = false;
        sim.swingT = 0;
        sim.swingAngle = -0.42;
        sim.contactResolved = false;
        sim.demoAutoSwing = isDemoHr;
        sim.pitchPos = null;
        sim.flightCur = null;
        sim.flightPoints = null;
        sim.flightMaxIdx = 0;
        sim.pitch = {
          typeKey: chosenKey,
          name: isDemoHr ? '86 mph Centerpiece Fastball' : `${mph} mph ${spec.name}`,
          mph,
          dur: isDemoHr ? 0.72 : spec.dur,
          dropFt: isDemoHr ? 0.75 : spec.dropFt,
          breakX: isDemoHr ? 0.0 : spec.breakX,
          endX,
          endY
        };
        if (swingBtn) swingBtn.textContent = 'SWING! (Space)';
        if (pitchNote) pitchNote.textContent = `${sim.pitch.name} · Watch the shrinking ring!`;
      }

      function resolveSwing() {
        if (sim.phase !== 'pitch' || sim.contactResolved || !sim.pitch) return;
        sim.contactResolved = true;
        const bat = BATS[activeBatId] || BATS['goods-2026'];

        const timingErr = sim.t - 0.94;
        const absTime = Math.abs(timingErr);

        let curPciX = pci.x;
        let curPciY = pci.y;
        if (sim.demoAutoSwing) {
          curPciX = sim.pitch.endX;
          curPciY = sim.pitch.endY + 0.30; // PCI slightly BELOW ball -> 28° high-arc HR over wall!
        } else if (autoPciMode) {
          curPciX = sim.pitch.endX + (Math.random() - 0.5) * 0.14;
          curPciY = sim.pitch.endY + 0.22 + (Math.random() - 0.5) * 0.16;
        }

        const dx = curPciX - sim.pitch.endX;
        const underBallOffset = curPciY - sim.pitch.endY; // >0 means PCI is lower/under ball -> loft!
        const distFromSweet = Math.hypot(dx * 0.9, underBallOffset);

        const maxReach = 0.95 * bat.sweetSpot;
        if (absTime > 0.23 || distFromSweet > maxReach) {
          playBatAudio('whiff');
          session.strikes++;
          let call = 'Swinging Strike';
          if (session.strikes >= 3) {
            call = 'Strikeout!';
            session.balls = 0;
            session.strikes = 0;
            session.outs = (session.outs + 1) % 3;
          }
          sim.calloutText = call.toUpperCase();
          sim.calloutSub = absTime > 0.23 ? (timingErr < 0 ? 'Too Early' : 'Too Late') : 'Missed PCI';
          sim.calloutTimer = 1.3;
          updateSessionDom({ exitVelo: null, launchAngle: null, dist: null, apex: null, outcome: call, color: '#f87171' });
          if (swingBtn) swingBtn.textContent = 'Throw Pitch';
          return;
        }

        const barrelFactor = Math.max(0.25, 1 - distFromSweet / maxReach) * Math.max(0.45, 1 - absTime * 2.2);
        const swingMph = sim.demoAutoSwing ? 81 : 72 + barrelFactor * 10;
        const exitVelo = 0.21 * sim.pitch.mph + 1.14 * bat.popMod * bat.weightMod * swingMph * (0.78 + 0.26 * barrelFactor);

        // Positive underBallOffset (PCI slightly below ball) produces realistic 26°-34° towering bombs!
        let launchDeg = sim.demoAutoSwing ? 29 : 15 + underBallOffset * 44 + (Math.random() - 0.5) * 3;
        launchDeg = Math.max(-10, Math.min(56, launchDeg));

        let sprayDeg = sim.demoAutoSwing ? -15 : timingErr * 155 + dx * 22;
        if (absTime > 0.16) {
          sprayDeg = timingErr < 0 ? -56 : 56;
        }
        sprayDeg = Math.max(-68, Math.min(68, sprayDeg));

        playBatAudio(bat.soundType);
        sim.flashTimer = 1;
        const flight = simulateBallFlight(bat, exitVelo, launchDeg, sprayDeg);
        sim.flashColor = flight.color;
        sim.flight = { ...flight, playTime: 0 };
        sim.flightPoints = flight.points;
        sim.flightColor = flight.color;
        sim.flightFair = flight.fair;
        sim.flightMaxIdx = 0;
        sim.flightCur = flight.points[0];
        sim.phase = 'flight';
        sim.t = 0;

        if (!flight.fair) {
          if (session.strikes < 2) session.strikes++;
          sim.calloutText = 'FOUL BALL';
          sim.calloutSub = `${flight.exitVelo} mph · ${flight.launchAngle}°`;
        } else {
          session.balls = 0;
          session.strikes = 0;
          if (flight.isHr || flight.wallHit || flight.outcome.includes('Single') || flight.outcome.includes('Double')) {
            session.hits++;
            if (flight.isHr) session.hrs++;
          } else {
            session.outs = (session.outs + 1) % 3;
          }
          session.sprays.push({
            xFt: flight.endX,
            yFt: flight.endY,
            dist: flight.dist,
            apex: flight.apex,
            isHr: flight.isHr,
            color: flight.color,
            stadiumId: activeStadiumId
          });
          if (session.sprays.length > 24) session.sprays.shift();
          sim.calloutText = flight.outcome;
          sim.calloutSub = `${flight.dist} FT · ${flight.exitVelo} MPH · ${flight.apex} FT APEX`;
        }
        sim.calloutTimer = 2.8;

        updateSessionDom({
          exitVelo: flight.exitVelo,
          launchAngle: flight.launchAngle,
          dist: flight.dist,
          apex: flight.apex,
          outcome: flight.outcome,
          color: flight.color
        });
        if (pitchNote) pitchNote.textContent = `${flight.outcome} — ${flight.dist} ft (${flight.launchAngle}° launch, ${flight.apex} ft peak)`;
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

        const desiredCam = sim.phase === 'flight' ? 1 : 0;
        sim.camT += (desiredCam - sim.camT) * Math.min(1, dt * 5.2);

        const st = STADIUMS[activeStadiumId] || STADIUMS.fenway;
        const bat = BATS[activeBatId] || BATS['goods-2026'];

        // Advance State Machine & Compute 3D World Ball Positions
        if (sim.phase === 'windup') {
          sim.t += dt / 0.42;
          if (sim.t >= 1) {
            sim.phase = 'pitch';
            sim.t = 0;
          }
        } else if (sim.phase === 'pitch' && sim.pitch) {
          sim.t += dt / sim.pitch.dur;
          const p = Math.min(1.06, sim.t);
          const easeP = Math.pow(p, 1.05);

          // 3D world pitch trajectory from pitcher's release (0.9, 6.2, -55) to plate (px, py, 0)
          const plateX = sim.pitch.endX * 0.88;
          const plateY = 2.65 - sim.pitch.endY * 1.0; // strike zone center y=2.65 ft
          const bx = 0.9 + (plateX - 0.9) * easeP - Math.sin(p * Math.PI * 0.65) * sim.pitch.breakX * 1.6 * (1 - p);
          const by = 6.2 + (plateY - 6.2) * easeP + Math.sin(p * Math.PI) * sim.pitch.dropFt * 0.55;
          const bz = -55 + 55 * easeP;
          sim.pitchPos = { x: bx, y: Math.max(0.32, by), z: bz };

          if (sim.demoAutoSwing || autoPciMode) {
            pci.targetX = sim.pitch.endX;
            pci.targetY = sim.pitch.endY + (sim.demoAutoSwing ? 0.30 : 0.22);
          }

          if (sim.demoAutoSwing && !sim.swingTriggered && sim.t >= 0.92) {
            sim.swingTriggered = true;
            resolveSwing();
          }

          if (sim.swingTriggered && sim.phase === 'pitch') {
            sim.swingT += dt * 7.5;
            sim.swingAngle = -0.45 + sim.swingT * 1.45;
          }

          if (sim.t >= 1.06 && sim.phase === 'pitch') {
            if (!sim.contactResolved) {
              const isStrike = Math.abs(sim.pitch.endX) <= 1.05 && Math.abs(sim.pitch.endY) <= 1.05;
              let call = isStrike ? 'Called Strike' : 'Ball';
              if (isStrike) {
                session.strikes++;
                if (session.strikes >= 3) {
                  call = 'Called Strikeout!';
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
              sim.calloutText = call.toUpperCase();
              sim.calloutSub = sim.pitch.name;
              sim.calloutTimer = 1.25;
              updateSessionDom({ exitVelo: null, launchAngle: null, dist: null, apex: null, outcome: call, color: isStrike ? '#f87171' : '#38bdf8' });
              if (swingBtn) swingBtn.textContent = 'Throw Pitch';
            }
            sim.phase = 'idle';
          }
        } else if (sim.phase === 'flight' && sim.flight) {
          const fl = sim.flight;
          fl.playTime += dt * 1.05;
          sim.swingAngle = Math.min(0.95, sim.swingAngle + dt * 5.2);

          const progress = Math.min(1, fl.playTime / Math.max(0.8, fl.totalTime));
          const maxIdx = Math.max(1, Math.floor(progress * (fl.points.length - 1)));
          sim.flightMaxIdx = maxIdx;
          sim.flightCur = fl.points[maxIdx];

          if (fl.playTime >= fl.totalTime + 1.15) {
            sim.phase = 'idle';
            sim.swingAngle = -0.42;
          }
        } else {
          sim.swingAngle = -0.42 + Math.sin(ts * 0.0022) * 0.028;
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
            hctx.fillStyle = 'rgba(10, 18, 32, 0.16)';
            hctx.fillRect(zr.x, zr.y, zr.w, zr.h);
            hctx.strokeStyle = 'rgba(248, 250, 252, 0.72)';
            hctx.lineWidth = 1.8;
            hctx.strokeRect(zr.x, zr.y, zr.w, zr.h);

            hctx.strokeStyle = 'rgba(248, 250, 252, 0.25)';
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

            // MLB The Show Mini PCI Reticle scaled by bat sweetSpot
            const drawPciX = zr.cx + pci.x * (zr.w * 0.5);
            const drawPciY = zr.cy + pci.y * (zr.h * 0.5);
            const rxOuter = 30 * bat.sweetSpot;
            const ryOuter = 19 * bat.sweetSpot;
            const rxInner = 15 * bat.sweetSpot;
            const ryInner = 9.5 * bat.sweetSpot;

            hctx.strokeStyle = autoPciMode ? 'rgba(251, 191, 36, 0.85)' : 'rgba(56, 189, 248, 0.9)';
            hctx.lineWidth = 1.8;
            hctx.beginPath();
            hctx.ellipse(drawPciX, drawPciY, rxOuter, ryOuter, 0, 0, Math.PI * 2);
            hctx.stroke();

            hctx.fillStyle = autoPciMode ? 'rgba(251, 191, 36, 0.18)' : 'rgba(56, 189, 248, 0.2)';
            hctx.beginPath();
            hctx.ellipse(drawPciX, drawPciY, rxInner, ryInner, 0, 0, Math.PI * 2);
            hctx.fill();
            hctx.strokeStyle = '#ffffff';
            hctx.lineWidth = 1.4;
            hctx.stroke();

            hctx.fillStyle = '#fde047';
            hctx.beginPath();
            hctx.arc(drawPciX, drawPciY, 2.6, 0, Math.PI * 2);
            hctx.fill();

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
          sim.swingTriggered = true;
          resolveSwing();
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
            sim.swingTriggered = true;
            resolveSwing();
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

      if (stadiumTabs) {
        stadiumTabs.onclick = (e) => {
          const btn = e.target.closest('[data-stadium]');
          if (!btn) return;
          cageEngaged = true;
          activeStadiumId = btn.dataset.stadium;
          stadiumTabs.querySelectorAll('[data-stadium]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
          if (engine3D) engine3D.setStadium(activeStadiumId);
          drawSprayChart();
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

      if (swingBtn) {
        swingBtn.onclick = () => {
          cageEngaged = true;
          if (sim.phase === 'pitch') {
            sim.swingTriggered = true;
            resolveSwing();
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
          session.hits = 0;
          session.hrs = 0;
          session.balls = 0;
          session.strikes = 0;
          session.outs = 0;
          updateSessionDom({ exitVelo: null, launchAngle: null, dist: null, apex: null, outcome: 'Chart Cleared', color: 'var(--accent)' });
        };
      }

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
      if (!favBtn) return;
      if (!currentUser) {
        showToast('Log in first to save favorite plays.');
        return;
      }
      const sid = favBtn.dataset.favId;
      const isSaved = favoriteIds.has(sid);
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
          if (!currentUser) {
            showToast('Log in first to save plays.');
            return;
          }
          try {
            await api(`/api/favorites/${encodeURIComponent(scenario.id)}`, {
              method: savedFav ? 'DELETE' : 'POST'
            });
            savedFav = !savedFav;
            syncFavBtn();
            showToast(savedFav ? 'Saved to favorites!' : 'Removed from favorites.');
          } catch (err) {
            showToast(err.message);
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
          if (!btn) return;
          if (!currentUser) {
            showToast('Log in to rate this play.');
            return;
          }
          const stars = Number(btn.dataset.star);
          try {
            const updated = await api(`/api/scenarios/${encodeURIComponent(scenario.id)}/rating`, {
              method: 'POST',
              body: JSON.stringify({ stars })
            });
            renderRating(updated);
            showToast(`Rated ${stars} out of 5 stars!`);
          } catch (err) {
            showToast(err.message);
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
        triviaForm.onsubmit = async (e) => {
          e.preventDefault();
          const chosen = triviaForm.querySelector('input[name="trivia"]:checked');
          if (!chosen) {
            setBanner(triviaFeedback, 'warning', 'Pick an answer choice first!');
            return;
          }
          try {
            const res = await api(`/api/scenarios/${encodeURIComponent(scenario.id)}/trivia`, {
              method: 'POST',
              body: JSON.stringify({ answerKey: chosen.value })
            });
            if (res.correct) {
              const extra = res.mastered ? ' Saved to your mastered plays!' : '';
              setBanner(triviaFeedback, 'success', `${res.explanation}${extra}`);
              if (res.mastered && masteredNote) masteredNote.hidden = false;
            } else {
              setBanner(triviaFeedback, 'error', `Not quite — ${res.explanation}`);
            }
          } catch (err) {
            setBanner(triviaFeedback, 'error', err.message);
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

    if (!currentUser) {
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

    await Promise.all([loadEntries(), loadFavorites()]);
  }

  /* =========================================================
     Auth Pages (Login & Register)
     ========================================================= */
  function initAuthForms() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      const errEl = document.getElementById('login-error');
      loginForm.onsubmit = async (e) => {
        e.preventDefault();
        setBanner(errEl, '', '');
        const identifier = document.getElementById('login-user').value.trim();
        const password = document.getElementById('login-pass').value;
        if (!identifier) {
          setBanner(errEl, 'error', 'Enter your username or email.');
          return;
        }
        if (password.length < 8) {
          setBanner(errEl, 'error', 'Password must be at least 8 characters.');
          return;
        }
        try {
          await api('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ identifier, password })
          });
          window.location.href = 'playbook.html';
        } catch (err) {
          setBanner(errEl, 'error', err.message);
        }
      };
    }

    const regForm = document.getElementById('register-form');
    if (regForm) {
      const errEl = document.getElementById('register-error');
      regForm.onsubmit = async (e) => {
        e.preventDefault();
        setBanner(errEl, '', '');
        const username = document.getElementById('reg-user').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-pass').value;

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

        try {
          await api('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password })
          });
          window.location.href = 'playbook.html';
        } catch (err) {
          setBanner(errEl, 'error', err.message);
        }
      };
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
  });
})();
