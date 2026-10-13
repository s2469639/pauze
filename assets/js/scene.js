// PAUZE — 3D hourglass built from the product proportions (H 125mm × Ø 82mm).
// Ceramic body, champagne brass rings, frosted glass and sand are separate
// materials so colors can be swapped live and the sand can flow after a flip.
import * as THREE from 'three';
import { RoomEnvironment } from './../vendor/RoomEnvironment.js';

const H = 1;                       // half height (object spans -1..1)
const R = 0.656;                   // outer radius (82 / 125 * H)
const NECK = 0.034;
const BULB = 0.30;                 // glass half height
const glassR = (y) => NECK + 0.455 * Math.pow(Math.min(Math.abs(y), BULB) / BULB, 1.3);

export function createScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.75;

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
  camera.position.set(0, 0.35, 7.4);
  camera.lookAt(0, 0, 0);

  const key = new THREE.DirectionalLight(0xfffaf4, 1.45);
  key.position.set(-3, 4, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 1.1);
  rim.position.set(4, 2, -3);
  scene.add(rim);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xa49c8c, 0.45));

  // ---------- materials ----------
  const noise = makeNoiseTexture();
  const ceramic = new THREE.MeshPhysicalMaterial({
    color: '#A5AE98', roughness: 0.88, metalness: 0, bumpMap: noise, bumpScale: 0.9,
  });
  const brass = new THREE.MeshStandardMaterial({ color: '#c9b089', metalness: 1, roughness: 0.38 });
  const glass = new THREE.MeshPhysicalMaterial({
    color: '#ffffff', roughness: 0.25, metalness: 0, transparent: true, opacity: 0.32,
    clearcoat: 1, clearcoatRoughness: 0.3, side: THREE.DoubleSide, depthWrite: false,
  });
  const frost = new THREE.MeshStandardMaterial({ color: '#f4f1ea', roughness: 1, transparent: true, opacity: 0.18, side: THREE.BackSide, depthWrite: false });
  const sandMat = new THREE.MeshStandardMaterial({ color: '#d8ccb3', roughness: 1, bumpMap: noise, bumpScale: 2, side: THREE.DoubleSide });
  const logoMat = new THREE.MeshStandardMaterial({ color: '#6f7764', roughness: 0.9, transparent: true, alphaMap: makeLogoTexture(), depthWrite: false });

  // ---------- geometry ----------
  const flip = new THREE.Group();     // rotates around Z for the flip
  const spin = new THREE.Group();     // idle rotation around Y
  flip.add(spin);
  scene.add(flip);

  const lathe = (pts, mat, seg = 96) => new THREE.Mesh(new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg), mat);
  const ring = (r, y0, y1, mat = brass) => lathe([[0, y0], [r - 0.008, y0], [r, y0 + 0.008], [r, y1 - 0.008], [r - 0.008, y1], [0, y1]], mat);

  // bottom body: straight wall that rounds in toward the waist
  const body = () => {
    const pts = [];
    pts.push([0, -0.948]);
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      const y = -0.948 + t * (0.948 - 0.342);
      const k = Math.max(0, (t - 0.42) / 0.58);
      const r = 0.645 - 0.118 * Math.pow(k, 1.9);
      pts.push([r, y]);
    }
    pts.push([0, -0.342]);
    return lathe(pts, ceramic);
  };
  spin.add(body());
  const topBody = body(); topBody.rotation.z = Math.PI; spin.add(topBody);
  spin.add(ring(0.664, -1.0, -0.948));            // base
  spin.add(ring(0.536, -0.342, -0.300));          // lower collar
  spin.add(ring(0.536, 0.300, 0.342));            // upper collar

  // cap: brass rim + inset ceramic disk (lifts during "prepare")
  const cap = new THREE.Group();
  cap.add(lathe([[0.585, 0.948], [0.664, 0.948], [0.664, 0.992], [0.656, 1.0], [0.592, 1.0], [0.585, 0.99]], brass));
  cap.add(lathe([[0, 0.982], [0.586, 0.982]], ceramic));
  spin.add(cap);

  // glass
  const gpts = [];
  for (let i = 0; i <= 60; i++) { const y = -BULB + (2 * BULB * i) / 60; gpts.push([glassR(y), y]); }
  const glassMesh = lathe(gpts, glass, 80); glassMesh.renderOrder = 3;
  const frostMesh = lathe(gpts.map(([x, y]) => [x * 0.985, y]), frost, 80); frostMesh.renderOrder = 2;
  spin.add(frostMesh, glassMesh);

  // logo on the lower front
  const logo = new THREE.Mesh(new THREE.CylinderGeometry(0.6465, 0.6465, 0.085, 48, 1, true, -0.36, 0.72), logoMat);
  logo.position.y = -0.83;
  spin.add(logo);

  // sand: one mesh per bulb, rebuilt as the amount changes
  const sandA = new THREE.Mesh(new THREE.BufferGeometry(), sandMat);   // local upper bulb (y>0)
  const sandB = new THREE.Mesh(new THREE.BufferGeometry(), sandMat);   // local lower bulb (y<0)
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 1, 8, 1, true), sandMat);
  spin.add(sandA, sandB, stream);

  // contact shadow (world space, does not flip)
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 2.8), new THREE.MeshBasicMaterial({ map: makeShadowTexture(), transparent: true, depthWrite: false, opacity: 0.55 }));
  shadow.rotation.x = -Math.PI / 2;
  scene.add(shadow);

  // ---------- state (driven from outside) ----------
  const state = { x: 0, y: 0, scale: 1, flip: 0, spin: 0, tiltX: 0, tiltY: 0, cap: 0, sand: 0, visible: true };
  const target = { ...state };
  let lastKey = '';

  function buildSand(mesh, side, amount, mode) {
    // side: +1 upper bulb, -1 lower bulb. mode 'pile' rests on the wide end, 'fill' rests on the neck.
    const key = side + mode + amount.toFixed(3);
    if (mesh.userData.key === key) return;
    mesh.userData.key = key;
    mesh.geometry.dispose();
    if (amount < 0.004) { mesh.geometry = new THREE.BufferGeometry(); return; }
    const pts = [];
    const inner = (y) => glassR(y) * 0.93;
    if (mode === 'pile') {
      const h = 0.03 + 0.17 * amount;
      const base = 0.292, rb = inner(base);
      pts.push([0, base]);
      for (let i = 0; i <= 18; i++) {
        const y = base - (h * i) / 18;
        const lin = rb * (1 - i / 18) * (1 + 0.25 * Math.sin((i / 18) * Math.PI));
        pts.push([Math.max(0.0005, Math.min(inner(y), lin)), y]);
      }
      pts.push([0, base - h]);
    } else {
      const d = 0.035 + 0.235 * amount;           // depth from neck toward the wide end
      pts.push([0, 0.004]);
      for (let i = 0; i <= 18; i++) { const y = 0.004 + (d * i) / 18; pts.push([inner(y), y]); }
      pts.push([inner(d) * 0.4, d - 0.012], [0, d - 0.02]);
    }
    // built for the upper bulb (y>0) oriented toward neck; mirror for the lower bulb
    const v = pts.map(([x, y]) => new THREE.Vector2(x, y * side));
    mesh.geometry = new THREE.LatheGeometry(v, 48);
  }

  const isFlipped = (a) => { a = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2); return a > Math.PI / 2 && a < (3 * Math.PI) / 2; };

  function updateSand() {
    // state.sand = share of sand in bulb A (local y>0). Gravity decides which bulb is on top.
    const p = state.sand;
    let topAmount, len;
    if (isFlipped(state.flip)) {
      buildSand(sandB, -1, 1 - p, 'fill');      // B on top, resting on the neck
      buildSand(sandA, 1, p, 'pile');           // A below, piling on its wide end
      topAmount = 1 - p;
      len = 0.292 - (0.03 + 0.17 * p);
      stream.position.y = len / 2;
    } else {
      buildSand(sandA, 1, p, 'fill');
      buildSand(sandB, -1, 1 - p, 'pile');
      topAmount = p;
      len = 0.292 - (0.03 + 0.17 * (1 - p));
      stream.position.y = -len / 2;
    }
    stream.visible = topAmount > 0.01 && topAmount < 0.99;
    stream.scale.y = Math.max(0.01, len);
  }

  // ---------- color ----------
  const colorTo = new THREE.Color('#A5AE98');
  const logoTo = new THREE.Color();
  function setColor(hex) { colorTo.set(hex); logoTo.copy(colorTo).multiplyScalar(0.62); }
  setColor('#A5AE98');
  ceramic.color.copy(colorTo); logoMat.color.copy(logoTo);

  // ---------- sizing / loop ----------
  let w = 1, h = 1;
  function resize() {
    w = canvas.clientWidth; h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  const halfWidthAtZero = () => Math.tan((camera.fov * Math.PI) / 360) * camera.position.z * camera.aspect;
  const clock = new THREE.Clock();
  let running = true;

  function frame() {
    if (!running) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const k = 1 - Math.pow(0.0009, dt);     // damping
    for (const key of ['x', 'y', 'scale', 'flip', 'cap', 'tiltX', 'tiltY']) state[key] += (target[key] - state[key]) * k;
    // sand only falls toward the lower bulb while the object is still turning
    let ds = (target.sand - state.sand) * k * 0.7;
    if (target.physical && Math.abs(target.flip - state.flip) > 0.3) {
      if (isFlipped(state.flip) ? ds < 0 : ds > 0) ds = 0;
    }
    state.sand += ds;
    state.spin += dt * target.spinSpeed;

    flip.position.set(state.x * halfWidthAtZero(), state.y, 0);
    flip.scale.setScalar(state.scale);
    flip.rotation.set(state.tiltX, 0, state.flip + state.tiltY * 0.3);
    spin.rotation.y = state.spin;
    cap.position.y = state.cap * 0.28;
    cap.rotation.y = state.cap * 1.4;
    shadow.position.set(flip.position.x, state.y - 1.06 * state.scale, 0);
    shadow.scale.setScalar(state.scale * (1 - Math.abs(Math.sin(state.flip)) * 0.25));

    ceramic.color.lerp(colorTo, k * 0.8);
    logoMat.color.lerp(logoTo, k * 0.8);
    updateSand();

    if (target.visible) renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  target.spinSpeed = 0.22;
  requestAnimationFrame(frame);

  return {
    target,
    setColor,
    snap() { Object.assign(state, { x: target.x, y: target.y, scale: target.scale, flip: target.flip, cap: target.cap, sand: target.sand }); },
    stop() { running = false; },
  };
}

// ---------- procedural textures ----------
function makeNoiseTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'); const img = g.createImageData(256, 256);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 128 + (Math.random() - 0.5) * 60 + (Math.random() < 0.004 ? -90 : 0);
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 3);
  return t;
}

function makeLogoTexture() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 120;
  const g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '400 92px "Cormorant Garamond", "Times New Roman", serif';
  if ('letterSpacing' in g) g.letterSpacing = '18px';
  g.fillText('PAUZE', c.width / 2, c.height / 2 + 4);
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 8;
  return t;
}

function makeShadowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(128, 128, 10, 128, 128, 128);
  grd.addColorStop(0, 'rgba(60,50,35,0.55)'); grd.addColorStop(0.35, 'rgba(60,50,35,0.25)'); grd.addColorStop(1, 'rgba(60,50,35,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}
