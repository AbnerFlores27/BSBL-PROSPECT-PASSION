const test = require('node:test');
const assert = require('node:assert/strict');
const Jax = require('../jax-engine.js');

test('VALID_STADIUMS contains all 29 ballparks including 10 San Diego & CA HS fields and excludes dodgers/lsu/omaha/usc', () => {
  assert.equal(Object.keys(Jax.VALID_STADIUMS).length, 29);
  for (const required of [
    'fenway', 'petco', 'coors', 'oracle', 'wrigley', 'yankee',
    'sdsu', 'ucsb', 'cal-poly', 'pk-park', 'sc-founders', 'stanford',
    'usd', 'tcu', 'byu', 'app-state', 'vandy', 'ucla',
    'hs-corona', 'hs-eastlake', 'hs-rb', 'hs-cchs', 'hs-tp', 'hs-poway', 'hs-granite',
    'hs-santana', 'hs-grossmont', 'hs-valhalla', 'cage'
  ]) {
    assert.ok(Jax.VALID_STADIUMS[required], `Missing verified ballpark ${required}`);
  }
  for (const removed of ['usc', 'dodgers', 'lsu', 'omaha']) {
    assert.equal(Jax.VALID_STADIUMS[removed], undefined, `Removed ballpark ${removed} should not be present`);
  }
  assert.equal(Object.keys(Jax.VALID_BATS).length, 16);
  for (const batRequired of [
    'baum-gold', 'victus-v243', 'ls-c271', 'old-hickory-j143',
    'goods-2026', 'goods-2022', 'warstic-bonesaber',
    'voodoo-one', 'ls-atlas', 'stringking-metal2', 'combat-rodeo', 'combat-blue',
    'marucci-catx2', 'victus-vandal', 'rawlings-icon', 'easton-hype'
  ]) {
    assert.ok(Jax.VALID_BATS[batRequired], `Missing verified bat ${batRequired}`);
  }
  assert.ok(Jax.VALID_STADIUMS.sdsu.dims.includes('412 CF'), 'SDSU should reflect 412 CF');
});

test('isValidGeminiKey rejects empty strings and placeholder keys', () => {
  assert.equal(Jax.isValidGeminiKey(''), false);
  assert.equal(Jax.isValidGeminiKey('GEMINI_API_KEY'), false);
  assert.equal(Jax.isValidGeminiKey('YOUR_API_KEY'), false);
  assert.equal(Jax.isValidGeminiKey('AIzaSyD-RealLookingKey1234567890'), true);
});

test('buildLocalJaxResponse answers beginner, 16-bat locker, flaw, and stadium queries without an API key and avoids repetition', () => {
  const beginner = Jax.buildLocalJaxResponse({
    message: 'I am a beginner — give me the 3 simplest hitting & fielding cues.'
  });
  assert.ok(beginner.reply.length > 40);
  assert.equal(beginner.source, 'instant-local');
  assert.ok(Array.isArray(beginner.actionableTips) && beginner.actionableTips.length >= 2);
  assert.ok(Array.isArray(beginner.videoLinks) && beginner.videoLinks.length >= 1);
  assert.ok(Array.isArray(beginner.followUpPrompts) && beginner.followUpPrompts.length >= 2);

  const baum = Jax.buildLocalJaxResponse({
    message: 'Compare Baum Bat Gold vs 2026 The Goods and Combat Spec-A1.'
  });
  assert.ok(/Baum Bat Gold/i.test(baum.reply));
  assert.equal(baum.recommendedBatId, 'baum-gold');
  assert.ok(Jax.VALID_BATS[baum.recommendedBatId]);

  const icon = Jax.buildLocalJaxResponse({
    message: 'How does the Rawlings Icon composite feel vs Hype Fire?'
  });
  assert.equal(icon.recommendedBatId, 'rawlings-icon');
  assert.ok(/Rawlings Icon/i.test(icon.reply));

  const hype = Jax.buildLocalJaxResponse({
    message: 'Tell me about the Easton Hype Fire swing feel.'
  });
  assert.equal(hype.recommendedBatId, 'easton-hype');

  const bonesaber = Jax.buildLocalJaxResponse({
    message: 'How does the Warstic Bonesaber Hybrid swing?'
  });
  assert.equal(bonesaber.recommendedBatId, 'warstic-bonesaber');
  assert.ok(/Bonesaber|Katana2X|Tsuka/i.test(bonesaber.reply));

  const metal2 = Jax.buildLocalJaxResponse({
    message: 'Tell me about StringKing Metal 2 Pro alloy ring.'
  });
  assert.equal(metal2.recommendedBatId, 'stringking-metal2');
  assert.ok(/StringKing Metal 2/i.test(metal2.reply));

  const vandal = Jax.buildLocalJaxResponse({
    message: 'Compare Victus Vandal vs CATX2.'
  });
  assert.equal(vandal.recommendedBatId, 'victus-vandal');
  assert.ok(/Victus Vandal|carbon/i.test(vandal.reply));

  const oldHick = Jax.buildLocalJaxResponse({
    message: 'How is the Old Hickory J143M wood maple?'
  });
  assert.equal(oldHick.recommendedBatId, 'old-hickory-j143');
  assert.ok(/Old Hickory J143M/i.test(oldHick.reply));

  const grossmont = Jax.buildLocalJaxResponse({
    message: 'How does Grossmont HS Foothillers Field play?'
  });
  assert.ok(/Grossmont|Helix/i.test(grossmont.reply));

  const repeatGuard = Jax.buildLocalJaxResponse({
    message: 'How does Grossmont HS Foothillers Field play?',
    history: [{ role: 'jax', text: grossmont.reply }]
  });
  assert.notEqual(repeatGuard.reply, grossmont.reply);

  const repeatTurn3 = Jax.buildLocalJaxResponse({
    message: 'How does Grossmont HS Foothillers Field play?',
    history: [
      { role: 'jax', text: grossmont.reply },
      { role: 'jax', text: repeatGuard.reply }
    ]
  });
  assert.notEqual(repeatTurn3.reply, grossmont.reply);
  assert.notEqual(repeatTurn3.reply, repeatGuard.reply);
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
