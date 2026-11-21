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
    cross8: { label: '8 mph L->R Cross', vx: 11.73, vy: 2.0 }
  };

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
    const id = st.id || 'omaha';
    if (id === 'cage') return null;

    // 1. Outfield physical stands / batter's eye per specific ballpark (|phi| <= 0.785)
    let tiers = [];
    if (id === 'fenway') {
      tiers = [
        // Monster seats atop 37-ft wall (LF)
        { startPhi: -0.78, endPhi: -0.25, dOff: 6, dSpan: 22, y0: 38.5, y1: 43.0, steps: 4, isSeat: true },
        // Center/RF bleachers
        { startPhi: -0.23, endPhi: 0.78, dOff: 12, dSpan: 56, y0: 9.0, y1: 32.0, steps: 8, isSeat: true }
      ];
    } else if (id === 'dodger') {
      tiers = [
        { startPhi: -0.78, endPhi: -0.21, dOff: 12, dSpan: 52, y0: 11.0, y1: 34.0, steps: 8, isSeat: true },
        { startPhi: -0.19, endPhi: 0.19, dOff: 10, dSpan: 24, y0: 26.0, y1: 30.0, steps: 2, isSeat: false },
        { startPhi: 0.21, endPhi: 0.78, dOff: 12, dSpan: 52, y0: 11.0, y1: 34.0, steps: 8, isSeat: true }
      ];
    } else if (id === 'oracle') {
      tiers = [
        { startPhi: -0.78, endPhi: -0.06, dOff: 12, dSpan: 54, y0: 10.0, y1: 33.0, steps: 8, isSeat: true },
        { startPhi: -0.05, endPhi: 0.34, dOff: 10, dSpan: 20, y0: 20.0, y1: 24.0, steps: 2, isSeat: false }
        // phi > 0.34 is McCovey Cove water -> null!
      ];
    } else if (id === 'wrigley') {
      tiers = [
        { startPhi: -0.78, endPhi: -0.14, dOff: 10, dSpan: 44, y0: 12.0, y1: 30.0, steps: 7, isSeat: true },
        { startPhi: -0.13, endPhi: 0.13, dOff: 10, dSpan: 28, y0: 22.0, y1: 28.0, steps: 3, isSeat: false },
        { startPhi: 0.14, endPhi: 0.78, dOff: 10, dSpan: 44, y0: 12.0, y1: 30.0, steps: 7, isSeat: true }
      ];
    } else if (id === 'yankee') {
      tiers = [
        { startPhi: -0.78, endPhi: -0.19, dOff: 12, dSpan: 54, y0: 9.5, y1: 33.0, steps: 8, isSeat: true },
        { startPhi: -0.18, endPhi: 0.18, dOff: 8, dSpan: 34, y0: 14.0, y1: 24.0, steps: 3, isSeat: false },
        { startPhi: -0.16, endPhi: 0.16, dOff: 42, dSpan: 26, y0: 32.0, y1: 36.0, steps: 2, isSeat: false },
        { startPhi: 0.19, endPhi: 0.78, dOff: 12, dSpan: 54, y0: 9.5, y1: 33.0, steps: 8, isSeat: true }
      ];
    } else if (id === 'omaha') {
      tiers = [
        { startPhi: -0.78, endPhi: -0.22, dOff: 12, dSpan: 46, y0: 9.0, y1: 27.0, steps: 7, isSeat: true },
        { startPhi: -0.18, endPhi: 0.18, dOff: 14, dSpan: 22, y0: 24.0, y1: 27.0, steps: 2, isSeat: false },
        { startPhi: 0.22, endPhi: 0.78, dOff: 12, dSpan: 46, y0: 9.0, y1: 27.0, steps: 7, isSeat: true }
      ];
    } else if (id === 'lsu') {
      tiers = [
        { startPhi: -0.78, endPhi: -0.20, dOff: 12, dSpan: 44, y0: 10.0, y1: 28.0, steps: 7, isSeat: true },
        { startPhi: -0.17, endPhi: 0.17, dOff: 12, dSpan: 20, y0: 24.0, y1: 27.0, steps: 2, isSeat: false },
        { startPhi: 0.20, endPhi: 0.78, dOff: 12, dSpan: 44, y0: 10.0, y1: 28.0, steps: 7, isSeat: true }
      ];
    } else if (id === 'missst') {
      tiers = [
        { startPhi: -0.78, endPhi: -0.18, dOff: 10, dSpan: 42, y0: 12.0, y1: 29.0, steps: 6, isSeat: true },
        { startPhi: -0.16, endPhi: 0.16, dOff: 12, dSpan: 20, y0: 23.0, y1: 26.0, steps: 2, isSeat: false },
        { startPhi: 0.18, endPhi: 0.78, dOff: 10, dSpan: 42, y0: 10.0, y1: 27.0, steps: 6, isSeat: true }
      ];
    } else if (id === 'vandy') {
      tiers = [
        { startPhi: -0.78, endPhi: -0.25, dOff: 6, dSpan: 22, y0: 36.0, y1: 41.0, steps: 4, isSeat: true },
        { startPhi: -0.18, endPhi: 0.18, dOff: 12, dSpan: 18, y0: 23.0, y1: 26.0, steps: 2, isSeat: false },
        { startPhi: 0.22, endPhi: 0.78, dOff: 12, dSpan: 42, y0: 9.0, y1: 25.0, steps: 6, isSeat: true }
      ];
    } else if (id === 'texas') {
      tiers = [
        { startPhi: -0.78, endPhi: -0.20, dOff: 12, dSpan: 44, y0: 9.5, y1: 27.5, steps: 7, isSeat: true },
        { startPhi: -0.17, endPhi: 0.17, dOff: 12, dSpan: 20, y0: 24.0, y1: 27.0, steps: 2, isSeat: false },
        { startPhi: 0.20, endPhi: 0.78, dOff: 12, dSpan: 44, y0: 9.5, y1: 27.5, steps: 7, isSeat: true }
      ];
    } else if (st.tier === 'hs') {
      // High School parks have NO outfield multi-deck stands — only a modest CF Batter's Eye wall/screen directly in dead CF
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
          isUpper: tc.dOff > 45
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
    if (!fair) {
      outcome = 'Foul Ball';
      color = '#fbbf24';
    } else if (reportIsHr) {
      outcome = finalDist >= 425 ? 'UPPER DECK BOMB!' : 'HOME RUN!';
      color = '#38bdf8';
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

  // True 120Hz RK4 Pitched Baseball Aerodynamics (Pitcher Mound RHP/LHP or Dual-Wheel Machine)
  function simulatePitchRK4(params) {
    const mph = params.mph || 90;
    const spec = params.spec || { magX: 7.0, magY: 16.5, hbIn: 11, spinAxisDeg: 25, spinAxisClock: '1:00' };
    const endX = params.endX || 0;
    const endY = params.endY || 0;
    const isDemo = Boolean(params.isDemo);
    const hand = params.hand || 'R';
    const deliveryMode = params.deliveryMode || 'pitcher';
    const airDensity = params.airDensity || 1.0;

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

    // Solve initial aim vector with air drag + gravity + Magnus using quick 2-pass shooting so RK4 passes squarely through (targetX, targetY, 0)
    const Kdrag = 0.00535 * 0.34 * airDensity;
    const flightTimeEst = isDemo ? 0.68 : clamp(57.2 / speedFtS, 0.44, 0.78);
    let vx0 = (targetX - startX - 0.5 * magX * flightTimeEst * flightTimeEst) / flightTimeEst;
    let vy0 = (targetY - startY - 0.5 * (-32.174 + magY) * flightTimeEst * flightTimeEst) / flightTimeEst;
    let vz0 = (0 - startZ) / flightTimeEst + 0.5 * Kdrag * speedFtS * (0 - startZ);

    function integrate(ivx, ivy, ivz, dt, maxZ) {
      let x = startX;
      let y = startY;
      let z = startZ;
      let vx = ivx;
      let vy = ivy;
      let vz = ivz;
      let t = 0;
      const pts = [{ x, y, z, t: 0 }];
      const deriv = (cvx, cvy, cvz) => {
        const sp = Math.hypot(cvx, cvy, cvz);
        const drag = Kdrag * sp;
        return {
          ax: -drag * cvx + magX,
          ay: -drag * cvy - 32.174 + magY,
          az: -drag * cvz
        };
      };
      let plateVz = vz;
      let plateVy = vy;
      let plateT = flightTimeEst;
      for (let i = 0; i < 160; i++) {
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
          var plateX = prevX + (x - prevX) * frac;
          var plateY = prevY + (y - prevY) * frac;
        }
        pts.push({ x, y: Math.max(0.32, y), z, t });
        if (z >= maxZ) break;
      }
      return { pts, plateT, plateX: typeof plateX === 'number' ? plateX : x, plateY: typeof plateY === 'number' ? plateY : y, plateVy, plateVz };
    }

    const dt = 1 / 120;
    // 2 shooting iterations to calibrate exact aim to PCI target
    for (let iter = 0; iter < 2; iter++) {
      const probe = integrate(vx0, vy0, vz0, dt, 0.2);
      const errX = targetX - probe.plateX;
      const errY = targetY - probe.plateY;
      vx0 += errX / Math.max(0.25, probe.plateT);
      vy0 += errY / Math.max(0.25, probe.plateT);
    }

    const finalRun = integrate(vx0, vy0, vz0, dt, 3.4);
    const dur = finalRun.plateT;

    // Resample uniformly onto 61 progress frames (0 .. 1.06 of dur) matching 3D engine contract
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

    return {
      dur,
      samples,
      targetX,
      targetY,
      hbIn: Number((spec.hbIn * pSign * (isMachine ? 0.52 : 1)).toFixed(1)),
      spinAxisDeg: pSign === 1 ? spec.spinAxisDeg : (360 - spec.spinAxisDeg) % 360,
      spinAxisClock: pSign === 1 ? spec.spinAxisClock : mirrorClockLabel(spec.spinAxisClock),
      descendDeg: Math.atan2(finalRun.plateVy, finalRun.plateVz) * (180 / Math.PI)
    };
  }

  // Authentic Dry-Crack Bat Audio Waveform Synthesis:
  // Eliminates plastic 1.18kHz wood resonances and hollow "metal pipe" long sines.
  // Real wood: sub-ms Hertzian shock + dry wide maple crack + ultra-short grain slam (zero plastic pitch!).
  // Real BBCOR alloy/hybrid: heavy compressed leather THWACK + tightly damped asymmetric barrel shell bite (<55-120ms)!
  function synthesizeBatImpactSamples(kind, sweetBucket, sr) {
    const isOffCenter = sweetBucket === 'jam';
    const isWood = kind === 'baum-gold' || kind === 'wood';
    const isGoods22 = kind === 'goods-2022' || kind === 'hybrid';
    const isGoods26 = kind === 'goods-2026';
    const isCombatBlue = kind === 'combat-blue';

    const durSec = isGoods22 ? 0.145 : isGoods26 ? 0.085 : isWood ? 0.048 : 0.105;
    const len = Math.floor(sr * durSec);
    const ch = new Float32Array(len);
    const rnd = makeSeededRand(kind.length * 9137 + (isOffCenter ? 99 : 42));
    const fScale = isOffCenter ? 0.91 : 1.0;

    // Wide, natural acoustic filters — NO high-Q plastic bandpass!
    const bpThump = makeBiquadBP(isOffCenter ? 240 : 320, 0.65, sr);
    const bpCrackMid = makeBiquadBP(isOffCenter ? 1150 : 1480, 0.62, sr);
    const bpCrackHi = makeBiquadBP(isOffCenter ? 2600 : 3650, 0.58, sr);
    const lpAir = makeBiquadLP(isWood ? 6800 : 7600, 0.7, sr);

    for (let i = 0; i < len; i++) {
      const t = i / sr;

      // 1. Sub-millisecond Hertzian cowhide-on-barrel compression transient (~0.42ms front edge)
      let hertz = 0;
      if (t < 0.00042) {
        const u = t / 0.00042;
        hertz = Math.sin(u * Math.PI) * 1.45;
      } else if (t < 0.0009) {
        const u = (t - 0.00042) / 0.00048;
        hertz = -Math.sin(u * Math.PI) * 0.48;
      }

      // 2. Wide broadband percussive air & cowhide crack (no narrow tonal plastic honk!)
      const raw = rnd();
      const thump = bpThump(raw) * Math.exp(-t * 165);
      const crackMid = bpCrackMid(raw) * Math.exp(-t * (isWood ? 235 : 195));
      const crackHi = bpCrackHi(raw) * Math.exp(-t * (isWood ? 310 : 270));
      const grainFloor = lpAir(raw) * Math.exp(-t * (isWood ? 390 : 340)) * 0.42;

      const leatherCrack = hertz + thump * 1.55 + crackMid * 2.15 + crackHi * 2.45 + grainFloor;
      const modeIn = 1 - Math.exp(-t * 2400);

      let sample = 0;
      if (isWood) {
        // Real Pro Maple / Baum Composite: Pure dry gunshot CRACK (~22ms decay), zero metallic/plastic overtones.
        // Only minor damped 172Hz/520Hz wood bending clunk when jammed near the taper!
        if (isOffCenter) {
          const jamThud = Math.sin(2 * Math.PI * 172 * t) * Math.exp(-t * 110) * 0.22 +
                          Math.sin(2 * Math.PI * 525 * t) * Math.exp(-t * 145) * 0.14;
          sample = hertz * 0.8 + thump * 1.7 + crackMid * 1.25 + crackHi * 0.9 + jamThud;
        } else {
          // Slight super-fast damped wood grain body knock (28ms decay)
          const grainKnock = Math.sin(2 * Math.PI * 395 * t) * Math.exp(-t * 180) * 0.08;
          sample = leatherCrack * 1.15 + crackHi * 0.55 + grainKnock;
        }
      } else if (isGoods26) {
        // 2026 DeMarini The Goods: Massive dry composite-stiff THWACK + ultra-short high barrel bite (only ~45ms!)
        const shimmer =
          (Math.sin(2 * Math.PI * (2095 * fScale) * t) * Math.exp(-t * 78) * 0.085 +
            Math.sin(2 * Math.PI * (2760 * fScale) * t) * Math.exp(-t * 92) * 0.055) *
          (0.85 + 0.15 * raw);
        sample = leatherCrack + modeIn * shimmer;
      } else if (isGoods22) {
        // 2022 DeMarini The Goods: Loud punchy X14 alloy THWACK + crisp dual-mode NCAA ring (~85-100ms, never pipe-like)
        const hoop =
          (Math.sin(2 * Math.PI * (2210 * fScale) * t) * Math.exp(-t * 40) * 0.11 +
            Math.sin(2 * Math.PI * (2227 * fScale) * t) * Math.exp(-t * 42) * 0.075 +
            Math.sin(2 * Math.PI * (2910 * fScale) * t) * Math.exp(-t * 52) * 0.065) *
          (0.88 + 0.12 * raw);
        sample = leatherCrack + modeIn * hoop;
      } else {
        // Combat Spec-A1 (Rodeo / Members Blue): Heavy 1-piece SFX shotgun THWACK + tight brief alloy crunch (~60ms)
        const mul = isCombatBlue ? 1.045 : 1.0;
        const sfx =
          (Math.sin(2 * Math.PI * (2150 * mul * fScale) * t) * Math.exp(-t * 62) * 0.085 +
            Math.sin(2 * Math.PI * (2880 * mul * fScale) * t) * Math.exp(-t * 78) * 0.05) *
          (0.86 + 0.14 * raw);
        sample = leatherCrack * 1.08 + thump * 0.4 + modeIn * sfx;
      }

      if (isOffCenter && !isWood) {
        sample += Math.sin(2 * Math.PI * 195 * t) * Math.exp(-t * 95) * 0.11;
      }
      ch[i] = sample;
    }

    // Soft-clip only extreme > 0.96 transients while keeping natural sharp crest factor
    let peak = 0;
    for (let i = 0; i < len; i++) {
      const a = Math.abs(ch[i]);
      if (a > peak) peak = a;
    }
    const norm = peak > 0 ? 0.94 / peak : 1;
    for (let i = 0; i < len; i++) {
      ch[i] *= norm;
    }
    return ch;
  }

  return {
    WIND_PRESETS,
    getParkStructureSurface,
    mirrorClockLabel,
    computeSwingKinematics,
    simulateOutdoorProjectionRK4,
    simulateBattedBallRK4,
    simulatePitchRK4,
    synthesizeBatImpactSamples
  };
});
