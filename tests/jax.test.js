const test = require('node:test');
const assert = require('node:assert/strict');
const Jax = require('../jax-engine.js');

test('VALID_STADIUMS contains all 22 photo-verified ballparks and excludes unverified parks', () => {
  assert.equal(Object.keys(Jax.VALID_STADIUMS).length, 22);
  for (const required of [
    'fenway', 'petco', 'coors', 'oracle', 'wrigley', 'yankee',
    'sdsu', 'ucsb', 'cal-poly', 'pk-park', 'sc-founders', 'stanford',
    'usd', 'tcu', 'byu', 'app-state', 'vandy', 'ucla',
    'hs-corona', 'hs-eastlake', 'hs-rb', 'cage'
  ]) {
    assert.ok(Jax.VALID_STADIUMS[required], `Missing verified ballpark ${required}`);
  }
  for (const removed of ['usc', 'hs-tp', 'hs-cchs', 'dodgers', 'lsu', 'omaha']) {
    assert.equal(Jax.VALID_STADIUMS[removed], undefined, `Removed ballpark ${removed} should not be present`);
  }
});

test('isValidGeminiKey rejects empty strings and placeholder keys', () => {
  assert.equal(Jax.isValidGeminiKey(''), false);
  assert.equal(Jax.isValidGeminiKey('GEMINI_API_KEY'), false);
  assert.equal(Jax.isValidGeminiKey('YOUR_API_KEY'), false);
  assert.equal(Jax.isValidGeminiKey('AIzaSyD-RealLookingKey1234567890'), true);
});

test('buildLocalJaxResponse answers beginner, bat, flaw, and stadium queries without an API key', () => {
  const beginner = Jax.buildLocalJaxResponse({
    message: 'I am a beginner — give me the 3 simplest hitting & fielding cues.'
  });
  assert.ok(beginner.reply.length > 40);
  assert.ok(Array.isArray(beginner.actionableTips) && beginner.actionableTips.length >= 2);
  assert.ok(Array.isArray(beginner.videoLinks) && beginner.videoLinks.length >= 1);

  const baum = Jax.buildLocalJaxResponse({
    message: 'Compare Baum Bat Gold vs 2026 The Goods and Combat Spec-A1.'
  });
  assert.ok(/Baum Bat Gold/i.test(baum.reply));
  assert.equal(baum.recommendedBatId, 'baum-gold');
  assert.ok(Jax.VALID_BATS[baum.recommendedBatId]);

  const vandy = Jax.buildLocalJaxResponse({
    message: 'What is special about Vanderbilt Hawkins Field?'
  });
  assert.ok(/Hawkins|Monster|35-ft/i.test(vandy.reply));

  const calPoly = Jax.buildLocalJaxResponse({
    message: 'How does Scolinos Field at Cal Poly Pomona play?'
  });
  assert.ok(/Scolinos|Pomona|340 LF/i.test(calPoly.reply));
});

test('parseDelimitedJaxResponse validates internal clinic/bat/scenario IDs safely', () => {
  const parsed = Jax.parseDelimitedJaxResponse(
    'REPLY: Stay inside the fastball and drive through center field.\n' +
      'TIPS:\n' +
      '- Load into your back hip early.\n' +
      '- Hold your finish high.\n' +
      'CLINICS: rolling-over, fake-clinic-id\n' +
      'BAT: baum-gold\n' +
      'SCENARIOS: relay-throw, bad-id'
  );
  assert.ok(parsed.reply.includes('Stay inside'));
  assert.equal(parsed.tips.length, 2);
  assert.ok(parsed.clinicTokens.includes('rolling-over'));
  assert.equal(parsed.batId, 'baum-gold');
  assert.ok(parsed.scenarioTokens.includes('relay-throw'));
});
