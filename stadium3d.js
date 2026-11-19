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

function makeCrowdSeatsTexture(seatPrimary, seatAccent, nightDensity, maxAniso) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = seatPrimary;
  ctx.fillRect(0, 0, 512, 256);

  // Tiered stadium seat rows
  const rows = 14;
  const rowH = c.height / rows;
  const cols = 48;
  const colW = c.width / cols;
  const jerseyColors = ['#f8fafc', '#cbd5e1', seatAccent, '#ef4444', '#fde047', '#38bdf8', '#1e293b'];

  for (let r = 0; r < rows; r++) {
    const y = r * rowH;
    // Row concrete riser shadow
    ctx.fillStyle = 'rgba(0,0,0,0.34)';
    ctx.fillRect(0, y, 512, 3);
    // Concrete aisle steps every 16 seats
    for (let col = 0; col < cols; col++) {
      const x = col * colW;
      if (col % 16 === 0) {
        ctx.fillStyle = '#64748b';
        ctx.fillRect(x, y, colW, rowH);
        continue;
      }
      // Seat back
      ctx.fillStyle = seatAccent;
      ctx.globalAlpha = 0.55;
      ctx.fillRect(x + 1, y + 3, colW - 2, rowH - 4);
      ctx.globalAlpha = 1;

      // Spectator silhouette in ~72% of seats
      const hash = (r * 37 + col * 73) % 100;
      if (hash < nightDensity) {
        ctx.fillStyle = jerseyColors[(r + col * 3) % jerseyColors.length];
        ctx.fillRect(x + 2, y + 5, colW - 4, rowH - 5);
        ctx.fillStyle = '#e2b58f';
        ctx.beginPath();
        ctx.arc(x + colW * 0.5, y + 5, 2.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(9, 2);
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

function makeFenwayContinuousWallTexture(maxAniso) {
  const c = document.createElement('canvas');
  c.width = 2048;
  c.height = 512;
  const ctx = c.getContext('2d');

  // Authentic Fenway Green (#1e543d) steel plates with vertical tin seams
  ctx.fillStyle = '#1d523c';
  ctx.fillRect(0, 0, 2048, 512);

  // Subtle horizontal & vertical metal plate seams on Monster portion (left 44% of arc)
  for (let x = 0; x < 920; x += 48) {
    ctx.strokeStyle = 'rgba(8, 28, 19, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 2;
  for (let y = 80; y < 512; y += 96) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(2048, y);
    ctx.stroke();
  }

  // Green Monster Hand-Operated Scoreboard (left field Monster lower panel)
  ctx.fillStyle = '#0e3324';
  ctx.fillRect(210, 210, 390, 275);
  ctx.strokeStyle = '#a7f3d0';
  ctx.lineWidth = 4;
  ctx.strokeRect(210, 210, 390, 275);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 24px monospace';
  ctx.fillText('1  2  3  4  5  6  7  8  9   R  H  E', 228, 250);
  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 28px monospace';
  ctx.fillText('NYY 0  1  0  0  1  0  0  0  0   2  6  0', 224, 304);
  ctx.fillStyle = '#ffffff';
  ctx.fillText('BOS 1  0  2  0  0  1  0  0  X   4  9  0', 224, 356);

  // Vintage AL/NL Out-of-Town Scores strip below
  ctx.fillStyle = '#154230';
  ctx.fillRect(224, 384, 362, 82);
  ctx.fillStyle = '#d1fae5';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('BAL 3  TOR 2    TB 4  CLE 1', 236, 416);
  ctx.fillText('LAD 5  SF  2    CHC 4 STL 3', 236, 452);

  // Yellow "Jimmy Fund / Red Sox" Ribbon Accent + Wall Distance Markers
  ctx.fillStyle = '#fde047';
  ctx.font = 'bold 42px sans-serif';
  ctx.fillText('310', 34, 446);
  ctx.fillText('379', 790, 446);
  ctx.fillText('420', 1020, 446);
  ctx.fillText('380', 1420, 446);
  ctx.fillText('302', 1935, 446);

  // Dark Red Line & Red Sox CF triangle accents
  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(920, 0, 1128, 28);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

function makeWrigleyIvyWallTexture(maxAniso) {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 256;
  const ctx = c.getContext('2d');

  // Authentic Chicago Red-Brick Masonry behind Boston Ivy
  ctx.fillStyle = '#73281f';
  ctx.fillRect(0, 0, 1024, 256);
  for (let row = 0; row < 20; row++) {
    const off = (row % 2) * 14;
    for (let col = -1; col < 38; col++) {
      const shade = (row * 7 + col * 11) % 3;
      ctx.fillStyle = shade === 0 ? '#8c3328' : shade === 1 ? '#9e4133' : '#6c251c';
      ctx.fillRect(col * 28 + off + 2, row * 13 + 2, 24, 10);
    }
  }

  // Dense multi-tone creeping Boston Ivy vines & leaf clusters
  const shades = ['#14532d', '#166534', '#15803d', '#22c55e', '#1e4620', '#2d6a32'];
  for (let i = 0; i < 4200; i++) {
    const x = (i * 83) % 1024;
    const clusterY = 18 + ((i * 59 + Math.sin(i * 0.35) * 44 + 256) % 232);
    // Slightly thinner near top brick coping and door gaps
    if (clusterY > 18 && (x < 940 || x > 980)) {
      ctx.fillStyle = shades[i % shades.length];
      ctx.beginPath();
      ctx.ellipse(x, clusterY, 6.5 + (i % 5), 4.5 + (i % 4), (i % 6) * 0.52, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Wrigley White/Yellow Wall Distances painted clearly onto pads
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 34px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('355', 56, 210);
  ctx.fillText('368', 290, 210);
  ctx.fillText('400', 512, 210);
  ctx.fillText('368', 735, 210);
  ctx.fillText('353', 968, 210);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

function makeDodgerWallTexture(maxAniso) {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 256;
  const ctx = c.getContext('2d');

  // Authentic Dodger Blue outfield wall with padded rib lines
  ctx.fillStyle = '#0f4799';
  ctx.fillRect(0, 0, 1024, 256);

  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 3;
  for (let x = 0; x < 1024; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }

  // Crisp White Top Stripe + Distance Numbers (330 / 375 / 395 / 375 / 330)
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 18, 1024, 10);
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('330', 54, 150);
  ctx.fillText('375', 280, 150);
  ctx.fillText('395', 512, 150);
  ctx.fillText('375', 744, 150);
  ctx.fillText('330', 970, 150);

  // Subtle Dodgers Stadium Banner Strip
  ctx.fillStyle = '#ef4444';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('DODGER STADIUM · CHAVEZ RAVINE', 512, 218);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

function makeWrigleyArtDecoScoreboardTexture(maxAniso) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 320;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#15472a';
  ctx.fillRect(0, 0, 512, 320);
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, 492, 300);

  // Top Header
  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 32px serif';
  ctx.textAlign = 'center';
  ctx.fillText('WRIGLEY FIELD', 256, 56);

  // Center Analog Longines Clock Face
  ctx.beginPath();
  ctx.arc(256, 118, 36, 0, Math.PI * 2);
  ctx.fillStyle = '#f8fafc';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#0f291a';
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(256, 118);
  ctx.lineTo(256, 92);
  ctx.moveTo(256, 118);
  ctx.lineTo(276, 128);
  ctx.stroke();

  // Manual Innings Grid
  ctx.fillStyle = '#0c2918';
  ctx.fillRect(36, 168, 440, 116);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  ctx.strokeRect(36, 168, 440, 116);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('VISITORS  0 1 0 0 2 0 0   3  7  0', 54, 214);
  ctx.fillStyle = '#fde047';
  ctx.fillText('CUBS      1 0 2 0 1 1 X   5 10  0', 54, 256);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

function makeDodgerVisionTexture(title, sub, maxAniso) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0a1e47';
  ctx.fillRect(0, 0, 512, 256);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, 492, 236);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 34px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, 256, 94);
  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 25px monospace';
  ctx.fillText(sub, 256, 152);
  ctx.fillStyle = '#7dd3fc';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('THINK BLUE · LOS ANGELES', 256, 204);

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
    ctx.lineWidth = 9;
    for (let y = startY - 120; y < endY + 120; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y + 104);
      ctx.stroke();
    }
  };

  if (batId === 'baum-gold') {
    // Authentic Glazed Maple Wood Grain + Metallic Gold & Black Crest
    const woodGrad = ctx.createLinearGradient(0, 0, 512, 0);
    woodGrad.addColorStop(0, '#c68a38');
    woodGrad.addColorStop(0.45, '#f0cb84');
    woodGrad.addColorStop(1, '#b87a2a');
    ctx.fillStyle = woodGrad;
    ctx.fillRect(0, 0, 512, 1024);

    // Natural Flame Temper Maple Wood Grain
    for (let i = 0; i < 140; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(116, 56, 12, 0.22)' : 'rgba(255, 244, 210, 0.2)';
      const gx = (i * 19 + Math.sin(i) * 8) % 512;
      ctx.fillRect(gx, 24, 2 + (i % 4), 660);
    }

    // Black Perforated Wrap Grip + Gold Tape
    paintSpiralGrip('#16100a', '#78350f', 676, 988);
    ctx.fillStyle = '#eab308';
    ctx.fillRect(0, 668, 512, 12);
    ctx.fillStyle = '#0c0805';
    ctx.fillRect(0, 988, 512, 36);

    // Classic Black & Metallic Gold Baum Center Band + Crest Seal
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 412, 512, 34);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(0, 400, 512, 12);
    ctx.fillRect(0, 446, 512, 12);
    ctx.fillRect(0, 74, 512, 14);

    // Cupped Natural Wood Barrel End
    ctx.fillStyle = '#45250c';
    ctx.fillRect(0, 0, 512, 24);

    // Stamp Crest & Bold Lettering on Both Sides of Barrel
    [138, 378].forEach((cx) => {
      ctx.save();
      ctx.translate(cx, 248);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = '#181007';
      ctx.font = 'bold 46px serif';
      ctx.textAlign = 'center';
      ctx.fillText('BAUM BAT', 0, 6);
      ctx.fillStyle = '#78350f';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('PERMAWOOD · GOLD EDITION', 0, 34);
      ctx.restore();
    });
  } else if (batId === 'goods-2026') {
    // Authentic 2026 DeMarini The Goods: Matte Obsidian Black/Charcoal Barrel + Red/Teal Geometry
    ctx.fillStyle = '#141923';
    ctx.fillRect(0, 0, 512, 1024);

    // Carbon Composite Handle Fiber Micro-Weave below Taper
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    for (let y = 550; y < 988; y += 10) {
      for (let x = y % 20 === 0 ? 0 : 5; x < 512; x += 10) {
        ctx.fillRect(x, y, 4, 4);
      }
    }

    // Diamond-Tex Handle Grip with Teal & Red Accents
    paintSpiralGrip('#090f1c', '#2dd4bf', 672, 986);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(0, 986, 512, 38);

    // Direct Connection Red/Teal Collar Region Graphic
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(0, 540, 512, 66);
    ctx.fillStyle = '#2dd4bf';
    ctx.fillRect(0, 526, 512, 14);
    ctx.fillRect(0, 606, 512, 10);

    // Angular 2026 Red + Electric Teal Barrel Slash Graphics
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(0, 386, 512, 26);
    ctx.fillStyle = '#2dd4bf';
    ctx.fillRect(0, 368, 512, 16);
    ctx.fillRect(0, 60, 512, 22);
    ctx.fillStyle = '#090d14';
    ctx.fillRect(0, 0, 512, 42);

    [136, 376].forEach((cx) => {
      ctx.save();
      ctx.translate(cx, 225);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 46px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('THE GOODS', 0, 6);
      ctx.fillStyle = '#2dd4bf';
      ctx.font = 'bold 21px monospace';
      ctx.fillText('2026 DEMARINI · X14', 0, 34);
      ctx.restore();
    });
  } else if (batId === 'goods-2022') {
    // Authentic 2022 DeMarini The Goods: Iconic Brushed Chrome Silver Barrel + Flat Black Paraflex Handle + Crimson Red Graphics
    const silverGrad = ctx.createLinearGradient(0, 0, 512, 0);
    silverGrad.addColorStop(0, '#94a3b8');
    silverGrad.addColorStop(0.28, '#f8fafc');
    silverGrad.addColorStop(0.55, '#cbd5e1');
    silverGrad.addColorStop(0.84, '#f1f5f9');
    silverGrad.addColorStop(1, '#94a3b8');
    ctx.fillStyle = silverGrad;
    ctx.fillRect(0, 0, 512, 560);

    // Fine circumferential brushed alloy grain lines
    ctx.fillStyle = 'rgba(15, 23, 42, 0.06)';
    for (let y = 38; y < 550; y += 7) ctx.fillRect(0, y, 512, 2);

    // Flat black composite lower handle half
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 560, 512, 464);
    paintSpiralGrip('#18181b', '#dc2626', 672, 986);

    // Classic Red Half+Half Band & Stripes
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(0, 540, 512, 64);
    ctx.fillRect(0, 392, 512, 24);
    ctx.fillRect(0, 72, 512, 18);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 512, 34);

    [136, 376].forEach((cx) => {
      ctx.save();
      ctx.translate(cx, 232);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 46px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('THE GOODS', 0, 6);
      ctx.fillStyle = '#dc2626';
      ctx.font = 'bold 21px monospace';
      ctx.fillText('2022 HALF+HALF · X14', 0, 34);
      ctx.restore();
    });
  } else if (batId === 'combat-rodeo') {
    // Authentic Combat MFG Spec-A1 Rodeo: Warm Cream Gloss Barrel + Burnt Orange / Maroon Western Stripes + Clinch Tan Grip
    ctx.fillStyle = '#f3ead8';
    ctx.fillRect(0, 0, 512, 675);

    // Subtle cream parchment sheen
    paintSpiralGrip('#9a5b1e', '#d97706', 672, 986);
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(0, 986, 512, 38);

    // Western Saddle/Navajo Stripe Bands
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(0, 418, 512, 42);
    ctx.fillRect(0, 68, 512, 24);
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(0, 398, 512, 18);
    ctx.fillRect(0, 94, 512, 14);
    ctx.fillStyle = '#fef3c7';
    for (let dx = 22; dx < 512; dx += 44) {
      ctx.save();
      ctx.translate(dx, 439);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-7, -7, 14, 14);
      ctx.restore();
    }
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(0, 0, 512, 26);

    [136, 376].forEach((cx) => {
      ctx.save();
      ctx.translate(cx, 246);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = '#7f1d1d';
      ctx.font = 'bold 42px serif';
      ctx.textAlign = 'center';
      ctx.fillText('COMBAT RODEO', 0, 6);
      ctx.fillStyle = '#c2410c';
      ctx.font = 'bold 20px monospace';
      ctx.fillText('SPEC-A1 LIMITED · -3', 0, 34);
      ctx.restore();
    });
  } else {
    // Authentic Combat Spec-A1 Members Club Blue: Powder Sky-Blue Gloss Barrel + Gold Cursive + Navy/Gold Country Club Blazer Stripes + Argyle Grip
    ctx.fillStyle = '#72c8f8';
    ctx.fillRect(0, 0, 512, 675);

    // Country Club Argyle Navy/Sky/Gold Handle Grip
    paintSpiralGrip('#172554', '#bae6fd', 672, 986);
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.85)';
    ctx.lineWidth = 5;
    for (let y = 660; y < 990; y += 30) {
      ctx.beginPath();
      ctx.moveTo(512, y);
      ctx.lineTo(0, y + 104);
      ctx.stroke();
    }

    ctx.fillStyle = '#172554';
    ctx.fillRect(0, 986, 512, 38);
    ctx.fillRect(0, 412, 512, 36);
    ctx.fillRect(0, 72, 512, 22);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(0, 396, 512, 14);
    ctx.fillRect(0, 448, 512, 10);
    ctx.fillRect(0, 94, 512, 12);
    ctx.fillStyle = '#172554';
    ctx.fillRect(0, 0, 512, 28);

    // Gold Country Club Diamond Emblems
    [136, 376].forEach((cx) => {
      ctx.fillStyle = '#facc15';
      ctx.save();
      ctx.translate(cx, 430);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-10, -10, 20, 20);
      ctx.restore();

      ctx.save();
      ctx.translate(cx, 242);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = '#172554';
      ctx.font = 'bold 42px serif';
      ctx.textAlign = 'center';
      ctx.fillText('MEMBERS CLUB', 0, 6);
      ctx.fillStyle = '#b45309';
      ctx.font = 'bold 20px monospace';
      ctx.fillText('COMBAT SPEC-A1 · -3', 0, 34);
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
  const isMetal = batConfig.id === 'goods-2022';
  const isWood = batConfig.id === 'baum-gold';
  const isGloss = batConfig.id === 'combat-rodeo' || batConfig.id === 'combat-blue';
  const isMatte = batConfig.id === 'goods-2026';

  // Main Sculpted Pro Lathe Profile (Knob -> Tapered Handle -> Barrel -> Tip)
  const knobFlareR = batConfig.capStyle === 'flared' ? 0.155 : 0.146;
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
    roughness: isMetal ? 0.18 : isMatte ? 0.44 : isWood ? 0.28 : 0.22,
    metalness: isMetal ? 0.9 : isMatte ? 0.34 : isWood ? 0.04 : 0.38,
    clearcoat: isWood || isGloss ? 0.85 : isMetal ? 0.5 : 0.16,
    clearcoatRoughness: isGloss ? 0.12 : 0.24
  });

  const bodyMesh = new THREE.Mesh(mainGeom, mainMat);
  bodyMesh.castShadow = true;
  bodyMesh.rotation.y = Math.PI * 0.56;
  group.add(bodyMesh);

  // Subtle Knob Weight/Model Sticker Medallion on Bottom of Knob
  const knobCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.105, 0.105, 0.015, 20),
    new THREE.MeshStandardMaterial({ color: batConfig.trimColor || '#0f172a', roughness: 0.35, metalness: 0.4 })
  );
  knobCap.position.y = 0.005;
  group.add(knobCap);

  // Physical Protruding 3D Direct-Connection Cuff Collar for 2-Piece DeMarini Hybrids!
  if (is2Pc) {
    const cuffMat = new THREE.MeshPhysicalMaterial({
      color: batConfig.cuffColor || '#ef4444',
      roughness: 0.32,
      metalness: 0.35,
      clearcoat: 0.55
    });
    const cuffMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.116, 0.102, 0.24, 24), cuffMat);
    cuffMesh.position.y = 1.54;
    cuffMesh.castShadow = true;
    group.add(cuffMesh);

    const ringMat = new THREE.MeshStandardMaterial({
      color: batConfig.cuffTrim || '#2dd4bf',
      roughness: 0.3,
      metalness: 0.5
    });
    const topRing = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.011, 8, 24), ringMat);
    topRing.rotation.x = Math.PI / 2;
    topRing.position.y = 1.66;
    const botRing = new THREE.Mesh(new THREE.TorusGeometry(0.101, 0.01, 8, 24), ringMat);
    botRing.rotation.x = Math.PI / 2;
    botRing.position.y = 1.42;
    group.add(topRing, botRing);
  }

  // Authentic 3D End Cap Features
  if (batConfig.capStyle === 'tremor') {
    // 2026 DeMarini Tremor End Cap: Notched perimeter teeth around tip
    const toothMat = new THREE.MeshStandardMaterial({ color: '#090d14', roughness: 0.35, metalness: 0.4 });
    const tealRing = new THREE.Mesh(
      new THREE.TorusGeometry(barrelR * 0.72, 0.012, 8, 24),
      new THREE.MeshStandardMaterial({ color: '#2dd4bf', roughness: 0.3, metalness: 0.5 })
    );
    tealRing.rotation.x = Math.PI / 2;
    tealRing.position.y = 3.635;
    group.add(tealRing);

    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.045, 0.055), toothMat);
      tooth.position.set(Math.cos(a) * (barrelR * 0.78), 3.64, Math.sin(a) * (barrelR * 0.78));
      tooth.rotation.y = -a;
      group.add(tooth);
    }
  } else if (batConfig.capStyle === 'cupped') {
    // Authentic Wood Bat Recessed Cupped Center Rim
    const cupRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.11, 0.022, 8, 24),
      new THREE.MeshStandardMaterial({ color: '#d97706', roughness: 0.4 })
    );
    cupRim.rotation.x = Math.PI / 2;
    cupRim.position.y = 3.61;
    group.add(cupRim);
  } else if (batConfig.capStyle === 'flared') {
    // Combat Flared Pommel Cuff + Precision Recessed Dish End Cap
    const pommel = new THREE.Mesh(
      new THREE.TorusGeometry(0.128, 0.022, 10, 24),
      new THREE.MeshStandardMaterial({ color: batConfig.handleColor, roughness: 0.55 })
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

function buildStadiumLightTowers(stSpec, towerAngles, concreteMat, steelMat) {
  const grp = new THREE.Group();
  const bulbMat = new THREE.MeshBasicMaterial({ color: '#f8fafc' });
  const frameMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.5, metalness: 0.5 });

  // Single instanced draw call for all LED floodlight bulbs across all towers
  const colsPerBank = 6;
  const rowsPerBank = 3;
  const totalBulbs = towerAngles.length * colsPerBank * rowsPerBank;
  const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.95, 8, 6), bulbMat, totalBulbs);
  const dummy = new THREE.Object3D();
  let bulbIdx = 0;

  for (const phi of towerAngles) {
    const d = stSpec.wallDist(phi) + 84;
    const tx = Math.sin(phi) * d;
    const tz = -Math.cos(phi) * d;

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 2.1, 126, 10), steelMat);
    pole.position.set(tx, 63, tz);
    grp.add(pole);

    // Angled Steel Crossbar + Light Bank Housing facing Home Plate
    const headGrp = new THREE.Group();
    headGrp.position.set(tx, 126, tz);
    headGrp.lookAt(0, 12, 0);

    const backing = new THREE.Mesh(new THREE.BoxGeometry(24, 10.5, 1.4), frameMat);
    backing.position.set(0, 0, -0.8);
    headGrp.add(backing);

    const stanchionArm = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 5, 8), concreteMat);
    stanchionArm.rotation.x = Math.PI * 0.35;
    stanchionArm.position.set(0, -3.5, -2.5);
    headGrp.add(stanchionArm);
    grp.add(headGrp);

    headGrp.updateMatrixWorld(true);
    for (let r = 0; r < rowsPerBank; r++) {
      for (let c = 0; c < colsPerBank; c++) {
        const lx = -9.5 + c * 3.8;
        const ly = -3.0 + r * 3.0;
        dummy.position.set(lx, ly, 0.25);
        dummy.position.applyMatrix4(headGrp.matrixWorld);
        dummy.updateMatrix();
        bulbs.setMatrixAt(bulbIdx++, dummy.matrix);
      }
    }
  }
  bulbs.instanceMatrix.needsUpdate = true;
  grp.add(bulbs);
  return grp;
}

/* =========================================================
   Composite 6.0-ft Pitcher + Hand-Held Release Baseball
   ========================================================= */
function buildCompositePitcher(maxAniso, ballTex) {
  const root = new THREE.Group();
  root.position.set(0, 0.83, -60.5);

  const pantsMat = new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.72 });
  const jerseyTex = makeJerseyFrontTexture('#1e40af', '#ef4444', '24', maxAniso);
  const jerseyMat = new THREE.MeshStandardMaterial({ map: jerseyTex, roughness: 0.6 });
  const sleeveMat = new THREE.MeshStandardMaterial({ color: '#1e40af', roughness: 0.65 });
  const skinMat = new THREE.MeshStandardMaterial({ color: '#d99b72', roughness: 0.68 });
  const navyMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.6 });
  const gloveMat = new THREE.MeshStandardMaterial({ color: '#92400e', roughness: 0.55 });

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.5, 1.85, 14), jerseyMat);
  torso.position.set(0, 3.95, 0);
  torso.castShadow = true;
  root.add(torso);

  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.16, 14), navyMat);
  belt.position.set(0, 3.02, 0);
  root.add(belt);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 5.28, 0);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 14, 12), skinMat);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.45, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.56), navyMat);
  cap.position.y = 0.08;
  const brim = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.06, 0.45), navyMat);
  brim.position.set(0, 0.1, 0.36);
  headGroup.add(head, cap, brim);
  root.add(headGroup);

  const legGeom = new THREE.CylinderGeometry(0.24, 0.17, 2.75, 10);
  legGeom.translate(0, -1.38, 0);
  const cleatGeom = new THREE.BoxGeometry(0.32, 0.24, 0.62);
  cleatGeom.translate(0, -2.75, 0.12);

  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(-0.32, 2.95, 0);
  rightLegPivot.add(new THREE.Mesh(legGeom, pantsMat), new THREE.Mesh(cleatGeom, navyMat));

  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(0.32, 2.95, 0);
  leftLegPivot.add(new THREE.Mesh(legGeom, pantsMat), new THREE.Mesh(cleatGeom, navyMat));
  root.add(rightLegPivot, leftLegPivot);

  const armGeom = new THREE.CylinderGeometry(0.15, 0.12, 1.9, 10);
  armGeom.translate(0, -0.92, 0);

  const gloveArmPivot = new THREE.Group();
  gloveArmPivot.position.set(0.75, 4.7, 0);
  gloveArmPivot.add(new THREE.Mesh(armGeom, sleeveMat));
  const glove = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 10), gloveMat);
  glove.scale.set(0.85, 1.15, 1.0);
  glove.position.set(0, -1.9, 0.12);
  gloveArmPivot.add(glove);
  root.add(gloveArmPivot);

  const throwArmPivot = new THREE.Group();
  throwArmPivot.position.set(-0.75, 4.7, 0);
  throwArmPivot.add(new THREE.Mesh(armGeom, sleeveMat));
  const hand = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), skinMat);
  hand.position.set(0, -1.9, 0);
  const handBall = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 12, 10),
    new THREE.MeshStandardMaterial({ map: ballTex, roughness: 0.4 })
  );
  handBall.position.set(0, -1.98, 0.14);
  throwArmPivot.add(hand, handBall);
  root.add(throwArmPivot);

  return { root, leftLegPivot, rightLegPivot, gloveArmPivot, throwArmPivot, handBall };
}

/* =========================================================
   Composite 6.0-ft Articulated RH Batter + Grip Hands
   ========================================================= */
function buildCompositeBatter(maxAniso) {
  const root = new THREE.Group();
  root.position.set(-2.55, 0.05, 0.25);

  const pantsMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.72 });
  const jerseyTex = makeJerseyFrontTexture('#0f172a', '#38bdf8', '17', maxAniso);
  const jerseyMat = new THREE.MeshStandardMaterial({ map: jerseyTex, roughness: 0.58 });
  const sleeveMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.65 });
  const helmetMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.35, metalness: 0.25 });
  const skinMat = new THREE.MeshStandardMaterial({ color: '#d99b72', roughness: 0.68 });
  const gloveMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.6 });
  const cleatMat = new THREE.MeshStandardMaterial({ color: '#090d14', roughness: 0.65 });

  const legGeom = new THREE.CylinderGeometry(0.23, 0.16, 2.7, 10);
  legGeom.translate(0, -1.35, 0);
  const cleatGeom = new THREE.BoxGeometry(0.32, 0.22, 0.58);
  cleatGeom.translate(0.08, -2.7, 0);

  const backLeg = new THREE.Group();
  backLeg.position.set(0, 2.8, 0.55);
  backLeg.rotation.z = -0.06;
  backLeg.add(new THREE.Mesh(legGeom, pantsMat), new THREE.Mesh(cleatGeom, cleatMat));

  const strideLegPivot = new THREE.Group();
  strideLegPivot.position.set(0.06, 2.8, -0.55);
  strideLegPivot.rotation.z = 0.06;
  strideLegPivot.add(new THREE.Mesh(legGeom, pantsMat), new THREE.Mesh(cleatGeom, cleatMat));
  root.add(backLeg, strideLegPivot);

  const torsoPivot = new THREE.Group();
  torsoPivot.position.set(0, 2.85, 0);
  root.add(torsoPivot);

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.48, 1.85, 14), jerseyMat);
  torso.position.set(0, 1.0, 0);
  torso.rotation.y = Math.PI * 0.5;
  torso.castShadow = true;
  torsoPivot.add(torso);

  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.15, 14), cleatMat);
  belt.position.set(0, 0.06, 0);
  torsoPivot.add(belt);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.4, 14, 12), skinMat);
  head.position.set(0.1, 2.32, 0);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.45, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.62), helmetMat);
  helmet.position.set(0.1, 2.38, 0);
  const brim = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.07, 0.34), helmetMat);
  brim.position.set(0.35, 2.42, -0.2);
  brim.rotation.y = -0.3;
  torsoPivot.add(head, helmet, brim);

  const armGeom = new THREE.CylinderGeometry(0.13, 0.11, 1.65, 10);
  armGeom.translate(0, -0.82, 0);
  const topArm = new THREE.Mesh(armGeom, sleeveMat);
  topArm.position.set(0.25, 1.75, 0.48);
  topArm.rotation.z = 0.72;
  topArm.rotation.x = -0.4;
  const bottomArm = new THREE.Mesh(armGeom, sleeveMat);
  bottomArm.position.set(0.32, 1.72, -0.45);
  bottomArm.rotation.z = 0.85;
  bottomArm.rotation.x = 0.42;

  const hands = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 10), gloveMat);
  hands.position.set(0.65, 1.25, 0.12);
  torsoPivot.add(topArm, bottomArm, hands);

  return { root, strideLegPivot, torsoPivot };
}

/* =========================================================
   3D Catcher (with Tracking Mitt) & Home Plate Umpire
   ========================================================= */
function buildCatcherAndUmpire() {
  const grp = new THREE.Group();
  const gearMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.5 });
  const padMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.55 });
  const umpShirtMat = new THREE.MeshStandardMaterial({ color: '#38bdf8', roughness: 0.7 });
  const umpPantMat = new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.75 });
  const mittMat = new THREE.MeshStandardMaterial({ color: '#92400e', roughness: 0.55 });

  const catcher = new THREE.Group();
  catcher.position.set(0.05, 0, 4.4);
  const cBody = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.48, 1.45, 12), gearMat);
  cBody.position.set(0, 2.0, 0);
  cBody.rotation.x = -0.18;
  const cProtector = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.44, 1.15, 12), padMat);
  cProtector.position.set(0, 2.05, -0.24);
  cProtector.rotation.x = -0.18;
  const cMask = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10), gearMat);
  cMask.position.set(0, 3.02, -0.1);
  const shinL = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 1.45, 10), padMat);
  shinL.position.set(-0.46, 0.75, -0.15);
  shinL.rotation.x = -0.3;
  const shinR = shinL.clone();
  shinR.position.x = 0.46;
  catcher.add(cBody, cProtector, cMask, shinL, shinR);

  const mitt = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10), mittMat);
  mitt.scale.set(1.05, 1.15, 0.52);
  mitt.position.set(0, 2.45, -1.15);
  catcher.add(mitt);
  grp.add(catcher);

  const ump = new THREE.Group();
  ump.position.set(-0.78, 0, 7.6);
  const uLegL = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 2.6, 10), umpPantMat);
  uLegL.position.set(-0.28, 1.3, 0);
  const uLegR = uLegL.clone();
  uLegR.position.x = 0.28;
  const uTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.52, 1.8, 12), umpShirtMat);
  uTorso.position.set(0, 3.45, 0);
  const uHead = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 10), gearMat);
  uHead.position.set(0, 4.72, 0);
  ump.add(uLegL, uLegR, uTorso, uHead);
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

  // Shared High-Res Textures
  const turfTex = makeMowedTurfTexture(maxAniso);
  const dirtTex = makeDirtTexture(maxAniso);
  const ballTex = makeBaseballTexture(maxAniso);
  const fenwayWallTex = makeFenwayContinuousWallTexture(maxAniso);
  const wrigleyWallTex = makeWrigleyIvyWallTexture(maxAniso);
  const dodgerWallTex = makeDodgerWallTexture(maxAniso);
  const cageNetTex = makeCageNetTexture(maxAniso);
  const wrigleyBoardTex = makeWrigleyArtDecoScoreboardTexture(maxAniso);
  const dodgerBoardTex = makeDodgerVisionTexture('DODGER VISION', 'LAD 6   SF 2 · BOT 7TH', maxAniso);
  const fenwayCrowdTex = makeCrowdSeatsTexture('#122036', '#b91c1c', 78, maxAniso);
  const wrigleyCrowdTex = makeCrowdSeatsTexture('#102819', '#1e40af', 84, maxAniso);
  const dodgerCrowdTex = makeCrowdSeatsTexture('#0f2347', '#0284c7', 74, maxAniso);

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

  const infieldDirt = new THREE.Mesh(new THREE.CircleGeometry(98, 48, Math.PI * 0.2, Math.PI * 0.6), dirtMat);
  infieldDirt.rotation.x = -Math.PI / 2;
  infieldDirt.position.set(0, 0.02, -55);
  infieldDirt.receiveShadow = true;
  fieldGroup.add(infieldDirt);

  const diamondShape = new THREE.Shape();
  diamondShape.moveTo(0, -14);
  diamondShape.lineTo(54, -64);
  diamondShape.lineTo(0, -116);
  diamondShape.lineTo(-54, -64);
  diamondShape.closePath();
  const innerGrass = new THREE.Mesh(new THREE.ShapeGeometry(diamondShape), turfMat);
  innerGrass.rotation.x = -Math.PI / 2;
  innerGrass.position.y = 0.035;
  innerGrass.receiveShadow = true;
  fieldGroup.add(innerGrass);

  const homeDirt = new THREE.Mesh(new THREE.CircleGeometry(15, 28), dirtMat);
  homeDirt.rotation.x = -Math.PI / 2;
  homeDirt.position.set(0, 0.04, 0);
  homeDirt.receiveShadow = true;
  fieldGroup.add(homeDirt);

  const moundMesh = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 9.2, 0.83, 28), dirtMat);
  moundMesh.position.set(0, 0.415, -60.5);
  moundMesh.receiveShadow = true;
  fieldGroup.add(moundMesh);

  const rubber = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 0.5), baseMat);
  rubber.position.set(0, 0.84, -60.5);
  fieldGroup.add(rubber);

  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.78, 0.07, 5), baseMat);
  plate.position.set(0, 0.05, 0);
  plate.rotation.y = Math.PI;
  fieldGroup.add(plate);

  const makeBase = (x, z) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.24, 1.65), baseMat);
    b.position.set(x, 0.14, z);
    b.rotation.y = Math.PI / 4;
    b.castShadow = true;
    fieldGroup.add(b);
  };
  makeBase(63.64, -63.64);
  makeBase(0, -127.28);
  makeBase(-63.64, -63.64);

  [-1, 1].forEach((side) => {
    const lineLen = 355;
    const chalk = new THREE.Mesh(new THREE.PlaneGeometry(0.42, lineLen), chalkMat);
    chalk.rotation.x = -Math.PI / 2;
    chalk.rotation.z = side * (Math.PI / 4);
    const mid = lineLen / 2;
    chalk.position.set(-side * mid * Math.SQRT1_2, 0.05, -mid * Math.SQRT1_2);
    fieldGroup.add(chalk);

    // 1B & 3B Dugout Shelters + Curved Top Fascia
    const dug = new THREE.Group();
    dug.position.set(side * 68, 0, -28);
    dug.rotation.y = side * (Math.PI / 4);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(36, 1.0, 8), dugoutRoofMat);
    roof.position.set(0, 6.2, 0);
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(36, 6.2, 1), dugoutRoofMat);
    backWall.position.set(0, 3.1, side * 3.5);
    const trim = new THREE.Mesh(new THREE.BoxGeometry(36, 0.65, 0.4), dugoutTrimMat);
    trim.position.set(0, 6.5, -side * 3.9);
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 35, 8), baseMat);
    rail.rotation.z = Math.PI / 2;
    rail.position.set(0, 2.5, -side * 3.8);
    dug.add(roof, backWall, trim, rail);
    fieldGroup.add(dug);

    const onDeck = new THREE.Mesh(new THREE.RingGeometry(2.2, 2.6, 24), chalkMat);
    onDeck.rotation.x = -Math.PI / 2;
    onDeck.position.set(side * 16, 0.055, 8);
    fieldGroup.add(onDeck);

    const coachBox = new THREE.Mesh(new THREE.RingGeometry(2.1, 2.35, 4), chalkMat);
    coachBox.rotation.x = -Math.PI / 2;
    coachBox.scale.set(0.7, 1.5, 1);
    coachBox.position.set(side * 80, 0.055, -62);
    fieldGroup.add(coachBox);
  });

  [-3.1, 3.1].forEach((bx) => {
    const boxFrame = new THREE.Mesh(new THREE.RingGeometry(2.3, 2.55, 4), chalkMat);
    boxFrame.rotation.x = -Math.PI / 2;
    boxFrame.rotation.z = Math.PI / 4;
    boxFrame.scale.set(0.85, 1.35, 1);
    boxFrame.position.set(bx, 0.052, 0.2);
    fieldGroup.add(boxFrame);
  });

  // Players & Equipment
  const pitcher = buildCompositePitcher(maxAniso, ballTex);
  scene.add(pitcher.root);

  const batter = buildCompositeBatter(maxAniso);
  scene.add(batter.root);

  const plateCrew = buildCatcherAndUmpire();
  scene.add(plateCrew.grp);

  const batPivot = new THREE.Group();
  batPivot.position.set(-2.05, 2.85, 0.25);
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
    const yellowMat = new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.38, metalness: 0.18 });
    const concreteMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.86, side: THREE.DoubleSide });
    const steelMat = new THREE.MeshStandardMaterial({ color: '#475569', metalness: 0.68, roughness: 0.38 });
    const glassMat = new THREE.MeshPhysicalMaterial({ color: '#bae6fd', transparent: true, opacity: 0.42, roughness: 0.1, side: THREE.DoubleSide });
    const warnMat = new THREE.MeshStandardMaterial({ map: dirtTex, color: '#7c4728', roughness: 0.94, side: THREE.DoubleSide });

    if (stSpec.id === 'cage') {
      // Sleek Continuous Arched Steel Truss HitTrax Facility
      const netMat = new THREE.MeshBasicMaterial({ map: cageNetTex, transparent: true, side: THREE.DoubleSide, depthWrite: false });
      const glowMat = new THREE.MeshBasicMaterial({ color: '#e0f2fe' });
      const archWallMat = new THREE.MeshStandardMaterial({ color: '#142947', roughness: 0.72, side: THREE.DoubleSide });

      [80, 160, 240, 320, 400].forEach((dist) => {
        const z = -dist;
        // Parabolic Steel Truss Arch via TubeGeometry (zero blocky beams!)
        const archCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-88, 0, z),
          new THREE.Vector3(-84, 30, z),
          new THREE.Vector3(0, 46, z),
          new THREE.Vector3(84, 30, z),
          new THREE.Vector3(88, 0, z)
        ]);
        const archTube = new THREE.Mesh(new THREE.TubeGeometry(archCurve, 28, 1.25, 8, false), steelMat);
        grp.add(archTube);

        // Curved Overhead High-Bay Light Fixture Bar
        const lightCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-56, 36, z),
          new THREE.Vector3(0, 43.2, z),
          new THREE.Vector3(56, 36, z)
        ]);
        grp.add(new THREE.Mesh(new THREE.TubeGeometry(lightCurve, 16, 0.55, 6, false), glowMat));

        // Curved Distance Ring on Turf
        const yardRing = new THREE.Mesh(
          new THREE.RingGeometry(dist - 0.9, dist + 0.9, 48, 1, -Math.PI * 0.72, Math.PI * 0.44),
          dist === 400 ? yellowMat : chalkMat
        );
        yardRing.rotation.x = -Math.PI / 2;
        yardRing.position.set(0, 0.06, 0);
        grp.add(yardRing);
      });

      // Curved Swept Back Padded Telemetry Wall + HR Line + Side Nets
      const backWallGeom = createSweptWallGeometry(
        () => 406,
        () => 18,
        -0.44,
        0.44,
        40,
        2.5
      );
      grp.add(new THREE.Mesh(backWallGeom, archWallMat));
      grp.add(buildTopCopingTube(() => 406, () => 18, -0.44, 0.44, 36, 0.85, yellowMat));

      const backNetGeom = createSweptWallGeometry(
        () => 405,
        () => 44,
        -0.44,
        0.44,
        36,
        0.2
      );
      grp.add(new THREE.Mesh(backNetGeom, netMat));

      [-1, 1].forEach((side) => {
        const net = new THREE.Mesh(new THREE.PlaneGeometry(410, 34), netMat);
        net.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
        net.position.set(side * 86, 17, -195);
        grp.add(net);
      });

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
      88
    );
    const warnMesh = new THREE.Mesh(warnGeom, warnMat);
    warnMesh.receiveShadow = true;
    grp.add(warnMesh);

    // 2. Continuous Swept Outfield Wall + Coping Tube
    const wallTex =
      stSpec.id === 'fenway' ? fenwayWallTex : stSpec.id === 'wrigley' ? wrigleyWallTex : dodgerWallTex;
    const wallMat = new THREE.MeshStandardMaterial({
      map: wallTex,
      roughness: stSpec.id === 'dodger' ? 0.54 : 0.72,
      side: THREE.DoubleSide
    });
    const wallGeom = createSweptWallGeometry(stSpec.wallDist, stSpec.wallHeight, -0.785, 0.785, 96, 3.8);
    const wallMesh = new THREE.Mesh(wallGeom, wallMat);
    wallMesh.castShadow = true;
    wallMesh.receiveShadow = true;
    grp.add(wallMesh);

    const copingMat =
      stSpec.id === 'wrigley'
        ? new THREE.MeshStandardMaterial({ color: '#14532d', roughness: 0.6 })
        : yellowMat;
    grp.add(buildTopCopingTube(stSpec.wallDist, stSpec.wallHeight, -0.785, 0.785, 96, 0.82, copingMat));

    // 3. Continuous Radial Foul Poles
    [-0.785, 0.785].forEach((phi) => {
      const d = stSpec.wallDist(phi);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 72, 12), yellowMat);
      pole.position.set(Math.sin(phi) * d, 36, -Math.cos(phi) * d);
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 54), new THREE.MeshBasicMaterial({ color: '#fde047', side: THREE.DoubleSide, transparent: true, opacity: 0.85 }));
      screen.position.set(Math.sin(phi) * (d - 1.6), 38, -Math.cos(phi) * (d - 1.6));
      screen.rotation.y = phi;
      grp.add(pole, screen);
    });

    // 4. Continuous Curved Spectator Grandstand Amphitheater Bowl + Concrete Fascia Concourse
    const crowdTex =
      stSpec.id === 'fenway' ? fenwayCrowdTex : stSpec.id === 'wrigley' ? wrigleyCrowdTex : dodgerCrowdTex;
    const crowdMat = new THREE.MeshStandardMaterial({ map: crowdTex, roughness: 0.82, side: THREE.DoubleSide });

    const tierConfigs =
      stSpec.id === 'fenway'
        ? [
            // Fenway: Lower RF/CF Bleachers + Raised Green Monster Rooftop Deck
            { startPhi: -0.78, endPhi: -0.15, dOff: 6, dSpan: 28, y0: 41, y1: 52, isMonster: true },
            { startPhi: -0.14, endPhi: 0.79, dOff: 8, dSpan: 48, y0: 8, y1: 30 },
            { startPhi: -0.14, endPhi: 0.79, dOff: 60, dSpan: 40, y0: 36, y1: 58 }
          ]
        : stSpec.id === 'dodger'
          ? [
              // Dodger Stadium: Twin Outfield Pavilions + Upper Reserve Horizon Bowl
              { startPhi: -0.78, endPhi: -0.14, dOff: 10, dSpan: 46, y0: 11, y1: 33 },
              { startPhi: 0.14, endPhi: 0.78, dOff: 10, dSpan: 46, y0: 11, y1: 33 },
              { startPhi: -0.95, endPhi: 0.95, dOff: 62, dSpan: 44, y0: 38, y1: 60 }
            ]
          : [
              // Wrigley Field: Classic Curved Bleacher Amphitheater + Front Basket Concourse
              { startPhi: -0.82, endPhi: 0.82, dOff: 8, dSpan: 52, y0: 13, y1: 37 },
              { startPhi: -0.86, endPhi: -0.22, dOff: 66, dSpan: 34, y0: 42, y1: 56 },
              { startPhi: 0.22, endPhi: 0.86, dOff: 66, dSpan: 34, y0: 42, y1: 56 }
            ];

    for (const tc of tierConfigs) {
      const bowlGeom = createSweptStripGeometry(
        (phi) => stSpec.wallDist(clamp(phi, -0.785, 0.785)) + tc.dOff,
        (phi) => stSpec.wallDist(clamp(phi, -0.785, 0.785)) + tc.dOff + tc.dSpan,
        () => tc.y0,
        () => tc.y1,
        tc.startPhi,
        tc.endPhi,
        56
      );
      const bowlMesh = new THREE.Mesh(bowlGeom, crowdMat);
      bowlMesh.receiveShadow = true;
      grp.add(bowlMesh);

      // Curved Front Concrete Fascia Wall Supporting Each Bowl Tier
      const fasciaGeom = createSweptWallGeometry(
        (phi) => stSpec.wallDist(clamp(phi, -0.785, 0.785)) + tc.dOff,
        () => tc.y0,
        tc.startPhi,
        tc.endPhi,
        44,
        2.0
      );
      grp.add(new THREE.Mesh(fasciaGeom, concreteMat));

      if (tc.isMonster) {
        // Glass Safety Barrier along Fenway's Iconic Green Monster Seats
        const railGeom = createSweptWallGeometry(
          (phi) => stSpec.wallDist(phi) + 4.5,
          () => 41.5,
          tc.startPhi,
          tc.endPhi,
          36,
          0.35
        );
        grp.add(new THREE.Mesh(railGeom, glassMat));
      }
    }

    // 5. Continuous Side Baseline Extension Bowls down 1st & 3rd Base Lines (No Disconnected Open Flanks!)
    [-1, 1].forEach((side) => {
      const startP = side < 0 ? -1.48 : 0.785;
      const endP = side < 0 ? -0.785 : 1.48;
      const baseD = stSpec.wallDist(side * 0.785);
      const wingBowl = createSweptStripGeometry(
        () => baseD * 0.52,
        () => baseD * 0.68,
        () => 6,
        () => 26,
        startP,
        endP,
        20
      );
      grp.add(new THREE.Mesh(wingBowl, crowdMat));
    });

    // 6. Multi-Bulb Steel LED Stadium Light Towers
    grp.add(buildStadiumLightTowers(stSpec, [-0.64, -0.35, -0.1, 0.1, 0.35, 0.64], concreteMat, steelMat));

    // 7. Signature Park Architectural Landmarks
    if (stSpec.id === 'fenway') {
      // Iconic 3D Metal Monster Ladder in Deep LC Gap + 18 tubular rungs
      const ladderGrp = new THREE.Group();
      const railL = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 36.5, 8), steelMat);
      railL.position.set(-106, 18.2, -338);
      const railR = railL.clone();
      railR.position.x = -103.6;
      ladderGrp.add(railL, railR);

      const rungMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.08, 0.08, 2.4, 6), steelMat, 18);
      const dummy = new THREE.Object3D();
      for (let r = 0; r < 18; r++) {
        dummy.position.set(-104.8, 2 + r * 1.9, -338);
        dummy.rotation.z = Math.PI / 2;
        dummy.updateMatrix();
        rungMesh.setMatrixAt(r, dummy.matrix);
      }
      rungMesh.instanceMatrix.needsUpdate = true;
      ladderGrp.add(rungMesh);
      grp.add(ladderGrp);

      // Authentic Glowing CITGO Kenmore Neon Sign (Tower Truss + Triangle Emblem + Glow Ring)
      const citgoGrp = new THREE.Group();
      citgoGrp.position.set(-188, 84, -365);
      citgoGrp.lookAt(0, 48, 0);
      const citgoSignBg = new THREE.Mesh(new THREE.BoxGeometry(36, 36, 2.5), new THREE.MeshBasicMaterial({ color: '#f8fafc' }));
      const citgoOuterTrim = new THREE.Mesh(new THREE.BoxGeometry(38, 38, 2.0), new THREE.MeshBasicMaterial({ color: '#1d4ed8' }));
      citgoOuterTrim.position.z = -0.5;
      const triShape = new THREE.Shape();
      triShape.moveTo(0, 13);
      triShape.lineTo(-11.5, -9);
      triShape.lineTo(11.5, -9);
      triShape.closePath();
      const citgoTri = new THREE.Mesh(
        new THREE.ExtrudeGeometry(triShape, { depth: 1.5, bevelEnabled: false }),
        new THREE.MeshBasicMaterial({ color: '#ef4444' })
      );
      citgoTri.position.set(0, -1, 1.4);
      const supportPostL = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 40, 8), steelMat);
      supportPostL.position.set(-12, -32, 0);
      const supportPostR = supportPostL.clone();
      supportPostR.position.x = 12;
      citgoGrp.add(citgoOuterTrim, citgoSignBg, citgoTri, supportPostL, supportPostR);
      grp.add(citgoGrp);
    } else if (stSpec.id === 'wrigley') {
      // Authentic Continuous Cantilevered Wrigley Field Home Run Basket along Curved Ivy Top!
      const basketMesh = new THREE.Mesh(
        createSweptStripGeometry(
          (phi) => stSpec.wallDist(phi) - 2.6,
          (phi) => stSpec.wallDist(phi) + 0.4,
          () => 11.4,
          () => 11.9,
          -0.78,
          0.78,
          64
        ),
        new THREE.MeshStandardMaterial({ color: '#14532d', wireframe: true })
      );
      grp.add(basketMesh);

      // Iconic 1937 Wrigley Art-Deco Hand-Turned Green Center Field Scoreboard + Roof Arch
      const sbGrp = new THREE.Group();
      sbGrp.position.set(0, 62, -454);
      const boardFrame = new THREE.Mesh(new THREE.BoxGeometry(96, 56, 5), new THREE.MeshStandardMaterial({ color: '#15472a', roughness: 0.55 }));
      const boardFace = new THREE.Mesh(new THREE.PlaneGeometry(90, 52), new THREE.MeshBasicMaterial({ map: wrigleyBoardTex }));
      boardFace.position.z = 2.8;
      const topCrest = new THREE.Mesh(new THREE.CylinderGeometry(18, 18, 5, 24, 1, false, 0, Math.PI), new THREE.MeshStandardMaterial({ color: '#15472a' }));
      topCrest.rotation.z = Math.PI / 2;
      topCrest.rotation.y = Math.PI / 2;
      topCrest.position.set(0, 26, 0);
      const mastL = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 48, 8), steelMat);
      mastL.position.set(-28, -36, 0);
      const mastR = mastL.clone();
      mastR.position.x = 28;
      sbGrp.add(boardFrame, boardFace, topCrest, mastL, mastR);
      grp.add(sbGrp);

      // Signature Sheffield & Waveland Wrigleyville Brick Rooftop Houses + Bleachers Behind Wall!
      const brickMat = new THREE.MeshStandardMaterial({ color: '#7c2d23', roughness: 0.88 });
      const bldgPositions = [
        { x: -240, z: -380, w: 46, h: 48, d: 34, rot: 0.45 },
        { x: -165, z: -435, w: 50, h: 54, d: 36, rot: 0.28 },
        { x: 165, z: -435, w: 50, h: 52, d: 36, rot: -0.28 },
        { x: 245, z: -375, w: 46, h: 46, d: 34, rot: -0.45 }
      ];
      for (const b of bldgPositions) {
        const bMesh = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), brickMat);
        bMesh.position.set(b.x, b.h * 0.5, b.z);
        bMesh.rotation.y = b.rot;
        const deck = new THREE.Mesh(new THREE.BoxGeometry(b.w + 3, 2, b.d + 3), steelMat);
        deck.position.set(b.x, b.h + 1, b.z);
        deck.rotation.y = b.rot;
        grp.add(bMesh, deck);
      }

      // Instanced Park Elm & Oak Trees Behind Center Field Wall
      const treeCrown = new THREE.InstancedMesh(
        new THREE.DodecahedronGeometry(9, 1),
        new THREE.MeshStandardMaterial({ color: '#14532d', roughness: 0.85 }),
        14
      );
      const dummy = new THREE.Object3D();
      for (let i = 0; i < 14; i++) {
        const phi = -0.68 + (i / 13) * 1.36;
        const td = stSpec.wallDist(phi) + 125;
        dummy.position.set(Math.sin(phi) * td, 22 + (i % 3) * 4, -Math.cos(phi) * td);
        dummy.scale.set(1.1, 0.9 + (i % 3) * 0.25, 1.1);
        dummy.updateMatrix();
        treeCrown.setMatrixAt(i, dummy.matrix);
      }
      treeCrown.instanceMatrix.needsUpdate = true;
      grp.add(treeCrown);
    } else if (stSpec.id === 'dodger') {
      // Authentic Mid-Century Continuous Folded-Plate Zig-Zag Pavilion Roofs (BufferGeometry)
      const roofMat = new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.36, side: THREE.DoubleSide });
      const fasciaMat = new THREE.MeshStandardMaterial({ color: '#0ea5e9', roughness: 0.45, side: THREE.DoubleSide });
      grp.add(buildPleatedPavilionRoof(-0.46, 0.3, 392, 48, 36, 9.5, 10, roofMat, fasciaMat));
      grp.add(buildPleatedPavilionRoof(0.46, 0.3, 392, 48, 36, 9.5, 10, roofMat, fasciaMat));

      // Twin Hexagonal DodgerVision Center-Field Scoreboards (ExtrudeGeometry)
      const hexShape = new THREE.Shape();
      hexShape.moveTo(-42, -16);
      hexShape.lineTo(0, -24);
      hexShape.lineTo(42, -16);
      hexShape.lineTo(42, 16);
      hexShape.lineTo(0, 24);
      hexShape.lineTo(-42, 16);
      hexShape.closePath();

      const hexFrame = new THREE.Mesh(
        new THREE.ExtrudeGeometry(hexShape, { depth: 4, bevelEnabled: true, bevelThickness: 0.8, bevelSize: 0.8 }),
        new THREE.MeshStandardMaterial({ color: '#1e3a8a', roughness: 0.42 })
      );
      hexFrame.position.set(0, 56, -455);
      const visionFace = new THREE.Mesh(new THREE.PlaneGeometry(78, 34), new THREE.MeshBasicMaterial({ map: dodgerBoardTex }));
      visionFace.position.set(0, 56, -450.5);
      const pylon = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.6, 36, 10), concreteMat);
      pylon.position.set(0, 18, -455);
      grp.add(hexFrame, visionFace, pylon);

      // Continuous Multi-Octave Sculpted San Gabriel Mountain Ridge!
      grp.add(buildSanGabrielMountainRidge());

      // Iconic Curved California Fan Palms flanking LF & RF Pavilions
      const palmSpecs = [
        [-275, -240, 44, -6, 4],
        [-248, -295, 50, 5, -3],
        [-210, -345, 42, -4, 3],
        [210, -345, 46, 5, -3],
        [248, -295, 52, -5, 4],
        [275, -240, 43, 6, 3]
      ];
      for (const [px, pz, ph, cx, cz] of palmSpecs) {
        const palm = buildCaliforniaPalmTree(ph, cx, cz);
        palm.position.set(px, 0, pz);
        grp.add(palm);
      }
    }

    // Centerfield Wind Pennant Flag Mast on Stadium Rim
    const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.48, 24, 8), steelMat);
    flagPole.position.set(42, 34, -445);
    const flagPivot = new THREE.Group();
    flagPivot.position.set(42, 44, -445);
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

  let curStadiumId = '';
  let curBatId = '';
  let curCameraMode = 'pov'; // 'pov' | 'broadcast' | 'side'

  function setStadium(id) {
    if (curStadiumId === id) return;
    curStadiumId = id;
    for (const k of Object.keys(stadiumGroups)) {
      stadiumGroups[k].visible = k === id;
    }
    const st = stadiumSpecs[id] || stadiumSpecs.fenway;
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

  setStadium('fenway');
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

  function updateAndRender(simState, dt) {
    if (simState.phase === 'windup') {
      const p = clamp(simState.t, 0, 1);
      const kick = Math.sin(p * Math.PI);
      pitcher.leftLegPivot.rotation.x = -kick * 0.95;
      pitcher.throwArmPivot.rotation.x = -p * 2.6;
      pitcher.gloveArmPivot.rotation.x = -0.45 - p * 0.4;
      pitcher.root.position.z = -60.5 + Math.max(0, p - 0.55) * 6.5;
      pitcher.handBall.visible = true;
    } else if (simState.phase === 'pitch') {
      pitcher.leftLegPivot.rotation.x = 0.28;
      pitcher.throwArmPivot.rotation.x = 1.15;
      pitcher.gloveArmPivot.rotation.x = -0.25;
      pitcher.root.position.z = -57.2;
      pitcher.handBall.visible = false;
    } else {
      pitcher.leftLegPivot.rotation.x = THREE.MathUtils.damp(pitcher.leftLegPivot.rotation.x, 0, 8, dt);
      pitcher.throwArmPivot.rotation.x = THREE.MathUtils.damp(pitcher.throwArmPivot.rotation.x, 0.12, 8, dt);
      pitcher.gloveArmPivot.rotation.x = THREE.MathUtils.damp(pitcher.gloveArmPivot.rotation.x, -0.32, 8, dt);
      pitcher.root.position.z = THREE.MathUtils.damp(pitcher.root.position.z, -60.5, 6, dt);
      pitcher.handBall.visible = true;
    }

    const swingVal = clamp((simState.swingAngle + 0.42) / 1.37, 0, 1);
    const hideClosePlateCrew = curCameraMode === 'pov' && simState.camT > 0.74;
    batPivot.visible = !hideClosePlateCrew;
    batter.root.visible = !hideClosePlateCrew;
    plateCrew.grp.visible = !hideClosePlateCrew;

    const pitchLoad = simState.phase === 'windup' ? clamp(simState.t, 0, 1) * 0.22 : 0;
    batter.torsoPivot.rotation.y = -0.18 - pitchLoad + swingVal * 1.48;
    batter.strideLegPivot.rotation.x = pitchLoad * 0.45 - swingVal * 0.24;

    batPivot.rotation.order = 'YXZ';
    batPivot.rotation.z = 0.52 - swingVal * 2.08;
    batPivot.rotation.y = -0.65 + swingVal * 2.15;
    batPivot.rotation.x = 0.22 - swingVal * 0.28;

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

      if (fl && fl.playTime >= fl.totalTime * 0.92) {
        landingRing.visible = true;
        landingRing.position.set(fl.endX, 0.15, -fl.endY);
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
