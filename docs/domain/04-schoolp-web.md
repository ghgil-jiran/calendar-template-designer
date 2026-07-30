# 04. schoolp-web (고객 프론트엔드) 상세

- 위치: `/Users/mac/workspace/schoolp/schoolp-web`
- 스택: Vue 2.6 + Vuex 3 + Vue Router 3, Webpack 4, Bootstrap 4, axios, Filepond(업로드), dayjs, ChannelIO(상담)
- API: `https://api.schoolp.co.kr` (개발 `dev-api.`), 파일 서버 `https://file.schoolp.co.kr/school`, 엔드포인트 정의는 `src/Constant.js`
- 인증: `member.schoolp.co.kr` OAuth → `/oauth/callback` → Bearer 토큰 (`src/store/modules/auth.js`, 401 시 `/oauth/refresh` 자동 재시도)

## 1. 라우트 맵 (`src/router/index.js`)

### 상품 탐색 / 주문
| 경로 | 화면 | 비고 |
|---|---|---|
| `/` | 메인 (배너/신상품/이벤트) | |
| `/store/products` | 상품 목록 | 카테고리/태그/검색 필터 |
| `/store/products/:id` | 상품 상세 | 옵션 선택 + 실시간 견적 + 템플릿 |
| `/store/products/sheet` | 시트 간편 주문 | 재주문용 |
| `/templates` | 템플릿 갤러리 | 키워드 추천 |
| `/me/cart` | 장바구니 | 쿠폰 적용 |
| `/me/payments` | 주문/결제 (배송지·결제수단) | Daum 우편번호 |
| `/me/order-complete/:id` | 주문 완료 | |

### 마이페이지 / 사후 관리
| 경로 | 화면 | 비고 |
|---|---|---|
| `/me/order` | 주문 목록 | 기간/상태 필터 |
| `/me/order/:id` | 주문 상세 | 배송 추적, 파일 업로드, 가격 상세 툴팁 |
| `/me/order/:id/review` | 후기 작성 | 별점+사진 |
| `/me/design/:id` | **디자인 시안 확인/수정요청/승인** | 디자인허브의 고객측 원형 |
| `/me/coupon`, `/me/ebook` | 쿠폰 / 전자책 | |
| `/orders/estimate` | 견적서 조회 | |
| `/guest/order`, `/guest/order/:id` | 비회원 주문 조회 | 주문번호+이메일 |

### 고객지원
| 경로 | 화면 |
|---|---|
| `/support` (+`/faq`, `/notice`, `/review`, `/guide`) | FAQ/공지/후기/이용가이드 |
| `/support/inquiry`, `/support/inquiry/write`, `/support/inquiry/:id` | 문의 게시판 (비밀글 지원) |
| `/event`, `/event/:id` | 이벤트 (CMS 동적 콘텐츠) |

### 외부 파트너 (JAJAK)
`/external/print-order` — 4단계 주문: ①옵션선택 → ②표지/내용(파일 업로드 `print-only` 또는 템플릿 선택 `print-design`) → ③배송/결제 → ④완료
(`src/components/external/jajak/components/OrderSteps/Step1~4*.vue`)

## 2. 고객 여정과 구현 대응

```
상품탐색 ─ ProductList.vue ─ GET /products
  ↓
옵션선택/견적 ─ ProductOption.vue + Estimate.vue(견적서 모달)
  │   옵션 변경 시마다 POST /products/calc-price → state.product.priceInfo
  │   별도견적 조합 차단: src/utils/printMethodRules.js
  ↓
장바구니 ─ cart.js ─ /cart/items/** (비회원은 /guest/cart/items)
  ↓
결제 ─ Payments.vue ─ POST /orders (배송지+결제수단)
  ↓
원고 업로드 ─ FileUpload.vue(Filepond) ─ POST /orders/{o}/items/{i}/files
  │   허용: PDF/HWP/JPG/PNG/XLS/ZIP (print-only: PDF/AI/PSD/INDD/ZIP), 750MB, 5개
  ↓
디자인 확인 ─ DesignConfirm.vue / DesignConfirmDetail.vue
  │   GET /designs/{id} → 시안 보기
  │   POST /designs/{id}/comments → 수정 요청 (파일 첨부 가능)
  │   PATCH design_status=COMPLETE → 최종 승인 (DesignConfirmDetail.vue:303)
  ↓
배송조회/후기 ─ OrderDetail.vue (tracking_url), OrderReview.vue
```

- 주문 진행 상태 자동 저장: `src/utils/orderStorage.js` (localStorage `orderProgress`)
- Vuex 모듈: auth / product / cart / order / coupon / design / review / event / ebook / inquiry / banner / post / faq / privatePayment (`src/store/modules/`)

## 3. 견적서 UI (`src/components/Product/Estimate.vue`)

- 견적번호(타임스탬프), 견적일자, 유효기간 1개월(고정 문구), 회사 정보/도장 이미지
- 행 구성: 상품(옵션 텍스트 포함) / └ 디자인비 / └ 추가상품 / 배송비 / 쿠폰할인 / 총액
- `priceInfo` 구조: `productPrice`(할인 후), `originalPrice`, `totalprice`, `shippingPrice`,
  `additionals{items,total}`, `discountInfo{rate,amount,기간}`, `options`(인쇄방식별 가격)

## 4. 고객에게 보이는 주문 상태

- 주문 목록에서 표시하는 것은 `pay_status`(입금대기/결제완료/주문취소) 수준 (`src/components/Me/Order.vue`)
- 제작 공정(delivery_status의 DESIGN/PRINT)은 주문 상세의 배송 정보와 디자인 확인 페이지를 통해 간접 노출
- → 고객이 "지금 내 주문이 어느 공정인지" 한눈에 보는 UI는 약함 (챗봇/주문관리 기획 포인트)

## 5. 상담 접점

- ChannelIO 위젯: `src/assets/js/ChannelService.js` — 우하단 채팅, 이력은 채널톡 SaaS에만 존재
- 문의 게시판: POST /inquiry, /posts — 답변은 게시판에서 확인
- 이용가이드(`/support/guide`): 파일 규격/주문 방법 등 카테고리별 안내 → 챗봇 지식베이스 소스 후보

## 6. 한계 (고객 관점)

1. 임베디드 디자인 에디터 없음 — 템플릿 선택 + 파일 업로드만 (에디터는 별도 프로젝트)
2. 원고 업로드 시 페이지수/규격 자동 검증·산정 없음 — `page` 옵션은 고객 수기 입력
3. 디자이너와의 소통은 코멘트 스레드 단방향 왕복 — 실시간성/버전 비교 없음
4. 비회원 주문 흐름과 회원 흐름이 이원화 (`/guest/**`)
