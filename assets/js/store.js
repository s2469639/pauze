/* PAUZE — product data + cart (shared by index.html and checkout.html) */
(function () {
  var COLORS = [
    { key: 'sage',    name: 'Misty Sage',    hex: '#A5AE98', mood: '시그니처 그린', bg: '#E6E8DE', img: 'assets/img/color-sage.webp' },
    { key: 'oatmeal', name: 'Oatmeal Beige', hex: '#C8B8A4', mood: '데일리 내추럴', bg: '#EFE7DB', img: 'assets/img/color-oatmeal.webp' },
    { key: 'stone',   name: 'Stone Gray',    hex: '#777C73', mood: '모던 아키텍처', bg: '#DEDFDA', img: 'assets/img/color-stone.webp' },
    { key: 'rose',    name: 'Dusty Rose',    hex: '#B98F8C', mood: '감성 포인트',   bg: '#EFE2DE', img: 'assets/img/color-rose.webp' }
  ];

  // 시그니처 오일 4종 (노트 설명은 콘셉트 카피 — 확정 시 수정)
  var SCENTS = [
    { key: 'greentea', name: 'Green Tea & Cedar',   kr: '그린티 & 시더',     band: '#A5AE98', img: 'assets/img/oil-greentea.webp', mood: 'assets/img/scent-greentea.webp',
      line: '맑은 녹차 잎과 차분한 시더우드. 집중을 시작하는 아침에.', notes: ['녹차 잎 · 베르가못', '재스민 티', '시더우드'] },
    { key: 'whitetea', name: 'White Tea & Neroli',  kr: '화이트티 & 네롤리', band: '#E3D3B4', img: 'assets/img/oil-whitetea.webp', mood: 'assets/img/scent-whitetea.webp',
      line: '부드러운 백차와 네롤리의 은은한 꽃향. 가벼운 오후에.', notes: ['네롤리 · 레몬 블라썸', '화이트티', '소프트 머스크'] },
    { key: 'fig',      name: 'Fig & Soft Woods',    kr: '피그 & 소프트우드', band: '#8A8660', img: 'assets/img/oil-fig.webp',
      line: '무화과의 싱그러운 단맛과 포근한 나무 향. 책을 펼치는 시간에.', notes: ['무화과 잎', '무화과', '샌달우드 · 캐시미어우드'] },
    { key: 'lavender', name: 'Lavender & Linen',    kr: '라벤더 & 린넨',     band: '#A9A3AE', img: 'assets/img/oil-lavender.webp',
      line: '깨끗한 린넨과 라벤더. 하루를 마무리하는 저녁에.', notes: ['라벤더', '코튼 플라워', '화이트 머스크'] }
  ];

  // 런칭 혜택가 = 정가의 정확히 85% (15% OFF)
  var PRODUCTS = [
    { id: 'object',  name: '센트글라스',       en: 'Scentglass',    desc: '센트글라스 본체 (컬러 택1) + 전용 패키지',          price: 68000, sale: 57800, hasColor: true,  hasScent: false,
      includes: ['센트글라스 본체 1개 (컬러 택1)', '전용 패키지'] },
    { id: 'starter', name: '센트글라스 스타터 세트', en: 'Scentglass Starter Set', desc: '센트글라스 + 시그니처 오일(10ml) + 기프트 패키지',     price: 85000, sale: 72250, hasColor: true,  hasScent: true, badge: 'Best',
      includes: ['센트글라스 본체 1개 (컬러 택1)', '시그니처 프래그런스 오일 10ml (향 택1)', '기프트 패키지'] },
    { id: 'oil',     name: '시그니처 프래그런스 오일', en: 'Signature Fragrance Oil', desc: '센트글라스 전용 시그니처 향 오일 10ml',                      price: 24000, sale: 24000, hasColor: false, hasScent: true,
      includes: ['시그니처 프래그런스 오일 10ml (향 택1)'] }
  ];

  var SHIPPING = { fee: 3000, freeOver: 50000 };
  var KEY = 'pauze_cart_v1';

  function won(n) { return n.toLocaleString('ko-KR') + '원'; }
  function off(p) { return Math.round((1 - p.sale / p.price) * 100); }
  function product(id) { for (var i = 0; i < PRODUCTS.length; i++) if (PRODUCTS[i].id === id) return PRODUCTS[i]; }
  function color(key) { for (var i = 0; i < COLORS.length; i++) if (COLORS[i].key === key) return COLORS[i]; }
  function scent(key) { for (var i = 0; i < SCENTS.length; i++) if (SCENTS[i].key === key) return SCENTS[i]; }
  // option label + thumbnail for a cart line
  function itemLabel(it) {
    var parts = [];
    if (it.color) parts.push(color(it.color).name);
    if (it.scent) parts.push(scent(it.scent).name);
    return parts.join(' · ') || '';
  }
  function itemImg(it) { return it.color ? color(it.color).img : it.scent ? scent(it.scent).img : SCENTS[0].img; }

  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function save(items) { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {} emit(); }
  var listeners = [];
  function emit() { var items = load(); listeners.forEach(function (fn) { fn(items); }); }

  var cart = {
    items: load,
    add: function (id, colorKey, qty, scentKey) {
      var items = load(), p = product(id);
      var c = p.hasColor ? (colorKey || COLORS[0].key) : null;
      var sc = p.hasScent ? (scentKey || SCENTS[0].key) : null;
      var found = items.filter(function (it) { return it.id === id && it.color === c && (it.scent || null) === sc; })[0];
      if (found) found.qty = Math.min(9, found.qty + qty); else items.push({ id: id, color: c, scent: sc, qty: qty });
      save(items);
    },
    setQty: function (i, qty) { var items = load(); if (!items[i]) return; if (qty < 1) items.splice(i, 1); else items[i].qty = Math.min(9, qty); save(items); },
    remove: function (i) { var items = load(); items.splice(i, 1); save(items); },
    clear: function () { save([]); },
    count: function () { return load().reduce(function (s, it) { return s + it.qty; }, 0); },
    totals: function (items) {
      items = items || load();
      var subtotal = 0, list = 0;
      items.forEach(function (it) { var p = product(it.id); subtotal += p.sale * it.qty; list += p.price * it.qty; });
      var shipping = subtotal === 0 || subtotal >= SHIPPING.freeOver ? 0 : SHIPPING.fee;
      return { subtotal: subtotal, list: list, discount: list - subtotal, shipping: shipping, total: subtotal + shipping };
    },
    on: function (fn) { listeners.push(fn); }
  };

  window.addEventListener('storage', function (e) { if (e.key === KEY) emit(); });

  window.PAUZE = { COLORS: COLORS, SCENTS: SCENTS, PRODUCTS: PRODUCTS, SHIPPING: SHIPPING, won: won, off: off, product: product, color: color, scent: scent, itemLabel: itemLabel, itemImg: itemImg, cart: cart };
})();
