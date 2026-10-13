/* PAUZE — product data + cart (shared by index.html and checkout.html) */
(function () {
  var COLORS = [
    { key: 'sage',    name: 'Misty Sage',    hex: '#A5AE98', mood: '시그니처 그린', bg: '#E6E8DE', img: 'assets/img/color-sage.webp' },
    { key: 'oatmeal', name: 'Oatmeal Beige', hex: '#C8B8A4', mood: '데일리 내추럴', bg: '#EFE7DB', img: 'assets/img/color-oatmeal.webp' },
    { key: 'stone',   name: 'Stone Gray',    hex: '#777C73', mood: '모던 아키텍처', bg: '#DEDFDA', img: 'assets/img/color-stone.webp' },
    { key: 'rose',    name: 'Dusty Rose',    hex: '#B98F8C', mood: '감성 포인트',   bg: '#EFE2DE', img: 'assets/img/color-rose.webp' }
  ];

  // 시그니처 오일 4종
  var SCENTS = [
    { key: 'greentea', name: 'Green Tea & Cedar',  kr: '그린티 & 시더',      band: '#A5AE98', badge: 'Signature',
      img: 'assets/img/oil-greentea.webp', mood: 'assets/img/scent-greentea.webp',
      notes: ['그린티', '베르가못', '시더우드'],
      desc: '차분한 녹차의 깨끗함에 시트러스의 산뜻함, 은은한 나무 향을 더했어요. 공부와 업무, 독서까지 어떤 순간에도 잘 어울리고, 세이지 그린 센트글라스와도 자연스럽게 이어지는 PAUZE의 시그니처 향이에요.',
      feel: ['맑은 아침', '정돈된 책상', '조용한 집중'] },
    { key: 'whitetea', name: 'White Tea & Neroli', kr: '화이트티 & 네롤리',  band: '#E3D3B4',
      img: 'assets/img/oil-whitetea.webp', mood: 'assets/img/scent-whitetea.webp',
      notes: ['화이트티', '네롤리', '머스크'],
      desc: '깨끗한 차 향과 은은한 꽃 향이 어우러진 부드러운 향이에요. 누구에게나 편안하게 다가가 선물로도 좋아요.',
      feel: ['햇살 드는 창가', '깨끗한 침구', '가벼운 휴식'] },
    { key: 'fig',      name: 'Fig & Soft Woods',   kr: '피그 & 소프트우드',  band: '#8A8660',
      img: 'assets/img/oil-fig.webp', mood: 'assets/img/scent-fig.webp',
      notes: ['무화과 잎', '무화과 우디 노트', '샌들우드'],
      desc: '초록 잎의 싱그러움과 부드러운 우디 향이 만나는 감각적인 향이에요. 조금 더 개성 있는 공간을 원할 때 추천해요.',
      feel: ['감각적인 서재', '오후의 독서', '차분한 공간'] },
    { key: 'lavender', name: 'Lavender & Linen',   kr: '라벤더 & 린넨',      band: '#A9A3AE',
      img: 'assets/img/oil-lavender.webp', mood: 'assets/img/scent-lavender.webp',
      notes: ['라벤더', '캐모마일', '소프트 머스크'],
      desc: '하루를 마무리하는 저녁 루틴을 위한 편안한 향이에요. 라벤더와 캐모마일이 긴장을 풀고, 부드러운 머스크가 포근하게 감싸요.',
      feel: ['저녁 조명', '따뜻한 침실', '하루의 마무리'] }
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
