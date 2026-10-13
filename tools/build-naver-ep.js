#!/usr/bin/env node
/**
 * 네이버 쇼핑 EP 3.0 피드 생성기  →  naver-ep.tsv
 *
 * 사용:  node tools/build-naver-ep.js
 * 흐름:  assets/js/store.js (상품 DB + NAVER_EP 매핑)  ──▶  TSV (UTF-8, 탭 구분, 1행 헤더)
 *        쇼핑파트너센터에 피드 URL(https://<도메인>/naver-ep.tsv)을 등록하면 네이버가 주기적으로 수집한다.
 *
 * 자사몰 가격·할인·리뷰 수를 바꾸면 이 스크립트를 다시 돌려 EP와 상세페이지가 항상 같은 값을 갖게 한다
 * (가격 불일치는 네이버 쇼핑 노출 제한 사유).
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const ctx = { window: { addEventListener() {} }, localStorage: { getItem: () => null, setItem() {} } };
vm.createContext(ctx);
for (const f of ['assets/js/store.js', 'assets/js/reviews.js']) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx);
const P = ctx.window.PAUZE;

const FIELDS = ['id', 'title', 'price_pc', 'price_mobile', 'normal_price', 'link', 'mobile_link', 'image_link',
  'category_name1', 'category_name2', 'category_name3', 'category_name4', 'naver_category', 'condition',
  'brand', 'maker', 'origin', 'event_words', 'search_tag', 'option_detail', 'shipping', 'delivery_detail',
  'review_count', 'npay_unable'];

const clean = (v) => String(v ?? '').replace(/[\t\r\n]+/g, ' ');
const rows = P.PRODUCTS.map((p) => P.naverEp(p.id));
const tsv = [FIELDS.join('\t'), ...rows.map((r) => FIELDS.map((f) => clean(r[f])).join('\t'))].join('\n') + '\n';
fs.writeFileSync(path.join(root, 'naver-ep.tsv'), tsv);
console.log(`naver-ep.tsv: ${rows.length} products`);
