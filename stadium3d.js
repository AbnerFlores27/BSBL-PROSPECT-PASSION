/* DiamondIQ — True-Scale Three.js 3D Baseball Stadium, Pitcher, 3D Bats & Over-the-Fence Ballistics */
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
   Procedural CanvasTextures (Zero External Assets / Zero 404)
   ========================================================= */
function makeMowedTurfTexture(maxAniso) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');

  // Crisp alternating mowed emerald bands + micro blade variation
  const bands = 8;
  const bw = c.width / bands;
  for (let i = 0; i < bands; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#1d6f3c' : '#258549';
    ctx.fillRect(i * bw, 0, bw, c.height);
  }
  ctx.globalAlpha = 0.08;
  for (let y = 0; y < bands; y++) {
    ctx.fillStyle = y % 2 === 0 ? '#0d3d20' : '#4ade80';
    ctx.fillRect(0, y * bw, c.width, bw);
  }
  ctx.globalAlpha = 0.14;
  for (let i = 0; i < 2400; i++) {
    const x = (i * 73) % 512;
    const y = (i * 137) % 512;
    ctx.fillStyle = i % 2 === 0 ? '#14532d' : '#86efac';
    ctx.fillRect(x, y, 2, 2);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(9, 9);
  tex.anisotropy = maxAniso;
  return tex;
}

function makeDirtTexture(maxAniso, hexA = '#a96b3d', hexB = '#8a522a') {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = hexA;
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2200; i++) {
    const x = (i * 53) % 256;
    const y = (i * 97) % 256;
    ctx.fillStyle = i % 3 === 0 ? hexB : '#c98956';
    ctx.globalAlpha = i % 3 === 0 ? 0.45 : 0.22;
    ctx.fillRect(x, y, 2, 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
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

  // Subtle leather grain
  ctx.fillStyle = 'rgba(148,163,184,0.18)';
  for (let i = 0; i < 600; i++) {
    ctx.fillRect((i * 41) % 256, (i * 89) % 256, 2, 1);
  }

  // Twin curved red baseball stitch seams
  const drawSeam = (cx, flip) => {
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 4;
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

function makeFenwayMonsterTexture(maxAniso) {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#1b4f3a';
  ctx.fillRect(0, 0, 1024, 256);

  // Steel panel vertical seams
  ctx.strokeStyle = 'rgba(10, 30, 22, 0.55)';
  ctx.lineWidth = 3;
  for (let x = 0; x < 1024; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }

  // Classic manual out-of-town scoreboard box
  ctx.fillStyle = '#0f3325';
  ctx.fillRect(360, 74, 340, 140);
  ctx.strokeStyle = '#a7f3d0';
  ctx.lineWidth = 3;
  ctx.strokeRect(360, 74, 340, 140);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('1  2  3  4  5  6  7  8  9   R  H  E', 380, 106);
  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 24px monospace';
  ctx.fillText('NYY  0  1  0  0  1  0  0  0  0   2  6  0', 376, 146);
  ctx.fillStyle = '#ffffff';
  ctx.fillText('BOS  1  0  2  0  0  1  0  0  X   4  9  0', 376, 186);

  // Wall distance markers 310 / 379
  ctx.fillStyle = '#fde047';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('310', 48, 220);
  ctx.fillText('379', 920, 220);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

function makeWrigleyIvyTexture(maxAniso) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d');

  // Chicago red brick base
  ctx.fillStyle = '#7c2d23';
  ctx.fillRect(0, 0, 512, 256);
  ctx.fillStyle = '#993d30';
  for (let row = 0; row < 16; row++) {
    const off = (row % 2) * 16;
    for (let col = -1; col < 17; col++) {
      ctx.fillRect(col * 32 + off + 2, row * 16 + 2, 28, 12);
    }
  }

  // Dense lush climbing green ivy clusters
  const shades = ['#14532d', '#166534', '#15803d', '#22c55e', '#1e4620'];
  for (let i = 0; i < 1600; i++) {
    const x = (i * 83) % 512;
    const y = (i * 47 + Math.sin(i * 0.4) * 28 + 256) % 256;
    if (y > 22 && y < 248) {
      ctx.fillStyle = shades[i % shades.length];
      ctx.beginPath();
      ctx.ellipse(x, y, 7 + (i % 5), 5 + (i % 4), (i % 6) * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.repeat.set(5, 1);
  tex.anisotropy = maxAniso;
  return tex;
}

function makeScoreboardTexture(title, line1, line2, bgHex, borderHex, maxAniso) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, 512, 256);
  ctx.strokeStyle = borderHex;
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 496, 240);

  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 34px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, 256, 68);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px monospace';
  ctx.fillText(line1, 256, 134);
  ctx.fillStyle = '#7dd3fc';
  ctx.fillText(line2, 256, 186);

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
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.38)';
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

/* =========================================================
   5 Custom Real-Bat CanvasTextures for LatheGeometry Bats
   (LatheGeometry V goes 0 at knob bottom -> 1 at end cap)
   ========================================================= */
function makeBatWrapTexture(batId, maxAniso) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 1024;
  const ctx = c.getContext('2d');
  // Note: Canvas y=0 corresponds to V=1 (Barrel End Cap); y=1024 corresponds to V=0 (Knob)

  const paintGrip = (bg, stripe, startY = 670, endY = 985) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, startY, 512, endY - startY);
    ctx.strokeStyle = stripe;
    ctx.lineWidth = 10;
    for (let y = startY - 120; y < endY + 120; y += 34) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y + 110);
      ctx.stroke();
    }
  };

  if (batId === 'baum-gold') {
    // Rich maple wood grain across barrel & taper
    ctx.fillStyle = '#d49b4b';
    ctx.fillRect(0, 0, 512, 1024);
    for (let i = 0; i < 65; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(138, 76, 18, 0.22)' : 'rgba(254, 232, 186, 0.22)';
      ctx.fillRect((i * 19) % 512, 0, 4 + (i % 5), 670);
    }
    paintGrip('#18110b', '#78350f');
    // Black knob
    ctx.fillStyle = '#110c07';
    ctx.fillRect(0, 985, 512, 39);
    // Gold foil rings & BAUM branding
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 420, 512, 22);
    ctx.fillStyle = '#fde68a';
    ctx.fillRect(0, 442, 512, 8);
    ctx.fillRect(0, 82, 512, 14);
    ctx.save();
    ctx.translate(256, 255);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#1c1208';
    ctx.font = 'bold 54px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BAUM BAT', 0, 12);
    ctx.fillStyle = '#92400e';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('GOLD EDITION -3', 0, 46);
    ctx.restore();
  } else if (batId === 'goods-2026') {
    // Matte carbon black barrel + bold red & Tiffany-teal DeMarini graphics
    ctx.fillStyle = '#161b24';
    ctx.fillRect(0, 0, 512, 1024);
    paintGrip('#0f172a', '#2dd4bf');
    // Half+Half red & teal connector cuff around y=560..625
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(0, 558, 512, 54);
    ctx.fillStyle = '#2dd4bf';
    ctx.fillRect(0, 544, 512, 14);
    ctx.fillRect(0, 612, 512, 10);
    // Barrel accent bands
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(0, 390, 512, 34);
    ctx.fillStyle = '#2dd4bf';
    ctx.fillRect(0, 66, 512, 24);
    ctx.fillStyle = '#090d14';
    ctx.fillRect(0, 0, 512, 42);
    ctx.save();
    ctx.translate(256, 235);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 50px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('THE GOODS', 0, 10);
    ctx.fillStyle = '#2dd4bf';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('2026 BBCOR · X14', 0, 44);
    ctx.restore();
  } else if (batId === 'goods-2022') {
    // Signature Chrome Silver X14 barrel + black handle + crimson cuff
    const grd = ctx.createLinearGradient(0, 0, 512, 0);
    grd.addColorStop(0, '#94a3b8');
    grd.addColorStop(0.35, '#f8fafc');
    grd.addColorStop(0.65, '#cbd5e1');
    grd.addColorStop(1, '#94a3b8');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 512, 560);
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 560, 512, 464);
    paintGrip('#18181b', '#dc2626');
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(0, 554, 512, 56);
    ctx.fillRect(0, 395, 512, 28);
    ctx.fillRect(0, 74, 512, 18);
    ctx.save();
    ctx.translate(256, 240);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 50px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('THE GOODS', 0, 10);
    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('2022 HYBRID -3', 0, 44);
    ctx.restore();
  } else if (batId === 'combat-rodeo') {
    // Antique cream seamless 1pc barrel + maroon & burnt-orange rodeo stripes + tan Clinch grip
    ctx.fillStyle = '#efe4ce';
    ctx.fillRect(0, 0, 512, 675);
    paintGrip('#925921', '#d97706');
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(0, 985, 512, 39);
    // Western geometric bands
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(0, 425, 512, 36);
    ctx.fillRect(0, 72, 512, 24);
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(0, 405, 512, 18);
    ctx.fillRect(0, 96, 512, 14);
    ctx.save();
    ctx.translate(256, 252);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#7f1d1d';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SPEC-A1 RODEO', 0, 10);
    ctx.fillStyle = '#c2410c';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('COMBAT MFG · 1-PC', 0, 44);
    ctx.restore();
  } else {
    // combat-blue: Powder sky-blue seamless barrel + navy & gold country club stripes + argyle grip
    ctx.fillStyle = '#72c8f8';
    ctx.fillRect(0, 0, 512, 675);
    paintGrip('#1e3a8a', '#bae6fd');
    // Argyle cross-hatch overlay on grip
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.45)';
    ctx.lineWidth = 4;
    for (let y = 680; y < 990; y += 34) {
      ctx.beginPath();
      ctx.moveTo(512, y);
      ctx.lineTo(0, y + 110);
      ctx.stroke();
    }
    ctx.fillStyle = '#172554';
    ctx.fillRect(0, 985, 512, 39);
    ctx.fillRect(0, 420, 512, 32);
    ctx.fillRect(0, 72, 512, 22);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(0, 404, 512, 14);
    ctx.fillRect(0, 94, 512, 12);
    ctx.save();
    ctx.translate(256, 250);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#172554';
    ctx.font = 'bold 46px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MEMBERS CLUB', 0, 10);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('COMBAT SPEC-A1 -3', 0, 44);
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

/* =========================================================
   Build True 3D LatheGeometry Bat (2.85 ft / 34 inches long)
   Scaled gently (1.35x) in hand so barrel graphics read crisply in batter's POV
   ========================================================= */
function buildLatheBatMesh(batConfig, tex) {
  // Lathe profile along Y from y=0 (knob) up to y=3.65 (end cap)
  const pts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.14, 0.02),
    new THREE.Vector2(0.145, 0.09),
    new THREE.Vector2(0.085, 0.14),
    new THREE.Vector2(0.072, 1.15), // slim wrapped handle
    new THREE.Vector2(0.088, 1.38),
    new THREE.Vector2(0.115, 1.68), // taper
    new THREE.Vector2(0.16, 2.02),
    new THREE.Vector2(batConfig.id === 'baum-gold' ? 0.168 : 0.178, 2.18), // full barrel
    new THREE.Vector2(batConfig.id === 'baum-gold' ? 0.168 : 0.178, 3.55),
    new THREE.Vector2(0.155, 3.63),
    new THREE.Vector2(batConfig.capStyle === 'cupped' ? 0.05 : 0.12, 3.63),
    new THREE.Vector2(0.0, batConfig.capStyle === 'cupped' ? 3.56 : 3.64)
  ];

  const geom = new THREE.LatheGeometry(pts, 28);
  const isMetal = batConfig.id === 'goods-2022';
  const isMatte = batConfig.id === 'goods-2026';
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: isMetal ? 0.22 : isMatte ? 0.48 : 0.36,
    metalness: isMetal ? 0.85 : isMatte ? 0.35 : batConfig.id === 'baum-gold' ? 0.05 : 0.62
  });

  const mesh = new THREE.Mesh(geom, mat);
  mesh.castShadow = true;
  // Rotate so default text faces camera cleanly
  mesh.rotation.y = Math.PI * 0.45;
  return mesh;
}

/* =========================================================
   Build Composite 7-Part 6.0-ft Articulated 3D Pitcher
   Standing cleanly on Mound at (0, 0.83, -60.5)
   ========================================================= */
function buildCompositePitcher() {
  const root = new THREE.Group();
  root.position.set(0, 0.83, -60.5);

  const pantsMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.72 });
  const jerseyMat = new THREE.MeshStandardMaterial({ color: '#1d4ed8', roughness: 0.65 });
  const skinMat = new THREE.MeshStandardMaterial({ color: '#d99b72', roughness: 0.68 });
  const navyMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.6 });
  const gloveMat = new THREE.MeshStandardMaterial({ color: '#92400e', roughness: 0.58 });

  // Torso (waist y=3.05 to shoulders y=4.95)
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.5, 1.85, 14), jerseyMat);
  torso.position.set(0, 3.95, 0);
  torso.castShadow = true;
  root.add(torso);

  // Belt
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.16, 14), navyMat);
  belt.position.set(0, 3.02, 0);
  root.add(belt);

  // Head + Cap + Visor facing +Z (Home Plate)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 5.28, 0);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 14, 12), skinMat);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.45, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.56), navyMat);
  cap.position.y = 0.08;
  const brim = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.06, 0.45), navyMat);
  brim.position.set(0, 0.1, 0.36);
  headGroup.add(head, cap, brim);
  root.add(headGroup);

  // Left Leg (Plant Leg on -X side looking from plate, actually pitcher's right leg on -X, left leg on +X)
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

  // Glove Arm (pitcher's left arm -> +X)
  const armGeom = new THREE.CylinderGeometry(0.15, 0.12, 1.9, 10);
  armGeom.translate(0, -0.92, 0);

  const gloveArmPivot = new THREE.Group();
  gloveArmPivot.position.set(0.75, 4.7, 0);
  gloveArmPivot.add(new THREE.Mesh(armGeom, jerseyMat));
  const glove = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 10), gloveMat);
  glove.scale.set(0.85, 1.15, 1.0);
  glove.position.set(0, -1.9, 0.12);
  gloveArmPivot.add(glove);
  root.add(gloveArmPivot);

  // Throwing Arm (pitcher's right arm -> -X)
  const throwArmPivot = new THREE.Group();
  throwArmPivot.position.set(-0.75, 4.7, 0);
  throwArmPivot.add(new THREE.Mesh(armGeom, jerseyMat));
  const hand = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), skinMat);
  hand.position.set(0, -1.9, 0);
  throwArmPivot.add(hand);
  root.add(throwArmPivot);

  return {
    root,
    leftLegPivot,
    rightLegPivot,
    gloveArmPivot,
    throwArmPivot
  };
}

/* =========================================================
   Main Exported Factory: createStadium3DEngine
   ========================================================= */
export function createStadium3DEngine(canvas, batSpecs, stadiumSpecs) {
  const gl = canvas.getContext('webgl2', { antialias: true, powerPreference: 'high-performance' }) ||
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
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = !isSoftwareGl;
  if (!isSoftwareGl) renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy() || 1);

  // PMREM metallic environment reflections (essential for Chrome Silver / Alloy bats)
  const pmrem = new THREE.PMREMGenerator(renderer);
  const roomEnv = new RoomEnvironment();
  scene.environment = pmrem.fromScene(roomEnv, 0.04).texture;
  roomEnv.dispose();

  const camera = new THREE.PerspectiveCamera(42, 16 / 9, 0.4, 1800);
  camera.position.set(0.22, 4.9, 14.5);
  camera.lookAt(0, 3.1, -55);

  // Lights: Cool Sky/Turf Hemisphere + Warm Stadium Sun Key + Rim Backlight
  const hemi = new THREE.HemisphereLight('#bfd9ff', '#1e4228', 0.95);
  scene.add(hemi);

  const keyLight = new THREE.DirectionalLight('#fff2dc', 2.4);
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

  const rimLight = new THREE.DirectionalLight('#7dd3fc', 0.75);
  rimLight.position.set(-140, 80, -240);
  scene.add(rimLight);

  // Shared Procedural Textures
  const turfTex = makeMowedTurfTexture(maxAniso);
  const dirtTex = makeDirtTexture(maxAniso);
  const ballTex = makeBaseballTexture(maxAniso);
  const monsterTex = makeFenwayMonsterTexture(maxAniso);
  const ivyTex = makeWrigleyIvyTexture(maxAniso);
  const cageNetTex = makeCageNetTexture(maxAniso);
  const wrigleyBoardTex = makeScoreboardTexture('WRIGLEY FIELD', 'CHC 5   STL 3', 'BOT 7TH · 99.4 MPH EV', '#184a2c', '#f8fafc', maxAniso);
  const dodgerBoardTex = makeScoreboardTexture('DODGER STADIUM', 'LAD 6   SF 2', 'STATCAST BARREL LAB', '#172554', '#38bdf8', maxAniso);

  // Sky Gradient Dome (always follows horizon cleanly)
  const skyCanvas = document.createElement('canvas');
  skyCanvas.width = 4;
  skyCanvas.height = 256;
  const skyTex = new THREE.CanvasTexture(skyCanvas);
  skyTex.colorSpace = THREE.SRGBColorSpace;
  const skyMesh = new THREE.Mesh(
    new THREE.SphereGeometry(980, 24, 16),
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
    scene.fog = new THREE.Fog(lowHex, 290, 960);
  }

  /* =========================================================
     Shared Field Diamond Geometry (1 unit = 1 ft, Home Plate at 0,0,0)
     ========================================================= */
  const fieldGroup = new THREE.Group();
  scene.add(fieldGroup);

  const turfMat = new THREE.MeshStandardMaterial({ map: turfTex, roughness: 0.9, metalness: 0.0 });
  const dirtMat = new THREE.MeshStandardMaterial({ map: dirtTex, roughness: 0.95, metalness: 0.0 });
  const chalkMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.85 });
  const baseMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.45 });

  // Deep Turf Field Disc (560 ft radius)
  const turfGround = new THREE.Mesh(new THREE.CircleGeometry(560, 64), turfMat);
  turfGround.rotation.x = -Math.PI / 2;
  turfGround.receiveShadow = true;
  fieldGroup.add(turfGround);

  // Infield Dirt Arc (centered at mound (0, -60.5), radius 96 ft fan)
  const infieldDirt = new THREE.Mesh(new THREE.CircleGeometry(98, 48, Math.PI * 0.2, Math.PI * 0.6), dirtMat);
  infieldDirt.rotation.x = -Math.PI / 2;
  infieldDirt.position.set(0, 0.02, -55);
  infieldDirt.receiveShadow = true;
  fieldGroup.add(infieldDirt);

  // Inner Grass Diamond inside Basepaths
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

  // Dirt Apron Around Home Plate
  const homeDirt = new THREE.Mesh(new THREE.CircleGeometry(15, 28), dirtMat);
  homeDirt.rotation.x = -Math.PI / 2;
  homeDirt.position.set(0, 0.04, 0);
  homeDirt.receiveShadow = true;
  fieldGroup.add(homeDirt);

  // Mound Cone + Rubber Slab at (0, 0, -60.5)
  const moundMesh = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 9.2, 0.83, 28), dirtMat);
  moundMesh.position.set(0, 0.415, -60.5);
  moundMesh.receiveShadow = true;
  fieldGroup.add(moundMesh);

  const rubber = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 0.5), baseMat);
  rubber.position.set(0, 0.84, -60.5);
  fieldGroup.add(rubber);

  // Home Plate + 1B, 2B, 3B Bases (at true 90-ft diamond coordinates!)
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
  makeBase(63.64, -63.64); // 1B
  makeBase(0, -127.28); // 2B
  makeBase(-63.64, -63.64); // 3B

  // Crisp White Chalk Foul Lines (LF and RF out to 340 ft)
  [-1, 1].forEach((side) => {
    const lineLen = 350;
    const chalk = new THREE.Mesh(new THREE.PlaneGeometry(0.42, lineLen), chalkMat);
    chalk.rotation.x = -Math.PI / 2;
    chalk.rotation.z = side * (Math.PI / 4);
    const mid = lineLen / 2;
    chalk.position.set(-side * mid * Math.SQRT1_2, 0.05, -mid * Math.SQRT1_2);
    fieldGroup.add(chalk);
  });

  // Chalk Batter's Boxes
  [-3.1, 3.1].forEach((bx) => {
    const boxFrame = new THREE.Mesh(new THREE.RingGeometry(2.3, 2.55, 4), chalkMat);
    boxFrame.rotation.x = -Math.PI / 2;
    boxFrame.rotation.z = Math.PI / 4;
    boxFrame.scale.set(0.85, 1.35, 1);
    boxFrame.position.set(bx, 0.052, 0.2);
    fieldGroup.add(boxFrame);
  });

  // Composite 6.0-ft Pitcher standing cleanly on mound
  const pitcher = buildCompositePitcher();
  scene.add(pitcher.root);

  // Batter's Bat Pivot (placed naturally in RH batter's box on -X side of plate)
  const batPivot = new THREE.Group();
  batPivot.position.set(-2.2, 2.75, 0.25);
  scene.add(batPivot);

  const batMeshes = {};
  for (const id of Object.keys(batSpecs)) {
    const tex = makeBatWrapTexture(id, maxAniso);
    const mesh = buildLatheBatMesh(batSpecs[id], tex);
    mesh.visible = false;
    batPivot.add(mesh);
    batMeshes[id] = mesh;
  }

  // 3D Stitched Baseball + Turf Ground Shadow
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

  // Pre-allocated Dynamic 3D Comet Ribbon Trail (Zero per-frame GC allocation!)
  const MAX_TRAIL_PTS = 160;
  const trailVerts = new Float32Array(MAX_TRAIL_PTS * 2 * 3);
  const trailGeom = new THREE.BufferGeometry();
  trailGeom.setAttribute('position', new THREE.BufferAttribute(trailVerts, 3));
  trailGeom.setDrawRange(0, 0);
  const trailMat = new THREE.MeshBasicMaterial({
    color: '#38bdf8',
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.84,
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
    const width = 0.65;

    for (let i = 0; i < count; i++) {
      const p = points[i];
      const wx = p.x;
      const wy = Math.max(0.15, p.z);
      const wz = -p.y;
      const taper = 0.25 + 0.75 * (i / Math.max(1, count - 1));
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

  // Initialize permanent triangle index buffer for the ribbon strip
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
     Stadium Builder (Fenway / Wrigley / Dodger / Indoor Cage)
     ========================================================= */
  const stadiumGroups = {};

  function buildStadiumGroup(stSpec) {
    const grp = new THREE.Group();
    const yellowMat = new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.4, metalness: 0.2 });
    const concreteMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.85 });
    const seatDeckMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.8 });

    if (stSpec.id === 'cage') {
      // Massive Pro Indoor Hitting Facility (160 ft wide x 430 ft deep x 38 ft high)
      const steelMat = new THREE.MeshStandardMaterial({ color: '#475569', metalness: 0.65, roughness: 0.4 });
      const netMat = new THREE.MeshBasicMaterial({ map: cageNetTex, transparent: true, side: THREE.DoubleSide, depthWrite: false });
      const glowMat = new THREE.MeshBasicMaterial({ color: '#e0f2fe' });

      [80, 160, 240, 320, 400].forEach((dist) => {
        const z = -dist;
        const colL = new THREE.Mesh(new THREE.BoxGeometry(2.5, 38, 2.5), steelMat);
        colL.position.set(-85, 19, z);
        const colR = new THREE.Mesh(new THREE.BoxGeometry(2.5, 38, 2.5), steelMat);
        colR.position.set(85, 19, z);
        const beam = new THREE.Mesh(new THREE.BoxGeometry(172, 2.4, 2.4), steelMat);
        beam.position.set(0, 38, z);
        const lightBar = new THREE.Mesh(new THREE.BoxGeometry(110, 0.8, 1.8), glowMat);
        lightBar.position.set(0, 36.2, z);
        grp.add(colL, colR, beam, lightBar);

        const yardBand = new THREE.Mesh(
          new THREE.PlaneGeometry(170, 1.6),
          dist === 400 ? yellowMat : chalkMat
        );
        yardBand.rotation.x = -Math.PI / 2;
        yardBand.position.set(0, 0.06, z);
        grp.add(yardBand);
      });

      const backNet = new THREE.Mesh(new THREE.PlaneGeometry(172, 40), netMat);
      backNet.position.set(0, 20, -408);
      const backWall = new THREE.Mesh(
        new THREE.BoxGeometry(172, 16, 2),
        new THREE.MeshStandardMaterial({ color: '#1e3a5f', roughness: 0.7 })
      );
      backWall.position.set(0, 8, -412);
      const hrTop = new THREE.Mesh(new THREE.BoxGeometry(172, 1.4, 2.4), yellowMat);
      hrTop.position.set(0, 16.5, -412);

      const sideL = new THREE.Mesh(new THREE.PlaneGeometry(430, 38), netMat);
      sideL.rotation.y = Math.PI / 2;
      sideL.position.set(-85, 19, -195);
      const sideR = new THREE.Mesh(new THREE.PlaneGeometry(430, 38), netMat);
      sideR.rotation.y = -Math.PI / 2;
      sideR.position.set(85, 19, -195);

      grp.add(backNet, backWall, hrTop, sideL, sideR);
      return grp;
    }

    // Outdoor Stadiums: Build Segmented Outfield Wall + Warning Track + Grandstand Tiers!
    const segs = 28;
    const warnMat = new THREE.MeshStandardMaterial({ color: '#7c4728', roughness: 0.92 });
    const wallMat =
      stSpec.id === 'fenway'
        ? new THREE.MeshStandardMaterial({ map: monsterTex, roughness: 0.65 })
        : stSpec.id === 'wrigley'
          ? new THREE.MeshStandardMaterial({ map: ivyTex, roughness: 0.82 })
          : new THREE.MeshStandardMaterial({ color: '#1d4ed8', roughness: 0.55 });

    for (let i = 0; i < segs; i++) {
      const p0 = -0.785 + (i / segs) * 1.57;
      const p1 = -0.785 + ((i + 1) / segs) * 1.57;
      const pm = (p0 + p1) * 0.5;
      const d0 = stSpec.wallDist(p0);
      const d1 = stSpec.wallDist(p1);
      const dm = (d0 + d1) * 0.5;
      const hm = stSpec.wallHeight(pm);

      const x0 = Math.sin(p0) * d0;
      const z0 = -Math.cos(p0) * d0;
      const x1 = Math.sin(p1) * d1;
      const z1 = -Math.cos(p1) * d1;
      const segLen = Math.hypot(x1 - x0, z1 - z0) + 0.6;
      const ang = Math.atan2(z1 - z0, x1 - x0);

      const wall = new THREE.Mesh(new THREE.BoxGeometry(segLen, hm, 3.0), wallMat);
      wall.position.set((x0 + x1) * 0.5, hm * 0.5, (z0 + z1) * 0.5);
      wall.rotation.y = -ang;
      wall.castShadow = true;
      wall.receiveShadow = true;
      grp.add(wall);

      const cap = new THREE.Mesh(new THREE.BoxGeometry(segLen, 1.3, 3.3), yellowMat);
      cap.position.set((x0 + x1) * 0.5, hm + 0.4, (z0 + z1) * 0.5);
      cap.rotation.y = -ang;
      grp.add(cap);

      const track = new THREE.Mesh(new THREE.BoxGeometry(segLen + 2, 0.08, 16), warnMat);
      track.position.set(Math.sin(pm) * (dm - 8), 0.045, -Math.cos(pm) * (dm - 8));
      track.rotation.y = -ang;
      grp.add(track);

      const tierCount = stSpec.id === 'fenway' && pm < -0.15 ? 2 : 4;
      for (let t = 0; t < tierCount; t++) {
        const td = dm + 16 + t * 14;
        const th = (stSpec.id === 'fenway' && pm < -0.15 ? 39 : hm + 5) + t * 9.5;
        const stand = new THREE.Mesh(new THREE.BoxGeometry(segLen + 4, 8, 13), t % 2 === 0 ? seatDeckMat : concreteMat);
        stand.position.set(Math.sin(pm) * td, th, -Math.cos(pm) * td);
        stand.rotation.y = -ang;
        grp.add(stand);
      }
    }

    [-0.785, 0.785].forEach((phi) => {
      const d = stSpec.wallDist(phi);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 64, 10), yellowMat);
      pole.position.set(Math.sin(phi) * d, 32, -Math.cos(phi) * d);
      grp.add(pole);
    });

    [-0.62, -0.34, -0.1, 0.1, 0.34, 0.62].forEach((phi) => {
      const d = stSpec.wallDist(phi) + 64;
      const tx = Math.sin(phi) * d;
      const tz = -Math.cos(phi) * d;
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.8, 118, 8), concreteMat);
      tower.position.set(tx, 59, tz);
      const bank = new THREE.Mesh(
        new THREE.BoxGeometry(22, 9, 2),
        new THREE.MeshBasicMaterial({ color: '#f0f9ff' })
      );
      bank.position.set(tx, 118, tz);
      bank.lookAt(0, 10, 0);
      grp.add(tower, bank);
    });

    if (stSpec.id === 'fenway') {
      const citgoBase = new THREE.Mesh(
        new THREE.BoxGeometry(32, 30, 3),
        new THREE.MeshBasicMaterial({ color: '#0f172a' })
      );
      citgoBase.position.set(-195, 76, -345);
      citgoBase.lookAt(0, 50, 0);
      const citgoTri = new THREE.Mesh(
        new THREE.ConeGeometry(12, 20, 3),
        new THREE.MeshBasicMaterial({ color: '#ef4444' })
      );
      citgoTri.position.set(-193, 76, -342);
      grp.add(citgoBase, citgoTri);
    } else if (stSpec.id === 'wrigley') {
      const sb = new THREE.Mesh(
        new THREE.BoxGeometry(92, 42, 4),
        new THREE.MeshBasicMaterial({ map: wrigleyBoardTex })
      );
      sb.position.set(0, 56, -424);
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 42, 8), seatDeckMat);
      mast.position.set(0, 22, -425);
      grp.add(sb, mast);
    } else if (stSpec.id === 'dodger') {
      const roofMat = new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.4 });
      [-155, 155].forEach((px) => {
        for (let z = -3; z <= 3; z++) {
          const pleat = new THREE.Mesh(new THREE.ConeGeometry(14, 16, 4), roofMat);
          pleat.rotation.y = Math.PI / 4;
          pleat.scale.set(1.1, 0.7, 2.2);
          pleat.position.set(px + z * 16, 44, -365 + Math.abs(px) * 0.14);
          grp.add(pleat);
        }
      });
      const board = new THREE.Mesh(
        new THREE.BoxGeometry(92, 40, 4),
        new THREE.MeshBasicMaterial({ map: dodgerBoardTex })
      );
      board.position.set(0, 54, -420);
      grp.add(board);
    }

    return grp;
  }

  for (const sid of Object.keys(stadiumSpecs)) {
    const g = buildStadiumGroup(stadiumSpecs[sid]);
    g.visible = false;
    scene.add(g);
    stadiumGroups[sid] = g;
  }

  /* =========================================================
     Pre-Allocated Camera & State Sync API
     ========================================================= */
  const _camTargetPos = new THREE.Vector3();
  const _camTargetLook = new THREE.Vector3();
  const _camCurLook = new THREE.Vector3(0, 3.1, -55);
  const _projVec = new THREE.Vector3();

  let curStadiumId = '';
  let curBatId = '';

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
    for (const k of Object.keys(batMeshes)) {
      batMeshes[k].visible = k === id;
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

  // Project any 3D world point (in feet) onto normalized 2D [0..1] canvas viewport
  function projectWorldToNorm(wx, wy, wz) {
    _projVec.set(wx, wy, wz).project(camera);
    return {
      nx: (_projVec.x + 1) * 0.5,
      ny: (1 - _projVec.y) * 0.5
    };
  }

  // Render Frame driven by main simulator state
  function updateAndRender(simState, dt) {
    // 1. Animate 6.0-ft Pitcher Windup & Delivery
    if (simState.phase === 'windup') {
      const p = clamp(simState.t, 0, 1);
      const kick = Math.sin(p * Math.PI);
      pitcher.leftLegPivot.rotation.x = -kick * 0.95;
      pitcher.throwArmPivot.rotation.x = -p * 2.6;
      pitcher.gloveArmPivot.rotation.x = -0.45 - p * 0.4;
      pitcher.root.position.z = -60.5 + Math.max(0, p - 0.55) * 6.5;
    } else if (simState.phase === 'pitch') {
      pitcher.leftLegPivot.rotation.x = 0.28;
      pitcher.throwArmPivot.rotation.x = 1.15;
      pitcher.gloveArmPivot.rotation.x = -0.25;
      pitcher.root.position.z = -57.2;
    } else {
      pitcher.leftLegPivot.rotation.x = THREE.MathUtils.damp(pitcher.leftLegPivot.rotation.x, 0, 8, dt);
      pitcher.throwArmPivot.rotation.x = THREE.MathUtils.damp(pitcher.throwArmPivot.rotation.x, 0.12, 8, dt);
      pitcher.gloveArmPivot.rotation.x = THREE.MathUtils.damp(pitcher.gloveArmPivot.rotation.x, -0.32, 8, dt);
      pitcher.root.position.z = THREE.MathUtils.damp(pitcher.root.position.z, -60.5, 6, dt);
    }

    // 2. Animate 3D LatheGeometry Bat in RH Batter's Box (-2.2, 2.75, 0.25)
    // Ready stance: angled up behind batter's left shoulder; swing drops horizontal (-1.52) & whips across plate!
    const swingVal = clamp((simState.swingAngle + 0.42) / 1.37, 0, 1);
    batPivot.visible = simState.camT < 0.72;
    batPivot.rotation.order = 'YXZ';
    batPivot.rotation.z = 0.52 - swingVal * 2.08;
    batPivot.rotation.y = -0.65 + swingVal * 2.15;
    batPivot.rotation.x = 0.22 - swingVal * 0.28;

    // 3. Position 3D Baseball & Dynamic Comet Trail
    let followX = 0;
    let followY = 3.1;
    let followZ = -55;

    if (simState.phase === 'pitch' && simState.pitchPos) {
      ballMesh.visible = true;
      ballShadow.visible = true;
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

      ballMesh.visible = true;
      ballShadow.visible = true;
      ballMesh.position.set(bx, by, bz);
      ballMesh.rotation.x -= dt * 34;
      ballShadow.position.set(bx, 0.08, bz);
      const shScale = clamp(1 + by * 0.028, 1, 3.0);
      ballShadow.scale.set(shScale, shScale, 1);

      updateTrailRibbon(simState.flightPoints, simState.flightMaxIdx, simState.flightColor);

      followX = bx * 0.72;
      followY = Math.max(12, by * 0.85);
      followZ = bz * 0.86;
    } else {
      ballMesh.visible = false;
      ballShadow.visible = false;
      trailGeom.setDrawRange(0, 0);
    }

    // 4. Smoothly Damp Camera between Batter's Box POV & HitTrax Elevated Chase View!
    if (simState.phase === 'flight' && simState.flightCur && simState.flightFair) {
      const cur = simState.flightCur;
      const distOut = Math.hypot(cur.x, cur.y);
      const chaseFactor = clamp(distOut / 220, 0, 1);
      _camTargetPos.set(
        cur.x * 0.22,
        15 + cur.z * 0.45 + chaseFactor * 16,
        19 - distOut * 0.14
      );
      _camTargetLook.set(followX, Math.max(8, followY * 0.82), Math.min(-35, followZ));
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
    resize,
    projectWorldToNorm,
    updateAndRender
  };
}

window.createStadium3DEngine = createStadium3DEngine;
window.dispatchEvent(new CustomEvent('diamondiq-3d-ready'));
