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
     Tactical SVG Baseball Diamond & Analytics Diagrams
     step = 0 (Setup), 1 (The Play), 2 (Key Rule / Result)
     ========================================================= */
  function renderDiagramSvg(diagram, step = 1) {
    if (!diagram) return '';

    if (diagram.mode === 'statcast-arc') {
      const showBarrel = step >= 1;
      const showNote = step === 2;
      return `
        <svg class="diamond-svg" viewBox="0 0 320 220" role="img" aria-label="${escapeHtml(diagram.callout)}">
          <rect x="0" y="0" width="320" height="220" rx="12" fill="var(--field-turf)"/>
          <line x1="36" y1="184" x2="290" y2="184" stroke="var(--field-line)" stroke-width="2.5"/>
          <path d="M 36 184 L 270 155" fill="none" stroke="var(--text-muted)" stroke-width="2" stroke-dasharray="4 4"/>
          <path d="M 36 184 Q 120 45 200 26" fill="none" stroke="var(--text-muted)" stroke-width="2" stroke-dasharray="4 4"/>
          ${showBarrel ? '<path d="M 36 184 Q 155 110 285 95" fill="none" stroke="var(--accent)" stroke-width="4.5"/>' : ''}
          <line x1="36" y1="184" x2="275" y2="62" stroke="var(--stitch)" stroke-width="2.5" stroke-dasharray="6 4"/>
          <circle cx="36" cy="184" r="7" fill="var(--field-line)" stroke="var(--field-ink)" stroke-width="2"/>
          <rect x="174" y="72" width="122" height="28" rx="6" fill="var(--bg-surface)" stroke="var(--accent)" stroke-width="1.5"/>
          <text x="235" y="90" text-anchor="middle" font-size="11" font-weight="700" fill="var(--field-ink)">${showNote ? '98+ MPH · .500+ AVG' : '26°–30° BARREL'}</text>
          <text x="278" y="152" text-anchor="end" font-size="10" font-weight="600" fill="var(--field-ink)">10°–25° Line Drive</text>
          <text x="198" y="42" text-anchor="end" font-size="10" font-weight="600" fill="var(--field-ink)">50°+ Pop-up</text>
        </svg>`;
    }

    if (diagram.mode === 'framing-zone') {
      const ballY = step === 0 ? 168 : step === 1 ? 152 : 142;
      return `
        <svg class="diamond-svg" viewBox="0 0 320 220" role="img" aria-label="${escapeHtml(diagram.callout)}">
          <defs>
            <marker id="arrowHead" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="var(--accent)"/>
            </marker>
          </defs>
          <rect x="0" y="0" width="320" height="220" rx="12" fill="var(--field-turf)"/>
          <rect x="108" y="42" width="104" height="114" rx="6" fill="var(--bg-surface)" fill-opacity="0.9" stroke="var(--field-ink)" stroke-width="2.5"/>
          <rect x="96" y="30" width="128" height="138" rx="10" fill="none" stroke="var(--accent)" stroke-width="2" stroke-dasharray="5 4"/>
          <polygon points="124,182 196,182 196,194 160,206 124,194" fill="var(--field-line)" stroke="var(--field-ink)" stroke-width="2"/>
          <circle cx="160" cy="${ballY}" r="9" fill="var(--stitch)"/>
          ${step >= 1 ? '<path d="M 160 168 L 160 138" stroke="var(--accent)" stroke-width="3" marker-end="url(#arrowHead)"/>' : ''}
          <text x="160" y="23" text-anchor="middle" font-size="11" font-weight="700" fill="var(--field-ink)">SHADOW ZONE + STRIKE ZONE</text>
          <text x="160" y="98" text-anchor="middle" font-size="11" font-weight="600" fill="var(--field-ink)">${step === 2 ? 'Hold glove steady!' : 'Catch smoothly upward'}</text>
        </svg>`;
    }

    if (diagram.mode === 'xwoba-scale') {
      const fillW = step === 0 ? 78 : step === 1 ? 142 : 185;
      return `
        <svg class="diamond-svg" viewBox="0 0 320 220" role="img" aria-label="${escapeHtml(diagram.callout)}">
          <rect x="0" y="0" width="320" height="220" rx="12" fill="var(--field-turf)"/>
          <rect x="24" y="44" width="272" height="132" rx="10" fill="var(--bg-surface)" stroke="var(--border-strong)" stroke-width="1.5"/>
          <text x="160" y="70" text-anchor="middle" font-size="12" font-weight="700" fill="var(--field-ink)">xwOBA Contact Quality Scale</text>
          <rect x="44" y="92" width="232" height="18" rx="9" fill="var(--bg-muted)"/>
          <rect x="44" y="92" width="${fillW}" height="18" rx="9" fill="var(--accent)"/>
          <circle cx="122" cy="101" r="6" fill="var(--bg-surface)" stroke="var(--field-ink)" stroke-width="2"/>
          <circle cx="185" cy="101" r="6" fill="var(--bg-surface)" stroke="var(--field-ink)" stroke-width="2"/>
          <circle cx="229" cy="101" r="6" fill="var(--bg-surface)" stroke="var(--field-ink)" stroke-width="2"/>
          <text x="122" y="132" text-anchor="middle" font-size="10" font-weight="700" fill="var(--field-ink)">.320 Avg</text>
          <text x="185" y="132" text-anchor="middle" font-size="10" font-weight="700" fill="var(--field-ink)">.370 Great</text>
          <text x="234" y="132" text-anchor="middle" font-size="10" font-weight="700" fill="var(--field-ink)">.400+ MVP</text>
          <text x="160" y="158" text-anchor="middle" font-size="10.5" font-weight="600" fill="var(--text-secondary)">${step === 0 ? 'Hard hit + walks count most' : '104 mph lineout = .000 AVG, ~.650 xwOBA'}</text>
        </svg>`;
    }

    const coords = {
      HOME: [160, 192],
      '1B': [228, 126],
      '2B': [160, 60],
      '3B': [92, 126],
      P: [160, 128],
      SS: [122, 80],
      LF: [64, 42],
      CF: [160, 26]
    };

    const occupied = new Set(diagram.occupiedBases || []);
    const highlight = step === 0 ? '' : diagram.highlightBase || '';
    const fromPt = coords[diagram.throwFrom] || coords.SS;
    const toPt = coords[diagram.throwTo] || coords['2B'];

    const baseSquare = (name, cx, cy) => {
      const isOccupied = occupied.has(name);
      const isHighlight = highlight === name;
      const fill = isHighlight ? 'var(--accent)' : isOccupied ? 'var(--stitch)' : 'var(--field-line)';
      return `
        <g>
          <rect x="${cx - 8}" y="${cy - 8}" width="16" height="16" rx="2" transform="rotate(45 ${cx} ${cy})" fill="${fill}" stroke="var(--field-ink)" stroke-width="2"/>
          ${isOccupied ? `<circle cx="${cx}" cy="${cy - 18}" r="6" fill="var(--stitch)" stroke="var(--bg-surface)" stroke-width="2"/>` : ''}
        </g>`;
    };

    let throwPath = '';
    if (step >= 1) {
      throwPath = diagram.mode === 'relay-throw'
        ? `<line x1="${coords.LF[0]}" y1="${coords.LF[1]}" x2="${coords.SS[0]}" y2="${coords.SS[1]}" stroke="var(--accent)" stroke-width="2.5" stroke-dasharray="5 4"/>
           <line x1="${coords.SS[0]}" y1="${coords.SS[1]}" x2="${coords.HOME[0]}" y2="${coords.HOME[1]}" stroke="var(--accent)" stroke-width="2.5" stroke-dasharray="5 4" marker-end="url(#throwArrow)"/>
           <circle cx="${coords.SS[0]}" cy="${coords.SS[1]}" r="7" fill="var(--bg-surface)" stroke="var(--accent)" stroke-width="2.5"/>
           <text x="${coords.SS[0] - 12}" y="${coords.SS[1] - 10}" font-size="10" font-weight="700" fill="var(--field-ink)">CUT</text>`
        : `<line x1="${fromPt[0]}" y1="${fromPt[1]}" x2="${toPt[0]}" y2="${toPt[1]}" stroke="var(--accent)" stroke-width="2.5" stroke-dasharray="5 4" marker-end="url(#throwArrow)"/>`;
    }

    let runnerArrow = '';
    if (step >= 1) {
      runnerArrow = diagram.mode === 'steal-2b'
        ? `<line x1="222" y1="120" x2="170" y2="68" stroke="var(--field-ink)" stroke-width="2.5" marker-end="url(#runArrow)"/>`
        : diagram.mode === 'tag-up'
        ? `<line x1="98" y1="132" x2="150" y2="184" stroke="var(--field-ink)" stroke-width="2.5" marker-end="url(#runArrow)"/>`
        : diagram.mode === 'infield-force'
        ? `<line x1="222" y1="120" x2="170" y2="68" stroke="var(--field-ink)" stroke-width="2.5" marker-end="url(#runArrow)"/>`
        : '';
    }

    const calloutPill = step === 2
      ? `<rect x="20" y="8" width="280" height="22" rx="5" fill="var(--bg-surface)" stroke="var(--accent)" stroke-width="1.5"/>
         <text x="160" y="23" text-anchor="middle" font-size="9.5" font-weight="700" fill="var(--field-ink)">${escapeHtml(diagram.callout.slice(0, 48))}</text>`
      : '';

    return `
      <svg class="diamond-svg" viewBox="0 0 320 220" role="img" aria-label="${escapeHtml(diagram.callout)}">
        <defs>
          <marker id="throwArrow" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="var(--accent)"/>
          </marker>
          <marker id="runArrow" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="var(--field-ink)"/>
          </marker>
        </defs>
        <rect x="0" y="0" width="320" height="220" rx="12" fill="var(--field-turf)"/>
        <polygon points="160,44 244,126 160,206 76,126" fill="var(--field-dirt)"/>
        <polygon points="160,60 228,126 160,192 92,126" fill="var(--field-turf)" stroke="var(--field-line)" stroke-width="2"/>
        <circle cx="160" cy="128" r="10" fill="var(--field-dirt)" stroke="var(--field-line)" stroke-width="1.5"/>
        ${throwPath}
        ${runnerArrow}
        ${baseSquare('2B', 160, 60)}
        ${baseSquare('1B', 228, 126)}
        ${baseSquare('3B', 92, 126)}
        <polygon points="152,186 168,186 168,194 160,201 152,194" fill="${highlight === 'HOME' ? 'var(--accent)' : 'var(--field-line)'}" stroke="var(--field-ink)" stroke-width="2"/>
        <text x="248" y="130" font-size="10" font-weight="700" fill="var(--field-ink)">1B</text>
        <text x="160" y="42" text-anchor="middle" font-size="10" font-weight="700" fill="var(--field-ink)">2B</text>
        <text x="72" y="130" text-anchor="end" font-size="10" font-weight="700" fill="var(--field-ink)">3B</text>
        ${calloutPill}
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

    // 3. Interactive Statcast Hit Lab
    const veloSlider = document.getElementById('velo-slider');
    const angleSlider = document.getElementById('angle-slider');
    const veloVal = document.getElementById('velo-val');
    const angleVal = document.getElementById('angle-val');
    const hitWrap = document.getElementById('hitlab-svg-wrap');
    const distEl = document.getElementById('hitlab-dist');
    const outEl = document.getElementById('hitlab-outcome');
    const xbaEl = document.getElementById('hitlab-xba');
    const presetsWrap = document.getElementById('hitlab-presets');

    const updateHitLab = () => {
      if (!veloSlider || !angleSlider || !hitWrap) return;
      const mph = Number(veloSlider.value);
      const deg = Number(angleSlider.value);
      if (veloVal) veloVal.textContent = `${mph} mph`;
      if (angleVal) angleVal.textContent = `${deg}°`;

      // Simplified readable baseball distance & outcome physics
      let dist = 0;
      let peakY = 175;
      if (deg <= 2) {
        dist = Math.round(45 + (mph - 60) * 1.4 + Math.max(0, deg + 10) * 4);
        peakY = 178;
      } else {
        const angleFactor = Math.sin((Math.min(55, Math.max(3, deg)) * Math.PI) / 90);
        const carryFactor = Math.cos(((deg - 28) * Math.PI) / 110);
        dist = Math.max(60, Math.round((mph * mph * 0.041) * Math.max(0.28, carryFactor) * (0.45 + 0.55 * angleFactor)));
        peakY = Math.max(24, Math.round(182 - deg * 2.7 - (mph - 65) * 0.45));
      }

      let outcome = 'Routine Out';
      let xba = '.180';
      let arcColor = 'var(--accent)';

      if (deg < 8) {
        outcome = mph >= 95 ? 'Hard Grounder' : 'Ground Ball';
        xba = mph >= 95 ? '.290' : '.210';
        arcColor = 'var(--gold)';
      } else if (deg >= 8 && deg <= 22) {
        outcome = mph >= 95 ? 'Rocket Line Drive!' : 'Line Drive Single';
        xba = mph >= 95 ? '.720' : '.540';
        arcColor = 'var(--accent)';
      } else if (deg >= 23 && deg <= 34 && dist >= 385) {
        outcome = mph >= 98 ? 'BARREL HOME RUN!' : 'Over the Wall HR!';
        xba = '.860';
        arcColor = 'var(--accent)';
      } else if (deg > 38) {
        outcome = dist < 210 ? 'Infield Pop-Up' : 'High Fly Out';
        xba = dist < 210 ? '.030' : '.140';
        arcColor = 'var(--stitch)';
      } else {
        outcome = dist >= 330 ? 'Deep Warning-Track Fly' : 'Outfield Fly Ball';
        xba = dist >= 340 ? '.380' : '.240';
        arcColor = 'var(--gold)';
      }

      if (distEl) distEl.textContent = `${dist} ft`;
      if (outEl) {
        outEl.textContent = outcome;
        outEl.style.color = arcColor;
      }
      if (xbaEl) xbaEl.textContent = xba;

      // Map 0..450ft to x=36..444 inside SVG viewBox 480x210; fence at ~400ft (x=392)
      const endX = Math.min(458, Math.max(68, Math.round(36 + (dist / 450) * 408)));
      const midX = Math.round((36 + endX) / 2);
      const endY = dist >= 400 ? 158 : 182;

      hitWrap.innerHTML = `
        <svg viewBox="0 0 480 210" style="width:100%;height:auto;display:block;border-radius:8px;background:var(--field-turf);" role="img" aria-label="Baseball flight arc ${dist} feet">
          <line x1="20" y1="184" x2="462" y2="184" stroke="var(--field-line)" stroke-width="2"/>
          <rect x="392" y="138" width="6" height="46" rx="2" fill="var(--gold)"/>
          <text x="395" y="131" text-anchor="middle" font-size="10" font-weight="700" fill="var(--field-ink)">400 ft Wall</text>
          <text x="150" y="198" text-anchor="middle" font-size="10" font-weight="600" fill="var(--field-ink)">Infield (120 ft)</text>
          <text x="300" y="198" text-anchor="middle" font-size="10" font-weight="600" fill="var(--field-ink)">Outfield (300 ft)</text>
          <path d="M 36 184 Q ${midX} ${peakY} ${endX} ${endY}" fill="none" stroke="${arcColor}" stroke-width="4" stroke-linecap="round"/>
          <circle cx="36" cy="184" r="6" fill="var(--field-line)" stroke="var(--field-ink)" stroke-width="2"/>
          <circle cx="${endX}" cy="${endY}" r="7" fill="${arcColor}" stroke="var(--bg-surface)" stroke-width="2"/>
        </svg>`;
    };

    if (veloSlider && angleSlider) {
      veloSlider.oninput = updateHitLab;
      angleSlider.oninput = updateHitLab;
      if (presetsWrap) {
        presetsWrap.onclick = (e) => {
          const btn = e.target.closest('[data-velo]');
          if (!btn) return;
          veloSlider.value = btn.dataset.velo;
          angleSlider.value = btn.dataset.angle;
          presetsWrap.querySelectorAll('[data-velo]').forEach((b) => {
            b.setAttribute('aria-pressed', String(b === btn));
          });
          updateHitLab();
        };
      }
      updateHitLab();
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
      try {
        await refreshFavorites();
        const data = await api(`/api/scenarios?${params.toString()}`);
        lastScenarios = data.scenarios || [];
        renderGrid();
      } catch {
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
    } catch {
      /* keep fallback */
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
      navToggle.addEventListener('click', () => {
        const isOpen = siteNav.classList.toggle('is-open');
        navToggle.setAttribute('aria-expanded', String(isOpen));
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
