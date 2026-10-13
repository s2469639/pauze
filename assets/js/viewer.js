/* PAUZE — interactive 3D viewer for the product page (drag to turn, flip, exploded view) */
import { createScene } from './scene.js';
import { GLTFLoader } from '../vendor/loaders/GLTFLoader.js';

function parseModel() {
  const b64 = window.PAUZE_GLB;
  if (!b64) return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const bin = atob(b64), buf = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
      new GLTFLoader().parse(buf.buffer, '', resolve, () => resolve(null));
    } catch (e) { resolve(null); }
  });
}

async function mount(canvas, { color = '#A5AE98' } = {}) {
  const gltf = await parseModel();
  const stage = createScene(canvas, { gltf, modelYaw: 20 * Math.PI / 180 });
  const t = stage.target;
  Object.assign(t, { x: 0, y: -0.02, scale: 1.0, flip: 0, cap: 0, mist: 0, explode: 0, spinSpeed: 0.18 });
  stage.setColor(color);
  stage.snap();

  // drag to turn (pointer), with inertia; stop the gallery swipe from stealing the gesture
  let down = false, lastX = 0, vel = 0, idle = 0;
  canvas.style.touchAction = 'pan-y';
  canvas.addEventListener('pointerdown', (e) => { down = true; lastX = e.clientX; vel = 0; t.spinSpeed = 0; canvas.setPointerCapture(e.pointerId); e.stopPropagation(); });
  canvas.addEventListener('pointermove', (e) => { if (!down) return; const dx = e.clientX - lastX; lastX = e.clientX; vel = dx * 0.012; stage.addSpin(vel); });
  const up = () => { down = false; idle = performance.now(); };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  ['touchstart', 'touchend'].forEach((ev) => canvas.addEventListener(ev, (e) => e.stopPropagation(), { passive: true }));
  (function coast() {
    if (!down && Math.abs(vel) > 0.0005) { stage.addSpin(vel); vel *= 0.94; }
    if (!down && performance.now() - idle > 2500 && !t.explode) t.spinSpeed = 0.18;
    requestAnimationFrame(coast);
  })();

  let flipped = false;
  return {
    setColor: (hex) => stage.setColor(hex),
    resize: () => stage.resize(),
    flip() { flipped = !flipped; t.flip = flipped ? Math.PI : 0; t.mist = flipped ? 0.3 : 0; return flipped; },
    explode(on) { t.explode = on ? 1 : 0; t.scale = on ? 0.6 : 1.0; t.y = on ? -0.3 : -0.02; if (on) { flipped = false; t.flip = 0; t.mist = 0; t.spinSpeed = 0.08; } return on; },
    oil(on) { t.cap = on ? 1 : 0; t.oil = on; t.tiltX = on ? 0.42 : 0; t.scale = on ? 0.92 : 1.0; t.y = on ? -0.32 : -0.02; t.spinSpeed = on ? 0.02 : 0.18; return on; },
  };
}

window.PAUZE_VIEWER = { mount };
