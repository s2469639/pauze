/* PAUZE — review data + shared rendering (index, product, reviews pages) */
(function () {
  var I = 'assets/img/';
  var R = [
    // ---- 센트글라스 단품 ----
    { id: 'o1', product: 'object', color: 'sage', rating: 5, name: '김*원', date: '2026-10-11', helpful: 42, photos: [I + 'life-morning.webp', I + 'color-sage.webp'],
      text: '책상 위에 두자마자 분위기가 완전히 달라졌어요. 원래 일반 스틱 디퓨저는 하루 종일 향이 나서 머리가 지끈거렸는데, 이건 공부 시작할 때 딱 뒤집어서 20~30분 집중하고 다시 돌려놓으면 향이 멈추니까 너무 쾌적해요. 세라믹 질감이 실제로 보면 훨씬 고급스럽습니다.' },
    { id: 'o2', product: 'object', color: 'stone', rating: 5, name: '이*호', date: '2026-10-09', helpful: 37, photos: [I + 'color-stone.webp'],
      text: '맥북이랑 데스크 셋업에 어울리는 모던한 오브제 찾다가 샀는데 스톤 그레이 색상 실물 깡패네요. 뒤집을 때 묵직하게 손에 감기는 세라믹 촉감이 진짜 좋습니다. 스마트폰 알람 대신 아날로그 타이머처럼 쓰는 루틴 생겨서 도파민 디톡스 제대로 하는 중입니다.' },
    { id: 'o3', product: 'object', color: 'oatmeal', rating: 5, name: '박*연', date: '2026-10-08', helpful: 29, photos: [I + 'color-oatmeal.webp', I + 'detail-brass-macro.webp'],
      text: '원목 책상 인테리어에 오트밀 베이지가 찰떡처럼 녹아들어요. 크기가 너무 크지 않아서(H125mm) 모니터 옆에 두어도 시야를 전혀 안 가려요. 샴페인 브라스 링 마감이 진짜 정교해서 명품 오브제 올려둔 기분입니다.' },
    { id: 'o4', product: 'object', color: 'rose', rating: 4, name: '최*은', date: '2026-10-06', helpful: 21, photos: [I + 'life-evening.webp'],
      text: '촌스러운 핑크가 아니라 차분하고 톤 다운된 말린 장미 색상이라 서재에도 잘 어울립니다. 퇴근하고 일기 쓰기 전에 3방울 넣고 뒤집는 행위 자체가 하루를 정리하는 힐링 리추얼이 되었어요. 지인들 생일 선물로 무조건 재구매할 생각입니다.' },
    { id: 'o5', product: 'object', color: 'sage', rating: 5, name: '정*우', date: '2026-10-04', helpful: 18, photos: [I + 'detail-glass-macro.webp'],
      text: '집중 시간 제어용으로 샀는데 대만족입니다. 모래시계처럼 가운데 유리 챔버가 반투명해서 빛 비칠 때 곡선이 정말 예뻐요. 무엇보다 내가 원할 때 발향을 On/Off 할 수 있다는 게 기존 방향제들이랑 차원이 다릅니다.' },
    { id: 'o6', product: 'object', color: 'oatmeal', rating: 5, name: '한*지', date: '2026-10-02', helpful: 15, photos: [],
      text: '집들이 선물로 받았는데 너무 마음에 들어서 제 방 서재용으로 하나 더 샀어요. 디퓨저 액 쏟아질 걱정 없고, 버튼 누르는 전자제품이 아니라 아날로그 감성이라 침대 협탁에 두기에도 마음이 편안합니다.' },
    { id: 'o7', product: 'object', color: 'stone', rating: 5, name: '윤*혁', date: '2026-09-29', helpful: 24, photos: [I + 'life-flip.webp'],
      text: '집중력이 짧아서 타이머 앱을 자주 켰는데, 폰 켜면 자꾸 인스타 보게 되더라고요. 이제는 책상 앉아서 PAUZE 뒤집고 책 읽기 시작합니다. 잔향도 인위적이지 않고 자연스럽게 머물다 사라져서 후각 피로가 없어요.' },
    { id: 'o8', product: 'object', color: 'sage', rating: 5, name: '서*아', date: '2026-09-27', helpful: 31, photos: [I + 'package.webp', I + 'detail-logo-macro.webp'],
      text: '패키지 지함 박스부터 엄청 꼼꼼하고 감성적이라 언박싱할 때 감탄했습니다. 도자기 세라믹이랑 금속 결합부 유격 없이 마감이 진짜 정밀해요. 데스크테리어 좋아하시는 분들은 무조건 만족하실 듯합니다.' },
    { id: 'o9', product: 'object', color: 'rose', rating: 5, name: '강*민', date: '2026-09-24', helpful: 9, photos: [],
      text: '생각보다 작고 단단해서 책상 위에서 안정감 있어요. 아침에 업무 시작할 때 한 번, 점심 먹고 나른할 때 한 번 뒤집어줍니다. 향이 은은하게 퍼지면서 일 모드로 전환되는 느낌이 확실히 듭니다.' },
    { id: 'o10', product: 'object', color: 'stone', rating: 5, name: '조*현', date: '2026-09-21', helpful: 12, photos: [],
      text: '유리와 세라믹 조화가 진짜 세련됐어요. 전선 주렁주렁 달린 디퓨저나 가열식 워머는 자리 차지해서 싫었는데, 무전원이라 어디든 툭 올려둘 수 있는 게 최고의 장점입니다.' },
    // ---- 스타터 세트 ----
    { id: 's1', product: 'starter', color: 'sage', scent: 'greentea', rating: 5, name: '임*솔', date: '2026-10-10', helpful: 48, photos: [I + 'box-open.webp', I + 'gift-ribbon.webp'],
      text: '처음 구매하시는 분들은 고민하지 말고 무조건 스타터 세트로 가세요. 시그니처 오일 향이 인위적인 방향제 향이 아니라 숲속 서재에 들어온 듯 은은하고 차분해서 오브제 분위기랑 완벽하게 어울립니다. 선물 박스 포장도 너무 고급스러워서 받는 사람이 엄청 비싼 명품인 줄 알았대요.' },
    { id: 's2', product: 'starter', color: 'oatmeal', scent: 'whitetea', rating: 5, name: '오*린', date: '2026-10-05', helpful: 33, photos: [I + 'life-afternoon.webp'],
      text: '취업한 친구 선물용으로 샀는데 반응이 역대급이었습니다. 본체 색감도 예쁜데 같이 동봉된 오일 발향력이 딱 15~20분 몰입하기 좋은 강도예요. 뒤집는 방식 설명서 보고 신기해하면서 매일 출근해서 모닝 루틴으로 쓴다고 사진 보내왔네요.' },
    { id: 's3', product: 'starter', color: 'rose', scent: 'lavender', rating: 4, name: '신*경', date: '2026-09-30', helpful: 14, photos: [],
      text: '타사 오일 호환도 되겠지만 브랜드에서 같이 페어링해 준 전용 오일과의 조합이 확실히 안정적입니다. 2~3방울 떨어뜨리고 뒤집으면 챔버 타고 퍼지는 발향 밸런스가 정말 좋네요. 할인 혜택가로 세트 구성 구매해서 완전 득템했습니다.' },
    // ---- 프래그런스 오일 ----
    { id: 'f1', product: 'oil', scent: 'greentea', rating: 5, name: '배*진', date: '2026-10-12', helpful: 19, photos: [I + 'scent-greentea.webp'],
      text: '세트 사고 오일 다 써서 리필로 재구매합니다! 발향이 너무 자극적이거나 코를 찌르지 않고 은은해서 밀폐된 방 안에서 써도 머리가 안 아파요. 1회에 딱 2~3방울만 쓰다 보니 10ml여도 생각보다 꽤 오래 쓰네요.' },
    { id: 'f2', product: 'oil', scent: 'fig', rating: 5, name: '노*하', date: '2026-10-03', helpful: 22, photos: [I + 'scent-fig.webp'],
      text: '오일 퀄리티가 정말 좋습니다. 저렴한 인공 향료 특유의 알코올 냄새가 전혀 없고, 우디하면서도 차분한 그리너리 향이라 책 읽을 때나 명상할 때 집중력을 확 끌어올려 줍니다. 잔향까지 깨끗하게 마무리돼서 만족스러워요.' },
    { id: 'f3', product: 'oil', scent: 'whitetea', rating: 5, name: '문*빈', date: '2026-09-26', helpful: 8, photos: [],
      text: 'PAUZE 오브제 전용이라 그런지 뒤집었을 때 퍼지는 향의 확산 속도랑 멈췄을 때 감쇄되는 느낌이 딱 맞게 튜닝된 것 같아요. 다른 향 라인업도 더 출시되었으면 좋겠어요! 꾸준히 쟁여두고 쓸 예정입니다.' }
  ];

  var P = window.PAUZE;
  var HKEY = 'pauze_helpful_v1';
  function helpedSet() { try { return JSON.parse(localStorage.getItem(HKEY)) || {}; } catch (e) { return {}; } }

  function list(productId) { return R.filter(function (r) { return !productId || r.product === productId; }); }
  function stats(productId) {
    var l = list(productId), dist = [0, 0, 0, 0, 0], sum = 0;
    l.forEach(function (r) { dist[r.rating - 1]++; sum += r.rating; });
    return { count: l.length, avg: l.length ? sum / l.length : 0, dist: dist, photos: l.filter(function (r) { return r.photos.length; }).length };
  }
  function stars(n, cls) {
    var s = '';
    for (var i = 1; i <= 5; i++) s += '<i class="' + (i <= Math.round(n) ? 'on' : '') + '">★</i>';
    return '<span class="stars ' + (cls || '') + '" aria-label="별점 ' + n + '점">' + s + '</span>';
  }
  function optionLabel(r) {
    var parts = [];
    if (r.color) parts.push(P.color(r.color).name);
    if (r.scent) parts.push(P.scent(r.scent).name);
    return P.product(r.product).name + (parts.length ? ' · ' + parts.join(' · ') : '');
  }
  function fmtDate(d) { return d.replace(/-/g, '.'); }
  function card(r, opts) {
    opts = opts || {};
    var helped = helpedSet()[r.id];
    var text = opts.clamp ? '<p class="rv-text clamp">' + r.text + '</p>' : '<p class="rv-text">' + r.text + '</p>';
    return '<article class="rv" data-rv="' + r.id + '">' +
      '<header class="rv-head">' + stars(r.rating) + '<span class="rv-meta"><b>' + r.name + '</b> · ' + fmtDate(r.date) + ' · <em>구매 인증</em></span></header>' +
      '<p class="rv-opt">' + optionLabel(r) + '</p>' + text +
      (r.photos.length ? '<div class="rv-photos">' + r.photos.map(function (src, i) { return '<button type="button" data-photo="' + r.id + ':' + i + '" aria-label="리뷰 사진 크게 보기"><img src="' + src + '" alt="" loading="lazy"></button>'; }).join('') + '</div>' : '') +
      (opts.noHelpful ? '' : '<button type="button" class="rv-help' + (helped ? ' on' : '') + '" data-help="' + r.id + '">도움돼요 <span>' + (r.helpful + (helped ? 1 : 0)) + '</span></button>') +
      '</article>';
  }

  // delegated interactions: helpful toggle + photo lightbox
  function bind(root) {
    root.addEventListener('click', function (e) {
      var h = e.target.closest('[data-help]');
      if (h) {
        var set = helpedSet(), id = h.dataset.help, r = R.filter(function (x) { return x.id === id; })[0];
        set[id] = !set[id];
        try { localStorage.setItem(HKEY, JSON.stringify(set)); } catch (err) {}
        h.classList.toggle('on', !!set[id]);
        h.querySelector('span').textContent = r.helpful + (set[id] ? 1 : 0);
        return;
      }
      var ph = e.target.closest('[data-photo]');
      if (ph) { var p = ph.dataset.photo.split(':'); openPhoto(p[0], +p[1]); }
    });
  }
  var box;
  function openPhoto(id, idx) {
    var r = R.filter(function (x) { return x.id === id; })[0];
    if (!box) {
      box = document.createElement('div');
      box.className = 'rv-lightbox';
      box.innerHTML = '<button type="button" class="x" aria-label="닫기">×</button><figure><img alt=""><figcaption></figcaption></figure><button type="button" class="nav prev" aria-label="이전">‹</button><button type="button" class="nav next" aria-label="다음">›</button>';
      document.body.appendChild(box);
      box.addEventListener('click', function (e) { if (e.target === box || e.target.closest('.x')) close(); });
      addEventListener('keydown', function (e) { if (!box.classList.contains('open')) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); });
      box.querySelector('.prev').onclick = function () { step(-1); };
      box.querySelector('.next').onclick = function () { step(1); };
    }
    box.dataset.id = id; box.dataset.idx = idx;
    show();
    box.classList.add('open');
    function show() {
      var rr = R.filter(function (x) { return x.id === box.dataset.id; })[0], i = +box.dataset.idx;
      box.querySelector('img').src = rr.photos[i];
      box.querySelector('figcaption').innerHTML = stars(rr.rating) + ' <b>' + rr.name + '</b> · ' + optionLabel(rr);
      box.querySelector('.prev').hidden = box.querySelector('.next').hidden = rr.photos.length < 2;
    }
    function step(d) { var rr = R.filter(function (x) { return x.id === box.dataset.id; })[0]; box.dataset.idx = (+box.dataset.idx + d + rr.photos.length) % rr.photos.length; show(); }
    function close() { box.classList.remove('open'); }
    box._show = show;
  }

  P.reviews = { all: R, list: list, stats: stats, stars: stars, card: card, bind: bind, optionLabel: optionLabel };
})();
