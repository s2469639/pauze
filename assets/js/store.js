/* PAUZE — product data + cart (shared by index.html and checkout.html) */
(function () {
  var COLORS = [
    { key: 'sage',    name: 'Misty Sage',    hex: '#A5AE98', mood: '시그니처 그린', bg: '#E6E8DE', line: '안개가 내려앉은 듯 차분한 세이지 그린.', img: 'assets/img/color-sage.webp' },
    { key: 'oatmeal', name: 'Oatmeal Beige', hex: '#C8B8A4', mood: '데일리 내추럴', bg: '#EFE7DB', line: '따뜻한 여백을 닮은 오트밀 베이지.', img: 'assets/img/color-oatmeal.webp' },
    { key: 'stone',   name: 'Stone Gray',    hex: '#777C73', mood: '모던 아키텍처', bg: '#DEDFDA', line: '절제된 분위기의 스톤 그레이.', img: 'assets/img/color-stone.webp' },
    { key: 'rose',    name: 'Dusty Rose',    hex: '#B98F8C', mood: '감성 포인트',   bg: '#EFE2DE', line: '은은한 온기를 더하는 더스티 로즈.', img: 'assets/img/color-rose.webp' }
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

  /* ==========================================================================
   * 네이버 쇼핑 EP(Engine Page) 연동 필드
   * --------------------------------------------------------------------------
   * 자사몰 상품 DB → 네이버 쇼핑 상품 DB로 보내는 EP 3.0(TSV) 필드 매핑.
   * - 이 객체 하나가 상세페이지 메타/구조화 데이터(JSON-LD)와 EP 피드(naver-ep.tsv,
   *   tools/build-naver-ep.js)의 단일 원천(Single Source of Truth)이 된다.
   * - 상품명(title) 구조:  [브랜드] [상품명] [핵심 속성] [구성/용량]
   *   → 브랜드 검색과 카테고리 키워드(디퓨저·방향제) 검색에 동시에 노출되도록 설계.
   *   → 과장 표현(최고, 1위, 특가!!)·특수문자 남용 금지 (네이버 상품명 가이드).
   * - 옵션(컬러 4종)은 option_detail 로 전달하고 상품은 하나의 id 로 유지
   *   → 리뷰/판매지수가 컬러별로 쪼개지지 않게 한다.
   * - naver_category(카테고리 ID)는 스마트스토어/쇼핑파트너센터에서 조회 후 확정.
   * ======================================================================== */
  var SITE = 'https://pauze.netlify.app';   // 배포 도메인 확정 시 교체
  var NAVER_EP = {
    common: {
      brand: 'PAUZE', maker: 'PAUZE', origin: '대한민국',
      category_name1: '생활/건강', category_name2: '생활용품', category_name3: '방향제', category_name4: '디퓨저',
      naver_category: '',            // TODO: 쇼핑파트너센터 카테고리 ID 매칭 후 입력
      condition: '신상품', shipping: 0, // 0 = 무료배송 / 조건부는 delivery_detail 로 안내
      delivery_detail: '5만원 이상 무료배송, 미만 3,000원'
    },
    object: {
      title: 'PAUZE 센트글라스 무전원 아날로그 향기 타이머 디퓨저 오브제 125mm',
      search_tag: ['향기타이머', '데스크테리어', '무전원디퓨저', '아날로그디퓨저', '책상디퓨저', '집중루틴', '집들이선물', '세라믹디퓨저', '조용한몰입', '센트글라스'],
      option_detail: 'Misty Sage|Oatmeal Beige|Stone Gray|Dusty Rose'
    },
    starter: {
      title: 'PAUZE 센트글라스 스타터 세트 향기 타이머 디퓨저 + 시그니처 오일 10ml 선물 패키지',
      search_tag: ['디퓨저선물세트', '향기타이머', '데스크테리어', '취업선물', '집들이선물', '무전원디퓨저', '시그니처오일', '센트글라스', '향기루틴', '기프트세트'],
      option_detail: 'Misty Sage|Oatmeal Beige|Stone Gray|Dusty Rose'
    },
    oil: {
      title: 'PAUZE 시그니처 프래그런스 오일 10ml 센트글라스 전용 디퓨저 리필',
      search_tag: ['디퓨저리필', '디퓨저오일', '프래그런스오일', '그린티향', '화이트티향', '무화과향', '라벤더향', '향기루틴', '센트글라스', '책상향기'],
      option_detail: 'Green Tea & Cedar|White Tea & Neroli|Fig & Soft Woods|Lavender & Linen',
      category_name4: '디퓨저 리필액'
    }
  };
  function naverEp(id) {
    var p = product(id), ep = NAVER_EP[id], c = NAVER_EP.common, r = (window.PAUZE && window.PAUZE.reviews) ? window.PAUZE.reviews.stats(id) : null;
    return {
      id: 'PZ-' + id.toUpperCase(), title: ep.title,
      price_pc: p.sale, price_mobile: p.sale, normal_price: p.price,
      link: SITE + '/product.html?id=' + id, mobile_link: SITE + '/product.html?id=' + id,
      image_link: SITE + '/assets/img/ep/' + (id === 'object' ? 'scentglass' : id) + '.jpg',   // 1000x1000 JPG (EP 이미지 규격 대응)
      category_name1: c.category_name1, category_name2: c.category_name2, category_name3: c.category_name3, category_name4: ep.category_name4 || c.category_name4,
      naver_category: c.naver_category, condition: c.condition, brand: c.brand, maker: c.maker, origin: c.origin,
      event_words: p.sale < p.price ? '런칭 기념 15% 할인' : '',
      search_tag: ep.search_tag.slice(0, 10).join('|'),   // 최대 10개, '|' 구분
      option_detail: ep.option_detail,
      shipping: p.sale >= SHIPPING.freeOver ? 0 : SHIPPING.fee, delivery_detail: c.delivery_detail,
      review_count: r ? r.count : 0,
      npay_unable: 0                                       // 0 = 네이버페이 결제 가능
    };
  }

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

  window.PAUZE = { SITE: SITE, naverEp: naverEp, NAVER_EP: NAVER_EP, COLORS: COLORS, SCENTS: SCENTS, PRODUCTS: PRODUCTS, SHIPPING: SHIPPING, won: won, off: off, product: product, color: color, scent: scent, itemLabel: itemLabel, itemImg: itemImg, cart: cart };
})();
