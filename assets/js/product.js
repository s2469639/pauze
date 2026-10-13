/* PAUZE — product detail page (product.html?id=object|starter|oil) */
(function () {
  var P = window.PAUZE, cart = P.cart, won = P.won;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var id = new URLSearchParams(location.search).get('id');
  var p = P.product(id) || P.product('object');
  var params = new URLSearchParams(location.search);
  var state = {
    color: P.color(params.get('color')) ? params.get('color') : P.COLORS[0].key,
    scent: P.scent(params.get('scent')) ? params.get('scent') : P.SCENTS[0].key,
    qty: 1, slide: 0
  };

  P.ui.mount();
  document.title = p.name + ' — PAUZE';
  $$('[data-nav]').forEach(function (a) { a.classList.toggle('on', a.dataset.nav === p.id); });

  // show only the detail sections meant for this product
  $$('[data-for]').forEach(function (el) { el.hidden = el.dataset.for.split(' ').indexOf(p.id) < 0; });

  /* ---------- gallery ---------- */
  function slides() {
    var c = P.color(state.color), s = P.scent(state.scent);
    var cut = function (src, alt, tint) { return { src: src, alt: alt, cut: true, tint: tint }; };
    var photo = function (src, alt) { return { src: src, alt: alt }; };
    if (p.id === 'oil') return [
      cut(s.img, s.name, '#F1ECE2')].concat(s.mood ? [photo(s.mood, s.name + ' 무드')] : []).concat([
      photo('assets/img/oil-macro.webp', '브러시드 브라스 드로퍼 클로즈업'), photo('assets/img/oils-lineup.webp', '시그니처 오일 4종'),
      photo('assets/img/life-hands.webp', '오일과 함께 쓰는 센트글라스')
    ]);
    if (p.id === 'starter') return [
      photo('assets/img/poster.webp', 'PAUZE 센트글라스 스타터 세트'), photo('assets/img/box-open.webp', '스타터 세트 개봉 모습'), photo('assets/img/gift-ribbon.webp', '리본으로 포장한 기프트 박스'),
      cut(c.img, c.name, c.bg), cut(s.img, s.name, '#F1ECE2'), photo('assets/img/starter-set.webp', '스타터 세트 구성')
    ];
    return [
      cut(c.img, c.name, c.bg), photo('assets/img/life-flip.webp', '손으로 뒤집는 모습'), photo('assets/img/step-oil.webp', '오일을 넣는 모습'),
      photo('assets/img/detail-logo-macro.webp', '음각 로고 클로즈업'), photo('assets/img/detail-brass-macro.webp', '세라믹과 브라스 클로즈업'),
      photo('assets/img/detail-glass-macro.webp', '유리 챔버 클로즈업'), photo('assets/img/package.webp', '전용 패키지')
    ];
  }
  function renderGallery(keepSlide) {
    var list = slides();
    if (!keepSlide) state.slide = 0;
    $('[data-track]').innerHTML = list.map(function (s, i) {
      return '<figure class="g-slide' + (s.cut ? ' cut' : '') + '" style="' + (s.tint ? '--tint:' + s.tint : '') + '" aria-hidden="' + (i !== state.slide) + '"><img src="' + s.src + '" alt="' + s.alt + '"' + (i ? ' loading="lazy"' : '') + '></figure>';
    }).join('');
    $('[data-thumbs]').innerHTML = list.map(function (s, i) {
      return '<button type="button" role="tab" aria-selected="' + (i === state.slide) + '" class="' + (s.cut ? 'cut' : '') + '" style="' + (s.tint ? '--tint:' + s.tint : '') + '" data-slide="' + i + '"><img src="' + s.src + '" alt=""></button>';
    }).join('');
    $$('[data-slide]').forEach(function (b) { b.onclick = function () { go(+b.dataset.slide); }; });
    go(state.slide, true);
  }
  function go(i, instant) {
    var n = $$('.g-slide').length;
    state.slide = (i + n) % n;
    var track = $('[data-track]');
    track.style.transition = instant ? 'none' : '';
    track.style.transform = 'translate3d(' + (-100 * state.slide) + '%,0,0)';
    $$('.g-slide').forEach(function (s, j) { s.setAttribute('aria-hidden', j !== state.slide); });
    $$('[data-slide]').forEach(function (b, j) { b.setAttribute('aria-selected', j === state.slide); });
  }
  // swipe on touch
  (function () {
    var main = $('.g-main'), x0 = null;
    main.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    main.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) go(state.slide + (dx < 0 ? 1 : -1));
    });
    addEventListener('keydown', function (e) {
      if (document.activeElement && /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) return;
      if (e.key === 'ArrowRight') go(state.slide + 1);
      if (e.key === 'ArrowLeft') go(state.slide - 1);
    });
  })();

  /* ---------- buy box ---------- */
  $('[data-crumb]').textContent = p.name;
  $('[data-en]').textContent = p.en;
  $('[data-name]').textContent = p.name;
  $('[data-desc]').textContent = p.desc;
  $('[data-includes]').textContent = p.includes.join(' · ');
  $('[data-price]').innerHTML = p.sale < p.price
    ? '<span class="off">' + P.off(p) + '%</span><s>' + won(p.price) + '</s><b>' + won(p.sale) + '</b>'
    : '<b>' + won(p.sale) + '</b>';
  $('[data-benefit]').textContent = p.sale < p.price ? '런칭 기념 15% 혜택가 · ' + won(p.price - p.sale) + ' 할인' : '스타터 세트로 구매하면 센트글라스와 함께 받아볼 수 있어요.';

  $('[data-opt-color]').hidden = !p.hasColor;
  $('[data-opt-scent]').hidden = !p.hasScent;
  $('[data-colors]').innerHTML = P.COLORS.map(function (c) {
    return '<button type="button" role="radio" data-color="' + c.key + '" style="--c:' + c.hex + '" aria-label="' + c.name + '"><i></i></button>';
  }).join('');
  $('[data-scents]').innerHTML = P.SCENTS.map(function (s) {
    return '<button type="button" role="radio" data-scent="' + s.key + '" style="--band:' + s.band + '"><i></i>' + s.name + (s.badge ? '<small>추천</small>' : '') + '</button>';
  }).join('');

  function renderOptions() {
    var c = P.color(state.color), s = P.scent(state.scent);
    $$('[data-color]').forEach(function (b) { var on = b.dataset.color === state.color; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
    $$('[data-scent]').forEach(function (b) { var on = b.dataset.scent === state.scent; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
    $('[data-color-name]').textContent = c.name + ' · ' + c.mood;
    $('[data-scent-name]').textContent = s.kr;
    $('[data-scent-line]').innerHTML = '<b>' + s.notes.join(' · ') + '</b>' + s.feel.join(', ');
    $('[data-qty]').textContent = state.qty;
    var total = won(p.sale * state.qty);
    $('[data-total]').textContent = total;
    $('[data-bar-total]').textContent = total;
    var label = P.itemLabel({ color: p.hasColor ? state.color : null, scent: p.hasScent ? state.scent : null });
    $('[data-bar-name]').textContent = p.name + (label ? ' · ' + label : '');
    // keep the URL shareable
    var q = new URLSearchParams({ id: p.id });
    if (p.hasColor) q.set('color', state.color);
    if (p.hasScent) q.set('scent', state.scent);
    try { history.replaceState(null, '', '?' + q.toString() + location.hash); } catch (e) { /* file:// */ }
  }
  $$('[data-color]').forEach(function (b) { b.onclick = function () { state.color = b.dataset.color; renderOptions(); renderGallery(); }; });
  $$('[data-scent]').forEach(function (b) {
    b.onclick = function () {
      state.scent = b.dataset.scent; renderOptions();
      // jump to the bottle image for that scent
      var list = slides(); renderGallery(true);
      for (var i = 0; i < list.length; i++) if (list[i].src === P.scent(state.scent).img) { go(i); break; }
    };
  });
  $$('[data-q]').forEach(function (b) { b.onclick = function () { state.qty = Math.min(9, Math.max(1, state.qty + +b.dataset.q)); renderOptions(); }; });

  function add() { cart.add(p.id, state.color, state.qty, state.scent); }
  $('[data-add]').onclick = function () {
    add();
    var label = P.itemLabel({ color: p.hasColor ? state.color : null, scent: p.hasScent ? state.scent : null });
    P.ui.toast(p.name + (label ? ' · ' + label : '') + ' — 장바구니에 담았어요');
    P.ui.open();
  };
  $('[data-buy]').onclick = function () { add(); location.href = 'checkout.html'; };
  $('[data-bar-buy]').onclick = function () { $('#buy').scrollIntoView({ behavior: 'smooth', block: 'start' }); };

  /* ---------- detail content ---------- */
  $('[data-color-row]').innerHTML = P.COLORS.map(function (c) {
    return '<a href="?id=' + p.id + '&color=' + c.key + '#buy" style="--tint:' + c.bg + '"><img src="' + c.img + '" alt="' + c.name + '" loading="lazy"><b>' + c.name + '</b><span>' + c.hex + ' · ' + c.mood + '</span></a>';
  }).join('');
  $('[data-scent-grid]').innerHTML = P.SCENTS.map(function (s) {
    var media = s.mood
      ? '<figure class="sc-media mood"><img src="' + s.mood + '" alt="' + s.name + ' 무드" loading="lazy"></figure>'
      : '<figure class="sc-media"><img src="' + s.img + '" alt="' + s.name + '" loading="lazy"></figure>';
    return '<div class="scent-card" style="--band:' + s.band + '">' + media + '<div class="sc-body">' + (s.badge ? '<em class="sc-badge">' + s.badge + ' · 시그니처 추천</em>' : '') + '<b>' + s.name + '</b><span>' + s.kr + '</span>' +
      '<p class="sc-notes">' + s.notes.join(' · ') + '</p><p>' + s.desc + '</p>' +
      '<ul class="sc-feel">' + s.feel.map(function (f) { return '<li>' + f + '</li>'; }).join('') + '</ul></div></div>';
  }).join('');
  if (p.id === 'starter') {
    $('[data-package-img]').src = 'assets/img/box-open.webp';
    $('[data-package-title]').innerHTML = '열면, 센트글라스와<br>오일이 나란히.';
    $('[data-package-copy]').textContent = '한지 질감 기프트 박스 안에 센트글라스와 시그니처 오일 10ml, 사용 안내 카드를 함께 담았어요. 처음 시작하는 향기 루틴으로, 혹은 소중한 사람에게 건네는 선물로.';
  }

  var spec = {
    object: [['제품명', '센트글라스 (Scentglass)'], ['크기', '높이 125mm × 최대 지름 82mm (허리 약 Ø32mm)'], ['주입구', 'Ø14mm 센터 오일 주입구'], ['소재', '무광 세라믹 질감, 반투명 프로스트 유리 챔버, 브러시드 샴페인 브라스'], ['방식', '전원 없이 사용하는 아날로그 루틴 오브제'], ['컬러', P.COLORS.map(function (c) { return c.name; }).join(' · ')], ['구성', p.includes.join(', ')]],
    starter: [['크기', '센트글라스 높이 125mm × 지름 82mm · 오일 10ml'], ['소재', '무광 세라믹 질감, 반투명 유리 챔버, 매트 샴페인 브라스'], ['방식', '무전원 아날로그 (플립형 루틴 오브제)'], ['컬러', P.COLORS.map(function (c) { return c.name; }).join(' · ')], ['향', P.SCENTS.map(function (s) { return s.name; }).join(' · ')], ['구성', p.includes.join(', ')]],
    oil: [['용량', '10ml'], ['향', P.SCENTS.map(function (s) { return s.name; }).join(' · ')], ['용기', '프로스트 유리 드로퍼 보틀, 브러시드 브라스 캡'], ['사용', 'PAUZE 오브제 전용 시그니처 오일'], ['보관', '직사광선을 피해 서늘한 곳에 보관']]
  }[p.id];
  $('[data-spec]').innerHTML = spec.map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>'; }).join('');

  $('[data-related]').innerHTML = P.PRODUCTS.filter(function (x) { return x.id !== p.id; }).map(function (x) {
    var img = x.id === 'oil' ? P.SCENTS[0].img : x.id === 'starter' ? 'assets/img/starter-set.webp' : P.COLORS[0].img;
    return '<a class="rel" href="product.html?id=' + x.id + '"><div class="rel-img' + (x.id === 'starter' ? ' photo' : '') + '"><img src="' + img + '" alt="" loading="lazy"></div><p class="shop-en">' + x.en + '</p><b>' + x.name + '</b><span>' +
      (x.sale < x.price ? '<em>' + P.off(x) + '%</em> ' : '') + won(x.sale) + '</span></a>';
  }).join('');

  /* ---------- tabs (scroll spy) + mobile bar ---------- */
  var tabs = $$('.pdp-tabs a');
  var secs = tabs.map(function (a) { return $(a.getAttribute('href')); });
  function onScroll() {
    var y = scrollY + 140, cur = 0;
    secs.forEach(function (s, i) { if (s.offsetTop <= y) cur = i; });
    tabs.forEach(function (a, i) { a.classList.toggle('on', i === cur); });
    var bb = $('.buybox').getBoundingClientRect();
    document.body.classList.toggle('show-bar', bb.bottom < 0);
  }
  addEventListener('scroll', onScroll, { passive: true });

  /* ---------- reveal ---------- */
  if (window.gsap && window.ScrollTrigger && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.from('.gallery, .buybox > *', { y: 30, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.04, clearProps: 'transform,opacity' });
    $$('.detail section:not([hidden]) h3, .detail section:not([hidden]) .eyebrow, .d-problems li, .d-steps li, .d-mat-grid figure, .d-color-row a, .scent-card, .d-life-grid figure, .d-points li').forEach(function (el) {
      gsap.from(el, { y: 40, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%' } });
    });
    $$('.d-hero:not([hidden]) img, .d-arch img, .d-photo img, .d-gift-img img').forEach(function (img) {
      gsap.fromTo(img, { scale: 1.15 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  }

  renderOptions();
  renderGallery();
  onScroll();
  if (location.hash) { var t = $(location.hash); if (t) setTimeout(function () { t.scrollIntoView(); }, 50); }
})();
