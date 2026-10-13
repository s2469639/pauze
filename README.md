# PAUZE — Scentglass 브랜드 자사몰 (데모)

> 잠시, 향에 머물다.
> 뒤집는 동작으로 향을 켜고 끄는 무전원 아날로그 향기 오브제 **센트글라스(Scentglass)** 의 브랜드 사이트·상세페이지·구매 동선 데모입니다.
> 빌드 없는 정적 HTML/CSS/JS로 만들었고, Netlify에 그대로 배포합니다.

## 페이지 구성

| 파일 | 역할 |
| --- | --- |
| `index.html` | 브랜드 랜딩: 3D 리추얼(캡 열기 → 오일 3방울 → 닫기 → 뒤집기 → 다시 뒤집어 정지), 분해도, 컬러, 시그니처 향, 리뷰, 숍 |
| `product.html?id=object\|starter\|oil` | 상품 상세: 3D 뷰어, 옵션(컬러 4종 / 향 4종), 구매 CTA, 상세 스토리, 스펙, 리뷰, FAQ |
| `reviews.html` | 리뷰 모음: 평점 분포, 포토 리뷰, 상품별 탭, 정렬 |
| `checkout.html` | 결제 UI 데모 (실제 결제 없음) |
| `naver-ep.tsv` | 네이버 쇼핑 EP 3.0 상품 피드 (`node tools/build-naver-ep.js` 로 생성) |

## 커머스 설계 포인트

### 1. 네이버 쇼핑 상품 DB 연동 (EP)
- `assets/js/store.js` 의 `NAVER_EP` / `naverEp()` 가 **단일 원천**입니다. 상세페이지의 `<title>`·meta·JSON-LD와 EP 피드가 모두 여기서 만들어져, 가격·할인 불일치(노출 제한 사유)를 막습니다.
- **상품명 구조**는 `[브랜드] [상품명] [핵심 속성] [구성/용량]` 입니다.
  예: `PAUZE 센트글라스 무전원 아날로그 향기 타이머 디퓨저 오브제 125mm`
- **표준 카테고리**는 생활/건강 > 생활용품 > 방향제 > 디퓨저 (오일은 디퓨저 리필액)입니다. 카테고리 ID(`naver_category`)는 쇼핑파트너센터에서 매칭한 뒤 입력합니다.
- **검색 태그**는 상품당 최대 10개를 `|` 로 구분합니다. 기능, 상황, 선물, 속성 키워드를 고르게 넣었습니다.
- **옵션**: 컬러 4종은 `option_detail` 로 보내고 상품 id는 하나로 유지합니다. 그래야 리뷰와 판매지수가 컬러별로 쪼개지지 않습니다.
- **EP 이미지**는 `assets/img/ep/*.jpg` 에 1000×1000 JPG로 따로 둡니다.

### 2. 구매 CTA와 네이버페이 전환 동선
- 버튼은 `장바구니 / 구매하기 / N Pay 구매` 3단입니다. N Pay는 회원가입·카드 입력 없이 네이버 아이디로 결제하는 동선이라, 2030 모바일 첫 구매 고객의 이탈을 줄이는 것이 목적입니다.
- **런칭 전**에는 구매하기와 N Pay 모두 결제 대신 **사전 알림 신청 모달**을 엽니다. 신청 데이터에는 어떤 버튼에서 왔는지(`source`)를 함께 남깁니다.
- 신청 내역은 Netlify Forms(`form name="prelaunch"`)로 수집합니다. Netlify 대시보드의 Forms 메뉴에서 볼 수 있습니다.
- **런칭 후 교체 지점**은 `assets/js/product.js` 의 CTA 블록 주석에 적어 두었습니다.
  - `direct`: 자사몰 PG 결제로 연결
  - `npay`: 네이버페이 주문형 API로 연결 (주문서 생성 → 결제창 → returnUrl에서 주문 동기화)

### 3. 전환 퍼널 측정
- 다음 이벤트를 `window.dataLayer` 로 쌓습니다. GA4와 네이버 프리미엄 로그분석에 같이 연결할 수 있습니다.
  `view_item → select_option → add_to_cart | begin_checkout | npay_click → prelaunch_signup`
- N Pay 클릭 비중은 런칭 때 결제 버튼 우선순위를 정하는 근거가 됩니다.

### 4. 검색 노출 (SEO)
- 상품마다 `<title>`, description, keywords, `og:*`, `product:price:*`, canonical, `schema.org/Product` JSON-LD(가격, 브랜드, 컬러, 평점)를 넣습니다.
- `naver-site-verification` 메타 자리는 비워 두었습니다. 네이버 서치어드바이저에서 발급받은 값을 넣으면 됩니다.
- 실서비스에서는 상품별 정적 URL과 SSR로 HTML에 직접 렌더링하는 것을 권장합니다.

## 개발

```bash
npm install          # esbuild (3D 번들용)
npm run build        # assets/js/main.js, viewer.js → *.bundle.js
node tools/build-naver-ep.js   # 가격/상품 변경 후 EP 피드 갱신
```

HTML, CSS, `store.js`(가격·옵션·EP 필드), `product.js`, `reviews.js`는 수정 후 저장만 하면 반영됩니다.

> 리뷰는 포트폴리오용 예시 데이터입니다. 실제 판매 시에는 실구매 리뷰로 교체해야 합니다.
