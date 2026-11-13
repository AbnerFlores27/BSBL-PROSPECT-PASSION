/* DiamondIQ — Client-side Controller (Phases 3 & 4)
   Connects all 7 HTML views to the Express + PostgreSQL REST API:
   - Session auth (register, login, logout in nav)
   - Scenarios loaded from /api/scenarios + search/filter/sort
   - 5-expert deep-dive + SVG field diagram + server-verified trivia quiz
   - Side-by-side comparison
   - Protected Playbook CRUD & Favorites (blocked cleanly when logged out) */
(function () {
  'use strict';

  const STORAGE_THEME = 'diamondiq_theme';

  let currentUser = null;
  let cachedScenarios = null;

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async function api(url, options) {
    const res = await fetch(url, {
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        ...((options && options.headers) || {})
      },
      ...options
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || 'Request failed');
      err.status = res.status;
      throw err;
    }
    return data;
  }

  async function getScenarios() {
    if (cachedScenarios) return cachedScenarios;
    try {
      const res = await api('/api/scenarios');
      cachedScenarios = res.scenarios || [];
      return cachedScenarios;
    } catch {
      cachedScenarios = (window.DIAMONDIQ_DATA && window.DIAMONDIQ_DATA.scenarios) || [];
      return cachedScenarios;
    }
  }

  async function getFavorites() {
    try {
      const res = await api('/api/favorites');
      return res.favorites || [];
    } catch {
      return [];
    }
  }

  /* =========================================================
     Toast Notifications
     ========================================================= */
  let toastTimer = null;
  function showToast(message) {
    let toast = document.getElementById('app-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'app-toast';
      toast.className = 'toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 3200);
  }

  /* =========================================================
     Theme Toggle (Light = Grey + Powder Blue, Dark = Navy-Grey)
     ========================================================= */
  function getTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    const isDark = theme === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    try {
      localStorage.setItem(STORAGE_THEME, isDark ? 'dark' : 'light');
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

  async function initHeader() {
    const storedTheme = (() => {
      try {
        return localStorage.getItem(STORAGE_THEME);
      } catch {
        return null;
      }
    })();
    if (storedTheme === 'dark' || storedTheme === 'light') {
      applyTheme(storedTheme);
    } else {
      applyTheme(getTheme());
    }

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
        const open = siteNav.classList.toggle('is-open');
        navToggle.setAttribute('aria-expanded', String(open));
      });
    }

    try {
      const me = await api('/api/auth/me');
      currentUser = me.user || null;
    } catch {
      currentUser = null;
    }

    const loginLink = document.getElementById('nav-login-link');
    if (loginLink && currentUser && siteNav) {
      loginLink.textContent = currentUser.username;
      loginLink.href = 'playbook.html';
      loginLink.title = 'Signed in as ' + currentUser.username;

      if (!document.getElementById('nav-logout-btn')) {
        const logoutBtn = document.createElement('button');
        logoutBtn.id = 'nav-logout-btn';
        logoutBtn.type = 'button';
        logoutBtn.className = 'btn btn-ghost btn-sm';
        logoutBtn.textContent = 'Log Out';
        logoutBtn.addEventListener('click', async () => {
          try {
            await api('/api/auth/logout', { method: 'POST' });
          } catch {
            /* ignore */
          }
          showToast('Logged out');
          window.location.href = 'index.html';
        });
        siteNav.appendChild(logoutBtn);
      }
    }
  }

  /* =========================================================
     SVG Baseball Diamond Diagram Renderer
     ========================================================= */
  const FIELD_POINTS = {
    home: { x: 160, y: 214, label: 'Home' },
    '1st': { x: 234, y: 146, label: '1st' },
    '2nd': { x: 160, y: 74, label: '2nd' },
    '3rd': { x: 86, y: 146, label: '3rd' },
    pitcher: { x: 160, y: 150, label: 'P' },
    shortstop: { x: 118, y: 100, label: 'SS' },
    outfield: { x: 205, y: 36, label: 'OF' }
  };

  function renderDiamondSvg(diagram) {
    if (!diagram) return '';
    const runners = diagram.runners || [];
    const pathPts = (diagram.ballPath || []).map((k) => FIELD_POINTS[k]).filter(Boolean);
    const highlight = FIELD_POINTS[diagram.highlightBase];

    let pathSvg = '';
    if (pathPts.length >= 2) {
      const d = pathPts.map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ');
      pathSvg = `<path d="${d}" fill="none" stroke="var(--accent)" stroke-width="3" stroke-dasharray="6 4" marker-end="url(#ball-arrow)" />`;
    }

    const runnerSvg = runners
      .map((key) => {
        const pt = FIELD_POINTS[key];
        if (!pt) return '';
        return `
          <g transform="translate(${pt.x}, ${pt.y})">
            <circle r="10" fill="var(--accent)" stroke="var(--bg-surface)" stroke-width="2" />
            <text y="3.5" text-anchor="middle" font-size="9" font-weight="700" fill="var(--accent-text-on)" font-family="var(--font-mono)">R</text>
          </g>
        `;
      })
      .join('');

    const highlightSvg = highlight
      ? `<circle cx="${highlight.x}" cy="${highlight.y}" r="18" fill="none" stroke="var(--accent)" stroke-width="2.2" opacity="0.85" />`
      : '';

    return `
      <svg class="diamond-svg" viewBox="0 0 320 250" role="img" aria-label="${escapeHtml(diagram.caption || 'Baseball field diagram')}">
        <defs>
          <marker id="ball-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--accent)" />
          </marker>
        </defs>
        <path d="M 160 230 L 22 108 A 175 175 0 0 1 298 108 Z" fill="var(--field-turf)" stroke="var(--border-strong)" stroke-width="1.2" />
        <polygon points="160,64 246,146 160,224 74,146" fill="var(--field-dirt)" />
        <polygon points="160,82 224,146 160,206 96,146" fill="var(--field-turf)" />
        <polyline points="86,146 160,74 234,146 160,214 86,146" fill="none" stroke="var(--field-line)" stroke-width="2" />
        <circle cx="160" cy="150" r="10" fill="var(--field-dirt)" stroke="var(--field-line)" stroke-width="1" />
        <rect x="228" y="140" width="12" height="12" transform="rotate(45 234 146)" fill="#ffffff" stroke="var(--field-ink)" stroke-width="1.2" />
        <rect x="154" y="68" width="12" height="12" transform="rotate(45 160 74)" fill="#ffffff" stroke="var(--field-ink)" stroke-width="1.2" />
        <rect x="80" y="140" width="12" height="12" transform="rotate(45 86 146)" fill="#ffffff" stroke="var(--field-ink)" stroke-width="1.2" />
        <polygon points="154,209 166,209 166,216 160,221 154,216" fill="#ffffff" stroke="var(--field-ink)" stroke-width="1.2" />
        ${highlightSvg}
        ${pathSvg}
        ${runnerSvg}
        <rect x="14" y="226" width="292" height="20" rx="4" fill="var(--bg-surface)" stroke="var(--border)" />
        <text x="160" y="239.5" text-anchor="middle" font-size="10.5" font-weight="600" fill="var(--text-primary)" font-family="var(--font-body)">${escapeHtml(diagram.callout || '')}</text>
      </svg>
    `;
  }

  /* =========================================================
     Page: Home (index.html)
     ========================================================= */
  async function initHomePage() {
    const countdownEl = document.getElementById('countdown');
    if (!countdownEl) return;

    const data = window.DIAMONDIQ_DATA;
    const scenarios = await getScenarios();

    try {
      const stats = await api('/api/stats');
      countdownEl.textContent = String(stats.daysUntilOpeningDay);
      const favCountEl = document.getElementById('stat-favorites');
      const masteredCountEl = document.getElementById('stat-mastered');
      const playbookCountEl = document.getElementById('stat-playbook');
      if (favCountEl) favCountEl.textContent = String(stats.favoritesCount);
      if (masteredCountEl) masteredCountEl.textContent = `${stats.masteredCount}/${stats.totalScenarios}`;
      if (playbookCountEl) playbookCountEl.textContent = String(stats.playbookCount);
    } catch {
      if (data) {
        const target = new Date(data.openingDayIso).getTime();
        countdownEl.textContent = String(Math.max(0, Math.ceil((target - Date.now()) / 86400000)));
      }
    }

    const featuredDiagram = document.getElementById('featured-diagram');
    const featuredPlay = scenarios.find((s) => s.id === 'force-vs-tag') || scenarios[0];
    if (featuredDiagram && featuredPlay) {
      featuredDiagram.innerHTML = renderDiamondSvg(featuredPlay.diagram);
    }

    const factEl = document.getElementById('daily-fact-text');
    const factBtn = document.getElementById('next-fact-btn');
    if (factEl && data && data.funFacts.length) {
      const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
      let factIdx = dayOfYear % data.funFacts.length;
      factEl.textContent = data.funFacts[factIdx];
      if (factBtn) {
        factBtn.addEventListener('click', () => {
          factIdx = (factIdx + 1) % data.funFacts.length;
          factEl.textContent = data.funFacts[factIdx];
        });
      }
    }
  }

  /* =========================================================
     Page: Scenarios Library (scenarios.html)
     ========================================================= */
  async function initScenariosPage() {
    const listEl = document.getElementById('scenario-list');
    if (!listEl) return;

    const searchInput = document.getElementById('search-box');
    const sortSelect = document.getElementById('sort-by');
    const pageSizeSelect = document.getElementById('page-size');
    const paginationBar = document.getElementById('pagination-bar');
    const prevBtn = document.getElementById('page-prev-btn');
    const nextBtn = document.getElementById('page-next-btn');
    const pageStatusEl = document.getElementById('page-status');
    const emptyEl = document.getElementById('empty-state');
    const countEl = document.getElementById('scenario-count');
    const resetBtn = document.getElementById('reset-filters-btn');
    const filterButtons = Array.from(document.querySelectorAll('[data-category-btn]'));

    const allScenarios = await getScenarios();
    let favIds = currentUser ? await getFavorites() : [];
    let activeCategory = 'all';
    let currentPage = 1;

    function render() {
      const query = (searchInput ? searchInput.value : '').trim().toLowerCase();
      const sortBy = sortSelect ? sortSelect.value : 'az';
      const rawPageSize = pageSizeSelect ? pageSizeSelect.value : 'all';

      let items = allScenarios.filter((s) => {
        if (activeCategory === 'saved' && !favIds.includes(s.id)) return false;
        if (activeCategory !== 'all' && activeCategory !== 'saved' && s.category !== activeCategory) return false;
        if (!query) return true;
        return (
          s.title.toLowerCase().includes(query) ||
          s.shortSummary.toLowerCase().includes(query) ||
          s.categoryLabel.toLowerCase().includes(query) ||
          s.quickTakeaway.toLowerCase().includes(query)
        );
      });

      items = items.slice().sort((a, b) => {
        if (sortBy === 'difficulty') return a.difficulty - b.difficulty;
        if (sortBy === 'popularity') return b.popularity - a.popularity;
        return a.title.localeCompare(b.title);
      });

      if (countEl) {
        countEl.textContent = `${items.length} of ${allScenarios.length} plays`;
      }

      if (items.length === 0) {
        listEl.innerHTML = '';
        if (emptyEl) emptyEl.hidden = false;
        if (paginationBar) paginationBar.hidden = true;
        return;
      }

      if (emptyEl) emptyEl.hidden = true;

      const pageSize = rawPageSize === 'all' ? items.length : Math.max(1, Number(rawPageSize) || 6);
      const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
      if (currentPage > totalPages) currentPage = totalPages;
      const start = (currentPage - 1) * pageSize;
      const visibleItems = items.slice(start, start + pageSize);

      if (paginationBar) {
        paginationBar.hidden = totalPages <= 1;
        if (pageStatusEl) pageStatusEl.textContent = `Page ${currentPage} of ${totalPages}`;
        if (prevBtn) prevBtn.disabled = currentPage <= 1;
        if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
      }

      listEl.innerHTML = visibleItems
        .map((s) => {
          const saved = favIds.includes(s.id);
          return `
            <li>
              <article class="card scenario-card">
                <div>
                  <div class="meta-line">
                    <span>${escapeHtml(s.categoryLabel)}</span>
                    <span aria-hidden="true">·</span>
                    <span class="tabular-nums">Difficulty ${s.difficulty}/5</span>
                    <span aria-hidden="true">·</span>
                    <span class="tabular-nums">${s.popularity}% popular</span>
                  </div>
                  <h2><a href="detail.html?id=${encodeURIComponent(s.id)}">${escapeHtml(s.title)}</a></h2>
                  <p class="scenario-desc">${escapeHtml(s.shortSummary)}</p>
                </div>
                <div class="card-footer-row">
                  <a class="btn btn-primary btn-sm" href="detail.html?id=${encodeURIComponent(s.id)}">Read 5-Expert Breakdown</a>
                  <button type="button" class="btn btn-ghost btn-sm" data-fav-id="${escapeHtml(s.id)}" aria-pressed="${saved}">
                    ${saved ? 'Saved' : 'Save'}
                  </button>
                </div>
              </article>
            </li>
          `;
        })
        .join('');

      listEl.querySelectorAll('[data-fav-id]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-fav-id');
          if (!currentUser) {
            showToast('Log in to save favorite plays to your account.');
            return;
          }
          try {
            const isSaved = favIds.includes(id);
            const res = await api(`/api/favorites/${encodeURIComponent(id)}`, {
              method: isSaved ? 'DELETE' : 'POST'
            });
            favIds = res.favorites || [];
            showToast(isSaved ? 'Removed from Favorites' : 'Saved to Favorites');
            render();
          } catch (err) {
            showToast(err.message);
          }
        });
      });
    }

    filterButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const nextCat = btn.getAttribute('data-category-btn') || 'all';
        if (nextCat === 'saved' && !currentUser) {
          showToast('Log in to view your saved favorite plays.');
        }
        activeCategory = nextCat;
        currentPage = 1;
        filterButtons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
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
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        activeCategory = 'all';
        currentPage = 1;
        if (searchInput) searchInput.value = '';
        if (sortSelect) sortSelect.value = 'az';
        if (pageSizeSelect) pageSizeSelect.value = '6';
        filterButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.getAttribute('data-category-btn') === 'all')));
        render();
      });
    }

    render();
  }

  /* =========================================================
     Page: Scenario Deep-Dive (detail.html)
     ========================================================= */
  async function initDetailPage() {
    const titleEl = document.getElementById('detail-title');
    if (!titleEl) return;

    const data = window.DIAMONDIQ_DATA;
    const allScenarios = await getScenarios();
    if (!allScenarios.length) return;

    const params = new URLSearchParams(window.location.search);
    const requestedId = params.get('id');
    const scenario = allScenarios.find((s) => s.id === requestedId) || allScenarios[0];

    document.title = `DiamondIQ — ${scenario.title}`;
    titleEl.textContent = scenario.title;

    const metaEl = document.getElementById('detail-meta');
    if (metaEl) {
      metaEl.innerHTML = `
        <span>${escapeHtml(scenario.categoryLabel)}</span>
        <span aria-hidden="true">·</span>
        <span class="tabular-nums">Difficulty ${scenario.difficulty}/5</span>
        <span aria-hidden="true">·</span>
        <span>${escapeHtml(scenario.keyRule)}</span>
      `;
    }

    const switcher = document.getElementById('scenario-switcher');
    if (switcher) {
      switcher.innerHTML = allScenarios
        .map((s) => `<option value="${escapeHtml(s.id)}" ${s.id === scenario.id ? 'selected' : ''}>${escapeHtml(s.title)}</option>`)
        .join('');
      switcher.addEventListener('change', () => {
        window.location.href = `detail.html?id=${encodeURIComponent(switcher.value)}`;
      });
    }

    // Favorite Toggle Button (Protected)
    const favBtn = document.getElementById('detail-fav-btn');
    if (favBtn) {
      let favIds = currentUser ? await getFavorites() : [];
      const updateFavBtn = () => {
        const saved = favIds.includes(scenario.id);
        favBtn.setAttribute('aria-pressed', String(saved));
        favBtn.textContent = saved ? 'Saved to Favorites' : 'Save to Favorites';
      };
      updateFavBtn();
      favBtn.addEventListener('click', async () => {
        if (!currentUser) {
          showToast('Log in to save favorite plays.');
          return;
        }
        try {
          const isSaved = favIds.includes(scenario.id);
          const res = await api(`/api/favorites/${encodeURIComponent(scenario.id)}`, {
            method: isSaved ? 'DELETE' : 'POST'
          });
          favIds = res.favorites || [];
          updateFavBtn();
          showToast(isSaved ? 'Removed from Favorites' : 'Saved to Favorites');
        } catch (err) {
          showToast(err.message);
        }
      });
    }

    const summaryEl = document.getElementById('detail-summary');
    if (summaryEl) summaryEl.textContent = scenario.quickTakeaway;

    // 5-Star Rating Widget
    const starBtns = Array.from(document.querySelectorAll('#star-buttons [data-stars]'));
    const ratingSummaryEl = document.getElementById('rating-summary');
    function renderRatingState(r) {
      const activeStars = r.userStars || Math.round(r.average || 0);
      starBtns.forEach((b) => {
        const val = Number(b.getAttribute('data-stars'));
        b.classList.toggle('is-filled', val <= activeStars);
        b.setAttribute('aria-pressed', String(r.userStars === val));
      });
      if (ratingSummaryEl) {
        if (!r.count) {
          ratingSummaryEl.textContent = 'No ratings yet — be first';
        } else {
          const mine = r.userStars ? ` · Your rating: ${r.userStars}/5` : '';
          ratingSummaryEl.textContent = `${r.average}/5 (${r.count} ${r.count === 1 ? 'vote' : 'votes'})${mine}`;
        }
      }
    }
    if (starBtns.length) {
      api(`/api/scenarios/${encodeURIComponent(scenario.id)}/rating`)
        .then(renderRatingState)
        .catch(() => {});
      starBtns.forEach((btn) => {
        btn.addEventListener('click', async () => {
          if (!currentUser) {
            showToast('Log in to rate plays.');
            return;
          }
          try {
            const stars = Number(btn.getAttribute('data-stars'));
            const updated = await api(`/api/scenarios/${encodeURIComponent(scenario.id)}/rating`, {
              method: 'POST',
              body: JSON.stringify({ stars })
            });
            renderRatingState(updated);
            showToast(`Rated ${stars}/5 stars`);
          } catch (err) {
            showToast(err.message);
          }
        });
      });
    }

    const diagramEl = document.getElementById('detail-diagram');
    if (diagramEl) diagramEl.innerHTML = renderDiamondSvg(scenario.diagram);

    const diagramCaptionEl = document.getElementById('detail-diagram-caption');
    if (diagramCaptionEl) diagramCaptionEl.textContent = scenario.diagram.caption;

    const expertsGrid = document.getElementById('experts-grid');
    const toggleAllBtn = document.getElementById('toggle-accordions-btn');
    if (expertsGrid && data) {
      const startOpen = window.innerWidth >= 768;
      const expertCards = data.expertsMeta
        .map((ex, idx) => {
          const copy = scenario.experts[ex.id] || '';
          const openAttr = startOpen || idx === 0 ? 'open' : '';
          return `
            <article class="card expert-card">
              <p class="expert-role">${escapeHtml(ex.role)}</p>
              <h3>${escapeHtml(ex.name)}</h3>
              <details ${openAttr}>
                <summary>Read Perspective</summary>
                <p>${escapeHtml(copy)}</p>
              </details>
            </article>
          `;
        })
        .join('');

      const takeawayCard = `
        <article class="card summary-card">
          <p class="expert-role">Official Rule &amp; Benchmark</p>
          <h3>Key Rule Takeaway</h3>
          <p>${escapeHtml(scenario.keyRule)}</p>
          <p style="margin-top:0.75rem;margin-bottom:0;"><a href="compare.html?a=${encodeURIComponent(scenario.id)}">Compare this play side-by-side</a></p>
        </article>
      `;

      expertsGrid.innerHTML = expertCards + takeawayCard;

      if (toggleAllBtn) {
        const syncToggleLabel = () => {
          const detailsEls = Array.from(expertsGrid.querySelectorAll('details'));
          const allOpen = detailsEls.every((d) => d.open);
          toggleAllBtn.textContent = allOpen ? 'Collapse All' : 'Expand All';
        };
        syncToggleLabel();
        expertsGrid.addEventListener('toggle', syncToggleLabel, true);
        toggleAllBtn.addEventListener('click', () => {
          const detailsEls = Array.from(expertsGrid.querySelectorAll('details'));
          const anyClosed = detailsEls.some((d) => !d.open);
          detailsEls.forEach((d) => { d.open = anyClosed; });
          syncToggleLabel();
        });
      }
    }

    const metersGrid = document.getElementById('meters-grid');
    if (metersGrid) {
      const rows = [
        { label: 'Execution Difficulty', data: scenario.meters.difficulty },
        { label: 'Tactical Risk', data: scenario.meters.risk },
        { label: 'Statistical Impact', data: scenario.meters.impact }
      ];
      metersGrid.innerHTML = rows
        .map((row) => {
          const segs = [1, 2, 3]
            .map((i) => `<span class="meter-seg ${i <= row.data.score ? 'is-active' : ''}" aria-hidden="true"></span>`)
            .join('');
          return `
            <div class="meter-card">
              <div class="meter-head">
                <span class="meter-name">${escapeHtml(row.label)}</span>
                <span class="meter-tier">${escapeHtml(row.data.tier)} (${row.data.score}/3)</span>
              </div>
              <div class="meter-track" role="img" aria-label="${escapeHtml(row.label)}: ${escapeHtml(row.data.tier)}">${segs}</div>
              <p class="meter-caption">${escapeHtml(row.data.note)}</p>
            </div>
          `;
        })
        .join('');
    }

    const triviaLegend = document.getElementById('trivia-legend');
    const triviaOptions = document.getElementById('trivia-options');
    const triviaForm = document.getElementById('trivia-form');
    const triviaFeedback = document.getElementById('trivia-feedback');

    if (triviaLegend && triviaOptions && triviaForm && triviaFeedback) {
      triviaLegend.textContent = scenario.trivia.question;
      triviaOptions.innerHTML = scenario.trivia.options
        .map(
          (opt, idx) => `
            <label class="trivia-option">
              <input type="radio" name="trivia" value="${idx}">
              <span>${escapeHtml(opt)}</span>
            </label>
          `
        )
        .join('');

      triviaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const selected = triviaForm.querySelector('input[name="trivia"]:checked');
        if (!selected) {
          triviaFeedback.className = 'feedback-banner is-warning';
          triviaFeedback.textContent = 'Select an answer choice first before checking.';
          return;
        }
        try {
          const res = await api(`/api/scenarios/${encodeURIComponent(scenario.id)}/trivia`, {
            method: 'POST',
            body: JSON.stringify({ choiceIndex: Number(selected.value) })
          });
          if (res.correct) {
            triviaFeedback.className = 'feedback-banner is-success';
            triviaFeedback.textContent =
              'Correct call! ' +
              res.explanation +
              (res.mastered ? ' Recorded on your Home dashboard.' : ' Log in to save your mastered progress.');
            showToast(res.mastered ? 'Play mastered!' : 'Correct answer!');
          } else {
            triviaFeedback.className = 'feedback-banner is-error';
            triviaFeedback.textContent = 'Not quite — ' + res.explanation;
          }
        } catch (err) {
          triviaFeedback.className = 'feedback-banner is-error';
          triviaFeedback.textContent = err.message;
        }
      });
    }
  }

  /* =========================================================
     Page: Play & Stat Comparison (compare.html)
     ========================================================= */
  async function initComparePage() {
    const selectA = document.getElementById('play-a');
    const selectB = document.getElementById('play-b');
    const tbody = document.getElementById('compare-tbody');
    if (!selectA || !selectB || !tbody) return;

    const swapBtn = document.getElementById('swap-plays-btn');
    const verdictEl = document.getElementById('compare-verdict');
    const headA = document.getElementById('compare-head-a');
    const headB = document.getElementById('compare-head-b');

    const scenarios = await getScenarios();
    if (!scenarios.length) return;

    const params = new URLSearchParams(window.location.search);
    const paramA = params.get('a');
    const defaultA = scenarios.some((s) => s.id === paramA) ? paramA : scenarios[0].id;
    const defaultB = defaultA === scenarios[scenarios.length - 1].id ? scenarios[1].id : scenarios[scenarios.length - 1].id;

    const optionsHtml = scenarios
      .map((s) => `<option value="${escapeHtml(s.id)}">${escapeHtml(s.title)}</option>`)
      .join('');
    selectA.innerHTML = optionsHtml;
    selectB.innerHTML = optionsHtml;
    selectA.value = defaultA;
    selectB.value = defaultB;

    function meterCell(meter) {
      const pct = Math.round((meter.score / 3) * 100);
      return `
        <div class="compare-bar-wrap">
          <div class="compare-bar" aria-hidden="true"><div class="compare-bar-fill" style="width:${pct}%"></div></div>
          <span class="tabular-nums"><strong>${escapeHtml(meter.tier)}</strong> (${meter.score}/3)</span>
        </div>
        <div style="font-size:0.84rem;color:var(--text-secondary);margin-top:0.25rem;">${escapeHtml(meter.note)}</div>
      `;
    }

    function renderComparison() {
      const a = scenarios.find((s) => s.id === selectA.value) || scenarios[0];
      const b = scenarios.find((s) => s.id === selectB.value) || scenarios[1];
      if (headA) headA.innerHTML = `<a href="detail.html?id=${encodeURIComponent(a.id)}">${escapeHtml(a.title)}</a>`;
      if (headB) headB.innerHTML = `<a href="detail.html?id=${encodeURIComponent(b.id)}">${escapeHtml(b.title)}</a>`;

      tbody.innerHTML = `
        <tr>
          <th scope="row">Category &amp; Popularity</th>
          <td>${escapeHtml(a.categoryLabel)} · <span class="tabular-nums">${a.popularity}% popular</span></td>
          <td>${escapeHtml(b.categoryLabel)} · <span class="tabular-nums">${b.popularity}% popular</span></td>
        </tr>
        <tr>
          <th scope="row">Execution Difficulty</th>
          <td>${meterCell(a.meters.difficulty)}</td>
          <td>${meterCell(b.meters.difficulty)}</td>
        </tr>
        <tr>
          <th scope="row">Tactical Risk</th>
          <td>${meterCell(a.meters.risk)}</td>
          <td>${meterCell(b.meters.risk)}</td>
        </tr>
        <tr>
          <th scope="row">Statistical Impact</th>
          <td>${meterCell(a.meters.impact)}</td>
          <td>${meterCell(b.meters.impact)}</td>
        </tr>
        <tr>
          <th scope="row">Key Rule / Benchmark</th>
          <td>${escapeHtml(a.keyRule)}</td>
          <td>${escapeHtml(b.keyRule)}</td>
        </tr>
      `;

      if (verdictEl) {
        if (a.id === b.id) {
          verdictEl.textContent = 'You selected the same play on both sides. Pick a second scenario to see contrasting difficulty, risk, and impact.';
        } else if (a.difficulty > b.difficulty) {
          verdictEl.textContent = `${a.title} (Difficulty ${a.difficulty}/5) takes more repetition to master than ${b.title} (Difficulty ${b.difficulty}/5), while ${b.title} is an easier starting point for new players.`;
        } else if (b.difficulty > a.difficulty) {
          verdictEl.textContent = `${b.title} (Difficulty ${b.difficulty}/5) demands sharper situational judgment than ${a.title} (Difficulty ${a.difficulty}/5). Start with ${a.title} first, then build up to ${b.title}.`;
        } else {
          verdictEl.textContent = `Both plays carry the same Difficulty (${a.difficulty}/5), so focus on tactical risk: ${a.title} carries ${a.meters.risk.tier.toLowerCase()} risk while ${b.title} carries ${b.meters.risk.tier.toLowerCase()} risk.`;
        }
      }
    }

    selectA.addEventListener('change', renderComparison);
    selectB.addEventListener('change', renderComparison);
    if (swapBtn) {
      swapBtn.addEventListener('click', () => {
        const tmp = selectA.value;
        selectA.value = selectB.value;
        selectB.value = tmp;
        renderComparison();
      });
    }

    renderComparison();
  }

  /* =========================================================
     Page: My Playbook Protected CRUD + Favorites (playbook.html)
     ========================================================= */
  async function initPlaybookPage() {
    const form = document.getElementById('playbook-form');
    const listEl = document.getElementById('playbook-entries');
    if (!form || !listEl) return;

    const emptyEl = document.getElementById('playbook-empty');
    const feedbackEl = document.getElementById('playbook-feedback');
    const authBanner = document.getElementById('playbook-login-note');
    const favListEl = document.getElementById('playbook-favorites');
    const workspaceEl = document.getElementById('playbook-workspace');
    const lockedEl = document.getElementById('playbook-locked-notice');

    // Enforce protected view when logged out
    if (!currentUser) {
      if (authBanner) authBanner.hidden = true;
      if (workspaceEl) workspaceEl.hidden = true;
      if (lockedEl) lockedEl.hidden = false;
      return;
    }

    if (lockedEl) lockedEl.hidden = true;
    if (workspaceEl) workspaceEl.hidden = false;
    if (authBanner) {
      authBanner.hidden = false;
      authBanner.className = 'feedback-banner is-success';
      authBanner.innerHTML = `Signed in as <strong>${escapeHtml(currentUser.username)}</strong>. Your playbook notes and favorites are saved to your account.`;
    }

    const titleInput = document.getElementById('note-title');
    const bodyInput = document.getElementById('note-body');
    const ratingInput = document.getElementById('note-rating');
    const submitBtn = document.getElementById('playbook-submit-btn');
    const cancelEditBtn = document.getElementById('playbook-cancel-edit');

    let editingId = null;
    let notes = [];
    const scenarios = await getScenarios();

    async function renderFavorites() {
      if (!favListEl) return;
      const favIds = await getFavorites();
      const favItems = scenarios.filter((s) => favIds.includes(s.id));
      if (!favItems.length) {
        favListEl.innerHTML = '<p style="color:var(--text-secondary);margin-bottom:0;">No saved plays yet. Visit the <a href="scenarios.html">Scenario Library</a> to bookmark plays.</p>';
        return;
      }
      favListEl.innerHTML = favItems
        .map(
          (s) => `
            <div class="card-subtle" style="display:flex;align-items:center;justify-content:space-between;gap:0.75rem;">
              <div>
                <a href="detail.html?id=${encodeURIComponent(s.id)}" style="font-weight:600;">${escapeHtml(s.title)}</a>
                <div class="meta-line" style="margin-bottom:0;margin-top:0.15rem;">${escapeHtml(s.categoryLabel)} · Difficulty ${s.difficulty}/5</div>
              </div>
              <button type="button" class="btn btn-ghost btn-sm" data-remove-fav="${escapeHtml(s.id)}">Remove</button>
            </div>
          `
        )
        .join('');
      favListEl.querySelectorAll('[data-remove-fav]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          try {
            await api(`/api/favorites/${encodeURIComponent(btn.getAttribute('data-remove-fav'))}`, { method: 'DELETE' });
            showToast('Removed from Favorites');
            await renderFavorites();
          } catch (err) {
            showToast(err.message);
          }
        });
      });
    }

    function formatDate(iso) {
      try {
        return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      } catch {
        return '';
      }
    }

    async function loadAndRenderNotes() {
      try {
        const res = await api('/api/playbook');
        notes = res.entries || [];
      } catch (err) {
        notes = [];
        if (feedbackEl) {
          feedbackEl.className = 'feedback-banner is-error';
          feedbackEl.textContent = err.message;
        }
      }

      if (!notes.length) {
        listEl.innerHTML = '';
        if (emptyEl) emptyEl.hidden = false;
        return;
      }
      if (emptyEl) emptyEl.hidden = true;

      listEl.innerHTML = notes
        .map(
          (note) => `
            <li>
              <article class="card">
                <div class="meta-line">
                  <span class="tabular-nums">Difficulty ${escapeHtml(note.rating)}/5</span>
                  <span aria-hidden="true">·</span>
                  <span>Updated ${escapeHtml(formatDate(note.updated_at))}</span>
                </div>
                <h3>${escapeHtml(note.title)}</h3>
                <p style="color:var(--text-secondary);white-space:pre-line;">${escapeHtml(note.body)}</p>
                <div style="display:flex;gap:0.5rem;margin-top:0.75rem;">
                  <button type="button" class="btn btn-secondary btn-sm" data-edit-note="${escapeHtml(note.id)}">Edit</button>
                  <button type="button" class="btn btn-danger btn-sm" data-delete-note="${escapeHtml(note.id)}">Delete</button>
                </div>
              </article>
            </li>
          `
        )
        .join('');

      listEl.querySelectorAll('[data-edit-note]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-edit-note');
          const target = notes.find((n) => String(n.id) === String(id));
          if (!target) return;
          editingId = target.id;
          titleInput.value = target.title;
          bodyInput.value = target.body;
          ratingInput.value = String(target.rating);
          if (submitBtn) submitBtn.textContent = 'Save Changes';
          if (cancelEditBtn) cancelEditBtn.hidden = false;
          titleInput.focus();
        });
      });

      listEl.querySelectorAll('[data-delete-note]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-delete-note');
          try {
            await api(`/api/playbook/${encodeURIComponent(id)}`, { method: 'DELETE' });
            if (String(editingId) === String(id)) {
              editingId = null;
              form.reset();
              if (submitBtn) submitBtn.textContent = 'Add to Playbook';
              if (cancelEditBtn) cancelEditBtn.hidden = true;
            }
            showToast('Playbook note deleted');
            await loadAndRenderNotes();
          } catch (err) {
            showToast(err.message);
          }
        });
      });
    }

    if (cancelEditBtn) {
      cancelEditBtn.addEventListener('click', () => {
        editingId = null;
        form.reset();
        if (submitBtn) submitBtn.textContent = 'Add to Playbook';
        cancelEditBtn.hidden = true;
      });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = titleInput.value.trim();
      const body = bodyInput.value.trim();
      const rating = Number(ratingInput.value);

      if (title.length < 2 || body.length < 4) {
        if (feedbackEl) {
          feedbackEl.className = 'feedback-banner is-error';
          feedbackEl.textContent = 'Please enter a play name (2+ chars) and strategy notes (4+ chars).';
        }
        return;
      }

      try {
        if (editingId) {
          await api(`/api/playbook/${encodeURIComponent(editingId)}`, {
            method: 'PUT',
            body: JSON.stringify({ title, body, rating })
          });
          editingId = null;
          if (submitBtn) submitBtn.textContent = 'Add to Playbook';
          if (cancelEditBtn) cancelEditBtn.hidden = true;
          if (feedbackEl) {
            feedbackEl.className = 'feedback-banner is-success';
            feedbackEl.textContent = 'Playbook note updated.';
          }
          showToast('Playbook note updated!');
        } else {
          await api('/api/playbook', {
            method: 'POST',
            body: JSON.stringify({ title, body, rating })
          });
          if (feedbackEl) {
            feedbackEl.className = 'feedback-banner is-success';
            feedbackEl.textContent = 'Play successfully added to Playbook!';
          }
          showToast('Play successfully added to Playbook!');
        }

        form.reset();
        await loadAndRenderNotes();
      } catch (err) {
        if (feedbackEl) {
          feedbackEl.className = 'feedback-banner is-error';
          feedbackEl.textContent = err.message;
        }
      }
    });

    await Promise.all([renderFavorites(), loadAndRenderNotes()]);
  }

  /* =========================================================
     Pages: Auth (login.html & register.html)
     ========================================================= */
  function initAuthPages() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginForm) {
      const errorEl = document.getElementById('login-error');
      const signedInBox = document.getElementById('signed-in-panel');
      if (currentUser && signedInBox) {
        signedInBox.hidden = false;
        loginForm.hidden = true;
        const nameTarget = document.getElementById('signed-in-name');
        if (nameTarget) nameTarget.textContent = currentUser.username;
        const signOutBtn = document.getElementById('sign-out-btn');
        if (signOutBtn) {
          signOutBtn.addEventListener('click', async () => {
            await api('/api/auth/logout', { method: 'POST' }).catch(() => {});
            showToast('Logged out');
            window.location.reload();
          });
        }
      }

      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const identifier = document.getElementById('login-user').value.trim();
        const password = document.getElementById('login-pass').value;
        if (identifier.length < 3 || password.length < 8) {
          errorEl.className = 'feedback-banner is-error';
          errorEl.textContent = 'Enter a username/email (3+ characters) and password (8+ characters).';
          return;
        }
        try {
          const res = await api('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ identifier, password })
          });
          showToast('Welcome back, ' + res.user.username + '!');
          window.location.href = 'playbook.html';
        } catch (err) {
          errorEl.className = 'feedback-banner is-error';
          errorEl.textContent = err.message;
        }
      });
    }

    if (registerForm) {
      const errorEl = document.getElementById('register-error');
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('reg-user').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-pass').value;

        if (username.length < 3 || !email.includes('@') || password.length < 8) {
          errorEl.className = 'feedback-banner is-error';
          errorEl.textContent = 'Please enter a valid username (3+ chars), email, and 8+ character password.';
          return;
        }

        try {
          const res = await api('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password })
          });
          showToast('Account created for ' + res.user.username + '!');
          window.location.href = 'playbook.html';
        } catch (err) {
          errorEl.className = 'feedback-banner is-error';
          errorEl.textContent = err.message;
        }
      });
    }
  }

  /* =========================================================
     Bootstrap
     ========================================================= */
  document.addEventListener('DOMContentLoaded', async () => {
    await initHeader();
    initAuthPages();
    await Promise.all([
      initHomePage(),
      initScenariosPage(),
      initDetailPage(),
      initComparePage(),
      initPlaybookPage()
    ]);
  });
})();
