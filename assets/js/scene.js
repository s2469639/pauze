// PAUZE — 3D object built from the product proportions (H 125mm × Ø 82mm).
// Matte stucco ceramic (with an engraved wordmark), brushed champagne brass and
// milky frosted glass are separate materials so the colorway can change live.
// The glass is empty — the "scent" is shown as a soft mist rising from the cap.
import * as THREE from 'three';
import { RoomEnvironment } from './../vendor/RoomEnvironment.js';

const NECK = 0.03;
const BULB = 0.30;                                  // glass half height
const glassR = (y) => NECK + 0.462 * Math.pow(Math.min(Math.abs(y), BULB) / BULB, 1.45);
const BODY_R = 0.645;
const CIRC = Math.PI * 2 * BODY_R;                   // world units around the body

export function createScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.035).texture;
  scene.environmentIntensity = 0.85;

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
  camera.position.set(0, 0.35, 7.4);
  camera.lookAt(0, 0, 0);

  // soft studio light: large warm key from upper left, cool fill, rim from behind
  const key = new THREE.DirectionalLight(0xfff6ea, 1.35);
  key.position.set(-4, 5, 4);
  const fill = new THREE.DirectionalLight(0xf2f4f8, 0.45);
  fill.position.set(5, 1, 3);
  const rim = new THREE.DirectionalLight(0xffffff, 0.9);
  rim.position.set(2, 3, -5);
  scene.add(key, fill, rim, new THREE.HemisphereLight(0xffffff, 0x9c9282, 0.35));

  // ---------- textures ----------
  const lowerTex = makeCeramicTextures(true);
  const upperTex = makeCeramicTextures(false);
  for (const t of [lowerTex.map, lowerTex.bump, upperTex.map, upperTex.bump]) t.anisotropy = maxAniso;
  const brushed = makeBrushedTexture();
  brushed.anisotropy = maxAniso;

  // ---------- materials ----------
  const ceramicOpts = { color: '#A5AE98', roughness: 0.9, metalness: 0, bumpScale: 0.55 };
  const ceramicLow = new THREE.MeshStandardMaterial({ ...ceramicOpts, map: lowerTex.map, bumpMap: lowerTex.bump });
  const ceramicUp = new THREE.MeshStandardMaterial({ ...ceramicOpts, map: upperTex.map, bumpMap: upperTex.bump });
  const ceramicCap = new THREE.MeshStandardMaterial({ ...ceramicOpts, map: upperTex.map, bumpMap: upperTex.bump });
  const ceramics = [ceramicLow, ceramicUp, ceramicCap];

  const brass = new THREE.MeshPhysicalMaterial({
    color: '#d6c6a3', metalness: 1, roughness: 0.32, roughnessMap: brushed, bumpMap: brushed, bumpScale: 0.25,
    anisotropy: 0.75, anisotropyRotation: 0, clearcoat: 0.15, clearcoatRoughness: 0.4,
  });

  // milky frosted glass: an outer satin shell + an inner haze layer
  const glassOuter = new THREE.MeshPhysicalMaterial({
    color: '#f7f5f1', roughness: 0.55, metalness: 0, transparent: true, opacity: 0.5,
    sheen: 1, sheenColor: new THREE.Color('#ffffff'), sheenRoughness: 0.45,
    clearcoat: 0.6, clearcoatRoughness: 0.5, depthWrite: false, side: THREE.FrontSide,
  });
  const glassInner = new THREE.MeshStandardMaterial({ color: '#e9e5de', roughness: 1, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.BackSide });

  // ---------- geometry ----------
  const flip = new THREE.Group();     // rotates around Z for the flip
  const spin = new THREE.Group();     // idle rotation around Y
  flip.add(spin);
  scene.add(flip);

  const lathe = (pts, mat, seg = 128) => {
    const m = new THREE.Mesh(new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg), mat);
    m.rotation.y = Math.PI;           // texture seam to the back
    return m;
  };
  // brass band with softly rounded edges
  const ring = (r, y0, y1, inset = 0.012) => {
    const pts = [[0, y0], [r - inset, y0]];
    for (let i = 0; i <= 6; i++) { const a = (i / 6) * (Math.PI / 2); pts.push([r - inset + Math.sin(a) * inset, y0 + inset - Math.cos(a) * inset]); }
    for (let i = 0; i <= 6; i++) { const a = (i / 6) * (Math.PI / 2); pts.push([r - inset + Math.cos(a) * inset, y1 - inset + Math.sin(a) * inset]); }
    pts.push([0, y1]);
    return lathe(pts, brass, 160);
  };

  // ceramic cup: straight wall rounding into the waist, generated evenly along y
  const cupProfile = () => {
    const pts = [[0, -0.95]];
    const N = 48;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const y = -0.95 + t * (0.95 - 0.338);
      const k = Math.max(0, (t - 0.38) / 0.62);
      pts.push([BODY_R - 0.122 * Math.pow(k, 2.1), y]);
    }
    pts.push([0, -0.338]);
    return pts;
  };
  spin.add(lathe(cupProfile(), ceramicLow));
  const upper = lathe(cupProfile(), ceramicUp);
  upper.rotation.set(Math.PI, 0, 0);            // mirrored top cup (logo only on the lower one)
  spin.add(upper);
  spin.add(ring(0.662, -1.0, -0.948));            // base
  spin.add(ring(0.532, -0.345, -0.298, 0.008));   // lower collar
  spin.add(ring(0.532, 0.298, 0.345, 0.008));     // upper collar

  // cap: brass rim + recessed ceramic disk (lifts during "prepare")
  const cap = new THREE.Group();
  cap.add(ring(0.662, 0.948, 1.0));
  const disk = lathe([[0, 0.993], [0.58, 0.993], [0.6, 0.999]], ceramicCap);
  cap.add(disk);
  spin.add(cap);

  // glass (empty, frosted)
  const gpts = [];
  for (let i = 0; i <= 80; i++) { const y = -BULB + (2 * BULB * i) / 80; gpts.push([glassR(y), y]); }
  const glassMesh = lathe(gpts, glassOuter, 128); glassMesh.renderOrder = 3;
  const hazeMesh = lathe(gpts.map(([x, y]) => [Math.max(0.004, x - 0.012), y]), glassInner, 96); hazeMesh.renderOrder = 2;
  spin.add(hazeMesh, glassMesh);
  const floorMat = new THREE.MeshStandardMaterial({ color: '#ddd8cf', roughness: 0.9 });
  for (const sgn of [-1, 1]) {
    const f = new THREE.Mesh(new THREE.CircleGeometry(glassR(BULB) + 0.01, 96), floorMat);
    f.rotation.x = sgn < 0 ? -Math.PI / 2 : Math.PI / 2;
    f.position.y = sgn * (BULB - 0.003);
    spin.add(f);
  }

  // contact shadow (world space, does not flip)
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 2.8), new THREE.MeshBasicMaterial({ map: makeShadowTexture(), transparent: true, depthWrite: false, opacity: 0.6 }));
  shadow.rotation.x = -Math.PI / 2;
  scene.add(shadow);

  // scent mist: soft sprites rising from whichever end faces up
  const MIST = 46;
  const mistGeo = new THREE.BufferGeometry();
  const mPos = new Float32Array(MIST * 3), mAlpha = new Float32Array(MIST), mSize = new Float32Array(MIST);
  mistGeo.setAttribute('position', new THREE.BufferAttribute(mPos, 3));
  mistGeo.setAttribute('alpha', new THREE.BufferAttribute(mAlpha, 1));
  mistGeo.setAttribute('size', new THREE.BufferAttribute(mSize, 1));
  const seeds = Array.from({ length: MIST }, (_, i) => ({ t: i / MIST, sx: Math.random() * 6.28, sp: 0.6 + Math.random() * 0.6, r: Math.random() }));
  const mistMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uTex: { value: makeMistTexture() }, uColor: { value: new THREE.Color('#d6cdbd') }, uAmount: { value: 0 }, uScale: { value: 1 } },
    vertexShader: `attribute float alpha; attribute float size; varying float vA; uniform float uScale;
      void main(){ vA = alpha; vec4 mv = modelViewMatrix * vec4(position,1.); gl_PointSize = size * uScale * (560.0 / -mv.z); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform sampler2D uTex; uniform vec3 uColor; uniform float uAmount; varying float vA;
      void main(){ float a = texture2D(uTex, gl_PointCoord).a * vA * uAmount; if (a < 0.003) discard; gl_FragColor = vec4(uColor, a); }`,
  });
  const mist = new THREE.Points(mistGeo, mistMat);
  mist.frustumCulled = false;
  mist.renderOrder = 5;
  scene.add(mist);

  // ---------- state (driven from outside) ----------
  const state = { x: 0, y: 0, scale: 1, flip: 0, spin: 0, tiltX: 0, tiltY: 0, cap: 0, mist: 0 };
  const target = { ...state, spinSpeed: 0.22, visible: true };

  // ---------- color ----------
  const colorTo = new THREE.Color('#A5AE98');
  function setColor(hex) { colorTo.set(hex); }
  for (const m of ceramics) m.color.copy(colorTo);

  // ---------- sizing / loop ----------
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    mistMat.uniforms.uScale.value = h / 900;
  }
  resize();
  window.addEventListener('resize', resize);

  const halfWidthAtZero = () => Math.tan((camera.fov * Math.PI) / 360) * camera.position.z * camera.aspect;
  const clock = new THREE.Clock();
  let running = true;

  function updateMist(dt) {
    // emit from the end of the object that currently faces up
    const topY = flip.position.y + 1.02 * state.scale;
    const tilt = Math.abs(Math.sin(state.flip));
    for (let i = 0; i < MIST; i++) {
      const s = seeds[i];
      s.t += dt * 0.11 * s.sp;
      if (s.t > 1) { s.t -= 1; s.sx = Math.random() * 6.28; s.r = Math.random(); }
      const t = s.t;
      const rise = t * 1.5 * state.scale;
      const drift = Math.sin(s.sx + t * 2.4) * (0.05 + t * 0.28) * state.scale;
      mPos[i * 3] = flip.position.x + drift + (s.r - 0.5) * 0.22 * state.scale;
      mPos[i * 3 + 1] = topY + rise;
      mPos[i * 3 + 2] = Math.cos(s.sx + t * 2.1) * 0.25 * state.scale;
      mAlpha[i] = Math.pow(Math.sin(Math.PI * t), 1.5) * (1 - tilt) * 0.16;
      mSize[i] = (0.9 + t * 2.4) * state.scale;
    }
    mistGeo.attributes.position.needsUpdate = true;
    mistGeo.attributes.alpha.needsUpdate = true;
    mistGeo.attributes.size.needsUpdate = true;
    mistMat.uniforms.uAmount.value = state.mist;
  }

  function frame() {
    if (!running) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const k = 1 - Math.pow(0.0009, dt);     // damping
    for (const key of ['x', 'y', 'scale', 'flip', 'cap', 'mist', 'tiltX', 'tiltY']) state[key] += (target[key] - state[key]) * k;
    state.spin += dt * target.spinSpeed;

    flip.position.set(state.x * halfWidthAtZero(), state.y, 0);
    flip.scale.setScalar(state.scale);
    flip.rotation.set(state.tiltX, 0, state.flip + state.tiltY * 0.3);
    spin.rotation.y = state.spin;
    cap.position.y = state.cap * 0.26;
    cap.rotation.y = state.cap * 1.4;
    shadow.position.set(flip.position.x, state.y - 1.06 * state.scale, 0);
    shadow.scale.setScalar(state.scale * (1 - Math.abs(Math.sin(state.flip)) * 0.25));

    for (const m of ceramics) m.color.lerp(colorTo, k * 0.8);
    if (state.mist > 0.003 || target.mist > 0) updateMist(dt); else mistMat.uniforms.uAmount.value = 0;

    if (target.visible) renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  return {
    target,
    setColor,
    snap() { for (const key of ['x', 'y', 'scale', 'flip', 'cap', 'mist']) state[key] = target[key]; },
    stop() { running = false; },
  };
}

// ---------- procedural textures ----------

// tileable value noise on an integer lattice (wraps every `px` cells in x)
function makeNoise(px, py, seed) {
  const rnd = mulberry32(seed);
  const g = new Float32Array(px * (py + 1));
  for (let i = 0; i < g.length; i++) g[i] = rnd();
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const fx = x - xi, fy = y - yi;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const x0 = ((xi % px) + px) % px, x1 = (x0 + 1) % px;
    const y0 = Math.min(py, Math.max(0, yi)), y1 = Math.min(py, y0 + 1);
    const a = g[y0 * px + x0], b = g[y0 * px + x1], c = g[y1 * px + x0], d = g[y1 * px + x1];
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };
}
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// Matte stucco ceramic: fine grain + soft mottling + tiny pits and dark specks.
// UVs on the lathe: u = around (seam at back), v = along the profile (bottom → waist).
function makeCeramicTextures(withLogo) {
  const W = 2048, H = 1024;
  const SPAN_V = 0.95 - 0.338;                     // world units covered by v
  const unitsPerPxX = CIRC / W, unitsPerPxY = SPAN_V / H;
  const octaves = [
    { d: 260, a: 0.5, n: null }, { d: 110, a: 0.32, n: null }, { d: 16, a: 0.015, n: null },
  ];
  octaves.forEach((o, i) => { o.cx = Math.round(CIRC * o.d); o.n = makeNoise(o.cx, Math.ceil(SPAN_V * o.d) + 2, 11 + i * 7 + (withLogo ? 0 : 100)); });

  const bump = new Uint8ClampedArray(W * H * 4);
  const col = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) {
    const wy = (H - 1 - y) * unitsPerPxY;            // canvas y is flipped vs v
    for (let x = 0; x < W; x++) {
      const wx = x * unitsPerPxX;
      let h = 0;
      for (const o of octaves) h += (o.n(wx * o.d * (o.cx / (CIRC * o.d)), wy * o.d) - 0.5) * o.a;
      const mott = octaves[2].n(wx * octaves[2].cx / CIRC, wy * 16) - 0.5;
      const i = (y * W + x) * 4;
      const hv = 150 + h * 70;
      bump[i] = bump[i + 1] = bump[i + 2] = hv; bump[i + 3] = 255;
      const cv = 236 + mott * 6 + h * 5;
      col[i] = col[i + 1] = col[i + 2] = cv; col[i + 3] = 255;
    }
  }
  const bumpC = document.createElement('canvas'); bumpC.width = W; bumpC.height = H;
  const colC = document.createElement('canvas'); colC.width = W; colC.height = H;
  const bg = bumpC.getContext('2d'), cg = colC.getContext('2d');
  bg.putImageData(new ImageData(bump, W, H), 0, 0);
  cg.putImageData(new ImageData(col, W, H), 0, 0);

  // pits (depressions) and fine dark specks; drawn with vertical squash so they stay round on the surface
  const sq = unitsPerPxX / unitsPerPxY;            // >1 : a world circle is taller in pixels
  const rnd = mulberry32(withLogo ? 5 : 9);
  for (let i = 0; i < 1800; i++) {
    const x = rnd() * W, y = rnd() * H, r = 0.5 + rnd() * rnd() * 1.6;
    bg.fillStyle = `rgba(60,60,60,${0.18 + rnd() * 0.25})`;
    bg.beginPath(); bg.ellipse(x, y, r, r * sq, 0, 0, 6.283); bg.fill();
    if (rnd() < 0.5) { cg.fillStyle = `rgba(70,66,58,${0.2 + rnd() * 0.3})`; cg.beginPath(); cg.ellipse(x, y, r * 0.7, r * 0.7 * sq, 0, 0, 6.283); cg.fill(); }
  }

  if (withLogo) {
    // engraved wordmark at the front (u = 0.5), ~ y = -0.83 on the lower cup
    const v = (-0.83 + 0.95) / SPAN_V;               // fraction along v
    const cx = W * 0.5, cy = (1 - v) * H;
    const capH = 0.058;                              // letter height in world units
    for (const [ctx, style, blur] of [[bg, 'rgba(20,20,20,0.95)', 1.2], [cg, 'rgba(60,60,55,0.28)', 0.6]]) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(1, sq);
      ctx.filter = `blur(${blur}px)`;
      ctx.fillStyle = style;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `400 ${Math.round((capH / unitsPerPxX) * 1.38)}px "Cormorant Garamond", "Times New Roman", serif`;
      if ('letterSpacing' in ctx) ctx.letterSpacing = `${Math.round((capH / unitsPerPxX) * 0.16)}px`;
      ctx.fillText('PAUZE', 0, 0);
      ctx.restore();
    }
  }

  const map = new THREE.CanvasTexture(colC); map.colorSpace = THREE.SRGBColorSpace; map.wrapS = THREE.RepeatWrapping;
  const bumpT = new THREE.CanvasTexture(bumpC); bumpT.wrapS = THREE.RepeatWrapping;
  return { map, bump: bumpT };
}

// circumferential brushing: fine lines that run around the ring (vary along v)
function makeBrushedTexture() {
  const W = 64, H = 1024;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  const rnd = mulberry32(3);
  for (let y = 0; y < H; y++) {
    const v = 150 + (rnd() - 0.5) * 70 + (rnd() < 0.04 ? 45 : 0);
    g.fillStyle = `rgb(${v},${v},${v})`;
    g.fillRect(0, y, W, 1);
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function makeMistTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,255,255,0.9)'); grd.addColorStop(0.4, 'rgba(255,255,255,0.35)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

function makeShadowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(128, 128, 10, 128, 128, 128);
  grd.addColorStop(0, 'rgba(60,50,35,0.55)'); grd.addColorStop(0.35, 'rgba(60,50,35,0.25)'); grd.addColorStop(1, 'rgba(60,50,35,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}
