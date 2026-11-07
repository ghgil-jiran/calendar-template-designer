# 03. schoolp-api (백엔드) 상세

- 위치: `/Users/mac/workspace/schoolp/schoolp-api`
- 스택: PHP + Slim Framework 3, Illuminate Database(Eloquent 쿼리빌더), JWT(tuupola/slim-jwt-auth), AWS SDK(S3), PHPSpreadsheet, Monolog
- 구조: `app/Models`(46개 모델) / `app/Controllers`(회원·Guest·Admin·Store 네임스페이스) / `app/Services` / `app/Library` / `app/Commands`(배치) / `app/config/routes.php`
- 응답 포맷: `{ success, message, errors, data }`

## 1. 모델 전체 목록 (app/Models/)

```
주문:   Order, OrderItem, OrderDelivery, OrderItemFile
디자인: Design, DesignComment, DesignFile
상품:   Product, ProductCategory, ProductOption, ProductOptionItem,
        ProductOptionRule, ProductPriceRule, ProductAdditionalItem,
        ProductDesignItem, ProductTemplate, ProductTemplateCombinations, ProductRelatedImage
장바구니/결제: Cart, Payments, PrivatePayment
쿠폰:   CouponTemplate, Coupon, CouponApplicableTarget, CouponTargetUser,
        CouponTargeting, CouponUsageHistory
콘텐츠: Post, PostFile, Faq, FaqGroup, Banner, Event, Inquiry, Review, ReviewFile
기타:   User, Category, Books, EBook, Files, FileStorage, Holidays, Stats, CMSGReport, BaseModel
```

## 2. 주요 엔티티 필드

### Order (`app/Models/Order.php`)
`order_id`, `user_id`(비회원은 'GUEST'), `store_id`/`store_order_id`/`store_user_id`(외부 스토어 중개),
`school_id`/`school_name`, 수령자(`receiver_name/email/tel/phone`), 주소(`postcode/address1/address2/extra_address`),
`totalprice`, `discount_amount`, `pay_method`(card/transfer), `pay_status`, `pay_date`,
`receipt_type`(TAX_BILL/CASH_RECEIPTS/null), `receipt_url`, `coupon_id`, `shipping_message`, `notes`(관리자 메모), `trash`

### OrderItem (`app/Models/OrderItem.php`)
주문 시점의 상품 스냅샷 + 3축 상태를 가진 중심 엔티티.

- 상품 스냅샷: `product_id`, `product_name`, `subtitle`, `thumbnail`, `description`, `store_product_code`
- 옵션: `options`(JSON), `options_text`, `additional_options`(JSON), `additionals`(JSON, 추가상품), `remark`(고객 요청사항)
- 금액: `price`(단가), `count`(부수), `totalprice`, `discount_amount`, `shipping`, 파생 `final_price = totalprice - discount_amount`
- 상태: `status`, `design_status`, `delivery_status` (→ 02 문서 참고)
- 디자인/제작: `designer`(미사용 예약 필드), `due_date`, `templates`, `editor_project_id`
- 연결: `cart_id`(원고 파일 연결 키), `merge_cart_id`(디자인 의뢰 상품 병합), `order_delivery_id`
- 배송비 번들: `bundle_group_id`, `charge_method`(SUM/MAX/MIN)
- 발주: `is_place_order`

### OrderDelivery (`app/Models/OrderDelivery.php`)
배송 번들 단위: `delivery_id`, `order_id`, `totalprice`, `shipping`, `shipping_discount`,
`shipment_company`, `tracking_number`, `tracking_url`, `delivery_status`(기본 'READY'),
`invoice_date`, `cmsgid`(문자발송 ID), `last_msg_date`

### OrderItemFile (`app/Models/OrderItemFile.php`)
`file_id`, `cart_id`(연결 키), `file_name`(해시 저장명), `file_origin_name`, `file_ext`, `file_size`,
`file_section`(manuscript/draft/final/reference), `category`(표지/내지 등), `comment`, `description`, `fk_file_id`
- 저장 경로: `uploads/{user_id}/{file_name}/{file_origin_name}`
- 1년 경과 파일 만료 조회 로직 존재 (`findExpiredFiles`)

### Design / DesignComment / DesignFile
- `Design`: `design_id`, `item_id`, `group_id`, `storage_id`, `status`, `comment`
- `DesignComment`: `comment_id`, `item_id`, `parent_id`(답글 재귀), `title`, `content`,
  `status`(open/resolved/closed), 첨부(`file_name`, `file_origin_name`, `storage_id`)
- `DesignFile`: `design_file_id`, `design_id`, `file_category`, `file_url`

### Product 계열 → 02 문서 3장 참조
추가 참고 필드 (Product): `calc_price`(옵션 계산 여부), `price_calc_method`, `delivery_days`(납기일수),
`use_editor`, `support_ebook`, `place_order`(Y/N)+`place_order_description`,
`fileupload_description`(파일 업로드 안내문), `discount_percentage/price/start_date/end_date`,
상태 `status`(selling/standby/out/stop/end)

### Cart (`app/Models/Cart.php`)
OrderItem과 거의 동일한 스냅샷 구조 + `guest_token`/`guest_token_expire`(비회원),
`merge_cart_id`(디자인 의뢰 병합). 주문 생성 시 Cart → OrderItem 복사, 파일은 `cart_id`로 계속 연결.

### Payments (`app/Models/Payments.php`)
아임포트 결제 원장: `imp_uid`, `merchant_uid`, `pay_method`, `pg_provider`, `amount`, `cancel_amount`,
`status`(ready/paid/cancelled/failed), `paid_at`, `cancelled_at`, `cancel_reason`, `receipt_url`, buyer_* 필드

### Coupon 계열 → 02 문서 3.4 참조
`CouponTemplate`(마스터: 할인타입/값/상한/최소주문/대상범위/발급수량/기간) → `Coupon`(인스턴스:
`coupon_code`, `user_id`, `status` CREATED/AVAILABLE/USED/EXPIRED) → `CouponUsageHistory`.
쿠폰 할당은 FOR UPDATE 트랜잭션으로 동시성 제어.

### Inquiry (`app/Models/Inquiry.php`)
비회원 가능 상담 폼: `category`, `school_name`, `company_name`, `user_name`, `phone`, `email`,
`title`, `content`, `region`, `budget`, `delivery_date`(희망납기), `opt1/opt2`, 첨부 2개

### Post / Review
- `Post`: `board_id`(2=문의게시판), `parent_id`, `is_secret`+`password`, `post_category`, `status`, `hit_count`
- `Review`: `item_id` 연결, `score1~4`(다중 별점), `answer_*`(관리자 답글), `display_main`(메인 노출)

## 3. 서비스 로직

### ShippingCalculationService (`app/Services/ShippingCalculationService.php`)
- `getBundles()`: 아이템을 `bundle_group_id`로 묶어 배송비 계산
- `calculateGroupShipping()`: 그룹 정책(SUM/MAX/MIN) 적용
- 반복 구간: `count`가 `shipping_repeat_quantity` 초과 시 `ceil(초과분/단위) × shipping_repeat_price`
- `applyTotalAmountShippingRule()`: `condition_option_code='__total_amount'`인 ProductPriceRule 평가,
  복수 매칭 시 고객에게 유리한(임계 높은) 규칙 선택
- 추가상품 배송비 별도 합산

### CouponDiscountService (`app/Services/CouponDiscountService.php`)
- `isAvailable()`: 기간 + 최소주문액(`min_order_target_type` 범위로 계산) + 적용가능 번들 검증
- `calculateDiscount()`: PERCENTAGE(10원 단위 내림, max_discount_amount 상한) / FIXED / SHIPPING(번들별 비례 분배)
- `calculateItemDiscounts()`: 할인액을 아이템별로 분배 (부분취소 대비)

### 배치 (`app/Commands/`)
- `BatchDeliveryCompletion.php`: 배송 상태 자동 전환 (PRINT→DELIVERY→COMPLETE 계열)
- 파일 만료 삭제 등

## 4. 주요 API 엔드포인트

라우팅: `app/config/routes.php`. 인증: `Authorization: Bearer {JWT}`.

### 고객 (App\Controllers)
```
GET/POST        /orders                      주문 목록/생성
GET/PATCH       /orders/{order_id}           주문 상세/수정
GET             /orders/{order_id}/items
GET/POST        /orders/{order_id}/items/{item_id}/files    원고 파일
GET/PATCH       /designs/{design_id}         디자인 조회/상태 변경 (COMPLETE 시 팀 알림)
POST            /designs/{design_id}/auth    디자인 접근 권한 확인
POST            /designs/{design_id}/comments 피드백 작성
GET             /products, /products/{id}, /products/{id}/options
POST            /products/calc-price         실시간 견적 계산 (★)
GET             /product-templates (+/recommend-keywords, /{id}/hit)
GET/POST/PATCH  /cart/items/**               장바구니
GET/POST        /coupons, /coupons/available, /coupons/{id}/download
GET/POST        /reviews/**
POST            /inquiry                     상담 폼
GET             /faqs, /posts, /events, /banners, /ebooks
```

### 비회원 (App\Controllers\Guest)
```
/guest/cart/items/**     guest_token 기반 장바구니
/guest/orders/**         주문 생성/조회 (이메일 인증)
```

### 관리자 (App\Controllers\Admin) — 05 문서의 호출 목록과 대응
```
/admin/orders/**                 주문 CRUD, 상태변경, 아이템/파일/배송 관리
/admin/orders/{id}/place         인쇄톡 발주
/admin/orders/{id}/message       알림톡 발송
/admin/products/**, /admin/posts/**, /admin/stats/**
```

### 스토어 (App\Controllers\Store, Store\v1)
외부 파트너(JAJAK 등) 주문 중개용 별도 API.

## 5. 도메인 무결성 규칙

- 주문 생성 트랜잭션: Order → OrderDelivery → OrderItem 생성, Cart 삭제, Coupon 사용 처리
- 소프트 삭제 일관 적용 (`trash='Y'`), 물리 삭제 없음
- 개인정보 마스킹: Review/Post 조회 시 이름·이메일 SQL 레벨 마스킹
- DB 마이그레이션 파일 없음 — 테이블 구조는 모델 쿼리로부터 유추 (스키마 변경 이력 추적 불가)
