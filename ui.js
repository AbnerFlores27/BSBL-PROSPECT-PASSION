/* DiamondIQ — Client Controller
   Handles theme toggle, mobile navigation, global auth state,
   tactical SVG baseball diagrams, Scenario Library filters/pagination,
   5-Expert Deep-Dive + Trivia + Ratings, Comparison Tool, Playbook CRUD,
   and Login/Register forms. */
(function () {
  'use strict';

  const THEME_KEY = 'diamondiq_theme';
  let currentUser = null;
  let toastTimer = null;

  /* =========================================================
     Utilities
     ========================================================= */
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
    }, 3200);
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

  /* =========================================================
     Theme & Mobile Nav
     ========================================================= */
  function getTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    const isDark = theme === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    try {
      localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    } catch {
      /* ignore */
    }
    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.setAttribute('aria-pressed', String(isDark));
      btn.innerHTML = isDark
        ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg><span>Light Mode</span>'
        : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg><span>Dark Mode</span>';
    }
  }

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
            showToast('Logged out successfully.');
            await syncAuthNav();
            if (document.getElementById('playbook')) {
              await initPlaybookPage();
            } else if (document.getElementById('home')) {
              await initHomePage();
            } else if (document.getElementById('library')) {
              await initScenariosPage();
            } else if (document.getElementById('deep-dive')) {
              await initDetailPage();
            }
          } catch (err) {
            showToast(err.message);
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
     Tactical SVG Baseball Diamond & Analytics Diagrams
     ========================================================= */
  function renderDiagramSvg(diagram) {
    if (!diagram) return '';

    if (diagram.mode === 'statcast-arc') {
      return `
        <svg class="diamond-svg" viewBox="0 0 320 220" role="img" aria-label="${escapeHtml(diagram.callout)}">
          <rect x="0" y="0" width="320" height="220" rx="12" fill="var(--field-turf)"/>
          <line x1="36" y1="184" x2="290" y2="184" stroke="var(--field-line)" stroke-width="2.5"/>
          <line x1="36" y1="184" x2="275" y2="62" stroke="var(--accent)" stroke-width="2.5" stroke-dasharray="6 4"/>
          <path d="M 36 184 Q 155 110 285 95" fill="none" stroke="var(--accent)" stroke-width="4"/>
          <path d="M 36 184 L 270 155" fill="none" stroke="var(--text-muted)" stroke-width="2" stroke-dasharray="4 4"/>
          <path d="M 36 184 Q 120 45 200 26" fill="none" stroke="var(--text-muted)" stroke-width="2" stroke-dasharray="4 4"/>
          <circle cx="36" cy="184" r="7" fill="var(--field-line)" stroke="var(--field-ink)" stroke-width="2"/>
          <rect x="176" y="72" width="118" height="28" rx="6" fill="var(--bg-surface)" stroke="var(--accent)" stroke-width="1.5"/>
          <text x="235" y="90" text-anchor="middle" font-size="11" font-weight="700" fill="var(--field-ink)">26°–30° BARREL</text>
          <text x="278" y="152" text-anchor="end" font-size="10" font-weight="600" fill="var(--field-ink)">10°–25° Line Drive</text>
          <text x="198" y="42" text-anchor="end" font-size="10" font-weight="600" fill="var(--field-ink)">50°+ Pop-up</text>
        </svg>`;
    }

    if (diagram.mode === 'framing-zone') {
      return `
        <svg class="diamond-svg" viewBox="0 0 320 220" role="img" aria-label="${escapeHtml(diagram.callout)}">
          <rect x="0" y="0" width="320" height="220" rx="12" fill="var(--field-turf)"/>
          <rect x="108" y="42" width="104" height="114" rx="6" fill="var(--bg-surface)" fill-opacity="0.88" stroke="var(--field-ink)" stroke-width="2.5"/>
          <rect x="96" y="30" width="128" height="138" rx="10" fill="none" stroke="var(--accent)" stroke-width="2" stroke-dasharray="5 4"/>
          <polygon points="124,182 196,182 196,194 160,206 124,194" fill="var(--field-line)" stroke="var(--field-ink)" stroke-width="2"/>
          <circle cx="160" cy="154" r="10" fill="var(--accent)"/>
          <path d="M 160 166 L 160 140" stroke="var(--accent)" stroke-width="3" marker-end="url(#arrowHead)"/>
          <defs>
            <marker id="arrowHead" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="var(--accent)"/>
            </marker>
          </defs>
          <text x="160" y="24" text-anchor="middle" font-size="11" font-weight="700" fill="var(--field-ink)">SHADOW ZONE + STRIKE ZONE</text>
          <text x="160" y="102" text-anchor="middle" font-size="11" font-weight="600" fill="var(--field-ink)">Catch smoothly upward</text>
        </svg>`;
    }

    if (diagram.mode === 'xwoba-scale') {
      return `
        <svg class="diamond-svg" viewBox="0 0 320 220" role="img" aria-label="${escapeHtml(diagram.callout)}">
          <rect x="0" y="0" width="320" height="220" rx="12" fill="var(--field-turf)"/>
          <rect x="24" y="44" width="272" height="132" rx="10" fill="var(--bg-surface)" stroke="var(--border-strong)" stroke-width="1.5"/>
          <text x="160" y="70" text-anchor="middle" font-size="12" font-weight="700" fill="var(--field-ink)">xwOBA Contact Quality Scale</text>
          <rect x="44" y="92" width="232" height="18" rx="9" fill="var(--bg-muted)"/>
          <rect x="44" y="92" width="185" height="18" rx="9" fill="var(--accent)"/>
          <circle cx="122" cy="101" r="6" fill="var(--bg-surface)" stroke="var(--field-ink)" stroke-width="2"/>
          <circle cx="185" cy="101" r="6" fill="var(--bg-surface)" stroke="var(--field-ink)" stroke-width="2"/>
          <circle cx="229" cy="101" r="6" fill="var(--bg-surface)" stroke="var(--field-ink)" stroke-width="2"/>
          <text x="122" y="132" text-anchor="middle" font-size="10" font-weight="700" fill="var(--field-ink)">.320 Avg</text>
          <text x="185" y="132" text-anchor="middle" font-size="10" font-weight="700" fill="var(--field-ink)">.370 Great</text>
          <text x="234" y="132" text-anchor="middle" font-size="10" font-weight="700" fill="var(--field-ink)">.400+ MVP</text>
          <text x="160" y="158" text-anchor="middle" font-size="10.5" font-weight="600" fill="var(--text-secondary)">104 mph lineout = .000 AVG, ~.650 xwOBA</text>
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
    const highlight = diagram.highlightBase || '';
    const fromPt = coords[diagram.throwFrom] || coords.SS;
    const toPt = coords[diagram.throwTo] || coords['2B'];

    const baseSquare = (name, cx, cy) => {
      const isOccupied = occupied.has(name);
      const isHighlight = highlight === name;
      const fill = isHighlight ? 'var(--accent)' : isOccupied ? 'var(--powder)' : 'var(--field-line)';
      const stroke = isHighlight || isOccupied ? 'var(--field-ink)' : 'var(--field-ink)';
      return `
        <g>
          <rect x="${cx - 8}" y="${cy - 8}" width="16" height="16" rx="2" transform="rotate(45 ${cx} ${cy})" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
          ${isOccupied ? `<circle cx="${cx}" cy="${cy - 18}" r="6" fill="var(--accent)" stroke="var(--bg-surface)" stroke-width="2"/>` : ''}
        </g>`;
    };

    const relayHop = diagram.mode === 'relay-throw'
      ? `<line x1="${coords.LF[0]}" y1="${coords.LF[1]}" x2="${coords.SS[0]}" y2="${coords.SS[1]}" stroke="var(--accent)" stroke-width="2.5" stroke-dasharray="5 4"/>
         <line x1="${coords.SS[0]}" y1="${coords.SS[1]}" x2="${coords.HOME[0]}" y2="${coords.HOME[1]}" stroke="var(--accent)" stroke-width="2.5" stroke-dasharray="5 4" marker-end="url(#throwArrow)"/>
         <circle cx="${coords.SS[0]}" cy="${coords.SS[1]}" r="7" fill="var(--bg-surface)" stroke="var(--accent)" stroke-width="2.5"/>
         <text x="${coords.SS[0] - 12}" y="${coords.SS[1] - 10}" font-size="10" font-weight="700" fill="var(--field-ink)">CUT</text>`
      : `<line x1="${fromPt[0]}" y1="${fromPt[1]}" x2="${toPt[0]}" y2="${toPt[1]}" stroke="var(--accent)" stroke-width="2.5" stroke-dasharray="5 4" marker-end="url(#throwArrow)"/>`;

    const runnerArrow = diagram.mode === 'steal-2b'
      ? `<line x1="222" y1="120" x2="170" y2="68" stroke="var(--field-ink)" stroke-width="2.5" marker-end="url(#runArrow)"/>`
      : diagram.mode === 'tag-up'
      ? `<line x1="98" y1="132" x2="150" y2="184" stroke="var(--field-ink)" stroke-width="2.5" marker-end="url(#runArrow)"/>`
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
        <path d="M 30 140 A 150 150 0 0 1 290 140 L 160 208 Z" fill="var(--field-turf)"/>
        <polygon points="160,44 244,126 160,206 76,126" fill="var(--field-dirt)"/>
        <polygon points="160,60 228,126 160,192 92,126" fill="var(--field-turf)" stroke="var(--field-line)" stroke-width="2"/>
        <circle cx="160" cy="128" r="10" fill="var(--field-dirt)" stroke="var(--field-line)" stroke-width="1.5"/>
        ${relayHop}
        ${runnerArrow}
        ${baseSquare('2B', 160, 60)}
        ${baseSquare('1B', 228, 126)}
        ${baseSquare('3B', 92, 126)}
        <polygon points="152,186 168,186 168,194 160,201 152,194" fill="${highlight === 'HOME' ? 'var(--accent)' : 'var(--field-line)'}" stroke="var(--field-ink)" stroke-width="2"/>
        <text x="248" y="130" font-size="10" font-weight="700" fill="var(--field-ink)">1B</text>
        <text x="160" y="42" text-anchor="middle" font-size="10" font-weight="700" fill="var(--field-ink)">2B</text>
        <text x="72" y="130" text-anchor="end" font-size="10" font-weight="700" fill="var(--field-ink)">3B</text>
      </svg>`;
  }

  /* =========================================================
     View 1: Home / Dashboard
     ========================================================= */
  async function initHomePage() {
    const stage = document.getElementById('home-diamond-stage');
    if (stage) {
      try {
        const { scenario } = await api('/api/scenarios/force-vs-tag');
        stage.innerHTML = renderDiagramSvg(scenario.diagram);
      } catch {
        /* ignore */
      }
    }

    try {
      const stats = await api('/api/stats');
      const playsEl = document.getElementById('kpi-plays');
      if (playsEl) playsEl.textContent = String(stats.totalScenarios);

      const cdEl = document.getElementById('kpi-countdown');
      const cdNote = document.getElementById('kpi-countdown-note');
      if (cdEl) cdEl.textContent = `${stats.daysUntilOpeningDay}d`;
      if (cdNote) cdNote.textContent = 'Days to Mar 25, 2027 opener';

      const progLabel = document.getElementById('kpi-progress-label');
      const progVal = document.getElementById('kpi-progress-value');
      const progNote = document.getElementById('kpi-progress-note');
      if (stats.userStats && progLabel && progVal && progNote) {
        progLabel.textContent = 'Your Progress';
        progVal.textContent = `${stats.userStats.masteredCount}/${stats.totalScenarios}`;
        progNote.textContent = `${stats.userStats.favoritesCount} saved · ${stats.userStats.playbookCount} notes`;
      } else if (progLabel && progVal && progNote) {
        progLabel.textContent = 'Built For';
        progVal.textContent = '10+';
        progNote.textContent = 'New fans & youth players';
      }

      const facts = stats.funFacts || [];
      const factEl = document.getElementById('fact-text');
      const nextBtn = document.getElementById('next-fact-btn');
      if (facts.length > 0 && factEl && nextBtn) {
        let factIdx = 0;
        factEl.textContent = facts[factIdx];
        nextBtn.onclick = () => {
          factIdx = (factIdx + 1) % facts.length;
          factEl.textContent = facts[factIdx];
        };
      }
    } catch {
      /* fallback static values stay visible */
    }
  }

  /* =========================================================
     View 2: Scenario Library
     ========================================================= */
  async function initScenariosPage() {
    const listEl = document.getElementById('scenario-list');
    const emptyEl = document.getElementById('empty-state');
    const countEl = document.getElementById('scenario-count');
    const searchInput = document.getElementById('search-box');
    const sortSelect = document.getElementById('sort-by');
    const pageSizeSelect = document.getElementById('page-size');
    const catButtons = Array.from(document.querySelectorAll('.segmented-btn[data-category]'));
    const pagBar = document.getElementById('pagination-bar');
    const prevBtn = document.getElementById('prev-page-btn');
    const nextBtn = document.getElementById('next-page-btn');
    const pageIndicator = document.getElementById('page-indicator');

    let allScenarios = [];
    let favIds = new Set();
    let activeCategory = 'all';
    let currentPage = 1;

    async function loadLibraryData() {
      const [sRes, fRes] = await Promise.all([
        api('/api/scenarios'),
        api('/api/favorites').catch(() => ({ favorites: [] }))
      ]);
      allScenarios = sRes.scenarios || [];
      favIds = new Set(fRes.favorites || []);
    }

    function diffLabel(d) {
      if (d === 1) return 'Easy';
      if (d === 2) return 'Medium';
      return 'Advanced';
    }

    function render() {
      const q = (searchInput?.value || '').trim().toLowerCase();
      const sort = sortSelect?.value || 'az';
      const pageSizeRaw = pageSizeSelect?.value || 'all';

      let filtered = allScenarios.filter((s) => {
        if (activeCategory === 'saved') {
          if (!favIds.has(s.id)) return false;
        } else if (activeCategory !== 'all' && s.category !== activeCategory) {
          return false;
        }
        if (q) {
          const hay = `${s.title} ${s.shortSummary} ${s.quickTakeaway} ${s.categoryLabel}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });

      if (sort === 'difficulty') {
        filtered.sort((a, b) => a.difficulty - b.difficulty || a.title.localeCompare(b.title));
      } else if (sort === 'popularity') {
        filtered.sort((a, b) => b.popularity - a.popularity || a.title.localeCompare(b.title));
      } else {
        filtered.sort((a, b) => a.title.localeCompare(b.title));
      }

      const total = filtered.length;
      if (countEl) countEl.textContent = `${total} ${total === 1 ? 'play' : 'plays'}`;

      if (total === 0) {
        listEl.innerHTML = '';
        if (pagBar) pagBar.hidden = true;
        if (emptyEl) {
          emptyEl.hidden = false;
          emptyEl.textContent =
            activeCategory === 'saved'
              ? currentUser
                ? 'You have no saved plays yet. Click "Save" on any play card!'
                : 'Log in and save plays to see your favorites here!'
              : 'No plays match your search. Try a different word!';
        }
        return;
      }

      if (emptyEl) emptyEl.hidden = true;

      let pageItems = filtered;
      if (pageSizeRaw !== 'all') {
        const size = Number(pageSizeRaw) || 6;
        const totalPages = Math.max(1, Math.ceil(total / size));
        if (currentPage > totalPages) currentPage = totalPages;
        const start = (currentPage - 1) * size;
        pageItems = filtered.slice(start, start + size);

        if (pagBar) pagBar.hidden = totalPages <= 1;
        if (pageIndicator) pageIndicator.textContent = `Page ${currentPage} of ${totalPages}`;
        if (prevBtn) prevBtn.disabled = currentPage <= 1;
        if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
      } else if (pagBar) {
        pagBar.hidden = true;
      }

      listEl.innerHTML = pageItems
        .map((s) => {
          const isSaved = favIds.has(s.id);
          return `
            <li>
              <article class="card scenario-card">
                <div>
                  <div class="meta-line">
                    <span>${escapeHtml(s.categoryLabel)}</span>
                    <span aria-hidden="true">·</span>
                    <span>${diffLabel(s.difficulty)}</span>
                  </div>
                  <h2><a href="detail.html?id=${encodeURIComponent(s.id)}">${escapeHtml(s.title)}</a></h2>
                  <p class="scenario-desc">${escapeHtml(s.shortSummary)}</p>
                </div>
                <div class="card-footer-row">
                  <a class="btn btn-primary btn-sm" href="detail.html?id=${encodeURIComponent(s.id)}">Open Breakdown</a>
                  <button type="button" class="btn btn-ghost btn-sm fav-toggle-btn" data-id="${escapeHtml(s.id)}" aria-pressed="${isSaved}">
                    ${isSaved ? '★ Saved' : '☆ Save'}
                  </button>
                </div>
              </article>
            </li>`;
        })
        .join('');

      listEl.querySelectorAll('.fav-toggle-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          if (!currentUser) {
            showToast('Log in to save plays to your favorites!');
            return;
          }
          const wasSaved = favIds.has(id);
          try {
            const res = await api(`/api/favorites/${encodeURIComponent(id)}`, {
              method: wasSaved ? 'DELETE' : 'POST'
            });
            favIds = new Set(res.favorites || []);
            showToast(wasSaved ? 'Removed from favorites.' : 'Play saved to your favorites!');
            render();
          } catch (err) {
            showToast(err.message);
          }
        });
      });
    }

    await loadLibraryData();

    catButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        activeCategory = btn.getAttribute('data-category') || 'all';
        catButtons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
        currentPage = 1;
        render();
      });
    });

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        currentPage = 1;
        render();
      });
    }
    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        currentPage = 1;
        render();
      });
    }
    if (pageSizeSelect) {
      pageSizeSelect.addEventListener('change', () => {
        currentPage = 1;
        render();
      });
    }
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage--;
          render();
        }
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        currentPage++;
        render();
      });
    }

    render();
  }

  /* =========================================================
     View 3: Scenario Deep-Dive
     ========================================================= */
  async function initDetailPage() {
    const params = new URLSearchParams(window.location.search);
    const switcher = document.getElementById('scenario-switcher');
    const favBtn = document.getElementById('detail-favorite-btn');
    const starButtons = Array.from(document.querySelectorAll('#star-group .star-btn'));
    const ratingSummary = document.getElementById('rating-summary');
    const toggleAllBtn = document.getElementById('toggle-accordions-btn');
    const triviaForm = document.getElementById('trivia-form');
    const triviaFeedback = document.getElementById('trivia-feedback');

    let allScenarios = [];
    try {
      const res = await api('/api/scenarios');
      allScenarios = res.scenarios || [];
    } catch {
      allScenarios = [];
    }

    const initialId = params.get('id') || (allScenarios[0]?.id || 'force-vs-tag');

    if (switcher && allScenarios.length > 0) {
      switcher.innerHTML = allScenarios
        .map((s) => `<option value="${escapeHtml(s.id)}">${escapeHtml(s.title)}</option>`)
        .join('');
      switcher.value = initialId;
      switcher.onchange = () => {
        const nextId = switcher.value;
        const url = new URL(window.location.href);
        url.searchParams.set('id', nextId);
        window.history.replaceState({}, '', url.toString());
        loadScenario(nextId);
      };
    }

    async function loadScenario(scenarioId) {
      setBanner(triviaFeedback, '', '');
      const [{ scenario }, favRes, ratingRes] = await Promise.all([
        api(`/api/scenarios/${encodeURIComponent(scenarioId)}`),
        api('/api/favorites').catch(() => ({ favorites: [] })),
        api(`/api/scenarios/${encodeURIComponent(scenarioId)}/rating`).catch(() => ({
          average: 0,
          count: 0,
          userStars: null
        }))
      ]);

      document.title = `DiamondIQ — ${scenario.title}`;
      document.getElementById('detail-category').textContent = `${scenario.categoryLabel} · Scenario Deep-Dive`;
      document.getElementById('detail-title').textContent = scenario.title;
      document.getElementById('detail-summary').textContent = scenario.quickTakeaway;
      document.getElementById('detail-diamond-stage').innerHTML = renderDiagramSvg(scenario.diagram);
      document.getElementById('detail-diagram-caption').textContent = scenario.diagram?.caption || '';

      // Favorite button state
      let favSet = new Set(favRes.favorites || []);
      function syncFavBtn() {
        const saved = favSet.has(scenario.id);
        favBtn.setAttribute('aria-pressed', String(saved));
        favBtn.textContent = saved ? '★ Saved' : '☆ Save Play';
      }
      syncFavBtn();
      favBtn.onclick = async () => {
        if (!currentUser) {
          showToast('Log in to bookmark plays in your favorites!');
          return;
        }
        const saved = favSet.has(scenario.id);
        try {
          const res = await api(`/api/favorites/${encodeURIComponent(scenario.id)}`, {
            method: saved ? 'DELETE' : 'POST'
          });
          favSet = new Set(res.favorites || []);
          syncFavBtn();
          showToast(saved ? 'Removed from favorites.' : 'Saved to favorites!');
        } catch (err) {
          showToast(err.message);
        }
      };

      // 5-Star Rating
      function renderRating(r) {
        if (ratingSummary) {
          ratingSummary.textContent =
            r.count > 0
              ? `${r.average}/5 (${r.count} ${r.count === 1 ? 'rating' : 'ratings'})${r.userStars ? ` · You: ${r.userStars}★` : ''}`
              : 'Be the first to rate';
        }
        const activeStars = r.userStars || Math.round(r.average || 0);
        starButtons.forEach((btn) => {
          const val = Number(btn.getAttribute('data-stars'));
          btn.classList.toggle('is-filled', val <= activeStars);
        });
      }
      renderRating(ratingRes);
      starButtons.forEach((btn) => {
        btn.onclick = async () => {
          if (!currentUser) {
            showToast('Log in to rate scenarios!');
            return;
          }
          const stars = Number(btn.getAttribute('data-stars'));
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
      });

      // Stat Meters
      const metersGrid = document.getElementById('meters-grid');
      metersGrid.innerHTML = (scenario.meters || [])
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

      // 5-Expert Grid + Key Rule Card (3x2)
      const expertMeta = [
        { key: 'coach', role: 'Baseball Fundamentals', title: 'Youth Baseball Coach', summary: "Coach's Call" },
        { key: 'analyst', role: 'Baseball Stats', title: 'Sabermetrics Analyst', summary: 'By the Numbers' },
        { key: 'dev', role: 'How It Works', title: 'Web Dev Mentor', summary: 'Behind the Page' },
        { key: 'designer', role: 'Design & Clarity', title: 'UI/UX Designer', summary: 'Design Notes' },
        { key: 'rookie', role: 'Beginner Take', title: 'Rookie Player', summary: 'Rookie Take' }
      ];

      const isMobile = window.innerWidth < 768;
      const expertGrid = document.getElementById('expert-grid');
      const cardsHtml = expertMeta
        .map((em, idx) => {
          const openAttr = !isMobile || idx === 0 ? 'open' : '';
          return `
            <article class="card expert-card">
              <p class="expert-role">${escapeHtml(em.role)}</p>
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
          <p class="expert-role">Key Rule</p>
          <h3>Official Takeaway</h3>
          <p>${escapeHtml(scenario.keyRule)}</p>
          <p style="margin-top:0.75rem;margin-bottom:0;">
            <a href="compare.html?a=${encodeURIComponent(scenario.id)}">Compare this play with another</a>
          </p>
        </article>`;

      expertGrid.innerHTML = cardsHtml + summaryCardHtml;

      if (toggleAllBtn) {
        let allOpen = !isMobile;
        toggleAllBtn.textContent = allOpen ? 'Collapse All' : 'Expand All';
        toggleAllBtn.onclick = () => {
          allOpen = !allOpen;
          expertGrid.querySelectorAll('details').forEach((d) => {
            if (allOpen) d.setAttribute('open', '');
            else d.removeAttribute('open');
          });
          toggleAllBtn.textContent = allOpen ? 'Collapse All' : 'Expand All';
        };
      }

      // Trivia Quiz
      document.getElementById('trivia-question').textContent = scenario.trivia?.question || '';
      const optsWrap = document.getElementById('trivia-options');
      optsWrap.innerHTML = (scenario.trivia?.options || [])
        .map(
          (opt) => `
            <label class="trivia-option">
              <input type="radio" name="trivia" value="${escapeHtml(opt.key)}">
              <span>${escapeHtml(opt.text)}</span>
            </label>`
        )
        .join('');

      triviaForm.onsubmit = async (e) => {
        e.preventDefault();
        const checked = triviaForm.querySelector('input[name="trivia"]:checked');
        if (!checked) {
          setBanner(triviaFeedback, 'warning', 'Pick an option above before checking your answer!');
          return;
        }
        try {
          const result = await api(`/api/scenarios/${encodeURIComponent(scenario.id)}/trivia`, {
            method: 'POST',
            body: JSON.stringify({ answer: checked.value })
          });
          if (result.correct) {
            const extra = result.mastered ? ' Play marked as mastered in your stats!' : '';
            setBanner(triviaFeedback, 'success', `${result.explanation}${extra}`);
            showToast('Correct answer!');
          } else {
            setBanner(triviaFeedback, 'error', result.explanation);
          }
        } catch (err) {
          setBanner(triviaFeedback, 'error', err.message);
        }
      };
    }

    await loadScenario(initialId);
  }

  /* =========================================================
     View 4: Play & Stat Comparison Tool
     ========================================================= */
  async function initComparePage() {
    const selectA = document.getElementById('play-a');
    const selectB = document.getElementById('play-b');
    const swapBtn = document.getElementById('swap-plays-btn');
    const colA = document.getElementById('compare-col-a');
    const colB = document.getElementById('compare-col-b');
    const tbody = document.getElementById('compare-tbody');
    const verdictEl = document.getElementById('compare-verdict');

    const { scenarios } = await api('/api/scenarios');
    if (!scenarios || scenarios.length < 2) return;

    const optsHtml = scenarios
      .map((s) => `<option value="${escapeHtml(s.id)}">${escapeHtml(s.title)}</option>`)
      .join('');
    selectA.innerHTML = optsHtml;
    selectB.innerHTML = optsHtml;

    const params = new URLSearchParams(window.location.search);
    const paramA = params.get('a');
    const paramB = params.get('b');
    selectA.value = scenarios.some((s) => s.id === paramA) ? paramA : scenarios[0].id;
    selectB.value =
      scenarios.some((s) => s.id === paramB)
        ? paramB
        : scenarios.find((s) => s.id === 'tagging-up')?.id || scenarios[1].id;

    function meterCell(meter) {
      const pct = Math.round(((meter?.level || 1) / 3) * 100);
      return `
        <div class="compare-bar-wrap" style="margin-bottom:0.4rem;">
          <div class="compare-bar" aria-hidden="true"><div class="compare-bar-fill" style="width:${pct}%"></div></div>
          <strong class="tabular-nums">${escapeHtml(meter?.tier || '')}</strong>
        </div>
        <span style="color:var(--text-secondary);font-size:0.9rem;">${escapeHtml(meter?.caption || '')}</span>`;
    }

    function renderCompare() {
      const a = scenarios.find((s) => s.id === selectA.value) || scenarios[0];
      const b = scenarios.find((s) => s.id === selectB.value) || scenarios[1];

      colA.innerHTML = `<a href="detail.html?id=${encodeURIComponent(a.id)}">${escapeHtml(a.title)}</a>`;
      colB.innerHTML = `<a href="detail.html?id=${encodeURIComponent(b.id)}">${escapeHtml(b.title)}</a>`;

      tbody.innerHTML = `
        <tr>
          <th scope="row">Category</th>
          <td>${escapeHtml(a.categoryLabel)}</td>
          <td>${escapeHtml(b.categoryLabel)}</td>
        </tr>
        <tr>
          <th scope="row">Execution difficulty</th>
          <td>${meterCell(a.meters?.[0])}</td>
          <td>${meterCell(b.meters?.[0])}</td>
        </tr>
        <tr>
          <th scope="row">Tactical risk</th>
          <td>${meterCell(a.meters?.[1])}</td>
          <td>${meterCell(b.meters?.[1])}</td>
        </tr>
        <tr>
          <th scope="row">Game impact</th>
          <td>${meterCell(a.meters?.[2])}</td>
          <td>${meterCell(b.meters?.[2])}</td>
        </tr>
        <tr>
          <th scope="row">Coach cue</th>
          <td>${escapeHtml(a.experts?.coach || '')}</td>
          <td>${escapeHtml(b.experts?.coach || '')}</td>
        </tr>
        <tr>
          <th scope="row">Analyst takeaway</th>
          <td>${escapeHtml(a.experts?.analyst || '')}</td>
          <td>${escapeHtml(b.experts?.analyst || '')}</td>
        </tr>`;

      if (a.id === b.id) {
        verdictEl.textContent = `You selected "${a.title}" on both sides! Pick a different second play to contrast difficulty, risk, and game impact.`;
      } else {
        const diffMsg =
          a.difficulty === b.difficulty
            ? `Both "${a.title}" and "${b.title}" share the same beginner difficulty level.`
            : a.difficulty < b.difficulty
            ? `"${a.title}" is easier for beginners to master first, while "${b.title}" introduces a tougher skill.`
            : `"${b.title}" is easier for beginners to master first, while "${a.title}" introduces a tougher skill.`;
        verdictEl.textContent = `${diffMsg} ${a.keyRule} vs. ${b.keyRule}`;
      }
    }

    selectA.onchange = renderCompare;
    selectB.onchange = renderCompare;
    if (swapBtn) {
      swapBtn.onclick = () => {
        const tmp = selectA.value;
        selectA.value = selectB.value;
        selectB.value = tmp;
        renderCompare();
      };
    }

    renderCompare();
  }

  /* =========================================================
     View 5: My Playbook (Protected CRUD + Favorites)
     ========================================================= */
  async function initPlaybookPage() {
    const loginNote = document.getElementById('playbook-login-note');
    const userBadge = document.getElementById('playbook-user-badge');
    const form = document.getElementById('playbook-form');
    const titleInput = document.getElementById('note-title');
    const bodyInput = document.getElementById('note-body');
    const ratingSelect = document.getElementById('note-rating');
    const submitBtn = document.getElementById('playbook-submit-btn');
    const feedback = document.getElementById('playbook-feedback');
    const entriesList = document.getElementById('playbook-entries');
    const emptyBox = document.getElementById('playbook-empty');
    const favList = document.getElementById('playbook-favorites');
    const favEmpty = document.getElementById('favorites-empty');

    setBanner(feedback, '', '');

    if (!currentUser) {
      if (loginNote) loginNote.hidden = false;
      if (userBadge) userBadge.hidden = true;
      entriesList.innerHTML = '';
      emptyBox.hidden = false;
      if (favList) favList.innerHTML = '';
      if (favEmpty) favEmpty.hidden = false;

      form.onsubmit = (e) => {
        e.preventDefault();
        setBanner(feedback, 'warning', 'Please log in first to add notes to your Playbook.');
        showToast('Log in required to save playbook notes.');
      };
      return;
    }

    if (loginNote) loginNote.hidden = true;
    if (userBadge) {
      userBadge.hidden = false;
      userBadge.textContent = `Signed in as ${currentUser.username}`;
    }

    async function loadAndRenderEntries() {
      const { entries } = await api('/api/playbook');
      if (!entries || entries.length === 0) {
        entriesList.innerHTML = '';
        emptyBox.hidden = false;
        return;
      }
      emptyBox.hidden = true;

      entriesList.innerHTML = entries
        .map(
          (entry) => `
          <li class="card" data-entry-id="${entry.id}">
            <div class="entry-view">
              <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:0.75rem;flex-wrap:wrap;">
                <div>
                  <div class="meta-line">
                    <span class="tabular-nums">Difficulty: ${entry.rating}/5</span>
                    <span aria-hidden="true">·</span>
                    <span>Updated ${new Date(entry.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <h3 style="margin-bottom:0.35rem;">${escapeHtml(entry.title)}</h3>
                </div>
                <div style="display:flex;gap:0.5rem;">
                  <button type="button" class="btn btn-secondary btn-sm edit-entry-btn">Edit</button>
                  <button type="button" class="btn btn-danger btn-sm delete-entry-btn">Delete</button>
                </div>
              </div>
              <p style="margin-bottom:0;color:var(--text-secondary);white-space:pre-line;">${escapeHtml(entry.body)}</p>
            </div>
            <form class="entry-edit-form form-stack" hidden novalidate>
              <div class="field">
                <label>Play name</label>
                <input type="text" class="edit-title" maxlength="120" value="${escapeHtml(entry.title)}" required>
              </div>
              <div class="field">
                <label>My strategy notes</label>
                <textarea class="edit-body" rows="3" maxlength="2000" required>${escapeHtml(entry.body)}</textarea>
              </div>
              <div class="field">
                <label>Difficulty rating</label>
                <select class="edit-rating">
                  ${[1, 2, 3, 4, 5]
                    .map((r) => `<option value="${r}" ${r === entry.rating ? 'selected' : ''}>${r} / 5</option>`)
                    .join('')}
                </select>
              </div>
              <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
                <button type="submit" class="btn btn-primary btn-sm">Save Changes</button>
                <button type="button" class="btn btn-ghost btn-sm cancel-edit-btn">Cancel</button>
              </div>
            </form>
            <div class="delete-confirm" style="display:none;margin-top:0.85rem;padding-top:0.85rem;border-top:1px solid var(--border);align-items:center;justify-content:space-between;gap:0.75rem;flex-wrap:wrap;">
              <span style="font-size:0.9rem;color:var(--danger-text);font-weight:600;">Delete this note permanently?</span>
              <div style="display:flex;gap:0.5rem;">
                <button type="button" class="btn btn-danger btn-sm confirm-delete-btn">Confirm Delete</button>
                <button type="button" class="btn btn-ghost btn-sm cancel-delete-btn">Cancel</button>
              </div>
            </div>
          </li>`
        )
        .join('');

      entriesList.querySelectorAll('li[data-entry-id]').forEach((li) => {
        const id = li.getAttribute('data-entry-id');
        const viewEl = li.querySelector('.entry-view');
        const editForm = li.querySelector('.entry-edit-form');
        const delConfirm = li.querySelector('.delete-confirm');

        li.querySelector('.edit-entry-btn').onclick = () => {
          viewEl.hidden = true;
          delConfirm.style.display = 'none';
          editForm.hidden = false;
        };

        li.querySelector('.cancel-edit-btn').onclick = () => {
          editForm.hidden = true;
          viewEl.hidden = false;
        };

        editForm.onsubmit = async (e) => {
          e.preventDefault();
          const title = li.querySelector('.edit-title').value.trim();
          const body = li.querySelector('.edit-body').value.trim();
          const rating = Number(li.querySelector('.edit-rating').value);
          if (!title || !body) {
            setBanner(feedback, 'error', 'Both play name and notes are required.');
            return;
          }
          try {
            await api(`/api/playbook/${encodeURIComponent(id)}`, {
              method: 'PUT',
              body: JSON.stringify({ title, body, rating })
            });
            showToast('Playbook note updated!');
            await loadAndRenderEntries();
          } catch (err) {
            setBanner(feedback, 'error', err.message);
          }
        };

        li.querySelector('.delete-entry-btn').onclick = () => {
          delConfirm.style.display = 'flex';
        };
        li.querySelector('.cancel-delete-btn').onclick = () => {
          delConfirm.style.display = 'none';
        };
        li.querySelector('.confirm-delete-btn').onclick = async () => {
          try {
            await api(`/api/playbook/${encodeURIComponent(id)}`, { method: 'DELETE' });
            showToast('Playbook note deleted.');
            await loadAndRenderEntries();
          } catch (err) {
            setBanner(feedback, 'error', err.message);
          }
        };
      });
    }

    async function loadAndRenderFavorites() {
      if (!favList || !favEmpty) return;
      const [favRes, scenRes] = await Promise.all([api('/api/favorites'), api('/api/scenarios')]);
      const favIds = new Set(favRes.favorites || []);
      const favScenarios = (scenRes.scenarios || []).filter((s) => favIds.has(s.id));

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
            <article class="card scenario-card">
              <div>
                <div class="meta-line">${escapeHtml(s.categoryLabel)}</div>
                <h3><a href="detail.html?id=${encodeURIComponent(s.id)}">${escapeHtml(s.title)}</a></h3>
                <p class="scenario-desc">${escapeHtml(s.shortSummary)}</p>
              </div>
              <div class="card-footer-row">
                <a class="btn btn-primary btn-sm" href="detail.html?id=${encodeURIComponent(s.id)}">Open Breakdown</a>
                <button type="button" class="btn btn-ghost btn-sm remove-fav-btn" data-id="${escapeHtml(s.id)}">Remove</button>
              </div>
            </article>
          </li>`
        )
        .join('');

      favList.querySelectorAll('.remove-fav-btn').forEach((btn) => {
        btn.onclick = async () => {
          const id = btn.getAttribute('data-id');
          try {
            await api(`/api/favorites/${encodeURIComponent(id)}`, { method: 'DELETE' });
            showToast('Removed from favorites.');
            await loadAndRenderFavorites();
          } catch (err) {
            showToast(err.message);
          }
        };
      });
    }

    form.onsubmit = async (e) => {
      e.preventDefault();
      setBanner(feedback, '', '');
      const title = titleInput.value.trim();
      const body = bodyInput.value.trim();
      const rating = Number(ratingSelect.value);

      if (!title) {
        setBanner(feedback, 'error', 'Please enter a play name.');
        titleInput.focus();
        return;
      }
      if (!body) {
        setBanner(feedback, 'error', 'Please write your strategy notes.');
        bodyInput.focus();
        return;
      }

      submitBtn.disabled = true;
      try {
        await api('/api/playbook', {
          method: 'POST',
          body: JSON.stringify({ title, body, rating })
        });
        titleInput.value = '';
        bodyInput.value = '';
        ratingSelect.value = '3';
        setBanner(feedback, 'success', 'Play successfully added to your Playbook!');
        showToast('Play added to Playbook!');
        await loadAndRenderEntries();
      } catch (err) {
        setBanner(feedback, 'error', err.message);
      } finally {
        submitBtn.disabled = false;
      }
    };

    await Promise.all([loadAndRenderEntries(), loadAndRenderFavorites()]);
  }

  /* =========================================================
     Auth Views: Login & Register
     ========================================================= */
  function initAuthPages() {
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
          showToast('Welcome back to DiamondIQ!');
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
          showToast('Account created! Welcome to DiamondIQ.');
          window.location.href = 'playbook.html';
        } catch (err) {
          setBanner(errEl, 'error', err.message);
        }
      };
    }
  }

  /* =========================================================
     Bootstrap
     ========================================================= */
  document.addEventListener('DOMContentLoaded', async () => {
    let saved = null;
    try {
      saved = localStorage.getItem(THEME_KEY);
    } catch {
      saved = null;
    }
    applyTheme(saved === 'dark' ? 'dark' : 'light');

    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
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
    initAuthPages();

    if (document.getElementById('home')) await initHomePage();
    if (document.getElementById('library')) await initScenariosPage();
    if (document.getElementById('deep-dive')) await initDetailPage();
    if (document.getElementById('compare')) await initComparePage();
    if (document.getElementById('playbook')) await initPlaybookPage();
  });
})();
