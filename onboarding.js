/* DiamondIQ — First-Time AI Player Checkup & Custom Recommendations */
(function () {
  'use strict';

  function esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function initOnboardingPage() {
    const form = document.getElementById('onboarding-form');
    if (!form) return;

    const welcomeBanner = document.getElementById('onboarding-welcome-note');
    const params = new URLSearchParams(window.location.search);
    if (welcomeBanner && params.get('welcome') === '1') {
      welcomeBanner.hidden = false;
    }

    const expEl = document.getElementById('ob-exp');
    const posEl = document.getElementById('ob-pos');
    const hitEl = document.getElementById('ob-hit');
    const fieldEl = document.getElementById('ob-field');
    const notesEl = document.getElementById('ob-notes');
    const sampleBtn = document.getElementById('onboarding-sample-btn');
    const submitBtn = document.getElementById('onboarding-submit-btn');
    const statusText = document.getElementById('onboarding-status-text');
    const errEl = document.getElementById('onboarding-error');
    const reportEl = document.getElementById('onboarding-report');

    let savedAuthFocus = null;
    try {
      const rawFocus = localStorage.getItem('diamondiq_auth_focus');
      if (rawFocus) savedAuthFocus = JSON.parse(rawFocus);
    } catch {
      savedAuthFocus = null;
    }

    const preFocus = params.get('focus') || (savedAuthFocus && savedAuthFocus.focus) || '';
    const preLevel = params.get('level') || (savedAuthFocus && savedAuthFocus.level) || '';

    if (preLevel && expEl) {
      const matchOpt = Array.from(expEl.options).find(
        (opt) => opt.value === preLevel || (opt.value && opt.value.toLowerCase().includes(preLevel.toLowerCase()))
      );
      if (matchOpt) expEl.value = matchOpt.value;
    }

    const FOCUS_PRESETS = {
      'hitting-power': {
        label: 'Crushing Elevated Line Drives & Stopping Rollovers',
        hit: 'I roll my wrists early and pull hard or weak grounders to 3rd/SS (Rolling Over)',
        field: 'Clean glove and routes — working on faster transfers and IQ'
      },
      'hitting-timing': {
        label: 'Fastball Timing & Eliminating Bat Drag',
        hit: 'I feel late on fastballs and jam pitches off my hands (possible Bat Drag)',
        field: 'Clean glove and routes — working on faster transfers and IQ'
      },
      'fielding-hands': {
        label: 'Soft Infield Hands & Right-Left Footwork',
        hit: 'I square the ball up well and want higher home-run launch angles',
        field: 'Ground balls bounce off my palm or I stab downward at hops (Glove Stabbing)'
      },
      'fielding-routes': {
        label: 'Outfield 45° Drop-Step & Low Linear Crow Hop',
        hit: 'I square the ball up well and want higher home-run launch angles',
        field: 'I curve around fly balls or misjudge deep overhead balls (Banana Route)'
      }
    };

    if (preFocus && FOCUS_PRESETS[preFocus]) {
      const preset = FOCUS_PRESETS[preFocus];
      if (hitEl && preset.hit) hitEl.value = preset.hit;
      if (fieldEl && preset.field) fieldEl.value = preset.field;
      if (welcomeBanner && params.get('welcome') === '1') {
        welcomeBanner.textContent = `Welcome! We pre-loaded your "${preset.label}" focus — pick your position, answer the 3 quick Baseball IQ questions below, and get your custom plan + slow-mo tutorial links.`;
      }
      if (statusText) {
        statusText.textContent = `Pre-loaded "${preset.label}" focus. Answer Step 3 and tap Analyze My Game!`;
      }
    }

    function setErr(msg) {
      if (!errEl) return;
      errEl.className = msg ? 'feedback-banner is-error onboarding-step-wide' : 'feedback-banner onboarding-step-wide';
      errEl.textContent = msg || '';
    }

    function authHeaders(extra = {}) {
      if (window.diamondiqAuth && typeof window.diamondiqAuth.getHeaders === 'function') {
        return window.diamondiqAuth.getHeaders(extra);
      }
      return { ...extra };
    }

    function renderReport(profile, savedToAccount) {
      if (!reportEl || !profile) return;
      reportEl.hidden = false;
      reportEl.classList.remove('is-revealed');
      void reportEl.offsetWidth;
      reportEl.classList.add('is-revealed');

      const tipsHtml = (profile.actionableTips || [])
        .map((tip) => `<li>${esc(tip)}</li>`)
        .join('');

      const videosHtml = (profile.videoLinks || [])
        .map(
          (v) => `
          <article class="card">
            <div class="meta-line">${esc(v.domain)} · Slow-Mo Interactive Video</div>
            <h4 style="margin-bottom:0.35rem;">${esc(v.title)}</h4>
            <p style="color:var(--text-secondary);font-size:0.92rem;margin-bottom:0.85rem;">${esc(v.reason)}</p>
            <a class="btn btn-primary btn-sm" href="${esc(v.url)}">Watch Slow-Mo Fix Video &rarr;</a>
          </article>`
        )
        .join('');

      const scenariosHtml = (profile.recommendedScenarios || [])
        .map(
          (s) => `
          <article class="card-subtle">
            <div class="meta-line">5-Expert Rule &amp; Stat Lesson</div>
            <h4 style="margin-bottom:0.3rem;">${esc(s.title)}</h4>
            <p style="color:var(--text-secondary);font-size:0.9rem;margin-bottom:0.75rem;">${esc(s.reason)}</p>
            <a class="btn btn-secondary btn-sm" href="${esc(s.url)}">Open Scenario Breakdown</a>
          </article>`
        )
        .join('');

      reportEl.innerHTML = `
        <div class="rgb-led-rail rgb-led-rail--studio" aria-hidden="true"></div>
        <div class="report-head">
          <div>
            <div class="kicker-line">AI Scouting Profile · ${esc(profile.skillTier)} · Baseball IQ ${esc(profile.iqCorrectCount)}/${esc(profile.iqTotal)}</div>
            <h2>${esc(profile.headline)}</h2>
            <p class="section-subtitle">${esc(profile.summary)}</p>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:0.55rem;align-items:center;">
            <button type="button" id="ob-save-playbook-btn" class="btn btn-primary btn-sm">Save Tips to My Playbook</button>
            <a class="btn btn-secondary btn-sm" href="index.html?bat=${encodeURIComponent(profile.recommendedBatId)}#gameday-studio">Test ${esc(profile.recommendedBatName.split(' (')[0])} in 3D Cage</a>
          </div>
        </div>

        <div class="ob-summary-strip">
          <div>
            <div class="hitlab-stat-label">Projected Tier</div>
            <div class="hitlab-stat-val">${esc(profile.skillTier)}</div>
          </div>
          <div>
            <div class="hitlab-stat-label">Readiness Score</div>
            <div class="hitlab-stat-val tabular-nums">${esc(profile.readinessScore)} / 100</div>
          </div>
          <div>
            <div class="hitlab-stat-label">Baseball IQ Quiz</div>
            <div class="hitlab-stat-val tabular-nums">${esc(profile.iqCorrectCount)} / ${esc(profile.iqTotal)}</div>
          </div>
          <div>
            <div class="hitlab-stat-label">Best Cage Bat Match</div>
            <div class="hitlab-stat-val" style="font-size:0.96rem;">${esc(profile.recommendedBatName.split(' (')[0])}</div>
          </div>
        </div>

        <div class="report-cards-grid">
          <article class="card">
            <div class="meta-line">Swing &amp; Plate Mechanics</div>
            <h3>Hitting Diagnosis</h3>
            <p style="color:var(--text-secondary);margin-bottom:0.65rem;">${esc(profile.swingDiagnosis)}</p>
            <div class="report-drill-box">
              <strong>Cage Bat Recommendation:</strong> ${esc(profile.recommendedBatName)}<br>
              <span style="color:var(--text-secondary);">${esc(profile.batReason)}</span>
            </div>
          </article>

          <article class="card">
            <div class="meta-line">Glove, Footwork &amp; Game IQ</div>
            <h3>Fielding &amp; IQ Diagnosis</h3>
            <p style="color:var(--text-secondary);margin-bottom:0.65rem;">${esc(profile.fieldingDiagnosis)}</p>
            <div class="report-drill-box">
              <strong>Rules &amp; Statcast Check:</strong><br>
              <span style="color:var(--text-secondary);">${esc(profile.iqBreakdown)}</span>
            </div>
          </article>
        </div>

        <div style="padding:0 1.45rem 1.15rem;">
          <div class="card-subtle">
            <div class="kicker-line">Coach AI Priority Checklist</div>
            <h3 style="margin-bottom:0.55rem;">Top Actionable Tips for Next Practice</h3>
            <ul class="ob-tips-list">${tipsHtml}</ul>
          </div>
        </div>

        <div style="padding:0 1.45rem 1.25rem;">
          <div class="kicker-line">Recommended Drill Videos (Slow-Mo Pre-Loaded)</div>
          <h3 style="margin-bottom:0.55rem;">Click Any Video Link to Open &amp; Train</h3>
          <div class="card-subtle" style="margin-bottom:0.9rem;padding:0.85rem 1rem;">
            <strong style="display:block;margin-bottom:0.35rem;font-size:0.92rem;">How to Do Your Tutorial Videos &amp; Practice Drills:</strong>
            <ol style="margin:0;padding-left:1.2rem;color:var(--text-secondary);font-size:0.88rem;line-height:1.5;">
              <li>Open any Slow-Mo Fix Video below — it boots into <strong>0.45x Split View</strong> comparing your Common Flaw vs. Pro Mechanic side-by-side.</li>
              <li>Use the <strong>Stage 1–4 buttons</strong> (or timeline scrubber) to freeze contact/catch points and match the live step-by-step body cues.</li>
              <li>Run the 2 listed tee/glove drills, save them to <strong>My Playbook</strong>, and test <strong>${esc(profile.recommendedBatName.split(' (')[0])}</strong> in the D1 3D Stadium.</li>
            </ol>
          </div>
          <div class="ob-video-grid">${videosHtml}</div>
        </div>

        <div style="padding:0 1.45rem 1.45rem;">
          <div class="kicker-line">Recommended 5-Expert Play Breakdowns</div>
          <div class="ob-scenario-grid">${scenariosHtml}</div>
          <p style="margin-top:1rem;margin-bottom:0;font-size:0.86rem;color:var(--text-secondary);">
            ${savedToAccount
              ? 'This AI scouting profile is saved to your account and visible anytime in My Playbook.'
              : 'Tip: Log in or create an account to save this AI scouting report permanently to My Playbook.'}
          </p>
        </div>
      `;

      const saveBtn = document.getElementById('ob-save-playbook-btn');
      if (saveBtn) {
        let saving = false;
        saveBtn.addEventListener('click', async () => {
          if (saving) return;
          saving = true;
          saveBtn.disabled = true;
          saveBtn.classList.add('is-loading');
          saveBtn.textContent = 'Saving to Playbook...';
          const title = `AI Coach Plan (${profile.skillTier}): ${profile.headline}`;
          const body = [
            `SKILL TIER: ${profile.skillTier} (Readiness ${profile.readinessScore}/100 · IQ ${profile.iqCorrectCount}/3)`,
            '',
            `HITTING FOCUS: ${profile.swingDiagnosis}`,
            '',
            `FIELDING FOCUS: ${profile.fieldingDiagnosis}`,
            '',
            `TOP TIPS:\n- ${(profile.actionableTips || []).join('\n- ')}`,
            '',
            `WATCH VIDEOS:\n- ${(profile.videoLinks || []).map((v) => `${v.title} -> ${v.url}`).join('\n- ')}`,
            '',
            `BEST CAGE BAT: ${profile.recommendedBatName}`
          ].join('\n');
          try {
            const res = await fetch('/api/playbook', {
              method: 'POST',
              credentials: 'same-origin',
              headers: authHeaders({ 'Content-Type': 'application/json' }),
              body: JSON.stringify({ title, body, rating: 4 })
            });
            if (res.status === 401) {
              saveBtn.textContent = 'Log in first to save...';
              setTimeout(() => {
                window.location.href = 'login.html?next=onboarding.html';
              }, 800);
              return;
            }
            if (!res.ok) throw new Error('Save failed');
            saveBtn.textContent = 'Saved to My Playbook!';
          } catch {
            saveBtn.textContent = 'Could not save right now';
            saveBtn.disabled = false;
          } finally {
            saving = false;
            saveBtn.classList.remove('is-loading');
          }
        });
      }
    }

    if (sampleBtn) {
      sampleBtn.addEventListener('click', () => {
        if (expEl) expEl.value = 'Rec / Little League (Learning core skills)';
        if (posEl) posEl.value = 'Middle Infield (SS / 2B)';
        if (hitEl) hitEl.value = 'I feel late on fastballs and jam pitches off my hands (possible Bat Drag)';
        if (fieldEl) fieldEl.value = 'Ground balls bounce off my palm or I stab downward at hops (Glove Stabbing)';
        if (notesEl) {
          notesEl.value = 'When pitchers throw faster inside fastballs I get jammed and ground out weakly to 3rd base, and on hard grounders the ball kicks off the heel of my glove.';
        }
        const f1 = form.querySelector('input[name="iqForceAnswer"][value="step-2b"]');
        const f2 = form.querySelector('input[name="iqInfieldFlyAnswer"][value="automatic-double-play"]');
        const f3 = form.querySelector('input[name="iqLaunchAngleAnswer"][value="26-30-deg-98-mph"]');
        if (f1) f1.checked = true;
        if (f2) f2.checked = true;
        if (f3) f3.checked = true;
        setErr('');
        if (statusText) statusText.textContent = 'Sample player filled — tap Analyze My Game!';
      });
    }

    let analyzing = false;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (analyzing) return;
      setErr('');
      const experienceLevel = expEl ? expEl.value : '';
      const primaryPosition = posEl ? posEl.value : '';
      const hittingSymptom = hitEl ? hitEl.value : '';
      const fieldingSymptom = fieldEl ? fieldEl.value : '';
      const iqForceAnswer = form.querySelector('input[name="iqForceAnswer"]:checked')?.value || '';
      const iqInfieldFlyAnswer = form.querySelector('input[name="iqInfieldFlyAnswer"]:checked')?.value || '';
      const iqLaunchAngleAnswer = form.querySelector('input[name="iqLaunchAngleAnswer"]:checked')?.value || '';
      const playerNotes = notesEl ? notesEl.value.trim() : '';

      if (!experienceLevel || !primaryPosition || !hittingSymptom || !fieldingSymptom) {
        setErr('Please fill out Steps 1 and 2 (level, position, swing feel, and glove feel) first.');
        return;
      }
      if (!iqForceAnswer || !iqInfieldFlyAnswer || !iqLaunchAngleAnswer) {
        setErr('Please answer all 3 quick Baseball IQ questions in Step 3.');
        return;
      }

      analyzing = true;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add('is-loading');
        submitBtn.textContent = 'Coach AI is analyzing...';
      }
      if (statusText) statusText.textContent = 'Building your custom video & drill roadmap...';

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 28000);

      try {
        const res = await fetch('/api/ai/onboarding-quiz', {
          method: 'POST',
          credentials: 'same-origin',
          signal: controller.signal,
          headers: authHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            experienceLevel,
            primaryPosition,
            hittingSymptom,
            fieldingSymptom,
            iqForceAnswer,
            iqInfieldFlyAnswer,
            iqLaunchAngleAnswer,
            playerNotes
          })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || `Request failed (${res.status})`);
        }
        renderReport(data.profile, Boolean(data.saved));
        reportEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (statusText) statusText.textContent = 'Scouting report ready!';
      } catch (err) {
        const msg = err && err.name === 'AbortError'
          ? 'Coach AI took too long to respond (28s timeout). Please tap Analyze My Game again to retry.'
          : (err && err.message) || 'Could not reach AI Coach right now. Please try again.';
        setErr(msg);
        if (statusText) statusText.textContent = '';
      } finally {
        clearTimeout(timeoutId);
        analyzing = false;
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.classList.remove('is-loading');
          submitBtn.textContent = 'Analyze My Game with AI Coach';
        }
      }
    });

    // If returning user already has a saved onboarding profile, show it below right away
    fetch('/api/onboarding/me', {
      credentials: 'same-origin',
      headers: authHeaders()
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data.profile) {
          renderReport(data.profile, true);
        }
      })
      .catch(() => {});
  }

  document.addEventListener('DOMContentLoaded', initOnboardingPage);
})();
