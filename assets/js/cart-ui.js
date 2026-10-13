/* PAUZE — cart drawer + toast (shared by index.html and product.html) */
(function () {
  var P = window.PAUZE, cart = P.cart, won = P.won;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var hooks = { open: function () {}, close: function () {} };

  function render(items) {
    items = items || cart.items();
    $$('[data-cart-count]').forEach(function (el) { el.textContent = cart.count(); });
    var box = $('[data-cart-items]');
    if (!box) return;
    if (!items.length) {
      box.innerHTML = '<div class="empty"><p>장바구니가 비어 있어요.</p><a href="index.html#shop" class="link" data-close-cart>PAUZE 둘러보기</a></div>';
    } else {
      box.innerHTML = items.map(function (it, i) {
        var p = P.product(it.id);
        return '<div class="line-item">' +
          '<a class="li-img" href="product.html?id=' + p.id + '"><img src="' + P.itemImg(it) + '" alt=""></a>' +
          '<div class="li-info"><b>' + p.name + '</b><span>' + P.itemLabel(it) + '</span>' +
          '<div class="qty sm"><button type="button" data-ci="' + i + '" data-d="-1" aria-label="줄이기">−</button><span>' + it.qty + '</span><button type="button" data-ci="' + i + '" data-d="1" aria-label="늘리기">+</button></div></div>' +
          '<div class="li-price">' + (p.sale < p.price ? '<s>' + won(p.price * it.qty) + '</s>' : '') + '<b>' + won(p.sale * it.qty) + '</b>' +
          '<button type="button" class="rm" data-rm="' + i + '">삭제</button></div></div>';
      }).join('');
    }
    var t = cart.totals(items);
    $('[data-cart-subtotal]').textContent = won(t.subtotal);
    $('[data-cart-shipping]').textContent = t.shipping ? won(t.shipping) : '무료';
    $('[data-cart-total]').textContent = won(t.total);
    var left = P.SHIPPING.freeOver - t.subtotal;
    $('[data-free-hint]').textContent = t.subtotal && left > 0 ? won(left) + ' 더 담으면 무료배송' : t.subtotal ? '무료배송 적용' : '';
    $('[data-checkout]').classList.toggle('disabled', !items.length);
    $$('[data-ci]', box).forEach(function (b) { b.onclick = function () { var i = +b.dataset.ci; cart.setQty(i, cart.items()[i].qty + +b.dataset.d); }; });
    $$('[data-rm]', box).forEach(function (b) { b.onclick = function () { cart.remove(+b.dataset.rm); }; });
    $$('[data-close-cart]', box).forEach(function (b) { b.onclick = close; });
  }
  function open() { document.body.classList.add('cart-open'); $('.drawer').setAttribute('aria-hidden', 'false'); hooks.open(); }
  function close() { document.body.classList.remove('cart-open'); $('.drawer').setAttribute('aria-hidden', 'true'); hooks.close(); }

  var toastTimer;
  function toast(msg) {
    var el = $('.toast'); if (!el) return;
    el.textContent = msg; el.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2400);
  }

  function mount(opts) {
    if (opts) { hooks.open = opts.onOpen || hooks.open; hooks.close = opts.onClose || hooks.close; }
    $$('[data-open-cart]').forEach(function (b) { b.addEventListener('click', open); });
    $$('[data-close-cart]').forEach(function (b) { b.addEventListener('click', close); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    var co = $('[data-checkout]');
    if (co) co.addEventListener('click', function (e) { if (!cart.count()) e.preventDefault(); });
    cart.on(render);
    render();
  }

  P.ui = { mount: mount, open: open, close: close, render: render, toast: toast };
})();
