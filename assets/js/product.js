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
    if (p.id === 'starter') return [{ viewer: true },
      photo('assets/img/poster.webp', 'PAUZE 센트글라스 스타터 세트'), photo('assets/img/box-open.webp', '스타터 세트 개봉 모습'), photo('assets/img/gift-ribbon.webp', '리본으로 포장한 기프트 박스'),
      cut(c.img, c.name, c.bg), cut(s.img, s.name, '#F1ECE2'), photo('assets/img/starter-set.webp', '스타터 세트 구성')
    ];
    return [{ viewer: true },
      cut(c.img, c.name, c.bg), photo('assets/img/life-flip.webp', '손으로 뒤집는 모습'), photo('assets/img/step-oil.webp', '오일을 넣는 모습'),
      photo('assets/img/detail-logo-macro.webp', '음각 로고 클로즈업'), photo('assets/img/detail-brass-macro.webp', '세라믹과 브라스 클로즈업'),
      photo('assets/img/detail-glass-macro.webp', '유리 챔버 클로즈업'), photo('assets/img/package.webp', '전용 패키지')
    ];
  }
  function renderGallery(keepSlide) {
    var list = slides();
    if (!keepSlide) state.slide = 0;
    $('[data-track]').innerHTML = list.map(function (s, i) {
      if (s.viewer) return '<figure class="g-slide viewer" data-viewer-slot aria-hidden="' + (i !== state.slide) + '"></figure>';
      return '<figure class="g-slide' + (s.cut ? ' cut' : '') + '" style="' + (s.tint ? '--tint:' + s.tint : '') + '" aria-hidden="' + (i !== state.slide) + '"><img src="' + s.src + '" alt="' + s.alt + '"' + (i ? ' loading="lazy"' : '') + '></figure>';
    }).join('');
    $('[data-thumbs]').innerHTML = list.map(function (s, i) {
      if (s.viewer) return '<button type="button" role="tab" aria-selected="' + (i === state.slide) + '" class="v3d" data-slide="' + i + '" aria-label="3D 뷰어"><span>3D</span></button>';
      return '<button type="button" role="tab" aria-selected="' + (i === state.slide) + '" class="' + (s.cut ? 'cut' : '') + '" style="' + (s.tint ? '--tint:' + s.tint : '') + '" data-slide="' + i + '"><img src="' + s.src + '" alt=""></button>';
    }).join('');
    $$('[data-slide]').forEach(function (b) { b.onclick = function () { go(+b.dataset.slide); }; });
    var slot = $('[data-viewer-slot]');
    if (slot) { slot.appendChild(viewerEl()); if (viewer) viewer.setColor(P.color(state.color).hex); }
    go(state.slide, true);
  }

  /* ---------- 3D viewer (lazy-loaded) ---------- */
  var viewer = null, vEl = null;
  function viewerEl() {
    if (vEl) return vEl;
    vEl = document.createElement('div');
    vEl.className = 'viewer3d is-loading';
    vEl.innerHTML = '<canvas aria-label="센트글라스 3D 모델 — 드래그해서 돌려보세요"></canvas>' +
      '<p class="v-load">3D 모델 불러오는 중…</p>' +
      '<div class="v-ui" role="group" aria-label="3D 보기">' +
      '<button type="button" data-v="flip">뒤집기</button><button type="button" data-v="oil">오일 넣기</button><button type="button" data-v="explode">분해도</button></div>' +
      '<p class="v-hint">← 드래그해서 돌려보세요 →</p>';
    var load = function (src) { return new Promise(function (res, rej) { var s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.body.appendChild(s); }); };
    var start = function () {
      load('assets/model/scentglass.glb.js').then(function () { return load('assets/js/viewer.bundle.js'); })
        .then(function () { return window.PAUZE_VIEWER.mount($('canvas', vEl), { color: P.color(state.color).hex }); })
        .then(function (v) { viewer = v; vEl.classList.remove('is-loading'); v.resize(); })
        .catch(function () { vEl.classList.add('failed'); });
    };
    if (document.readyState === 'complete') setTimeout(start, 50); else addEventListener('load', start);
    var on = { flip: false, oil: false, explode: false };
    $$('[data-v]', vEl).forEach(function (b) {
      b.onclick = function () {
        if (!viewer) return;
        var k = b.dataset.v;
        if (k === 'flip') { if (on.explode) on.explode = viewer.explode(false); if (on.oil) on.oil = viewer.oil(false); on.flip = viewer.flip(); }
        else if (k === 'oil') { if (on.explode) on.explode = viewer.explode(false); if (on.flip) on.flip = viewer.flip(); on.oil = viewer.oil(!on.oil); }
        else { if (on.oil) on.oil = viewer.oil(false); if (on.flip) on.flip = viewer.flip(); on.explode = viewer.explode(!on.explode); }
        $$('[data-v]', vEl).forEach(function (x) { x.classList.toggle('on', on[x.dataset.v]); });
        b.blur();
      };
    });
    addEventListener('resize', function () { if (viewer) viewer.resize(); });
    return vEl;
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
  $$('[data-color]').forEach(function (b) { b.onclick = function () { state.color = b.dataset.color; track('select_option', { option: 'color', value: state.color }); renderOptions(); renderGallery(true); if (viewer) viewer.setColor(P.color(state.color).hex); }; });
  $$('[data-scent]').forEach(function (b) {
    b.onclick = function () {
      state.scent = b.dataset.scent; renderOptions();
      // jump to the bottle image for that scent
      var list = slides(); renderGallery(true);
      for (var i = 0; i < list.length; i++) if (list[i].src === P.scent(state.scent).img) { go(i); break; }
    };
  });
  $$('[data-q]').forEach(function (b) { b.onclick = function () { state.qty = Math.min(9, Math.max(1, state.qty + +b.dataset.q)); renderOptions(); }; });

  function add() { cart.add(p.id, state.color, state.qty, state.scent); track('add_to_cart'); }
  $('[data-add]').onclick = function () {
    add();
    var label = P.itemLabel({ color: p.hasColor ? state.color : null, scent: p.hasScent ? state.scent : null });
    P.ui.toast(p.name + (label ? ' · ' + label : '') + ' — 장바구니에 담았어요');
    P.ui.open();
  };
  /* ---------- 구매 CTA → 런칭 전 사전 알림 모달 ----------
   * 실서비스 전환 시 교체 지점:
   *   direct   → add() 후 checkout.html (자사몰 PG 결제)
   *   npay*    → 네이버페이 주문형 API: 서버에서 주문서(상품 id·옵션·수량·가격) 생성 → 네이버페이 결제창 리다이렉트
   *              → 결제 완료 콜백(returnUrl)에서 자사몰 주문 동기화
   * 지금은 결제 대신 모달을 띄우고, 같은 주문 정보를 사전 알림 신청 데이터로 수집한다. */
  $$('[data-buy]').forEach(function (b) { b.onclick = function () { openPrelaunch(b.dataset.cta || 'direct'); }; });
  var pl = $('#prelaunch'), plForm = $('form', pl);
  function selection() {
    var label = P.itemLabel({ color: p.hasColor ? state.color : null, scent: p.hasScent ? state.scent : null });
    return { label: label, img: P.itemImg({ color: p.hasColor ? state.color : null, scent: p.hasScent ? state.scent : null }) };
  }
  function openPrelaunch(source) {
    var sel = selection();
    $('[data-pl-img]', pl).src = sel.img;
    $('[data-pl-name]', pl).textContent = p.name;
    $('[data-pl-opt]', pl).textContent = (sel.label ? sel.label + ' · ' : '') + state.qty + '\u00a0개';
    $('[data-pl-price]', pl).textContent = won(p.sale * state.qty);
    plForm.product.value = p.id; plForm.option.value = sel.label; plForm.qty.value = state.qty; plForm.source.value = source;
    $('.pl-form-view', pl).hidden = false; $('.pl-done-view', pl).hidden = true; $('.pl-err', pl).textContent = '';
    pl.hidden = false; requestAnimationFrame(function () { pl.classList.add('open'); });
    document.body.style.overflow = 'hidden';
    track(source.indexOf('npay') === 0 ? 'npay_click' : 'begin_checkout', { source: source });
    setTimeout(function () { plForm.name.focus(); }, 300);
  }
  function closePrelaunch() { pl.classList.remove('open'); document.body.style.overflow = ''; setTimeout(function () { pl.hidden = true; }, 350); }
  pl.addEventListener('click', function (e) { if (e.target === pl || e.target.closest('[data-pl-close]')) closePrelaunch(); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pl.hidden) closePrelaunch(); });
  plForm.phone.addEventListener('input', function () {
    var d = this.value.replace(/\D/g, '').slice(0, 11);
    this.value = d.length > 7 ? d.replace(/(\d{3})(\d{4})(\d+)/, '$1-$2-$3') : d.length > 3 ? d.replace(/(\d{3})(\d+)/, '$1-$2') : d;
  });
  plForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var err = !plForm.name.value.trim() ? '이름을 입력해 주세요.' : !/^01\d-\d{3,4}-\d{4}$/.test(plForm.phone.value) ? '휴대폰 번호를 확인해 주세요.' : !plForm.agree.checked ? '개인정보 수집·이용에 동의해 주세요.' : '';
    $('.pl-err', pl).textContent = err;
    if (err) return;
    var data = new FormData(plForm);
    // Netlify Forms 수집 (배포 환경). 로컬/file:// 에서는 실패해도 브라우저에 기록하고 완료 화면을 보여준다.
    fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(data).toString() }).catch(function () {});
    try { var l = JSON.parse(localStorage.getItem('pauze_prelaunch') || '[]'); l.push({ product: p.id, option: plForm.option.value, qty: +plForm.qty.value, source: plForm.source.value, channel: plForm.channel.value, at: Date.now() }); localStorage.setItem('pauze_prelaunch', JSON.stringify(l)); } catch (x) {}
    track('prelaunch_signup', { source: plForm.source.value, channel: plForm.channel.value });
    $('[data-pl-done]', pl).textContent = plForm.name.value.trim() + '님, ' + p.name + (plForm.option.value ? ' (' + plForm.option.value + ')' : '') + ' 판매가 시작되면 ' + (plForm.channel.value === 'kakao' ? '카카오 알림톡' : '문자') + '으로 가장 먼저 알려드릴게요.';
    $('.pl-form-view', pl).hidden = true; $('.pl-done-view', pl).hidden = false;
    plForm.reset();
  });

  /* ---------- 전환 퍼널 측정 (GA4 / 네이버 프리미엄 로그분석 공통 dataLayer) ----------
   * view_item → select_option → add_to_cart | begin_checkout | npay_click → prelaunch_signup
   * N Pay 클릭 비중이 높으면 런칭 시 네이버페이 버튼을 1순위 CTA 로 올리는 근거가 된다. */
  function track(event, params) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: event, item_id: 'PZ-' + p.id.toUpperCase(), item_name: p.name, price: p.sale, quantity: state.qty,
      item_variant: P.itemLabel({ color: p.hasColor ? state.color : null, scent: p.hasScent ? state.scent : null }) }, params || {}));
  }
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

  /* ---------- reviews ---------- */
  (function () {
    var RV = P.reviews; if (!RV) return;
    var st = RV.stats(p.id);
    $('[data-bb-stars]').innerHTML = RV.stars(st.avg) + ' ' + st.avg.toFixed(1) + ' · 리뷰 ' + st.count + '개';
    $('[data-tab-count]').textContent = st.count;
    $('[data-pdp-score]').innerHTML = '<b>' + st.avg.toFixed(1) + '</b>' + RV.stars(st.avg, 'lg') + '<small>리뷰 ' + st.count + '개</small>';
    $('[data-pdp-score]').href = $('[data-pdp-more]').href = 'reviews.html?product=' + p.id;
    var l = RV.list(p.id).slice().sort(function (a, b) { return (b.photos.length ? 1 : 0) - (a.photos.length ? 1 : 0) || b.helpful - a.helpful; }).slice(0, 4);
    $('[data-pdp-reviews]').innerHTML = l.map(function (r) { return RV.card(r); }).join('');
    RV.bind($('[data-pdp-reviews]'));
  })();

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

  /* ---------- SEO: 상품별 메타 + 구조화 데이터 ----------
   * 네이버 EP 와 동일한 원천(P.naverEp)에서 title/description/JSON-LD 를 만든다 → 검색 노출 정보와 피드 정보 일치.
   * (실서비스에서는 상품별 정적 URL + SSR 로 HTML 에 직접 렌더링해 크롤러 호환성을 높인다.) */
  (function seo() {
    var ep = P.naverEp(p.id), st = P.reviews ? P.reviews.stats(p.id) : null;
    document.title = ep.title + ' | PAUZE';
    var meta = function (attr, key, val) { var m = document.querySelector('meta[' + attr + '="' + key + '"]'); if (!m) { m = document.createElement('meta'); m.setAttribute(attr, key); document.head.appendChild(m); } m.setAttribute('content', val); };
    var desc = p.desc + ' · ' + ep.search_tag.split('|').slice(0, 5).join(', ');
    meta('name', 'description', desc);
    meta('name', 'keywords', ep.search_tag.split('|').join(','));
    meta('property', 'og:title', ep.title);
    meta('property', 'og:description', desc);
    meta('property', 'og:type', 'product');
    meta('property', 'product:price:amount', String(p.sale));
    meta('property', 'product:price:currency', 'KRW');
    var canon = document.querySelector('link[rel=canonical]') || document.head.appendChild(Object.assign(document.createElement('link'), { rel: 'canonical' }));
    canon.href = ep.link;
    var ld = {
      '@context': 'https://schema.org', '@type': 'Product', sku: ep.id, name: ep.title, brand: { '@type': 'Brand', name: ep.brand },
      image: [ep.image_link], description: p.desc, category: [ep.category_name1, ep.category_name2, ep.category_name3, ep.category_name4].join(' > '),
      offers: { '@type': 'Offer', price: p.sale, priceCurrency: 'KRW', availability: 'https://schema.org/PreOrder', url: ep.link },
    };
    if (p.hasColor) ld.color = P.COLORS.map(function (c) { return c.name; }).join(', ');
    if (st && st.count) ld.aggregateRating = { '@type': 'AggregateRating', ratingValue: st.avg.toFixed(1), reviewCount: st.count };
    var tag = document.createElement('script'); tag.type = 'application/ld+json'; tag.textContent = JSON.stringify(ld); document.head.appendChild(tag);
  })();
  track('view_item');

  renderOptions();
  renderGallery();
  onScroll();
  if (location.hash) { var t = $(location.hash); if (t) setTimeout(function () { t.scrollIntoView(); }, 50); }
})();
