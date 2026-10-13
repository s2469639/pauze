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

export function createScene(canvas, opts = {}) {
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
    color: '#c9ad80', metalness: 1, roughness: 0.36, roughnessMap: brushed, bumpMap: brushed, bumpScale: 0.25,
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
  const proc = new THREE.Group();     // procedural fallback model
  spin.add(proc);

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
  proc.add(lathe(cupProfile(), ceramicLow));
  const upper = lathe(cupProfile(), ceramicUp);
  upper.rotation.set(Math.PI, 0, 0);            // mirrored top cup (logo only on the lower one)
  proc.add(upper);
  proc.add(ring(0.662, -1.0, -0.948));            // base
  proc.add(ring(0.532, -0.345, -0.298, 0.008));   // lower collar
  proc.add(ring(0.532, 0.298, 0.345, 0.008));     // upper collar

  // cap: brass rim + recessed ceramic disk (lifts during "prepare")
  const cap = new THREE.Group();
  cap.add(ring(0.662, 0.948, 1.0));
  const disk = lathe([[0, 0.993], [0.58, 0.993], [0.6, 0.999]], ceramicCap);
  cap.add(disk);
  proc.add(cap);

  // oil port on top of the upper cup, revealed when the cap lifts
  const port = new THREE.Mesh(new THREE.CircleGeometry(0.075, 48), new THREE.MeshStandardMaterial({ color: '#2b2924', roughness: 0.6 }));
  port.rotation.x = -Math.PI / 2; port.position.y = 0.9515;
  const portRim = new THREE.Mesh(new THREE.TorusGeometry(0.083, 0.012, 16, 64), new THREE.MeshStandardMaterial({ color: '#c9cbcc', metalness: 1, roughness: 0.3 }));
  portRim.rotation.x = Math.PI / 2; portRim.position.y = 0.952;
  proc.add(port, portRim);

  // glass (empty, frosted)
  const gpts = [];
  for (let i = 0; i <= 80; i++) { const y = -BULB + (2 * BULB * i) / 80; gpts.push([glassR(y), y]); }
  const glassMesh = lathe(gpts, glassOuter, 128); glassMesh.renderOrder = 3;
  const hazeMesh = lathe(gpts.map(([x, y]) => [Math.max(0.004, x - 0.012), y]), glassInner, 96); hazeMesh.renderOrder = 2;
  proc.add(hazeMesh, glassMesh);
  const floorMat = new THREE.MeshStandardMaterial({ color: '#ddd8cf', roughness: 0.9 });
  for (const sgn of [-1, 1]) {
    const f = new THREE.Mesh(new THREE.CircleGeometry(glassR(BULB) + 0.01, 96), floorMat);
    f.rotation.x = sgn < 0 ? -Math.PI / 2 : Math.PI / 2;
    f.position.y = sgn * (BULB - 0.003);
    proc.add(f);
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

  // ---------- textured GLB model (preferred) ----------
  let capObj = cap;
  const tintUniform = { value: new THREE.Color('#A5AE98') };
  if (opts.gltf) {
    proc.visible = false;
    capObj = attachModel(opts.gltf);
  }

  function attachModel(gltf) {
    let src = null;
    gltf.scene.traverse((o) => { if (o.isMesh && !src) src = o; });
    const geo = src.geometry.index ? src.geometry.toNonIndexed() : src.geometry.clone();
    const mat = src.material.clone();
    mat.side = THREE.FrontSide;
    for (const t of [mat.map, mat.normalMap, mat.metalnessMap, mat.roughnessMap]) if (t) t.anisotropy = maxAniso;
    // recolor only the sage ceramic texels; brass and glass keep their baked colour
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uTint = tintUniform;
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vObj;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvObj = position;');
      sh.fragmentShader = 'uniform vec3 uTint;\nvarying vec3 vObj;\n' + SURFACE_GLSL + sh.fragmentShader
        .replace('void main() {', BUMP_GLSL + '\nvoid main() {')
        .replace('#include <map_fragment>', `#include <map_fragment>
        float pzSage = 0.0, pzBrass = 0.0;
        {
          vec3 lin = diffuseColor.rgb;
          vec3 sc = pow(max(lin, vec3(0.0)), vec3(1.0 / 2.2));
          float warm = sc.r - sc.b;
          float lum = dot(sc, vec3(0.299, 0.587, 0.114));
          pzSage = (1.0 - smoothstep(0.09, 0.16, warm)) * (1.0 - smoothstep(0.62, 0.70, lum)) * smoothstep(0.015, 0.05, sc.g - sc.b);
          pzBrass = smoothstep(0.1, 0.17, warm);
          vec3 refLin = vec3(0.376, 0.423, 0.314);   // #A5AE98 → reproduces the baked texture
          vec3 recol = uTint * clamp(lin / refLin, 0.0, 2.0);
          // speckles: tiny darker flecks in the glaze
          float fleck = smoothstep(0.86, 0.95, vnoise(vObj * 210.0)) * 0.22;
          recol *= 1.0 - fleck;
          diffuseColor.rgb = mix(lin, recol, pzSage);
        }`)
        .replace('#include <metalnessmap_fragment>', `#include <metalnessmap_fragment>
        metalnessFactor = mix(metalnessFactor, 0.0, pzSage);
        roughnessFactor = mix(roughnessFactor, 0.86 + 0.08 * vnoise(vObj * 40.0), pzSage);
        metalnessFactor = mix(metalnessFactor, 1.0, pzBrass);
        roughnessFactor = mix(roughnessFactor, 0.3, pzBrass);`)
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        {
          // stucco relief: fine grain + soft mottling + sparse pinholes (ceramic); fine horizontal brushing (brass)
          float hS = ceramicHeight(vObj) * pzSage;
          float hB = brushedHeight(vObj) * pzBrass;
          normal = bumpPerturb(normal, hS * 0.0016 + hB * 0.00012, faceDirection);
        }`);
    };
    mat.customProgramCacheKey = () => 'pauze-surface-v2';

    // drop the baked cap (rebuilt below so it can open) and the opaque waist (replaced by real glass)
    const CUT = 0.885, GLASS = 0.286;
    const pos = geo.attributes.position;
    const keep = [[], []];
    for (let t = 0; t < pos.count; t += 3) {
      const cy = (pos.getY(t) + pos.getY(t + 1) + pos.getY(t + 2)) / 3;
      if (cy > CUT || Math.abs(cy) < GLASS) continue;
      keep[0].push(t);
    }
    const sub = (tris) => {
      const g = new THREE.BufferGeometry();
      for (const name of Object.keys(geo.attributes)) {
        const at = geo.attributes[name], n = at.itemSize;
        const arr = new at.array.constructor(tris.length * 3 * n);
        tris.forEach((t, k) => { for (let v = 0; v < 3; v++) for (let c = 0; c < n; c++) arr[(k * 3 + v) * n + c] = at.array[(t + v) * n + c]; });
        g.setAttribute(name, new THREE.BufferAttribute(arr, n));
      }
      return g;
    };
    const body = new THREE.Mesh(sub(keep[0]), mat);
    const model = new THREE.Group();
    model.add(body);

    // frosted glass waist, following the scanned profile
    const prof = [[0, 0.098], [0.04, 0.113], [0.08, 0.135], [0.12, 0.162], [0.16, 0.19], [0.2, 0.218], [0.24, 0.25], [0.28, 0.282], [0.3, 0.298]];
    const gpts = [];
    for (let i = prof.length - 1; i >= 0; i--) gpts.push(new THREE.Vector2(prof[i][1], -prof[i][0]));
    for (let i = 1; i < prof.length; i++) gpts.push(new THREE.Vector2(prof[i][1], prof[i][0]));
    const glassGeo = new THREE.LatheGeometry(gpts, 128);
    // glass = 4 passes: inner wall (back faces), milky frost haze, thickness-tinted body, additive reflections
    const fresnelVS = 'varying vec3 vN; varying vec3 vV; varying vec3 vP; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); vP = position; gl_Position = projectionMatrix*mv; }';
    const glassBack = new THREE.Mesh(glassGeo, new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.BackSide, vertexShader: fresnelVS,
      fragmentShader: 'varying vec3 vN; varying vec3 vV; void main(){ float f = 1.-abs(dot(normalize(vN),normalize(vV))); gl_FragColor = vec4(vec3(0.86,0.87,0.84), 0.10 + 0.35*pow(f,1.5)); }',
    }));
    const haze = new THREE.Mesh(glassGeo.clone().scale(0.985, 1, 0.985), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.FrontSide, vertexShader: fresnelVS,
      fragmentShader: 'varying vec3 vN; varying vec3 vV; varying vec3 vP; ' + SURFACE_GLSL + ' void main(){ float f = 1.-abs(dot(normalize(vN),normalize(vV))); float g = vnoise(vP*90.)*0.06; gl_FragColor = vec4(vec3(0.96,0.955,0.94), 0.12 + g + 0.28*pow(f,2.0)); }',
    }));
    // glass edge: light passes through more glass at grazing angles -> greyish-green thickness band + bright rim
    const glassBody = new THREE.Mesh(glassGeo, new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.FrontSide, vertexShader: fresnelVS,
      fragmentShader: 'varying vec3 vN; varying vec3 vV; void main(){ float d = abs(dot(normalize(vN),normalize(vV))); float edge = smoothstep(0.45, 0.05, d); float rim = smoothstep(0.12, 0.0, d); vec3 c = mix(vec3(0.88,0.90,0.87), vec3(1.0), rim*0.8); gl_FragColor = vec4(c, edge*0.32 + rim*0.3); }',
    }));
    // reflections: physically-shaded black glass, added on top so highlights stay at full strength
    const glassFront = new THREE.Mesh(glassGeo, new THREE.MeshPhysicalMaterial({
      color: '#000000', roughness: 0.16, metalness: 0,
      specularIntensity: 0.9, envMapIntensity: 0.45, transparent: true, depthWrite: false,
      // add light only: keep destination alpha so the (transparent) canvas does not turn opaque
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
      blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
    }));
    glassBody.renderOrder = 4;
    glassBack.renderOrder = 2; haze.renderOrder = 3; glassFront.renderOrder = 5;
    // the cups' inner floors seen through the glass
    const floorMat = new THREE.MeshStandardMaterial({ color: '#A5AE98', roughness: 0.92 });
    ceramics.push(floorMat);
    for (const sg of [-1, 1]) {
      const f = new THREE.Mesh(new THREE.CircleGeometry(0.3, 96), floorMat);
      f.rotation.x = sg < 0 ? -Math.PI / 2 : Math.PI / 2; f.position.y = sg * 0.297;
      model.add(f);
    }
    model.add(glassBack, haze, glassBody, glassFront);
    // brass collars hide the seam where the glass meets the ceramic cups
    for (const sg of [-1, 1]) {
      const y0 = sg > 0 ? 0.272 : -0.312, y1 = sg > 0 ? 0.312 : -0.272;
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.312, 0.312, y1 - y0, 128, 1, true), brass);
      col.position.y = (y0 + y1) / 2;
      model.add(col);
    }

    // solid cap: brushed brass ring + recessed ceramic disc (as in the reference photos)
    const capGroup = new THREE.Group();
    const R0 = 0.415, h0 = CUT - 0.002, h1 = 0.95, e = 0.008;
    const ringPts = [[0.36, h0], [R0 - e, h0], [R0, h0 + e], [R0, h1 - e], [R0 - e, h1], [0.372, h1], [0.366, h1 - 0.012]].map(([x, y]) => new THREE.Vector2(x, y));
    capGroup.add(new THREE.Mesh(new THREE.LatheGeometry(ringPts, 128), brass));
    const discMat = new THREE.MeshStandardMaterial({ color: '#A5AE98', roughness: 0.9, map: upperTex.map, bumpMap: upperTex.bump, bumpScale: 0.5 });
    ceramics.push(discMat);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.368, 0.368, 0.05, 96), discMat);
    disc.position.y = h1 - 0.012 - 0.025;
    capGroup.add(disc);
    model.add(capGroup);

    // revealed when the cap lifts: recessed ceramic top with a silver refill port
    const topMat = new THREE.MeshStandardMaterial({ color: '#A5AE98', roughness: 0.9, map: upperTex.map, bumpMap: upperTex.bump, bumpScale: 0.5 });
    ceramics.push(topMat);
    const top = new THREE.Mesh(new THREE.CircleGeometry(0.404, 96), topMat);
    top.rotation.x = -Math.PI / 2; top.position.y = CUT - 0.004;
    const hole = new THREE.Mesh(new THREE.CircleGeometry(0.05, 48), new THREE.MeshStandardMaterial({ color: '#2b2924', roughness: 0.6 }));
    hole.rotation.x = -Math.PI / 2; hole.position.y = CUT - 0.002;
    const grommet = new THREE.Mesh(new THREE.TorusGeometry(0.056, 0.01, 16, 64), new THREE.MeshStandardMaterial({ color: '#c9cbcc', metalness: 1, roughness: 0.3 }));
    grommet.rotation.x = Math.PI / 2; grommet.position.y = CUT - 0.001;
    model.add(top, hole, grommet);

    // normalise to the same footprint as the procedural model (height -1..1)
    const s = 2 / 1.9;
    model.scale.setScalar(s);
    model.rotation.y = opts.modelYaw || 0;
    spin.add(model);
    return capGroup;
  }

  // ---------- state (driven from outside) ----------
  const state = { x: 0, y: 0, scale: 1, flip: 0, spin: 0, tiltX: 0, tiltY: 0, cap: 0, mist: 0 };
  const target = { ...state, spinSpeed: 0.22, visible: true };

  // ---------- color ----------
  const colorTo = new THREE.Color('#A5AE98');
  const colorToLin = new THREE.Color();
  function setColor(hex) { colorTo.set(hex); colorToLin.set(hex); }
  for (const m of ceramics) m.color.copy(colorTo);
  colorToLin.set('#A5AE98'); tintUniform.value.copy(colorToLin);

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
      const rise = t * 0.75 * state.scale;
      const drift = Math.sin(s.sx + t * 2.4) * (0.05 + t * 0.28) * state.scale;
      mPos[i * 3] = flip.position.x + drift + (s.r - 0.5) * 0.22 * state.scale;
      mPos[i * 3 + 1] = topY + rise;
      mPos[i * 3 + 2] = Math.cos(s.sx + t * 2.1) * 0.25 * state.scale;
      mAlpha[i] = Math.pow(Math.sin(Math.PI * t), 1.5) * (1 - tilt) * 0.11;
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
    if (!window.__PAUZE_FREEZE) state.spin += dt * target.spinSpeed;

    flip.position.set(state.x * halfWidthAtZero(), state.y, 0);
    flip.scale.setScalar(state.scale);
    flip.rotation.set(state.tiltX, 0, state.flip + state.tiltY * 0.3);
    spin.rotation.y = state.spin;
    const c = state.cap;
    capObj.position.set(0, c * 0.2, -c * 0.05);
    capObj.rotation.set(-c * 0.32, 0, 0);
    shadow.position.set(flip.position.x, state.y - 1.06 * state.scale, 0);
    shadow.scale.setScalar(state.scale * (1 - Math.abs(Math.sin(state.flip)) * 0.25));

    for (const m of ceramics) m.color.lerp(colorTo, k * 0.8);
    tintUniform.value.lerp(colorToLin, k * 0.8);
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

// ---------- shared GLSL: noise + bump ----------
const SURFACE_GLSL = `
float h31(vec3 p){ p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419)); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vnoise(vec3 x){ vec3 i = floor(x), f = fract(x); f = f*f*(3.0-2.0*f);
  return mix(mix(mix(h31(i), h31(i+vec3(1,0,0)), f.x), mix(h31(i+vec3(0,1,0)), h31(i+vec3(1,1,0)), f.x), f.y),
             mix(mix(h31(i+vec3(0,0,1)), h31(i+vec3(1,0,1)), f.x), mix(h31(i+vec3(0,1,1)), h31(i+vec3(1,1,1)), f.x), f.y), f.z); }
float pits(vec3 p){ vec3 i = floor(p), f = fract(p); float d = 9.0;
  for (int x=-1;x<=1;x++) for (int y=-1;y<=1;y++) for (int z=-1;z<=1;z++){ vec3 o = vec3(x,y,z); vec3 c = i+o;
    float k = h31(c); if (k < 0.72) continue; vec3 r = o + vec3(h31(c+3.1), h31(c+7.7), h31(c+1.3)) - f; d = min(d, dot(r,r) * (1.6 - k)); }
  return smoothstep(0.035, 0.0, d); }
float ceramicHeight(vec3 p){
  float g = vnoise(p*260.0)*0.55 + vnoise(p*120.0)*0.35 + vnoise(p*30.0)*0.6;
  return g - pits(p*48.0)*1.6;
}
float brushedHeight(vec3 p){ return vnoise(vec3(p.y*900.0, atan(p.x, p.z)*4.0, 0.0)); }
`;
const BUMP_GLSL = `
vec3 bumpPerturb(vec3 n, float h, float fd){
  vec3 sx = dFdx(-vViewPosition), sy = dFdy(-vViewPosition);
  vec3 r1 = cross(sy, n), r2 = cross(n, sx); float det = dot(sx, r1) * fd;
  vec3 grad = sign(det) * (dFdx(h) * r1 + dFdy(h) * r2);
  return normalize(abs(det) * n - grad);
}
`;

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
