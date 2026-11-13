(function () {
  'use strict';

  async function requestJson(url, options) {
    const response = await fetch(url, {
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Something went wrong. Please try again.');
    return result;
  }

  function showFeedback(element, message, kind) {
    if (!element) return;
    element.textContent = message;
    element.classList.toggle('is-error', kind === 'error');
    element.classList.toggle('is-success', kind === 'success');
  }

  function connectForm(form, endpoint, feedback, getPayload) {
    if (!form) return;
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const button = form.querySelector('button[type="submit"]');
      const feedbackElement = document.getElementById(feedback);
      if (button) button.disabled = true;
      showFeedback(feedbackElement, '', '');
      try {
        await requestJson(endpoint, {
          method: 'POST',
          body: JSON.stringify(getPayload(new FormData(form))),
        });
        window.location.assign('/playbook.html');
      } catch (error) {
        showFeedback(feedbackElement, error.message, 'error');
      } finally {
        if (button) button.disabled = false;
      }
    });
  }

  function addAccountControls(user) {
    const accountLinks = document.querySelectorAll(
      '.site-nav a[href="login.html"], .footer-nav a[href="login.html"]',
    );
    accountLinks.forEach((link) => {
      link.href = '/playbook.html';
      link.textContent = `@${user.username}`;
      link.title = `Signed in as ${user.email}`;
      link.removeAttribute('aria-current');
    });

    const actions = document.querySelector('.header-actions');
    if (actions && !document.getElementById('logout-button')) {
      const logout = document.createElement('button');
      logout.id = 'logout-button';
      logout.type = 'button';
      logout.className = 'theme-toggle';
      logout.textContent = 'Log Out';
      logout.addEventListener('click', async () => {
        logout.disabled = true;
        try {
          await requestJson('/api/auth/logout', { method: 'POST', body: '{}' });
          window.location.assign('/index.html');
        } catch {
          logout.disabled = false;
        }
      });
      actions.insertBefore(logout, actions.firstChild);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    connectForm(
      document.querySelector('form[action="/api/auth/register"]'),
      '/api/auth/register',
      'register-error',
      (form) => ({
        username: form.get('username'),
        email: form.get('email'),
        password: form.get('password'),
      }),
    );
    connectForm(
      document.querySelector('form[action="/api/auth/login"]'),
      '/api/auth/login',
      'login-error',
      (form) => ({
        identifier: form.get('identifier'),
        password: form.get('password'),
      }),
    );

    requestJson('/api/auth/me', { headers: {} })
      .then(({ user }) => {
        if (!user) return;
        addAccountControls(user);
        if (window.location.pathname.endsWith('/login.html') || window.location.pathname.endsWith('/register.html')) {
          window.location.replace('/playbook.html');
        }
      })
      .catch(() => {});
  });
})();
