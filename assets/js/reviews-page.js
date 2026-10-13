/* PAUZE — reviews page */
(function () {
  var P = window.PAUZE, RV = P.reviews;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  P.ui.mount();

  var q = new URLSearchParams(location.search);
  var state = { product: P.product(q.get('product')) ? q.get('product') : '', photoOnly: q.get('photo') === '1', sort: 'latest' };

  function summary() {
    var st = RV.stats(state.product);
    $('[data-avg]').textContent = st.avg.toFixed(1);
    $('[data-avg-stars]').innerHTML = RV.stars(st.avg, 'lg');
    $('[data-count]').textContent = '리뷰 ' + st.count + '개 · 포토 ' + st.photos + '개';
    $('[data-dist]').innerHTML = [5, 4, 3, 2, 1].map(function (n) {
      var c = st.dist[n - 1], pct = st.count ? (c / st.count) * 100 : 0;
      return '<div class="bar"><span>' + n + '점</span><i><b style="width:' + pct + '%"></b></i><em>' + c + '</em></div>';
    }).join('');
    var shots = [];
    RV.list(state.product).forEach(function (r) { r.photos.forEach(function (src, i) { shots.push('<button type="button" data-photo="' + r.id + ':' + i + '"><img src="' + src + '" alt="" loading="lazy"></button>'); }); });
    $('[data-strip]').innerHTML = shots.join('');
  }

  function tabs() {
    var items = [{ id: '', name: '전체' }].concat(P.PRODUCTS.map(function (p) { return { id: p.id, name: p.name }; }));
    $('[data-tabs]').innerHTML = items.map(function (t) {
      return '<button type="button" role="tab" aria-selected="' + (t.id === state.product) + '" data-tab="' + t.id + '">' + t.name + ' <span>' + RV.stats(t.id).count + '</span></button>';
    }).join('');
    $$('[data-tab]').forEach(function (b) { b.onclick = function () { state.product = b.dataset.tab; render(); }; });
  }

  function render() {
    var l = RV.list(state.product).slice();
    if (state.photoOnly) l = l.filter(function (r) { return r.photos.length; });
    l.sort(function (a, b) {
      if (state.sort === 'helpful') return b.helpful - a.helpful;
      if (state.sort === 'high') return b.rating - a.rating || (a.date < b.date ? 1 : -1);
      if (state.sort === 'low') return a.rating - b.rating || (a.date < b.date ? 1 : -1);
      return a.date < b.date ? 1 : -1;
    });
    $('[data-list]').innerHTML = l.length ? l.map(function (r) { return RV.card(r); }).join('') : '<p class="rv-empty">조건에 맞는 리뷰가 없어요.</p>';
    tabs();
    summary();
    var u = new URLSearchParams();
    if (state.product) u.set('product', state.product);
    if (state.photoOnly) u.set('photo', '1');
    try { history.replaceState(null, '', u.toString() ? '?' + u : location.pathname); } catch (e) {}
  }

  $('[data-photo-only]').checked = state.photoOnly;
  $('[data-photo-only]').onchange = function () { state.photoOnly = this.checked; render(); };
  $('[data-sort]').onchange = function () { state.sort = this.value; render(); };
  RV.bind(document.body);
  render();
})();
