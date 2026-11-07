# 02. 핵심 도메인 모델

엔티티 관계, 상태 머신, 가격 계산, 파일/디자인 흐름의 **현재(as-is) 구조**를 정리한다.
여기 나오는 상태값·구조는 개선 작업에서 바뀔 수 있는 대상이며, 새 설계의 제약이 아니다 —
"기존 데이터가 이 형태로 쌓여 있고, 기존 화면·배치가 이 값에 의존한다"는 마이그레이션 기준점으로 읽으면 된다.
파일 경로는 `schoolp-api/` 기준(별도 표기 없으면).

> **실측 DB 스키마와 상태값/enum의 ground-truth 교정은 [07-db-schema.md](07-db-schema.md)를 따른다.** 이 문서(02)의 값 중 일부는 코드 추론이었고, 07이 실제 추출값으로 교정했다(pay_method, order_item 상태, 가격/옵션 룰 enum, 디자인 테이블 등).

## 1. 엔티티 관계 (큰 그림)

```
User ─┬─ Cart ──────────────┐ (주문 시 스냅샷 복사)
      │                     ▼
      └─ Order 1 ─── N OrderDelivery (배송 번들: 배송비/송장/배송상태)
              │                │
              └──── N OrderItem (주문 라인: 상품 스냅샷 + options JSON)
                        │  ├── N OrderItemFile (원고/시안/최종 파일, cart_id로 연결)
                        │  ├── N DesignComment (고객↔디자이너 피드백, parent_id 재귀)  ※ design/design_file 테이블은 없음(07)
                        │  └── N Review (구매 후기)
                        ▼
                    Product ─┬─ N ProductOption ── N ProductOptionItem (선택지+가격)
                             ├─ N ProductAdditionalItem (추가상품)
                             ├─ N ProductPriceRule  (가격/배송비 규칙)
                             ├─ N ProductOptionRule (옵션 연동 규칙: HIDE_OPTION/HIDE_ITEM 등)
                             ├─ N ProductTemplate   (디자인 템플릿, 에디터 연동)
                             ├─ N ProductDesignItem (디자인 의뢰 상품 구성)
                             └─ ProductCategory (parent_id 계층 + category_path)

CouponTemplate ── N Coupon ── CouponUsageHistory
Payments (아임포트 결제 원장, merchant_uid ↔ 주문 매칭)
Inquiry / Post(+PostFile) / Faq — 상담·게시판 (주문과 직접 연결 없음)
```

전 엔티티 공통: `trash`('Y'/'N') 소프트 삭제, `create_date`/`modify_date`.

## 2. 상태 머신 (검증됨)

주문 하나에 **결제 상태 / 제작·배송 상태 / 디자인 상태** 3개 축이 병렬로 존재한다.
이 3축 구조가 주문관리자·디자인허브·챗봇 기획 전반의 뼈대다.

### 2.1 결제 상태 — `order.pay_status`

| 값 | 의미 | 비고 |
|---|---|---|
| `pending` | 카드 결제 시작 직후 | (추정: 카드 결제 초기값 분기 존재) |
| `ready` | 입금대기 | 계좌이체 주문 기본값 |
| `complete` | 결제완료 | |
| `cancel` | 주문취소 | |
| `exchange` / `refund` | 교환/환불 | 주로 관리자 목록 필터 값으로 사용 |

- 결제수단 `pay_method`: `card` / `deposit`(무통장입금·계좌이체). 지출증빙 `receipt_type`: `TAX_BILL` / `CASH_RECEIPTS` / null (스키마 주석은 단수 `CASH_RECEIPT`이나 앱 코드는 `CASH_RECEIPTS`)
- 관리자에서 드롭다운으로 직접 변경: `PATCH /admin/orders/{orderId}`

### 2.2 제작·배송 상태 — `delivery_status` (핵심 파이프라인)

`order_delivery`(배송 번들)와 `order_item` 양쪽에 존재. **제작 공정 전체를 이 하나의 상태로 표현한다.**

| 값 | 관리자 표시명 | 의미 |
|---|---|---|
| `READY` | 주문접수 | 초기 상태 (`app/Models/OrderDelivery.php:48`) |
| `DESIGN` | 디자인 진행 | 시안 작업 중 |
| `PRINT` | 인쇄중 | 인쇄 공정 |
| `DELIVERY` | 배송중 | 송장 등록 후 |
| `COMPLETE` | 배송완료 | |

근거: `schoolp-admin-unified/src/modules/print/pages/orders/detail.js:1077-1081` (드롭다운),
`app/Controllers/OrderDeliveryController.php:44-47`, `app/Commands/BatchDeliveryCompletion.php`(배치로 PRINT→DELIVERY 등 전환).

주의: 자동 전환 트리거가 존재한다 —
**관리자가 시안(draft) 파일을 업로드하면 해당 번들의 delivery_status가 자동으로 `DESIGN`으로 변경**된다
(`app/Controllers/Admin/OrderItemFileController.php:72-90`).

### 2.3 디자인 상태 — `order_item.design_status`

실제 코드에서 사용되는 값은 사실상 **`COMPLETE` / null 두 가지뿐**이다.

- 고객이 시안을 최종 승인하면 프론트가 `design_status: "COMPLETE"`로 PATCH
  (`schoolp-web/src/components/Me/DesignConfirmDetail.vue:303`)
- `COMPLETE`가 되면 API가 **오피스메신저로 내부 팀에 알림** 발송 (`app/Controllers/DesignController.php` edit, `DesignCommentController.php:61`)
- 관리자가 새 시안을 올리면 `design_status`는 **null로 리셋** (재검토 요청 상태로 되돌림)
- 코드 주석에 "추후 delivery_status와 분리하여 개별 상태값 사용하도록 변경" TODO 존재
  (`app/Controllers/Admin/OrderItemFileController.php:75`)

즉 "디자인 진행 단계"라는 세분화된 상태 머신은 **아직 없다**. 디자인허브 기획 시 이 상태 모델 설계가 첫 과제다.

실제 DB에는 `design`/`design_file` 테이블이 **없다**(07 확인). 디자인 데이터는 `design_comment`(order_item별 코멘트) + `product_design_slot`/`product_design_item`(상품 디자인 슬롯·모드) + `order_item`(design_status/designer/due_date)로 흩어져 있다.

### 2.4 디자이너 배정 — 예약 필드만 존재

`order_item.designer` 컬럼이 존재하고 조회 쿼리에 포함되지만(`app/Models/OrderItem.php:21`),
**이 값을 기록·수정하는 컨트롤러가 없다.** 관리자 UI에도 배정 기능이 없다.
→ 디자이너 배정은 스키마 상 자리만 있고 미구현. `due_date`(납기일) 필드도 동일 계열.

## 3. 상품 옵션 · 견적 체계

### 3.1 옵션 구조

`Product → ProductOption → ProductOptionItem` 3단 구조.

- `ProductOption.option_type`: `select` / `multi_select` / `text` / `number` / `date` / `image_upload`
- number형은 `min_value`/`max_value`/`number_step`/`unit_name`("쪽", "부" 등) 보유
- `ProductOptionItem`: 선택지별 `price`(추가금), `disable_options`(이 선택지 고르면 비활성화되는 옵션 목록)
- 대표 옵션 코드 (schoolp-web 기준): `size`(사이즈), `paper`(용지), `jebon`(제본: 무선01/링02/중철03),
  `page`(페이지수), `ea`(부수), `print_method`(digital/offset), 추가옵션 `outer_paper`(면지), `trans_page_color`(부분컬러)

### 3.2 옵션 연동 규칙 — `ProductOptionRule`

조건 옵션/선택지 → 대상 옵션에 `HIDE_OPTION` / `HIDE_ITEM` / `SET_DEFAULT_VALUE` / `SET_MIN_VALUE` / `SET_MAX_VALUE` / `SET_STEP_VALUE` 액션 (실제 enum, 07).
예: 제본 방식에 따라 특정 옵션 비활성화. priority로 평가 순서 제어.

### 3.3 가격 규칙 — `ProductPriceRule`

| 필드 | 설명 |
|---|---|
| `condition_option_code` | 조건이 되는 옵션 코드. **`__total_amount`이면 주문 총액 조건** (예: 5만원 이상 무료배송) |
| `condition_operator` | equals / greater_than / less_than / between / not_equals |
| `price_action` (실제 enum, 07) | `ADD_FIXED` / `ADD_PER_UNIT` / `ADD_PER_OPTION_UNIT` / `DISCOUNT_RATE` / `SET_FIXED_PRICE` / `SET_SHIPPING_FIXED` / `ADD_SHIPPING_FIXED` / `SET_SHIPPING_PER_UNIT` / `ADD_SHIPPING_PER_UNIT` |
| `priority`, `valid_from/to`, `is_active` | 우선순위·유효기간 |

### 3.4 가격 계산 흐름

```
POST /products/calc-price   ← 프론트가 옵션 바뀔 때마다 호출 (실시간 견적)
  단가(price) × 부수(count)
  + 옵션 선택지 추가금 (ProductOptionItem.price)
  + 추가상품 (ProductAdditionalItem)
  ± ProductPriceRule 적용 (priority 순)
  + 배송비 (ShippingCalculationService)
  - 쿠폰 할인 (CouponDiscountService)
```

- **배송비** (`app/Services/ShippingCalculationService.php`):
  기본배송비 + 반복구간 배송비(`shipping_repeat_price`/`shipping_repeat_quantity`, 수량 초과분 ceil 계산)
  + 번들 그룹 정책 `charge_method`(SUM/MAX/MIN) + `__total_amount` 규칙(조건 충족 시 최적 혜택 선택)
- **쿠폰** (`app/Services/CouponDiscountService.php`):
  `discount_type` = `PERCENTAGE`(10원 단위 내림, `max_discount_amount` 상한) / `FIXED` / `SHIPPING`.
  `min_order_target_type`·`applicable_target_type`으로 ALL/CATEGORY/PRODUCT 범위 제한
- **프론트 특수 규칙** (`schoolp-web/src/utils/printMethodRules.js`):
  디지털 전용 상품(product_id 61, 40, 41), 링제본+추가옵션 등 조합은 "별도 견적" 처리로 결제 차단
  → **모든 조합이 자동 견적되는 것이 아니라 상담으로 넘어가는 회색지대가 코드에 하드코딩**되어 있음 (챗봇 기획 시 중요)

## 4. 파일 · 원고 · 디자인 흐름

### 4.1 파일 섹션 — `order_item_file.file_section` (검증됨)

| 값 | 의미 | 업로드 주체 | 관리자 권한 |
|---|---|---|---|
| `manuscript` | 고객 원고 (잡동사니 원본) | 고객 | 읽기 전용(다운로드만) |
| `draft` | 디자인 시안 | 관리자(디자이너) | 업로드/삭제 |
| `final` | 최종 인쇄용 파일 | 관리자 | 업로드/삭제 |
| `reference` | 참고자료 | (소수 사용) | |

- 파일은 `cart_id`로 주문 라인과 연결 (주문 전 장바구니 단계 업로드 이력 유지)
- `category` 필드로 표지/내지 등 구분 (admin: cover-paper / inner-paper 등)
- 저장: `uploads/{user_id}/{해시 파일명}/{원본 파일명}`, 1년 경과 manuscript/draft 자동 삭제 배치 존재
- 고객 업로드 허용 형식 (`schoolp-web/src/components/custom/FileUpload.vue`):
  - print-only 모드: PDF, AI, PSD, INDD, ZIP
  - 일반 모드: PDF, HWP, JPG/PNG, XLS/XLSX, ZIP — **최대 750MB, 5개**
  - → 페이지 산정 도구가 다뤄야 할 입력 형식의 실제 범위

### 4.2 디자인 의뢰 피드백 루프 (현재 구현)

```
고객: 디자인 상품 포함 주문 + manuscript 업로드
  ↓
관리자: draft(시안) 업로드
  → delivery_status 자동 DESIGN, design_status null 리셋
  → 알림톡 발송 (POST /admin/orders/{id}/message, last_msg_date 기록)
  ↓
고객: /me/design/:id 에서 시안 확인
  ├─ 수정 요청: DesignComment 작성 (parent_id 답글 구조, status open/resolved/closed, 파일 첨부 가능)
  └─ 최종 승인: design_status=COMPLETE → 오피스메신저로 팀 알림
  ↓
관리자: final 업로드 → delivery_status PRINT → 인쇄톡 발주(POST /admin/orders/{id}/place)
```

- 디자인 의뢰 상품은 본 상품에 종속: `cart.merge_cart_id` / `order_item.merge_cart_id`로 본 상품 라인과 병합 표시
  (`app/Controllers/CartController.php:59`, `OrderController.php:60`)
- 관리자 응답의 `items[].designs[]` 배열이 이 병합 결과
- **버전 관리 없음**: 시안 v1/v2 구분은 파일 업로드 순서로만 암묵적으로 존재

### 4.3 템플릿 / 에디터

- `ProductTemplate`: 상품별 디자인 템플릿. `target_url`(에디터 진입점), `editor_template_id`, `hit_count`
- `order_item.editor_project_id`: 온라인 에디터(schoolp-editor)로 작업한 프로젝트 연결
- 관리자 에디터 모듈에서 템플릿/그래픽(SVG) 자산 CRUD (`/editor/api/admin/**`)

## 5. 상담 · 문의 도메인 (챗봇 기획 관련)

현재 고객 상담 채널은 4갈래로 분산되어 있고, 주문 데이터와 구조적으로 연결된 것은 없다:

| 채널 | 저장 위치 | 주문 연결 | 비고 |
|---|---|---|---|
| ChannelIO 채팅 | 외부 SaaS | 없음 | 실시간 상담. 이력이 자사 DB에 없음 |
| 문의게시판 (board_id=2) | `post` | 없음 | 답변상태 R(대기)/C(완료), 비밀글, 관리자 리치텍스트 답변 |
| 상담 폼 | `inquiry` | 없음 | 비회원 가능. 학교명/예산/희망납기 등 **견적 상담 필드** 보유 |
| FAQ / 이용가이드 | `faq`, 정적 페이지 | - | 챗봇 지식베이스 1차 소스 후보 |

`inquiry` 테이블의 budget/delivery_date/region 필드는 "맞춤 견적 상담" 수요가 폼으로 들어오고 있다는 증거 —
AI챗봇이 대체할 대상 흐름이다.

## 6. 알려진 격차 (개선 여지 — 재설계 후보)

1. **디자인 공정 상태가 delivery_status에 뭉쳐 있음** — DESIGN 단계 내부(배정→작업→시안→교정→확정)가 표현 불가. 코드에 분리 TODO 존재
2. **디자이너 배정 미구현** — `designer` 컬럼만 존재, 기록 로직·UI 없음. 관리자 역할 구분도 없음(단일 관리자)
3. **시안 버전/교정 이력 없음** — draft 파일 나열 + 코멘트 스레드가 전부
4. **원고 → 페이지수 추정 기능 없음** — `page` 옵션은 고객이 직접 입력. 업로드 파일 분석 로직 전무
5. **상담 이력이 주문과 미연결** — 채널톡(외부)/게시판/폼이 분산, 고객 컨텍스트 통합 불가
6. **견적의 회색지대** — 특정 옵션 조합은 하드코딩으로 "별도 견적" 차단 (`printMethodRules.js`)
