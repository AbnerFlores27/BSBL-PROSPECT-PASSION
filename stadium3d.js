/* DiamondIQ — Realistic Continuous Three.js Ballparks, Authentic 5 Composite Bats, Articulated Players & Multi-Camera Engine */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}

function detectSoftwareWebGL(gl) {
  try {
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (!ext) return false;
    const rendererStr = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '');
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(rendererStr);
  } catch {
    return false;
  }
}

/* =========================================================
   High-Detail Procedural Ballpark Textures (Zero 404)
   ========================================================= */
function makeMowedTurfTexture(maxAniso) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');

  const bands = 10;
  const bw = c.width / bands;
  for (let i = 0; i < bands; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#196637' : '#238246';
    ctx.fillRect(i * bw, 0, bw, c.height);
  }
  ctx.globalAlpha = 0.09;
  for (let y = 0; y < bands; y++) {
    ctx.fillStyle = y % 2 === 0 ? '#0d3d20' : '#4ade80';
    ctx.fillRect(0, y * bw, c.width, bw);
  }
  ctx.globalAlpha = 0.16;
  for (let i = 0; i < 3200; i++) {
    const x = (i * 73) % 512;
    const y = (i * 137) % 512;
    ctx.fillStyle = i % 2 === 0 ? '#14532d' : '#86efac';
    ctx.fillRect(x, y, 2, 2);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(12, 12);
  tex.anisotropy = maxAniso;
  return tex;
}

function makeDirtTexture(maxAniso, hexA = '#b27140', hexB = '#8a5027') {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = hexA;
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2600; i++) {
    const x = (i * 53) % 256;
    const y = (i * 97) % 256;
    ctx.fillStyle = i % 3 === 0 ? hexB : '#cf905d';
    ctx.globalAlpha = i % 3 === 0 ? 0.44 : 0.2;
    ctx.fillRect(x, y, 2, 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5, 5);
  tex.anisotropy = maxAniso;
  return tex;
}

function makeEmptyStadiumSeatsTexture(concreteHex, seatHex, trimHex, maxAniso) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = concreteHex;
  ctx.fillRect(0, 0, 512, 256);

  // Realistic 100% EMPTY Tiered College Stadium Chair-Backs + Concrete Aisles + Handrails (Zero crowd blobs!)
  const rows = 12;
  const rowH = c.height / rows;
  const cols = 32;
  const colW = c.width / cols;

  for (let r = 0; r < rows; r++) {
    const y = r * rowH;
    // Concrete step riser & ambient occlusion crease
    const riserGrad = ctx.createLinearGradient(0, y, 0, y + rowH);
    riserGrad.addColorStop(0, 'rgba(0,0,0,0.42)');
    riserGrad.addColorStop(0.22, concreteHex);
    riserGrad.addColorStop(1, 'rgba(0,0,0,0.18)');
    ctx.fillStyle = riserGrad;
    ctx.fillRect(0, y, 512, rowH);

    for (let col = 0; col < cols; col++) {
      const x = col * colW;
      if (col % 16 === 0) {
        // Brushed concrete staircase aisle + safety step stripe + yellow center rail
        ctx.fillStyle = '#475569';
        ctx.fillRect(x, y, colW, rowH);
        ctx.fillStyle = trimHex;
        ctx.fillRect(x + 1, y + rowH - 3, colW - 2, 2);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(x + colW * 0.44, y, 2, rowH);
        continue;
      }

      // Contoured empty folding stadium chair-back (subtle top highlight + bottom seat pan shadow)
      const sx = x + 1.5;
      const sw = colW - 3;
      const sh = rowH - 6;
      const sy = y + 4;
      ctx.fillStyle = seatHex;
      ctx.beginPath();
      ctx.roundRect(sx, sy, sw, sh, 2.5);
      ctx.fill();

      // Seat cushion highlight top edge + folded pan crease
      ctx.fillStyle = 'rgba(255,255,255,0.16)';
      ctx.fillRect(sx + 1, sy + 1, sw - 2, 2.2);
      ctx.fillStyle = 'rgba(0,0,0,0.34)';
      ctx.fillRect(sx + 1, sy + sh - 3.5, sw - 2, 3);
    }

    // Subtle anodized aluminum row safety rail every 4 rows
    if (r % 4 === 0) {
      ctx.fillStyle = 'rgba(203, 213, 225, 0.35)';
      ctx.fillRect(0, y + 1, 512, 1.5);
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(10, 2.2);
  tex.anisotropy = maxAniso;
  return tex;
}

function makeBaseballTexture(maxAniso) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = 'rgba(148,163,184,0.18)';
  for (let i = 0; i < 650; i++) {
    ctx.fillRect((i * 41) % 256, (i * 89) % 256, 2, 1);
  }

  const drawSeam = (cx, flip) => {
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 4.2;
    ctx.beginPath();
    for (let y = 0; y <= 256; y += 4) {
      const wave = Math.sin((y / 256) * Math.PI * 2) * 24 * flip;
      const px = cx + wave;
      if (y === 0) ctx.moveTo(px, y);
      else ctx.lineTo(px, y);
    }
    ctx.stroke();

    ctx.lineWidth = 2.6;
    for (let y = 8; y < 252; y += 11) {
      const wave = Math.sin((y / 256) * Math.PI * 2) * 24 * flip;
      const px = cx + wave;
      ctx.beginPath();
      ctx.moveTo(px - 7, y - 3);
      ctx.lineTo(px + 7, y + 3);
      ctx.stroke();
    }
  };
  drawSeam(74, 1);
  drawSeam(182, -1);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

function makeOmahaWallTexture(maxAniso) {
  const c = document.createElement('canvas');
  c.width = 2048;
  c.height = 256;
  const ctx = c.getContext('2d');

  // Authentic Charles Schwab Field Omaha Navy Padded Wall + Yellow HR Trim
  ctx.fillStyle = '#0f284e';
  ctx.fillRect(0, 0, 2048, 256);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 3;
  for (let x = 0; x < 2048; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }

  ctx.fillStyle = '#facc15';
  ctx.fillRect(0, 0, 2048, 16);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 212, 2048, 6);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 42px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('335', 75, 145);
  ctx.fillText('375', 520, 145);
  ctx.fillText('408', 1024, 145);
  ctx.fillText('375', 1528, 145);
  ctx.fillText('335', 1973, 145);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText("NCAA MEN'S COLLEGE WORLD SERIES", 520, 74);
  ctx.fillText('CHARLES SCHWAB FIELD OMAHA', 1528, 74);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

function makeLsuWallTexture(maxAniso) {
  const c = document.createElement('canvas');
  c.width = 2048;
  c.height = 256;
  const ctx = c.getContext('2d');

  // Authentic Alex Box Stadium LSU Deep Purple & Championship Gold Padding
  ctx.fillStyle = '#3b156b';
  ctx.fillRect(0, 0, 2048, 256);
  ctx.strokeStyle = 'rgba(253,208,35,0.14)';
  ctx.lineWidth = 3;
  for (let x = 0; x < 2048; x += 52) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }

  ctx.fillStyle = '#fdd023';
  ctx.fillRect(0, 0, 2048, 18);
  ctx.fillRect(0, 214, 2048, 8);

  ctx.fillStyle = '#fdd023';
  ctx.font = 'bold 42px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('330', 75, 148);
  ctx.fillText('365', 512, 148);
  ctx.fillText('405', 1024, 148);
  ctx.fillText('365', 1536, 148);
  ctx.fillText('330', 1973, 148);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('ALEX BOX STADIUM · SKIP BERTMAN FIELD', 1024, 72);
  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('THE INTIMIDATOR · BATON ROUGE, LA', 512, 72);
  ctx.fillText('NATIONAL CHAMPIONS', 1536, 72);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

function makeMissStWallTexture(maxAniso) {
  const c = document.createElement('canvas');
  c.width = 2048;
  c.height = 256;
  const ctx = c.getContext('2d');

  // Authentic Dude Noble Field Maroon Wall + Brick Knee Wall Base
  ctx.fillStyle = '#5d1725';
  ctx.fillRect(0, 0, 2048, 196);
  ctx.fillStyle = '#7c2d23';
  ctx.fillRect(0, 196, 2048, 60);
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 64; col++) {
      ctx.fillStyle = (row + col) % 2 === 0 ? '#8c3328' : '#6c251c';
      ctx.fillRect(col * 32 + (row % 2) * 16 + 2, 198 + row * 12, 28, 9);
    }
  }

  ctx.fillStyle = '#facc15';
  ctx.fillRect(0, 0, 2048, 14);
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 186, 2048, 8);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 40px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('330', 75, 134);
  ctx.fillText('374', 512, 134);
  ctx.fillText('390', 1024, 134);
  ctx.fillText('374', 1536, 134);
  ctx.fillText('330', 1973, 134);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('DUDE NOBLE FIELD · LEFT FIELD LOUNGE', 520, 68);
  ctx.fillText('POLK-DEMENT STADIUM · STARKVILLE', 1528, 68);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

function makeCollegeVideoboardTexture(title, sub1, sub2, bgHex, accentHex, maxAniso) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, 512, 256);
  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, 492, 236);

  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(26, 26, 460, 54);
  ctx.fillStyle = accentHex;
  ctx.font = 'bold 26px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, 256, 62);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px monospace';
  ctx.fillText(sub1, 256, 134);
  ctx.fillStyle = '#cbd5e1';
  ctx.font = 'bold 19px monospace';
  ctx.fillText(sub2, 256, 186);

  ctx.fillStyle = accentHex;
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('RAPSODO HITTING 2.0 · D1 TELEMETRY ENABLED', 256, 224);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

function makeCageNetTexture(maxAniso) {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 128, 128);
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.34)';
  ctx.lineWidth = 2;
  for (let i = -128; i <= 256; i += 16) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 128, 128);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(i + 128, 0);
    ctx.lineTo(i, 128);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(22, 4);
  tex.anisotropy = maxAniso;
  return tex;
}

function makeJerseyFrontTexture(bgHex, stripeHex, numText, maxAniso) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  for (let x = 16; x < 256; x += 22) {
    ctx.fillRect(x, 0, 2, 256);
  }
  ctx.fillStyle = stripeHex;
  ctx.fillRect(122, 0, 12, 256);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 64px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(numText, 128, 152);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

/* =========================================================
   Authentic 5-Bat Procedural Wrap Textures + Real 3D Construction
   ========================================================= */
function makeBatWrapTexture(batId, maxAniso) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 1024;
  const ctx = c.getContext('2d');

  // Note on LatheGeometry UV v: v=0 at bottom (y=0 knob), v=1 at top (y=3.64 cap).
  // Canvas y=0 corresponds to UV v=1 (TOP CAP / BARREL END), Canvas y=1024 to UV v=0 (KNOB).
  const paintSpiralGrip = (bg, stripe, startY = 672, endY = 986) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, startY, 512, endY - startY);
    ctx.strokeStyle = stripe;
    ctx.lineWidth = 8;
    for (let y = startY - 120; y < endY + 120; y += 28) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y + 104);
      ctx.stroke();
    }
  };

  if (batId === 'baum-gold') {
    // Photo 1: Baum Bat Gold — High-gloss SOLID JET-BLACK lacquer barrel & handle,
    // signature METALLIC GOLD oval with serif "Baum" on taper, and small gold BBCOR .50 AAA PRO MAPLE stamp.
    const blackLacquer = ctx.createLinearGradient(0, 0, 512, 0);
    blackLacquer.addColorStop(0, '#07080a');
    blackLacquer.addColorStop(0.28, '#1b1e25');
    blackLacquer.addColorStop(0.54, '#0c0d11');
    blackLacquer.addColorStop(0.82, '#21252f');
    blackLacquer.addColorStop(1, '#07080a');
    ctx.fillStyle = blackLacquer;
    ctx.fillRect(0, 0, 512, 1024);

    // Subtle black grip & knob
    paintSpiralGrip('#090a0d', '#1c1f27', 676, 988);
    ctx.fillStyle = '#07080a';
    ctx.fillRect(0, 988, 512, 36);
    ctx.fillRect(0, 0, 512, 18);

    const ovalGrad = ctx.createLinearGradient(0, 380, 0, 560);
    ovalGrad.addColorStop(0, '#ca8a04');
    ovalGrad.addColorStop(0.45, '#fef08a');
    ovalGrad.addColorStop(1, '#d97706');

    // Gold "Baum" Oval on taper + small BBCOR .50 gold stamp on mid-barrel (both faces)
    [136, 376].forEach((cx) => {
      ctx.save();
      ctx.translate(cx, 482);
      ctx.fillStyle = ovalGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, 52, 108, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = '#0b0c10';
      ctx.font = 'bold 56px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('Baum', 0, 17);
      ctx.restore();

      // Tiny gold "GOLD EDITION · BBCOR .50 · AAA PRO MAPLE" stamp
      ctx.save();
      ctx.translate(cx, 290);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = '#eab308';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GOLD EDITION', 0, -14);
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 2;
      ctx.strokeRect(-34, -8, 68, 22);
      ctx.font = 'bold 13px monospace';
      ctx.fillText('BBCOR .50', 0, 8);
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('AAA PRO MAPLE', 0, 28);
      ctx.restore();
    });
  } else if (batId === 'goods-2026') {
    // Photo 2: 2026 DeMarini The Goods —
    // Pale Ice-Blue/Aqua (#a2ebe5) X14 alloy barrel & taper + Flat Black composite handle & grip
    // + Crimson Red chevron arrows & stencil "GOODS" + White "THE GOODS" + Charcoal "DEMARINI" & D icon.
    const iceBlueGrad = ctx.createLinearGradient(0, 0, 512, 0);
    iceBlueGrad.addColorStop(0, '#7cd9d2');
    iceBlueGrad.addColorStop(0.28, '#c6f6f2');
    iceBlueGrad.addColorStop(0.55, '#9beae4');
    iceBlueGrad.addColorStop(0.84, '#bdf4ef');
    iceBlueGrad.addColorStop(1, '#78d4cd');
    ctx.fillStyle = iceBlueGrad;
    ctx.fillRect(0, 0, 512, 558);

    // Flat Black composite handle + black diamond-tex grip + black knob
    ctx.fillStyle = '#111318';
    ctx.fillRect(0, 558, 512, 466);
    paintSpiralGrip('#0c0e13', '#272b36', 674, 986);
    ctx.fillStyle = '#090b0f';
    ctx.fillRect(0, 0, 512, 34);
    ctx.fillRect(0, 986, 512, 38);

    // Front face (cx=136): White "THE GOODS" + bold crimson red stencil "GOODS" + charcoal D logo
    ctx.save();
    ctx.translate(136, 198);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('THE GOODS', 0, -24);
    ctx.fillStyle = '#ef4444';
    ctx.font = '900 58px sans-serif';
    ctx.fillText('GOODS', 0, 26);
    ctx.restore();

    // Charcoal DeMarini "D" arrow mark lower on barrel
    ctx.save();
    ctx.translate(136, 405);
    ctx.fillStyle = '#181a20';
    ctx.fillRect(-32, -26, 64, 52);
    ctx.fillStyle = '#a2ebe5';
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Back face (cx=376): Charcoal "DEMARINI" + crimson red chevron arrows + "HUGE SWEET SPOT"
    ctx.save();
    ctx.translate(376, 224);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#ef4444';
    for (let ax = -125; ax <= 55; ax += 72) {
      ctx.beginPath();
      ctx.moveTo(ax, -44);
      ctx.lineTo(ax + 44, -44);
      ctx.lineTo(ax + 58, -32);
      ctx.lineTo(ax + 44, -20);
      ctx.lineTo(ax, -20);
      ctx.lineTo(ax + 14, -32);
      ctx.closePath();
      ctx.fill();
    }
    for (let ax = -45; ax <= 95; ax += 72) {
      ctx.beginPath();
      ctx.moveTo(ax, 18);
      ctx.lineTo(ax + 44, 18);
      ctx.lineTo(ax + 58, 30);
      ctx.lineTo(ax + 44, 42);
      ctx.lineTo(ax, 42);
      ctx.lineTo(ax + 14, 30);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#1e222a';
    ctx.font = '900 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DEMARINI', 0, 14);
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('HUGE SWEET SPOT   ·   BUILT IN THE U.S.A.', 0, 56);
    ctx.restore();

    // Small BBCOR / stamp box on taper
    ctx.save();
    ctx.translate(376, 465);
    ctx.rotate(-Math.PI / 2);
    ctx.strokeStyle = '#1e222a';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(-26, -15, 52, 30);
    ctx.fillStyle = '#1e222a';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('BBCOR .50', 0, 5);
    ctx.restore();
  } else if (batId === 'goods-2022') {
    // Photo 3: 2022 DeMarini The Goods —
    // Brushed metallic Chrome Silver X14 Alloy barrel + Flat Black composite handle +
    // Monochromatic SOLID BLACK graphics (no red!) + black notched end cap & knob.
    const silverGrad = ctx.createLinearGradient(0, 0, 512, 0);
    silverGrad.addColorStop(0, '#8d99a8');
    silverGrad.addColorStop(0.28, '#f8fafc');
    silverGrad.addColorStop(0.55, '#c8d1dc');
    silverGrad.addColorStop(0.84, '#f1f5f9');
    silverGrad.addColorStop(1, '#8c97a6');
    ctx.fillStyle = silverGrad;
    ctx.fillRect(0, 0, 512, 558);

    // Fine circumferential brushed alloy grain
    ctx.fillStyle = 'rgba(15, 23, 42, 0.08)';
    for (let y = 36; y < 552; y += 5) ctx.fillRect(0, y, 512, 1.5);

    // Flat Black Paraflex composite handle & black diamond-tex grip
    ctx.fillStyle = '#14151a';
    ctx.fillRect(0, 558, 512, 466);
    paintSpiralGrip('#0e1015', '#272a33', 674, 986);
    ctx.fillStyle = '#0b0d12';
    ctx.fillRect(0, 0, 512, 34);
    ctx.fillRect(0, 986, 512, 38);

    // Front face (cx=136): Black "The GOODS" near cap, circular black club stamp, black D logo
    ctx.save();
    ctx.translate(136, 178);
    ctx.fillStyle = '#111318';
    ctx.beginPath();
    ctx.arc(0, 42, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BUILT IN', 0, 38);
    ctx.fillText('U.S.A.', 0, 52);
    ctx.restore();

    ctx.save();
    ctx.translate(136, 98);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#0f1217';
    ctx.font = 'italic bold 20px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('The', -46, -24);
    ctx.font = '900 32px sans-serif';
    ctx.fillText('GOODS', 8, 2);
    ctx.restore();

    // Solid black D logo lower barrel
    ctx.save();
    ctx.translate(136, 396);
    ctx.fillStyle = '#111318';
    ctx.fillRect(-32, -26, 64, 52);
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Back face (cx=376): Monochromatic Black BBCOR .50 + X-14 spec strip
    ctx.save();
    ctx.translate(376, 290);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#111318';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('BBCOR .50  ·  X-14 ALLOY BARREL  ·  2 5/8" DIA', 0, 5);
    ctx.restore();
  } else if (batId === 'combat-rodeo') {
    // Photo 4: Combat MFG Spec-A1 "NOT MY FIRST RODEO!" —
    // Warm vintage buttercream barrel AND handle + Crimson RED perforated grip & flared knob
    // + Crimson/burgundy red tilted "NOT MY FIRST RODEO!" & western bronco stamp.
    const creamGrad = ctx.createLinearGradient(0, 0, 512, 0);
    creamGrad.addColorStop(0, '#dfd0a8');
    creamGrad.addColorStop(0.32, '#fbf4df');
    creamGrad.addColorStop(0.66, '#f2e3be');
    creamGrad.addColorStop(1, '#dac89b');
    ctx.fillStyle = creamGrad;
    ctx.fillRect(0, 0, 512, 670);

    // Crimson RED perforated leather grip + bright red grip collar + deep red knob
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(0, 656, 512, 18);
    paintSpiralGrip('#991b1b', '#7f1d1d', 674, 986);
    ctx.fillStyle = '#88131d';
    ctx.fillRect(0, 986, 512, 38);

    // Front face (cx=136): Bold tilted crimson "NOT MY FIRST RODEO!"
    ctx.save();
    ctx.translate(136, 250);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#991b1b';
    ctx.font = '900 34px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('NOT MY FIRST RODEO!', 0, 10);
    ctx.fillStyle = '#b45309';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('BBCOR .50  ·  LIMITED EDITION  ·  -3', 0, 34);
    ctx.restore();

    // Back face (cx=376): "COMBAT RODEO / ESTD. 2025" + red western bronco silhouette + "SPEC A1 (-3)"
    ctx.save();
    ctx.translate(376, 185);
    ctx.fillStyle = '#7f1d1d';
    ctx.font = 'bold 26px serif';
    ctx.textAlign = 'center';
    ctx.fillText('COMBAT', 0, -76);
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('ESTD. 2025', 0, -56);
    // Stylized western bucking bronco emblem
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.ellipse(0, 10, 36, 22, -0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.arc(0, 145, 22, 0, Math.PI * 2);
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = '#7f1d1d';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('SPEC A1', 0, 114);
    ctx.font = 'bold 22px serif';
    ctx.fillText('-3', 0, 152);
    ctx.restore();
  } else {
    // Photo 5: Combat MFG Spec-A1 Members Club Blue —
    // Powder sky-blue barrel AND sky-blue handle AND sky-blue perforated grip
    // + Deep Royal/Navy Blue flared knob & end cap + thin gold/navy pinstripes
    // + Royal/Gold Lion Shield Country Club Crest & serif italic "Members Only".
    const skyGrad = ctx.createLinearGradient(0, 0, 512, 0);
    skyGrad.addColorStop(0, '#62ccf3');
    skyGrad.addColorStop(0.32, '#c5f0fe');
    skyGrad.addColorStop(0.66, '#87defb');
    skyGrad.addColorStop(1, '#58c3ec');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 512, 675);

    // Matching powder sky-blue perforated grip with subtle white spiral + Royal Navy flared knob & end cap
    paintSpiralGrip('#96e4fc', '#b9eefe', 675, 986);
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(0, 986, 512, 38);
    ctx.fillRect(0, 0, 512, 24);

    // Thin Royal Blue + Gold Pinstripe Rings near Barrel Tip and Lower Taper
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(0, 34, 512, 6);
    ctx.fillRect(0, 444, 512, 5);
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(0, 44, 512, 5);
    ctx.fillRect(0, 453, 512, 4);

    // Front face (cx=136): Royal Blue serif italic '"Members Only"'
    ctx.save();
    ctx.translate(136, 248);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'italic bold 38px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('“Members Only”', 0, 12);
    ctx.restore();

    // Back face (cx=376): Royal Blue & Gold Country Club Lion Shield + "Swing Easy, Hit Hard"
    ctx.save();
    ctx.translate(376, 215);
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.moveTo(-42, -48);
    ctx.lineTo(42, -48);
    ctx.lineTo(42, 12);
    ctx.lineTo(0, 54);
    ctx.lineTo(-42, 12);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 17px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('Spec A1', 0, -18);
    ctx.beginPath();
    ctx.arc(0, 14, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 15px serif';
    ctx.fillText('CCC', 0, 19);

    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 18px serif';
    ctx.fillText('COUNTRY CLUB', 0, -68);
    ctx.fillStyle = '#b45309';
    ctx.font = 'italic bold 14px Georgia, serif';
    ctx.fillText('Swing Easy,', 0, 82);
    ctx.fillText('Hit Hard', 0, 100);
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

/* =========================================================
   True Multi-Part 3D Composite Bat Assembly (Lathe + Collars + End Caps + Knobs)
   ========================================================= */
function buildCompositeBatGroup(batConfig, tex) {
  const group = new THREE.Group();
  const barrelR = batConfig.id === 'baum-gold' ? 0.168 : 0.184;
  const is2Pc = batConfig.construction === '2pc';
  const isMetal = batConfig.id === 'goods-2022';
  const isWood = batConfig.id === 'baum-gold';
  const isGloss = batConfig.id === 'combat-rodeo' || batConfig.id === 'combat-blue' || batConfig.id === 'baum-gold';
  const isAnodized = batConfig.id === 'goods-2026';

  // Main Sculpted Pro Lathe Profile (Knob -> Tapered Handle -> Barrel -> Tip)
  const knobFlareR = batConfig.capStyle === 'flared' ? 0.156 : 0.146;
  const pts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(knobFlareR, 0.025),
    new THREE.Vector2(knobFlareR * 0.96, 0.088),
    new THREE.Vector2(0.084, 0.145),
    new THREE.Vector2(0.072, 1.15),
    new THREE.Vector2(0.089, 1.38),
    new THREE.Vector2(0.118, 1.68),
    new THREE.Vector2(barrelR * 0.9, 2.02),
    new THREE.Vector2(barrelR, 2.18),
    new THREE.Vector2(barrelR, 3.55),
    new THREE.Vector2(barrelR * 0.86, 3.63),
    new THREE.Vector2(batConfig.capStyle === 'cupped' ? 0.05 : 0.11, 3.63),
    new THREE.Vector2(0.0, batConfig.capStyle === 'cupped' ? 3.54 : 3.64)
  ];

  const mainGeom = new THREE.LatheGeometry(pts, 36);
  const mainMat = new THREE.MeshPhysicalMaterial({
    map: tex,
    roughness: isMetal ? 0.18 : isAnodized ? 0.28 : isWood ? 0.14 : 0.2,
    metalness: isMetal ? 0.9 : isAnodized ? 0.28 : isWood ? 0.06 : 0.26,
    clearcoat: isGloss ? 0.92 : isMetal ? 0.52 : 0.32,
    clearcoatRoughness: isGloss ? 0.08 : 0.2
  });

  const bodyMesh = new THREE.Mesh(mainGeom, mainMat);
  bodyMesh.castShadow = true;
  bodyMesh.rotation.y = Math.PI * 0.56;
  group.add(bodyMesh);

  // Subtle Knob Weight/Model Sticker Medallion on Bottom of Knob
  const knobCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.105, 0.105, 0.015, 20),
    new THREE.MeshStandardMaterial({ color: batConfig.knobColor || batConfig.trimColor || '#0f172a', roughness: 0.35, metalness: 0.35 })
  );
  knobCap.position.y = 0.005;
  group.add(knobCap);

  // Physical Protruding 3D Direct-Connection Cuff Collar for 2-Piece DeMarini Hybrids (Black charcoal per photos)
  if (is2Pc) {
    const cuffMat = new THREE.MeshPhysicalMaterial({
      color: batConfig.cuffColor || '#181a20',
      roughness: 0.34,
      metalness: 0.32,
      clearcoat: 0.4
    });
    const cuffMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.116, 0.102, 0.24, 24), cuffMat);
    cuffMesh.position.y = 1.54;
    cuffMesh.castShadow = true;
    group.add(cuffMesh);

    const ringMat = new THREE.MeshStandardMaterial({
      color: batConfig.cuffTrim || '#334155',
      roughness: 0.35,
      metalness: 0.45
    });
    const topRing = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.011, 8, 24), ringMat);
    topRing.rotation.x = Math.PI / 2;
    topRing.position.y = 1.66;
    const botRing = new THREE.Mesh(new THREE.TorusGeometry(0.101, 0.01, 8, 24), ringMat);
    botRing.rotation.x = Math.PI / 2;
    botRing.position.y = 1.42;
    group.add(topRing, botRing);
  }

  // Authentic 3D End Cap Features matching uploaded photos
  if (batConfig.capStyle === 'tremor' || batConfig.capStyle === 'dish') {
    // 2026 & 2022 DeMarini Notched Black Composite End Cap
    const toothMat = new THREE.MeshStandardMaterial({ color: '#090b10', roughness: 0.35, metalness: 0.3 });
    const baseCapRing = new THREE.Mesh(
      new THREE.TorusGeometry(barrelR * 0.78, 0.014, 8, 24),
      toothMat
    );
    baseCapRing.rotation.x = Math.PI / 2;
    baseCapRing.position.y = 3.635;
    group.add(baseCapRing);

    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.045, 0.055), toothMat);
      tooth.position.set(Math.cos(a) * (barrelR * 0.78), 3.64, Math.sin(a) * (barrelR * 0.78));
      tooth.rotation.y = -a;
      group.add(tooth);
    }
  } else if (batConfig.capStyle === 'cupped') {
    // Photo 1: Baum Gold sleek solid black cupped rim
    const cupRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.11, 0.02, 8, 24),
      new THREE.MeshStandardMaterial({ color: '#111318', roughness: 0.25 })
    );
    cupRim.rotation.x = Math.PI / 2;
    cupRim.position.y = 3.61;
    group.add(cupRim);
  } else if (batConfig.capStyle === 'flared') {
    // Photo 4 & 5: Combat Flared Pommel Cuff + Matching Knob/Cap Accent
    const pommel = new THREE.Mesh(
      new THREE.TorusGeometry(0.128, 0.022, 10, 24),
      new THREE.MeshStandardMaterial({ color: batConfig.knobColor || batConfig.capColor, roughness: 0.45 })
    );
    pommel.rotation.x = Math.PI / 2;
    pommel.position.y = 0.095;
    group.add(pommel);
  }

  return group;
}

/* =========================================================
   Smooth Swept Continuous Stadium Geometry Helpers (Zero Blocks)
   ========================================================= */
function createSweptWallGeometry(distFn, heightFn, startPhi = -0.785, endPhi = 0.785, slices = 96, depth = 3.5) {
  const pos = [];
  const uv = [];
  const idx = [];

  // Arc distances & heights
  const pts = [];
  let totalArc = 0;
  for (let i = 0; i <= slices; i++) {
    const t = i / slices;
    const phi = startPhi + t * (endPhi - startPhi);
    const d = distFn(phi);
    const h = heightFn(phi);
    const x = Math.sin(phi) * d;
    const z = -Math.cos(phi) * d;
    if (i > 0) {
      totalArc += Math.hypot(x - pts[i - 1].x, z - pts[i - 1].z);
    }
    pts.push({ phi, d, h, x, z, arc: totalArc });
  }

  // Front face (facing Home Plate) + Top face + Back face
  for (let i = 0; i <= slices; i++) {
    const p = pts[i];
    const nx = Math.sin(p.phi);
    const nz = -Math.cos(p.phi);
    const u = p.arc / Math.max(1, totalArc);

    // 0: Front bottom, 1: Front top, 2: Back top, 3: Back bottom
    pos.push(p.x, 0, p.z);
    uv.push(u, 0);

    pos.push(p.x, p.h, p.z);
    uv.push(u, 1);

    pos.push(p.x + nx * depth, p.h, p.z + nz * depth);
    uv.push(u, 1);

    pos.push(p.x + nx * depth, 0, p.z + nz * depth);
    uv.push(u, 0);
  }

  for (let i = 0; i < slices; i++) {
    const a = i * 4;
    const b = (i + 1) * 4;
    // Front face
    idx.push(a + 0, b + 0, b + 1, a + 0, b + 1, a + 1);
    // Top face
    idx.push(a + 1, b + 1, b + 2, a + 1, b + 2, a + 2);
    // Back face
    idx.push(a + 2, b + 2, b + 3, a + 2, b + 3, a + 3);
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function createSweptStripGeometry(innerDistFn, outerDistFn, yInnerFn, yOuterFn, startPhi = -0.785, endPhi = 0.785, slices = 72) {
  const pos = [];
  const uv = [];
  const idx = [];

  for (let i = 0; i <= slices; i++) {
    const t = i / slices;
    const phi = startPhi + t * (endPhi - startPhi);
    const di = innerDistFn(phi);
    const dOut = outerDistFn(phi);
    const yi = yInnerFn(phi);
    const yOut = yOuterFn(phi);

    pos.push(Math.sin(phi) * di, yi, -Math.cos(phi) * di);
    uv.push(t, 0);

    pos.push(Math.sin(phi) * dOut, yOut, -Math.cos(phi) * dOut);
    uv.push(t, 1);
  }

  for (let i = 0; i < slices; i++) {
    const a = i * 2;
    const b = (i + 1) * 2;
    idx.push(a, b, b + 1, a, b + 1, a + 1);
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function buildTopCopingTube(distFn, heightFn, startPhi, endPhi, slices, radius, mat) {
  // Break at big vertical steps (e.g., Fenway Green Monster 37 -> 17 -> 5 ft) cleanly
  const segments = [[]];
  let prevH = null;
  for (let i = 0; i <= slices; i++) {
    const phi = startPhi + (i / slices) * (endPhi - startPhi);
    const d = distFn(phi);
    const h = heightFn(phi);
    if (prevH !== null && Math.abs(h - prevH) > 4) {
      segments.push([]);
    }
    segments[segments.length - 1].push(new THREE.Vector3(Math.sin(phi) * d, h + radius * 0.65, -Math.cos(phi) * d));
    prevH = h;
  }
  const grp = new THREE.Group();
  for (const seg of segments) {
    if (seg.length < 2) continue;
    const curve = new THREE.CatmullRomCurve3(seg);
    const tube = new THREE.TubeGeometry(curve, Math.max(8, seg.length * 2), radius, 8, false);
    grp.add(new THREE.Mesh(tube, mat));
  }
  return grp;
}

function buildPleatedPavilionRoof(centerPhi, halfSpanPhi, innerDist, depth, baseY, peakAmp, waves, roofMat, fasciaMat) {
  // True Mid-Century Folded-Plate Zig-Zag Canopy Geometry (Dodger Stadium Signature Pavilions)
  const steps = waves * 2;
  const pos = [];
  const idx = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const phi = centerPhi - halfSpanPhi + t * (halfSpanPhi * 2);
    const isPeak = i % 2 === 1;
    const yFront = baseY + (isPeak ? peakAmp : 0);
    const yBack = baseY - 2 + (isPeak ? peakAmp * 0.72 : 0);

    pos.push(Math.sin(phi) * innerDist, yFront, -Math.cos(phi) * innerDist);
    pos.push(Math.sin(phi) * (innerDist + depth), yBack, -Math.cos(phi) * (innerDist + depth));
  }
  for (let i = 0; i < steps; i++) {
    const a = i * 2;
    const b = (i + 1) * 2;
    idx.push(a, b, b + 1, a, b + 1, a + 1);
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geom.setIndex(idx);
  geom.computeVertexNormals();
  const mesh = new THREE.Mesh(geom, roofMat);

  // Under-soffit shadow lip
  const underGeom = geom.clone();
  underGeom.translate(0, -0.45, 0);
  const underMesh = new THREE.Mesh(underGeom, fasciaMat);

  const grp = new THREE.Group();
  grp.add(mesh, underMesh);
  return grp;
}

function buildSanGabrielMountainRidge() {
  // Continuous Multi-Octave Sculpted Terrain Backdrop (zero ConeGeometry pyramids)
  const cols = 64;
  const rows = 14;
  const pos = [];
  const colors = [];
  const idx = [];
  const cLow = new THREE.Color('#2a1c3a');
  const cMid = new THREE.Color('#4a2d5e');
  const cPeak = new THREE.Color('#8e5676');

  for (let r = 0; r <= rows; r++) {
    const vr = r / rows; // 0 = near base, 1 = far peak crest
    const dist = 540 + vr * 240;
    for (let c = 0; c <= cols; c++) {
      const uc = c / cols;
      const phi = -1.12 + uc * 2.24;
      const ridgeEnv = Math.sin(vr * Math.PI);
      const oct1 = Math.sin(uc * Math.PI * 3.2 + 0.4) * 58;
      const oct2 = Math.cos(uc * Math.PI * 7.8 + vr * 2.1) * 28;
      const oct3 = Math.sin(uc * Math.PI * 17.5 + vr * 5.0) * 11;
      const rawH = Math.max(0, (55 + oct1 + oct2 + oct3) * ridgeEnv);

      const x = Math.sin(phi) * dist;
      const z = -Math.cos(phi) * dist;
      pos.push(x, rawH - 4, z);

      const hNorm = clamp(rawH / 145, 0, 1);
      const col = cLow.clone().lerp(cMid, clamp(hNorm * 1.4, 0, 1)).lerp(cPeak, clamp((hNorm - 0.5) * 2, 0, 1));
      colors.push(col.r, col.g, col.b);
    }
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const a = r * (cols + 1) + c;
      const b = a + 1;
      const d = (r + 1) * (cols + 1) + c;
      const e = d + 1;
      idx.push(a, d, b, b, d, e);
    }
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return new THREE.Mesh(
    g,
    new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.94,
      metalness: 0.02,
      side: THREE.DoubleSide
    })
  );
}

function buildCaliforniaPalmTree(height, curveOffsetX, curveOffsetZ) {
  const grp = new THREE.Group();
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(curveOffsetX * 0.35, height * 0.36, curveOffsetZ * 0.35),
    new THREE.Vector3(curveOffsetX * 0.85, height * 0.72, curveOffsetZ * 0.85),
    new THREE.Vector3(curveOffsetX, height, curveOffsetZ)
  ]);
  const trunkMat = new THREE.MeshStandardMaterial({ color: '#6b4c35', roughness: 0.92 });
  const trunk = new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.95, 7, false), trunkMat);
  grp.add(trunk);

  const crownPos = curve.getPoint(1);
  const frondMat = new THREE.MeshStandardMaterial({ color: '#1b6b3a', roughness: 0.78, side: THREE.DoubleSide });
  for (let f = 0; f < 9; f++) {
    const a = (f / 9) * Math.PI * 2;
    const frondCurve = new THREE.CatmullRomCurve3([
      crownPos.clone(),
      crownPos.clone().add(new THREE.Vector3(Math.cos(a) * 5.2, 2.4, Math.sin(a) * 5.2)),
      crownPos.clone().add(new THREE.Vector3(Math.cos(a) * 10.5, -1.6, Math.sin(a) * 10.5))
    ]);
    const frond = new THREE.Mesh(new THREE.TubeGeometry(frondCurve, 6, 0.45, 5, false), frondMat);
    grp.add(frond);
  }
  return grp;
}

function makeCurvedCapVisorGeom(width = 0.68, depth = 0.48, arch = 0.09) {
  // Authentic curved baseball cap bill: curved crescent shape + slight vertical bill camber
  const s = new THREE.Shape();
  const hw = width * 0.5;
  s.moveTo(-hw, 0);
  s.quadraticCurveTo(0, depth * 0.24, hw, 0);
  s.quadraticCurveTo(hw * 0.92, depth * 0.78, 0, depth);
  s.quadraticCurveTo(-hw * 0.92, depth * 0.78, -hw, 0);
  const g = new THREE.ExtrudeGeometry(s, {
    depth: 0.036,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.012,
    bevelSegments: 2,
    curveSegments: 14
  });
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const nx = x / hw;
    const ny = Math.max(0, y / depth);
    // Natural pro bill arch across width + subtle downward lip droop
    pos.setZ(i, pos.getZ(i) - nx * nx * arch * ny);
  }
  g.computeVertexNormals();
  return g;
}

function makeSculptedGloveMesh(leatherMat, laceMat, scale = 1.0, isCatcherMitt = false) {
  const grp = new THREE.Group();
  // Cupped leather palm bowl via partial LatheGeometry (concave pocket facing -Z/+Z)
  const pocketPts = isCatcherMitt
    ? [
        new THREE.Vector2(0.0, 0.04),
        new THREE.Vector2(0.18 * scale, 0.02),
        new THREE.Vector2(0.36 * scale, 0.09 * scale),
        new THREE.Vector2(0.42 * scale, 0.2 * scale),
        new THREE.Vector2(0.34 * scale, 0.26 * scale)
      ]
    : [
        new THREE.Vector2(0.0, 0.03),
        new THREE.Vector2(0.15 * scale, 0.02),
        new THREE.Vector2(0.28 * scale, 0.08 * scale),
        new THREE.Vector2(0.33 * scale, 0.18 * scale),
        new THREE.Vector2(0.26 * scale, 0.24 * scale)
      ];
  const shellGeom = new THREE.LatheGeometry(pocketPts, 20);
  shellGeom.rotateX(Math.PI / 2);
  const shell = new THREE.Mesh(shellGeom, leatherMat);
  shell.scale.set(isCatcherMitt ? 1.08 : 0.94, isCatcherMitt ? 1.14 : 1.18, 0.95);
  grp.add(shell);

  // Sculpted thumb stall + pocket web
  const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.085 * scale, 0.22 * scale, 6, 10), leatherMat);
  thumb.position.set(-0.24 * scale, 0.04 * scale, 0.08 * scale);
  thumb.rotation.z = 0.45;
  thumb.rotation.x = 0.35;
  grp.add(thumb);

  const webLoop = new THREE.Mesh(new THREE.TorusGeometry(0.11 * scale, 0.032 * scale, 8, 16), laceMat);
  webLoop.position.set(-0.12 * scale, 0.14 * scale, 0.12 * scale);
  webLoop.rotation.y = 0.25;
  grp.add(webLoop);

  if (!isCatcherMitt) {
    for (let f = 0; f < 3; f++) {
      const finger = new THREE.Mesh(new THREE.CapsuleGeometry(0.056 * scale, 0.18 * scale, 5, 8), leatherMat);
      finger.position.set((0.02 + f * 0.095) * scale, 0.24 * scale, 0.05 * scale);
      finger.rotation.x = 0.36;
      finger.rotation.z = -0.1 * (f - 1);
      grp.add(finger);
    }
  } else {
    const padRim = new THREE.Mesh(new THREE.TorusGeometry(0.35 * scale, 0.065 * scale, 8, 22), laceMat);
    padRim.scale.set(1.04, 1.1, 0.72);
    padRim.position.set(0, 0, 0.16 * scale);
    grp.add(padRim);
  }
  return grp;
}

function buildNaturalPineOrOakGrove(positions, trunkMat, leafMat, isPine = true) {
  const grp = new THREE.Group();
  const count = positions.length;
  const trunkGeom = new THREE.CylinderGeometry(0.75, 1.35, 18, 10);
  trunkGeom.translate(0, 9, 0);
  const trunks = new THREE.InstancedMesh(trunkGeom, trunkMat, count);

  // Organic displaced multi-lobe canopy (never cone pyramids)
  const crownGeom = new THREE.IcosahedronGeometry(isPine ? 8.2 : 10.5, 2);
  const cPos = crownGeom.attributes.position;
  for (let i = 0; i < cPos.count; i++) {
    const vx = cPos.getX(i);
    const vy = cPos.getY(i);
    const vz = cPos.getZ(i);
    const bump = 1 + 0.18 * Math.sin(vx * 0.9 + vy * 0.7) * Math.cos(vz * 0.8);
    const taper = isPine ? clamp(1.18 - (vy / 10) * 0.42, 0.48, 1.25) : 1.0;
    cPos.setXYZ(i, vx * bump * taper, vy * (isPine ? 1.45 : 0.92) * bump, vz * bump * taper);
  }
  crownGeom.computeVertexNormals();
  const crowns = new THREE.InstancedMesh(crownGeom, leafMat, count * 2);

  const dummy = new THREE.Object3D();
  const tint = new THREE.Color();
  positions.forEach((p, idx) => {
    const s = 0.85 + ((idx * 37) % 30) / 100;
    dummy.position.set(p[0], 0, p[1]);
    dummy.rotation.set(0, idx * 1.1, 0);
    dummy.scale.set(s, s, s);
    dummy.updateMatrix();
    trunks.setMatrixAt(idx, dummy.matrix);

    dummy.position.set(p[0], 17 * s, p[1]);
    dummy.scale.set(s, s, s);
    dummy.updateMatrix();
    crowns.setMatrixAt(idx * 2, dummy.matrix);

    dummy.position.set(p[0] + Math.sin(idx) * 2.2, 23 * s, p[1] + Math.cos(idx) * 2.2);
    dummy.scale.set(s * 0.78, s * 0.76, s * 0.78);
    dummy.updateMatrix();
    crowns.setMatrixAt(idx * 2 + 1, dummy.matrix);

    tint.setHSL(0.36 + ((idx % 5) - 2) * 0.012, 0.48, 0.24 + (idx % 4) * 0.03);
    crowns.setColorAt(idx * 2, tint);
    crowns.setColorAt(idx * 2 + 1, tint);
  });
  trunks.instanceMatrix.needsUpdate = true;
  crowns.instanceMatrix.needsUpdate = true;
  if (crowns.instanceColor) crowns.instanceColor.needsUpdate = true;
  trunks.computeBoundingSphere();
  crowns.computeBoundingSphere();
  grp.add(trunks, crowns);
  return grp;
}

function makeRoundedRectShape(w, h, r) {
  const s = new THREE.Shape();
  const hw = w * 0.5;
  const hh = h * 0.5;
  const rad = Math.min(r, hw * 0.45, hh * 0.45);
  s.moveTo(-hw + rad, -hh);
  s.lineTo(hw - rad, -hh);
  s.quadraticCurveTo(hw, -hh, hw, -hh + rad);
  s.lineTo(hw, hh - rad);
  s.quadraticCurveTo(hw, hh, hw - rad, hh);
  s.lineTo(-hw + rad, hh);
  s.quadraticCurveTo(-hw, hh, -hw, hh - rad);
  s.lineTo(-hw, -hh + rad);
  s.quadraticCurveTo(-hw, -hh, -hw + rad, -hh);
  return s;
}

function makeSculptedLimbGeom(rTop, rBot, len) {
  // Smooth organic LatheGeometry limb profile (slight muscular calf/bicep swell + rounded joint caps)
  const pts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(rTop * 0.88, -len * 0.06),
    new THREE.Vector2(rTop * 1.08, -len * 0.28),
    new THREE.Vector2((rTop + rBot) * 0.52, -len * 0.58),
    new THREE.Vector2(rBot * 0.96, -len * 0.92),
    new THREE.Vector2(0.0, -len)
  ];
  return new THREE.LatheGeometry(pts, 18);
}

function makeSculptedTorsoGeom(height, chestR, waistR, hipR) {
  const h = height;
  const pts = [
    new THREE.Vector2(0.0, -h * 0.5),
    new THREE.Vector2(hipR * 0.85, -h * 0.46),
    new THREE.Vector2(hipR, -h * 0.34),
    new THREE.Vector2(waistR, -h * 0.06),
    new THREE.Vector2(chestR, h * 0.26),
    new THREE.Vector2(chestR * 0.92, h * 0.44),
    new THREE.Vector2(chestR * 0.32, h * 0.5),
    new THREE.Vector2(0.0, h * 0.5)
  ];
  return new THREE.LatheGeometry(pts, 24);
}

function makeSculptedCleatMesh(mat, scale = 1.0) {
  const grp = new THREE.Group();
  const shoe = new THREE.Mesh(new THREE.CapsuleGeometry(0.145 * scale, 0.36 * scale, 6, 12), mat);
  shoe.rotation.x = Math.PI / 2;
  shoe.scale.set(1.0, 1.0, 0.68);
  shoe.position.set(0, -1.33, 0.14 * scale);
  const ankleCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.135 * scale, 0.15 * scale, 0.16 * scale, 14), mat);
  ankleCollar.position.set(0, -1.24, 0.01);
  grp.add(shoe, ankleCollar);
  return grp;
}

function buildStadiumLightTowers(stSpec, towerAngles, concreteMat, steelMat) {
  const grp = new THREE.Group();
  const bulbMat = new THREE.MeshBasicMaterial({ color: '#f8fafc' });
  const frameMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.46, metalness: 0.52 });

  const colsPerBank = 6;
  const rowsPerBank = 3;
  const totalBulbs = towerAngles.length * colsPerBank * rowsPerBank;
  const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.95, 10, 8), bulbMat, totalBulbs);
  const dummy = new THREE.Object3D();
  let bulbIdx = 0;

  // Tapered LatheGeometry architectural concrete-steel stanchion tower
  const towerProfile = [
    new THREE.Vector2(2.6, 0),
    new THREE.Vector2(2.3, 18),
    new THREE.Vector2(1.6, 68),
    new THREE.Vector2(1.05, 124),
    new THREE.Vector2(1.3, 127),
    new THREE.Vector2(0, 128)
  ];
  const poleGeom = new THREE.LatheGeometry(towerProfile, 16);
  const housingGeom = new THREE.ExtrudeGeometry(makeRoundedRectShape(24.5, 11.2, 2.2), {
    depth: 1.5,
    bevelEnabled: true,
    bevelThickness: 0.35,
    bevelSize: 0.35,
    bevelSegments: 2
  });

  for (const phi of towerAngles) {
    const d = stSpec.wallDist(phi) + 86;
    const tx = Math.sin(phi) * d;
    const tz = -Math.cos(phi) * d;

    const pole = new THREE.Mesh(poleGeom, steelMat);
    pole.position.set(tx, 0, tz);
    grp.add(pole);

    const headGrp = new THREE.Group();
    headGrp.position.set(tx, 126, tz);
    headGrp.lookAt(0, 12, 0);

    const backing = new THREE.Mesh(housingGeom, frameMat);
    backing.position.set(0, 0, -1.6);
    headGrp.add(backing);

    const armCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -6, -4.5),
      new THREE.Vector3(0, -3, -2.5),
      new THREE.Vector3(0, 0, -1.0)
    ]);
    headGrp.add(new THREE.Mesh(new THREE.TubeGeometry(armCurve, 8, 0.72, 10, false), concreteMat));
    grp.add(headGrp);

    headGrp.updateMatrixWorld(true);
    for (let r = 0; r < rowsPerBank; r++) {
      for (let c = 0; c < colsPerBank; c++) {
        const lx = -9.5 + c * 3.8;
        const ly = -3.0 + r * 3.0;
        dummy.position.set(lx, ly, 0.35);
        dummy.position.applyMatrix4(headGrp.matrixWorld);
        dummy.updateMatrix();
        bulbs.setMatrixAt(bulbIdx++, dummy.matrix);
      }
    }

    const coneGeom = new THREE.ConeGeometry(34, 155, 18, 1, true);
    coneGeom.translate(0, -77.5, 0);
    coneGeom.rotateX(-Math.PI / 2);
    const beamCone = new THREE.Mesh(
      coneGeom,
      new THREE.MeshBasicMaterial({
        color: '#e0f2fe',
        transparent: true,
        opacity: 0.032,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
      })
    );
    beamCone.position.set(0, 0, 1.5);
    headGrp.add(beamCone);
  }
  bulbs.instanceMatrix.needsUpdate = true;
  bulbs.computeBoundingSphere();
  grp.add(bulbs);
  return grp;
}

/* =========================================================
   Sculpted 6.0-ft Pitcher + Smooth Lathe Torso & Capsule Limbs
   ========================================================= */
function makePlayerShadowDisc(radius = 0.95) {
  const m = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 22),
    new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.36, depthWrite: false })
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.035;
  return m;
}

function buildCompositePitcher(maxAniso, ballTex) {
  const root = new THREE.Group();
  root.position.set(0, 0.83, -60.5);
  root.add(makePlayerShadowDisc(1.2));

  const pantsMat = new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.72 });
  const stirrupMat = new THREE.MeshStandardMaterial({ color: '#b91c1c', roughness: 0.65 });
  const jerseyTex = makeJerseyFrontTexture('#1e3a8a', '#ef4444', '24', maxAniso);
  const jerseyMat = new THREE.MeshStandardMaterial({ map: jerseyTex, roughness: 0.56 });
  const sleeveMat = new THREE.MeshStandardMaterial({ color: '#1e3a8a', roughness: 0.62 });
  const undershirtMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.7 });
  const skinMat = new THREE.MeshStandardMaterial({ color: '#d99b72', roughness: 0.62 });
  const navyMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.5 });
  const gloveMat = new THREE.MeshStandardMaterial({ color: '#854d0e', roughness: 0.48 });

  const bodyPivot = new THREE.Group();
  root.add(bodyPivot);

  const pelvis = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.24, 6, 16), pantsMat);
  pelvis.rotation.z = Math.PI / 2;
  pelvis.scale.set(0.85, 0.65, 0.75);
  pelvis.position.set(0, 2.86, 0);
  bodyPivot.add(pelvis);

  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.06, 8, 22), navyMat);
  belt.rotation.x = Math.PI / 2;
  belt.scale.set(1.06, 0.84, 1);
  belt.position.set(0, 3.04, 0);
  const buckle = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), new THREE.MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.78, roughness: 0.22 }));
  buckle.scale.set(1.2, 0.8, 0.45);
  buckle.position.set(0, 3.04, 0.42);
  bodyPivot.add(belt, buckle);

  // Smooth Contoured Anatomical Torso
  const torsoPivot = new THREE.Group();
  torsoPivot.position.set(0, 3.06, 0);
  bodyPivot.add(torsoPivot);

  const torso = new THREE.Mesh(makeSculptedTorsoGeom(1.88, 0.68, 0.48, 0.53), jerseyMat);
  torso.position.set(0, 0.94, 0);
  torso.scale.set(1.05, 1.0, 0.8);
  torso.castShadow = true;
  torsoPivot.add(torso);

  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.04, 8, 18), stirrupMat);
  collar.rotation.x = Math.PI / 2;
  collar.position.set(0, 1.85, 0);
  const neck = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.18, 6, 12), skinMat);
  neck.position.set(0, 1.98, 0);
  torsoPivot.add(collar, neck);

  // Sculpted Head + Fitted Curved Baseball Cap with Cambered Crescent Bill
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 2.28, 0);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.39, 18, 14), skinMat);
  head.scale.set(0.9, 1.06, 0.96);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.425, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.56), navyMat);
  cap.position.y = 0.07;
  const capBtn = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), stirrupMat);
  capBtn.position.set(0, 0.495, 0);
  const visor = new THREE.Mesh(makeCurvedCapVisorGeom(0.68, 0.48, 0.1), navyMat);
  visor.rotation.x = Math.PI / 2 - 0.12;
  visor.position.set(0, 0.13, 0.34);
  headGroup.add(head, cap, capBtn, visor);
  torsoPivot.add(headGroup);

  // Smooth Organic Legs (Lathe thigh/calf + stirrup sock + Capsule cleat)
  const thighGeom = makeSculptedLimbGeom(0.245, 0.185, 1.4);
  const calfGeom = makeSculptedLimbGeom(0.185, 0.13, 1.24);
  const sockGeom = makeSculptedLimbGeom(0.168, 0.134, 0.68);
  sockGeom.translate(0, -0.5, 0);

  const makeLeg = (xPos) => {
    const hip = new THREE.Group();
    hip.position.set(xPos, 2.86, 0);
    hip.add(new THREE.Mesh(thighGeom, pantsMat));
    const knee = new THREE.Group();
    knee.position.set(0, -1.36, 0);
    const calf = new THREE.Mesh(calfGeom, pantsMat);
    const stirrup = new THREE.Mesh(sockGeom, stirrupMat);
    const shoe = makeSculptedCleatMesh(navyMat, 1.0);
    knee.add(calf, stirrup, shoe);
    hip.add(knee);
    return { hip, knee };
  };

  const rLeg = makeLeg(-0.3);
  const lLeg = makeLeg(0.3);
  root.add(rLeg.hip, lLeg.hip);

  // Smooth Articulated Arms
  const upperArmGeom = makeSculptedLimbGeom(0.175, 0.135, 0.92);
  const foreArmGeom = makeSculptedLimbGeom(0.13, 0.095, 0.94);

  const gloveArmPivot = new THREE.Group();
  gloveArmPivot.position.set(0.68, 1.7, 0);
  gloveArmPivot.add(new THREE.Mesh(new THREE.SphereGeometry(0.21, 12, 10), sleeveMat));
  gloveArmPivot.add(new THREE.Mesh(upperArmGeom, sleeveMat));
  const gloveElbowPivot = new THREE.Group();
  gloveElbowPivot.position.set(0, -0.88, 0);
  gloveElbowPivot.add(new THREE.Mesh(new THREE.SphereGeometry(0.125, 10, 8), undershirtMat));
  gloveElbowPivot.add(new THREE.Mesh(foreArmGeom, undershirtMat));
  const gloveShell = makeSculptedGloveMesh(gloveMat, new THREE.MeshStandardMaterial({ color: '#451a03', roughness: 0.65 }), 0.92, false);
  gloveShell.position.set(0, -1.04, 0.12);
  gloveShell.rotation.x = -Math.PI * 0.28;
  gloveElbowPivot.add(gloveShell);
  gloveArmPivot.add(gloveElbowPivot);
  torsoPivot.add(gloveArmPivot);

  const throwArmPivot = new THREE.Group();
  throwArmPivot.position.set(-0.68, 1.7, 0);
  throwArmPivot.add(new THREE.Mesh(new THREE.SphereGeometry(0.21, 12, 10), sleeveMat));
  throwArmPivot.add(new THREE.Mesh(upperArmGeom, sleeveMat));
  const throwElbowPivot = new THREE.Group();
  throwElbowPivot.position.set(0, -0.88, 0);
  throwElbowPivot.add(new THREE.Mesh(new THREE.SphereGeometry(0.125, 10, 8), undershirtMat));
  throwElbowPivot.add(new THREE.Mesh(foreArmGeom, undershirtMat));
  const hand = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), skinMat);
  hand.position.set(0, -0.96, 0);
  const handBall = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 14, 12),
    new THREE.MeshStandardMaterial({ map: ballTex, roughness: 0.4 })
  );
  handBall.position.set(0, -1.06, 0.14);
  throwElbowPivot.add(hand, handBall);
  throwArmPivot.add(throwElbowPivot);
  torsoPivot.add(throwArmPivot);

  return {
    root,
    torsoPivot,
    leftLegPivot: lLeg.hip,
    leftKneePivot: lLeg.knee,
    rightLegPivot: rLeg.hip,
    rightKneePivot: rLeg.knee,
    gloveArmPivot,
    gloveElbowPivot,
    throwArmPivot,
    throwElbowPivot,
    handBall
  };
}

/* =========================================================
   Sculpted 6.0-ft RH Batter + Contoured C-Flap Helmet & Tapered Anatomy
   ========================================================= */
function buildCompositeBatter(maxAniso) {
  const root = new THREE.Group();
  root.position.set(-2.95, 0.05, 0.25);
  root.add(makePlayerShadowDisc(1.2));

  const pantsMat = new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.72 });
  const stirrupMat = new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.65 });
  const jerseyTex = makeJerseyFrontTexture('#0f172a', '#38bdf8', '17', maxAniso);
  const jerseyMat = new THREE.MeshStandardMaterial({ map: jerseyTex, roughness: 0.56 });
  const sleeveMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.62 });
  const helmetMat = new THREE.MeshPhysicalMaterial({ color: '#0f172a', roughness: 0.22, metalness: 0.22, clearcoat: 0.78 });
  const skinMat = new THREE.MeshStandardMaterial({ color: '#d99b72', roughness: 0.64 });
  const gloveMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.48 });
  const cleatMat = new THREE.MeshStandardMaterial({ color: '#090d14', roughness: 0.52 });

  const thighGeom = makeSculptedLimbGeom(0.235, 0.18, 1.38);
  const calfGeom = makeSculptedLimbGeom(0.18, 0.128, 1.24);
  const sockGeom = makeSculptedLimbGeom(0.165, 0.132, 0.66);
  sockGeom.translate(0, -0.5, 0);

  const makeBatterLeg = (zOffset, tiltZ) => {
    const hip = new THREE.Group();
    hip.position.set(0.02, 2.8, zOffset);
    hip.rotation.z = tiltZ;
    hip.add(new THREE.Mesh(thighGeom, pantsMat));
    const knee = new THREE.Group();
    knee.position.set(0, -1.34, 0);
    const shoe = makeSculptedCleatMesh(cleatMat, 1.0);
    shoe.rotation.y = Math.PI / 2;
    knee.add(
      new THREE.Mesh(calfGeom, pantsMat),
      new THREE.Mesh(sockGeom, stirrupMat),
      shoe
    );
    hip.add(knee);
    return { hip, knee };
  };

  const backLeg = makeBatterLeg(0.56, -0.06);
  const strideLeg = makeBatterLeg(-0.56, 0.06);
  root.add(backLeg.hip, strideLeg.hip);

  const torsoPivot = new THREE.Group();
  torsoPivot.position.set(0, 2.85, 0);
  root.add(torsoPivot);

  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.06, 8, 22), cleatMat);
  belt.rotation.x = Math.PI / 2;
  belt.scale.set(0.84, 1.05, 1);
  belt.position.set(0, 0.08, 0);
  torsoPivot.add(belt);

  const torso = new THREE.Mesh(makeSculptedTorsoGeom(1.86, 0.64, 0.46, 0.51), jerseyMat);
  torso.position.set(0, 1.02, 0);
  torso.rotation.y = Math.PI * 0.5;
  torso.scale.set(0.84, 1.0, 1.05);
  torso.castShadow = true;
  torsoPivot.add(torso);

  const shoulderL = new THREE.Mesh(new THREE.SphereGeometry(0.21, 12, 10), sleeveMat);
  shoulderL.position.set(0.18, 1.76, 0.52);
  const shoulderR = shoulderL.clone();
  shoulderR.position.z = -0.52;
  const neck = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.16, 6, 12), skinMat);
  neck.position.set(0.06, 2.02, 0);
  torsoPivot.add(shoulderL, shoulderR, neck);

  // Smooth Contoured C-Flap Batting Helmet + Curved Crescent Visor
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.39, 18, 14), skinMat);
  head.position.set(0.1, 2.34, 0);
  head.scale.set(0.95, 1.05, 0.92);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.445, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.62), helmetMat);
  helmet.position.set(0.1, 2.4, 0);

  const earFlap = new THREE.Mesh(new THREE.SphereGeometry(0.23, 12, 10, 0, Math.PI, 0, Math.PI * 0.7), helmetMat);
  earFlap.scale.set(1.0, 1.15, 0.45);
  earFlap.position.set(0.12, 2.24, -0.4);
  const cFlap = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.055, 8, 14, Math.PI * 0.68), helmetMat);
  cFlap.position.set(0.27, 2.18, -0.34);
  cFlap.rotation.set(0.18, -0.38, -0.3);

  const visor = new THREE.Mesh(makeCurvedCapVisorGeom(0.66, 0.44, 0.08), helmetMat);
  visor.rotation.x = Math.PI / 2 - 0.1;
  visor.rotation.z = -Math.PI * 0.5 + 0.4;
  visor.position.set(0.32, 2.44, -0.18);
  torsoPivot.add(head, helmet, earFlap, cFlap, visor);

  const upperArmGeom = makeSculptedLimbGeom(0.145, 0.115, 0.86);
  const foreArmGeom = makeSculptedLimbGeom(0.115, 0.085, 0.82);

  const topArm = new THREE.Group();
  topArm.position.set(0.22, 1.76, 0.5);
  const topUpper = new THREE.Mesh(upperArmGeom, sleeveMat);
  const topElbow = new THREE.Group();
  topElbow.position.set(0, -0.84, 0);
  const topFore = new THREE.Mesh(foreArmGeom, skinMat);
  topElbow.add(topFore);
  topArm.add(topUpper, topElbow);

  const bottomArm = new THREE.Group();
  bottomArm.position.set(0.28, 1.72, -0.46);
  const botUpper = new THREE.Mesh(upperArmGeom, sleeveMat);
  const botElbow = new THREE.Group();
  botElbow.position.set(0, -0.84, 0);
  const botFore = new THREE.Mesh(foreArmGeom, skinMat);
  botElbow.add(botFore);
  bottomArm.add(botUpper, botElbow);

  const handsGroup = new THREE.Group();
  handsGroup.position.set(0.62, 1.32, 0.12);
  const topHand = new THREE.Mesh(new THREE.SphereGeometry(0.155, 12, 10), gloveMat);
  topHand.scale.set(1.0, 1.15, 0.92);
  topHand.position.set(0, 0.11, 0);
  const botHand = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 10), gloveMat);
  botHand.scale.set(1.0, 1.15, 0.92);
  botHand.position.set(0, -0.11, 0);
  handsGroup.add(topHand, botHand);
  torsoPivot.add(topArm, bottomArm, handsGroup);

  return {
    root,
    strideLegPivot: strideLeg.hip,
    strideKneePivot: strideLeg.knee,
    backKneePivot: backLeg.knee,
    torsoPivot,
    handsGroup,
    topArm,
    topElbow,
    bottomArm,
    botElbow
  };
}

/* =========================================================
   Sculpted 3D Catcher (Smooth Armor & Wire Mask) & Home Plate Umpire
   ========================================================= */
function buildCatcherAndUmpire() {
  const grp = new THREE.Group();
  const gearMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.42, metalness: 0.22 });
  const padMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.48 });
  const ribAccentMat = new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.42 });
  const umpShirtMat = new THREE.MeshStandardMaterial({ color: '#38bdf8', roughness: 0.65 });
  const umpPantMat = new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.72 });
  const mittMat = new THREE.MeshStandardMaterial({ color: '#854d0e', roughness: 0.48 });
  const maskMetalMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.82, roughness: 0.25 });

  const catcher = new THREE.Group();
  catcher.position.set(0.05, 0, 4.4);
  catcher.add(makePlayerShadowDisc(1.2));

  const cBody = new THREE.Mesh(makeSculptedTorsoGeom(1.48, 0.56, 0.48, 0.5), gearMat);
  cBody.position.set(0, 2.0, 0);
  cBody.rotation.x = -0.18;
  const cProtector = new THREE.Mesh(makeSculptedTorsoGeom(1.16, 0.48, 0.44, 0.42), padMat);
  cProtector.position.set(0, 2.04, -0.22);
  cProtector.rotation.x = -0.18;
  catcher.add(cBody, cProtector);

  for (let r = 0; r < 4; r++) {
    const rib = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.54 - r * 0.04, 6, 10), ribAccentMat);
    rib.rotation.z = Math.PI / 2;
    rib.position.set(0, 2.45 - r * 0.26, -0.58 + r * 0.04);
    rib.rotation.x = -0.18;
    catcher.add(rib);
  }

  // Hockey-style Catcher Helmet + Smooth Torus Cage Bars + Rounded Throat Guard
  const cHelmet = new THREE.Mesh(new THREE.SphereGeometry(0.43, 18, 14), gearMat);
  cHelmet.position.set(0, 3.04, -0.06);
  const cCage = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.028, 8, 18), maskMetalMat);
  cCage.position.set(0, 3.0, -0.44);
  const cBar = new THREE.Mesh(new THREE.CapsuleGeometry(0.02, 0.36, 4, 8), maskMetalMat);
  cBar.rotation.z = Math.PI / 2;
  cBar.position.set(0, 3.0, -0.46);
  const cThroat = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.14, 6, 10), gearMat);
  cThroat.rotation.z = Math.PI / 2;
  cThroat.position.set(0, 2.66, -0.44);
  catcher.add(cHelmet, cCage, cBar, cThroat);

  [-0.46, 0.46].forEach((sx) => {
    const thighC = new THREE.Mesh(new THREE.CapsuleGeometry(0.21, 0.88, 6, 14), gearMat);
    thighC.position.set(sx, 1.48, 0.16);
    thighC.rotation.x = 0.65;
    const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 1.1, 6, 14), padMat);
    shin.position.set(sx, 0.74, -0.16);
    shin.rotation.x = -0.28;
    const kneeCap = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), ribAccentMat);
    kneeCap.position.set(sx, 1.38, -0.32);
    catcher.add(thighC, shin, kneeCap);
  });

  const mitt = makeSculptedGloveMesh(mittMat, new THREE.MeshStandardMaterial({ color: '#451a03', roughness: 0.65 }), 1.12, true);
  mitt.position.set(0, 2.45, -1.18);
  catcher.add(mitt);
  grp.add(catcher);

  const ump = new THREE.Group();
  ump.position.set(-0.78, 0, 7.6);
  ump.add(makePlayerShadowDisc(1.1));
  const uLegL = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 2.32, 6, 14), umpPantMat);
  uLegL.position.set(-0.28, 1.32, 0);
  const uLegR = uLegL.clone();
  uLegR.position.x = 0.28;
  const uTorso = new THREE.Mesh(makeSculptedTorsoGeom(1.88, 0.62, 0.52, 0.56), umpShirtMat);
  uTorso.position.set(0, 3.45, 0);
  const uBallBag = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.28, 6, 10), gearMat);
  uBallBag.position.set(-0.56, 2.75, 0);
  const uHead = new THREE.Mesh(new THREE.SphereGeometry(0.39, 16, 14), gearMat);
  uHead.position.set(0, 4.72, 0);
  const uMask = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.025, 8, 18), maskMetalMat);
  uMask.position.set(0, 4.68, -0.38);
  ump.add(uLegL, uLegR, uTorso, uBallBag, uHead, uMask);
  grp.add(ump);

  return { grp, catcher, mitt };
}

/* =========================================================
   Main Exported Factory: createStadium3DEngine
   ========================================================= */
export function createStadium3DEngine(canvas, batSpecs, stadiumSpecs) {
  const gl =
    canvas.getContext('webgl2', { antialias: true, powerPreference: 'high-performance' }) ||
    canvas.getContext('webgl', { antialias: true, powerPreference: 'high-performance' });
  const isSoftwareGl = gl ? detectSoftwareWebGL(gl) : false;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !isSoftwareGl,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(
    isSoftwareGl ? Math.min(window.devicePixelRatio || 1, 1.25) : Math.min(window.devicePixelRatio || 1, 2)
  );
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = !isSoftwareGl;
  if (!isSoftwareGl) renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy() || 1);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const roomEnv = new RoomEnvironment();
  scene.environment = pmrem.fromScene(roomEnv, 0.04).texture;
  roomEnv.dispose();

  const camera = new THREE.PerspectiveCamera(42, 16 / 9, 0.4, 1900);
  camera.position.set(0.22, 4.9, 14.5);
  camera.lookAt(0, 3.1, -55);

  const hemi = new THREE.HemisphereLight('#bfd9ff', '#1e4228', 0.96);
  scene.add(hemi);

  const keyLight = new THREE.DirectionalLight('#fff2dc', 2.45);
  keyLight.position.set(95, 165, 80);
  keyLight.castShadow = !isSoftwareGl;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.near = 20;
  keyLight.shadow.camera.far = 420;
  keyLight.shadow.camera.left = -120;
  keyLight.shadow.camera.right = 120;
  keyLight.shadow.camera.top = 120;
  keyLight.shadow.camera.bottom = -120;
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight('#7dd3fc', 0.78);
  rimLight.position.set(-140, 80, -240);
  scene.add(rimLight);

  // Shared High-Res College Park Textures
  const turfTex = makeMowedTurfTexture(maxAniso);
  const dirtTex = makeDirtTexture(maxAniso);
  const ballTex = makeBaseballTexture(maxAniso);
  const omahaWallTex = makeOmahaWallTexture(maxAniso);
  const lsuWallTex = makeLsuWallTexture(maxAniso);
  const missStWallTex = makeMissStWallTexture(maxAniso);
  const cageNetTex = makeCageNetTexture(maxAniso);
  const omahaBoardTex = makeCollegeVideoboardTexture('CHARLES SCHWAB FIELD OMAHA', 'NCAA COLLEGE WORLD SERIES', 'OMAHA, NEBRASKA · ELEV 1,040 FT', '#0c1f3f', '#facc15', maxAniso);
  const lsuBoardTex = makeCollegeVideoboardTexture('ALEX BOX STADIUM', 'LSU TIGERS BASEBALL', 'SKIP BERTMAN FIELD · BATON ROUGE', '#280d4a', '#fdd023', maxAniso);
  const missStBoardTex = makeCollegeVideoboardTexture('DUDE NOBLE FIELD', 'LEFT FIELD LOUNGE · STARKVILLE', 'POLK-DEMENT STADIUM · MISS. STATE', '#3a0e17', '#f8fafc', maxAniso);
  const omahaSeatsTex = makeEmptyStadiumSeatsTexture('#1e293b', '#1d4ed8', '#facc15', maxAniso);
  const lsuSeatsTex = makeEmptyStadiumSeatsTexture('#1b162e', '#581c87', '#fdd023', maxAniso);
  const missStSeatsTex = makeEmptyStadiumSeatsTexture('#23181b', '#6b1829', '#e2e8f0', maxAniso);

  // Sky Gradient Dome
  const skyCanvas = document.createElement('canvas');
  skyCanvas.width = 4;
  skyCanvas.height = 256;
  const skyTex = new THREE.CanvasTexture(skyCanvas);
  skyTex.colorSpace = THREE.SRGBColorSpace;
  const skyMesh = new THREE.Mesh(
    new THREE.SphereGeometry(1020, 24, 16),
    new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false })
  );
  scene.add(skyMesh);

  function paintSky(topHex, midHex, lowHex) {
    const sctx = skyCanvas.getContext('2d');
    const g = sctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, topHex);
    g.addColorStop(0.45, midHex);
    g.addColorStop(0.7, lowHex);
    g.addColorStop(1, '#0b1828');
    sctx.fillStyle = g;
    sctx.fillRect(0, 0, 4, 256);
    skyTex.needsUpdate = true;
    scene.fog = new THREE.Fog(lowHex, 320, 980);
  }

  /* =========================================================
     Diamond Turf, Dirt Infield, Bases, Dugouts & Foul Lines
     ========================================================= */
  const fieldGroup = new THREE.Group();
  scene.add(fieldGroup);

  const turfMat = new THREE.MeshStandardMaterial({ map: turfTex, roughness: 0.9, metalness: 0.0 });
  const dirtMat = new THREE.MeshStandardMaterial({ map: dirtTex, roughness: 0.95, metalness: 0.0 });
  const chalkMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.85 });
  const baseMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.45 });
  const dugoutRoofMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.65 });
  const dugoutTrimMat = new THREE.MeshStandardMaterial({ color: '#0ea5e9', roughness: 0.45 });

  const turfGround = new THREE.Mesh(new THREE.CircleGeometry(600, 72), turfMat);
  turfGround.rotation.x = -Math.PI / 2;
  turfGround.receiveShadow = true;
  fieldGroup.add(turfGround);

  // True MLB/NCAA Regulation 95-ft Skinned Infield Dirt Arc centered on Pitcher's Mound (0, -60.5)
  // Remember: ShapeGeometry rotated -PI/2 around X maps shape (sx, sy) -> world (sx, 0, -sy)!
  const skinnedShape = new THREE.Shape();
  const arcCx = 0;
  const arcCy = 60.5;
  const arcR = 95.0;
  // Sweep along the outer 95ft skinned dirt boundary from 3B foul apron (-11 ft outside foul line) to 1B foul apron
  const arcStartA = Math.PI - 0.54;
  const arcEndA = 0.54;
  const x3bStart = arcCx + Math.cos(arcStartA) * arcR;
  const y3bStart = arcCy + Math.sin(arcStartA) * arcR;
  skinnedShape.moveTo(-12.5, 4.5);
  skinnedShape.lineTo(x3bStart, y3bStart);
  const arcSteps = 44;
  for (let i = 1; i <= arcSteps; i++) {
    const a = arcStartA + (i / arcSteps) * (arcEndA - arcStartA);
    skinnedShape.lineTo(arcCx + Math.cos(a) * arcR, arcCy + Math.sin(a) * arcR);
  }
  skinnedShape.lineTo(12.5, 4.5);
  skinnedShape.quadraticCurveTo(0, -10.5, -12.5, 4.5);
  skinnedShape.closePath();

  const infieldDirt = new THREE.Mesh(new THREE.ShapeGeometry(skinnedShape), dirtMat);
  infieldDirt.rotation.x = -Math.PI / 2;
  infieldDirt.position.set(0, 0.022, 0);
  infieldDirt.receiveShadow = true;
  fieldGroup.add(infieldDirt);

  // True Regulation Inner Infield Turf Diamond (+sy -> -z toward center field!) with smooth carved dirt bag aprons
  const diamondShape = new THREE.Shape();
  diamondShape.moveTo(-9.5, 19.5);
  diamondShape.quadraticCurveTo(0, 15.0, 9.5, 19.5);   // curved cut above home plate 26ft circle
  diamondShape.lineTo(50.5, 58.0);
  diamondShape.quadraticCurveTo(46.0, 64.0, 50.5, 70.0); // 1B curved dirt cutout
  diamondShape.lineTo(8.5, 112.0);
  diamondShape.quadraticCurveTo(0, 108.0, -8.5, 112.0);  // 2B curved dirt cutout
  diamondShape.lineTo(-50.5, 70.0);
  diamondShape.quadraticCurveTo(-46.0, 64.0, -50.5, 58.0); // 3B curved dirt cutout
  diamondShape.closePath();

  const innerGrass = new THREE.Mesh(new THREE.ShapeGeometry(diamondShape), turfMat);
  innerGrass.rotation.x = -Math.PI / 2;
  innerGrass.position.y = 0.036;
  innerGrass.receiveShadow = true;
  fieldGroup.add(innerGrass);

  // Authentic College Dirt Sliding-Pit Circles around 1B, 2B, 3B + 18-ft Mound Dirt Apron
  [
    [63.64, -63.64, 12.2],
    [0, -127.28, 13.4],
    [-63.64, -63.64, 12.2],
    [0, -60.5, 10.6]
  ].forEach(([bx, bz, rad]) => {
    const pit = new THREE.Mesh(new THREE.CircleGeometry(rad, 28), dirtMat);
    pit.rotation.x = -Math.PI / 2;
    pit.position.set(bx, 0.042, bz);
    pit.receiveShadow = true;
    fieldGroup.add(pit);
  });

  const homeDirt = new THREE.Mesh(new THREE.CircleGeometry(14.5, 32), dirtMat);
  homeDirt.rotation.x = -Math.PI / 2;
  homeDirt.position.set(0, 0.041, 0.8);
  homeDirt.receiveShadow = true;
  fieldGroup.add(homeDirt);

  // Subtle dirt runner lane / keyhole from home dirt toward mound
  const keyhole = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 48), dirtMat);
  keyhole.rotation.x = -Math.PI / 2;
  keyhole.position.set(0, 0.04, -36.0);
  keyhole.receiveShadow = true;
  fieldGroup.add(keyhole);

  // Contoured Bell-Curve Pitcher's Mound (LatheGeometry — zero sharp cylinder frustum)
  const moundPts = [
    new THREE.Vector2(0.0, 0.83),
    new THREE.Vector2(2.8, 0.82),
    new THREE.Vector2(5.4, 0.56),
    new THREE.Vector2(8.0, 0.22),
    new THREE.Vector2(9.6, 0.01)
  ];
  const moundMesh = new THREE.Mesh(new THREE.LatheGeometry(moundPts, 36), dirtMat);
  moundMesh.position.set(0, 0, -60.5);
  moundMesh.receiveShadow = true;
  fieldGroup.add(moundMesh);

  const rubber = new THREE.Mesh(
    new THREE.ExtrudeGeometry(makeRoundedRectShape(2.0, 0.5, 0.08), { depth: 0.07, bevelEnabled: false }),
    baseMat
  );
  rubber.rotation.x = -Math.PI / 2;
  rubber.position.set(0, 0.82, -60.5);
  fieldGroup.add(rubber);

  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.78, 0.07, 5), baseMat);
  plate.position.set(0, 0.05, 0);
  plate.rotation.y = Math.PI;
  fieldGroup.add(plate);

  const bagGeom = new THREE.ExtrudeGeometry(makeRoundedRectShape(1.5, 1.5, 0.22), {
    depth: 0.2,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.04,
    bevelSegments: 2
  });
  const makeBase = (x, z) => {
    const b = new THREE.Mesh(bagGeom, baseMat);
    b.rotation.x = -Math.PI / 2;
    b.rotation.z = Math.PI / 4;
    b.position.set(x, 0.04, z);
    b.castShadow = true;
    fieldGroup.add(b);
  };
  makeBase(63.64, -63.64);
  makeBase(0, -127.28);
  makeBase(-63.64, -63.64);

  const dugoutRoofGeom = new THREE.ExtrudeGeometry(makeRoundedRectShape(37, 8.6, 1.4), {
    depth: 0.9,
    bevelEnabled: true,
    bevelThickness: 0.25,
    bevelSize: 0.25,
    bevelSegments: 3
  });
  const dugoutWallGeom = new THREE.ExtrudeGeometry(makeRoundedRectShape(36, 5.8, 0.8), {
    depth: 0.85,
    bevelEnabled: true,
    bevelThickness: 0.15,
    bevelSize: 0.15,
    bevelSegments: 2
  });

  [-1, 1].forEach((side) => {
    const lineLen = 355;
    const chalk = new THREE.Mesh(new THREE.PlaneGeometry(0.42, lineLen), chalkMat);
    chalk.rotation.x = -Math.PI / 2;
    chalk.rotation.z = side * (Math.PI / 4);
    const mid = lineLen / 2;
    chalk.position.set(-side * mid * Math.SQRT1_2, 0.05, -mid * Math.SQRT1_2);
    fieldGroup.add(chalk);

    // Sculpted Architectural 1B & 3B Dugout Shells with Curved Roof & Safety Rail
    const dug = new THREE.Group();
    dug.position.set(side * 68, 0, -28);
    dug.rotation.y = side * (Math.PI / 4);
    const roof = new THREE.Mesh(dugoutRoofGeom, dugoutRoofMat);
    roof.rotation.x = -Math.PI / 2;
    roof.position.set(0, 6.2, 0);
    const backWall = new THREE.Mesh(dugoutWallGeom, dugoutRoofMat);
    backWall.position.set(0, 3.1, side * 3.5);
    const trim = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 35.5, 6, 10), dugoutTrimMat);
    trim.rotation.z = Math.PI / 2;
    trim.position.set(0, 6.35, -side * 3.9);
    const rail = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 34.5, 6, 10), baseMat);
    rail.rotation.z = Math.PI / 2;
    rail.position.set(0, 2.5, -side * 3.8);
    dug.add(roof, backWall, trim, rail);
    fieldGroup.add(dug);

    const onDeck = new THREE.Mesh(new THREE.RingGeometry(2.2, 2.6, 28), chalkMat);
    onDeck.rotation.x = -Math.PI / 2;
    onDeck.position.set(side * 16, 0.055, 8);
    fieldGroup.add(onDeck);

    const coachBox = new THREE.Mesh(new THREE.RingGeometry(2.1, 2.35, 4), chalkMat);
    coachBox.rotation.x = -Math.PI / 2;
    coachBox.scale.set(0.7, 1.5, 1);
    coachBox.position.set(side * 80, 0.055, -62);
    fieldGroup.add(coachBox);
  });

  const addRectChalkBox = (cx, cz, width, length, lineW = 0.18) => {
    const hw = width * 0.5;
    const hl = length * 0.5;
    const top = new THREE.Mesh(new THREE.PlaneGeometry(width + lineW, lineW), chalkMat);
    top.rotation.x = -Math.PI / 2;
    top.position.set(cx, 0.054, cz - hl);
    const bot = top.clone();
    bot.position.z = cz + hl;
    const left = new THREE.Mesh(new THREE.PlaneGeometry(lineW, length + lineW), chalkMat);
    left.rotation.x = -Math.PI / 2;
    left.position.set(cx - hw, 0.054, cz);
    const right = left.clone();
    right.position.x = cx + hw;
    fieldGroup.add(top, bot, left, right);
  };

  // True 4ft x 6ft Rectangular Left & Right Batter's Boxes (MLB rulebook proportions)
  addRectChalkBox(-3.0, 0.35, 4.0, 6.0, 0.17);
  addRectChalkBox(3.0, 0.35, 4.0, 6.0, 0.17);

  // Authentic Catcher's Chalk Box behind Home Plate
  addRectChalkBox(0, 5.2, 3.6, 4.4, 0.16);

  // 1st-Base Foul-Territory 3-ft Running Lane (halfway down 1B line)
  const laneLen = 45;
  const runLane = new THREE.Mesh(new THREE.PlaneGeometry(0.16, laneLen), chalkMat);
  runLane.rotation.x = -Math.PI / 2;
  runLane.rotation.z = Math.PI / 4;
  runLane.position.set(34.5, 0.053, -31.5);
  fieldGroup.add(runLane);

  // Players & Equipment
  const pitcher = buildCompositePitcher(maxAniso, ballTex);
  scene.add(pitcher.root);

  const batter = buildCompositeBatter(maxAniso);
  scene.add(batter.root);

  const plateCrew = buildCatcherAndUmpire();
  scene.add(plateCrew.grp);

  const batPivot = new THREE.Group();
  batPivot.position.set(-2.32, 3.85, 0.58);
  batPivot.scale.setScalar(0.9);
  scene.add(batPivot);

  const batGroups = {};
  for (const id of Object.keys(batSpecs)) {
    const tex = makeBatWrapTexture(id, maxAniso);
    const batGrp = buildCompositeBatGroup(batSpecs[id], tex);
    batGrp.visible = false;
    batPivot.add(batGrp);
    batGroups[id] = batGrp;
  }

  // Stitched Baseball + Shadow + Apex + Landing Ring
  const ballMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 18, 14),
    new THREE.MeshStandardMaterial({ map: ballTex, roughness: 0.42, metalness: 0.05 })
  );
  ballMesh.castShadow = true;
  ballMesh.visible = false;
  scene.add(ballMesh);

  const ballShadow = new THREE.Mesh(
    new THREE.CircleGeometry(1.15, 16),
    new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.44, depthWrite: false })
  );
  ballShadow.rotation.x = -Math.PI / 2;
  ballShadow.position.y = 0.08;
  ballShadow.visible = false;
  scene.add(ballShadow);

  const apexMarker = new THREE.Mesh(
    new THREE.OctahedronGeometry(1.2, 0),
    new THREE.MeshBasicMaterial({ color: '#fde047', wireframe: true })
  );
  apexMarker.visible = false;
  scene.add(apexMarker);

  const landingRing = new THREE.Mesh(
    new THREE.RingGeometry(1.8, 3.2, 28),
    new THREE.MeshBasicMaterial({ color: '#38bdf8', side: THREE.DoubleSide, transparent: true, opacity: 0.88 })
  );
  landingRing.rotation.x = -Math.PI / 2;
  landingRing.visible = false;
  scene.add(landingRing);

  // Zero-GC Spark Pool
  const SPARK_COUNT = 24;
  const sparks = [];
  const sparkGeom = new THREE.SphereGeometry(0.16, 6, 6);
  const sparkGroup = new THREE.Group();
  scene.add(sparkGroup);
  for (let i = 0; i < SPARK_COUNT; i++) {
    const mat = new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? '#fde047' : '#38bdf8', transparent: true, opacity: 0 });
    const mesh = new THREE.Mesh(sparkGeom, mat);
    mesh.visible = false;
    sparkGroup.add(mesh);
    sparks.push({ mesh, mat, vx: 0, vy: 0, vz: 0, life: 0 });
  }
  let lastImpactToken = 0;

  function triggerImpactBurst(x, y, z, colorHex) {
    for (let i = 0; i < SPARK_COUNT; i++) {
      const sp = sparks[i];
      const ang = (i / SPARK_COUNT) * Math.PI * 2 + Math.random() * 0.4;
      const spd = 8 + Math.random() * 14;
      sp.mesh.position.set(x, y, z);
      sp.vx = Math.cos(ang) * spd;
      sp.vy = (Math.random() - 0.15) * spd * 0.9;
      sp.vz = -Math.abs(Math.sin(ang)) * spd - 4;
      sp.life = 0.42 + Math.random() * 0.22;
      sp.mat.color.set(i % 2 === 0 ? '#fde047' : (colorHex || '#38bdf8'));
      sp.mat.opacity = 1;
      sp.mesh.visible = true;
    }
  }

  // Pre-allocated Dynamic 3D Comet Trail Ribbon
  const MAX_TRAIL_PTS = 180;
  const trailVerts = new Float32Array(MAX_TRAIL_PTS * 2 * 3);
  const trailGeom = new THREE.BufferGeometry();
  trailGeom.setAttribute('position', new THREE.BufferAttribute(trailVerts, 3));
  trailGeom.setDrawRange(0, 0);
  const trailMat = new THREE.MeshBasicMaterial({
    color: '#38bdf8',
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.86,
    depthWrite: false
  });
  const trailMesh = new THREE.Mesh(trailGeom, trailMat);
  trailMesh.frustumCulled = false;
  scene.add(trailMesh);

  function updateTrailRibbon(points, maxIdx, colorHex) {
    if (!points || maxIdx < 1) {
      trailGeom.setDrawRange(0, 0);
      return;
    }
    trailMat.color.set(colorHex || '#38bdf8');
    const count = Math.min(maxIdx + 1, MAX_TRAIL_PTS);
    const pos = trailGeom.attributes.position.array;
    const width = 0.68;

    for (let i = 0; i < count; i++) {
      const p = points[i];
      const wx = p.x;
      const wy = Math.max(0.15, p.z);
      const wz = -p.y;
      const taper = 0.22 + 0.78 * (i / Math.max(1, count - 1));
      const w = width * taper;

      pos[i * 6 + 0] = wx - w;
      pos[i * 6 + 1] = wy;
      pos[i * 6 + 2] = wz;
      pos[i * 6 + 3] = wx + w;
      pos[i * 6 + 4] = wy;
      pos[i * 6 + 5] = wz;
    }
    trailGeom.attributes.position.needsUpdate = true;
    trailGeom.setDrawRange(0, Math.max(0, (count - 1) * 6));
  }

  const trailIndices = [];
  for (let i = 0; i < MAX_TRAIL_PTS - 1; i++) {
    const a = i * 2;
    const b = i * 2 + 1;
    const c = (i + 1) * 2;
    const d = (i + 1) * 2 + 1;
    trailIndices.push(a, b, c, b, d, c);
  }
  trailGeom.setIndex(trailIndices);

  /* =========================================================
     Continuous Realistic Stadium Builder (Zero Blocky Boxes!)
     ========================================================= */
  const stadiumGroups = {};
  const windFlags = [];

  function buildStadiumGroup(stSpec) {
    const grp = new THREE.Group();
    const yellowMat = new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.36, metalness: 0.18 });
    const concreteMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.86, side: THREE.DoubleSide });
    const steelMat = new THREE.MeshStandardMaterial({ color: '#475569', metalness: 0.72, roughness: 0.34 });
    const glassMat = new THREE.MeshPhysicalMaterial({ color: '#bae6fd', transparent: true, opacity: 0.38, roughness: 0.08, side: THREE.DoubleSide });
    const warnMat = new THREE.MeshStandardMaterial({ map: dirtTex, color: '#7c4728', roughness: 0.94, side: THREE.DoubleSide });

    if (stSpec.id === 'cage') {
      // True Enclosed Pro D1 Indoor Batting Cage & HitTrax Performance Facility (Zero open gaps or ball pass-through!)
      const netMat = new THREE.MeshBasicMaterial({ map: cageNetTex, transparent: true, opacity: 0.72, side: THREE.DoubleSide, depthWrite: false });
      const glowMat = new THREE.MeshBasicMaterial({ color: '#e0f2fe' });
      const darkDeckMat = new THREE.MeshStandardMaterial({ color: '#0f1c30', roughness: 0.78, side: THREE.DoubleSide });
      const padWallMat = new THREE.MeshStandardMaterial({ color: '#142947', roughness: 0.72, side: THREE.DoubleSide });

      // Indoor Pro Hitting Turf Mat with crisp White Home-Plate Apron under Batter & Catcher
      const hitMat = new THREE.Mesh(
        new THREE.BoxGeometry(16, 0.09, 20),
        new THREE.MeshStandardMaterial({ color: '#134e2a', roughness: 0.85 })
      );
      hitMat.position.set(0, 0.045, 0);
      grp.add(hitMat);

      // Enclosed Steel Truss Portals from Behind Catcher (+18 ft) to Deep Back Wall (-296 ft)
      const cageW = 58;
      const cagePeak = 34;
      [-296, -240, -180, -120, -60, 0, 16].forEach((z) => {
        const archPts = [];
        for (let s = 0; s <= 16; s++) {
          const t = (s / 16) * 2 - 1; // -1..1
          const ax = t * cageW;
          const ay = cagePeak * (1 - 0.36 * t * t);
          if (s === 0) archPts.push(new THREE.Vector3(-cageW, 0, z));
          archPts.push(new THREE.Vector3(ax, ay, z));
          if (s === 16) archPts.push(new THREE.Vector3(cageW, 0, z));
        }
        const archCurve = new THREE.CatmullRomCurve3(archPts);
        grp.add(new THREE.Mesh(new THREE.TubeGeometry(archCurve, 28, 0.85, 8, false), steelMat));

        if (z <= 0) {
          const lightCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-34, cagePeak - 5.5, z),
            new THREE.Vector3(0, cagePeak - 1.2, z),
            new THREE.Vector3(34, cagePeak - 5.5, z)
          ]);
          grp.add(new THREE.Mesh(new THREE.TubeGeometry(lightCurve, 14, 0.42, 6, false), glowMat));
        }
      });

      // Longitudinal Ridge & Side Support Rails
      [-cageW, 0, cageW].forEach((rx) => {
        const ry = rx === 0 ? cagePeak : cagePeak * 0.64;
        const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 314, 8), steelMat);
        rail.rotation.x = Math.PI / 2;
        rail.position.set(rx, ry, -140);
        grp.add(rail);
      });

      // Full Roof Netting Vault Mesh (completely encloses top!)
      const roofPos = [];
      const roofUv = [];
      const roofIdx = [];
      const rSlices = 18;
      for (let zStep = 0; zStep <= 1; zStep++) {
        const z = zStep === 0 ? 16 : -296;
        for (let s = 0; s <= rSlices; s++) {
          const t = (s / rSlices) * 2 - 1;
          const ax = t * cageW;
          const ay = cagePeak * (1 - 0.36 * t * t);
          roofPos.push(ax, ay, z);
          roofUv.push(s / rSlices, zStep * 4);
        }
      }
      for (let s = 0; s < rSlices; s++) {
        const a = s;
        const b = s + 1;
        const c = rSlices + 1 + s;
        const d = rSlices + 1 + s + 1;
        roofIdx.push(a, c, b, b, c, d);
      }
      const roofNetGeom = new THREE.BufferGeometry();
      roofNetGeom.setAttribute('position', new THREE.Float32BufferAttribute(roofPos, 3));
      roofNetGeom.setAttribute('uv', new THREE.Float32BufferAttribute(roofUv, 2));
      roofNetGeom.setIndex(roofIdx);
      roofNetGeom.computeVertexNormals();
      grp.add(new THREE.Mesh(roofNetGeom, netMat));

      // Continuous Side Padding Base Walls (6ft tall) + Upper Side Nets all the way from +16 to -296
      [-1, 1].forEach((side) => {
        const sidePad = new THREE.Mesh(new THREE.BoxGeometry(1.4, 6.2, 314), padWallMat);
        sidePad.position.set(side * (cageW + 0.6), 3.1, -140);
        const sideNet = new THREE.Mesh(new THREE.PlaneGeometry(314, cagePeak * 0.64 - 5.5), netMat);
        sideNet.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
        sideNet.position.set(side * cageW, 5.8 + (cagePeak * 0.64 - 5.5) * 0.5, -140);
        grp.add(sidePad, sideNet);
      });

      // Enclosed Backstop Net & Wall Behind Catcher (z = +16) + Deep 296ft HitTrax Target Net & Padded Wall
      const backstopPad = new THREE.Mesh(new THREE.BoxGeometry(cageW * 2, 5.5, 1.5), padWallMat);
      backstopPad.position.set(0, 2.75, 16);
      const backstopNet = new THREE.Mesh(new THREE.PlaneGeometry(cageW * 2, cagePeak - 5), netMat);
      backstopNet.position.set(0, 5.5 + (cagePeak - 5) * 0.5, 16);

      const farWall = new THREE.Mesh(new THREE.BoxGeometry(cageW * 2 + 2, 14, 2.2), padWallMat);
      farWall.position.set(0, 7, -296);
      const farTopCap = new THREE.Mesh(new THREE.BoxGeometry(cageW * 2 + 2, 1.0, 2.5), yellowMat);
      farTopCap.position.set(0, 14.3, -296);
      const farNet = new THREE.Mesh(new THREE.PlaneGeometry(cageW * 2, cagePeak - 13), netMat);
      farNet.position.set(0, 14 + (cagePeak - 13) * 0.5, -295.5);
      grp.add(backstopPad, backstopNet, farWall, farTopCap, farNet);

      // Distance Marker Lines on Turf at 100 / 200 / 280 FT
      [100, 200, 280].forEach((d) => {
        const stripe = new THREE.Mesh(new THREE.PlaneGeometry(cageW * 1.9, 1.2), d === 280 ? yellowMat : chalkMat);
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(0, 0.06, -d);
        grp.add(stripe);
      });

      // Pro Steel Frame + Nylon Protective Pitcher L-Screen next to Mound
      const lScreen = new THREE.Group();
      lScreen.position.set(-2.9, 0.82, -55.0);
      const lPostL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 7.0, 8), steelMat);
      lPostL.position.set(-1.6, 3.5, 0);
      const lPostR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4.2, 8), steelMat);
      lPostR.position.set(1.6, 2.1, 0);
      const lNet = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 5.2), netMat);
      lNet.position.set(0, 3.6, 0);
      lScreen.add(lPostL, lPostR, lNet);
      grp.add(lScreen);

      // Dark structural ceiling exterior cladding behind netting
      const extRoof = new THREE.Mesh(roofNetGeom, darkDeckMat);
      extRoof.position.y = 0.6;
      grp.add(extRoof);

      // Physical 3D Rapsodo HITTING 2.0 Optical Camera Unit on Tripod
      const rapGrp = new THREE.Group();
      rapGrp.position.set(5.2, 0, -14.5);
      for (let t = 0; t < 3; t++) {
        const a = (t / 3) * Math.PI * 2;
        const legCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(Math.cos(a) * 0.85, 0, Math.sin(a) * 0.85),
          new THREE.Vector3(0, 2.2, 0)
        ]);
        rapGrp.add(new THREE.Mesh(new THREE.TubeGeometry(legCurve, 4, 0.04, 8, false), steelMat));
      }
      const podMat = new THREE.MeshPhysicalMaterial({ color: '#0f172a', roughness: 0.28, metalness: 0.4, clearcoat: 0.65 });
      const unitBody = new THREE.Mesh(new THREE.ExtrudeGeometry(makeRoundedRectShape(0.85, 0.45, 0.12), { depth: 0.42, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2 }), podMat);
      unitBody.position.set(0, 2.42, -0.2);
      const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.08, 16), new THREE.MeshBasicMaterial({ color: '#38bdf8' }));
      lens.rotation.x = Math.PI / 2;
      lens.position.set(0, 2.42, 0.26);
      rapGrp.add(unitBody, lens);
      grp.add(rapGrp);

      return grp;
    }

    // 1. Continuous Warning Track Strip (16 ft deep inside wall + home plate foul apron)
    const warnGeom = createSweptStripGeometry(
      (phi) => stSpec.wallDist(phi) - 16,
      (phi) => stSpec.wallDist(phi) + 1.5,
      () => 0.055,
      () => 0.065,
      -0.8,
      0.8,
      96
    );
    const warnMesh = new THREE.Mesh(warnGeom, warnMat);
    warnMesh.receiveShadow = true;
    grp.add(warnMesh);

    // 2. Continuous Swept College Outfield Wall + Smooth Coping Tube
    const wallTex =
      stSpec.id === 'omaha' ? omahaWallTex : stSpec.id === 'lsu' ? lsuWallTex : missStWallTex;
    const wallMat = new THREE.MeshStandardMaterial({
      map: wallTex,
      roughness: 0.58,
      side: THREE.DoubleSide
    });
    const wallGeom = createSweptWallGeometry(stSpec.wallDist, stSpec.wallHeight, -0.785, 0.785, 96, 3.8);
    const wallMesh = new THREE.Mesh(wallGeom, wallMat);
    wallMesh.castShadow = true;
    wallMesh.receiveShadow = true;
    grp.add(wallMesh);
    grp.add(buildTopCopingTube(stSpec.wallDist, stSpec.wallHeight, -0.785, 0.785, 96, 0.82, yellowMat));

    // Padded Foul-Territory Knee Wall & Protective Backstop Screen Behind Home Plate + Baselines
    const backstopRadius = 56;
    const backstopWallMat = new THREE.MeshStandardMaterial({
      color: stSpec.id === 'omaha' ? '#102a4e' : stSpec.id === 'lsu' ? '#3b156b' : '#5d1725',
      roughness: 0.65,
      side: THREE.DoubleSide
    });
    const backWallGeom = createSweptWallGeometry(
      () => backstopRadius,
      () => 4.5,
      Math.PI * 0.72,
      Math.PI * 1.28,
      36,
      2.0
    );
    grp.add(new THREE.Mesh(backWallGeom, backstopWallMat));
    const backNetGeom = createSweptWallGeometry(
      () => backstopRadius + 0.5,
      () => 24,
      Math.PI * 0.76,
      Math.PI * 1.24,
      28,
      0.2
    );
    grp.add(new THREE.Mesh(backNetGeom, new THREE.MeshBasicMaterial({ map: cageNetTex, transparent: true, opacity: 0.44, side: THREE.DoubleSide, depthWrite: false })));

    // Clean Foul-Line Masonry Knee Walls from Backstop to LF / RF Foul Poles
    [-1, 1].forEach((side) => {
      const poleD = stSpec.wallDist(side * 0.785);
      const px = Math.sin(side * 0.785) * poleD;
      const pz = -Math.cos(side * 0.785) * poleD;
      const sx = side * 42;
      const sz = 28;
      const wallCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(sx, 2.4, sz), new THREE.Vector3(px, 2.4, pz)]);
      grp.add(new THREE.Mesh(new THREE.TubeGeometry(wallCurve, 12, 2.2, 6, false), backstopWallMat));
    });

    // 3. Sculpted Tapered Lathe Foul Poles + Screens
    const foulPoleProfile = [
      new THREE.Vector2(0.58, 0),
      new THREE.Vector2(0.42, 36),
      new THREE.Vector2(0.28, 72),
      new THREE.Vector2(0, 72.5)
    ];
    const foulPoleGeom = new THREE.LatheGeometry(foulPoleProfile, 14);
    [-0.785, 0.785].forEach((phi) => {
      const d = stSpec.wallDist(phi);
      const pole = new THREE.Mesh(foulPoleGeom, yellowMat);
      pole.position.set(Math.sin(phi) * d, 0, -Math.cos(phi) * d);
      const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(3.2, 54),
        new THREE.MeshBasicMaterial({ color: '#fde047', side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
      );
      screen.position.set(Math.sin(phi) * (d - 1.6), 38, -Math.cos(phi) * (d - 1.6));
      screen.rotation.y = phi;
      grp.add(pole, screen);
    });

    // 4. Completely EMPTY 3D Stepped Concrete College Grandstands + 3D Instanced Stadium Chairs & Bleachers
    const seatsTex =
      stSpec.id === 'omaha' ? omahaSeatsTex : stSpec.id === 'lsu' ? lsuSeatsTex : missStSeatsTex;
    const seatsMat = new THREE.MeshStandardMaterial({ map: seatsTex, roughness: 0.78, side: THREE.DoubleSide });
    const railMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.68, roughness: 0.28 });
    const chairHex =
      stSpec.id === 'omaha' ? '#1d4ed8' : stSpec.id === 'lsu' ? '#581c87' : '#6b1829';
    const chairMat = new THREE.MeshStandardMaterial({ color: chairHex, roughness: 0.42, metalness: 0.12 });

    const tierConfigs =
      stSpec.id === 'omaha'
        ? [
            { startPhi: -0.78, endPhi: 0.78, dOff: 12, dSpan: 48, y0: 9, y1: 31, steps: 8 },
            { startPhi: -0.78, endPhi: -0.22, dOff: 66, dSpan: 36, y0: 37, y1: 54, steps: 6 },
            { startPhi: 0.22, endPhi: 0.78, dOff: 66, dSpan: 36, y0: 37, y1: 54, steps: 6 }
          ]
        : stSpec.id === 'lsu'
          ? [
              { startPhi: -0.78, endPhi: 0.78, dOff: 10, dSpan: 50, y0: 10, y1: 34, steps: 8 },
              { startPhi: -0.78, endPhi: 0.78, dOff: 66, dSpan: 38, y0: 39, y1: 57, steps: 6 }
            ]
          : [
              { startPhi: -0.76, endPhi: -0.18, dOff: 10, dSpan: 44, y0: 12, y1: 34, steps: 6, isLounge: true },
              { startPhi: 0.18, endPhi: 0.76, dOff: 10, dSpan: 46, y0: 10, y1: 32, steps: 7 },
              { startPhi: -0.78, endPhi: 0.78, dOff: 62, dSpan: 40, y0: 38, y1: 58, steps: 6 }
            ];

    // Collect 3D Contoured Seat Placements across every tier so balls visibly land in real 3D seats
    const seatTransforms = [];
    for (const tc of tierConfigs) {
      const steps = tc.steps || 6;
      const stepD = tc.dSpan / steps;
      const stepH = (tc.y1 - tc.y0) / steps;
      for (let s = 0; s < steps; s++) {
        const dIn = tc.dOff + s * stepD;
        const dOut = dIn + stepD;
        const yStep = tc.y0 + s * stepH;
        const tread = createSweptStripGeometry(
          (phi) => stSpec.wallDist(clamp(phi, -0.785, 0.785)) + dIn,
          (phi) => stSpec.wallDist(clamp(phi, -0.785, 0.785)) + dOut,
          () => yStep,
          () => yStep + 0.35,
          tc.startPhi,
          tc.endPhi,
          44
        );
        const treadMesh = new THREE.Mesh(tread, seatsMat);
        treadMesh.receiveShadow = true;
        grp.add(treadMesh);

        // Place actual 3D molded stadium chairs along concrete steps (every ~7.5ft arc spacing for crisp read & low draw cost)
        const dMid = dIn + stepD * 0.52;
        const nChairs = Math.max(12, Math.floor((tc.endPhi - tc.startPhi) * 42));
        for (let ci = 1; ci < nChairs; ci++) {
          if (ci % 9 === 0) continue; // concrete walking aisle
          const phi = tc.startPhi + (ci / nChairs) * (tc.endPhi - tc.startPhi);
          const dist = stSpec.wallDist(clamp(phi, -0.785, 0.785)) + dMid;
          seatTransforms.push({ x: Math.sin(phi) * dist, y: yStep + 1.4, z: -Math.cos(phi) * dist, ry: -phi });
        }

        if (s > 0) {
          const riserGeom = createSweptWallGeometry(
            (phi) => stSpec.wallDist(clamp(phi, -0.785, 0.785)) + dIn,
            () => stepH + 0.35,
            tc.startPhi,
            tc.endPhi,
            38,
            0.8
          );
          const riserMesh = new THREE.Mesh(riserGeom, concreteMat);
          riserMesh.position.y = yStep - stepH;
          grp.add(riserMesh);
        }
      }

      // Front Fascia Wall + Top Anodized Aluminum Safety Rail
      const fasciaGeom = createSweptWallGeometry(
        (phi) => stSpec.wallDist(clamp(phi, -0.785, 0.785)) + tc.dOff,
        () => tc.y0 + 1.2,
        tc.startPhi,
        tc.endPhi,
        44,
        2.0
      );
      grp.add(new THREE.Mesh(fasciaGeom, concreteMat));
      grp.add(
        buildTopCopingTube(
          (phi) => stSpec.wallDist(clamp(phi, -0.785, 0.785)) + tc.dOff,
          () => tc.y0 + 2.4,
          tc.startPhi,
          tc.endPhi,
          38,
          0.32,
          railMat
        )
      );

      if (tc.isLounge) {
        const glassRailGeom = createSweptWallGeometry(
          (phi) => stSpec.wallDist(clamp(phi, -0.785, 0.785)) + tc.dOff - 1.5,
          () => tc.y0 + 3.8,
          tc.startPhi,
          tc.endPhi,
          36,
          0.35
        );
        grp.add(new THREE.Mesh(glassRailGeom, glassMat));
      }
    }

    // Add real 3D Empty Infield & Home-Plate Grandstand Tiers wrapping behind 1B / Home / 3B!
    const infSteps = 7;
    for (let s = 0; s < infSteps; s++) {
      const rIn = 60 + s * 6.5;
      const rOut = rIn + 6.5;
      const yInf = 4.5 + s * 3.1;
      const infTread = createSweptStripGeometry(
        () => rIn,
        () => rOut,
        () => yInf,
        () => yInf + 0.25,
        Math.PI * 0.64,
        Math.PI * 1.36,
        36
      );
      grp.add(new THREE.Mesh(infTread, seatsMat));
    }

    if (seatTransforms.length > 0) {
      const chairShape = makeRoundedRectShape(2.4, 2.3, 0.45);
      const chairGeom = new THREE.ExtrudeGeometry(chairShape, {
        depth: 0.48,
        bevelEnabled: true,
        bevelThickness: 0.08,
        bevelSize: 0.08,
        bevelSegments: 2
      });
      const chairInst = new THREE.InstancedMesh(chairGeom, chairMat, seatTransforms.length);
      const cDummy = new THREE.Object3D();
      seatTransforms.forEach((stf, idx) => {
        cDummy.position.set(stf.x, stf.y, stf.z);
        cDummy.rotation.set(0.14, stf.ry, 0);
        cDummy.updateMatrix();
        chairInst.setMatrixAt(idx, cDummy.matrix);
      });
      chairInst.instanceMatrix.needsUpdate = true;
      chairInst.computeBoundingSphere();
      grp.add(chairInst);
    }

    // 5. Foul Territory Warmup Bullpen Mounds & Plates (NO floating diagonal wing ramps!)
    [-1, 1].forEach((side) => {
      const bpMound = new THREE.Mesh(new THREE.LatheGeometry(moundPts, 20), dirtMat);
      bpMound.scale.set(0.65, 0.72, 0.65);
      bpMound.position.set(side * 124, 0, -108);
      const bpPlate = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.45), baseMat);
      bpPlate.rotation.x = -Math.PI / 2;
      bpPlate.position.set(side * 124, 0.62, -108);
      grp.add(bpMound, bpPlate);
    });

    // 6. Sculpted D1 LED Stadium Light Towers
    grp.add(buildStadiumLightTowers(stSpec, [-0.64, -0.35, -0.1, 0.1, 0.35, 0.64], concreteMat, steelMat));

    // 7. Sculpted College Videoboard + Park Architectural Landmarks + Natural Groves
    const boardTex =
      stSpec.id === 'omaha' ? omahaBoardTex : stSpec.id === 'lsu' ? lsuBoardTex : missStBoardTex;
    const frameColor =
      stSpec.id === 'omaha' ? '#0f284e' : stSpec.id === 'lsu' ? '#3b156b' : '#4a121e';
    const sbGrp = new THREE.Group();
    sbGrp.position.set(0, 56, -455);
    const sbFrame = new THREE.Mesh(
      new THREE.ExtrudeGeometry(makeRoundedRectShape(92, 46, 4.5), { depth: 4, bevelEnabled: true, bevelThickness: 0.8, bevelSize: 0.8, bevelSegments: 3 }),
      new THREE.MeshStandardMaterial({ color: frameColor, roughness: 0.42 })
    );
    const sbFace = new THREE.Mesh(new THREE.PlaneGeometry(84, 40), new THREE.MeshBasicMaterial({ map: boardTex }));
    sbFace.position.z = 4.3;
    const sbPylonL = new THREE.Mesh(new THREE.CapsuleGeometry(1.6, 42, 6, 12), concreteMat);
    sbPylonL.position.set(-24, -34, 2);
    const sbPylonR = sbPylonL.clone();
    sbPylonR.position.x = 24;
    sbGrp.add(sbFrame, sbFace, sbPylonL, sbPylonR);
    grp.add(sbGrp);

    const trunkMat = new THREE.MeshStandardMaterial({ color: '#4b3626', roughness: 0.92 });
    const leafMat = new THREE.MeshStandardMaterial({ roughness: 0.8 });

    if (stSpec.id === 'missst') {
      // Sculpted Multi-Tier Left Field Lounge Terraced Steel Rig Decks + Starkville Pine Grove
      const deckMat = new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.6, metalness: 0.35 });
      const canopyMat = new THREE.MeshStandardMaterial({ color: '#5d1725', roughness: 0.55 });
      for (let tier = 0; tier < 2; tier++) {
        const yFloor = 16 + tier * 10;
        const deck = new THREE.Mesh(
          createSweptStripGeometry(
            (phi) => stSpec.wallDist(phi) + 12 + tier * 14,
            (phi) => stSpec.wallDist(phi) + 24 + tier * 14,
            () => yFloor,
            () => yFloor + 0.5,
            -0.75,
            -0.25,
            24
          ),
          deckMat
        );
        const canopy = new THREE.Mesh(
          createSweptStripGeometry(
            (phi) => stSpec.wallDist(phi) + 12 + tier * 14,
            (phi) => stSpec.wallDist(phi) + 24 + tier * 14,
            () => yFloor + 7.5,
            () => yFloor + 8.5,
            -0.75,
            -0.25,
            24
          ),
          canopyMat
        );
        grp.add(deck, canopy);
      }
      grp.add(
        buildNaturalPineOrOakGrove(
          [[-320, -340], [-255, -420], [-165, -468], [165, -468], [260, -415], [328, -330], [-360, -260], [360, -260]],
          trunkMat,
          leafMat,
          true
        )
      );
    } else if (stSpec.id === 'omaha') {
      // Curved CWS Architectural Canopy Fascia + Distant Downtown Omaha Skyline Towers
      const cwsCanopy = new THREE.Mesh(
        createSweptStripGeometry(
          (phi) => stSpec.wallDist(clamp(phi, -0.785, 0.785)) + 56,
          (phi) => stSpec.wallDist(clamp(phi, -0.785, 0.785)) + 98,
          () => 58,
          () => 62,
          -0.88,
          0.88,
          64
        ),
        new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.42, side: THREE.DoubleSide })
      );
      grp.add(cwsCanopy);

      const towerMat = new THREE.MeshPhysicalMaterial({ color: '#1e293b', roughness: 0.25, metalness: 0.6, clearcoat: 0.5 });
      [
        [-240, -560, 44, 140],
        [-145, -595, 52, 185],
        [150, -585, 48, 165],
        [245, -550, 40, 128]
      ].forEach(([tx, tz, tw, th]) => {
        const bldg = new THREE.Mesh(
          new THREE.ExtrudeGeometry(makeRoundedRectShape(tw, tw * 0.75, 4), { depth: th, bevelEnabled: true, bevelThickness: 1.5, bevelSize: 1.5, bevelSegments: 2 }),
          towerMat
        );
        bldg.rotation.x = -Math.PI / 2;
        bldg.position.set(tx, 0, tz);
        grp.add(bldg);
      });
    } else if (stSpec.id === 'lsu') {
      // LSU Intimidator Gold Championship Ribbon Deck + Surrounding Louisiana Live Oaks
      const ribbon = new THREE.Mesh(
        createSweptWallGeometry((phi) => stSpec.wallDist(clamp(phi, -0.785, 0.785)) + 64, () => 4.2, -0.82, 0.82, 56, 1.5),
        new THREE.MeshStandardMaterial({ color: '#fdd023', roughness: 0.4, metalness: 0.2 })
      );
      ribbon.position.y = 35;
      grp.add(ribbon);
      grp.add(
        buildNaturalPineOrOakGrove(
          [[-310, -350], [-235, -430], [-145, -475], [145, -475], [240, -425], [315, -340], [-355, -245], [355, -245]],
          trunkMat,
          leafMat,
          false
        )
      );
    }

    // Centerfield Wind Pennant Flag Mast on Stadium Rim
    const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.48, 24, 10), steelMat);
    flagPole.position.set(48, 34, -445);
    const flagPivot = new THREE.Group();
    flagPivot.position.set(48, 44, -445);
    const flagMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 5.5),
      new THREE.MeshBasicMaterial({ color: '#facc15', side: THREE.DoubleSide })
    );
    flagMesh.position.set(8, 0, 0);
    flagPivot.add(flagMesh);
    grp.add(flagPole, flagPivot);
    windFlags.push(flagPivot);

    return grp;
  }

  for (const sid of Object.keys(stadiumSpecs)) {
    const g = buildStadiumGroup(stadiumSpecs[sid]);
    g.visible = false;
    scene.add(g);
    stadiumGroups[sid] = g;
  }

  /* =========================================================
     Pre-Allocated Camera & State Sync API (3 Views)
     ========================================================= */
  const _camTargetPos = new THREE.Vector3();
  const _camTargetLook = new THREE.Vector3();
  const _camCurLook = new THREE.Vector3(0, 3.1, -55);
  const _projVec = new THREE.Vector3();
  const _batUp = new THREE.Vector3(0, 1, 0);
  const _batDown = new THREE.Vector3(0, -1, 0);
  const _batKnob = new THREE.Vector3();
  const _batDir = new THREE.Vector3();
  const _batHandsLocal = new THREE.Vector3();
  const _armVec = new THREE.Vector3();
  const _armDir = new THREE.Vector3();
  const _armQuat = new THREE.Quaternion();
  const _elbowVec = new THREE.Vector3();
  const _elbowDir = new THREE.Vector3();
  const _batStanceK = new THREE.Vector3(-2.46, 4.18, 0.62);
  const _batStanceD = new THREE.Vector3(-0.18, 0.94, 0.29).normalize();
  const _batSlotK = new THREE.Vector3(-2.55, 3.24, 0.72);
  const _batSlotD = new THREE.Vector3(-0.34, 0.36, 0.87).normalize();
  const _batFollowK = new THREE.Vector3(-2.36, 4.12, -0.68);
  const _batFollowD = new THREE.Vector3(-0.56, 0.56, -0.61).normalize();
  const _batContactK = new THREE.Vector3();
  const _batContactD = new THREE.Vector3();

  let curStadiumId = '';
  let curBatId = '';
  let curCameraMode = 'pov'; // 'pov' | 'broadcast' | 'side'

  function setStadium(id) {
    const aliasMap = { fenway: 'omaha', wrigley: 'lsu', dodger: 'missst' };
    const resolvedId = stadiumGroups[id] ? id : aliasMap[id] || 'omaha';
    if (curStadiumId === resolvedId) return;
    curStadiumId = resolvedId;
    for (const k of Object.keys(stadiumGroups)) {
      stadiumGroups[k].visible = k === resolvedId;
    }
    const st = stadiumSpecs[resolvedId] || stadiumSpecs.omaha;
    paintSky(st.skyTop, st.skyMid, st.skyLow);
  }

  function setBat(id) {
    if (curBatId === id) return;
    curBatId = id;
    for (const k of Object.keys(batGroups)) {
      batGroups[k].visible = k === id;
    }
  }

  function setCameraMode(mode) {
    if (mode === 'pov' || mode === 'broadcast' || mode === 'side') {
      curCameraMode = mode;
    }
  }

  setStadium('omaha');
  setBat('goods-2026');

  function resize(width, height) {
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function projectWorldToNorm(wx, wy, wz) {
    _projVec.set(wx, wy, wz).project(camera);
    return {
      nx: (_projVec.x + 1) * 0.5,
      ny: (1 - _projVec.y) * 0.5
    };
  }

  function smoothStep(edge0, edge1, x) {
    const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  }

  function updateAndRender(simState, dt) {
    // Fluid Multi-Phase Pitcher Biomechanics (Balance Leg Lift -> Stride & Hip-Shoulder Coil -> High 3/4 Whip)
    if (simState.phase === 'windup') {
      const p = clamp(simState.t, 0, 1);
      const lift = smoothStep(0.0, 0.44, p);
      const drop = smoothStep(0.42, 0.85, p);
      const whip = smoothStep(0.62, 1.0, p);

      pitcher.leftLegPivot.rotation.x = -lift * 1.12 + drop * 1.48;
      pitcher.leftKneePivot.rotation.x = lift * 1.32 - drop * 1.12;
      pitcher.rightKneePivot.rotation.x = 0.12 + drop * 0.32;
      pitcher.torsoPivot.rotation.y = -0.34 * lift + 0.52 * whip;
      pitcher.torsoPivot.rotation.x = 0.24 * whip;
      pitcher.throwArmPivot.rotation.x = -whip * 2.55 + Math.sin(whip * Math.PI) * 0.45;
      pitcher.throwArmPivot.rotation.z = -0.25 * drop + 0.15 * whip;
      pitcher.throwElbowPivot.rotation.x = -0.95 * Math.sin(p * Math.PI);
      pitcher.gloveArmPivot.rotation.x = -0.52 * lift + 0.18 * whip;
      pitcher.gloveElbowPivot.rotation.x = -0.82;
      pitcher.root.position.z = -60.5 + drop * 4.8;
      pitcher.handBall.visible = p < 0.96;
    } else if (simState.phase === 'pitch') {
      pitcher.leftLegPivot.rotation.x = THREE.MathUtils.damp(pitcher.leftLegPivot.rotation.x, 0.28, 12, dt);
      pitcher.leftKneePivot.rotation.x = THREE.MathUtils.damp(pitcher.leftKneePivot.rotation.x, 0.14, 12, dt);
      pitcher.rightKneePivot.rotation.x = THREE.MathUtils.damp(pitcher.rightKneePivot.rotation.x, 0.2, 12, dt);
      pitcher.torsoPivot.rotation.y = THREE.MathUtils.damp(pitcher.torsoPivot.rotation.y, 0.24, 10, dt);
      pitcher.torsoPivot.rotation.x = THREE.MathUtils.damp(pitcher.torsoPivot.rotation.x, 0.18, 10, dt);
      pitcher.throwArmPivot.rotation.x = THREE.MathUtils.damp(pitcher.throwArmPivot.rotation.x, 1.24, 14, dt);
      pitcher.throwElbowPivot.rotation.x = THREE.MathUtils.damp(pitcher.throwElbowPivot.rotation.x, -0.24, 12, dt);
      pitcher.gloveArmPivot.rotation.x = THREE.MathUtils.damp(pitcher.gloveArmPivot.rotation.x, -0.25, 10, dt);
      pitcher.gloveElbowPivot.rotation.x = THREE.MathUtils.damp(pitcher.gloveElbowPivot.rotation.x, -0.95, 10, dt);
      pitcher.root.position.z = THREE.MathUtils.damp(pitcher.root.position.z, -56.6, 12, dt);
      pitcher.handBall.visible = false;
    } else {
      pitcher.leftLegPivot.rotation.x = THREE.MathUtils.damp(pitcher.leftLegPivot.rotation.x, 0, 7, dt);
      pitcher.leftKneePivot.rotation.x = THREE.MathUtils.damp(pitcher.leftKneePivot.rotation.x, 0.08, 7, dt);
      pitcher.rightKneePivot.rotation.x = THREE.MathUtils.damp(pitcher.rightKneePivot.rotation.x, 0.06, 7, dt);
      pitcher.torsoPivot.rotation.y = THREE.MathUtils.damp(pitcher.torsoPivot.rotation.y, 0, 7, dt);
      pitcher.torsoPivot.rotation.x = THREE.MathUtils.damp(pitcher.torsoPivot.rotation.x, 0, 7, dt);
      pitcher.throwArmPivot.rotation.x = THREE.MathUtils.damp(pitcher.throwArmPivot.rotation.x, 0.12, 7, dt);
      pitcher.throwArmPivot.rotation.z = THREE.MathUtils.damp(pitcher.throwArmPivot.rotation.z, 0, 7, dt);
      pitcher.throwElbowPivot.rotation.x = THREE.MathUtils.damp(pitcher.throwElbowPivot.rotation.x, -0.35, 7, dt);
      pitcher.gloveArmPivot.rotation.x = THREE.MathUtils.damp(pitcher.gloveArmPivot.rotation.x, -0.32, 7, dt);
      pitcher.gloveElbowPivot.rotation.x = THREE.MathUtils.damp(pitcher.gloveElbowPivot.rotation.x, -0.6, 7, dt);
      pitcher.root.position.z = THREE.MathUtils.damp(pitcher.root.position.z, -60.5, 5, dt);
      pitcher.handBall.visible = true;
    }

    const swingRaw = clamp((simState.swingAngle + 0.42) / 1.37, 0, 1);
    const hideClosePlateCrew = curCameraMode === 'pov' && simState.camT > 0.74;
    batPivot.visible = !hideClosePlateCrew;
    batter.root.visible = !hideClosePlateCrew;
    plateCrew.grp.visible = !hideClosePlateCrew;

    const pitchLoad = simState.phase === 'windup' ? smoothStep(0, 1, simState.t) * 0.28 : 0;
    batter.torsoPivot.rotation.y = THREE.MathUtils.damp(batter.torsoPivot.rotation.y, -0.2 - pitchLoad + swingRaw * 1.54, 18, dt);
    batter.strideLegPivot.rotation.x = THREE.MathUtils.damp(batter.strideLegPivot.rotation.x, pitchLoad * 0.56 - swingRaw * 0.24, 16, dt);
    batter.strideKneePivot.rotation.x = THREE.MathUtils.damp(batter.strideKneePivot.rotation.x, pitchLoad * 0.42 + 0.1, 16, dt);
    batter.backKneePivot.rotation.x = THREE.MathUtils.damp(batter.backKneePivot.rotation.x, 0.16 + swingRaw * 0.22, 16, dt);

    // Exact Vector Bat-to-Ball Contact Kinematics:
    // Bat sweet spot (2.35 world units from knob along +Y) physically collides with (swingTargetX, swingTargetY, 0) at swingRaw = 0.569!
    const sweetLen = 2.35;
    const tx = clamp(simState.swingTargetX != null ? simState.swingTargetX : 0, -0.95, 0.95);
    const ty = clamp(simState.swingTargetY != null ? simState.swingTargetY : 2.65, 1.55, 3.75);
    const kxC = clamp(tx - 2.26, -2.62, -1.45);
    const kyC = clamp(ty - 0.25, 1.45, 3.5);
    const dxC = tx - kxC;
    const dyC = ty - kyC;
    const remSq = Math.max(0.02, sweetLen * sweetLen - dxC * dxC - dyC * dyC);
    const kzC = Math.sqrt(remSq);
    _batContactK.set(kxC, kyC, kzC);
    _batContactD.set(dxC, dyC, -kzC).normalize();

    const sContact = 0.569343; // exact match for resolveSwing() sim.swingAngle = 0.36
    const sSlot = 0.26;
    if (swingRaw <= sSlot) {
      const u = smoothStep(0, sSlot, swingRaw);
      _batKnob.lerpVectors(_batStanceK, _batSlotK, u);
      _batDir.lerpVectors(_batStanceD, _batSlotD, u).normalize();
    } else if (swingRaw <= sContact) {
      const u = smoothStep(sSlot, sContact, swingRaw);
      _batKnob.lerpVectors(_batSlotK, _batContactK, u);
      _batDir.lerpVectors(_batSlotD, _batContactD, u).normalize();
    } else {
      const u = smoothStep(sContact, 1.0, swingRaw);
      _batKnob.lerpVectors(_batContactK, _batFollowK, u);
      _batDir.lerpVectors(_batContactD, _batFollowD, u).normalize();
    }

    batPivot.position.copy(_batKnob);
    batPivot.quaternion.setFromUnitVectors(_batUp, _batDir);

    // Glue batter's hands directly to the bat grip + dynamically aim upper/forearms smoothly via 2-bone elbow IK!
    batter.torsoPivot.updateMatrixWorld(true);
    _batHandsLocal.copy(_batKnob).addScaledVector(_batDir, 0.34);
    batter.torsoPivot.worldToLocal(_batHandsLocal);
    batter.handsGroup.position.copy(_batHandsLocal);

    const aimArmToGrip = (armPivot, elbowPivot, gripOffsetY, elbowPushZ) => {
      _armVec.copy(_batHandsLocal).sub(armPivot.position);
      _armVec.y += gripOffsetY;
      _armVec.z += elbowPushZ;
      const reach = _armVec.length();
      if (reach > 0.05) {
        _armDir.copy(_armVec).multiplyScalar(1 / reach);
        _armQuat.setFromUnitVectors(_batDown, _armDir);
        armPivot.quaternion.copy(_armQuat);
        elbowPivot.position.set(0, -Math.min(0.84, reach * 0.52), 0);
        _elbowVec.set(0, Math.min(0.82, Math.max(0.25, reach * 0.52)), 0);
        _elbowDir.copy(_elbowVec).normalize();
        elbowPivot.quaternion.setFromUnitVectors(_batDown, _batDown);
      }
    };
    aimArmToGrip(batter.topArm, batter.topElbow, 0.1, 0.14);
    aimArmToGrip(batter.bottomArm, batter.botElbow, -0.1, -0.1);

    if (simState.phase === 'pitch' && simState.pitchPos) {
      plateCrew.mitt.position.x = THREE.MathUtils.damp(plateCrew.mitt.position.x, clamp(simState.pitchPos.x, -1.2, 1.2), 14, dt);
      plateCrew.mitt.position.y = THREE.MathUtils.damp(plateCrew.mitt.position.y, clamp(simState.pitchPos.y, 1.4, 3.8), 14, dt);
    } else {
      plateCrew.mitt.position.x = THREE.MathUtils.damp(plateCrew.mitt.position.x, 0, 8, dt);
      plateCrew.mitt.position.y = THREE.MathUtils.damp(plateCrew.mitt.position.y, 2.45, 8, dt);
    }

    if (simState.impactBurstId && simState.impactBurstId !== lastImpactToken) {
      lastImpactToken = simState.impactBurstId;
      const ip = simState.impactPos || { x: 0, y: 2.6, z: 0 };
      triggerImpactBurst(ip.x, ip.y, ip.z, simState.flightColor);
    }
    for (let i = 0; i < SPARK_COUNT; i++) {
      const sp = sparks[i];
      if (sp.life > 0) {
        sp.life -= dt;
        sp.mesh.position.x += sp.vx * dt;
        sp.mesh.position.y += sp.vy * dt;
        sp.mesh.position.z += sp.vz * dt;
        sp.vy -= 28 * dt;
        sp.mat.opacity = clamp(sp.life * 2.2, 0, 1);
        if (sp.life <= 0) sp.mesh.visible = false;
      }
    }

    const wDir = simState.windVec || { x: 0, y: 0 };
    const wAngle = Math.hypot(wDir.x, wDir.y) > 0.5 ? Math.atan2(wDir.x, -wDir.y) : -0.35;
    const flutter = Math.sin(performance.now() * 0.009) * 0.14;
    for (let i = 0; i < windFlags.length; i++) {
      windFlags[i].rotation.y = wAngle + flutter;
    }

    let followX = 0;
    let followY = 3.1;
    let followZ = -55;

    if (simState.phase === 'pitch' && simState.pitchPos) {
      ballMesh.visible = true;
      ballShadow.visible = true;
      apexMarker.visible = false;
      landingRing.visible = false;
      ballMesh.position.set(simState.pitchPos.x, simState.pitchPos.y, simState.pitchPos.z);
      ballMesh.rotation.x -= dt * 38;
      ballMesh.rotation.z += dt * 16;
      ballShadow.position.set(simState.pitchPos.x, 0.08, simState.pitchPos.z);
      ballShadow.scale.set(0.85, 0.85, 1);
      trailGeom.setDrawRange(0, 0);
    } else if (simState.phase === 'flight' && simState.flightCur) {
      const cur = simState.flightCur;
      const bx = cur.x;
      const by = Math.max(0.32, cur.z);
      const bz = -cur.y;

      const fl = simState.flight;
      const spinRad = fl && fl.backspinRpm != null ? (fl.backspinRpm * 2 * Math.PI) / 60 : 210;
      const sideRad = fl && fl.sidespinRpm != null ? (fl.sidespinRpm * 2 * Math.PI) / 60 : 0;
      ballMesh.visible = true;
      ballShadow.visible = true;
      ballMesh.position.set(bx, by, bz);
      ballMesh.rotation.x += dt * Math.max(-45, Math.min(45, spinRad * 0.18));
      ballMesh.rotation.y -= dt * Math.max(-25, Math.min(25, sideRad * 0.18));
      ballShadow.position.set(bx, 0.08, bz);
      const shScale = clamp(1 + by * 0.028, 1, 3.0);
      ballShadow.scale.set(shScale, shScale, 1);

      updateTrailRibbon(simState.flightPoints, simState.flightMaxIdx, simState.flightColor);

      if (fl && fl.apexPos && fl.playTime >= (fl.apexTime || 99)) {
        apexMarker.visible = true;
        apexMarker.position.set(fl.apexPos.x, fl.apexPos.z, -fl.apexPos.y);
        apexMarker.rotation.y += dt * 2.5;
      } else {
        apexMarker.visible = false;
      }

      if (fl && fl.points && fl.points.length > 0 && fl.playTime >= fl.totalTime * 0.92) {
        const lastPt = fl.points[fl.points.length - 1];
        landingRing.visible = true;
        landingRing.position.set(lastPt.x, Math.max(0.15, lastPt.z), -lastPt.y);
        landingRing.material.color.set(fl.color || '#38bdf8');
      } else {
        landingRing.visible = false;
      }

      followX = bx * 0.72;
      followY = Math.max(12, by * 0.85);
      followZ = bz * 0.86;
    } else {
      ballMesh.visible = false;
      ballShadow.visible = false;
      apexMarker.visible = false;
      landingRing.visible = false;
      trailGeom.setDrawRange(0, 0);
    }

    if (simState.phase === 'flight' && simState.flightCur && simState.flightFair && curCameraMode !== 'side') {
      const cur = simState.flightCur;
      const distOut = Math.hypot(cur.x, cur.y);
      const chaseFactor = clamp(distOut / 220, 0, 1);
      if (curCameraMode === 'broadcast') {
        _camTargetPos.set(cur.x * 0.18 + 3.5, 22 + cur.z * 0.35 + chaseFactor * 14, 24 - distOut * 0.1);
      } else {
        _camTargetPos.set(cur.x * 0.22, 15 + cur.z * 0.45 + chaseFactor * 16, 19 - distOut * 0.14);
      }
      _camTargetLook.set(followX, Math.max(8, followY * 0.82), Math.min(-35, followZ));
    } else if (curCameraMode === 'broadcast') {
      _camTargetPos.set(3.2, 14.5, 29.5);
      _camTargetLook.set(0, 4.2, -95);
    } else if (curCameraMode === 'side') {
      if (simState.phase === 'flight' && simState.flightCur) {
        const cur = simState.flightCur;
        _camTargetPos.set(17.5, 6.2 + cur.z * 0.22, -2.5);
        _camTargetLook.set(cur.x * 0.55, Math.max(3, cur.z * 0.65), -Math.max(12, cur.y * 0.75));
      } else {
        _camTargetPos.set(15.2, 4.3, -3.2);
        _camTargetLook.set(-1.6, 3.0, 0.2);
      }
    } else {
      _camTargetPos.set(0.22, 4.9, 14.5);
      _camTargetLook.set(0, 3.1, -55);
    }

    const dampK = simState.phase === 'flight' ? 4.8 : 6.0;
    camera.position.x = THREE.MathUtils.damp(camera.position.x, _camTargetPos.x, dampK, dt);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, _camTargetPos.y, dampK, dt);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, _camTargetPos.z, dampK, dt);

    _camCurLook.x = THREE.MathUtils.damp(_camCurLook.x, _camTargetLook.x, dampK + 1.5, dt);
    _camCurLook.y = THREE.MathUtils.damp(_camCurLook.y, _camTargetLook.y, dampK + 1.5, dt);
    _camCurLook.z = THREE.MathUtils.damp(_camCurLook.z, _camTargetLook.z, dampK + 1.5, dt);
    camera.lookAt(_camCurLook);

    renderer.render(scene, camera);
  }

  return {
    isSoftwareGl,
    setStadium,
    setBat,
    setCameraMode,
    resize,
    projectWorldToNorm,
    updateAndRender
  };
}

window.createStadium3DEngine = createStadium3DEngine;
window.dispatchEvent(new CustomEvent('diamondiq-3d-ready'));
