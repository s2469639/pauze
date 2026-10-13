/* PAUZE — page choreography */
import { createScene } from './scene.js';

const { COLORS, SCENTS, PRODUCTS, won, off, product, color, scent, cart } = window.PAUZE;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const range = (v, a, b) => clamp((v - a) / (b - a));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = () => innerWidth < 860;
const TAU = Math.PI * 2;

gsap.registerPlugin(ScrollTrigger);

/* ---------- smooth scroll ---------- */
let lenis = null;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
}
const scrollTo = (target, opts = {}) => (lenis ? lenis.scrollTo(target, { duration: 1.6, ...opts }) : (typeof target === 'number' ? scrollTo_(target) : $(target)?.scrollIntoView()));
const scrollTo_ = (y) => window.scrollTo({ top: y });
$$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const id = a.getAttribute('href');
  if (id.length < 2 || !$(id)) return;
  e.preventDefault();
  scrollTo(id === '#top' ? 0 : id);
}));

/* ---------- text splitting ---------- */
$$('.split').forEach((el) => {
  el.innerHTML = el.innerHTML.split(/<br\s*\/?>/i).map((l) => `<span class="line"><span>${l}</span></span>`).join('');
});
$$('.scrub-words').forEach((el) => {
  el.innerHTML = el.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(' ');
});

/* ---------- colors UI ---------- */
const colorList = $('.color-list');
colorList.innerHTML = COLORS.map((c, i) => `
  <li><button type="button" role="radio" aria-checked="${i === 0}" data-i="${i}" class="${i === 0 ? 'on' : ''}">
    <i style="--c:${c.hex}"></i><span class="cn">${c.name}</span><span class="cm">${c.mood}</span><span class="ch">${c.hex}</span>
  </button></li>`).join('');
$('.spec-colors').innerHTML = COLORS.map((c) => `<span><i style="--c:${c.hex}"></i>${c.name} <small>${c.hex} · ${c.mood}</small></span>`).join('');

/* ---------- 3D stage ---------- */
const canvas = $('#stage');
let stage = null;
let zones = $$('.stage-zone');
let colorIdx = 0;

function setColorIdx(i) {
  if (i === colorIdx && stage) return;
  colorIdx = i;
  const c = COLORS[i];
  stage?.setColor(c.hex);
  $$('.color-list button').forEach((b, j) => { b.classList.toggle('on', j === i); b.setAttribute('aria-checked', j === i); });
  const big = $('.color-big');
  big.textContent = c.name;
  gsap.fromTo(big, { yPercent: 30, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.9, ease: 'expo.out' });
  if (activeZone === 'colors') document.body.style.setProperty('--stage-bg', c.bg);
}

$$('.color-list button').forEach((b) => b.addEventListener('click', () => {
  const sec = $('#colors');
  const i = +b.dataset.i;
  const y = sec.offsetTop + (sec.offsetHeight - innerHeight) * ((i + 0.5) / COLORS.length);
  lenis ? lenis.scrollTo(y, { duration: 1.2 }) : window.scrollTo({ top: y, behavior: 'smooth' });
  setColorIdx(i);
}));

let activeZone = 'hero';
const mouse = { x: 0, y: 0 };
addEventListener('pointermove', (e) => { mouse.x = e.clientX / innerWidth - 0.5; mouse.y = e.clientY / innerHeight - 0.5; });

function progressOf(el) {
  const r = el.getBoundingClientRect();
  return clamp(-r.top / Math.max(1, r.height - innerHeight));
}

function updateStage() {
  if (!stage) return;
  const t = stage.target;
  const vh = innerHeight;
  const m = isMobile();

  // which 3D zone owns the viewport centre?
  let visible = false;
  let current = null;
  for (const z of zones) {
    const r = z.getBoundingClientRect();
    if (r.bottom > 0 && r.top < vh) visible = true;
    if (r.top <= vh * 0.55 && r.bottom >= vh * 0.45) current = z.dataset.zone;
  }
  t.visible = visible;
  if (current && current !== activeZone) {
    activeZone = current;
    document.body.style.setProperty('--stage-bg', current === 'colors' ? COLORS[colorIdx].bg : '');
  }

  t.tiltX = mouse.y * 0.12;
  t.tiltY = -mouse.x * 0.25;

  if (activeZone === 'hero') {
    const hp = progressOf($('.hero'));
    Object.assign(t, { x: 0, y: m ? 0.5 + hp * 0.6 : -0.02 + hp * 0.6, scale: (m ? 0.6 : 1) * (1 + hp * 0.12), flip: 0, cap: 0, mist: 0.35, spinSpeed: 0.28 });
  } else if (activeZone === 'ritual') {
    const f = progressOf($('#ritual'));
    const capT = range(f, 0.04, 0.14) - range(f, 0.17, 0.25);
    const flipT = ease(range(f, 0.26, 0.42));
    const mistT = range(f, 0.44, 0.52) - range(f, 0.88, 0.97);
    Object.assign(t, {
      x: m ? 0 : 0.3, y: m ? 0.22 : 0, scale: m ? 0.56 : 1.05,
      cap: ease(capT), flip: flipT * Math.PI, mist: mistT, spinSpeed: 0.08,
    });
    const step = f < 0.2 ? 0 : f < 0.44 ? 1 : f < 0.86 ? 2 : 3;
    $$('.ritual-steps li').forEach((li, i) => li.classList.toggle('on', i === step));
    $('.ritual-progress i').style.transform = `scaleY(${f})`;
  } else if (activeZone === 'colors') {
    const c = progressOf($('#colors'));
    setColorIdx(Math.min(COLORS.length - 1, Math.floor(c * COLORS.length)));
    Object.assign(t, { x: m ? 0 : -0.42, y: m ? 0.62 : -0.05, scale: m ? 0.46 : 1.05, flip: TAU, cap: 0, mist: 0, spinSpeed: 0.18 });
  }
}

/* ---------- craft horizontal scroll ---------- */
const craft = $('.craft');
const track = $('.craft-track');
function sizeCraft() {
  const dist = Math.max(0, track.scrollWidth - innerWidth);
  craft.style.height = `${dist + innerHeight}px`;
}
function updateCraft() {
  const dist = track.scrollWidth - innerWidth;
  const p = progressOf(craft);
  track.style.transform = `translate3d(${-p * dist}px,0,0)`;
  $$('.craft-card img', track).forEach((img) => {
    const r = img.parentElement.getBoundingClientRect();
    const k = (r.left + r.width / 2) / innerWidth - 0.5;
    img.style.transform = `translate3d(${k * -6}%,0,0) scale(1.14)`;
  });
}

/* ---------- reveals ---------- */
function setupReveals() {
  $$('.split').forEach((el) => {
    gsap.from($$('.line > span', el), { yPercent: 110, duration: 1.3, ease: 'expo.out', stagger: 0.09, scrollTrigger: { trigger: el, start: 'top 85%' } });
  });
  $$('.scrub-words').forEach((el) => {
    gsap.fromTo($$('.w', el), { opacity: 0.12 }, { opacity: 1, stagger: 0.05, ease: 'none', scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true } });
  });
  $$('.problem-tags li').forEach((li, i) => gsap.from(li, { y: 30, opacity: 0, duration: 1, delay: i * 0.12, ease: 'expo.out', scrollTrigger: { trigger: li, start: 'top 92%' } }));
  $$('.fade-up').forEach((el) => gsap.from(el, { y: 40, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%' } }));
  $$('.reveal-clip').forEach((el) => {
    gsap.fromTo(el, { clipPath: 'inset(18% 18% 18% 18% round 400px 400px 24px 24px)' }, { clipPath: 'inset(0% 0% 0% 0% round 400px 400px 24px 24px)', ease: 'none', scrollTrigger: { trigger: el, start: 'top 90%', end: 'top 25%', scrub: true } });
    gsap.fromTo($('img', el), { scale: 1.25 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top 90%', end: 'bottom top', scrub: true } });
  });
  $$('.spec-table > div').forEach((el, i) => gsap.from(el, { opacity: 0, x: 30, duration: 1, delay: i * 0.08, ease: 'expo.out', scrollTrigger: { trigger: '.spec-table', start: 'top 80%' } }));
  gsap.fromTo('.spec-dim path', { strokeDashoffset: 600, strokeDasharray: 600 }, { strokeDashoffset: 0, duration: 2.4, ease: 'power2.inOut', stagger: 0.15, scrollTrigger: { trigger: '.spec-dim', start: 'top 80%' } });
  $$('.moment').forEach((el, i, all) => {
    if (i === all.length - 1) return;
    gsap.fromTo(el, { scale: 1, filter: 'brightness(1)' }, { scale: 0.92, filter: 'brightness(0.82)', ease: 'none', scrollTrigger: { trigger: all[i + 1], start: 'top bottom', end: 'top 15%', scrub: true } });
  });
  $$('.shop-card').forEach((el, i) => gsap.from(el, { y: 80, opacity: 0, duration: 1.3, delay: i * 0.12, ease: 'expo.out', scrollTrigger: { trigger: '.shop-grid', start: 'top 85%' } }));
  gsap.fromTo('.closing-img img', { scale: 1.3 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.closing-img', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.fromTo('.footer-mark', { yPercent: 40 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });
  // hero exit
  gsap.to('.hero-word span', { yPercent: -40, opacity: 0.2, stagger: 0.03, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to(['.hero-left', '.hero-right', '.scroll-cue'], { y: -80, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: '10% top', end: '60% top', scrub: true } });
}

/* ---------- nav hide on scroll ---------- */
let lastY = 0;
function updateNav(y) {
  const nav = $('.nav');
  nav.classList.toggle('scrolled', y > 40);
  if (y < 200) { nav.classList.remove('hidden'); lastY = y; return; }
  if (y - lastY > 40) { nav.classList.add('hidden'); lastY = y; }
  else if (lastY - y > 40) { nav.classList.remove('hidden'); lastY = y; }
}

/* ---------- shop ---------- */
function renderShop() {
  const grid = $('[data-shop]');
  grid.innerHTML = PRODUCTS.map((p) => {
    const visual = p.id === 'oil'
      ? `<img src="${SCENTS[0].img}" alt="${p.name} ${SCENTS[0].name}" class="oil-img" data-shop-oil>`
      : `<img src="${COLORS[0].img}" alt="${p.name} ${COLORS[0].name}" data-shop-img>${p.id === 'starter' ? `<img src="${SCENTS[0].img}" alt="" class="oil-img" data-shop-oil>` : ''}`;
    return `
    <article class="shop-card${p.badge ? ' featured' : ''}" data-id="${p.id}" data-color="${COLORS[0].key}" data-scent="${SCENTS[0].key}">
      ${p.badge ? `<span class="badge">${p.badge}</span>` : ''}
      <a class="shop-visual ${p.id}" href="product.html?id=${p.id}" aria-label="${p.name} 상세 보기">${visual}<span class="view">자세히 보기</span></a>
      <div class="shop-info">
        <p class="shop-en">${p.en}</p>
        <h3><a href="product.html?id=${p.id}">${p.name}</a></h3>
        <p class="shop-desc">${p.desc}</p>
        <div class="price">
          ${p.sale < p.price ? `<span class="off">${off(p)}%</span><s>${won(p.price)}</s>` : ''}
          <b>${won(p.sale)}</b>
        </div>
        ${p.hasColor ? `<div class="dots" role="radiogroup" aria-label="컬러">${COLORS.map((c, i) => `<button type="button" role="radio" aria-checked="${i === 0}" aria-label="${c.name}" data-color="${c.key}" class="${i === 0 ? 'on' : ''}" style="--c:${c.hex}"></button>`).join('')}<span class="dot-name">${COLORS[0].name}</span></div>` : ''}
        ${p.hasScent ? `<label class="scent-pick"><span>향</span><select data-scent-select>${SCENTS.map((sc) => `<option value="${sc.key}">${sc.name}</option>`).join('')}</select></label>` : ''}
        <div class="buy-row">
          <div class="qty"><button type="button" data-q="-1" aria-label="수량 줄이기">−</button><span data-qty>1</span><button type="button" data-q="1" aria-label="수량 늘리기">+</button></div>
          <button type="button" class="btn btn-sm" data-add>장바구니</button>
          <button type="button" class="btn btn-sm btn-dark" data-buy>바로 구매</button>
        </div>
      </div>
    </article>`;
  }).join('');

  const swap = (img, src, alt) => gsap.to(img, { opacity: 0, duration: 0.2, onComplete: () => { img.src = src; img.alt = alt; gsap.to(img, { opacity: 1, duration: 0.4 }); } });
  $$('.shop-card', grid).forEach((card) => {
    const p = product(card.dataset.id);
    let qty = 1;
    $$('.dots button', card).forEach((d) => d.addEventListener('click', () => {
      card.dataset.color = d.dataset.color;
      const c = color(d.dataset.color);
      $$('.dots button', card).forEach((x) => { x.classList.toggle('on', x === d); x.setAttribute('aria-checked', x === d); });
      $('.dot-name', card).textContent = c.name;
      const img = $('[data-shop-img]', card);
      if (img) swap(img, c.img, `${p.name} ${c.name}`);
    }));
    const sel = $('[data-scent-select]', card);
    if (sel) sel.addEventListener('change', () => {
      card.dataset.scent = sel.value;
      const img = $('[data-shop-oil]', card);
      if (img) swap(img, scent(sel.value).img, scent(sel.value).name);
    });
    $$('[data-q]', card).forEach((b) => b.addEventListener('click', () => { qty = clamp(qty + +b.dataset.q, 1, 9); $('[data-qty]', card).textContent = qty; }));
    $('[data-add]', card).addEventListener('click', () => {
      cart.add(p.id, card.dataset.color, qty, card.dataset.scent);
      const it = { color: p.hasColor ? card.dataset.color : null, scent: p.hasScent ? card.dataset.scent : null };
      ui.toast(`${p.name} · ${window.PAUZE.itemLabel(it)} — 장바구니에 담았어요`);
      ui.open();
    });
    $('[data-buy]', card).addEventListener('click', () => { cart.add(p.id, card.dataset.color, qty, card.dataset.scent); location.href = 'checkout.html'; });
  });
}

/* ---------- cart drawer (shared) ---------- */
const ui = window.PAUZE.ui;
ui.mount({ onOpen: () => lenis?.stop(), onClose: () => lenis?.start() });

/* ---------- cursor + magnetic ---------- */
if (matchMedia('(pointer:fine)').matches && !reduced) {
  const cur = $('.cursor');
  const pos = { x: innerWidth / 2, y: innerHeight / 2 }, sm = { ...pos };
  addEventListener('pointermove', (e) => { pos.x = e.clientX; pos.y = e.clientY; });
  gsap.ticker.add(() => { sm.x += (pos.x - sm.x) * 0.2; sm.y += (pos.y - sm.y) * 0.2; cur.style.transform = `translate3d(${sm.x}px,${sm.y}px,0)`; });
  document.addEventListener('pointerover', (e) => cur.classList.toggle('hover', !!e.target.closest('a,button,summary,[role=radio]')));
  $$('.magnetic').forEach((el) => {
    el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(); gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.3, y: (e.clientY - r.top - r.height / 2) * 0.4, duration: 0.5, ease: 'power3.out' }); });
    el.addEventListener('pointerleave', () => gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1,.4)' }));
  });
} else {
  $('.cursor').remove();
}

/* ---------- loop ---------- */
function tick() {
  updateStage();
  updateCraft();
  updateNav(scrollY);
  requestAnimationFrame(tick);
}

/* ---------- boot ---------- */
async function boot() {
  renderShop();
  sizeCraft();
  addEventListener('resize', () => { sizeCraft(); ScrollTrigger.refresh(); });

  const bar = $('.loader-bar i');
  gsap.to(bar, { scaleX: 0.6, duration: 1.2, ease: 'power2.out' });
  gsap.from('.loader-word span', { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.07 });

  try { await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]); } catch (e) {}
  try { stage = createScene(canvas); stage.setColor(COLORS[0].hex); } catch (e) { console.warn('3D unavailable', e); document.body.classList.add('no-3d'); }
  await new Promise((r) => setTimeout(r, reduced ? 0 : 700));

  setupReveals();
  requestAnimationFrame(tick);
  updateStage(); stage?.snap();

  const tl = gsap.timeline({ onComplete: () => { $('.loader').remove(); } });
  tl.to(bar, { scaleX: 1, duration: 0.5, ease: 'power2.inOut' })
    .to('.loader-word span', { yPercent: -110, duration: 0.8, ease: 'expo.in', stagger: 0.04 }, '<0.2')
    .to('.loader', { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'expo.inOut' }, '-=0.2')
    .add(() => { document.body.classList.remove('is-loading'); lenis?.start(); }, '-=0.6')
    .from('.hero-word span', { yPercent: 100, opacity: 0, duration: 1.6, ease: 'expo.out', stagger: 0.08 }, '-=0.7')
    .from(canvas, { opacity: 0, y: 60, duration: 1.6, ease: 'expo.out' }, '<0.1')
    .from(['.hero-left > *', '.hero-right > *', '.nav', '.scroll-cue'], { y: 30, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08, clearProps: 'transform,opacity' }, '<0.3');
  if (reduced) tl.progress(1);
}
boot();
