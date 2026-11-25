/* DiamondIQ — Pure Baseball Physics, RK4 Aerodynamics, Park Collision & Acoustic PCM Synthesis
   Shared UMD module: works cleanly in Node.js (unit tests) and browser (`window.DiamondPhysics`). */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.DiamondPhysics = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const WIND_PRESETS = {
    calm: { label: 'Calm 0 mph', vx: 0, vy: 0 },
    out10: { label: '10 mph Out to CF', vx: 0, vy: 14.67 },
    in12: { label: '12 mph In from CF', vx: 0, vy: -17.6 },
    cross8: { label: '8 mph L->R Cross', vx: 11.73, vy: 2.0 },
    cross12r: { label: '12 mph R->L Cross', vx: -17.6, vy: 1.5 }
  };

  function classifyContactZone(params) {
    const dx = params.dx || 0;
    const underBallOffset = params.underBallOffset || 0;
    const hSign = params.hSign || 1;
    const radialRatio = params.radialRatio || 0;
    const isTrueBarrel = Boolean(params.isTrueBarrel);

    if (isTrueBarrel) return 'sweet';
    // Thin vertical edge graze (pop-up under-cut or top-chopped foul skim)
    if (Math.abs(underBallOffset) > 0.42 || (radialRatio > 0.72 && Math.abs(underBallOffset) > Math.abs(dx) * 1.15)) {
      return 'glance';
    }
    // dx * hSign > 0 means pitch was closer to batter's body/hands (jam/taper); < 0 means off endcap/toe
    const alongBarrel = dx * hSign;
    if (alongBarrel > 0.22) return 'jam';
    if (alongBarrel < -0.22) return 'endcap';
    return 'sweet';
  }

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function makeSeededRand(seed) {
    let s = seed | 0;
    return function () {
      s = (s * 1664525 + 1013904223) | 0;
      return ((s >>> 0) / 4294967296) * 2 - 1;
    };
  }

  function makeBiquadBP(fc, q, sr) {
    const w0 = (2 * Math.PI * fc) / sr;
    const alpha = Math.sin(w0) / (2 * q);
    const a0 = 1 + alpha;
    const b0 = alpha / a0;
    const b2 = -alpha / a0;
    const a1 = (-2 * Math.cos(w0)) / a0;
    const a2 = (1 - alpha) / a0;
    let x1 = 0;
    let x2 = 0;
    let y1 = 0;
    let y2 = 0;
    return function (x) {
      const y = b0 * x + b2 * x2 - a1 * y1 - a2 * y2;
      x2 = x1;
      x1 = x;
      y2 = y1;
      y1 = y;
      return y;
    };
  }

  function makeBiquadLP(fc, q, sr) {
    const w0 = (2 * Math.PI * fc) / sr;
    const cosW = Math.cos(w0);
    const alpha = Math.sin(w0) / (2 * q);
    const a0 = 1 + alpha;
    const b0 = ((1 - cosW) * 0.5) / a0;
    const b1 = (1 - cosW) / a0;
    const b2 = b0;
    const a1 = (-2 * cosW) / a0;
    const a2 = (1 - alpha) / a0;
    let x1 = 0;
    let x2 = 0;
    let y1 = 0;
    let y2 = 0;
    return function (x) {
      const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
      x2 = x1;
      x1 = x;
      y2 = y1;
      y1 = y;
      return y;
    };
  }

  // Exact Physical Structure Surface Query synchronized 1:1 with stadium3d.js!
  // Returns NULL where open sky, berm grass, bay water, or outer plaza exists so balls NEVER bounce in mid-air.
  function getParkStructureSurface(st, phi, pastWall) {
    if (!st || pastWall < 6) return null;
    const id = st.id || 'sdsu';
    if (id === 'cage') return null;

    // 1. Outfield physical stands / batter's eye per specific ballpark (|phi| <= 0.785)
    let tiers = [];
    if (id === 'fenway') {
      tiers = [
        // Monster seats atop 37-ft wall (LF)
        { startPhi: -0.78, endPhi: -0.25, dOff: 6, dSpan: 22, y0: 38.5, y1: 43.0, steps: 4, isSeat: true, isUpper: false, isSecondDeck: false },
        // Center/RF bleachers
        { startPhi: -0.23, endPhi: 0.78, dOff: 12, dSpan: 56, y0: 9.0, y1: 32.0, steps: 8, isSeat: true, isUpper: false, isSecondDeck: false }
      ];
    } else if (id === 'petco') {
      tiers = [
        // Western Metal Supply brick building in LF corner + LF/RF Lower Bowl + RF/LF Upper Porch (CF Park at the Park stays open lawn!)
        { startPhi: -0.78, endPhi: -0.58, dOff: 6, dSpan: 34, y0: 42.0, y1: 50.0, steps: 2, isSeat: false, isUpper: true, isSecondDeck: false },
        { startPhi: -0.56, endPhi: -0.22, dOff: 12, dSpan: 38, y0: 10.0, y1: 27.0, steps: 6, isSeat: true, isUpper: false, isSecondDeck: false },
        { startPhi: -0.56, endPhi: -0.24, dOff: 52, dSpan: 34, y0: 32.0, y1: 50.0, steps: 5, isSeat: true, isUpper: true, isSecondDeck: true },
        { startPhi: 0.22, endPhi: 0.78, dOff: 12, dSpan: 38, y0: 10.0, y1: 27.0, steps: 6, isSeat: true, isUpper: false, isSecondDeck: false },
        { startPhi: 0.24, endPhi: 0.78, dOff: 52, dSpan: 34, y0: 32.0, y1: 50.0, steps: 5, isSeat: true, isUpper: true, isSecondDeck: true }
      ];
    } else if (id === 'coors') {
      tiers = [
        { startPhi: -0.78, endPhi: -0.21, dOff: 12, dSpan: 40, y0: 10.0, y1: 29.0, steps: 7, isSeat: true, isUpper: false, isSecondDeck: false },
        { startPhi: -0.76, endPhi: -0.22, dOff: 55, dSpan: 36, y0: 35.0, y1: 56.0, steps: 6, isSeat: true, isUpper: true, isSecondDeck: true },
        { startPhi: -0.17, endPhi: 0.17, dOff: 14, dSpan: 22, y0: 22.0, y1: 26.0, steps: 2, isSeat: false, isUpper: false, isSecondDeck: false },
        { startPhi: 0.21, endPhi: 0.78, dOff: 12, dSpan: 40, y0: 10.0, y1: 29.0, steps: 7, isSeat: true, isUpper: false, isSecondDeck: false },
        { startPhi: 0.22, endPhi: 0.76, dOff: 55, dSpan: 36, y0: 35.0, y1: 56.0, steps: 6, isSeat: true, isUpper: true, isSecondDeck: true }
      ];
    } else if (id === 'oracle') {
      tiers = [
        { startPhi: -0.78, endPhi: -0.06, dOff: 12, dSpan: 40, y0: 10.0, y1: 28.0, steps: 7, isSeat: true, isUpper: false, isSecondDeck: false },
        { startPhi: -0.78, endPhi: -0.14, dOff: 54, dSpan: 32, y0: 34.0, y1: 52.0, steps: 5, isSeat: true, isUpper: true, isSecondDeck: true },
        { startPhi: -0.05, endPhi: 0.34, dOff: 10, dSpan: 20, y0: 20.0, y1: 24.0, steps: 2, isSeat: false, isUpper: false, isSecondDeck: false }
        // phi > 0.34 is McCovey Cove water -> null!
      ];
    } else if (id === 'wrigley') {
      tiers = [
        { startPhi: -0.78, endPhi: -0.14, dOff: 10, dSpan: 44, y0: 12.0, y1: 30.0, steps: 7, isSeat: true, isUpper: false, isSecondDeck: false },
        { startPhi: -0.13, endPhi: 0.13, dOff: 10, dSpan: 28, y0: 22.0, y1: 28.0, steps: 3, isSeat: false, isUpper: false, isSecondDeck: false },
        { startPhi: 0.14, endPhi: 0.78, dOff: 10, dSpan: 44, y0: 12.0, y1: 30.0, steps: 7, isSeat: true, isUpper: false, isSecondDeck: false },
        { startPhi: -0.72, endPhi: 0.72, dOff: 62, dSpan: 28, y0: 38.0, y1: 46.0, steps: 3, isSeat: true, isUpper: true, isSecondDeck: false }
      ];
    } else if (id === 'yankee') {
      tiers = [
        { startPhi: -0.78, endPhi: -0.19, dOff: 12, dSpan: 44, y0: 9.5, y1: 31.0, steps: 7, isSeat: true, isUpper: false, isSecondDeck: false },
        { startPhi: -0.78, endPhi: -0.22, dOff: 64, dSpan: 40, y0: 41.0, y1: 63.0, steps: 6, isSeat: true, isUpper: true, isSecondDeck: true },
        { startPhi: -0.18, endPhi: 0.18, dOff: 8, dSpan: 34, y0: 14.0, y1: 24.0, steps: 3, isSeat: false, isUpper: false, isSecondDeck: false },
        { startPhi: -0.16, endPhi: 0.16, dOff: 72, dSpan: 26, y0: 41.0, y1: 48.0, steps: 2, isSeat: false, isUpper: true, isSecondDeck: false },
        { startPhi: 0.19, endPhi: 0.78, dOff: 12, dSpan: 44, y0: 9.5, y1: 31.0, steps: 7, isSeat: true, isUpper: false, isSecondDeck: false },
        { startPhi: 0.22, endPhi: 0.78, dOff: 64, dSpan: 40, y0: 41.0, y1: 63.0, steps: 6, isSeat: true, isUpper: true, isSecondDeck: true }
      ];
    } else if (id === 'sdsu') {
      // SDSU Tony Gwynn Stadium: LF Aztec Patio Terrace, CF Batter's Eye (no towering RF deck blocking open horizon)
      tiers = [
        { startPhi: -0.78, endPhi: -0.26, dOff: 8, dSpan: 38, y0: 9.0, y1: 22.0, steps: 6, isSeat: true },
        { startPhi: -0.18, endPhi: 0.18, dOff: 12, dSpan: 22, y0: 24.0, y1: 28.0, steps: 2, isSeat: false }
      ];
    } else if (id === 'sc-founders') {
      // South Carolina Founders Park: LF Garnet Videoboard & Stands, CF Batter's Eye, RF Maroon Stands
      tiers = [
        { startPhi: -0.78, endPhi: -0.34, dOff: 10, dSpan: 38, y0: 9.0, y1: 25.0, steps: 6, isSeat: true },
        { startPhi: -0.17, endPhi: 0.17, dOff: 12, dSpan: 20, y0: 24.0, y1: 28.0, steps: 2, isSeat: false },
        { startPhi: 0.32, endPhi: 0.78, dOff: 10, dSpan: 34, y0: 8.0, y1: 20.0, steps: 5, isSeat: true }
      ];
    } else if (id === 'vandy') {
      // Vanderbilt Hawkins Field: Iconic 35-ft Left-Field Monster Wall & Hawkins Videoboard, CF Batter's Eye, RCF Stands
      tiers = [
        { startPhi: -0.78, endPhi: -0.28, dOff: 8, dSpan: 36, y0: 34.0, y1: 42.0, steps: 4, isSeat: true },
        { startPhi: -0.16, endPhi: 0.16, dOff: 12, dSpan: 18, y0: 24.0, y1: 28.0, steps: 2, isSeat: false },
        { startPhi: 0.24, endPhi: 0.78, dOff: 10, dSpan: 36, y0: 8.0, y1: 22.0, steps: 6, isSeat: true }
      ];
    } else if (id === 'usd') {
      // USD Fowler Park: Open LCF Plaza, CF Batter's Eye, RCF Spanish Mission Dorm facade
      tiers = [
        { startPhi: -0.16, endPhi: 0.16, dOff: 10, dSpan: 18, y0: 22.0, y1: 26.0, steps: 2, isSeat: false },
        { startPhi: 0.26, endPhi: 0.72, dOff: 16, dSpan: 36, y0: 18.0, y1: 32.0, steps: 3, isSeat: false }
      ];
    } else if (id === 'tcu') {
      // TCU Lupton Stadium: Open berm alleys + CF Batter's Eye
      tiers = [
        { startPhi: -0.16, endPhi: 0.16, dOff: 12, dSpan: 18, y0: 22.0, y1: 26.0, steps: 2, isSeat: false }
      ];
    } else if (id === 'byu') {
      // BYU Larry H. Miller Field: Open berms + CF indoor brick fieldhouse beyond CF wall
      tiers = [
        { startPhi: -0.16, endPhi: 0.16, dOff: 12, dSpan: 20, y0: 22.0, y1: 26.0, steps: 2, isSeat: false }
      ];
    } else if (id === 'app-state') {
      // App State Beaver Field: Open Blue Ridge autumn woods + CF Batter's Eye
      tiers = [
        { startPhi: -0.15, endPhi: 0.15, dOff: 12, dSpan: 16, y0: 20.0, y1: 24.0, steps: 2, isSeat: false }
      ];
    } else if (id === 'ucla') {
      // UCLA Jackie Robinson Stadium: CF Batter's Eye + 2-tier covered RF batting pavilion
      tiers = [
        { startPhi: -0.16, endPhi: 0.16, dOff: 12, dSpan: 18, y0: 22.0, y1: 26.0, steps: 2, isSeat: false },
        { startPhi: 0.32, endPhi: 0.74, dOff: 12, dSpan: 28, y0: 14.0, y1: 24.0, steps: 3, isSeat: false }
      ];
    } else if (id === 'pk-park') {
      // Oregon PK Park: Open grass bullpen berms + LF video board
      tiers = [
        { startPhi: -0.17, endPhi: 0.17, dOff: 12, dSpan: 18, y0: 22.0, y1: 26.0, steps: 2, isSeat: false }
      ];
    } else if (id === 'stanford' || id === 'ucsb' || id === 'cal-poly') {
      // Stanford Sunken Diamond, UCSB Uyesaka, Cal Poly Pomona Scolinos Field: open outfields + CF Batter's Eye
      tiers = [
        { startPhi: -0.16, endPhi: 0.16, dOff: 12, dSpan: 16, y0: 20.0, y1: 24.0, steps: 2, isSeat: false }
      ];
    } else if (
      st.tier === 'hs' ||
      id === 'hs-cchs' ||
      id === 'hs-tp' ||
      id === 'hs-poway' ||
      id === 'hs-granite' ||
      id === 'hs-santana' ||
      id === 'hs-grossmont' ||
      id === 'hs-valhalla'
    ) {
      // High School parks (Corona, Eastlake, RB, CCHS, Torrey Pines, Poway, Granite Hills, Santana, Grossmont, Valhalla): open outfields + CF screen
      tiers = [
        { startPhi: -0.16, endPhi: 0.16, dOff: 10, dSpan: 10, y0: 16.0, y1: 18.0, steps: 1, isSeat: false }
      ];
    }

    for (let i = 0; i < tiers.length; i++) {
      const tc = tiers[i];
      if (phi >= tc.startPhi && phi <= tc.endPhi && pastWall >= tc.dOff && pastWall <= tc.dOff + tc.dSpan) {
        const frac = (pastWall - tc.dOff) / tc.dSpan;
        const stepIdx = Math.min(tc.steps - 1, Math.floor(frac * tc.steps));
        const stepH = (tc.y1 - tc.y0) / tc.steps;
        return {
          floorZ: tc.y0 + stepIdx * stepH + 1.25,
          isSeat: Boolean(tc.isSeat),
          isUpper: Boolean(tc.isUpper || tc.dOff > 45),
          isSecondDeck: Boolean(tc.isSecondDeck)
        };
      }
    }

    // No structural stand exists at (phi, pastWall) -> let gravity bring the ball to the turf/berm/ground!
    return null;
  }

  function mirrorClockLabel(clockStr) {
    const parts = String(clockStr || '12:00').split(':');
    const h = Number(parts[0]) || 12;
    const m = Number(parts[1]) || 0;
    const totalMin = (12 * 60 - ((h % 12) * 60 + m) + 720) % 720;
    const mh = Math.floor(totalMin / 60) || 12;
    const mm = totalMin % 60;
    return mh + ':' + String(mm).padStart(2, '0');
  }

  // Calibrated Bat-Ball Impact Kinematics (Realistic 66-77 mph swing, 96-109 mph clean barrels — NOT routine 117 mph / 500 ft bombs!)
  function computeSwingKinematics(params) {
    const bat = params.bat;
    const pitchMph = params.pitchMph || 89;
    const pitchDesc = params.pitchDescendDeg != null ? params.pitchDescendDeg : -7.5;
    const sweetSpotEff = clamp(params.sweetSpotEff != null ? params.sweetSpotEff : 0.9, 0.2, 1.0);
    const isTrueBarrel = Boolean(params.isTrueBarrel);
    const demoAutoSwing = Boolean(params.demoAutoSwing);
    const underBallOffset = params.underBallOffset || 0;
    const timingErr = params.timingErr || 0;
    const dx = params.dx || 0;
    const hSign = params.hSign || 1;
    const randA = params.randA != null ? params.randA : 0.5;
    const randB = params.randB != null ? params.randB : 0.5;

    const weightMod = bat.weightMod || 1.0;
    const swingMph = Number(
      (demoAutoSwing ? 75.5 * weightMod : (66.5 + sweetSpotEff * 9.8) * weightMod).toFixed(1)
    );
    const moiInertiaBoost = 1 + ((bat.moi || 1.0) - 1.0) * 0.1 * sweetSpotEff;
    const collisionQ = (bat.cor || 0.5) * 0.396 * (bat.popMod || 1.0) * (0.93 + 0.08 * sweetSpotEff);
    const rawEv =
      collisionQ * pitchMph +
      (1 + collisionQ) * swingMph * moiInertiaBoost * (0.77 + 0.155 * sweetSpotEff);
    const exitVelo = Number(Math.min(111.5, Math.max(54, rawEv)).toFixed(1));
    const smashFactor = Number((exitVelo / Math.max(55, swingMph)).toFixed(2));
    const attackAngle = Math.round(
      (isTrueBarrel ? 11 : 8.5 + clamp(underBallOffset * 14, -4, 8)) + (bat.launchLift || 0)
    );

    let launchDeg = demoAutoSwing
      ? 27.0 + (bat.launchLift || 0) * 0.25
      : isTrueBarrel
        ? 23.5 + (bat.launchLift || 0) + clamp(underBallOffset * 25, -4, 7) + (randA - 0.5) * 2.0
        : 13.5 + (bat.launchLift || 0) * 0.55 + underBallOffset * 42 - pitchDesc * 0.2 + (randA - 0.5) * 2.4;
    launchDeg = clamp(launchDeg, -11, 56);

    const backspinRpm = demoAutoSwing
      ? 2160
      : isTrueBarrel
        ? Math.round(2020 + underBallOffset * 920)
        : clamp(Math.round(1320 + underBallOffset * 2850 + (launchDeg - 15) * 26), -1900, 3500);

    let sprayDeg = demoAutoSwing ? -21 * hSign : timingErr * 148 * hSign + dx * 20;
    const absTime = Math.abs(timingErr);
    if (isTrueBarrel && Math.abs(sprayDeg) > 36) sprayDeg = Math.sign(sprayDeg) * 34;
    if (absTime > 0.165) sprayDeg = (timingErr < 0 ? -56 : 56) * hSign;
    sprayDeg = clamp(sprayDeg, -68, 68);

    const sidespinRpm = clamp(sprayDeg * 24 + dx * 400 + (randB - 0.5) * 60, -1450, 1450);

    return {
      swingMph,
      exitVelo,
      smashFactor,
      attackAngle,
      launchDeg,
      backspinRpm,
      sprayDeg,
      sidespinRpm
    };
  }

  // Unrestricted Outdoor RK4 Projection (used for D1 Indoor Cage virtual outdoor telemetry)
  function simulateOutdoorProjectionRK4(params) {
    const st = params.stadium;
    const wind = params.wind || WIND_PRESETS.calm;
    const v0 = params.exitVelo * 1.46667;
    const theta = (params.launchDeg * Math.PI) / 180;
    const phi = (params.sprayDeg * Math.PI) / 180;
    const startPos = params.startPos || { x: 0, y: 1.4, z: 2.65 };

    let x = startPos.x || 0;
    let y = startPos.y != null ? startPos.y : 1.4;
    let z = Math.max(1.2, startPos.z != null ? startPos.z : 2.65);
    let vx = v0 * Math.cos(theta) * Math.sin(phi);
    let vy = v0 * Math.cos(theta) * Math.cos(phi);
    let vz = v0 * Math.sin(theta);

    const K = 0.00548 * (st.airDensity || 1.0);
    let wx = ((params.backspinRpm || 1900) * 2 * Math.PI) / 60;
    let wz = -((params.sidespinRpm || 0) * 2 * Math.PI) / 60;
    const dt = 1 / 90;
    let apex = z;
    let t = 0;
    let isHr = false;
    let wallHit = false;
    let carryDist = null;
    const fair = Math.abs(params.sprayDeg) <= 45;

    function deriv(cvx, cvy, cvz, cwx, cwz) {
      const rvx = cvx - wind.vx;
      const rvy = cvy - wind.vy;
      const rvz = cvz;
      const rsp = Math.hypot(rvx, rvy, rvz);
      if (rsp < 0.05) return { ax: 0, ay: 0, az: -32.174 };
      const spinMag = Math.hypot(cwx, cwz);
      const spinFactor = (0.12 * spinMag) / rsp;
      const cd = 0.326 + 0.148 * Math.min(0.48, spinFactor);
      const cl = spinFactor > 0.004 ? 0.94 / (2.36 + 0.42 / spinFactor) : 0;
      const drag = K * cd * rsp;
      const mag = spinMag > 0.1 ? (K * cl * rsp) / spinMag : 0;
      return {
        ax: -drag * rvx + mag * (-cwz * rvy),
        ay: -drag * rvy + mag * (cwz * rvx - cwx * rvz),
        az: -32.174 - drag * rvz + mag * (cwx * rvy)
      };
    }

    for (let step = 0; step < 1100; step++) {
      t += dt;
      if (Math.hypot(vx, vy, vz) < 1.0 && z <= 0.16) break;
      if (z <= 0.16 && Math.abs(vz) < 2.2 && step > 10) {
        const onDirt = Math.hypot(x, y) < 135;
        const friction = onDirt ? 1.15 : 1.62;
        vx *= Math.max(0, 1 - friction * dt);
        vy *= Math.max(0, 1 - friction * dt);
        vz = 0;
        z = 0.14;
        x += vx * dt;
        y += vy * dt;
      } else {
        const k1 = deriv(vx, vy, vz, wx, wz);
        const k2 = deriv(vx + 0.5 * dt * k1.ax, vy + 0.5 * dt * k1.ay, vz + 0.5 * dt * k1.az, wx, wz);
        const k3 = deriv(vx + 0.5 * dt * k2.ax, vy + 0.5 * dt * k2.ay, vz + 0.5 * dt * k2.az, wx, wz);
        const k4 = deriv(vx + dt * k3.ax, vy + dt * k3.ay, vz + dt * k3.az, wx, wz);
        vx += (dt / 6) * (k1.ax + 2 * k2.ax + 2 * k3.ax + k4.ax);
        vy += (dt / 6) * (k1.ay + 2 * k2.ay + 2 * k3.ay + k4.ay);
        vz += (dt / 6) * (k1.az + 2 * k2.az + 2 * k3.az + k4.az);
        x += vx * dt;
        y += vy * dt;
        z += vz * dt;
        wx *= 1 - 0.06 * dt;
        wz *= 1 - 0.06 * dt;
      }
      if (z > apex) apex = z;
      const horiz = Math.hypot(x, y);
      const curPhi = Math.atan2(x, Math.max(1, y));
      if (fair && !isHr && !wallHit && Math.abs(curPhi) <= 0.785) {
        const wDist = st.wallDist(curPhi);
        if (horiz >= wDist) {
          if (z > st.wallHeight(curPhi)) isHr = true;
          else {
            wallHit = true;
            if (carryDist === null) carryDist = Math.round(horiz);
            vx *= -0.55;
            vy *= -0.55;
            vz = Math.max(2, vz * 0.5);
          }
        }
      }
      if (z <= 0.14 && vz < 0) {
        if (carryDist === null) carryDist = Math.round(horiz);
        if (!isHr && Math.abs(vz) > 2.2) {
          z = 0.16;
          const onDirt = horiz < 135;
          vz = Math.abs(vz) * (onDirt ? 0.5 : 0.38);
          vx *= onDirt ? 0.85 : 0.76;
          vy *= onDirt ? 0.85 : 0.76;
        } else {
          z = 0.14;
          vz = 0;
        }
      }
    }

    return {
      dist: Math.round(Math.hypot(x, y)),
      carryDist: carryDist || Math.round(Math.hypot(x, y)),
      apex: Math.round(apex),
      hangTime: Number(t.toFixed(2)),
      isHr,
      wallHit,
      endX: x,
      endY: y
    };
  }

  // True 4th-Order Runge-Kutta (RK4) 120Hz Batted-Ball Flight, Proportional Ground Roll & Exact Structure Bounces
  function simulateBattedBallRK4(params) {
    const st = params.stadium;
    const outdoorFallbackSt = params.outdoorFallbackStadium || st;
    const isCage = st.id === 'cage';
    const wind = isCage ? { vx: 0, vy: 0 } : params.wind || WIND_PRESETS.calm;
    const exitVelo = params.exitVelo;
    const launchDeg = params.launchDeg;
    const sprayDeg = params.sprayDeg;
    const backspinRpm = params.backspinRpm != null ? params.backspinRpm : 1900;
    const sidespinRpm = params.sidespinRpm || 0;
    const startPos = params.startPos || { x: 0, y: 1.4, z: 2.65 };

    const v0 = exitVelo * 1.46667;
    const theta = (launchDeg * Math.PI) / 180;
    const phi = (sprayDeg * Math.PI) / 180;

    let x = startPos.x || 0;
    let y = startPos.y != null ? startPos.y : 1.4;
    let z = Math.max(1.2, startPos.z != null ? startPos.z : 2.65);
    let vx = v0 * Math.cos(theta) * Math.sin(phi);
    let vy = v0 * Math.cos(theta) * Math.cos(phi);
    let vz = v0 * Math.sin(theta);

    const airDensity = st.airDensity || 1.0;
    const K = 0.00548 * airDensity;
    let wx = (backspinRpm * 2 * Math.PI) / 60;
    let wz = -(sidespinRpm * 2 * Math.PI) / 60;

    const dt = 1 / 120;
    const points = [{ x, y, z, t: 0 }];
    let apex = z;
    let apexTime = 0;
    let apexPos = { x, y, z };
    let t = 0;
    let isHr = false;
    let wallHit = false;
    let wallHitTime = null;
    let netHitTime = null;
    let netHit2Time = null;
    let seatHitTime = null;
    let seatBounce2Time = null;
    let seatSoundType = 'seat';
    let seatBounces = 0;
    let hitUpperDeck = false;
    let hitSecondDeck = false;
    let groundBounces = 0;
    let hangTime = null;
    let carryDist = null;
    let fenceClearTime = null;
    const fair = Math.abs(sprayDeg) <= 45;

    function deriv(cvx, cvy, cvz, cwx, cwz) {
      const rvx = cvx - wind.vx;
      const rvy = cvy - wind.vy;
      const rvz = cvz;
      const rsp = Math.hypot(rvx, rvy, rvz);
      if (rsp < 0.05) return { ax: 0, ay: 0, az: -32.174 };
      const spinMag = Math.hypot(cwx, cwz);
      const spinFactor = (0.12 * spinMag) / rsp;
      const cd = 0.326 + 0.148 * Math.min(0.48, spinFactor);
      const cl = spinFactor > 0.004 ? 0.94 / (2.36 + 0.42 / spinFactor) : 0;
      const drag = K * cd * rsp;
      const mag = spinMag > 0.1 ? (K * cl * rsp) / spinMag : 0;
      return {
        ax: -drag * rvx + mag * (-cwz * rvy),
        ay: -drag * rvy + mag * (cwz * rvx - cwx * rvz),
        az: -32.174 - drag * rvz + mag * (cwx * rvy)
      };
    }

    const CAGE_HALF_W = 57.5;
    const CAGE_FAR_Y = 294.5;
    const CAGE_BACKSTOP_Y = -15.2;

    for (let step = 0; step < 1800; step++) {
      t += dt;
      const sp = Math.hypot(vx, vy, vz);
      if (sp < 1.0 && z <= 0.16) break;

      if (z <= 0.16 && Math.abs(vz) < 2.2 && step > 10) {
        const horizCur = Math.hypot(x, y);
        const onDirt = horizCur < 135;
        // Realistic rolling friction: faster balls cover more ground before coming to rest
        const friction = onDirt ? 1.15 : 1.62;
        vx *= Math.max(0, 1 - friction * dt);
        vy *= Math.max(0, 1 - friction * dt);
        vz = 0;
        z = 0.14;
        x += vx * dt;
        y += vy * dt;
      } else {
        const k1 = deriv(vx, vy, vz, wx, wz);
        const k2 = deriv(vx + 0.5 * dt * k1.ax, vy + 0.5 * dt * k1.ay, vz + 0.5 * dt * k1.az, wx, wz);
        const k3 = deriv(vx + 0.5 * dt * k2.ax, vy + 0.5 * dt * k2.ay, vz + 0.5 * dt * k2.az, wx, wz);
        const k4 = deriv(vx + dt * k3.ax, vy + dt * k3.ay, vz + dt * k3.az, wx, wz);

        const vxMid = vx + (dt / 12) * (k1.ax + 2 * k2.ax + 2 * k3.ax + k4.ax);
        const vyMid = vy + (dt / 12) * (k1.ay + 2 * k2.ay + 2 * k3.ay + k4.ay);
        const vzMid = vz + (dt / 12) * (k1.az + 2 * k2.az + 2 * k3.az + k4.az);

        vx += (dt / 6) * (k1.ax + 2 * k2.ax + 2 * k3.ax + k4.ax);
        vy += (dt / 6) * (k1.ay + 2 * k2.ay + 2 * k3.ay + k4.ay);
        vz += (dt / 6) * (k1.az + 2 * k2.az + 2 * k3.az + k4.az);

        x += vxMid * dt;
        y += vyMid * dt;
        z += vzMid * dt;

        wx *= 1 - 0.06 * dt;
        wz *= 1 - 0.06 * dt;
      }

      if (z > apex) {
        apex = z;
        apexTime = t;
        apexPos = { x, y, z };
      }

      if (isCage) {
        let hitCageMesh = false;
        if (Math.abs(x) >= CAGE_HALF_W) {
          x = Math.sign(x) * CAGE_HALF_W;
          vx = -vx * 0.24;
          vy *= 0.42;
          vz *= 0.65;
          hitCageMesh = true;
        }
        const roofH = 33.4 * (1 - 0.36 * Math.min(1, (x / 58) * (x / 58)));
        if (z >= roofH) {
          z = roofH - 0.15;
          vz = -Math.max(4, Math.abs(vz) * 0.28);
          vx *= 0.48;
          vy *= 0.48;
          hitCageMesh = true;
        }
        if (y >= CAGE_FAR_Y) {
          y = CAGE_FAR_Y - 0.15;
          vy = -Math.max(5, Math.abs(vy) * (z < 14 ? 0.45 : 0.22));
          vx *= 0.45;
          vz *= 0.55;
          hitCageMesh = true;
        }
        if (y <= CAGE_BACKSTOP_Y) {
          y = CAGE_BACKSTOP_Y + 0.15;
          vy = Math.abs(vy) * 0.28;
          vx *= 0.45;
          vz *= 0.6;
          hitCageMesh = true;
        }
        if (hitCageMesh) {
          if (netHitTime === null) {
            netHitTime = t;
            if (hangTime === null) hangTime = t;
            if (carryDist === null) carryDist = Math.round(Math.hypot(x, y));
          } else if (netHit2Time === null && t - netHitTime > 0.18) {
            netHit2Time = t;
          }
          wx *= 0.2;
          wz *= 0.2;
        }
      }

      if (step % 2 === 0) points.push({ x, y, z: Math.max(0.14, z), t });

      const horiz = Math.hypot(x, y);
      const curPhi = Math.atan2(x, Math.max(1, y));

      if (!isCage && fair && !isHr && !wallHit && Math.abs(curPhi) <= 0.785) {
        const wDist = st.wallDist(curPhi);
        const wH = st.wallHeight(curPhi);
        if (horiz >= wDist) {
          if (z > wH) {
            isHr = true;
            fenceClearTime = t;
          } else {
            wallHit = true;
            wallHitTime = t;
            if (carryDist === null) carryDist = Math.round(horiz);
            const nx = -x / Math.max(1, horiz);
            const ny = -y / Math.max(1, horiz);
            const vn = vx * nx + vy * ny;
            if (vn < 0) {
              vx -= 1.48 * vn * nx;
              vy -= 1.48 * vn * ny;
            }
            vx *= 0.82;
            vy *= 0.82;
            vz = Math.max(2, vz * 0.52);
          }
        }
      }

      // Physical stadium grandstand/bleacher collision — ONLY where an actual physical deck/stand exists!
      if (!isCage && isHr && Math.abs(curPhi) <= 0.785) {
        const curWall = st.wallDist(clamp(curPhi, -0.785, 0.785));
        const pastWall = Math.max(0, horiz - curWall);
        const seatInfo = getParkStructureSurface(st, curPhi, pastWall);
        if (seatInfo && z <= seatInfo.floorZ && z >= seatInfo.floorZ - 4.2 && vz < 0) {
          z = seatInfo.floorZ;
          if (hangTime === null) hangTime = t;
          if (carryDist === null) carryDist = Math.round(horiz);
          if (seatHitTime === null) {
            seatHitTime = t;
            seatSoundType = seatInfo.isSeat ? 'seat' : 'concrete';
            if (seatInfo.isUpper) hitUpperDeck = true;
            if (seatInfo.isSecondDeck) hitSecondDeck = true;
          } else if (seatBounce2Time === null && t - seatHitTime > 0.16) {
            seatBounce2Time = t;
          }
          seatBounces++;
          if (Math.abs(vz) > 5.0 && seatBounces < 3) {
            vz = Math.abs(vz) * 0.42;
            vx *= 0.56;
            vy *= 0.56;
            z += 0.25;
            points.push({ x, y, z, t });
          } else {
            points.push({ x, y, z, t });
            break;
          }
        }
      }

      // Realistic ground bounce & roll (never stops bouncing early due to arbitrary point limit!)
      if (z <= 0.14 && vz < 0) {
        if (hangTime === null) hangTime = t;
        if (carryDist === null) carryDist = Math.round(horiz);
        if (Math.abs(vz) > 2.2) {
          z = 0.16;
          groundBounces++;
          const onDirt = horiz < 135;
          const eVert = onDirt ? 0.5 : 0.38;
          vz = Math.abs(vz) * eVert;
          const spinKick = backspinRpm < -200 ? 1.03 : backspinRpm > 1600 ? 0.76 : 0.88;
          vx *= (onDirt ? 0.86 : 0.78) * spinKick;
          vy *= (onDirt ? 0.86 : 0.78) * spinKick;
          wx *= 0.38;
          wz *= 0.42;
        } else {
          z = 0.14;
          vz = 0;
        }
      }
    }

    const last = points[points.length - 1];
    const outdoorProj = isCage
      ? simulateOutdoorProjectionRK4({
          stadium: outdoorFallbackSt,
          wind,
          exitVelo,
          launchDeg,
          sprayDeg,
          backspinRpm,
          sidespinRpm,
          startPos
        })
      : null;

    const finalDist = outdoorProj ? outdoorProj.dist : Math.round(Math.hypot(last.x, last.y));
    const finalCarry = outdoorProj ? outdoorProj.carryDist : carryDist != null ? carryDist : finalDist;
    const finalApex = outdoorProj ? Math.max(Math.round(apex), outdoorProj.apex) : Math.round(apex);
    const finalHang = outdoorProj ? outdoorProj.hangTime : Number((hangTime != null ? hangTime : t).toFixed(2));
    const reportIsHr = fair && (outdoorProj ? outdoorProj.isHr : isHr);
    const reportWallHit = fair && (outdoorProj ? outdoorProj.wallHit : wallHit);
    const reportEndX = outdoorProj ? outdoorProj.endX : last.x;
    const reportEndY = outdoorProj ? outdoorProj.endY : last.y;

    let windCarryDeltaFt = 0;
    if (Math.hypot(wind.vx || 0, wind.vy || 0) > 0.5 && !isCage) {
      let cx = startPos.x || 0;
      let cy = startPos.y != null ? startPos.y : 1.4;
      let cz = Math.max(1.2, startPos.z != null ? startPos.z : 2.65);
      let cvx = v0 * Math.cos(theta) * Math.sin(phi);
      let cvy = v0 * Math.cos(theta) * Math.cos(phi);
      let cvz = v0 * Math.sin(theta);
      let cwx = (backspinRpm * 2 * Math.PI) / 60;
      let cwz = -(sidespinRpm * 2 * Math.PI) / 60;
      const cDt = 1 / 60;
      for (let s = 0; s < 420; s++) {
        const csp = Math.hypot(cvx, cvy, cvz);
        if (csp < 0.5) break;
        const spinM = Math.hypot(cwx, cwz);
        const sFac = (0.12 * spinM) / csp;
        const cCd = 0.326 + 0.148 * Math.min(0.48, sFac);
        const cCl = sFac > 0.004 ? 0.94 / (2.36 + 0.42 / sFac) : 0;
        const cDr = K * cCd * csp;
        const cMg = spinM > 0.1 ? (K * cCl * csp) / spinM : 0;
        cvx += (-cDr * cvx + cMg * (-cwz * cvy)) * cDt;
        cvy += (-cDr * cvy + cMg * (cwz * cvx - cwx * cvz)) * cDt;
        cvz += (-32.174 - cDr * cvz + cMg * (cwx * cvy)) * cDt;
        cx += cvx * cDt;
        cy += cvy * cDt;
        cz += cvz * cDt;
        cwx *= 1 - 0.06 * cDt;
        cwz *= 1 - 0.06 * cDt;
        if (cz <= 0.14 && cvz < 0) break;
      }
      const calmCarry = Math.round(Math.hypot(cx, cy));
      windCarryDeltaFt = Math.round((carryDist != null ? carryDist : finalCarry) - calmCarry);
    }

    let xbaNum = 0.08;
    if (fair) {
      if (reportIsHr) xbaNum = 0.99;
      else if (launchDeg >= 10 && launchDeg <= 28 && exitVelo >= 94) xbaNum = 0.68 + Math.min(0.27, (exitVelo - 94) * 0.025);
      else if (launchDeg >= 8 && launchDeg <= 22 && exitVelo >= 85) xbaNum = 0.44 + (exitVelo - 85) * 0.02;
      else if (launchDeg < 6 && exitVelo >= 95) xbaNum = 0.38;
      else if (launchDeg > 40) xbaNum = 0.06;
      else xbaNum = 0.21;
    }
    const xba = fair ? '.' + String(Math.round(clamp(xbaNum, 0.01, 0.999) * 1000)).padStart(3, '0') : '.000';

    let outcome = 'Out';
    let color = '#94a3b8';
    const hasUpperDeck = ['fenway', 'petco', 'coors', 'oracle', 'wrigley', 'yankee'].includes(st.id);
    const endPhi = Math.atan2(reportEndX, Math.max(1, reportEndY));
    if (!fair) {
      outcome = 'Foul Ball';
      color = '#fbbf24';
    } else if (reportIsHr) {
      if (st.id === 'oracle' && endPhi >= 0.35) {
        outcome = 'SPLASH HIT!';
        color = '#38bdf8';
      } else if ((st.id === 'fenway' || st.id === 'vandy') && endPhi <= -0.25 && finalDist >= 340) {
        outcome = 'MONSTER BOMB!';
        color = '#38bdf8';
      } else if (hitUpperDeck || (hasUpperDeck && finalCarry >= 435 && apex >= 72 && !reportWallHit)) {
        outcome = 'UPPER DECK BOMB!';
        color = '#38bdf8';
      } else if (hitSecondDeck || (finalCarry >= 430 && !reportWallHit)) {
        outcome = hasUpperDeck ? 'SECOND DECK!' : 'NO-DOUBT BOMB!';
        color = '#38bdf8';
      } else {
        outcome = 'HOME RUN!';
        color = '#38bdf8';
      }
    } else if (reportWallHit) {
      outcome = 'DOUBLE OFF WALL!';
      color = '#22c55e';
    } else if (launchDeg < 8) {
      outcome = exitVelo >= 94 ? 'Hard Single!' : 'Ground Out';
      color = exitVelo >= 94 ? '#22c55e' : '#fbbf24';
    } else if (launchDeg <= 22 && exitVelo >= 90) {
      outcome = finalDist >= 255 ? 'Gap Double!' : 'Line Drive Single!';
      color = '#22c55e';
    } else if (launchDeg > 42 && finalDist < 220) {
      outcome = 'Infield Pop-Up';
      color = '#f87171';
    } else {
      outcome = finalDist >= 325 ? 'Deep Warning-Track Fly' : 'Fly Out';
      color = '#fbbf24';
    }

    const revealTime = isCage
      ? Math.max(0.55, netHitTime != null ? netHitTime : Math.min(t, 0.9))
      : !fair
        ? Math.min(t, Math.max(0.75, hangTime != null ? hangTime : 1.15))
        : reportIsHr
          ? Math.max(0.9, seatHitTime != null ? seatHitTime : fenceClearTime != null ? fenceClearTime + 0.25 : t * 0.85)
          : reportWallHit
            ? Math.max(0.9, wallHitTime != null ? wallHitTime + 0.15 : t * 0.8)
            : Math.max(0.75, hangTime != null ? hangTime : t * 0.85);

    return {
      points,
      dist: finalDist,
      carryDist: finalCarry,
      windCarryDeltaFt,
      apex: finalApex,
      apexTime,
      apexPos,
      hangTime: finalHang,
      xba,
      exitVelo: Number(exitVelo.toFixed(1)),
      launchAngle: Math.round(launchDeg),
      sprayDeg: Math.round(sprayDeg),
      backspinRpm: Math.round(backspinRpm),
      sidespinRpm: Math.round(sidespinRpm),
      outcome,
      isHr: reportIsHr,
      wallHit: reportWallHit,
      wallHitTime,
      wallThudPlayed: false,
      netHitTime,
      netThudPlayed: false,
      netHit2Time,
      net2Played: false,
      seatHitTime,
      seatBounce2Time,
      seatSoundType,
      seatSoundPlayed: false,
      seatBounce2Played: false,
      groundBounces,
      fair,
      color,
      endX: reportEndX,
      endY: reportEndY,
      revealTime,
      telemetryRevealed: false,
      totalTime: t
    };
  }

  // True 120Hz RK4 Pitched Baseball Aerodynamics (Pitcher Mound RHP/LHP or Dual-Wheel Machine + Real Stadium Wind)
  function simulatePitchRK4(params) {
    const mph = params.mph || 90;
    const spec = params.spec || { magX: 7.0, magY: 16.5, hbIn: 11, spinAxisDeg: 25, spinAxisClock: '1:00' };
    const endX = params.endX || 0;
    const endY = params.endY || 0;
    const isDemo = Boolean(params.isDemo);
    const hand = params.hand || 'R';
    const deliveryMode = params.deliveryMode || 'pitcher';
    const airDensity = params.airDensity || 1.0;
    const wind = isDemo || !params.wind ? { vx: 0, vy: 0 } : params.wind;

    const isMachine = deliveryMode === 'machine';
    const pSign = hand === 'L' ? -1 : 1;
    const speedFtS = mph * 1.46667;
    const targetX = endX * 0.88;
    const targetY = 2.65 - endY * 1.0;

    const magX = isDemo ? 0 : isMachine ? spec.magX * pSign * 0.52 : spec.magX * pSign;
    const magY = isDemo ? 16.5 : spec.magY;

    const startX = isMachine ? 0 : 0.88 * pSign;
    const startY = isMachine ? 3.85 : 6.12;
    const startZ = isMachine ? -54.5 : -55.0; // ft from home plate

    // Solve release aim under calm air, then integrate final trajectory WITH active stadium wind so cross/head/tail winds genuinely move the pitch!
    const Kdrag = 0.00535 * 0.34 * airDensity;
    const flightTimeEst = isDemo ? 0.68 : clamp(57.2 / speedFtS, 0.44, 0.78);
    let vx0 = (targetX - startX - 0.5 * magX * flightTimeEst * flightTimeEst) / flightTimeEst;
    let vy0 = (targetY - startY - 0.5 * (-32.174 + magY) * flightTimeEst * flightTimeEst) / flightTimeEst;
    let vz0 = (0 - startZ) / flightTimeEst + 0.5 * Kdrag * speedFtS * (0 - startZ);

    function integrate(ivx, ivy, ivz, dt, maxZ, windVx, windVy) {
      let x = startX;
      let y = startY;
      let z = startZ;
      let vx = ivx;
      let vy = ivy;
      let vz = ivz;
      let t = 0;
      const pts = [{ x, y, z, t: 0 }];
      // In 3D world, pitch travels +Z toward home plate; +wind.vy points out toward CF (-Z world)
      const deriv = (cvx, cvy, cvz) => {
        const rvx = cvx - windVx;
        const rvy = cvy;
        const rvz = cvz + windVy;
        const sp = Math.hypot(rvx, rvy, rvz);
        const drag = Kdrag * sp;
        return {
          ax: -drag * rvx + magX,
          ay: -drag * rvy - 32.174 + magY,
          az: -drag * rvz
        };
      };
      let plateVz = vz;
      let plateVy = vy;
      let plateT = flightTimeEst;
      let plateX;
      let plateY;
      for (let i = 0; i < 180; i++) {
        const k1 = deriv(vx, vy, vz);
        const k2 = deriv(vx + 0.5 * dt * k1.ax, vy + 0.5 * dt * k1.ay, vz + 0.5 * dt * k1.az);
        const k3 = deriv(vx + 0.5 * dt * k2.ax, vy + 0.5 * dt * k2.ay, vz + 0.5 * dt * k2.az);
        const k4 = deriv(vx + dt * k3.ax, vy + dt * k3.ay, vz + dt * k3.az);
        const prevZ = z;
        const prevX = x;
        const prevY = y;
        vx += (dt / 6) * (k1.ax + 2 * k2.ax + 2 * k3.ax + k4.ax);
        vy += (dt / 6) * (k1.ay + 2 * k2.ay + 2 * k3.ay + k4.ay);
        vz += (dt / 6) * (k1.az + 2 * k2.az + 2 * k3.az + k4.az);
        x += vx * dt;
        y += vy * dt;
        z += vz * dt;
        t += dt;
        if (prevZ < 0 && z >= 0) {
          const frac = (0 - prevZ) / Math.max(0.001, z - prevZ);
          plateT = t - dt + frac * dt;
          plateVy = vy;
          plateVz = vz;
          plateX = prevX + (x - prevX) * frac;
          plateY = prevY + (y - prevY) * frac;
        }
        pts.push({ x, y: Math.max(0.32, y), z, t });
        if (z >= maxZ) break;
      }
      return { pts, plateT, plateX: typeof plateX === 'number' ? plateX : x, plateY: typeof plateY === 'number' ? plateY : y, plateVy, plateVz };
    }

    const dt = 1 / 120;
    for (let iter = 0; iter < 2; iter++) {
      const probe = integrate(vx0, vy0, vz0, dt, 0.2, 0, 0);
      const errX = targetX - probe.plateX;
      const errY = targetY - probe.plateY;
      vx0 += errX / Math.max(0.25, probe.plateT);
      vy0 += errY / Math.max(0.25, probe.plateT);
    }

    // Apply amplified crosswind drift (~1.5x subtle aerodynamic curve amplification so 12 mph winds are palpably felt at plate without wild misses)
    const windVx = (wind.vx || 0) * 1.45;
    const windVy = (wind.vy || 0) * 1.25;
    const finalRun = integrate(vx0, vy0, vz0, dt, 3.4, windVx, windVy);
    const dur = finalRun.plateT;

    const samples = [];
    const steps = 60;
    const pts = finalRun.pts;
    for (let i = 0; i <= steps; i++) {
      const targetT = (i / steps) * 1.06 * dur;
      let idx = 0;
      while (idx + 1 < pts.length && pts[idx + 1].t < targetT) idx++;
      const a = pts[idx];
      const b = pts[Math.min(pts.length - 1, idx + 1)];
      const span = Math.max(0.0001, b.t - a.t);
      const f = clamp((targetT - a.t) / span, 0, 1);
      samples.push({
        x: a.x + (b.x - a.x) * f,
        y: Math.max(0.32, a.y + (b.y - a.y) * f),
        z: a.z + (b.z - a.z) * f
      });
    }

    const plateEndX = clamp(finalRun.plateX / 0.88, -1.5, 1.5);
    const plateEndY = clamp(2.65 - finalRun.plateY, -1.5, 1.5);

    return {
      dur,
      samples,
      targetX: finalRun.plateX,
      targetY: finalRun.plateY,
      plateEndX,
      plateEndY,
      windDriftInX: Number(((finalRun.plateX - targetX) * 12).toFixed(1)),
      windDriftInY: Number(((finalRun.plateY - targetY) * 12).toFixed(1)),
      hbIn: Number((spec.hbIn * pSign * (isMachine ? 0.52 : 1)).toFixed(1)),
      spinAxisDeg: pSign === 1 ? spec.spinAxisDeg : (360 - spec.spinAxisDeg) % 360,
      spinAxisClock: pSign === 1 ? spec.spinAxisClock : mirrorClockLabel(spec.spinAxisClock),
      descendDeg: Math.atan2(finalRun.plateVy, finalRun.plateVz) * (180 / Math.PI)
    };
  }

  // Authentic Physical Multi-Mode Bat Impact Acoustics (All 16 Wood, Composite & Alloy BBCOR Bats + 4 Contact Zones)
  function synthesizeBatImpactSamples(kind, contactZone, sr) {
    const zone = contactZone === 'jam' || contactZone === 'endcap' || contactZone === 'glance' ? contactZone : 'sweet';
    const isJam = zone === 'jam';
    const isEndcap = zone === 'endcap';
    const isGlance = zone === 'glance';

    const isBaum = kind === 'baum-gold';
    const isVictusWood = kind === 'victus-v243';
    const isLsC271 = kind === 'ls-c271';
    const isOldHickory = kind === 'old-hickory-j143';
    const isWood = isBaum || isVictusWood || isLsC271 || isOldHickory || kind === 'wood';

    const isGoods22 = kind === 'goods-2022' || kind === 'hybrid';
    const isGoods26 = kind === 'goods-2026';
    const isBonesaber = kind === 'warstic-bonesaber';
    const isCombatRodeo = kind === 'combat-rodeo';
    const isCombatBlue = kind === 'combat-blue';
    const isCatx2 = kind === 'marucci-catx2';
    const isVoodoo = kind === 'voodoo-one';
    const isAtlas = kind === 'ls-atlas';
    const isMetal2 = kind === 'stringking-metal2';
    const isVandal = kind === 'victus-vandal';
    const isRawlingsIcon = kind === 'rawlings-icon';
    const isEastonHype = kind === 'easton-hype';
    const isComposite = isRawlingsIcon || isEastonHype;
    const isOnePc = !isWood && !isComposite && !isGoods26 && !isGoods22 && !isBonesaber;

    const baseDur = isOldHickory
      ? 0.062
      : isWood
        ? 0.068
        : isRawlingsIcon
          ? 0.088
          : isEastonHype
            ? 0.095
            : isVandal
              ? 0.165
              : isGoods22
                ? 0.27
                : isMetal2
                  ? 0.28
                  : isVoodoo
                    ? 0.25
                    : isCatx2
                      ? 0.25
                      : isAtlas
                        ? 0.24
                        : isCombatBlue
                          ? 0.23
                          : isCombatRodeo
                            ? 0.24
                            : isBonesaber
                              ? 0.25
                              : isGoods26
                                ? 0.22
                                : 0.22;
    const durSec = isGlance ? 0.032 : isJam ? (isWood ? 0.052 : isComposite ? 0.064 : 0.08) : baseDur;
    const len = Math.floor(sr * durSec);
    const ch = new Float32Array(len);
    const zoneSeed = isGlance ? 401 : isEndcap ? 271 : isJam ? 99 : 42;
    const rnd = makeSeededRand(kind.length * 9137 + zoneSeed + (kind.charCodeAt(0) || 1) * 17 + (kind.charCodeAt(kind.length - 1) || 3) * 31);

    const fScale = isEndcap ? 1.16 : isJam ? 0.82 : 1.0;

    // Hoisted Cascaded Acoustic Filters (preserving full IIR delay memory across samples!)
    const bpPop = makeBiquadBP(
      isJam
        ? 138
        : isEndcap
          ? 525
          : isGlance
            ? 2350
            : isRawlingsIcon
              ? 305
              : isEastonHype
                ? 545
                : isVandal
                  ? 685
                  : isBaum
                    ? 485
                    : isOldHickory
                      ? 345
                      : isWood
                        ? 405
                        : 330,
      isComposite ? 2.85 : isBaum ? 2.75 : isVandal ? 2.4 : isWood ? 1.95 : 1.38,
      sr
    );
    const bpWoodSnap = makeBiquadBP(
      isJam
        ? 435
        : isEndcap
          ? 2220
          : isGlance
            ? 4950
            : isRawlingsIcon
              ? 1360
              : isEastonHype
                ? 1980
                : isVandal
                  ? 1760
                  : isBaum
                    ? 1880
                    : isOldHickory
                      ? 2160
                      : isVictusWood
                        ? 1740
                        : isLsC271
                          ? 2020
                          : 1620,
      isComposite ? 1.15 : 0.96,
      sr
    );
    const bpCrackHi = makeBiquadBP(
      isJam
        ? 980
        : isEndcap
          ? 4550
          : isGlance
            ? 7150
            : isRawlingsIcon
              ? 2900
              : isEastonHype
                ? 3920
                : isBaum
                  ? 3820
                  : isOldHickory
                    ? 4150
                    : isWood
                      ? 3550
                      : 4180,
      0.84,
      sr
    );

    const bpBaumCavity = makeBiquadBP(485 * fScale, 3.2, sr);
    const bpVandalCarbonCap = makeBiquadBP(720 * fScale, 3.0, sr);

    const alloyCenterFreq = isMetal2
      ? 3080
      : isVoodoo
        ? 2940
        : isBonesaber
          ? 2860
          : isGoods26
            ? 2820
            : isAtlas
              ? 2780
              : isCombatBlue
                ? 2720
                : isCatx2
                  ? 2660
                  : isCombatRodeo
                    ? 2560
                    : isVandal
                      ? 2410
                      : isGoods22
                        ? 2310
                        : 2530;

    const bpAlloyTransient = makeBiquadBP(alloyCenterFreq * fScale, isMetal2 ? 5.2 : 4.6, sr);
    const bpAlloyBell = makeBiquadBP(alloyCenterFreq * (isMetal2 ? 1.392 : 1.42) * fScale, 3.8, sr);
    const lpAir = makeBiquadLP(isJam ? 1480 : isGlance ? 9600 : isWood || isComposite ? 6700 : 9500, 0.72, sr);

    let p0 = 0;
    let p1 = 0;
    let p2 = 0;
    let p3 = 0;
    const twopiOverSr = (2 * Math.PI) / sr;

    for (let i = 0; i < len; i++) {
      const t = i / sr;

      // 1. Sub-millisecond ball-on-barrel compression impulse
      let impulse = 0;
      const impAmp = isGlance
        ? 0.36
        : isJam
          ? 0.56
          : isEndcap
            ? 0.88
            : isBaum
              ? 1.78
              : isOldHickory
                ? 1.66
                : isWood
                  ? 1.56
                  : isComposite
                    ? 1.48
                    : 1.04;
      if (t < 0.00032) {
        impulse = Math.sin((t / 0.00032) * Math.PI) * impAmp;
      } else if (t < 0.0008) {
        impulse = -Math.sin(((t - 0.00032) / 0.00048) * Math.PI) * (impAmp * 0.38);
      }

      // 2. Percussive broadband cowhide leather & grain crack transient
      const raw = rnd();
      const raw2 = rnd();
      const popBody =
        bpPop(raw) *
        Math.exp(
          -t *
            (isGlance
              ? 390
              : isJam
                ? 122
                : isRawlingsIcon
                  ? 84
                  : isEastonHype
                    ? 92
                    : isBaum
                      ? 90
                      : isOldHickory
                        ? 122
                        : isWood
                          ? 112
                          : 162)
        );
      const midCrack =
        bpWoodSnap(raw) *
        Math.exp(-t * (isGlance ? 345 : isJam ? 150 : isComposite ? 172 : isBaum ? 182 : isOldHickory ? 205 : isWood ? 195 : 225));
      const hiCrack = bpCrackHi(raw2) * Math.exp(-t * (isGlance ? 265 : isJam ? 195 : isWood || isComposite ? 290 : 315));
      const airTail = lpAir(raw) * Math.exp(-t * (isGlance ? 460 : isJam ? 165 : isWood || isComposite ? 305 : 340)) * 0.3;

      const alloyNoiseExc =
        !isWood && !isComposite && !isGlance && !isJam
          ? bpAlloyTransient(raw) * Math.exp(-t * (isCatx2 ? 31 : isMetal2 ? 29 : 39)) * 0.94 +
            bpAlloyBell(raw2) * Math.exp(-t * (isCatx2 ? 46 : isMetal2 ? 42 : 60)) * 0.56
          : 0;

      let sample = 0;
      if (isGlance) {
        // FOUL GLANCE: Crisp 2-stage razor edge nick + high-frequency cowhide seam zip (<32ms, zero whistle)
        const seamCatch = t >= 0.0014 && t < 0.0022 ? Math.sin(((t - 0.0014) / 0.0008) * Math.PI) * 0.48 : 0;
        const seamZip = bpCrackHi(raw) * Math.exp(-t * 210) * 2.25;
        const edgeClick = bpWoodSnap(raw2) * Math.exp(-t * 360) * 1.48;
        sample = impulse * 0.65 + edgeClick + seamZip + airTail * 0.95 + seamCatch;
      } else if (isJam) {
        // INSIDE JAM: Heavy choked handle sting thud + broadband flex rattle
        const handleDisp = Math.exp(-t * 260);
        const fThump = 132 * (1 + 0.3 * handleDisp);
        p0 += fThump * twopiOverSr;
        const chokedBody = Math.sin(p0) * Math.exp(-t * 94) * 0.46;
        const rattleNoise = bpPop(raw) * Math.exp(-t * 88) * 2.3 + bpWoodSnap(raw2) * Math.exp(-t * 145) * 0.85;
        const stingPulse = t >= 0.0045 && t <= 0.011 ? bpWoodSnap(raw) * 0.68 : 0;
        sample = impulse * 0.62 + rattleNoise + chokedBody + stingPulse + airTail * 0.35;
      } else if (isComposite) {
        // 2-PIECE CARBON COMPOSITE BBCOR: Zero metal ping! Rich carbon shell resonance + hot inner trampoline whack/thud
        const shellFreq = isRawlingsIcon ? 310 : 540;
        const chirpComp = 1 + 0.18 * Math.exp(-t * 360);
        p0 += shellFreq * fScale * chirpComp * twopiOverSr;
        p1 += shellFreq * 0.5 * fScale * twopiOverSr;
        const decComp = isRawlingsIcon ? 92 : 104;
        const shellRes =
          Math.sin(p0) * Math.exp(-t * decComp) * (isRawlingsIcon ? 0.52 : 0.48) +
          Math.sin(p1) * Math.exp(-t * (decComp * 0.88)) * (isRawlingsIcon ? 0.38 : 0.24);
        const compBodyGain = isRawlingsIcon ? 2.65 : 2.35;
        const compCrackGain = isEastonHype ? 3.15 : 2.45;
        sample = impulse * 1.25 + popBody * compBodyGain + midCrack * compCrackGain + hiCrack * (isEastonHype ? 2.45 : 1.7) + airTail + shellRes;
      } else if (isWood) {
        if (isEndcap) {
          const capWoodPop = bpPop(raw2) * Math.exp(-t * 145) * 1.55;
          sample = impulse + capWoodPop + midCrack * 2.45 + hiCrack * 2.25 + airTail;
        } else if (isBaum) {
          // BAUM BAT GOLD: Signature punchy PermaWood barrel "POP" + crisp maple crack (hoisted biquad!)
          p0 += 485 * (1 + 0.22 * Math.exp(-t * 420)) * twopiOverSr;
          p1 += 242 * twopiOverSr;
          const barrelPop =
            Math.sin(p0) * Math.exp(-t * 132) * 0.54 +
            Math.sin(p1) * Math.exp(-t * 106) * 0.36 +
            bpBaumCavity(raw) * Math.exp(-t * 86) * 1.25;
          sample = impulse * 1.32 + popBody * 2.65 + midCrack * 2.85 + hiCrack * 2.45 + airTail + barrelPop;
        } else if (isOldHickory) {
          // OLD HICKORY J143M: Dense heavy-wall hard-maple shotgun crack
          p0 += 322 * (1 + 0.14 * Math.exp(-t * 390)) * twopiOverSr;
          p1 += 645 * twopiOverSr;
          const dryCrack = Math.sin(p0) * Math.exp(-t * 142) * 0.42 + Math.sin(p1) * Math.exp(-t * 185) * 0.22;
          sample = impulse * 1.3 + popBody * 1.9 + midCrack * 3.35 + hiCrack * 2.85 + airTail + dryCrack;
        } else {
          // VICTUS V243 & LS PRIME C271: Dense solid pro maple shotgun crack
          p0 += (isVictusWood ? 340 : 395) * (1 + 0.16 * Math.exp(-t * 380)) * twopiOverSr;
          const mapleThud = Math.sin(p0) * Math.exp(-t * 135) * 0.38;
          sample = impulse * 1.22 + popBody * 2.05 + midCrack * 3.1 + hiCrack * 2.65 + airTail + mapleThud;
        }
      } else {
        // METALLIC BBCOR ALLOYS & HYBRIDS: Multi-mode barrel ovaling ping + crisp cowhide crack
        const fBase = alloyCenterFreq;
        const splitHz = isMetal2
          ? 19
          : isCatx2
            ? 21
            : isBonesaber
              ? 26
              : isGoods22
                ? 29
                : isCombatRodeo
                  ? 33
                  : isAtlas
                    ? 35
                    : isGoods26
                      ? 37
                      : isCombatBlue
                        ? 38
                        : isVoodoo
                          ? 39
                          : isVandal
                            ? 44
                            : 33;
        const overRatio = isMetal2
          ? 1.392
          : isVoodoo
            ? 1.408
            : isGoods26
              ? 1.418
              : isAtlas
                ? 1.422
                : isCombatBlue
                  ? 1.428
                  : isBonesaber
                    ? 1.435
                    : isCatx2
                      ? 1.442
                      : isCombatRodeo
                        ? 1.452
                        : isVandal
                          ? 1.468
                          : isGoods22
                            ? 1.485
                            : 1.432;
        const thirdRatio = isMetal2
          ? 1.815
          : isVoodoo
            ? 1.835
            : isGoods26
              ? 1.845
              : isAtlas
                ? 1.855
                : isBonesaber
                  ? 1.868
                  : isCatx2
                    ? 1.88
                    : isVandal
                      ? 1.92
                      : 1.91;
        const chirp = 1 + (isMetal2 ? 0.058 : 0.05) * Math.exp(-t * 450);

        p0 += fBase * fScale * chirp * twopiOverSr;
        p1 += (fBase * fScale + splitHz) * chirp * twopiOverSr;
        p2 += fBase * overRatio * fScale * chirp * twopiOverSr;
        p3 += fBase * thirdRatio * fScale * chirp * twopiOverSr;

        const envAttack = 1 - Math.exp(-t * 3100);
        const decMain = isMetal2
          ? 13.8
          : isCatx2
            ? 14.8
            : isBonesaber
              ? 16.4
              : isGoods22
                ? 15.8
                : isVoodoo
                  ? 17.4
                  : isAtlas
                    ? 18.2
                    : isCombatRodeo
                      ? 18.9
                      : isCombatBlue
                        ? 18.4
                        : isGoods26
                          ? 20.4
                          : isVandal
                            ? 24.5
                            : 18.8;
        const ampScale = isEndcap ? 1.12 : isMetal2 ? 1.1 : isCatx2 ? 1.09 : 1.05;

        const ovalPrimary =
          Math.sin(p0) * Math.exp(-t * decMain) * (isVandal ? 0.36 : 0.46) +
          Math.sin(p1) * Math.exp(-t * (decMain * 1.06)) * (isVandal ? 0.28 : 0.38);
        const hoopHarmonic =
          Math.sin(p2) * Math.exp(-t * (decMain * 1.45)) * 0.28 +
          Math.sin(p3) * Math.exp(-t * (decMain * 2.1)) * 0.16;

        const shellThump =
          Math.sin(2 * Math.PI * (isVandal ? 1180 : isOnePc ? 1680 : 1920) * fScale * t) *
          Math.exp(-t * (isVandal ? 64 : 46)) *
          (isVandal ? 0.34 : isOnePc ? 0.2 : 0.14);
        const vandalCapKnock = isVandal ? bpVandalCarbonCap(raw) * Math.exp(-t * 105) * 1.35 : 0;
        const alloyPing = envAttack * ampScale * (ovalPrimary + hoopHarmonic + shellThump + alloyNoiseExc + vandalCapKnock);
        const crackMix =
          impulse * 0.96 +
          popBody * (isVandal ? 1.72 : isOnePc ? 1.38 : 1.12) +
          midCrack * (isVandal ? 2.15 : 1.78) +
          hiCrack * 1.85 +
          airTail;
        sample = crackMix * 0.64 + alloyPing;
      }

      ch[i] = sample;
    }

    let peak = 0;
    for (let i = 0; i < len; i++) {
      const a = Math.abs(ch[i]);
      if (a > peak) peak = a;
    }
    const targetPeak = isGlance ? 0.64 : isJam ? 0.78 : isEndcap ? 0.88 : 0.95;
    const norm = peak > 0 ? targetPeak / peak : 1;
    for (let i = 0; i < len; i++) {
      ch[i] *= norm;
    }
    return ch;
  }

  return {
    WIND_PRESETS,
    classifyContactZone,
    getParkStructureSurface,
    mirrorClockLabel,
    computeSwingKinematics,
    simulateOutdoorProjectionRK4,
    simulateBattedBallRK4,
    simulatePitchRK4,
    synthesizeBatImpactSamples
  };
});
