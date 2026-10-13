/* PAUZE — product data + cart (shared by index.html and checkout.html) */
(function () {
  var COLORS = [
    { key: 'sage',    name: 'Misty Sage',    hex: '#A5AE98', mood: '시그니처 그린', bg: '#E6E8DE', img: 'assets/img/color-sage.webp' },
    { key: 'oatmeal', name: 'Oatmeal Beige', hex: '#C8B8A4', mood: '데일리 내추럴', bg: '#EFE7DB', img: 'assets/img/color-oatmeal.webp' },
    { key: 'stone',   name: 'Stone Gray',    hex: '#777C73', mood: '모던 아키텍처', bg: '#DEDFDA', img: 'assets/img/color-stone.webp' },
    { key: 'rose',    name: 'Dusty Rose',    hex: '#B98F8C', mood: '감성 포인트',   bg: '#EFE2DE', img: 'assets/img/color-rose.webp' }
  ];

  // 런칭 혜택가 = 정가의 정확히 85% (15% OFF)
  var PRODUCTS = [
    { id: 'object',  name: '오브제 단품',     en: 'The Object',      desc: '타이머 본체 (컬러 택1) + 전용 패키지',               price: 68000, sale: 57800, hasColor: true },
    { id: 'starter', name: '스타터 세트',     en: 'Starter Set',     desc: '본체 + 시그니처 오일(10ml) + 기프트 패키지',          price: 85000, sale: 72250, hasColor: true, badge: 'Best' },
    { id: 'oil',     name: '프래그런스 오일', en: 'Fragrance Oil',   desc: '시그니처 향 오일 10ml 단품',                           price: 24000, sale: 24000, hasColor: false }
  ];

  var SHIPPING = { fee: 3000, freeOver: 50000 };
  var KEY = 'pauze_cart_v1';

  function won(n) { return n.toLocaleString('ko-KR') + '원'; }
  function off(p) { return Math.round((1 - p.sale / p.price) * 100); }
  function product(id) { for (var i = 0; i < PRODUCTS.length; i++) if (PRODUCTS[i].id === id) return PRODUCTS[i]; }
  function color(key) { for (var i = 0; i < COLORS.length; i++) if (COLORS[i].key === key) return COLORS[i]; }

  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function save(items) { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {} emit(); }
  var listeners = [];
  function emit() { var items = load(); listeners.forEach(function (fn) { fn(items); }); }

  var cart = {
    items: load,
    add: function (id, colorKey, qty) {
      var items = load(), p = product(id);
      var c = p.hasColor ? colorKey : null;
      var found = items.filter(function (it) { return it.id === id && it.color === c; })[0];
      if (found) found.qty = Math.min(9, found.qty + qty); else items.push({ id: id, color: c, qty: qty });
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

  window.PAUZE = { COLORS: COLORS, PRODUCTS: PRODUCTS, SHIPPING: SHIPPING, won: won, off: off, product: product, color: color, cart: cart };
})();
