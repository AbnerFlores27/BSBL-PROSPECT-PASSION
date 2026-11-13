/* DiamondIQ — Phase 2 UI Script
   Handles:
   1. Light (grey + powder blue) / Dark (deep navy-grey) theme toggle
   2. Mobile hamburger navigation menu
   3. Collapsible expert accordions on mobile screens (< 768px) */
(function () {
  'use strict';

  const THEME_KEY = 'diamondiq_theme';

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

  document.addEventListener('DOMContentLoaded', () => {
    // 1. Theme initialization & toggle
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

    // 2. Mobile hamburger menu toggle
    const navToggle = document.getElementById('nav-toggle');
    const siteNav = document.getElementById('site-nav');
    if (navToggle && siteNav) {
      navToggle.addEventListener('click', () => {
        const isOpen = siteNav.classList.toggle('is-open');
        navToggle.setAttribute('aria-expanded', String(isOpen));
      });
    }

    // 3. On mobile (< 768px), collapse extra expert accordions so the page stays compact
    if (window.innerWidth < 768) {
      const expertDetails = document.querySelectorAll('.expert-card details');
      expertDetails.forEach((d, index) => {
        if (index > 0) d.removeAttribute('open');
      });
    }
  });
})();
