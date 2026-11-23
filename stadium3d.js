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
  c.width = 1024;
  c.height = 1024;
  const ctx = c.getContext('2d');

  const bands = 14;
  const bw = c.width / bands;
  for (let i = 0; i < bands; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#186636' : '#268e4d';
    ctx.fillRect(i * bw, 0, bw, c.height);
  }
  ctx.globalAlpha = 0.19;
  for (let y = 0; y < bands; y++) {
    ctx.fillStyle = y % 2 === 0 ? '#0b381d' : '#4ade80';
    ctx.fillRect(0, y * bw, c.width, bw);
  }
  // Fine Kentucky bluegrass blade micro-grain
  ctx.globalAlpha = 0.22;
  for (let i = 0; i < 11000; i++) {
    const x = (i * 97) % 1024;
    const y = (i * 193) % 1024;
    ctx.fillStyle = i % 3 === 0 ? '#0f4222' : i % 3 === 1 ? '#86efac' : '#217c44';
    ctx.fillRect(x, y, 2, 3);
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(14, 14);
  tex.anisotropy = maxAniso;
  return tex;
}

function makeDirtTexture(maxAniso, hexA = '#bf7440', hexB = '#8e4d23') {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = hexA;
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 8200; i++) {
    const x = (i * 67) % 512;
    const y = (i * 131) % 512;
    ctx.fillStyle = i % 4 === 0 ? hexB : i % 4 === 1 ? '#dc955f' : '#a15a2d';
    ctx.globalAlpha = i % 4 === 0 ? 0.34 : 0.2;
    ctx.fillRect(x, y, 2 + (i % 2), 2);
  }
  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(7, 7);
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

  const rows = 8;
  const rowH = c.height / rows;
  const cols = 28;
  const colW = c.width / cols;

  for (let r = 0; r < rows; r++) {
    const y = r * rowH;
    const riserGrad = ctx.createLinearGradient(0, y, 0, y + rowH);
    riserGrad.addColorStop(0, 'rgba(0,0,0,0.48)');
    riserGrad.addColorStop(0.28, concreteHex);
    riserGrad.addColorStop(1, 'rgba(0,0,0,0.28)');
    ctx.fillStyle = riserGrad;
    ctx.fillRect(0, y, 512, rowH);

    for (let col = 0; col < cols; col++) {
      const x = col * colW;
      if (col % 14 === 0) {
        // Vertical concrete stair aisle with yellow safety nosing ticks on aisle only
        ctx.fillStyle = '#334155';
        ctx.fillRect(x, y, colW, rowH);
        ctx.fillStyle = trimHex;
        ctx.fillRect(x + 2, y + rowH - 3, colW - 4, 2);
        continue;
      }

      const sx = x + 1.8;
      const sw = colW - 3.6;
      const sh = rowH - 7;
      const sy = y + 4;
      ctx.fillStyle = seatHex;
      ctx.beginPath();
      ctx.roundRect(sx, sy, sw, sh, 2.5);
      ctx.fill();

      ctx.fillStyle = 'rgba(0,0,0,0.34)';
      ctx.fillRect(sx + 1, sy + sh - 4, sw - 2, 3.5);
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(7, 1.5);
  tex.anisotropy = maxAniso;
  return tex;
}

function makeMasonryTexture(baseHex, mortarHex, isAshlarStone, maxAniso) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = mortarHex;
  ctx.fillRect(0, 0, 512, 256);

  const rows = isAshlarStone ? 6 : 12;
  const cols = isAshlarStone ? 8 : 16;
  const rh = 256 / rows;
  const cw = 512 / cols;
  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (cw * 0.5);
    for (let col = -1; col <= cols; col++) {
      const shade = ((r * 7 + col * 13) % 5) - 2;
      ctx.fillStyle = baseHex;
      ctx.fillRect(col * cw + offset + 2, r * rh + 2, cw - 4, rh - 4);
      if (shade !== 0) {
        ctx.fillStyle = shade > 0 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.09)';
        ctx.fillRect(col * cw + offset + 2, r * rh + 2, cw - 4, rh - 4);
      }
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 2);
  tex.anisotropy = maxAniso;
  return tex;
}

function makeChainLinkFenceTexture(stSpec, maxAniso) {
  const c = document.createElement('canvas');
  c.width = 2048;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 2048, 256);

  // Upper 42% translucent galvanized steel chain-link mesh
  ctx.strokeStyle = 'rgba(203, 213, 225, 0.72)';
  ctx.lineWidth = 2.2;
  for (let x = -140; x <= 2188; x += 14) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 112, 112);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 112, 0);
    ctx.lineTo(x, 112);
    ctx.stroke();
  }

  // Lower 58% opaque varsity team windscreen tarp with grommets & school branding
  const screenBg = stSpec.wallColor || '#1e3a5f';
  ctx.fillStyle = screenBg;
  ctx.fillRect(0, 108, 2048, 148);
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  for (let x = 0; x < 2048; x += 64) {
    ctx.fillRect(x, 108, 2, 148);
  }

  // Windscreen yellow or team top binding + fence safety tubing stripe
  ctx.fillStyle = stSpec.wallCap || '#facc15';
  ctx.fillRect(0, 0, 2048, 12);
  ctx.fillRect(0, 108, 2048, 6);

  // Clean painted distance numbers & high school diamond title
  const distLabels = [
    [90, Math.round(stSpec.wallDist(-0.785))],
    [540, Math.round(stSpec.wallDist(-0.39))],
    [1024, Math.round(stSpec.wallDist(0))],
    [1508, Math.round(stSpec.wallDist(0.39))],
    [1958, Math.round(stSpec.wallDist(0.785))]
  ];
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 42px sans-serif';
  ctx.textAlign = 'center';
  distLabels.forEach(([lx, val]) => ctx.fillText(String(val), lx, 202));

  ctx.fillStyle = stSpec.wallCap || '#fde68a';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(stSpec.name.toUpperCase(), 1024, 152);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

function makeBleacherPlankTexture(maxAniso) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#334155';
  ctx.fillRect(0, 0, 512, 256);
  const rows = 10;
  const rh = 256 / rows;
  for (let r = 0; r < rows; r++) {
    const y = r * rh;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, y, 512, rh * 0.42);
    const benchGrad = ctx.createLinearGradient(0, y + rh * 0.42, 0, y + rh);
    benchGrad.addColorStop(0, '#e2e8f0');
    benchGrad.addColorStop(0.5, '#cbd5e1');
    benchGrad.addColorStop(1, '#94a3b8');
    ctx.fillStyle = benchGrad;
    ctx.fillRect(0, y + rh * 0.46, 512, rh * 0.48);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 2);
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

function makeParkWallTexture(stSpec, maxAniso) {
  const c = document.createElement('canvas');
  c.width = 2048;
  c.height = 256;
  const ctx = c.getContext('2d');
  const id = stSpec.id;
  const wallBg = stSpec.wallColor || '#134e30';

  ctx.fillStyle = wallBg;
  ctx.fillRect(0, 0, 2048, 256);

  if (id === 'wrigley') {
    // Classic Chicago Red Brick covered in lush layered English Ivy
    ctx.fillStyle = '#7c2d23';
    ctx.fillRect(0, 0, 2048, 256);
    for (let row = 0; row < 14; row++) {
      for (let col = 0; col < 64; col++) {
        ctx.fillStyle = (row + col) % 2 === 0 ? '#8c3328' : '#6c251c';
        ctx.fillRect(col * 32 + (row % 2) * 16 + 2, row * 18 + 2, 28, 14);
      }
    }
    for (let i = 0; i < 4200; i++) {
      const lx = (i * 53) % 2048;
      const ly = 16 + ((i * 89) % 236);
      ctx.fillStyle = i % 3 === 0 ? '#14532d' : i % 3 === 1 ? '#166534' : '#228b3e';
      ctx.beginPath();
      ctx.ellipse(lx, ly, 9 + (i % 6), 6 + (i % 5), (i % 7) * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'oracle') {
    // San Francisco Charcoal/Teal LF-CF Wall + Pierced Brick Arcade Wall in RF
    ctx.fillStyle = '#0f2830';
    ctx.fillRect(0, 0, 2048, 256);
    ctx.fillStyle = '#7f2f22';
    ctx.fillRect(1360, 0, 688, 256);
    for (let a = 0; a < 4; a++) {
      const ax = 1445 + a * 162;
      ctx.fillStyle = '#0c1f2e';
      ctx.beginPath();
      ctx.arc(ax, 130, 48, Math.PI, 0);
      ctx.lineTo(ax + 48, 240);
      ctx.lineTo(ax - 48, 240);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#d6d3d1';
      ctx.lineWidth = 4;
      ctx.stroke();
    }
  } else if (id === 'fenway') {
    // Left Field 37-ft Green Monster Wall Panel Seams + White Steel Ladder + Hand-Operated Scoreboard!
    ctx.fillStyle = '#2d5a42';
    ctx.fillRect(0, 0, 2048, 256);
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.35)';
    ctx.lineWidth = 3;
    for (let x = 0; x < 2048; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 256);
      ctx.stroke();
    }
    // Classic White Vertical Monster Ladder in LCF
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 3;
    ctx.strokeRect(610, 12, 16, 244);
    for (let ly = 26; ly < 250; ly += 18) {
      ctx.beginPath();
      ctx.moveTo(610, ly);
      ctx.lineTo(626, ly);
      ctx.stroke();
    }
    // Hand-operated scoreboard strip on LF Monster
    ctx.fillStyle = '#143123';
    ctx.fillRect(130, 118, 420, 120);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 3;
    ctx.strokeRect(130, 118, 420, 120);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('1  2  3  4  5  6  7  8  9   R  H  E', 148, 148);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('V  0  0  1  0  2  0  0  1  0   4  7  0', 148, 184);
    ctx.fillText('BOS 0  2  0  1  0  3  0  0  -   6  9  1', 148, 218);
  } else if (id === 'petco') {
    // San Diego Padres Brown & Gold Padding + Western Metal Supply Corner Accents
    ctx.fillStyle = '#2f241d';
    ctx.fillRect(0, 0, 2048, 256);
    ctx.fillStyle = '#ffc425';
    ctx.fillRect(0, 178, 2048, 10);
    ctx.fillStyle = '#7c2d23';
    ctx.fillRect(0, 188, 290, 68);
    ctx.fillStyle = '#ffc425';
    ctx.font = '900 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SAN DIEGO · PETCO PARK · GASLAMP QUARTER', 1024, 224);
  } else if (id === 'coors') {
    // Rockies Forest Green Padding + Mile-High Purple Accent Strip
    ctx.fillStyle = '#163c29';
    ctx.fillRect(0, 0, 2048, 256);
    ctx.fillStyle = '#33006f';
    ctx.fillRect(0, 174, 2048, 82);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(0, 168, 2048, 6);
    ctx.font = '900 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('COORS FIELD · ELEVATION 5,280 FT · BLAKE STREET', 1024, 220);
  } else if (id === 'pk-park') {
    // Oregon Ducks Deep Forest Green + Lightning Yellow Stripe
    ctx.fillStyle = '#154733';
    ctx.fillRect(0, 0, 2048, 256);
    ctx.fillStyle = '#0f3022';
    ctx.fillRect(0, 180, 2048, 76);
    ctx.fillStyle = '#fee123';
    ctx.fillRect(0, 172, 2048, 8);
    ctx.font = '900 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('OREGON DUCKS · PK PARK · EUGENE, OREGON', 1024, 220);
  } else if (id === 'stanford') {
    // Stanford Cardinal Red Wall + Palo Alto Brick Knee Base
    ctx.fillStyle = '#8c1515';
    ctx.fillRect(0, 0, 2048, 256);
    ctx.fillStyle = '#5e1414';
    ctx.fillRect(0, 186, 2048, 70);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 180, 2048, 6);
    ctx.font = '900 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('STANFORD CARDINAL · SUNKEN DIAMOND · THE FARM', 1024, 222);
  } else if (id === 'ucsb') {
    // UC Santa Barbara Gaucho Navy & Gold Coastal Wall
    ctx.fillStyle = '#003660';
    ctx.fillRect(0, 0, 2048, 256);
    ctx.fillStyle = '#002240';
    ctx.fillRect(0, 182, 2048, 74);
    ctx.fillStyle = '#febc11';
    ctx.fillRect(0, 174, 2048, 8);
    ctx.font = '900 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('UC SANTA BARBARA · CAESAR UYESAKA STADIUM', 1024, 220);
  } else if (id === 'cal-poly') {
    // Cal Poly Mustangs Forest Green & Mustang Gold Wall
    ctx.fillStyle = '#154734';
    ctx.fillRect(0, 0, 2048, 256);
    ctx.fillStyle = '#0d2e21';
    ctx.fillRect(0, 182, 2048, 74);
    ctx.fillStyle = '#bd8b13';
    ctx.fillRect(0, 174, 2048, 8);
    ctx.font = '900 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CAL POLY MUSTANGS · BAGGETT STADIUM · SLO', 1024, 220);
  } else if (id === 'usc') {
    // USC Trojans Cardinal & Gold Dedeaux Field Championship Wall
    ctx.fillStyle = '#18442f';
    ctx.fillRect(0, 0, 2048, 256);
    ctx.fillStyle = '#990000';
    ctx.fillRect(0, 166, 2048, 90);
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(0, 160, 2048, 9);
    ctx.fillStyle = '#ffcc00';
    ctx.font = '900 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('USC TROJANS  ·  DEDEAUX FIELD  ·  12 NATIONAL CHAMPIONSHIPS', 1024, 218);
  } else if (id === 'sdsu') {
    // SDSU Tony Gwynn Stadium Aztec Scarlet & Matte Black Championship Wall
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, 2048, 256);
    ctx.fillStyle = '#a6192e';
    ctx.fillRect(0, 168, 2048, 88);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 164, 2048, 5);
    ctx.fillStyle = '#f8fafc';
    ctx.font = '900 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SAN DIEGO STATE AZTECS  ·  TONY GWYNN STADIUM  ·  #19 RETIRED', 1024, 220);
  } else {
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 3;
    for (let x = 0; x < 2048; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 256);
      ctx.stroke();
    }
  }

  // Top HR Coping Stripe
  ctx.fillStyle = stSpec.wallCap || '#facc15';
  ctx.fillRect(0, 0, 2048, 16);

  // Authentic Wall Distance Numbers matching wallDist at -45, -22, 0, +22, +45 deg
  const distLabels = [
    [76, Math.round(stSpec.wallDist(-0.785))],
    [520, Math.round(stSpec.wallDist(-0.39))],
    [1024, Math.round(stSpec.wallDist(0))],
    [1528, Math.round(stSpec.wallDist(0.39))],
    [1972, Math.round(stSpec.wallDist(0.785))]
  ];
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 42px sans-serif';
  ctx.textAlign = 'center';
  distLabels.forEach(([lx, val]) => ctx.fillText(String(val), lx, 146));

  ctx.fillStyle = stSpec.wallCap || '#fde68a';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(stSpec.name.toUpperCase(), 1024, 68);
  if (stSpec.subBanner) {
    ctx.fillStyle = 'rgba(241,245,249,0.9)';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(stSpec.subBanner, 520, 68);
    ctx.fillText(stSpec.subBanner2 || stSpec.dimsLabel, 1528, 68);
  }

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
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, 256, 61);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px monospace';
  ctx.fillText(sub1, 256, 134);
  ctx.fillStyle = '#cbd5e1';
  ctx.font = 'bold 17px monospace';
  ctx.fillText(sub2, 256, 184);

  ctx.fillStyle = accentHex;
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('RAPSODO HITTING 2.0 · LIVE TELEMETRY', 256, 224);

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
  } else if (batId === 'combat-blue') {
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
  } else {
    // 6th Bat: Marucci CATX2 Alloy (-3) — Brushed AZR Silver/Titanium Alloy Barrel,
    // Crimson Red & Charcoal Accent Bands, Bold "CATX2" + "MARUCCI" Branding,
    // Matte Black Grip + Signature Crimson Liquid-Gel Dampening Knob Collar.
    const azrGrad = ctx.createLinearGradient(0, 0, 512, 0);
    azrGrad.addColorStop(0, '#94a3b8');
    azrGrad.addColorStop(0.28, '#f8fafc');
    azrGrad.addColorStop(0.56, '#cbd5e1');
    azrGrad.addColorStop(0.84, '#f1f5f9');
    azrGrad.addColorStop(1, '#94a3b8');
    ctx.fillStyle = azrGrad;
    ctx.fillRect(0, 0, 512, 578);

    // Matte White/Silver taper transition -> Crimson/Charcoal accent rings -> Black Grip -> Red Liquid-Gel Knob
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 578, 512, 94);
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 446, 512, 16);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(0, 464, 512, 12);
    ctx.fillRect(0, 46, 512, 8);
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, 512, 34);

    paintSpiralGrip('#0f1116', '#2b303c', 672, 976);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(0, 976, 512, 48);

    [136, 376].forEach((cx, faceIdx) => {
      ctx.save();
      ctx.translate(cx, 240);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      if (faceIdx === 0) {
        ctx.fillStyle = '#111827';
        ctx.font = '900 54px sans-serif';
        ctx.fillText('CATX2', 0, 14);
        ctx.fillStyle = '#dc2626';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('AZR ALLOY · RING-FREE', 0, 38);
      } else {
        ctx.fillStyle = '#dc2626';
        ctx.font = '900 44px Georgia, serif';
        ctx.fillText('MARUCCI', 0, 10);
        ctx.fillStyle = '#111827';
        ctx.font = 'bold 13px monospace';
        ctx.fillText('BBCOR .50 · LIQUID-GEL KNOB', 0, 34);
      }
      ctx.restore();
    });
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
  const isMetal = batConfig.id === 'goods-2022' || batConfig.id === 'marucci-catx2';
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
    roughness: isMetal ? 0.17 : isAnodized ? 0.26 : isWood ? 0.14 : 0.2,
    metalness: isMetal ? 0.9 : isAnodized ? 0.28 : isWood ? 0.06 : 0.26,
    clearcoat: isGloss ? 0.92 : isMetal ? 0.56 : 0.34,
    clearcoatRoughness: isGloss ? 0.08 : 0.18
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

function buildMountainRange(opts = {}) {
  // Continuous Multi-Octave Sculpted Terrain Backdrop with realistic ridges, foothills, optional snowline & crag peak
  const cols = 76;
  const rows = 18;
  const minDist = opts.minDist || 515;
  const depth = opts.depth || 270;
  const maxHeight = opts.maxHeight || 165;
  const phiSpan = opts.phiSpan || 1.18;
  const seed = opts.seed || 1.3;
  const cragPhi = opts.cragPhi != null ? opts.cragPhi : null;
  const cragAmp = opts.cragAmp || 0;
  const snowThreshold = opts.snowThreshold != null ? opts.snowThreshold : 2.0;

  const cLow = new THREE.Color(opts.lowHex || '#1e2c22');
  const cMid = new THREE.Color(opts.midHex || '#35483d');
  const cPeak = new THREE.Color(opts.peakHex || '#5f6f7e');
  const cSnow = new THREE.Color(opts.snowHex || '#e2e8f0');

  const pos = [];
  const colors = [];
  const idx = [];

  for (let r = 0; r <= rows; r++) {
    const vr = r / rows;
    const dist = minDist + vr * depth;
    const ridgeEnv = Math.pow(Math.sin(vr * Math.PI), 0.78);
    for (let c = 0; c <= cols; c++) {
      const uc = c / cols;
      const phi = -phiSpan + uc * (phiSpan * 2);
      const o1 = Math.sin(uc * Math.PI * 3.1 + seed) * 0.42;
      const o2 = Math.cos(uc * Math.PI * 7.4 + vr * 2.4 + seed * 1.7) * 0.24;
      const o3 = Math.sin(uc * Math.PI * 16.5 + vr * 5.2 + seed * 0.6) * 0.11;
      const o4 = Math.cos(uc * Math.PI * 29.0 + vr * 9.5) * 0.045;
      // Sharp faceted ridge crease via abs-folded noise
      const fold = (1 - Math.abs(Math.sin(uc * Math.PI * 4.8 + seed * 2.1 + vr * 1.2))) * 0.26;
      const crag =
        cragPhi != null && cragAmp > 0
          ? Math.exp(-Math.pow((phi - cragPhi) / 0.16, 2)) * Math.exp(-Math.pow((vr - 0.56) / 0.24, 2)) * cragAmp
          : 0;

      const shapeF = Math.max(0, 0.32 + o1 + o2 + o3 + o4 + fold);
      const rawH = Math.max(0, shapeF * maxHeight * ridgeEnv + crag);

      const x = Math.sin(phi) * dist;
      const z = -Math.cos(phi) * dist;
      pos.push(x, rawH - 3, z);

      const hNorm = clamp(rawH / Math.max(40, maxHeight + cragAmp * 0.45), 0, 1);
      const col = cLow
        .clone()
        .lerp(cMid, clamp(hNorm * 1.45, 0, 1))
        .lerp(cPeak, clamp((hNorm - 0.42) * 1.9, 0, 1));
      if (hNorm > snowThreshold) {
        const snowT = clamp((hNorm - snowThreshold) / Math.max(0.08, 1 - snowThreshold), 0, 1);
        col.lerp(cSnow, snowT * 0.92);
      }
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
      roughness: 0.95,
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

function createSolidSteppedBowlParts(wallDistFn, dOff, dSpan, steps, y0, y1, yBase, startPhi, endPhi, slices, backConcourseDepth = 11, rearExtraH = 7) {
  const stepD = dSpan / steps;
  const stepH = (y1 - y0) / steps;
  const clampPhi = (p) => clamp(p, -0.785, 0.785);
  const baseDist = (phi) => (phi >= -0.785 && phi <= 0.785 ? wallDistFn(clampPhi(phi)) : wallDistFn(clampPhi(phi)));

  // 1. Seats/Bleacher Treads Geometry + Top Concourse Deck
  const sPos = [];
  const sUv = [];
  const sIdx = [];
  let vBase = 0;

  for (let s = 0; s < steps; s++) {
    const dIn = dOff + s * stepD;
    const dOut = dIn + stepD;
    const yStep = y0 + s * stepH;
    const v0 = s / steps;
    const v1 = (s + 1) / steps;

    for (let i = 0; i <= slices; i++) {
      const t = i / slices;
      const phi = startPhi + t * (endPhi - startPhi);
      const rIn = baseDist(phi) + dIn;
      const rOut = baseDist(phi) + dOut;
      sPos.push(Math.sin(phi) * rIn, yStep, -Math.cos(phi) * rIn);
      sUv.push(t, v0);
      sPos.push(Math.sin(phi) * rOut, yStep, -Math.cos(phi) * rOut);
      sUv.push(t, v1);
    }
    for (let i = 0; i < slices; i++) {
      const a = vBase + i * 2;
      const b = a + 2;
      sIdx.push(a, b, b + 1, a, b + 1, a + 1);
    }
    vBase += (slices + 1) * 2;
  }

  const seatsGeom = new THREE.BufferGeometry();
  seatsGeom.setAttribute('position', new THREE.Float32BufferAttribute(sPos, 3));
  seatsGeom.setAttribute('uv', new THREE.Float32BufferAttribute(sUv, 2));
  seatsGeom.setIndex(sIdx);
  seatsGeom.computeVertexNormals();

  // 2. Watertight Solid Structural Shell Geometry (Front fascia + Risers + Rear Concourse + Solid Exterior Back Wall + Soffit)
  const cPos = [];
  const cUv = [];
  const cIdx = [];
  let cBase = 0;

  const pushQuadRibbon = (r1Fn, y1Fn, r2Fn, y2Fn, uRepeat = 6) => {
    for (let i = 0; i <= slices; i++) {
      const t = i / slices;
      const phi = startPhi + t * (endPhi - startPhi);
      const r1 = r1Fn(phi);
      const r2 = r2Fn(phi);
      cPos.push(Math.sin(phi) * r1, y1Fn(phi), -Math.cos(phi) * r1);
      cUv.push(t * uRepeat, 0);
      cPos.push(Math.sin(phi) * r2, y2Fn(phi), -Math.cos(phi) * r2);
      cUv.push(t * uRepeat, 1);
    }
    for (let i = 0; i < slices; i++) {
      const a = cBase + i * 2;
      const b = a + 2;
      cIdx.push(a, b, b + 1, a, b + 1, a + 1);
    }
    cBase += (slices + 1) * 2;
  };

  // Front fascia from yBase up to y0 + 1.2 knee-wall lip
  pushQuadRibbon(
    (phi) => baseDist(phi) + dOff,
    () => yBase,
    (phi) => baseDist(phi) + dOff,
    () => y0 + 1.15,
    6
  );

  // Closed vertical risers between every seating row (zero air gaps!)
  for (let s = 1; s < steps; s++) {
    const dIn = dOff + s * stepD;
    const yPrev = y0 + (s - 1) * stepH;
    const yStep = y0 + s * stepH;
    pushQuadRibbon(
      (phi) => baseDist(phi) + dIn,
      () => yPrev,
      (phi) => baseDist(phi) + dIn,
      () => yStep,
      5
    );
  }

  // Rear upper concourse ledge & parapet wall
  const dDeckEnd = dOff + dSpan + backConcourseDepth;
  const yTopParapet = y1 + rearExtraH;
  pushQuadRibbon(
    (phi) => baseDist(phi) + dOff + dSpan,
    () => y1 - stepH,
    (phi) => baseDist(phi) + dDeckEnd,
    () => y1 - stepH,
    6
  );
  // Inner parapet wall at back of concourse
  pushQuadRibbon(
    (phi) => baseDist(phi) + dDeckEnd - 2,
    () => y1 - stepH,
    (phi) => baseDist(phi) + dDeckEnd - 2,
    () => yTopParapet,
    6
  );
  // Parapet top cap
  pushQuadRibbon(
    (phi) => baseDist(phi) + dDeckEnd - 2,
    () => yTopParapet,
    (phi) => baseDist(phi) + dDeckEnd,
    () => yTopParapet,
    6
  );
  // Solid exterior enclosing wall from yTopParapet down to yBase (grounds entire stadium cleanly!)
  pushQuadRibbon(
    (phi) => baseDist(phi) + dDeckEnd,
    () => yTopParapet,
    (phi) => baseDist(phi) + dDeckEnd,
    () => yBase,
    8
  );
  // Solid sloped underside soffit closing the bottom of upper decks
  pushQuadRibbon(
    (phi) => baseDist(phi) + dOff,
    () => yBase,
    (phi) => baseDist(phi) + dDeckEnd,
    () => yBase,
    6
  );

  const shellGeom = new THREE.BufferGeometry();
  shellGeom.setAttribute('position', new THREE.Float32BufferAttribute(cPos, 3));
  shellGeom.setAttribute('uv', new THREE.Float32BufferAttribute(cUv, 2));
  shellGeom.setIndex(cIdx);
  shellGeom.computeVertexNormals();

  return { seatsGeom, shellGeom };
}

function buildSupportColumns(wallDistFn, dCenter, yBottom, yTop, startPhi, endPhi, count, rad, mat) {
  const h = Math.max(2, yTop - yBottom);
  const geom = new THREE.CylinderGeometry(rad * 0.88, rad * 1.08, h, 12);
  geom.translate(0, yBottom + h * 0.5, 0);
  const inst = new THREE.InstancedMesh(geom, mat, count);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const phi = startPhi + t * (endPhi - startPhi);
    const r = wallDistFn(clamp(phi, -0.785, 0.785)) + dCenter;
    dummy.position.set(Math.sin(phi) * r, 0, -Math.cos(phi) * r);
    dummy.rotation.set(0, -phi, 0);
    dummy.updateMatrix();
    inst.setMatrixAt(i, dummy.matrix);
  }
  inst.instanceMatrix.needsUpdate = true;
  inst.computeBoundingSphere();
  return inst;
}

function buildOutfieldBerm(wallDistFn, dOff, depth, baseY, peakY, startPhi, endPhi, slices, grassMat, curbMat) {
  const grp = new THREE.Group();
  const pos = [];
  const uv = [];
  const idx = [];
  for (let i = 0; i <= slices; i++) {
    const t = i / slices;
    const phi = startPhi + t * (endPhi - startPhi);
    const d0 = wallDistFn(clamp(phi, -0.785, 0.785)) + dOff;
    const dMid = d0 + depth * 0.58;
    const dBack = d0 + depth;
    const dome = 0.78 + 0.22 * Math.sin(t * Math.PI);

    pos.push(Math.sin(phi) * d0, baseY, -Math.cos(phi) * d0);
    uv.push(t * 4, 0);
    pos.push(Math.sin(phi) * dMid, peakY * dome, -Math.cos(phi) * dMid);
    uv.push(t * 4, 0.6);
    pos.push(Math.sin(phi) * dBack, 0, -Math.cos(phi) * dBack);
    uv.push(t * 4, 1);
  }
  for (let i = 0; i < slices; i++) {
    const a = i * 3;
    const b = a + 3;
    idx.push(a, b, b + 1, a, b + 1, a + 1);
    idx.push(a + 1, b + 1, b + 2, a + 1, b + 2, a + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  const berm = new THREE.Mesh(g, grassMat);
  berm.receiveShadow = true;

  const curbGeom = createSweptWallGeometry(
    (phi) => wallDistFn(clamp(phi, -0.785, 0.785)) + dOff,
    () => baseY + 0.8,
    startPhi,
    endPhi,
    slices,
    1.8
  );
  const curb = new THREE.Mesh(curbGeom, curbMat);
  grp.add(berm, curb);
  return grp;
}

function buildAluminumBleacherSection(width, rows, steelMat, plankMat) {
  const grp = new THREE.Group();
  const rowDepth = 2.6;
  const rowRise = 1.45;
  const frameCount = Math.max(3, Math.round(width / 12));
  for (let f = 0; f < frameCount; f++) {
    const fx = -width * 0.45 + (f / (frameCount - 1)) * (width * 0.9);
    for (let r = 1; r < rows; r++) {
      const h = 1.4 + r * rowRise;
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.45, h, 0.45), steelMat);
      post.position.set(fx, h * 0.5, r * rowDepth);
      grp.add(post);
    }
    const stringerLen = Math.hypot(rows * rowDepth, rows * rowRise);
    const stringer = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.55, stringerLen), steelMat);
    stringer.position.set(fx, (rows * rowRise) * 0.5 + 0.9, (rows * rowDepth) * 0.5);
    stringer.rotation.x = -Math.atan2(rowRise, rowDepth);
    grp.add(stringer);
  }
  for (let r = 0; r < rows; r++) {
    const ry = 1.4 + r * rowRise;
    const rz = r * rowDepth;
    const plank = new THREE.Mesh(new THREE.BoxGeometry(width, 0.35, 1.85), plankMat);
    plank.position.set(0, ry, rz);
    plank.castShadow = true;
    plank.receiveShadow = true;
    const footRest = new THREE.Mesh(new THREE.BoxGeometry(width, 0.2, 1.35), steelMat);
    footRest.position.set(0, ry - 0.55, rz - 0.7);
    grp.add(plank, footRest);
  }
  // Back top safety guardrail
  const topY = 1.4 + (rows - 1) * rowRise;
  const topZ = (rows - 1) * rowDepth + 0.95;
  const backRail = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, width, 8), steelMat);
  backRail.rotation.z = Math.PI / 2;
  backRail.position.set(0, topY + 3.2, topZ);
  grp.add(backRail);
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
    backLeg,
    strideLeg,
    strideLegPivot: strideLeg.hip,
    strideKneePivot: strideLeg.knee,
    backKneePivot: backLeg.knee,
    torsoPivot,
    torso,
    shoulderL,
    shoulderR,
    neck,
    head,
    helmet,
    earFlap,
    cFlap,
    visor,
    handsGroup,
    topArm,
    topElbow,
    bottomArm,
    botElbow
  };
}

/* =========================================================
   Sculpted 3D Catcher (Connected Catching Arm, Knee-Savers & Mask) + Umpire WITH ARMS
   ========================================================= */
function buildCatcherAndUmpire() {
  const grp = new THREE.Group();
  const gearMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.42, metalness: 0.22 });
  const padMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.48 });
  const ribAccentMat = new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.4 });
  const jerseyMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.62 });
  const pantMat = new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.72 });
  const skinMat = new THREE.MeshStandardMaterial({ color: '#d99b72', roughness: 0.62 });
  const umpShirtMat = new THREE.MeshStandardMaterial({ color: '#38bdf8', roughness: 0.62 });
  const umpPantMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.72 });
  const mittMat = new THREE.MeshStandardMaterial({ color: '#854d0e', roughness: 0.46 });
  const maskMetalMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.85, roughness: 0.22 });

  // 1. Anatomically Proportioned Squatting Catcher (Feet flat in catcher's box, connected glove arm + mitt!)
  const catcher = new THREE.Group();
  catcher.position.set(0.0, 0, 4.55);
  catcher.add(makePlayerShadowDisc(1.25));

  // Pelvis sits back in deep squat
  const cPelvis = new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 0.3, 6, 14), pantMat);
  cPelvis.rotation.z = Math.PI / 2;
  cPelvis.position.set(0, 1.32, 0.28);
  catcher.add(cPelvis);

  // Flexed Legs + Contoured Shin Guards + Knee Savers + Cleats
  [-0.56, 0.56].forEach((sx) => {
    const thigh = new THREE.Mesh(makeSculptedLimbGeom(0.24, 0.19, 1.18), pantMat);
    thigh.position.set(sx * 0.72, 1.38, 0.28);
    thigh.rotation.x = 1.16;
    thigh.rotation.z = sx > 0 ? -0.18 : 0.18;

    const kneeCap = new THREE.Mesh(new THREE.SphereGeometry(0.21, 12, 10), ribAccentMat);
    kneeCap.position.set(sx, 1.02, -0.72);

    const shinGuard = new THREE.Mesh(makeSculptedLimbGeom(0.2, 0.145, 1.14), padMat);
    shinGuard.position.set(sx, 1.04, -0.72);
    shinGuard.rotation.x = -0.16;

    const kneeSaver = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.3, 5, 10), gearMat);
    kneeSaver.position.set(sx, 0.62, -0.34);
    kneeSaver.rotation.x = 0.72;

    const cleat = makeSculptedCleatMesh(gearMat, 0.96);
    cleat.position.set(sx, 1.24, -0.54);
    cleat.rotation.y = sx > 0 ? -0.22 : 0.22;

    catcher.add(thigh, kneeCap, shinGuard, kneeSaver, cleat);
  });

  // Forward-leaning Catcher Torso & Ribbed Chest Protector
  const cTorso = new THREE.Group();
  cTorso.position.set(0, 1.4, 0.2);
  cTorso.rotation.x = 0.28; // natural forward athletic lean toward home plate
  catcher.add(cTorso);

  const cJersey = new THREE.Mesh(makeSculptedTorsoGeom(1.72, 0.58, 0.46, 0.49), jerseyMat);
  cJersey.position.set(0, 0.88, 0);
  cJersey.scale.set(1.06, 1.0, 0.84);
  const cBib = new THREE.Mesh(makeSculptedTorsoGeom(1.36, 0.5, 0.42, 0.4), padMat);
  cBib.position.set(0, 0.84, -0.22);
  cBib.scale.set(1.02, 1.0, 0.58);
  cTorso.add(cJersey, cBib);

  for (let r = 0; r < 4; r++) {
    const rib = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.52 - r * 0.05, 6, 10), ribAccentMat);
    rib.rotation.z = Math.PI / 2;
    rib.position.set(0, 1.16 - r * 0.24, -0.49 + r * 0.02);
    cTorso.add(rib);
  }
  [-0.58, 0.58].forEach((sx) => {
    const shCap = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), ribAccentMat);
    shCap.scale.set(1.1, 0.75, 1.0);
    shCap.position.set(sx, 1.56, -0.04);
    cTorso.add(shCap);
  });

  // Neck + Hockey-Style Catcher Helmet + Wire Mask + Dangling Throat Guard
  const cNeck = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.16, 6, 10), skinMat);
  cNeck.position.set(0, 1.78, 0);
  const cHelmet = new THREE.Mesh(new THREE.SphereGeometry(0.41, 20, 16), gearMat);
  cHelmet.scale.set(0.95, 1.05, 1.12);
  cHelmet.position.set(0, 2.04, 0.02);
  const cBackSkirt = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.4, 0.24, 16, 1, false, Math.PI * 0.65, Math.PI * 0.7), gearMat);
  cBackSkirt.position.set(0, 1.78, 0.16);

  const cMaskFrame = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.026, 8, 18), maskMetalMat);
  cMaskFrame.position.set(0, 2.0, -0.4);
  const cBarV = new THREE.Mesh(new THREE.CapsuleGeometry(0.014, 0.36, 4, 8), maskMetalMat);
  cBarV.position.set(0, 2.0, -0.44);
  const cBarH1 = new THREE.Mesh(new THREE.CapsuleGeometry(0.014, 0.36, 4, 8), maskMetalMat);
  cBarH1.rotation.z = Math.PI / 2;
  cBarH1.position.set(0, 2.05, -0.44);
  const cBarH2 = cBarH1.clone();
  cBarH2.position.y = 1.94;
  const cThroat = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.22, 0.06), gearMat);
  cThroat.position.set(0, 1.66, -0.39);
  cThroat.rotation.x = 0.2;
  cTorso.add(cNeck, cHelmet, cBackSkirt, cMaskFrame, cBarV, cBarH1, cBarH2, cThroat);

  // Connected Catcher Left Glove Arm (Shoulder -> Forearm -> Catcher's Mitt)
  const upperArmG = makeSculptedLimbGeom(0.16, 0.125, 0.84);
  const foreArmG = makeSculptedLimbGeom(0.12, 0.09, 0.82);

  const catcherArmPivot = new THREE.Group();
  catcherArmPivot.position.set(0.62, 1.5, -0.05);
  catcherArmPivot.add(new THREE.Mesh(upperArmG, jerseyMat));
  const catcherElbowPivot = new THREE.Group();
  catcherElbowPivot.position.set(0, -0.82, 0);
  catcherElbowPivot.add(new THREE.Mesh(foreArmG, skinMat));

  const mitt = makeSculptedGloveMesh(mittMat, new THREE.MeshStandardMaterial({ color: '#451a03', roughness: 0.65 }), 1.08, true);
  mitt.position.set(0, -0.86, -0.06);
  catcherElbowPivot.add(mitt);
  catcherArmPivot.add(catcherElbowPivot);
  cTorso.add(catcherArmPivot);

  // Right Throwing Arm safely tucked behind catcher's right hip/thigh
  const catcherThrowArm = new THREE.Group();
  catcherThrowArm.position.set(-0.62, 1.5, -0.02);
  catcherThrowArm.rotation.set(-0.22, 0, -0.25);
  catcherThrowArm.add(new THREE.Mesh(upperArmG, jerseyMat));
  const cThrowElb = new THREE.Group();
  cThrowElb.position.set(0, -0.82, 0);
  cThrowElb.rotation.set(-1.35, -0.3, 0);
  cThrowElb.add(new THREE.Mesh(foreArmG, skinMat));
  const cHand = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), skinMat);
  cHand.position.set(0, -0.84, 0);
  cThrowElb.add(cHand);
  catcherThrowArm.add(cThrowElb);
  cTorso.add(catcherThrowArm);

  grp.add(catcher);

  // 2. Sculpted Home Plate Umpire WITH FULL ARTICULATED ARMS & Animated Strike/Ball Calls
  const ump = new THREE.Group();
  ump.position.set(-0.85, 0, 7.35);
  ump.add(makePlayerShadowDisc(1.15));

  const uThighG = makeSculptedLimbGeom(0.22, 0.17, 1.28);
  const uShinG = makeSculptedLimbGeom(0.17, 0.13, 1.2);
  [-0.36, 0.36].forEach((sx) => {
    const uThigh = new THREE.Mesh(uThighG, umpPantMat);
    uThigh.position.set(sx, 2.48, 0);
    uThigh.rotation.x = 0.25;
    const uShin = new THREE.Mesh(uShinG, umpPantMat);
    uShin.position.set(sx, 1.24, -0.28);
    uShin.rotation.x = -0.12;
    const uShoe = makeSculptedCleatMesh(gearMat, 1.0);
    uShoe.position.set(sx, 1.32, -0.14);
    ump.add(uThigh, uShin, uShoe);
  });

  const umpTorso = new THREE.Group();
  umpTorso.position.set(0, 2.45, 0.04);
  umpTorso.rotation.x = 0.16;
  ump.add(umpTorso);

  const uShirt = new THREE.Mesh(makeSculptedTorsoGeom(1.86, 0.64, 0.52, 0.56), umpShirtMat);
  uShirt.position.set(0, 0.96, 0);
  uShirt.scale.set(1.06, 1.0, 0.88);
  const uProtector = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.96, 0.24), gearMat);
  uProtector.position.set(0, 1.1, -0.34);
  const uBallBag = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.42, 0.38), gearMat);
  uBallBag.position.set(-0.58, 0.28, 0);
  const uNeck = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.16, 6, 10), skinMat);
  uNeck.position.set(0, 1.92, 0);
  const uHead = new THREE.Mesh(new THREE.SphereGeometry(0.38, 18, 14), skinMat);
  uHead.position.set(0, 2.24, 0);
  const uCap = new THREE.Mesh(new THREE.SphereGeometry(0.41, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.54), gearMat);
  uCap.position.set(0, 2.31, 0);
  const uMask = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.028, 8, 18), maskMetalMat);
  uMask.position.set(0, 2.18, -0.38);
  const uMaskBar = new THREE.Mesh(new THREE.CapsuleGeometry(0.016, 0.34, 4, 8), maskMetalMat);
  uMaskBar.rotation.z = Math.PI / 2;
  uMaskBar.position.set(0, 2.18, -0.4);
  umpTorso.add(uShirt, uProtector, uBallBag, uNeck, uHead, uCap, uMask, uMaskBar);

  // Full Articulated Umpire Arms (Left & Right shoulders -> biceps -> elbows -> forearms -> fists)
  const makeUmpArm = (sx) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(sx * 0.68, 1.66, 0);
    shoulder.add(new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), umpShirtMat));
    shoulder.add(new THREE.Mesh(upperArmG, umpShirtMat));
    const elbow = new THREE.Group();
    elbow.position.set(0, -0.82, 0);
    elbow.add(new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), skinMat));
    elbow.add(new THREE.Mesh(foreArmG, skinMat));
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.135, 10, 8), skinMat);
    hand.position.set(0, -0.86, 0);
    elbow.add(hand);
    shoulder.add(elbow);
    umpTorso.add(shoulder);
    return { shoulder, elbow };
  };
  const umpArmL = makeUmpArm(1);
  const umpArmR = makeUmpArm(-1);

  grp.add(ump);

  return {
    grp,
    catcher,
    cTorso,
    catcherArmPivot,
    catcherElbowPivot,
    mitt,
    ump,
    umpTorso,
    umpArmL,
    umpArmR
  };
}

function buildPitchingMachine() {
  const grp = new THREE.Group();
  grp.position.set(0, 0.83, -55.0);
  grp.visible = false;

  const blueMetal = new THREE.MeshStandardMaterial({ color: '#0369a1', metalness: 0.52, roughness: 0.35 });
  const steelMat = new THREE.MeshStandardMaterial({ color: '#64748b', metalness: 0.78, roughness: 0.28 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.82 });
  const tireMat = new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.62 });
  const netMat = new THREE.MeshBasicMaterial({ color: '#94a3b8', wireframe: true, transparent: true, opacity: 0.45 });

  // Tripod Legs on Mound Slope
  [
    [0, -1.6],
    [-1.4, 1.15],
    [1.4, 1.15]
  ].forEach(([lx, lz]) => {
    const legCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(lx, 0, lz), new THREE.Vector3(0, 2.75, 0)]);
    grp.add(new THREE.Mesh(new THREE.TubeGeometry(legCurve, 4, 0.085, 8, false), steelMat));
  });

  // Upright Steel Column & Yoke Head
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 1.35, 12), steelMat);
  mast.position.set(0, 3.1, 0);
  const headPlate = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.2, 0.55), blueMetal);
  headPlate.position.set(0, 3.65, 0);
  grp.add(mast, headPlate);

  // Dual High-Speed Spinning Rubber Flywheels (Top & Bottom)
  const makeWheel = (yPos) => {
    const w = new THREE.Group();
    w.position.set(0, yPos, 0.12);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.26, 20), wheelMat);
    hub.rotation.z = Math.PI / 2;
    const tread = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.12, 10, 24), tireMat);
    tread.rotation.y = Math.PI / 2;
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.72, 0.14), steelMat);
    w.add(hub, tread, spoke);
    return w;
  };
  const wheelTop = makeWheel(4.28);
  const wheelBot = makeWheel(3.15);
  grp.add(wheelTop, wheelBot);

  // Stainless Ball-Feed Chute pointing toward Home Plate (+Z)
  const chute = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 1.65, 14, 1, true), steelMat);
  chute.rotation.x = Math.PI * 0.46;
  chute.position.set(0, 3.62, -0.68);
  grp.add(chute);

  // Protective Pro L-Screen offset to the left side
  const lScreen = new THREE.Group();
  lScreen.position.set(-2.5, 0, 2.8);
  const lPost1 = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 6.8, 8), steelMat);
  lPost1.position.set(-1.5, 3.4, 0);
  const lPost2 = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 4.0, 8), steelMat);
  lPost2.position.set(1.5, 2.0, 0);
  const lMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 5.2), netMat);
  lMesh.position.set(0, 3.4, 0);
  lScreen.add(lPost1, lPost2, lMesh);
  grp.add(lScreen);

  return { grp, wheelTop, wheelBot };
}

function buildFieldDefenders() {
  // 7 Sculpted Articulated Field Defenders (1B, 2B, SS, 3B, LF, CF, RF) using Lathe limbs & curved caps
  const grp = new THREE.Group();
  const jerseyMat = new THREE.MeshStandardMaterial({ color: '#1e3a8a', roughness: 0.55 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.7 });
  const beltMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.45 });
  const skinMat = new THREE.MeshStandardMaterial({ color: '#d99b72', roughness: 0.62 });
  const capMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.5 });
  const gloveMat = new THREE.MeshStandardMaterial({ color: '#854d0e', roughness: 0.48 });
  const laceMat = new THREE.MeshStandardMaterial({ color: '#b45309', roughness: 0.52 });

  const thighGeom = makeSculptedLimbGeom(0.24, 0.17, 1.38);
  const shinGeom = makeSculptedLimbGeom(0.17, 0.125, 1.32);
  const upperArmGeom = makeSculptedLimbGeom(0.17, 0.13, 0.88);
  const foreArmGeom = makeSculptedLimbGeom(0.13, 0.095, 0.84);
  const torsoGeom = makeSculptedTorsoGeom(1.9, 0.62, 0.49, 0.54);
  const pelvisGeom = new THREE.CapsuleGeometry(0.42, 0.26, 6, 14);
  const headGeom = new THREE.SphereGeometry(0.36, 16, 12);
  const capCrownGeom = new THREE.SphereGeometry(0.39, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.52);
  const capVisorGeom = makeCurvedCapVisorGeom(0.62, 0.42, 0.08);
  const handGeom = new THREE.SphereGeometry(0.13, 10, 8);

  const slots = [
    { id: '1B', x: 68, z: -76, baseYaw: 0.36, phase: 0.2 },
    { id: '2B', x: 34, z: -136, baseYaw: 0.18, phase: 1.1 },
    { id: 'SS', x: -34, z: -136, baseYaw: -0.18, phase: 2.0 },
    { id: '3B', x: -68, z: -76, baseYaw: -0.36, phase: 2.9 },
    { id: 'LF', x: -168, z: -245, baseYaw: -0.46, phase: 3.7 },
    { id: 'CF', x: 0, z: -305, baseYaw: 0.0, phase: 4.5 },
    { id: 'RF', x: 168, z: -245, baseYaw: 0.46, phase: 5.3 }
  ];

  const defenders = [];
  for (const s of slots) {
    const root = new THREE.Group();
    root.position.set(s.x, 0, s.z);
    root.rotation.y = s.baseYaw;
    root.add(makePlayerShadowDisc(1.2));

    // Athletic ready crouch legs
    [-0.36, 0.36].forEach((lx) => {
      const thigh = new THREE.Mesh(thighGeom, pantsMat);
      thigh.position.set(lx, 2.58, 0);
      thigh.rotation.set(0.34, 0, lx < 0 ? 0.08 : -0.08);
      const shin = new THREE.Mesh(shinGeom, pantsMat);
      shin.position.set(lx * 1.1, 1.3, -0.44);
      shin.rotation.set(-0.22, 0, 0);
      const cleat = makeSculptedCleatMesh(beltMat, 1.0);
      cleat.position.set(lx * 1.1, 1.33, -0.16);
      root.add(thigh, shin, cleat);
    });

    const pelvis = new THREE.Mesh(pelvisGeom, pantsMat);
    pelvis.rotation.z = Math.PI / 2;
    pelvis.scale.set(0.84, 0.66, 0.78);
    pelvis.position.set(0, 2.68, 0);
    root.add(pelvis);

    const upper = new THREE.Group();
    upper.position.set(0, 2.7, 0);
    upper.rotation.x = 0.26;
    root.add(upper);

    const torso = new THREE.Mesh(torsoGeom, jerseyMat);
    torso.position.set(0, 0.94, 0);
    torso.scale.set(1.06, 1.0, 0.84);
    const neck = new THREE.Mesh(headGeom, skinMat);
    neck.scale.set(0.42, 0.55, 0.42);
    neck.position.set(0, 1.9, 0.04);
    const head = new THREE.Mesh(headGeom, skinMat);
    head.position.set(0, 2.22, 0.06);
    const cap = new THREE.Mesh(capCrownGeom, capMat);
    cap.position.set(0, 2.28, 0.06);
    const visor = new THREE.Mesh(capVisorGeom, capMat);
    visor.rotation.x = Math.PI * 0.5 + 0.08;
    visor.position.set(0, 2.34, 0.28);

    // Glove arm (+X left side facing plate) & throwing arm (-X right side)
    const gloveArm = new THREE.Group();
    gloveArm.position.set(0.64, 1.62, 0.04);
    gloveArm.rotation.set(0.68, 0, -0.18);
    gloveArm.add(new THREE.Mesh(upperArmGeom, jerseyMat));
    const gFore = new THREE.Group();
    gFore.position.set(0, -0.82, 0);
    gFore.rotation.set(0.56, 0, 0.14);
    gFore.add(new THREE.Mesh(foreArmGeom, skinMat));
    const glove = makeSculptedGloveMesh(gloveMat, laceMat, 0.95, false);
    glove.position.set(0, -0.82, 0.12);
    glove.rotation.set(0.6, 0.3, 0);
    gFore.add(glove);
    gloveArm.add(gFore);

    const throwArm = new THREE.Group();
    throwArm.position.set(-0.64, 1.62, 0.04);
    throwArm.rotation.set(0.62, 0, 0.18);
    throwArm.add(new THREE.Mesh(upperArmGeom, jerseyMat));
    const tFore = new THREE.Group();
    tFore.position.set(0, -0.82, 0);
    tFore.rotation.set(0.55, 0, -0.14);
    tFore.add(new THREE.Mesh(foreArmGeom, skinMat));
    const hand = new THREE.Mesh(handGeom, skinMat);
    hand.position.set(0, -0.82, 0);
    tFore.add(hand);
    throwArm.add(tFore);

    upper.add(torso, neck, head, cap, visor, gloveArm, throwArm);
    grp.add(root);
    defenders.push({ root, upper, baseYaw: s.baseYaw, phase: s.phase });
  }

  return { grp, defenders };
}

/* =========================================================
   Main Exported Factory: createStadium3DEngine
   ========================================================= */
export function createStadium3DEngine(canvas, batSpecs, stadiumSpecs) {
  let isSoftwareGl = false;
  try {
    const probeCanvas = document.createElement('canvas');
    const probeGl =
      probeCanvas.getContext('webgl2', { powerPreference: 'high-performance' }) ||
      probeCanvas.getContext('webgl', { powerPreference: 'high-performance' });
    if (probeGl) {
      isSoftwareGl = detectSoftwareWebGL(probeGl);
      const loseExt = probeGl.getExtension('WEBGL_lose_context');
      if (loseExt) loseExt.loseContext();
    }
  } catch {
    isSoftwareGl = false;
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance'
    });
  } catch {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      powerPreference: 'default'
    });
  }

  canvas.addEventListener(
    'webglcontextlost',
    (e) => {
      e.preventDefault();
    },
    false
  );

  renderer.setPixelRatio(
    isSoftwareGl ? Math.min(window.devicePixelRatio || 1, 1.25) : Math.min(window.devicePixelRatio || 1, 2)
  );
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.shadowMap.enabled = !isSoftwareGl;
  if (!isSoftwareGl) renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy() || 1);

  try {
    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    scene.environment = pmrem.fromScene(roomEnv, 0.04).texture;
    roomEnv.dispose();
    pmrem.dispose();
  } catch {
    /* Fallback to direct hemi/key/rim scene lighting if PMREM is unavailable */
  }

  const camera = new THREE.PerspectiveCamera(42, 16 / 9, 0.4, 1900);
  camera.position.set(0.22, 4.9, 14.5);
  camera.lookAt(0, 3.1, -55);

  const hemi = new THREE.HemisphereLight('#c8e0ff', '#1e4228', 1.04);
  scene.add(hemi);

  const keyLight = new THREE.DirectionalLight('#fff4e0', 2.55);
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

  const rimLight = new THREE.DirectionalLight('#7dd3fc', 0.85);
  rimLight.position.set(-140, 80, -240);
  scene.add(rimLight);

  // Shared High-Res Park & Field Textures
  const turfTex = makeMowedTurfTexture(maxAniso);
  const dirtTex = makeDirtTexture(maxAniso);
  const ballTex = makeBaseballTexture(maxAniso);
  const cageNetTex = makeCageNetTexture(maxAniso);
  const bleacherTex = makeBleacherPlankTexture(maxAniso);

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
    scene.fog = new THREE.Fog(lowHex, 580, 1340);
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

  const turfGround = new THREE.Mesh(new THREE.CircleGeometry(990, 96), turfMat);
  turfGround.rotation.x = -Math.PI / 2;
  turfGround.receiveShadow = true;
  fieldGroup.add(turfGround);

  // True MLB/NCAA Regulation 95-ft Skinned Infield Dirt Arc centered on Pitcher's Mound (0, -60.5)
  // Remember: ShapeGeometry rotated -PI/2 around X maps shape (sx, sy) -> world (sx, 0, -sy)!
  const skinnedShape = new THREE.Shape();
  const arcCx = 0;
  const arcCy = 60.5;
  const arcR = 95.0;
  const arcStartA = Math.PI - 0.54;
  const arcEndA = 0.54;
  const x3bStart = arcCx + Math.cos(arcStartA) * arcR;
  const y3bStart = arcCy + Math.sin(arcStartA) * arcR;
  skinnedShape.moveTo(-14.5, 4.5);
  skinnedShape.lineTo(x3bStart, y3bStart);
  const arcSteps = 56;
  for (let i = 1; i <= arcSteps; i++) {
    const a = arcStartA + (i / arcSteps) * (arcEndA - arcStartA);
    skinnedShape.lineTo(arcCx + Math.cos(a) * arcR, arcCy + Math.sin(a) * arcR);
  }
  skinnedShape.lineTo(14.5, 4.5);
  skinnedShape.quadraticCurveTo(0, -14.5, -14.5, 4.5);
  skinnedShape.closePath();

  const infieldDirt = new THREE.Mesh(new THREE.ShapeGeometry(skinnedShape), dirtMat);
  infieldDirt.rotation.x = -Math.PI / 2;
  infieldDirt.position.set(0, 0.022, 0);
  infieldDirt.receiveShadow = true;
  fieldGroup.add(infieldDirt);

  // Contoured Inner Infield Turf Diamond with Clean Curved Bag Cutouts & Keyhole Dirt Apron (zero z-fighting!)
  const diamondShape = new THREE.Shape();
  diamondShape.moveTo(-10.5, 19.2);
  diamondShape.quadraticCurveTo(0, 14.5, 10.5, 19.2);    // curved front of 26-ft plate circle
  diamondShape.lineTo(50.2, 57.6);
  diamondShape.quadraticCurveTo(45.5, 64.0, 50.2, 70.4);   // 1B curved sliding-pit cutout
  diamondShape.lineTo(9.0, 111.6);
  diamondShape.quadraticCurveTo(0, 107.2, -9.0, 111.6);    // 2B curved sliding-pit cutout
  diamondShape.lineTo(-50.2, 70.4);
  diamondShape.quadraticCurveTo(-45.5, 64.0, -50.2, 57.6); // 3B curved sliding-pit cutout
  diamondShape.closePath();

  const innerGrass = new THREE.Mesh(new THREE.ShapeGeometry(diamondShape), turfMat);
  innerGrass.rotation.x = -Math.PI / 2;
  innerGrass.position.y = 0.036;
  innerGrass.receiveShadow = true;
  fieldGroup.add(innerGrass);

  // Unified Home-Plate Dirt Circle + Tapered Keyhole Runner Lane + Mound Apron (single non-overlapping ShapeGeometry!)
  const keyholeShape = new THREE.Shape();
  keyholeShape.absarc(0, -0.5, 13.8, 0.16, Math.PI - 0.16, true); // home plate circle
  keyholeShape.lineTo(-2.1, 14.0);
  keyholeShape.lineTo(-2.1, 52.0);
  keyholeShape.absarc(0, 60.5, 10.2, Math.PI + 1.36, -1.36, true); // smooth blend into 18-ft mound ring
  keyholeShape.lineTo(2.1, 52.0);
  keyholeShape.lineTo(2.1, 14.0);
  keyholeShape.closePath();

  const homeKeyholeMesh = new THREE.Mesh(new THREE.ShapeGeometry(keyholeShape), dirtMat);
  homeKeyholeMesh.rotation.x = -Math.PI / 2;
  homeKeyholeMesh.position.y = 0.041;
  homeKeyholeMesh.receiveShadow = true;
  fieldGroup.add(homeKeyholeMesh);

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

  const pitchingMachine = buildPitchingMachine();
  scene.add(pitchingMachine.grp);

  const batter = buildCompositeBatter(maxAniso);
  scene.add(batter.root);

  const plateCrew = buildCatcherAndUmpire();
  scene.add(plateCrew.grp);

  const fieldDefenders = buildFieldDefenders();
  scene.add(fieldDefenders.grp);

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
    new THREE.OctahedronGeometry(0.95, 0),
    new THREE.MeshPhysicalMaterial({
      color: '#fde047',
      emissive: '#f59e0b',
      emissiveIntensity: 0.72,
      roughness: 0.22,
      metalness: 0.35,
      transparent: true,
      opacity: 0.88
    })
  );
  apexMarker.visible = false;
  scene.add(apexMarker);

  const landingRing = new THREE.Group();
  const landingOuterRing = new THREE.Mesh(
    new THREE.RingGeometry(2.1, 3.8, 32),
    new THREE.MeshBasicMaterial({ color: '#38bdf8', side: THREE.DoubleSide, transparent: true, opacity: 0.92 })
  );
  landingOuterRing.rotation.x = -Math.PI / 2;
  const landingInnerDot = new THREE.Mesh(
    new THREE.CircleGeometry(1.15, 24),
    new THREE.MeshBasicMaterial({ color: '#fde047', side: THREE.DoubleSide, transparent: true, opacity: 0.78 })
  );
  landingInnerDot.rotation.x = -Math.PI / 2;
  landingInnerDot.position.y = 0.04;
  const landingBeacon = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.42, 8.5, 12),
    new THREE.MeshBasicMaterial({ color: '#38bdf8', transparent: true, opacity: 0.36, depthWrite: false })
  );
  landingBeacon.position.y = 4.25;
  landingRing.add(landingOuterRing, landingInnerDot, landingBeacon);
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

  // Zero-GC 3D Wind-Drift Chalk/Air Mote Layer across Outfield
  const WIND_MOTE_COUNT = 96;
  const windMotePos = new Float32Array(WIND_MOTE_COUNT * 3);
  const windMotePhase = new Float32Array(WIND_MOTE_COUNT);
  for (let i = 0; i < WIND_MOTE_COUNT; i++) {
    windMotePos[i * 3 + 0] = (((i * 73) % 440) - 220);
    windMotePos[i * 3 + 1] = 3 + ((i * 29) % 62);
    windMotePos[i * 3 + 2] = 18 - ((i * 97) % 455);
    windMotePhase[i] = i * 0.71;
  }
  const windMotesGeom = new THREE.BufferGeometry();
  windMotesGeom.setAttribute('position', new THREE.BufferAttribute(windMotePos, 3));
  const windMotesMat = new THREE.PointsMaterial({
    color: '#e2e8f0',
    size: 1.35,
    transparent: true,
    opacity: 0.14,
    depthWrite: false
  });
  const windMotes = new THREE.Points(windMotesGeom, windMotesMat);
  windMotes.frustumCulled = false;
  scene.add(windMotes);

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
    const id = stSpec.id;
    const isPro = stSpec.tier === 'pro';
    const isHs = stSpec.tier === 'hs';
    const yellowMat = new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.36, metalness: 0.18 });
    const concreteMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.86, side: THREE.DoubleSide });
    const steelMat = new THREE.MeshStandardMaterial({ color: '#475569', metalness: 0.72, roughness: 0.34 });
    const glassMat = new THREE.MeshPhysicalMaterial({ color: '#bae6fd', transparent: true, opacity: 0.42, roughness: 0.08, side: THREE.DoubleSide });
    const warnMat = new THREE.MeshStandardMaterial({
      map: dirtTex,
      color: id === 'hs-corona' ? '#8c4c28' : '#7c4728',
      roughness: 0.94,
      side: THREE.DoubleSide
    });

    if (id === 'cage') {
      // True Enclosed Pro D1 Indoor Batting Cage & HitTrax Performance Facility (Zero open gaps or ball pass-through!)
      const netMat = new THREE.MeshBasicMaterial({ map: cageNetTex, transparent: true, opacity: 0.72, side: THREE.DoubleSide, depthWrite: false });
      const glowMat = new THREE.MeshBasicMaterial({ color: '#e0f2fe' });
      const darkDeckMat = new THREE.MeshStandardMaterial({ color: '#0f1c30', roughness: 0.78, side: THREE.DoubleSide });
      const padWallMat = new THREE.MeshStandardMaterial({ color: '#142947', roughness: 0.72, side: THREE.DoubleSide });

      const hitMat = new THREE.Mesh(
        new THREE.BoxGeometry(16, 0.09, 20),
        new THREE.MeshStandardMaterial({ color: '#134e2a', roughness: 0.85 })
      );
      hitMat.position.set(0, 0.045, 0);
      grp.add(hitMat);

      const cageW = 58;
      const cagePeak = 34;
      [-296, -240, -180, -120, -60, 0, 16].forEach((z) => {
        const archPts = [];
        for (let s = 0; s <= 16; s++) {
          const t = (s / 16) * 2 - 1;
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

      [-cageW, 0, cageW].forEach((rx) => {
        const ry = rx === 0 ? cagePeak : cagePeak * 0.64;
        const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 314, 8), steelMat);
        rail.rotation.x = Math.PI / 2;
        rail.position.set(rx, ry, -140);
        grp.add(rail);
      });

      const roofPos = [];
      const roofUv = [];
      const roofIdx = [];
      const rSlices = 18;
      for (let zStep = 0; zStep <= 1; zStep++) {
        const z = zStep === 0 ? 16 : -296;
        for (let s = 0; s <= rSlices; s++) {
          const t = (s / rSlices) * 2 - 1;
          roofPos.push(t * cageW, cagePeak * (1 - 0.36 * t * t), z);
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

      [-1, 1].forEach((side) => {
        const sidePad = new THREE.Mesh(new THREE.BoxGeometry(1.4, 6.2, 314), padWallMat);
        sidePad.position.set(side * (cageW + 0.6), 3.1, -140);
        const sideNet = new THREE.Mesh(new THREE.PlaneGeometry(314, cagePeak * 0.64 - 5.5), netMat);
        sideNet.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
        sideNet.position.set(side * cageW, 5.8 + (cagePeak * 0.64 - 5.5) * 0.5, -140);
        grp.add(sidePad, sideNet);
      });

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

      [100, 200, 280].forEach((d) => {
        const stripe = new THREE.Mesh(new THREE.PlaneGeometry(cageW * 1.9, 1.2), d === 280 ? yellowMat : chalkMat);
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(0, 0.06, -d);
        grp.add(stripe);
      });

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

      const extRoof = new THREE.Mesh(roofNetGeom, darkDeckMat);
      extRoof.position.y = 0.6;
      grp.add(extRoof);

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
      const unitBody = new THREE.Mesh(
        new THREE.ExtrudeGeometry(makeRoundedRectShape(0.85, 0.45, 0.12), {
          depth: 0.42,
          bevelEnabled: true,
          bevelThickness: 0.05,
          bevelSize: 0.05,
          bevelSegments: 2
        }),
        podMat
      );
      unitBody.position.set(0, 2.42, -0.2);
      const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.08, 16), new THREE.MeshBasicMaterial({ color: '#38bdf8' }));
      lens.rotation.x = Math.PI / 2;
      lens.position.set(0, 2.42, 0.26);
      rapGrp.add(unitBody, lens);
      grp.add(rapGrp);

      return grp;
    }

    // 1. Continuous Warning Track Strip (16 ft deep inside wall)
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

    const backWallPalette = {
      fenway: '#1e3a2f',
      petco: '#2f241d',
      coors: '#163c29',
      oracle: '#7c2d23',
      wrigley: '#0c3b2e',
      yankee: '#0d2240',
      sdsu: '#a6192e',
      usc: '#990000',
      'pk-park': '#154733',
      stanford: '#8c1515',
      ucsb: '#003660',
      'cal-poly': '#154734',
      'hs-corona': '#7f1d1d',
      'hs-rb': '#0f294a',
      'hs-tp': '#991b1b',
      'hs-cchs': '#6b1414',
      'hs-eastlake': '#1e40af'
    };
    const chairPalette = {
      fenway: '#166534',
      petco: '#292524',
      coors: '#166534',
      oracle: '#c2410c',
      wrigley: '#15803d',
      yankee: '#1e3a8a',
      sdsu: '#18181b',
      usc: '#990000',
      'pk-park': '#154733',
      stanford: '#8c1515',
      ucsb: '#003660',
      'cal-poly': '#154734',
      'hs-corona': '#475569',
      'hs-rb': '#475569',
      'hs-tp': '#475569',
      'hs-cchs': '#475569',
      'hs-eastlake': '#475569'
    };

    const accentColor = stSpec.wallCap || '#facc15';
    const chairHex = chairPalette[id] || '#1d4ed8';
    const padHex = backWallPalette[id] || '#102a4e';

    // Park-Specific Architectural Masonry/Facade Material (Brick, Sandstone, Concrete)
    let masonryTex = null;
    if (
      id === 'fenway' ||
      id === 'wrigley' ||
      id === 'oracle' ||
      id === 'usc' ||
      id === 'petco' ||
      id === 'coors' ||
      id === 'stanford' ||
      id === 'hs-corona' ||
      id === 'hs-cchs'
    ) {
      const bHex = id === 'usc' ? '#8c2d23' : id === 'stanford' ? '#8c3b2b' : '#7f2f22';
      masonryTex = makeMasonryTexture(bHex, '#cbbcb0', false, maxAniso);
    } else if (id === 'yankee' || id === 'sdsu') {
      masonryTex = makeMasonryTexture(id === 'sdsu' ? '#cbd5e1' : '#dbd7cc', '#8b96a6', true, maxAniso);
    }
    const exteriorMat = masonryTex
      ? new THREE.MeshStandardMaterial({ map: masonryTex, roughness: 0.82, side: THREE.DoubleSide })
      : new THREE.MeshStandardMaterial({ color: '#2c3a4f', roughness: 0.85, side: THREE.DoubleSide });

    // Exterior Apron / Plaza Pavement extending cleanly out to horizon (zero abrupt hollow edge!)
    const outerGroundR = 990;
    const outerRadiusFn = (phi) => {
      const aPhi = Math.abs(phi);
      if (aPhi <= 0.785) return stSpec.wallDist(phi) + 2;
      // Smoothly taper along 1B/3B foul walls back to home plate
      const foulT = clamp((aPhi - 0.785) / (Math.PI * 0.56 - 0.785), 0, 1);
      const poleD = stSpec.wallDist(phi >= 0 ? 0.785 : -0.785);
      return poleD * (1 - foulT) + (isHs ? 44 : 58) * foulT;
    };
    const plazaStrip = createSweptStripGeometry(
      outerRadiusFn,
      () => outerGroundR,
      () => 0.02,
      () => 0.02,
      -Math.PI,
      Math.PI,
      108
    );
    const plazaColor = isHs ? '#1b3526' : id === 'oracle' || id === 'petco' ? '#1a2736' : id === 'cal-poly' ? '#243528' : '#1b2432';
    const plazaMesh = new THREE.Mesh(
      plazaStrip,
      new THREE.MeshStandardMaterial({ color: plazaColor, roughness: 0.94, side: THREE.DoubleSide })
    );
    plazaMesh.receiveShadow = true;
    grp.add(plazaMesh);

    // 2. Outfield Perimeter Wall (HS = Authentic Chain-Link + Windscreen + Steel Posts; Pro/Col = Solid Padded Wall)
    if (isHs) {
      const fenceH = 8.0;
      const fenceTex = makeChainLinkFenceTexture(stSpec, maxAniso);
      const fenceMat = new THREE.MeshStandardMaterial({
        map: fenceTex,
        transparent: true,
        alphaTest: 0.14,
        roughness: 0.65,
        side: THREE.DoubleSide
      });
      const fenceGeom = createSweptWallGeometry(stSpec.wallDist, () => fenceH, -0.785, 0.785, 72, 0.15);
      grp.add(new THREE.Mesh(fenceGeom, fenceMat));
      grp.add(buildTopCopingTube(stSpec.wallDist, () => fenceH, -0.785, 0.785, 72, 0.42, yellowMat));
      // Galvanized steel fence posts every ~12ft along the arc
      grp.add(buildSupportColumns(stSpec.wallDist, 0.2, 0, fenceH + 0.3, -0.785, 0.785, 28, 0.24, steelMat));
    } else {
      const wallTex = makeParkWallTexture(stSpec, maxAniso);
      const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.56, side: THREE.DoubleSide });
      const wallGeom = createSweptWallGeometry(stSpec.wallDist, stSpec.wallHeight, -0.785, 0.785, 96, 3.8);
      const wallMesh = new THREE.Mesh(wallGeom, wallMat);
      wallMesh.castShadow = true;
      wallMesh.receiveShadow = true;
      grp.add(wallMesh);
      grp.add(buildTopCopingTube(stSpec.wallDist, stSpec.wallHeight, -0.785, 0.785, 96, 0.82, yellowMat));
    }

    // Backstop Knee Wall + Netting Behind Home Plate + Foul-Line Extensions
    const backstopRadius = isHs ? 44 : 56;
    const backstopWallMat = new THREE.MeshStandardMaterial({ color: padHex, roughness: 0.62, side: THREE.DoubleSide });
    grp.add(
      new THREE.Mesh(
        createSweptWallGeometry(() => backstopRadius, () => (isHs ? 3.2 : 4.6), Math.PI * 0.72, Math.PI * 1.28, 36, 2.2),
        backstopWallMat
      )
    );
    grp.add(
      new THREE.Mesh(
        createSweptWallGeometry(() => backstopRadius + 0.4, () => (isHs ? 18 : 25), Math.PI * 0.76, Math.PI * 1.24, 28, 0.2),
        new THREE.MeshBasicMaterial({ map: cageNetTex, transparent: true, opacity: 0.42, side: THREE.DoubleSide, depthWrite: false })
      )
    );

    [-1, 1].forEach((side) => {
      const poleD = stSpec.wallDist(side * 0.785);
      const px = Math.sin(side * 0.785) * poleD;
      const pz = -Math.cos(side * 0.785) * poleD;
      const sx = side * (isHs ? 34 : 42);
      const sz = isHs ? 20 : 28;
      const wallCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(sx, 2.2, sz), new THREE.Vector3(px, 2.2, pz)]);
      grp.add(new THREE.Mesh(new THREE.TubeGeometry(wallCurve, 12, isHs ? 0.55 : 1.7, 6, false), isHs ? steelMat : backstopWallMat));
    });

    // 3. Sculpted Tapered Lathe Foul Poles + Mesh Screens
    const poleH = isHs ? 36 : isPro ? 78 : 66;
    const foulPoleProfile = [
      new THREE.Vector2(isHs ? 0.34 : 0.58, 0),
      new THREE.Vector2(isHs ? 0.26 : 0.42, poleH * 0.5),
      new THREE.Vector2(isHs ? 0.18 : 0.28, poleH),
      new THREE.Vector2(0, poleH + 0.5)
    ];
    const foulPoleGeom = new THREE.LatheGeometry(foulPoleProfile, 14);
    [-0.785, 0.785].forEach((phi) => {
      const d = stSpec.wallDist(phi);
      const pole = new THREE.Mesh(foulPoleGeom, yellowMat);
      pole.position.set(Math.sin(phi) * d, 0, -Math.cos(phi) * d);
      const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(isHs ? 2.0 : 3.2, poleH * 0.74),
        new THREE.MeshBasicMaterial({ color: '#fde047', side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
      );
      screen.position.set(Math.sin(phi) * (d - 1.5), poleH * 0.52, -Math.cos(phi) * (d - 1.5));
      screen.rotation.y = phi;
      grp.add(pole, screen);
    });

    // 4. Watertight Solid Stepped Stadium Bowls (Distinct Architecture Per Every Single Park — ZERO generic twins!)
    const seatsTex = isHs
      ? bleacherTex
      : makeEmptyStadiumSeatsTexture('#1e293b', chairHex, accentColor, maxAniso);
    const seatsMat = new THREE.MeshStandardMaterial({
      map: seatsTex,
      roughness: isHs ? 0.45 : 0.76,
      metalness: isHs ? 0.32 : 0.05,
      side: THREE.DoubleSide
    });
    const railMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.68, roughness: 0.28 });
    const chairMat = new THREE.MeshStandardMaterial({ color: chairHex, roughness: 0.42, metalness: 0.12 });
    const grassBermMat = new THREE.MeshStandardMaterial({ map: turfTex, color: '#276741', roughness: 0.92, side: THREE.DoubleSide });

    const seatTransforms = [];
    const addBowlSection = (distFn, tc, customSeatMat = seatsMat, customShellMat = exteriorMat) => {
      const steps = tc.steps || 7;
      const { seatsGeom, shellGeom } = createSolidSteppedBowlParts(
        distFn,
        tc.dOff,
        tc.dSpan,
        steps,
        tc.y0,
        tc.y1,
        tc.yBase != null ? tc.yBase : 0,
        tc.startPhi,
        tc.endPhi,
        tc.slices || 40,
        tc.backDepth || 11,
        tc.rearExtraH != null ? tc.rearExtraH : 7
      );
      const sMesh = new THREE.Mesh(seatsGeom, customSeatMat);
      sMesh.receiveShadow = true;
      const shMesh = new THREE.Mesh(shellGeom, customShellMat);
      shMesh.castShadow = true;
      shMesh.receiveShadow = true;
      grp.add(sMesh, shMesh);

      if (tc.yBase && tc.yBase > 4) {
        grp.add(buildSupportColumns(distFn, tc.dOff + 6, 0, tc.yBase + 1, tc.startPhi + 0.04, tc.endPhi - 0.04, Math.max(4, Math.round((tc.endPhi - tc.startPhi) * 10)), 1.75, concreteMat));
      }

      grp.add(
        buildTopCopingTube(
          (phi) => distFn(clamp(phi, -0.785, 0.785)) + tc.dOff,
          () => tc.y0 + 1.4,
          tc.startPhi,
          tc.endPhi,
          tc.slices || 34,
          0.3,
          railMat
        )
      );

      if (!isHs && !tc.noChairs) {
        const stepD = tc.dSpan / steps;
        const stepH = (tc.y1 - tc.y0) / steps;
        for (let s = 0; s < steps; s++) {
          const dMid = tc.dOff + (s + 0.52) * stepD;
          const yStep = tc.y0 + s * stepH;
          const nChairs = Math.max(8, Math.floor((tc.endPhi - tc.startPhi) * 34));
          for (let ci = 1; ci < nChairs; ci++) {
            if (ci % 9 === 0) continue;
            const phi = tc.startPhi + (ci / nChairs) * (tc.endPhi - tc.startPhi);
            const dist = distFn(clamp(phi, -0.785, 0.785)) + dMid;
            seatTransforms.push({ x: Math.sin(phi) * dist, y: yStep + 1.25, z: -Math.cos(phi) * dist, ry: -phi });
          }
        }
      }
    };

    // --- OUTFIELD GRANDSTANDS / BERMS / DECKS PER PARK ---
    if (isHs) {
      // High School Fields (CA / San Diego): Open grass outfields, dugout benches, varsity aluminum bleachers along 1B/3B lines!
      if (id === 'hs-tp' || id === 'hs-cchs') {
        grp.add(buildOutfieldBerm(stSpec.wallDist, 4, 38, 2.0, 12, -0.72, 0.72, 44, grassBermMat, concreteMat));
      }
      [-1, 1].forEach((side) => {
        const b1 = buildAluminumBleacherSection(58, 5, steelMat, seatsMat);
        b1.position.set(side * 68, 0, 6);
        b1.rotation.y = side * (Math.PI * 0.25);
        grp.add(b1);
      });
    } else if (id === 'sdsu') {
      // SDSU TONY GWYNN STADIUM: Aztec scarlet/black LF seating pavilion + CF Tony Gwynn Plaza hill + Mission Valley palms!
      addBowlSection(stSpec.wallDist, { startPhi: -0.77, endPhi: -0.26, dOff: 6, dSpan: 40, y0: 8, y1: 24, steps: 6, yBase: 0 });
      grp.add(buildOutfieldBerm(stSpec.wallDist, 6, 44, 2.8, 17, 0.22, 0.74, 30, grassBermMat, exteriorMat));
    } else if (id === 'usc') {
      // USC DEDEAUX FIELD: Red-brick Cardinal & Gold stands in LF/RF alleys overlooking Exposition Park & Coliseum arches!
      addBowlSection(stSpec.wallDist, { startPhi: -0.76, endPhi: -0.30, dOff: 7, dSpan: 36, y0: 8, y1: 22, steps: 6, yBase: 0 });
      grp.add(buildOutfieldBerm(stSpec.wallDist, 6, 42, 2.5, 15, 0.24, 0.74, 28, grassBermMat, exteriorMat));
    } else if (id === 'pk-park') {
      // OREGON PK PARK: Lush emerald grass berms behind LF/CF + cozy Ducks bullpen terrace!
      grp.add(buildOutfieldBerm(stSpec.wallDist, 6, 44, 3.0, 16, -0.75, -0.20, 28, grassBermMat, concreteMat));
      grp.add(buildOutfieldBerm(stSpec.wallDist, 6, 44, 3.0, 16, 0.20, 0.75, 28, grassBermMat, concreteMat));
    } else if (id === 'stanford') {
      // STANFORD SUNKEN DIAMOND: Authentic continuous sunken grass berm amphitheater sweeping across the entire outfield!
      grp.add(buildOutfieldBerm(stSpec.wallDist, 5, 52, 2.5, 21, -0.78, 0.78, 56, grassBermMat, exteriorMat));
    } else if (id === 'ucsb') {
      // UCSB CAESAR UYESAKA: Coastal grass viewing berms opening toward Santa Ynez Mountains & Pacific horizon!
      grp.add(buildOutfieldBerm(stSpec.wallDist, 6, 44, 2.5, 15, -0.75, 0.75, 48, grassBermMat, concreteMat));
    } else if (id === 'cal-poly') {
      // CAL POLY BAGGETT STADIUM: Open LF lawn berm + right-field hillside bleachers facing Bishop Peak!
      grp.add(buildOutfieldBerm(stSpec.wallDist, 6, 42, 2.5, 16, -0.75, -0.18, 28, grassBermMat, concreteMat));
      addBowlSection(stSpec.wallDist, { startPhi: 0.34, endPhi: 0.76, dOff: 8, dSpan: 32, y0: 8, y1: 20, steps: 5, yBase: 0 });
    } else if (id === 'fenway') {
      // FENWAY PARK: Solid Green Monster Top Seats ON TOP of 37-ft LF wall + Low Cozy Right-Center/Right Field Bleachers curving to Pesky's Pole!
      addBowlSection(stSpec.wallDist, { startPhi: -0.77, endPhi: -0.26, dOff: 4, dSpan: 24, y0: 38, y1: 48, yBase: 37, steps: 4, backDepth: 5, rearExtraH: 4 });
      addBowlSection(stSpec.wallDist, { startPhi: 0.08, endPhi: 0.77, dOff: 7, dSpan: 48, y0: 8, y1: 28, steps: 8, yBase: 0 });
    } else if (id === 'petco') {
      // PETCO PARK (SAN DIEGO): LF & RF sandstone bowls flanking Western Metal Building + famous Park at the Park grass lawn behind LCF/CF!
      addBowlSection(stSpec.wallDist, { startPhi: -0.56, endPhi: -0.22, dOff: 8, dSpan: 48, y0: 10, y1: 31, steps: 7, yBase: 0 });
      grp.add(buildOutfieldBerm(stSpec.wallDist, 8, 56, 3.0, 22, -0.18, 0.20, 26, grassBermMat, exteriorMat));
      addBowlSection(stSpec.wallDist, { startPhi: 0.22, endPhi: 0.77, dOff: 8, dSpan: 48, y0: 10, y1: 31, steps: 7, yBase: 0 });
    } else if (id === 'coors') {
      // COORS FIELD (DENVER): LF & RF Outfield Bleachers framing the CF Rockpile waterfall pine plaza!
      addBowlSection(stSpec.wallDist, { startPhi: -0.77, endPhi: -0.21, dOff: 9, dSpan: 52, y0: 10, y1: 34, steps: 8, yBase: 0 });
      addBowlSection(stSpec.wallDist, { startPhi: 0.21, endPhi: 0.77, dOff: 9, dSpan: 52, y0: 10, y1: 34, steps: 8, yBase: 0 });
    } else if (id === 'oracle') {
      // ORACLE PARK: Deep Left Field Charcoal Bleachers + Open Low Walkway in RF Looking Onto McCovey Cove!
      addBowlSection(stSpec.wallDist, { startPhi: -0.76, endPhi: -0.18, dOff: 8, dSpan: 52, y0: 9, y1: 34, steps: 9, yBase: 0 });
      const rfArcade = new THREE.Mesh(
        createSweptStripGeometry((phi) => stSpec.wallDist(phi) + 4, (phi) => stSpec.wallDist(phi) + 22, () => 24, () => 24, 0.34, 0.78, 22),
        exteriorMat
      );
      grp.add(rfArcade);
    } else if (id === 'wrigley') {
      // WRIGLEY FIELD: Compact Vintage Single-Tier Waveland/Sheffield Green Outfield Bleachers framing the CF Manual Scoreboard
      addBowlSection(stSpec.wallDist, { startPhi: -0.76, endPhi: -0.24, dOff: 8, dSpan: 44, y0: 12, y1: 32, steps: 7, yBase: 0 });
      addBowlSection(stSpec.wallDist, { startPhi: 0.24, endPhi: 0.76, dOff: 8, dSpan: 44, y0: 12, y1: 32, steps: 7, yBase: 0 });
    } else {
      // YANKEE STADIUM: Monumental Two-Tier Wrapped Stadium Bowl + Signature Short-Porch RF Bleachers!
      addBowlSection(stSpec.wallDist, { startPhi: -0.78, endPhi: -0.16, dOff: 10, dSpan: 54, y0: 9, y1: 34, steps: 9, yBase: 0 });
      addBowlSection(stSpec.wallDist, { startPhi: 0.16, endPhi: 0.78, dOff: 10, dSpan: 54, y0: 9, y1: 34, steps: 9, yBase: 0 });
      addBowlSection(stSpec.wallDist, { startPhi: -0.78, endPhi: -0.22, dOff: 72, dSpan: 40, y0: 41, y1: 63, yBase: 36, steps: 6 });
      addBowlSection(stSpec.wallDist, { startPhi: 0.22, endPhi: 0.78, dOff: 72, dSpan: 40, y0: 41, y1: 63, yBase: 36, steps: 6 });
    }

    // --- SOLID INFIELD & HOME-PLATE GRANDSTAND COMPLEX (Replaces floating infSteps lines!) ---
    const infRadiusFn = () => (isPro ? 62 : 56);
    if (isHs) {
      // Compact Varsity Brick Press Box Booth behind Home Plate backstop
      const hsPressGrp = new THREE.Group();
      hsPressGrp.position.set(0, 0, 56);
      const colL = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.75, 11, 10), steelMat);
      colL.position.set(-10, 5.5, 0);
      const colR = colL.clone();
      colR.position.x = 10;
      const booth = new THREE.Mesh(new THREE.BoxGeometry(26, 9.5, 12), exteriorMat);
      booth.position.set(0, 15.5, 0);
      const boothWin = new THREE.Mesh(new THREE.BoxGeometry(22, 4.2, 0.4), glassMat);
      boothWin.position.set(0, 16.2, -6.1);
      const boothRoof = new THREE.Mesh(new THREE.BoxGeometry(29, 1.4, 15), new THREE.MeshStandardMaterial({ color: padHex, roughness: 0.5 }));
      boothRoof.position.set(0, 20.8, 0);
      hsPressGrp.add(colL, colR, booth, boothWin, boothRoof);
      grp.add(hsPressGrp);
    } else {
      // Watertight Solid Closed Stepped Infield Bowl curving smoothly from 1B corner (0.54*PI) around Home Plate (PI) to 3B corner (1.46*PI)
      addBowlSection(infRadiusFn, {
        startPhi: Math.PI * 0.54,
        endPhi: Math.PI * 1.46,
        dOff: 0,
        dSpan: isPro ? 58 : 48,
        y0: 4.5,
        y1: isPro ? 30 : 25,
        yBase: 0,
        steps: isPro ? 9 : 7,
        slices: 44,
        backDepth: 14,
        rearExtraH: 8,
        noChairs: true
      });

      // Wrap-Around Press Box & Luxury Suite Glass Mezzanine Behind Home Plate
      const suiteR = infRadiusFn() + (isPro ? 52 : 42);
      const suiteY = isPro ? 30 : 25;
      grp.add(
        new THREE.Mesh(
          createSweptWallGeometry(() => suiteR, () => 11, Math.PI * 0.72, Math.PI * 1.28, 32, 12),
          exteriorMat
        )
      );
      const suiteGlass = new THREE.Mesh(
        createSweptWallGeometry(() => suiteR - 0.5, () => 5.5, Math.PI * 0.75, Math.PI * 1.25, 28, 0.4),
        glassMat
      );
      suiteGlass.position.y = suiteY + 3.2;
      grp.add(suiteGlass);

      // Smooth Baseline Concave Interpolation so 1B & 3B grandstands seamlessly bridge Infield Corner -> Foul Pole!
      const baselineDistFn = (phi) => {
        const aPhi = Math.abs(phi);
        const startA = 0.79;
        const endA = Math.PI * 0.55;
        const u = clamp((aPhi - startA) / (endA - startA), 0, 1);
        const poleD = stSpec.wallDist(phi >= 0 ? 0.785 : -0.785);
        const cornerD = infRadiusFn();
        // Smooth foul-line apron curve that stays just outside foul territory
        return poleD * Math.pow(1 - u, 1.35) + cornerD * (1 - Math.pow(1 - u, 1.35)) + 16;
      };

      // Close 3B (-1.72..-0.79) and 1B (+0.79..+1.72) Seating Wings so ZERO hollow gaps exist behind left & right seats!
      addBowlSection(baselineDistFn, {
        startPhi: -Math.PI * 0.55,
        endPhi: -0.79,
        dOff: 0,
        dSpan: isPro ? 52 : 42,
        y0: 5.5,
        y1: isPro ? 30 : 24,
        yBase: 0,
        steps: isPro ? 8 : 6,
        slices: 26,
        backDepth: 12,
        rearExtraH: 7
      });
      addBowlSection(baselineDistFn, {
        startPhi: 0.79,
        endPhi: Math.PI * 0.55,
        dOff: 0,
        dSpan: isPro ? 52 : 42,
        y0: 5.5,
        y1: isPro ? 30 : 24,
        yBase: 0,
        steps: isPro ? 8 : 6,
        slices: 26,
        backDepth: 12,
        rearExtraH: 7
      });

      // Outer 360-Degree Architectural Stadium Concourse Perimeter & Colonnade Wall (eliminates "floating open void" behind stands!)
      const perimeterR = (phi) => {
        const aPhi = Math.abs(phi);
        if (aPhi <= 0.785) return stSpec.wallDist(phi) + (isPro ? 94 : 74);
        if (aPhi <= Math.PI * 0.55) return baselineDistFn(phi) + (isPro ? 58 : 48);
        return infRadiusFn() + (isPro ? 96 : 62);
      };
      const concourseWall = new THREE.Mesh(
        createSweptWallGeometry(perimeterR, () => (isPro ? 44 : 30), -Math.PI, Math.PI, 96, 8),
        exteriorMat
      );
      concourseWall.castShadow = true;
      concourseWall.receiveShadow = true;
      grp.add(concourseWall);
      grp.add(buildTopCopingTube(perimeterR, () => (isPro ? 44.5 : 30.5), -Math.PI, Math.PI, 96, 1.3, masonryTex ? concreteMat : railMat));
      grp.add(buildSupportColumns(perimeterR, -4, 0, isPro ? 44 : 30, -Math.PI + 0.08, Math.PI - 0.08, 42, 1.9, concreteMat));

      // Park-Specific Infield Grandstand Upper Deck / Signature Canopy Roof
      if (isPro) {
        addBowlSection(infRadiusFn, { startPhi: Math.PI * 0.54, endPhi: Math.PI * 1.46, dOff: 58, dSpan: 44, y0: 41, y1: 66, yBase: 36, steps: 7, slices: 38, noChairs: true });
        if (id === 'coors') {
          // Coors Field famous Mile-High Purple Row 20 upper deck band
          grp.add(
            new THREE.Mesh(
              createSweptWallGeometry(() => infRadiusFn() + 80, () => 3.5, Math.PI * 0.62, Math.PI * 1.38, 36, 2.2),
              new THREE.MeshStandardMaterial({ color: '#4c1d95', roughness: 0.45 })
            )
          );
          grp.children[grp.children.length - 1].position.y = 52;
        }
        const roofHex =
          id === 'fenway'
            ? '#1e3a2f'
            : id === 'wrigley'
              ? '#14532d'
              : id === 'petco'
                ? '#e2e8f0'
                : id === 'coors'
                  ? '#1e293b'
                  : '#0f172a';
        grp.add(
          new THREE.Mesh(
            createSweptStripGeometry(() => infRadiusFn() + 56, () => infRadiusFn() + 114, () => 74, () => 78, Math.PI * 0.58, Math.PI * 1.42, 42),
            new THREE.MeshStandardMaterial({ color: roofHex, roughness: 0.45, side: THREE.DoubleSide })
          )
        );
      } else {
        const canopyColor =
          id === 'sdsu'
            ? '#111827'
            : id === 'usc'
              ? '#990000'
              : id === 'pk-park'
                ? '#154733'
                : id === 'stanford'
                  ? '#8c1515'
                  : id === 'ucsb'
                    ? '#003660'
                    : '#154734';
        const infRoof = new THREE.Mesh(
          createSweptStripGeometry(() => infRadiusFn() + 34, () => infRadiusFn() + 68, () => 40, () => 44, Math.PI * 0.62, Math.PI * 1.38, 36),
          new THREE.MeshStandardMaterial({ color: canopyColor, roughness: 0.42, side: THREE.DoubleSide })
        );
        grp.add(infRoof);
        grp.add(buildSupportColumns(infRadiusFn, 56, 25, 43, Math.PI * 0.66, Math.PI * 1.34, 9, 1.35, steelMat));
      }
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

    // 5. Foul Territory Warmup Bullpen Mounds & Plates
    [-1, 1].forEach((side) => {
      const bpMound = new THREE.Mesh(new THREE.LatheGeometry(moundPts, 20), dirtMat);
      bpMound.scale.set(0.65, 0.72, 0.65);
      bpMound.position.set(side * (isHs ? 98 : 124), 0, -102);
      const bpPlate = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.45), baseMat);
      bpPlate.rotation.x = -Math.PI / 2;
      bpPlate.position.set(side * (isHs ? 98 : 124), 0.62, -102);
      grp.add(bpMound, bpPlate);
    });

    // 6. Sculpted LED Stadium Light Towers
    const towerAngles = isHs ? [-0.55, 0.55] : [-0.64, -0.35, -0.1, 0.1, 0.35, 0.64];
    const lightGroup = buildStadiumLightTowers(stSpec, towerAngles, concreteMat, steelMat);
    if (isHs) lightGroup.scale.set(1, 0.68, 1);
    grp.add(lightGroup);

    // 7. Crisp High-Contrast CF Batter's Eye (Essential for picking up white baseball seams on EVERY park!) + Scoreboards
    const cfDist = stSpec.wallDist(0);
    const buildBattersEye = (width, height, distFromOrigin, eyeColorHex, isHedge = false) => {
      const beGrp = new THREE.Group();
      beGrp.position.set(0, 0, -distFromOrigin);
      const matteMat = new THREE.MeshStandardMaterial({
        color: eyeColorHex,
        roughness: 0.96,
        metalness: 0.0
      });
      const frameMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.65 });
      const centerFace = new THREE.Mesh(
        new THREE.ExtrudeGeometry(makeRoundedRectShape(width * 0.64, height, 1.4), {
          depth: 4.5,
          bevelEnabled: true,
          bevelThickness: 0.5,
          bevelSize: 0.5,
          bevelSegments: 2
        }),
        matteMat
      );
      centerFace.position.set(0, height * 0.5, 0);
      beGrp.add(centerFace);

      // Angled Wing Baffles framing the Batter's Eye cleanly without boxy look
      [-1, 1].forEach((side) => {
        const wing = new THREE.Mesh(
          new THREE.ExtrudeGeometry(makeRoundedRectShape(width * 0.24, height * 0.92, 1.2), {
            depth: 3.8,
            bevelEnabled: true,
            bevelThickness: 0.4,
            bevelSize: 0.4,
            bevelSegments: 2
          }),
          matteMat
        );
        wing.position.set(side * (width * 0.39), height * 0.46, 2.8);
        wing.rotation.y = -side * 0.24;
        beGrp.add(wing);
      });
      if (isHedge) {
        // Terraced sculpted hedge planters on Batter's Eye
        const planter = new THREE.Mesh(new THREE.BoxGeometry(width + 8, 4.2, 12), concreteMat);
        planter.position.set(0, 2.1, 4.5);
        beGrp.add(planter);
      } else {
        const headerCap = new THREE.Mesh(new THREE.BoxGeometry(width * 0.68, 1.8, 5.4), frameMat);
        headerCap.position.set(0, height + 0.9, 2.2);
        beGrp.add(headerCap);
      }
      return beGrp;
    };

    const boardTex = makeCollegeVideoboardTexture(
      stSpec.name.toUpperCase(),
      stSpec.dimsLabel,
      isPro ? 'MLB STATCAST · HITTRAX TELEMETRY' : isHs ? 'VARSITY PREP SCOREBOARD' : 'D1 RAPSODO · HITTRAX LIVE',
      padHex,
      accentColor,
      maxAniso
    );
    const buildVideoboardAt = (x, y, z, w, h, ry = 0, pylonMat = concreteMat) => {
      const sb = new THREE.Group();
      sb.position.set(x, y, z);
      sb.rotation.y = ry;
      const frame = new THREE.Mesh(
        new THREE.ExtrudeGeometry(makeRoundedRectShape(w, h, 3.2), {
          depth: 3.5,
          bevelEnabled: true,
          bevelThickness: 0.6,
          bevelSize: 0.6,
          bevelSegments: 2
        }),
        new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.68, metalness: 0.25 })
      );
      const face = new THREE.Mesh(new THREE.PlaneGeometry(w - 7, h - 5), new THREE.MeshBasicMaterial({ map: boardTex, fog: false }));
      face.position.z = 4.35;
      const pL = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.4, y * 1.15, 10), pylonMat);
      pL.position.set(-w * 0.28, -y * 0.56, 1.6);
      const pR = pL.clone();
      pR.position.x = w * 0.28;
      sb.add(frame, face, pL, pR);
      return sb;
    };

    if (id === 'wrigley') {
      // Sculpted dark ivy CF Batter's Eye right beneath classic green manual scoreboard
      grp.add(buildBattersEye(80, 28, cfDist + 12, '#092415', true));
      const wrigBoard = new THREE.Group();
      wrigBoard.position.set(0, 52, -(cfDist + 24));
      const wbBody = new THREE.Mesh(
        new THREE.ExtrudeGeometry(makeRoundedRectShape(84, 34, 1.5), { depth: 4, bevelEnabled: true, bevelThickness: 0.5, bevelSize: 0.5, bevelSegments: 2 }),
        new THREE.MeshStandardMaterial({ color: '#14532d', roughness: 0.58 })
      );
      const wbFace = new THREE.Mesh(new THREE.PlaneGeometry(76, 28), new THREE.MeshBasicMaterial({ map: boardTex, fog: false }));
      wbFace.position.z = 4.75;
      const clockFace = new THREE.Mesh(new THREE.CircleGeometry(7.5, 24), new THREE.MeshBasicMaterial({ color: '#fef9c3' }));
      clockFace.position.set(0, 23.5, 2.2);
      const clockRim = new THREE.Mesh(new THREE.TorusGeometry(7.8, 1.1, 8, 24), new THREE.MeshStandardMaterial({ color: '#b91c1c', roughness: 0.4 }));
      clockRim.position.set(0, 23.5, 2.2);
      const handH = new THREE.Mesh(new THREE.BoxGeometry(0.8, 4.8, 0.4), new THREE.MeshBasicMaterial({ color: '#0f172a' }));
      handH.position.set(1.2, 24.8, 2.5);
      handH.rotation.z = -0.6;
      wrigBoard.add(wbBody, wbFace, clockFace, clockRim, handH);
      grp.add(wrigBoard);
    } else if (isHs) {
      // Crisp Varsity Windscreen Batter's Eye in Dead CF + Compact Prep Scoreboard in Left-Center
      grp.add(buildBattersEye(58, 21, cfDist + 8, '#0b2617', false));
      const hsPhi = -0.24;
      const hsD = stSpec.wallDist(hsPhi) + 22;
      grp.add(buildVideoboardAt(Math.sin(hsPhi) * hsD, 25, -Math.cos(hsPhi) * hsD, 46, 22, -hsPhi, steelMat));
    } else {
      // Crisp Matte CF Batter's Eye framing below elevated Videoboard on EVERY Pro & College Ballpark!
      const eyeHex = id === 'oracle' || id === 'yankee' || id === 'petco' ? '#0b131e' : '#092416';
      grp.add(buildBattersEye(isPro ? 88 : 78, isPro ? 32 : 29, cfDist + 14, eyeHex, id === 'coors'));
      const sbPhi = id === 'pk-park' ? -0.44 : 0;
      const sbDist = id === 'pk-park' ? stSpec.wallDist(sbPhi) + 28 : cfDist + (isPro ? 44 : 38);
      const sbY = id === 'pk-park' ? 46 : isPro ? 72 : 62;
      grp.add(buildVideoboardAt(Math.sin(sbPhi) * sbDist, sbY, -Math.cos(sbPhi) * sbDist, isPro ? 108 : 88, isPro ? 46 : 38, -sbPhi, masonryTex ? exteriorMat : concreteMat));
    }

    const trunkMat = new THREE.MeshStandardMaterial({ color: '#4b3626', roughness: 0.92 });
    const leafMat = new THREE.MeshStandardMaterial({ roughness: 0.8 });

    // 8. Signature Stadium Landmarks, Coastal Skylines & Authentic Mountain Backdrops
    if (id === 'fenway') {
      const citgoGrp = new THREE.Group();
      citgoGrp.position.set(-255, 76, -365);
      citgoGrp.rotation.y = 0.56;
      const signTruss = new THREE.Mesh(
        new THREE.ExtrudeGeometry(makeRoundedRectShape(46, 38, 2.5), { depth: 2.0, bevelEnabled: true, bevelThickness: 0.4, bevelSize: 0.4, bevelSegments: 2 }),
        new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.55 })
      );
      const signBack = new THREE.Mesh(
        new THREE.ExtrudeGeometry(makeRoundedRectShape(40, 32, 2.0), { depth: 0.8, bevelEnabled: false }),
        new THREE.MeshBasicMaterial({ color: '#f8fafc', fog: false })
      );
      signBack.position.z = 2.4;
      const redTri = new THREE.Mesh(new THREE.CircleGeometry(13, 3), new THREE.MeshBasicMaterial({ color: '#dc2626', fog: false }));
      redTri.position.set(0, 2, 3.4);
      redTri.rotation.z = Math.PI / 6;
      citgoGrp.add(signTruss, signBack, redTri);
      grp.add(citgoGrp);
    } else if (id === 'petco') {
      // Historic Red-Brick Western Metal Supply Building down LF foul line!
      const wmsb = new THREE.Group();
      wmsb.position.set(-244, 0, -252);
      wmsb.rotation.y = 0.78;
      const bldgMesh = new THREE.Mesh(
        new THREE.ExtrudeGeometry(makeRoundedRectShape(84, 52, 2.2), { depth: 46, bevelEnabled: true, bevelThickness: 0.8, bevelSize: 0.8, bevelSegments: 2 }),
        exteriorMat
      );
      bldgMesh.position.set(0, 26, -23);
      const roofCap = new THREE.Mesh(new THREE.BoxGeometry(88, 3.2, 50), concreteMat);
      roofCap.position.y = 53;
      for (let wy = 14; wy <= 42; wy += 12) {
        for (let wx = -28; wx <= 28; wx += 14) {
          const w = new THREE.Mesh(new THREE.BoxGeometry(6.5, 7.5, 0.7), glassMat);
          w.position.set(wx, wy, 23.4);
          wmsb.add(w);
        }
      }
      wmsb.add(bldgMesh, roofCap);
      grp.add(wmsb);
      // Downtown San Diego Gaslamp skyline & palms beyond Park at the Park
      const towerMat = new THREE.MeshPhysicalMaterial({ color: '#1e293b', roughness: 0.25, metalness: 0.55, clearcoat: 0.5 });
      [[-150, -565, 52, 165], [-60, -610, 60, 210], [85, -595, 54, 185], [195, -550, 48, 145]].forEach(([tx, tz, tw, th]) => {
        const b = new THREE.Mesh(
          new THREE.ExtrudeGeometry(makeRoundedRectShape(tw, tw * 0.78, 3), { depth: th, bevelEnabled: true, bevelThickness: 1.2, bevelSize: 1.2, bevelSegments: 2 }),
          towerMat
        );
        b.rotation.x = -Math.PI / 2;
        b.position.set(tx, 0, tz);
        grp.add(b);
      });
      [[-85, -(cfDist + 28), 38, 2.8, -1.2], [75, -(cfDist + 30), 36, -2.5, 1.5], [185, -(cfDist + 10), 40, 2.2, 1.0]].forEach(([px, pz, ph, cx, cz]) => {
        const p = buildCaliforniaPalmTree(ph, cx, cz);
        p.position.set(px, 0, pz);
        grp.add(p);
      });
    } else if (id === 'coors') {
      // Rockies Snow-Capped Rocky Mountain Massif + CF Pine Timber Plaza & Cascading Waterfall
      grp.add(
        buildMountainRange({
          minDist: 500,
          depth: 320,
          maxHeight: 225,
          phiSpan: 1.24,
          seed: 2.4,
          lowHex: '#1f2d27',
          midHex: '#475569',
          peakHex: '#94a3b8',
          snowThreshold: 0.56
        })
      );
      const waterMat = new THREE.MeshPhysicalMaterial({ color: '#38bdf8', roughness: 0.14, metalness: 0.2, clearcoat: 0.85, transparent: true, opacity: 0.82 });
      const rockfall = new THREE.Mesh(new THREE.BoxGeometry(44, 18, 8), waterMat);
      rockfall.position.set(0, 9, -(cfDist + 22));
      grp.add(rockfall);
      grp.add(buildNaturalPineOrOakGrove([[-75, -(cfDist + 20)], [-44, -(cfDist + 24)], [44, -(cfDist + 24)], [75, -(cfDist + 20)], [-235, -420], [235, -420]], trunkMat, leafMat, true));
    } else if (id === 'oracle') {
      const bayWater = new THREE.Mesh(
        new THREE.PlaneGeometry(720, 620),
        new THREE.MeshPhysicalMaterial({ color: '#0369a1', roughness: 0.14, metalness: 0.35, clearcoat: 0.85 })
      );
      bayWater.rotation.x = -Math.PI / 2;
      bayWater.position.set(425, 0.25, -265);
      grp.add(bayWater);
      [[275, -210], [325, -175], [355, -255]].forEach(([bx, bz], i) => {
        const boat = new THREE.Group();
        boat.position.set(bx, 0.5, bz);
        boat.rotation.y = 0.4 + i * 0.5;
        const hull = new THREE.Mesh(
          new THREE.ExtrudeGeometry(makeRoundedRectShape(5.8, 15, 1.8), { depth: 2.0, bevelEnabled: true, bevelThickness: 0.4, bevelSize: 0.4, bevelSegments: 2 }),
          new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.4 })
        );
        hull.rotation.x = -Math.PI / 2;
        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 18, 8), steelMat);
        mast.position.y = 9.5;
        const sail = new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 2, 0), new THREE.Vector3(0, 17, 0), new THREE.Vector3(0, 3, 9)
        ]), new THREE.MeshStandardMaterial({ color: '#e2e8f0', side: THREE.DoubleSide }));
        sail.geometry.computeVertexNormals();
        boat.add(hull, mast, sail);
        grp.add(boat);
      });
      const brTower = new THREE.Group();
      brTower.position.set(420, 0, -490);
      const bLeg1 = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.8, 138, 10), steelMat);
      bLeg1.position.set(-14, 69, 0);
      const bLeg2 = bLeg1.clone();
      bLeg2.position.x = 14;
      const bCross1 = new THREE.Mesh(new THREE.BoxGeometry(34, 5, 5), steelMat);
      bCross1.position.y = 65;
      const bCross2 = bCross1.clone();
      bCross2.position.y = 115;
      brTower.add(bLeg1, bLeg2, bCross1, bCross2);
      grp.add(brTower);
      const cokeBottle = new THREE.Mesh(
        new THREE.LatheGeometry([new THREE.Vector2(3, 0), new THREE.Vector2(4.2, 18), new THREE.Vector2(2.2, 32), new THREE.Vector2(1.4, 42), new THREE.Vector2(0, 42.5)], 16),
        new THREE.MeshStandardMaterial({ color: '#b91c1c', roughness: 0.35 })
      );
      cokeBottle.position.set(-195, 28, -320);
      const gloveMonument = makeSculptedGloveMesh(new THREE.MeshStandardMaterial({ color: '#7c2d12', roughness: 0.55 }), concreteMat, 22, false);
      gloveMonument.position.set(-158, 42, -335);
      gloveMonument.rotation.y = 0.45;
      grp.add(cokeBottle, gloveMonument);
    } else if (id === 'wrigley') {
      grp.add(buildTopCopingTube(stSpec.wallDist, (phi) => stSpec.wallHeight(phi) + 1.1, -0.785, 0.785, 72, 0.28, railMat));
      const ivyLeaf = new THREE.IcosahedronGeometry(2.1, 1);
      const ivyInst = new THREE.InstancedMesh(ivyLeaf, new THREE.MeshStandardMaterial({ color: '#166534', roughness: 0.86 }), 140);
      const iDum = new THREE.Object3D();
      for (let i = 0; i < 140; i++) {
        const phi = -0.77 + (i / 139) * 1.54;
        const d = stSpec.wallDist(phi) - 0.6;
        iDum.position.set(Math.sin(phi) * d, 2.2 + ((i * 19) % 7), -Math.cos(phi) * d);
        iDum.scale.set(1.2, 1.0, 0.55);
        iDum.rotation.set(0, -phi, 0);
        iDum.updateMatrix();
        ivyInst.setMatrixAt(i, iDum.matrix);
      }
      ivyInst.instanceMatrix.needsUpdate = true;
      ivyInst.computeBoundingSphere();
      grp.add(ivyInst);
      [-0.64, -0.44, 0.44, 0.64].forEach((phi) => {
        const bd = stSpec.wallDist(phi) + 86;
        const brown = new THREE.Group();
        brown.position.set(Math.sin(phi) * bd, 0, -Math.cos(phi) * bd);
        brown.rotation.y = -phi;
        const bldg = new THREE.Mesh(
          new THREE.ExtrudeGeometry(makeRoundedRectShape(58, 46, 1.8), { depth: 36, bevelEnabled: true, bevelThickness: 0.6, bevelSize: 0.6, bevelSegments: 2 }),
          exteriorMat
        );
        bldg.position.set(0, 23, -18);
        const cornice = new THREE.Mesh(new THREE.BoxGeometry(62, 2.8, 39), concreteMat);
        cornice.position.set(0, 46.5, 0);
        for (let wy = 14; wy <= 34; wy += 10) {
          for (let wx = -18; wx <= 18; wx += 12) {
            const win = new THREE.Mesh(new THREE.BoxGeometry(5.5, 6.2, 0.6), glassMat);
            win.position.set(wx, wy, 18.2);
            brown.add(win);
          }
        }
        const roofStand = buildAluminumBleacherSection(44, 4, steelMat, seatsMat);
        roofStand.position.set(0, 47.8, -4);
        roofStand.rotation.y = Math.PI;
        brown.add(bldg, cornice, roofStand);
        grp.add(brown);
      });
    } else if (id === 'yankee') {
      const frieze = new THREE.Mesh(
        createSweptWallGeometry((phi) => stSpec.wallDist(clamp(phi, -0.785, 0.785)) + 74, () => 6.8, -0.82, 0.82, 64, 1.8),
        new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.34 })
      );
      frieze.position.y = 62;
      grp.add(frieze);
      const monGrp = new THREE.Group();
      monGrp.position.set(0, 0, -(cfDist + 24));
      const terrace = new THREE.Mesh(new THREE.CylinderGeometry(42, 46, 12, 24, 1, false, -0.7, 1.4), concreteMat);
      terrace.position.y = 6;
      const pilasterG = new THREE.CylinderGeometry(1.1, 1.3, 18, 10);
      [-28, -14, 0, 14, 28].forEach((px) => {
        const pil = new THREE.Mesh(pilasterG, new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.5 }));
        pil.position.set(px, 16, 12);
        monGrp.add(pil);
      });
      grp.add(monGrp);
      const viaductGrp = new THREE.Group();
      viaductGrp.position.set(350, 0, -240);
      viaductGrp.rotation.y = -0.35;
      const deckSpan = new THREE.Mesh(new THREE.BoxGeometry(16, 5.5, 520), steelMat);
      deckSpan.position.y = 46;
      const railSpan = new THREE.Mesh(new THREE.BoxGeometry(17.5, 2.2, 520), concreteMat);
      railSpan.position.y = 49.8;
      viaductGrp.add(deckSpan, railSpan);
      for (let vz = -220; vz <= 220; vz += 88) {
        [-5, 5].forEach((vx) => {
          const pier = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.6, 46, 12), concreteMat);
          pier.position.set(vx, 23, vz);
          viaductGrp.add(pier);
        });
      }
      grp.add(viaductGrp);
    } else if (id === 'sdsu') {
      // SDSU Tony Gwynn Stadium: Iconic Tony Gwynn #19 Plaza Monument, Aztec Scarlet/Black Canopy + Mission Valley Hills & SoCal Palms!
      const gwynnMon = new THREE.Group();
      gwynnMon.position.set(-148, 0, -(cfDist + 14));
      gwynnMon.rotation.y = 0.34;
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(36, 12, 14), concreteMat);
      plinth.position.y = 6;
      const plaqueTex = makeCollegeVideoboardTexture('TONY GWYNN #19', 'MR. PADRE · .338 LIFETIME', 'SAN DIEGO STATE AZTECS', '#111827', '#a6192e', maxAniso);
      const plaque = new THREE.Mesh(new THREE.PlaneGeometry(32, 18), new THREE.MeshBasicMaterial({ map: plaqueTex }));
      plaque.position.set(0, 24, 2);
      const monumentWall = new THREE.Mesh(
        new THREE.ExtrudeGeometry(makeRoundedRectShape(38, 24, 2), { depth: 4, bevelEnabled: true, bevelThickness: 0.4, bevelSize: 0.4, bevelSegments: 2 }),
        new THREE.MeshStandardMaterial({ color: '#a6192e', roughness: 0.45 })
      );
      monumentWall.position.y = 24;
      gwynnMon.add(plinth, monumentWall, plaque);
      grp.add(gwynnMon);
      grp.add(buildMountainRange({ minDist: 510, depth: 250, maxHeight: 114, phiSpan: 1.18, seed: 2.8, lowHex: '#1f2e22', midHex: '#4b4f3a', peakHex: '#73705a' }));
      [[-215, -370, 38, 2.8, -1.2], [-100, -(cfDist + 24), 40, -2.1, 1.4], [125, -(cfDist + 22), 36, 2.2, 1.0], [220, -365, 42, -2.8, -1.0]].forEach(([px, pz, ph, cx, cz]) => {
        const p = buildCaliforniaPalmTree(ph, cx, cz);
        p.position.set(px, 0, pz);
        grp.add(p);
      });
    } else if (id === 'usc') {
      // USC Dedeaux Field: Iconic LA Memorial Coliseum Peristyle Arches & Olympic Cauldron + Exposition Park Palms + DTLA Skyline!
      const peristyle = new THREE.Group();
      peristyle.position.set(160, 0, -(cfDist + 65));
      peristyle.rotation.y = -0.34;
      const colBase = new THREE.Mesh(new THREE.BoxGeometry(108, 34, 18), concreteMat);
      colBase.position.y = 17;
      for (let ax = -36; ax <= 36; ax += 18) {
        const archPillar = new THREE.Mesh(new THREE.BoxGeometry(6, 24, 10), new THREE.MeshStandardMaterial({ color: '#e2dcd0', roughness: 0.6 }));
        archPillar.position.set(ax, 44, 0);
        peristyle.add(archPillar);
      }
      const torchTower = new THREE.Mesh(new THREE.BoxGeometry(14, 70, 14), new THREE.MeshStandardMaterial({ color: '#e2dcd0', roughness: 0.55 }));
      torchTower.position.set(0, 35, 2);
      const cauldron = new THREE.Mesh(new THREE.CylinderGeometry(7.5, 4.5, 7, 12), new THREE.MeshStandardMaterial({ color: '#990000', roughness: 0.4 }));
      cauldron.position.set(0, 72, 2);
      const flame = new THREE.Mesh(new THREE.ConeGeometry(4.5, 10, 10), new THREE.MeshBasicMaterial({ color: '#fbbf24' }));
      flame.position.set(0, 79, 2);
      peristyle.add(colBase, torchTower, cauldron, flame);
      grp.add(peristyle);

      const dtlaMat = new THREE.MeshPhysicalMaterial({ color: '#1e293b', roughness: 0.28, metalness: 0.55, clearcoat: 0.48 });
      [[-245, -575, 48, 155], [-160, -610, 56, 205], [70, -620, 52, 180]].forEach(([tx, tz, tw, th]) => {
        const bldg = new THREE.Mesh(
          new THREE.ExtrudeGeometry(makeRoundedRectShape(tw, tw * 0.78, 3), { depth: th, bevelEnabled: true, bevelThickness: 1.2, bevelSize: 1.2, bevelSegments: 2 }),
          dtlaMat
        );
        bldg.rotation.x = -Math.PI / 2;
        bldg.position.set(tx, 0, tz);
        grp.add(bldg);
      });
      [[-225, -360, 40, 2.5, -1.2], [-115, -(cfDist + 26), 38, -2.0, 1.4], [240, -355, 42, -2.5, -1.0]].forEach(([px, pz, ph, cx, cz]) => {
        const p = buildCaliforniaPalmTree(ph, cx, cz);
        p.position.set(px, 0, pz);
        grp.add(p);
      });
    } else if (id === 'pk-park') {
      // Oregon PK Park: Autzen Stadium bowl silhouette beyond RF + Willamette pines + Coburg foothills!
      const autzen = new THREE.Group();
      autzen.position.set(295, 0, -(cfDist + 165));
      autzen.rotation.y = -0.35;
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(135, 115, 74, 28, 1, true, Math.PI * 0.65, Math.PI * 0.9), concreteMat);
      bowl.position.y = 37;
      const greenTrim = new THREE.Mesh(new THREE.TorusGeometry(136, 3.5, 8, 28, Math.PI * 0.9), new THREE.MeshStandardMaterial({ color: '#154733', roughness: 0.5 }));
      greenTrim.rotation.x = Math.PI / 2;
      greenTrim.rotation.z = Math.PI * 0.15;
      greenTrim.position.y = 74;
      autzen.add(bowl, greenTrim);
      grp.add(autzen);
      grp.add(buildMountainRange({ minDist: 530, depth: 260, maxHeight: 118, phiSpan: 1.15, seed: 4.1, lowHex: '#0d261a', midHex: '#18442e', peakHex: '#335c47' }));
      grp.add(buildNaturalPineOrOakGrove([[-270, -370], [-200, -435], [-115, -475], [85, -475], [315, -365]], trunkMat, leafMat, true));
    } else if (id === 'stanford') {
      // Stanford Sunken Diamond: Hoover Tower spire on campus + CA palms + Santa Cruz / Palo Alto hills
      const hoover = new THREE.Group();
      hoover.position.set(-185, 0, -(cfDist + 210));
      const hShaft = new THREE.Mesh(
        new THREE.ExtrudeGeometry(makeRoundedRectShape(24, 24, 2), { depth: 115, bevelEnabled: false }),
        new THREE.MeshStandardMaterial({ color: '#e5dcc5', roughness: 0.65 })
      );
      hShaft.rotation.x = -Math.PI / 2;
      const hDome = new THREE.Mesh(new THREE.SphereGeometry(12, 16, 12), new THREE.MeshStandardMaterial({ color: '#b45309', roughness: 0.42 }));
      hDome.position.y = 118;
      hoover.add(hShaft, hDome);
      grp.add(hoover);
      grp.add(buildMountainRange({ minDist: 540, depth: 250, maxHeight: 112, phiSpan: 1.15, seed: 3.3, lowHex: '#1f2d21', midHex: '#435334', peakHex: '#6c6a4a' }));
      [[-240, -385, 42, 3, -1.5], [-165, -445, 38, -2, 1.5], [140, -455, 40, 2.5, 1.0], [235, -395, 44, -2.5, -1.5]].forEach(([px, pz, ph, cx, cz]) => {
        const p = buildCaliforniaPalmTree(ph, cx, cz);
        p.position.set(px, 0, pz);
        grp.add(p);
      });
    } else if (id === 'ucsb') {
      // UCSB Caesar Uyesaka: Dramatic Santa Ynez Mountain Wall behind CF + Pacific channel shimmer & coastal palms!
      grp.add(buildMountainRange({ minDist: 495, depth: 260, maxHeight: 175, phiSpan: 1.2, seed: 5.2, lowHex: '#253324', midHex: '#59503d', peakHex: '#8d7b66' }));
      const oceanBand = new THREE.Mesh(new THREE.PlaneGeometry(1200, 380), new THREE.MeshPhysicalMaterial({ color: '#0284c7', roughness: 0.16, metalness: 0.25, clearcoat: 0.78 }));
      oceanBand.rotation.x = -Math.PI / 2;
      oceanBand.position.set(220, 0.2, -(cfDist + 210));
      grp.add(oceanBand);
      [[-215, -365, 36, 2.8, -1], [-125, -430, 34, -2.2, 1.4], [150, -425, 38, 2.4, 1.2], [235, -360, 36, -3, -1]].forEach(([px, pz, ph, cx, cz]) => {
        const p = buildCaliforniaPalmTree(ph, cx, cz);
        p.position.set(px, 0, pz);
        grp.add(p);
      });
    } else if (id === 'cal-poly') {
      // Cal Poly Baggett Stadium: Iconic Volcanic Bishop Peak Crag + Nine Sisters ridge of San Luis Obispo!
      grp.add(
        buildMountainRange({
          minDist: 490,
          depth: 270,
          maxHeight: 132,
          phiSpan: 1.2,
          seed: 6.1,
          cragPhi: -0.18,
          cragAmp: 86,
          lowHex: '#253523',
          midHex: '#5b563c',
          peakHex: '#7d7362'
        })
      );
      grp.add(buildNaturalPineOrOakGrove([[-255, -340], [-185, -420], [185, -420], [265, -340]], trunkMat, leafMat, false));
    } else if (id === 'hs-corona') {
      // Corona HS (CA): Crimson & Gold varsity diamond + Cleveland National Forest foothills + CA palms
      grp.add(buildMountainRange({ minDist: 470, depth: 240, maxHeight: 138, phiSpan: 1.15, seed: 7.4, lowHex: '#273222', midHex: '#5c523b', peakHex: '#84745c' }));
      [[-215, -345, 38, 2.6, -1], [-135, -395, 35, -2.1, 1.4], [155, -390, 36, 2.4, 1.2], [230, -340, 38, -2.4, -1]].forEach(([px, pz, ph, cx, cz]) => {
        const p = buildCaliforniaPalmTree(ph, cx, cz);
        p.position.set(px, 0, pz);
        grp.add(p);
      });
    } else if (id === 'hs-rb' || id === 'hs-eastlake') {
      // Rancho Bernardo & Eastlake (San Diego): Rolling chaparral hills + campus buildings + SoCal palms
      const hillSeed = id === 'hs-rb' ? 8.3 : 9.1;
      grp.add(buildMountainRange({ minDist: 465, depth: 230, maxHeight: 108, phiSpan: 1.15, seed: hillSeed, lowHex: '#253526', midHex: '#4f5439', peakHex: '#737054' }));
      [[-205, -340, 35, 2.4, -1], [195, -345, 36, -2.6, 1.2]].forEach(([px, pz, ph, cx, cz]) => {
        const p = buildCaliforniaPalmTree(ph, cx, cz);
        p.position.set(px, 0, pz);
        grp.add(p);
      });
      grp.add(buildNaturalPineOrOakGrove([[-255, -280], [-135, -385], [135, -385], [255, -280]], trunkMat, leafMat, false));
    } else {
      // Torrey Pines & Cathedral Catholic (Coastal San Diego): Sculpted Torrey pine groves, coastal mesas & Del Mar palms
      grp.add(buildMountainRange({ minDist: 480, depth: 230, maxHeight: 82, phiSpan: 1.12, seed: id === 'hs-tp' ? 10.2 : 11.4, lowHex: '#1f3628', midHex: '#3f5a47', peakHex: '#647664' }));
      grp.add(buildNaturalPineOrOakGrove([[-250, -305], [-175, -370], [-85, -405], [95, -405], [185, -365], [255, -300]], trunkMat, leafMat, true));
      [[-125, -385, 36, 2.2, -1], [135, -385, 35, -2.2, 1.2]].forEach(([px, pz, ph, cx, cz]) => {
        const p = buildCaliforniaPalmTree(ph, cx, cz);
        p.position.set(px, 0, pz);
        grp.add(p);
      });
    }

    const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.48, 24, 10), steelMat);
    flagPole.position.set(48, 34, -(cfDist + 42));
    const flagPivot = new THREE.Group();
    flagPivot.position.set(48, 44, -(cfDist + 42));
    const flagMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 5.5),
      new THREE.MeshBasicMaterial({ color: accentColor, side: THREE.DoubleSide })
    );
    flagMesh.position.set(8, 0, 0);
    flagPivot.add(flagMesh);
    grp.add(flagPole, flagPivot);
    windFlags.push(flagPivot);

    return grp;
  }

  function getOrBuildStadiumGroup(id) {
    if (stadiumGroups[id]) return stadiumGroups[id];
    const spec = stadiumSpecs[id] || stadiumSpecs.sdsu;
    const g = buildStadiumGroup(spec);
    g.visible = false;
    scene.add(g);
    stadiumGroups[id] = g;
    return g;
  }

  /* =========================================================
     Pre-Allocated Camera & State Sync API (4 Views)
     ========================================================= */
  const _camTargetPos = new THREE.Vector3();
  const _camTargetLook = new THREE.Vector3();
  const _camCurLook = new THREE.Vector3(0, 3.1, -55);
  const _camStartPos = new THREE.Vector3(0.22, 4.9, 14.5);
  const _camStartLook = new THREE.Vector3(0, 3.1, -55);
  const _camArcDir = new THREE.Vector3();
  const _projVec = new THREE.Vector3();
  const _batUp = new THREE.Vector3(0, 1, 0);
  const _batDown = new THREE.Vector3(0, -1, 0);
  const _batKnob = new THREE.Vector3();
  const _batDir = new THREE.Vector3();
  const _batStanceAimK = new THREE.Vector3();
  const _batStanceAimD = new THREE.Vector3();
  const _batHandsLocal = new THREE.Vector3();
  const _armVec = new THREE.Vector3();
  const _armDir = new THREE.Vector3();
  const _armQuat = new THREE.Quaternion();
  const _batStanceK = new THREE.Vector3(-2.46, 4.18, 0.62);
  const _batStanceD = new THREE.Vector3(-0.18, 0.94, 0.29).normalize();
  const _batSlotK = new THREE.Vector3(-2.55, 3.24, 0.72);
  const _batSlotD = new THREE.Vector3(-0.34, 0.36, 0.87).normalize();
  const _batFollowK = new THREE.Vector3(-2.36, 4.12, -0.68);
  const _batFollowD = new THREE.Vector3(-0.56, 0.56, -0.61).normalize();
  const _batFollowOneHandK = new THREE.Vector3(-2.62, 4.48, -0.92);
  const _batFollowOneHandD = new THREE.Vector3(-0.74, 0.42, -0.52).normalize();
  const _batContactK = new THREE.Vector3();
  const _batContactD = new THREE.Vector3();
  const _topHandReleaseTarget = new THREE.Vector3();

  const CAMERA_FOVS = {
    'strike-zone': 40,
    'fish-eye': 55,
    'show-15': 43,
    broadcast: 34,
    'swing-lab': 42
  };
  const camTrans = {
    active: false,
    t: 0,
    dur: 0.6,
    arcLift: 1.4,
    arcOut: 2.8,
    fromFov: 40
  };
  let impactShake = 0;
  let lastRenderPhase = 'idle';

  function startCamTransition(dur = 0.6, arcLift = 1.4, arcOut = 2.8) {
    _camStartPos.copy(camera.position);
    _camStartLook.copy(_camCurLook);
    camTrans.fromFov = camera.fov;
    camTrans.dur = Math.max(0.18, dur);
    camTrans.arcLift = arcLift;
    camTrans.arcOut = arcOut;
    camTrans.t = 0;
    camTrans.active = true;
  }

  let curStadiumId = '';
  let curBatId = '';
  let curCameraMode = 'strike-zone'; // 'strike-zone' | 'fish-eye' | 'show-15' | 'broadcast' | 'swing-lab'
  let curFollowBall = true; // true = Track Ball mid-air; false = Let It Fly from plate
  let curBatterHand = 'R'; // 'R' | 'L'
  let curPitcherHand = 'R'; // 'R' | 'L'
  let curDeliveryMode = 'pitcher'; // 'pitcher' | 'machine'

  function applyBatterHandLayout() {
    const hSign = curBatterHand === 'L' ? -1 : 1;
    batter.root.position.set(-2.95 * hSign, 0.05, 0.25);
    batter.torso.rotation.y = hSign * Math.PI * 0.5;
    batter.head.position.x = 0.1 * hSign;
    batter.helmet.position.x = 0.1 * hSign;
    batter.earFlap.position.x = 0.12 * hSign;
    batter.earFlap.rotation.y = hSign === -1 ? Math.PI : 0;
    batter.cFlap.position.x = 0.27 * hSign;
    batter.cFlap.rotation.set(0.18, -0.38 * hSign, -0.3 * hSign);
    batter.visor.position.x = 0.32 * hSign;
    batter.visor.rotation.z = hSign * (-Math.PI * 0.5 + 0.4);
    batter.neck.position.x = 0.06 * hSign;
    batter.shoulderL.position.x = 0.18 * hSign;
    batter.shoulderR.position.x = 0.18 * hSign;
    batter.topArm.position.x = 0.22 * hSign;
    batter.bottomArm.position.x = 0.28 * hSign;
    batter.backLeg.hip.position.x = 0.02 * hSign;
    batter.backLeg.hip.rotation.z = -0.06 * hSign;
    batter.strideLeg.hip.position.x = 0.02 * hSign;
    batter.strideLeg.hip.rotation.z = 0.06 * hSign;
    const bShoe = batter.backLeg.knee.children[2];
    const sShoe = batter.strideLeg.knee.children[2];
    if (bShoe) bShoe.rotation.y = hSign * (Math.PI / 2);
    if (sShoe) sShoe.rotation.y = hSign * (Math.PI / 2);

    _batStanceK.set(-2.46 * hSign, 4.18, 0.62);
    _batStanceD.set(-0.18 * hSign, 0.94, 0.29).normalize();
    _batSlotK.set(-2.55 * hSign, 3.24, 0.72);
    _batSlotD.set(-0.34 * hSign, 0.36, 0.87).normalize();
    _batFollowK.set(-2.36 * hSign, 4.12, -0.68);
    _batFollowD.set(-0.56 * hSign, 0.56, -0.61).normalize();
    _batFollowOneHandK.set(-2.62 * hSign, 4.48, -0.92);
    _batFollowOneHandD.set(-0.74 * hSign, 0.42, -0.52).normalize();
  }

  function applyPitcherHandLayout() {
    const pSign = curPitcherHand === 'L' ? -1 : 1;
    pitcher.throwArmPivot.position.x = -0.68 * pSign;
    pitcher.gloveArmPivot.position.x = 0.68 * pSign;
  }

  function setBatterHand(hand) {
    const next = hand === 'L' ? 'L' : 'R';
    if (curBatterHand === next) return;
    curBatterHand = next;
    applyBatterHandLayout();
    startCamTransition(0.46, 0.6, 1.4);
  }

  function setPitcherHand(hand) {
    const next = hand === 'L' ? 'L' : 'R';
    if (curPitcherHand === next) return;
    curPitcherHand = next;
    applyPitcherHandLayout();
  }

  function setDeliveryMode(mode) {
    curDeliveryMode = mode === 'machine' ? 'machine' : 'pitcher';
  }

  function setStadium(id) {
    const resolvedId = stadiumSpecs[id] ? id : 'sdsu';
    if (curStadiumId === resolvedId && stadiumGroups[resolvedId]) return;
    curStadiumId = resolvedId;
    const activeGrp = getOrBuildStadiumGroup(resolvedId);
    for (const k of Object.keys(stadiumGroups)) {
      stadiumGroups[k].visible = k === resolvedId;
    }
    activeGrp.visible = true;
    const st = stadiumSpecs[resolvedId] || stadiumSpecs.sdsu;
    paintSky(st.skyTop, st.skyMid, st.skyLow);

    // Subtle Surface & Dugout Team Trim Character Per Ballpark (bright base tints so textures pop!)
    if (resolvedId === 'coors') {
      turfMat.color.set('#e6f7ea');
      dirtMat.color.set('#efc29a');
    } else if (resolvedId === 'hs-corona' || resolvedId === 'hs-rb' || resolvedId === 'hs-eastlake') {
      turfMat.color.set('#e2f2d2');
      dirtMat.color.set('#e3a77d');
    } else if (resolvedId === 'oracle' || resolvedId === 'petco' || resolvedId === 'ucsb' || resolvedId === 'sdsu') {
      turfMat.color.set('#ddf7e8');
      dirtMat.color.set('#dcb08e');
    } else {
      turfMat.color.set('#ffffff');
      dirtMat.color.set('#ffffff');
    }
    dugoutTrimMat.color.set(st.wallCap || '#0ea5e9');
  }

  function setBat(id) {
    if (curBatId === id) return;
    curBatId = id;
    for (const k of Object.keys(batGroups)) {
      batGroups[k].visible = k === id;
    }
  }

  function setCameraMode(mode) {
    const aliases = {
      pov: 'strike-zone',
      track: 'broadcast',
      side: 'swing-lab',
      'strike-zone': 'strike-zone',
      'fish-eye': 'fish-eye',
      'show-15': 'show-15',
      broadcast: 'broadcast',
      'swing-lab': 'swing-lab'
    };
    const next = aliases[mode];
    if (next && next !== curCameraMode) {
      curCameraMode = next;
      const isSideSwap = next === 'swing-lab' || next === 'broadcast';
      startCamTransition(isSideSwap ? 0.64 : 0.52, isSideSwap ? 1.8 : 0.9, isSideSwap ? 4.2 : 1.6);
    }
  }

  function setFollowBall(enabled) {
    const next = Boolean(enabled);
    if (curFollowBall === next) return;
    curFollowBall = next;
    startCamTransition(0.42, 0.8, 0.5);
  }

  applyBatterHandLayout();
  applyPitcherHandLayout();
  setStadium('sdsu');
  setBat('goods-2026');

  function resize(width, height) {
    const w = Math.max(160, Math.round(Number(width) || 0));
    const h = Math.max(90, Math.round(Number(height) || 0));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
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
    const pSign = curPitcherHand === 'L' ? -1 : 1;
    const hSign = curBatterHand === 'L' ? -1 : 1;
    const useMachine = (simState.deliveryMode || curDeliveryMode) === 'machine';

    pitcher.root.visible = !useMachine;
    pitchingMachine.grp.visible = useMachine;
    if (useMachine) {
      pitchingMachine.wheelTop.rotation.x -= dt * 34;
      pitchingMachine.wheelBot.rotation.x += dt * 34;
    } else {
      const pStridePivot = pSign > 0 ? pitcher.leftLegPivot : pitcher.rightLegPivot;
      const pStrideKnee = pSign > 0 ? pitcher.leftKneePivot : pitcher.rightKneePivot;
      const pPlantPivot = pSign > 0 ? pitcher.rightLegPivot : pitcher.leftLegPivot;
      const pPlantKnee = pSign > 0 ? pitcher.rightKneePivot : pitcher.leftKneePivot;

      // Fluid Multi-Phase Pitcher Biomechanics (RHP & LHP Stride + High 3/4 Whip)
      if (simState.phase === 'windup') {
        const p = clamp(simState.t, 0, 1);
        const lift = smoothStep(0.0, 0.44, p);
        const drop = smoothStep(0.42, 0.85, p);
        const whip = smoothStep(0.62, 1.0, p);

        pStridePivot.rotation.x = -lift * 1.12 + drop * 1.48;
        pStrideKnee.rotation.x = lift * 1.32 - drop * 1.12;
        pPlantPivot.rotation.x = 0;
        pPlantKnee.rotation.x = 0.12 + drop * 0.32;
        pitcher.torsoPivot.rotation.y = pSign * (-0.34 * lift + 0.52 * whip);
        pitcher.torsoPivot.rotation.x = 0.24 * whip;
        pitcher.throwArmPivot.rotation.x = -whip * 2.55 + Math.sin(whip * Math.PI) * 0.45;
        pitcher.throwArmPivot.rotation.z = pSign * (-0.25 * drop + 0.15 * whip);
        pitcher.throwElbowPivot.rotation.x = -0.95 * Math.sin(p * Math.PI);
        pitcher.gloveArmPivot.rotation.x = -0.52 * lift + 0.18 * whip;
        pitcher.gloveElbowPivot.rotation.x = -0.82;
        pitcher.root.position.z = -60.5 + drop * 4.8;
        pitcher.handBall.visible = p < 0.96;
      } else if (simState.phase === 'pitch') {
        pStridePivot.rotation.x = THREE.MathUtils.damp(pStridePivot.rotation.x, 0.28, 12, dt);
        pStrideKnee.rotation.x = THREE.MathUtils.damp(pStrideKnee.rotation.x, 0.14, 12, dt);
        pPlantPivot.rotation.x = THREE.MathUtils.damp(pPlantPivot.rotation.x, 0, 12, dt);
        pPlantKnee.rotation.x = THREE.MathUtils.damp(pPlantKnee.rotation.x, 0.2, 12, dt);
        pitcher.torsoPivot.rotation.y = THREE.MathUtils.damp(pitcher.torsoPivot.rotation.y, pSign * 0.24, 10, dt);
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
        pitcher.rightLegPivot.rotation.x = THREE.MathUtils.damp(pitcher.rightLegPivot.rotation.x, 0, 7, dt);
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
    }

    const swingRaw = clamp((simState.swingAngle + 0.42) / 1.37, 0, 1);
    // Keep batter & barrel ALWAYS visible during swings & flights! Keep umpire clear of tight catcher cameras (Strike Zone / Show 15 / Fish Eye).
    const hideCloseBackCrew = curCameraMode === 'strike-zone' && curStadiumId !== 'cage';
    const hideCloseUmpire = (curCameraMode === 'strike-zone' || curCameraMode === 'show-15' || curCameraMode === 'fish-eye') && curStadiumId !== 'cage';
    batPivot.visible = true;
    batter.root.visible = true;
    plateCrew.grp.visible = !hideCloseBackCrew;
    plateCrew.ump.visible = !hideCloseUmpire && curStadiumId !== 'cage';

    // Umpire Articulated Strike/Ball Call Animations
    if (plateCrew.ump.visible) {
      const umpCall = simState.umpCall || '';
      const isStrikeCall = umpCall === 'strike' || umpCall === 'strikeout';
      const isBallCall = umpCall === 'ball';
      const targetRx = isStrikeCall ? -1.65 : isBallCall ? -0.45 : 0.25;
      const targetRz = isStrikeCall ? -0.38 : 0.08;
      const targetElb = isStrikeCall ? -0.32 : -0.82;
      const targetLx = isBallCall ? -0.45 : 0.25;
      plateCrew.umpArmR.shoulder.rotation.x = THREE.MathUtils.damp(plateCrew.umpArmR.shoulder.rotation.x, targetRx, 14, dt);
      plateCrew.umpArmR.shoulder.rotation.z = THREE.MathUtils.damp(plateCrew.umpArmR.shoulder.rotation.z, targetRz, 14, dt);
      plateCrew.umpArmR.elbow.rotation.x = THREE.MathUtils.damp(plateCrew.umpArmR.elbow.rotation.x, targetElb, 14, dt);
      plateCrew.umpArmL.shoulder.rotation.x = THREE.MathUtils.damp(plateCrew.umpArmL.shoulder.rotation.x, targetLx, 10, dt);
      plateCrew.umpArmL.elbow.rotation.x = THREE.MathUtils.damp(plateCrew.umpArmL.elbow.rotation.x, -0.85, 10, dt);
      plateCrew.umpTorso.rotation.x = THREE.MathUtils.damp(plateCrew.umpTorso.rotation.x, isStrikeCall ? 0.02 : 0.22, 10, dt);
    }

    const pitchLoad = simState.phase === 'windup' ? smoothStep(0, 1, simState.t) * 0.28 : 0;
    batter.torsoPivot.rotation.y = THREE.MathUtils.damp(batter.torsoPivot.rotation.y, hSign * (-0.2 - pitchLoad + swingRaw * 1.54), 18, dt);
    batter.strideLegPivot.rotation.x = THREE.MathUtils.damp(batter.strideLegPivot.rotation.x, pitchLoad * 0.56 - swingRaw * 0.24, 16, dt);
    batter.strideKneePivot.rotation.x = THREE.MathUtils.damp(batter.strideKneePivot.rotation.x, pitchLoad * 0.42 + 0.1, 16, dt);
    batter.backKneePivot.rotation.x = THREE.MathUtils.damp(batter.backKneePivot.rotation.x, 0.16 + swingRaw * 0.22, 16, dt);

    // Subtle MLB-The-Show-style Stance Bat Tracking following live PCI (pciLiveX, pciLiveY)
    const pciAimX = clamp(simState.pciLiveX || 0, -1.45, 1.45);
    const pciAimY = clamp(simState.pciLiveY || 0, -1.45, 1.45);
    _batStanceAimK.copy(_batStanceK);
    _batStanceAimK.x += pciAimX * 0.18;
    _batStanceAimK.y -= pciAimY * 0.16;
    _batStanceAimD.copy(_batStanceD);
    _batStanceAimD.x += pciAimX * 0.09;
    _batStanceAimD.y -= pciAimY * 0.07;
    _batStanceAimD.normalize();

    // Exact Vector Bat-to-Ball Contact Kinematics (barrel meets PCI target cleanly at swingRaw = 0.569)
    const sweetLen = 2.35;
    const tx = clamp(simState.swingTargetX != null ? simState.swingTargetX : pciAimX * 0.65, -1.05, 1.05);
    const ty = clamp(simState.swingTargetY != null ? simState.swingTargetY : 2.65 - pciAimY * 0.72, 1.45, 3.85);
    const kxC = hSign > 0 ? clamp(tx - 2.26, -2.62, -1.45) : clamp(tx + 2.26, 1.45, 2.62);
    const kyC = clamp(ty - 0.25, 1.45, 3.5);
    const dxC = tx - kxC;
    const dyC = ty - kyC;
    const remSq = Math.max(0.02, sweetLen * sweetLen - dxC * dxC - dyC * dyC);
    const kzC = Math.sqrt(remSq);
    _batContactK.set(kxC, kyC, kzC);
    _batContactD.set(dxC, dyC, -kzC).normalize();

    const sContact = 0.569343;
    const sSlot = 0.26;
    const isOneHandFinish = simState.finishStyle === 'one-hand';
    const followTargetK = isOneHandFinish ? _batFollowOneHandK : _batFollowK;
    const followTargetD = isOneHandFinish ? _batFollowOneHandD : _batFollowD;

    if (swingRaw <= sSlot) {
      const u = smoothStep(0, sSlot, swingRaw);
      _batKnob.lerpVectors(_batStanceAimK, _batSlotK, u);
      _batDir.lerpVectors(_batStanceAimD, _batSlotD, u).normalize();
    } else if (swingRaw <= sContact) {
      const u = smoothStep(sSlot, sContact, swingRaw);
      _batKnob.lerpVectors(_batSlotK, _batContactK, u);
      _batDir.lerpVectors(_batSlotD, _batContactD, u).normalize();
    } else {
      const u = smoothStep(sContact, 1.0, swingRaw);
      _batKnob.lerpVectors(_batContactK, followTargetK, u);
      _batDir.lerpVectors(_batContactD, followTargetD, u).normalize();
    }

    batPivot.position.copy(_batKnob);
    batPivot.quaternion.setFromUnitVectors(_batUp, _batDir);

    // Glue batter's bottom hand cleanly to grip; release top hand on 1-hand follow-through!
    batter.torsoPivot.updateMatrixWorld(true);
    _batHandsLocal.copy(_batKnob).addScaledVector(_batDir, 0.34);
    batter.torsoPivot.worldToLocal(_batHandsLocal);
    batter.handsGroup.position.copy(_batHandsLocal);

    const oneHandRelease = isOneHandFinish && swingRaw > sContact ? smoothStep(sContact + 0.04, 0.92, swingRaw) : 0;
    const topHandMesh = batter.handsGroup.children[0];
    if (topHandMesh) {
      topHandMesh.position.set(
        oneHandRelease * (0.42 * hSign),
        0.11 - oneHandRelease * 0.45,
        oneHandRelease * 0.48
      );
    }

    const aimArmToTarget = (armPivot, elbowPivot, targetLocal, gripOffsetY, elbowPushZ) => {
      _armVec.copy(targetLocal).sub(armPivot.position);
      _armVec.y += gripOffsetY;
      _armVec.z += elbowPushZ;
      const reach = _armVec.length();
      if (reach > 0.05) {
        _armDir.copy(_armVec).multiplyScalar(1 / reach);
        _armQuat.setFromUnitVectors(_batDown, _armDir);
        armPivot.quaternion.copy(_armQuat);
        elbowPivot.position.set(0, -Math.min(0.84, reach * 0.52), 0);
        elbowPivot.quaternion.setFromUnitVectors(_batDown, _batDown);
      }
    };

    _topHandReleaseTarget.copy(_batHandsLocal);
    if (oneHandRelease > 0.01) {
      _topHandReleaseTarget.x += oneHandRelease * (0.42 * hSign);
      _topHandReleaseTarget.y -= oneHandRelease * 0.45;
      _topHandReleaseTarget.z += oneHandRelease * 0.48;
    }
    aimArmToTarget(batter.topArm, batter.topElbow, _topHandReleaseTarget, 0.1, 0.14);
    aimArmToTarget(batter.bottomArm, batter.botElbow, _batHandsLocal, -0.1, -0.1);

    // Connected Catcher Shoulder & Elbow Articulation (zero floating detached mitt!)
    if (simState.phase === 'pitch' && simState.pitchPos) {
      const targetArmX = 1.25 + clamp((simState.pitchPos.y - 2.45) * 0.38, -0.45, 0.55);
      const targetArmZ = clamp(-simState.pitchPos.x * 0.46, -0.58, 0.58);
      plateCrew.catcherArmPivot.rotation.x = THREE.MathUtils.damp(plateCrew.catcherArmPivot.rotation.x, targetArmX, 15, dt);
      plateCrew.catcherArmPivot.rotation.z = THREE.MathUtils.damp(plateCrew.catcherArmPivot.rotation.z, targetArmZ, 15, dt);
      plateCrew.catcherElbowPivot.rotation.x = THREE.MathUtils.damp(plateCrew.catcherElbowPivot.rotation.x, -0.62, 14, dt);
      plateCrew.cTorso.rotation.z = THREE.MathUtils.damp(plateCrew.cTorso.rotation.z, clamp(-simState.pitchPos.x * 0.12, -0.16, 0.16), 12, dt);
    } else {
      plateCrew.catcherArmPivot.rotation.x = THREE.MathUtils.damp(plateCrew.catcherArmPivot.rotation.x, 1.15, 8, dt);
      plateCrew.catcherArmPivot.rotation.z = THREE.MathUtils.damp(plateCrew.catcherArmPivot.rotation.z, 0, 8, dt);
      plateCrew.catcherElbowPivot.rotation.x = THREE.MathUtils.damp(plateCrew.catcherElbowPivot.rotation.x, -0.78, 8, dt);
      plateCrew.cTorso.rotation.z = THREE.MathUtils.damp(plateCrew.cTorso.rotation.z, 0, 8, dt);
    }

    if (simState.impactBurstId && simState.impactBurstId !== lastImpactToken) {
      lastImpactToken = simState.impactBurstId;
      const ip = simState.impactPos || { x: 0, y: 2.6, z: 0 };
      triggerImpactBurst(ip.x, ip.y, ip.z, simState.flightColor);
      const ev = simState.lastExitVelo || 92;
      impactShake = clamp((ev - 76) / 34, 0.14, 1.0) * 0.34;
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
    const wMagFtS = Math.hypot(wDir.x || 0, wDir.y || 0);
    const windMph = wMagFtS / 1.46667;
    const nowSec = performance.now() * 0.001;
    // Flag extends along +X locally -> rotate Y by atan2(wDir.y, wDir.x) so it points strictly downwind in 3D world (X, -Z)!
    const wAngle = wMagFtS > 0.5 ? Math.atan2(wDir.y, wDir.x) : -0.35;
    const flutterSpeed = 4.2 + windMph * 0.85;
    const flutterAmp = 0.03 + clamp(windMph / 12, 0, 1.2) * 0.15;
    const droopZ = -0.46 * (1 - clamp(windMph / 9.5, 0, 1));
    const stretchX = 0.72 + clamp(windMph / 12, 0, 1) * 0.32;
    for (let i = 0; i < windFlags.length; i++) {
      windFlags[i].rotation.y = wAngle + Math.sin(nowSec * flutterSpeed + i * 1.1) * flutterAmp;
      windFlags[i].rotation.z = droopZ + Math.cos(nowSec * (flutterSpeed * 0.7) + i) * (flutterAmp * 0.25);
      windFlags[i].scale.x = stretchX;
    }

    // Zero-GC 3D Field Defenders (7 sculpted defenders track ball flight smoothly; hidden in indoor cage)
    const showFielders = curStadiumId !== 'cage';
    fieldDefenders.grp.visible = showFielders;
    if (showFielders) {
      const defList = fieldDefenders.defenders;
      const inFlight = simState.phase === 'flight' && simState.flightCur;
      const fxWorld = inFlight ? simState.flightCur.x : 0;
      const fzWorld = inFlight ? -simState.flightCur.y : 0;
      for (let i = 0; i < defList.length; i++) {
        const d = defList[i];
        d.upper.rotation.y = Math.sin(nowSec * 1.45 + d.phase) * 0.04;
        if (inFlight) {
          const targetYaw = Math.atan2(fxWorld - d.root.position.x, fzWorld - d.root.position.z);
          d.root.rotation.y = THREE.MathUtils.damp(d.root.rotation.y, targetYaw, 6.5, dt);
          d.upper.rotation.x = THREE.MathUtils.damp(d.upper.rotation.x, 0.14, 6.5, dt);
        } else {
          d.root.rotation.y = THREE.MathUtils.damp(d.root.rotation.y, d.baseYaw, 5.0, dt);
          d.upper.rotation.x = THREE.MathUtils.damp(d.upper.rotation.x, 0.26, 5.0, dt);
        }
      }
    }

    // Zero-GC 3D Outfield Wind-Drift Air Motes
    const showMotes = curStadiumId !== 'cage';
    windMotes.visible = showMotes;
    if (showMotes) {
      windMotesMat.opacity = windMph < 1 ? 0.05 : clamp(0.11 + windMph * 0.015, 0.11, 0.34);
      const driftX = (wDir.x || 0) * 1.35;
      const driftZ = -(wDir.y || 0) * 1.35;
      for (let i = 0; i < WIND_MOTE_COUNT; i++) {
        const idx = i * 3;
        const ph = windMotePhase[i];
        let mx = windMotePos[idx + 0] + (driftX + Math.sin(nowSec * 1.4 + ph) * 1.8) * dt;
        let my = windMotePos[idx + 1] + Math.sin(nowSec * 1.8 + ph) * 1.4 * dt;
        let mz = windMotePos[idx + 2] + (driftZ + Math.cos(nowSec * 1.3 + ph) * 1.8) * dt;
        if (mx > 220) mx -= 440;
        else if (mx < -220) mx += 440;
        if (my > 66) my = 6;
        else if (my < 3) my = 62;
        if (mz > 20) mz -= 460;
        else if (mz < -440) mz += 460;
        windMotePos[idx + 0] = mx;
        windMotePos[idx + 1] = my;
        windMotePos[idx + 2] = mz;
      }
      windMotesGeom.attributes.position.needsUpdate = true;
    }

    let followX = 0;
    let followY = 3.1;
    let followZ = -55;
    let trackMarkX = 0;
    let trackMarkY = 0.25;
    let trackMarkZ = -180;

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
        apexMarker.visible = curFollowBall;
        apexMarker.position.set(fl.apexPos.x, fl.apexPos.z, -fl.apexPos.y);
        apexMarker.rotation.y += dt * 2.5;
      } else {
        apexMarker.visible = false;
      }

      if (fl && fl.points && fl.points.length > 0) {
        const lastPt = fl.points[fl.points.length - 1];
        trackMarkX = lastPt.x;
        trackMarkY = Math.max(0.22, lastPt.z);
        trackMarkZ = -lastPt.y;
        if (curFollowBall || fl.playTime >= fl.totalTime * 0.85) {
          landingRing.visible = true;
          landingRing.position.set(trackMarkX, trackMarkY, trackMarkZ);
          const col = fl.color || '#38bdf8';
          landingOuterRing.material.color.set(col);
          landingBeacon.material.color.set(col);
          landingBeacon.visible = curFollowBall;
        } else {
          landingRing.visible = false;
        }
      } else {
        landingRing.visible = false;
      }

      followX = bx * 0.78;
      followY = Math.max(12, by * 0.85);
      followZ = bz * 0.88;
    } else {
      ballMesh.visible = false;
      ballShadow.visible = false;
      apexMarker.visible = false;
      landingRing.visible = false;
      trailGeom.setDrawRange(0, 0);
    }

    // Helper: Base MLB The Show Hitting Camera Pose at Home Plate
    const setPlatePose = () => {
      if (curCameraMode === 'fish-eye') {
        _camTargetPos.set(0.28 * hSign, 5.4, 17.8);
        _camTargetLook.set(0, 3.3, -58);
      } else if (curCameraMode === 'show-15') {
        _camTargetPos.set(-2.45 * hSign, 5.15, 14.2);
        _camTargetLook.set(0.35 * hSign, 3.15, -55);
      } else if (curCameraMode === 'broadcast') {
        _camTargetPos.set(3.8, 15.6, 32.0);
        _camTargetLook.set(0, 4.2, -95);
      } else if (curCameraMode === 'swing-lab') {
        _camTargetPos.set(15.5 * hSign, 4.35, -3.0);
        _camTargetLook.set(-1.4 * hSign, 3.0, 0.2);
      } else {
        // 'strike-zone' (MLB The Show default tight view right above plate edge)
        _camTargetPos.set(0.18 * hSign, 3.85, 3.9);
        _camTargetLook.set(0, 2.95, -56);
      }
    };

    if (simState.phase === 'flight' && simState.flightCur && curFollowBall) {
      // TRACK BALL MODE: Dynamic chase camera following ball arc + landing marker
      const cur = simState.flightCur;
      const bx = cur.x;
      const by = Math.max(1.2, cur.z);
      const bz = -cur.y;
      const distOut = Math.hypot(cur.x, cur.y);
      if (curCameraMode === 'broadcast') {
        const horiz = Math.max(8, Math.hypot(trackMarkX, trackMarkZ));
        const dirX = trackMarkX / horiz;
        const dirZ = trackMarkZ / horiz;
        const sideSign = bx >= 0 ? -1 : 1;
        _camTargetPos.set(
          bx - dirX * 26 - dirZ * (14 * sideSign),
          Math.max(12, by + 11.5),
          Math.min(18, bz - dirZ * 26 + dirX * (14 * sideSign))
        );
        const prog = simState.flight ? clamp(simState.flight.playTime / Math.max(0.6, simState.flight.totalTime), 0, 1) : 0.4;
        const w = 0.25 + prog * 0.28;
        _camTargetLook.set(bx + (trackMarkX - bx) * w, Math.max(1.5, by + (trackMarkY - by) * w), bz + (trackMarkZ - bz) * w);
      } else if (curCameraMode === 'swing-lab') {
        _camTargetPos.set(17.5 * hSign, 6.2 + cur.z * 0.22, -2.5);
        _camTargetLook.set(cur.x * 0.55, Math.max(3, cur.z * 0.65), -Math.max(12, cur.y * 0.75));
      } else {
        const chaseFactor = clamp(distOut / 220, 0, 1);
        _camTargetPos.set(cur.x * 0.22, 14 + cur.z * 0.44 + chaseFactor * 16, 18 - distOut * 0.14);
        _camTargetLook.set(followX, Math.max(8, followY * 0.82), Math.min(-35, followZ));
      }
    } else if (simState.phase === 'flight' && simState.flightCur && !curFollowBall) {
      // LET IT FLY MODE: Hold the hitting camera steadily anchored at home plate & pan smoothly to watch the ball soar out!
      setPlatePose();
      if (curCameraMode !== 'swing-lab') {
        const cur = simState.flightCur;
        _camTargetLook.set(
          cur.x * 0.65,
          Math.max(2.6, Math.min(48, cur.z * 0.55 + 2.4)),
          Math.min(-42, -cur.y * 0.72)
        );
      }
    } else {
      setPlatePose();
    }

    // Smooth phase return dolly (flight -> idle)
    if (lastRenderPhase === 'flight' && simState.phase !== 'flight') {
      startCamTransition(0.72, 1.3, 2.2);
    }
    lastRenderPhase = simState.phase;

    const baseFov = CAMERA_FOVS[curCameraMode] || 40;
    const targetFov = simState.phase === 'flight' && curFollowBall ? baseFov + 4 : baseFov;

    if (camTrans.active) {
      camTrans.t = Math.min(1, camTrans.t + dt / camTrans.dur);
      const u = camTrans.t;
      const e = 1 - Math.pow(1 - u, 3); // Cubic ease-out dolly
      const bell = Math.sin(Math.PI * e);

      // Orbital outward swing around plate so camera never clips through the batter
      _camArcDir.lerpVectors(_camStartPos, _camTargetPos, e);
      _camArcDir.y = 0;
      const horizLen = _camArcDir.length();
      const invLen = horizLen > 0.25 ? 1 / horizLen : 0;
      camera.position.set(
        THREE.MathUtils.lerp(_camStartPos.x, _camTargetPos.x, e) + _camArcDir.x * invLen * camTrans.arcOut * bell,
        THREE.MathUtils.lerp(_camStartPos.y, _camTargetPos.y, e) + camTrans.arcLift * bell,
        THREE.MathUtils.lerp(_camStartPos.z, _camTargetPos.z, e) + _camArcDir.z * invLen * camTrans.arcOut * bell
      );
      _camCurLook.lerpVectors(_camStartLook, _camTargetLook, e);

      const prevFov = camera.fov;
      camera.fov = THREE.MathUtils.lerp(camTrans.fromFov, targetFov, e);
      if (Math.abs(camera.fov - prevFov) > 0.015) camera.updateProjectionMatrix();

      if (u >= 1) camTrans.active = false;
    } else {
      const dampK = simState.phase === 'flight' ? (curFollowBall ? 5.6 : 4.2) : 6.5;
      camera.position.x = THREE.MathUtils.damp(camera.position.x, _camTargetPos.x, dampK, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, _camTargetPos.y, dampK, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, _camTargetPos.z, dampK, dt);

      _camCurLook.x = THREE.MathUtils.damp(_camCurLook.x, _camTargetLook.x, dampK + 1.5, dt);
      _camCurLook.y = THREE.MathUtils.damp(_camCurLook.y, _camTargetLook.y, dampK + 1.5, dt);
      _camCurLook.z = THREE.MathUtils.damp(_camCurLook.z, _camTargetLook.z, dampK + 1.5, dt);

      const prevFov = camera.fov;
      camera.fov = THREE.MathUtils.damp(camera.fov, targetFov, 7.5, dt);
      if (Math.abs(camera.fov - prevFov) > 0.015) camera.updateProjectionMatrix();
    }

    // Broadcast impact micro-shake (exponential decay on hard barrels)
    if (impactShake > 0.004) {
      const sPhase = nowSec * 68;
      camera.position.x += Math.sin(sPhase) * impactShake;
      camera.position.y += Math.cos(sPhase * 1.3) * impactShake * 0.72;
      impactShake *= Math.exp(-15 * dt);
    } else {
      impactShake = 0;
    }

    camera.lookAt(_camCurLook);
    renderer.render(scene, camera);
  }

  function getCameraInfo() {
    return {
      mode: curCameraMode,
      fov: Number(camera.fov.toFixed(2)),
      transitioning: camTrans.active,
      pos: {
        x: Number(camera.position.x.toFixed(2)),
        y: Number(camera.position.y.toFixed(2)),
        z: Number(camera.position.z.toFixed(2))
      }
    };
  }

  return {
    isSoftwareGl,
    setStadium,
    setBat,
    setBatterHand,
    setPitcherHand,
    setDeliveryMode,
    setCameraMode,
    setFollowBall,
    getCameraInfo,
    resize,
    projectWorldToNorm,
    updateAndRender
  };
}

window.createStadium3DEngine = createStadium3DEngine;
window.dispatchEvent(new CustomEvent('diamondiq-3d-ready'));
