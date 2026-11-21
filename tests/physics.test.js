const test = require('node:test');
const assert = require('node:assert/strict');
const Physics = require('../physics.js');

function makeStadium(id, tier, lf, cf, rf, h = 8) {
  return {
    id,
    tier,
    airDensity: 1.0,
    wallDist(phi) {
      return (phi < 0 ? lf : rf) + Math.cos((phi / 0.785) * Math.PI * 0.5) * (cf - (phi < 0 ? lf : rf));
    },
    wallHeight() {
      return h;
    }
  };
}

test('No mid-air invisible bounce over HS outfields, CF bays, or open lawns', () => {
  const hs = makeStadium('hs-coastal', 'hs', 320, 385, 320, 6);
  // Over left-center at HS Coastal (phi = -0.35), 40 ft past fence -> must be null!
  assert.equal(Physics.getParkStructureSurface(hs, -0.35, 40), null);

  const oracle = makeStadium('oracle', 'pro', 339, 399, 309, 24);
  // Over RF fence into McCovey Cove (phi = 0.52) -> must be null!
  assert.equal(Physics.getParkStructureSurface(oracle, 0.52, 25), null);

  const omaha = makeStadium('omaha', 'college', 335, 408, 335, 8.5);
  // Past seats (>70ft) -> must be null!
  assert.equal(Physics.getParkStructureSurface(omaha, 0.45, 78), null);

  // Full RK4 flight over HS outfield lands smoothly at z = 0.14 (ground) with zero mid-air deflection
  const hsFlight = Physics.simulateBattedBallRK4({
    stadium: hs,
    exitVelo: 100,
    launchDeg: 28,
    sprayDeg: -22,
    backspinRpm: 2100,
    sidespinRpm: -300
  });
  assert.equal(hsFlight.isHr, true);
  assert.equal(hsFlight.seatHitTime, null);
  const lastPt = hsFlight.points[hsFlight.points.length - 1];
  assert.ok(lastPt.z <= 0.2, `Expected ball to reach ground (<= 0.2ft), got ${lastPt.z}`);
});

test('Calibrated bat physics avoids constant 500-ft HRs on clean barrels', () => {
  const yankee = makeStadium('yankee', 'pro', 318, 408, 314, 8);
  const kin = Physics.computeSwingKinematics({
    bat: { cor: 0.515, popMod: 1.045, weightMod: 1.0, moi: 1.12, launchLift: 1.5 },
    pitchMph: 89,
    sweetSpotEff: 1.0,
    isTrueBarrel: true,
    demoAutoSwing: true,
    hSign: 1
  });
  assert.ok(kin.swingMph >= 72 && kin.swingMph <= 78, `Realistic swing mph expected, got ${kin.swingMph}`);
  assert.ok(kin.exitVelo >= 98 && kin.exitVelo <= 111.5, `Realistic EV expected, got ${kin.exitVelo}`);

  const flight = Physics.simulateBattedBallRK4({
    stadium: yankee,
    exitVelo: kin.exitVelo,
    launchDeg: kin.launchDeg,
    sprayDeg: kin.sprayDeg,
    backspinRpm: kin.backspinRpm,
    sidespinRpm: kin.sidespinRpm
  });
  assert.equal(flight.isHr, true);
  assert.ok(flight.dist >= 365 && flight.dist <= 455, `Expected realistic HR dist 365-455ft, got ${flight.dist}`);
});

test('Ground balls bounce on ground and roll proportionally to exit velocity', () => {
  const omaha = makeStadium('omaha', 'college', 335, 408, 335, 8.5);
  const weakGrounder = Physics.simulateBattedBallRK4({
    stadium: omaha,
    exitVelo: 68,
    launchDeg: 2,
    sprayDeg: -10,
    backspinRpm: -400
  });
  const laserGrounder = Physics.simulateBattedBallRK4({
    stadium: omaha,
    exitVelo: 102,
    launchDeg: 2,
    sprayDeg: -10,
    backspinRpm: -400
  });
  assert.ok(weakGrounder.groundBounces >= 1);
  assert.ok(laserGrounder.groundBounces >= 1);
  assert.ok(
    laserGrounder.dist > weakGrounder.dist + 45,
    `Hard grounder (${laserGrounder.dist}ft) should roll much farther than weak grounder (${weakGrounder.dist}ft)`
  );
  // Check ball is actually settled at ground height at end
  assert.ok(laserGrounder.points[laserGrounder.points.length - 1].z <= 0.25);
});

test('RK4 Pitch trajectories reach target zone accurately from both pitcher & machine', () => {
  const fb = Physics.simulatePitchRK4({
    mph: 92,
    spec: { magX: 7.0, magY: 16.5, hbIn: 11, spinAxisDeg: 25, spinAxisClock: '1:00' },
    endX: 0.25,
    endY: -0.2,
    hand: 'R',
    deliveryMode: 'pitcher'
  });
  assert.equal(fb.samples.length, 61);
  assert.ok(fb.dur > 0.38 && fb.dur < 0.72, `Unexpected fastball dur ${fb.dur}`);
  // Last ~4 frames cross plate near (targetX, targetY)
  const plateSample = fb.samples[Math.round((60 / 1.06))];
  assert.ok(Math.abs(plateSample.x - fb.targetX) < 0.3, `Pitch missed targetX: ${plateSample.x} vs ${fb.targetX}`);
  assert.ok(Math.abs(plateSample.y - fb.targetY) < 0.3, `Pitch missed targetY: ${plateSample.y} vs ${fb.targetY}`);

  const mach = Physics.simulatePitchRK4({
    mph: 80,
    spec: { magX: 0, magY: 14, hbIn: 0, spinAxisDeg: 0, spinAxisClock: '12:00' },
    endX: 0,
    endY: 0,
    hand: 'R',
    deliveryMode: 'machine'
  });
  assert.ok(Math.abs(mach.samples[0].x) < 0.01);
  assert.ok(Math.abs(mach.samples[0].y - 3.85) < 0.05);
});

test('Synthesized bat waveforms have crisp percussive attack & rapid decay (zero plastic/pipe sustain)', () => {
  const sr = 44100;
  for (const kind of ['baum-gold', 'goods-2026', 'goods-2022', 'combat-rodeo', 'combat-blue']) {
    const ch = Physics.synthesizeBatImpactSamples(kind, 'sweet', sr);
    assert.ok(ch.length > 1000);
    let peakIdx = 0;
    let peakVal = 0;
    for (let i = 0; i < ch.length; i++) {
      if (Math.abs(ch[i]) > peakVal) {
        peakVal = Math.abs(ch[i]);
        peakIdx = i;
      }
    }
    assert.ok(peakIdx < sr * 0.01, `${kind} attack should peak within 10ms, peaked at ${(peakIdx / sr) * 1000}ms`);
    // RMS tail after 80% of buffer must drop far below initial transient
    const tailStart = Math.floor(ch.length * 0.75);
    let tailEnergy = 0;
    for (let i = tailStart; i < ch.length; i++) tailEnergy += ch[i] * ch[i];
    const tailRms = Math.sqrt(tailEnergy / (ch.length - tailStart));
    assert.ok(tailRms < 0.08, `${kind} tail RMS ${tailRms.toFixed(4)} is too sustain-heavy (plastic/pipe ring!)`);
  }
});

test('Wind influences both live pitches and batted-ball carry delta cleanly', () => {
  const omaha = makeStadium('omaha', 'college', 335, 408, 335, 8.5);
  const spec = { magX: 7.0, magY: 16.5, hbIn: 11, spinAxisDeg: 25, spinAxisClock: '1:00' };

  const pitchCalm = Physics.simulatePitchRK4({ mph: 90, spec, endX: 0, endY: 0, hand: 'R', wind: Physics.WIND_PRESETS.calm });
  const pitchCrossR = Physics.simulatePitchRK4({ mph: 90, spec, endX: 0, endY: 0, hand: 'R', wind: Physics.WIND_PRESETS.cross12r });
  assert.ok(pitchCrossR.targetX < pitchCalm.targetX - 0.08, `R->L crosswind should push pitch left: ${pitchCrossR.targetX} vs ${pitchCalm.targetX}`);
  assert.ok(pitchCrossR.windDriftInX < -1.0, `Expected measurable negative windDriftInX, got ${pitchCrossR.windDriftInX}`);

  const flyOut = Physics.simulateBattedBallRK4({
    stadium: omaha,
    wind: Physics.WIND_PRESETS.out10,
    exitVelo: 100,
    launchDeg: 28,
    sprayDeg: 0,
    backspinRpm: 2100
  });
  const flyIn = Physics.simulateBattedBallRK4({
    stadium: omaha,
    wind: Physics.WIND_PRESETS.in12,
    exitVelo: 100,
    launchDeg: 28,
    sprayDeg: 0,
    backspinRpm: 2100
  });
  assert.ok(flyOut.windCarryDeltaFt >= 8, `10 mph Out wind should add >=8 ft carry, got ${flyOut.windCarryDeltaFt}`);
  assert.ok(flyIn.windCarryDeltaFt <= -10, `12 mph In wind should subtract >=10 ft carry, got ${flyIn.windCarryDeltaFt}`);
  assert.ok(flyOut.carryDist > flyIn.carryDist + 20);
});

test('Contact zone classifier and signature acoustics clearly distinguish wood, high-pitch alloy pings, and 4 zones', () => {
  assert.equal(Physics.classifyContactZone({ dx: 0.05, underBallOffset: 0.05, hSign: 1, radialRatio: 0.1, isTrueBarrel: true }), 'sweet');
  assert.equal(Physics.classifyContactZone({ dx: 0.42, underBallOffset: 0.05, hSign: 1, radialRatio: 0.55, isTrueBarrel: false }), 'jam');
  assert.equal(Physics.classifyContactZone({ dx: -0.42, underBallOffset: 0.05, hSign: 1, radialRatio: 0.55, isTrueBarrel: false }), 'endcap');
  // Mirrored for LHB (hSign = -1): negative dx is inside toward hands!
  assert.equal(Physics.classifyContactZone({ dx: -0.42, underBallOffset: 0.05, hSign: -1, radialRatio: 0.55, isTrueBarrel: false }), 'jam');
  assert.equal(Physics.classifyContactZone({ dx: 0.04, underBallOffset: 0.56, hSign: 1, radialRatio: 0.68, isTrueBarrel: false }), 'glance');

  const sr = 44100;
  function midPingEnergy(buf) {
    // RMS energy between 20ms and 110ms (captures alloy ping sustain vs dry wood crack decay)
    const i0 = Math.floor(sr * 0.02);
    const i1 = Math.min(buf.length, Math.floor(sr * 0.11));
    if (i1 <= i0) return 0;
    let sum = 0;
    for (let i = i0; i < i1; i++) sum += buf[i] * buf[i];
    return Math.sqrt(sum / (i1 - i0));
  }

  const baum = Physics.synthesizeBatImpactSamples('baum-gold', 'sweet', sr);
  const goods26 = Physics.synthesizeBatImpactSamples('goods-2026', 'sweet', sr);
  const combatBlue = Physics.synthesizeBatImpactSamples('combat-blue', 'sweet', sr);
  const baumSust = midPingEnergy(baum);
  const goodsSust = midPingEnergy(goods26);
  const combatSust = midPingEnergy(combatBlue);

  assert.ok(goodsSust > baumSust * 2.5, `2026 Goods (${goodsSust.toFixed(4)}) should have much stronger ping than dry wood Baum (${baumSust.toFixed(4)})`);
  assert.ok(combatSust > baumSust * 2.5, `Combat Blue (${combatSust.toFixed(4)}) should have much stronger ping than dry wood Baum (${baumSust.toFixed(4)})`);

  // Check energy-weighted pitch centroid (RMS derivative / RMS amplitude over first 60ms)
  function effFreqHz(buf) {
    const n = Math.min(buf.length, Math.floor(sr * 0.06));
    let e = 0;
    let de = 0;
    for (let i = 1; i < n; i++) {
      e += buf[i] * buf[i];
      const d = buf[i] - buf[i - 1];
      de += d * d;
    }
    return (sr / (2 * Math.PI)) * Math.sqrt(de / Math.max(1e-9, e));
  }
  const rodeoSweet = Physics.synthesizeBatImpactSamples('combat-rodeo', 'sweet', sr);
  const rodeoJam = Physics.synthesizeBatImpactSamples('combat-rodeo', 'jam', sr);
  const rodeoEndcap = Physics.synthesizeBatImpactSamples('combat-rodeo', 'endcap', sr);
  const rodeoGlance = Physics.synthesizeBatImpactSamples('combat-rodeo', 'glance', sr);

  assert.ok(effFreqHz(rodeoEndcap) > effFreqHz(rodeoJam) * 1.4, `Endcap (${Math.round(effFreqHz(rodeoEndcap))}Hz) must sound higher pitched than jam (${Math.round(effFreqHz(rodeoJam))}Hz)`);
  assert.ok(rodeoGlance.length < rodeoSweet.length * 0.4, 'Glance foul skim must be much shorter than squared alloy ping');
});

