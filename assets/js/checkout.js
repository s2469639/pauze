/* PAUZE — checkout (UI only; no real payment is processed) */
(function () {
  var P = window.PAUZE, cart = P.cart, won = P.won;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var form = $('#orderForm');
  var main = $('.co-main');

  function bottleSvg() { return '<svg viewBox="0 0 120 200" aria-hidden="true"><rect x="44" y="18" width="32" height="34" rx="3" fill="#cdb48a"/><rect x="40" y="50" width="40" height="8" rx="2" fill="#b59a6e"/><path d="M30 70q0-12 12-12h36q12 0 12 12v100q0 12-12 12H42q-12 0-12-12z" fill="#e6d9bf"/><text x="60" y="110" text-anchor="middle" font-family="Cormorant Garamond,serif" font-size="11" letter-spacing="3" fill="#5f5848">PAUZE</text></svg>'; }

  /* ---------- render ---------- */
  function render() {
    var items = cart.items();
    if (!items.length && main.dataset.view !== 'done') { show('empty'); return; }
    $('[data-items]').innerHTML = items.map(function (it, i) {
      var p = P.product(it.id), c = it.color ? P.color(it.color) : null;
      return '<div class="co-item">' +
        '<div class="li-img">' + (c ? '<img src="' + c.img + '" alt="">' : bottleSvg()) + '</div>' +
        '<div class="co-item-info"><b>' + p.name + '</b><span>' + (c ? c.name : '10ml') + ' · ' + p.desc + '</span>' +
        '<div class="qty sm"><button type="button" data-i="' + i + '" data-d="-1" aria-label="줄이기">−</button><span>' + it.qty + '</span><button type="button" data-i="' + i + '" data-d="1" aria-label="늘리기">+</button></div></div>' +
        '<div class="li-price">' + (p.sale < p.price ? '<s>' + won(p.price * it.qty) + '</s>' : '') + '<b>' + won(p.sale * it.qty) + '</b>' +
        '<button type="button" class="rm" data-rm="' + i + '">삭제</button></div></div>';
    }).join('');
    $$('[data-d]').forEach(function (b) { b.onclick = function () { var i = +b.dataset.i; cart.setQty(i, cart.items()[i].qty + +b.dataset.d); }; });
    $$('[data-rm]').forEach(function (b) { b.onclick = function () { cart.remove(+b.dataset.rm); }; });

    var t = cart.totals(items);
    $('[data-s-list]').textContent = won(t.list);
    $('[data-s-disc]').textContent = t.discount ? '−' + won(t.discount) : '0원';
    $('[data-s-ship]').textContent = t.shipping ? won(t.shipping) : '무료';
    $('[data-s-total]').textContent = won(t.total);
    var left = P.SHIPPING.freeOver - t.subtotal;
    $('[data-s-hint]').textContent = left > 0 ? won(left) + ' 더 담으면 무료배송' : '무료배송이 적용되었어요';
    $('[data-pay]').textContent = won(t.total) + ' 결제하기';
  }
  function show(view) {
    main.dataset.view = view;
    form.hidden = view !== 'form';
    $('.co-summary').hidden = view !== 'form';
    $('.co-empty').hidden = view !== 'empty';
    $('.co-done').hidden = view !== 'done';
    if (view === 'done') { $$('.co-steps li').forEach(function (li, i) { li.className = i < 2 ? 'done' : 'on'; }); }
    window.scrollTo(0, 0);
  }
  cart.on(render);
  render();

  /* ---------- inputs ---------- */
  $$('[data-phone]').forEach(function (el) {
    el.addEventListener('input', function () {
      var d = el.value.replace(/\D/g, '').slice(0, 11);
      el.value = d.length > 7 ? d.replace(/(\d{3})(\d{4})(\d+)/, '$1-$2-$3') : d.length > 3 ? d.replace(/(\d{3})(\d+)/, '$1-$2') : d;
    });
  });
  function syncReceiver() {
    if (!$('#sameBuyer').checked) return;
    form.receiver.value = form.buyer.value;
    form.rphone.value = form.phone.value;
    clearInvalid(form.receiver); clearInvalid(form.rphone);
  }
  form.buyer.addEventListener('input', syncReceiver);
  form.phone.addEventListener('input', syncReceiver);
  $('#sameBuyer').addEventListener('change', function () { if (this.checked) syncReceiver(); else { form.receiver.value = ''; form.rphone.value = ''; form.receiver.focus(); } });

  $$('input[name=method]').forEach(function (r) {
    r.addEventListener('change', function () { $$('[data-pay-detail]').forEach(function (d) { d.hidden = d.dataset.payDetail !== r.value; }); });
  });

  var ags = $$('.ag');
  $('#agreeAll').addEventListener('change', function () { var v = this.checked; ags.forEach(function (a) { a.checked = v; }); });
  ags.forEach(function (a) { a.addEventListener('change', function () { $('#agreeAll').checked = ags.every(function (x) { return x.checked; }); }); });

  /* ---------- modals ---------- */
  function openModal(m) { m.hidden = false; requestAnimationFrame(function () { m.classList.add('open'); }); document.body.style.overflow = 'hidden'; }
  function closeModal(m) { m.classList.remove('open'); setTimeout(function () { m.hidden = true; }, 400); document.body.style.overflow = ''; }
  $$('.modal').forEach(function (m) {
    m.addEventListener('click', function (e) { if (e.target === m || e.target.closest('[data-close]')) closeModal(m); });
  });
  addEventListener('keydown', function (e) { if (e.key === 'Escape') $$('.modal.open').forEach(function (m) { if (!m.classList.contains('busy')) closeModal(m); }); });

  // mock address search
  var ADDR = [
    ['04779', '서울 성동구 성수이로 113', '성수동2가'],
    ['04780', '서울 성동구 연무장길 41', '성수동2가'],
    ['06236', '서울 강남구 테헤란로 152', '역삼동'],
    ['03991', '서울 마포구 동교로 262', '연남동'],
    ['48058', '부산 해운대구 해운대해변로 264', '우동'],
    ['63122', '제주 제주시 탑동로 15', '삼도이동']
  ];
  $('[data-open-addr]').addEventListener('click', function () { openModal($('#addrModal')); setTimeout(function () { $('#addrQ').focus(); }, 50); });
  function searchAddr() {
    var q = $('#addrQ').value.trim();
    var res = ADDR.filter(function (a) { return !q || (a[1] + a[2]).indexOf(q) > -1; });
    if (!res.length) res = ADDR;
    $('#addrResults').innerHTML = res.map(function (a) { return '<li><button type="button" data-zip="' + a[0] + '" data-a="' + a[1] + '"><b>' + a[0] + '</b>' + a[1] + '<small>' + a[2] + '</small></button></li>'; }).join('');
    $$('#addrResults button').forEach(function (b) {
      b.onclick = function () { form.zip.value = b.dataset.zip; form.addr1.value = b.dataset.a; closeModal($('#addrModal')); form.addr2.focus(); clearInvalid(form.zip); clearInvalid(form.addr1); };
    });
  }
  $('#addrGo').addEventListener('click', searchAddr);
  $('#addrQ').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); searchAddr(); } });

  /* ---------- validation ---------- */
  function markInvalid(el) { el.closest('.f, .addr') && el.closest('.f, .addr').classList.add('invalid'); }
  function clearInvalid(el) { var f = el.closest('.f, .addr'); if (f) f.classList.remove('invalid'); }
  $$('input, select', form).forEach(function (el) { el.addEventListener('input', function () { clearInvalid(el); }); });

  function validate() {
    var bad = [];
    syncReceiver();
    ['buyer', 'phone', 'email', 'receiver', 'rphone', 'zip', 'addr1', 'addr2'].forEach(function (n) {
      var el = form[n], v = el.value.trim(), ok = !!v;
      if (n === 'email') ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      if (n === 'phone' || n === 'rphone') ok = /^01\d-\d{3,4}-\d{4}$/.test(v);
      if (!ok) { markInvalid(el); bad.push(el); }
    });
    var method = form.method.value;
    if (method === 'card' && !form.cardco.value) { markInvalid(form.cardco); bad.push(form.cardco); }
    var err = '';
    if (bad.length) err = '입력 정보를 확인해 주세요.';
    else if (!ags.every(function (a) { return a.checked; })) err = '필수 약관에 동의해 주세요.';
    $('[data-err]').textContent = err;
    if (bad.length) bad[0].focus();
    return !err;
  }

  /* ---------- mock PG flow ---------- */
  var METHOD_LABEL = { card: '신용·체크카드', easy: '간편결제', transfer: '실시간 계좌이체', vbank: '무통장 입금' };
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!cart.count()) return;
    if (!validate()) return;
    openPG();
  });

  function openPG() {
    var t = cart.totals(), m = form.method.value, pg = $('#pgModal');
    $('[data-pg-amount]').textContent = won(t.total);
    var label = METHOD_LABEL[m];
    if (m === 'card') label += ' · ' + form.cardco.value + ' · ' + (form.plan.value === '0' ? '일시불' : form.plan.value + '개월');
    if (m === 'easy') label += ' · ' + form.easy.value;
    if (m === 'vbank') label += ' · ' + form.bank.value;
    $('[data-pg-method]').textContent = label;

    var body = $('[data-pg-body]');
    if (m === 'vbank') {
      body.innerHTML = '<p class="pg-msg">가상계좌를 발급할게요.</p><button type="button" class="btn btn-block" data-approve>가상계좌 발급받기</button>';
    } else {
      body.innerHTML =
        '<p class="pg-msg">' + (m === 'transfer' ? '은행 앱 인증' : '결제 비밀번호 6자리') + '를 입력해 주세요.</p>' +
        '<div class="pin" aria-label="비밀번호 입력 상태">' + '<i></i>'.repeat(6) + '</div>' +
        '<div class="keypad">' + shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]).map(function (n, i) { return (i === 9 ? '<button type="button" data-k="clear">전체삭제</button>' : '') + '<button type="button" data-k="' + n + '">' + n + '</button>'; }).join('') + '<button type="button" data-k="back">←</button></div>';
      var pin = 0;
      $$('[data-k]', body).forEach(function (b) {
        b.onclick = function () {
          var k = b.dataset.k;
          pin = k === 'back' ? Math.max(0, pin - 1) : k === 'clear' ? 0 : Math.min(6, pin + 1);
          $$('.pin i', body).forEach(function (d, i) { d.classList.toggle('on', i < pin); });
          if (pin === 6) setTimeout(approve, 250);
        };
      });
    }
    var ap = $('[data-approve]', body); if (ap) ap.onclick = approve;
    openModal(pg);
  }

  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var x = a[i]; a[i] = a[j]; a[j] = x; } return a; }

  function approve() {
    var pg = $('#pgModal');
    pg.classList.add('busy');
    $('[data-pg-body]').innerHTML = '<div class="pg-loading"><div class="hg"><i></i></div><p>결제를 승인하고 있어요…</p></div>';
    setTimeout(function () { pg.classList.remove('busy'); closeModal(pg); complete(); }, 2200);
  }

  function complete() {
    var t = cart.totals(), items = cart.items(), m = form.method.value;
    var d = new Date();
    var no = 'PZ' + d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0') + '-' + Math.random().toString(36).slice(2, 7).toUpperCase();
    var rows = [
      ['주문 번호', no],
      ['주문 상품', items.map(function (it) { var p = P.product(it.id), c = it.color ? P.color(it.color) : null; return p.name + (c ? ' (' + c.name + ')' : '') + ' × ' + it.qty; }).join('<br>')],
      ['받는 분', form.receiver.value + ' · ' + form.rphone.value],
      ['배송지', '(' + form.zip.value + ') ' + form.addr1.value + ' ' + form.addr2.value],
      ['결제 수단', $('[data-pg-method]').textContent],
      ['결제 금액', won(t.total)]
    ];
    if (m === 'vbank') {
      rows.splice(5, 0, ['입금 계좌', form.bank.value + ' 9' + Math.floor(1e10 + Math.random() * 9e10) + ' (예금주: 포즈)'], ['입금 기한', new Date(Date.now() + 864e5).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) + '까지']);
      $('[data-done-title]').textContent = '주문이 접수되었습니다.';
      $('[data-done-sub]').textContent = '입금이 확인되면 바로 준비를 시작할게요.';
    }
    $('[data-done-table]').innerHTML = rows.map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>'; }).join('');
    show('done');
    cart.clear();
    if (window.gsap) {
      gsap.from('.done-mark path', { strokeDasharray: 60, strokeDashoffset: 60, duration: 1.2, ease: 'power3.out', delay: 0.2 });
      gsap.from('.co-done > *:not(.done-mark)', { y: 30, opacity: 0, duration: 1, stagger: 0.08, ease: 'expo.out' });
    }
  }
})();
