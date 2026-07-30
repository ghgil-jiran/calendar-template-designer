# 07. DB 스키마 (실제 추출 · ground truth)

실제 운영 DB에서 뽑은 스키마(`mysqldump --no-data`)를 정리한 문서. 02 도메인 모델이 코드에서 "추론"한 부분을 이 문서가 **실측값으로 교정**한다.

- DB: **MariaDB 10.4** (server 5.5.5-10.4.25), DB명 `school`, 엔진 InnoDB
- **42개 테이블**, 데이터 제외(구조만), 개인정보 없음
- 추출일: 2026-07-03

## 이 스키마를 대하는 법 (참고자료 · 연동)

각 신규 플랫폼(AI챗봇·주문관리·페이지산정·디자인허브)은 **대개 자체 API·DB를 새로 만든다**(스타터 모델: 자체 `/api/*` + 자체 DB). 그리고 **기존 schoolp API를 필요한 부분만 연동**한다. 예: 디자인허브가 기존 **주문 API를 호출**해 주문을 보여주기.

그래서 이 스키마(07)는 **레거시를 확장하는 설계도가 아니라 참고자료**다:

- **(1) 도메인 이해** — 데이터가 실제 어떤 구조인지 파악한다.
- **(2) 연동 설계** — 어떤 기존 데이터를 어떤 기존 API로 가져다 쓸지(예: 주문 조회) 판단한다.
- **(3) 새 계약 검토** — 새 서비스의 `/api/*` 목 계약과 Supabase migration/seed가 기존 용어를 심하게 오해하지 않았는지 비교한다.

지킬 것:

- 신규 서비스의 화면 흐름, `/api/*` 목 계약, Supabase migration/seed는 **새 서비스 요구사항으로 새로 설계**한다. 07의 테이블·컬럼·enum을 그대로 복사하지 않는다.
- **각 플랫폼의 데이터는 그 플랫폼의 자체 DB**에 둔다. 07의 테이블을 직접 확장하지 않는다.
- 기존 schoolp 데이터는 **직접 DB 접근이 아니라 기존 API로 연동**한다 (공식 API 계약이 있을 때. 없으면 스타터 규칙대로 `/api/*` 목 route로 개발 → `AI_START_HERE.md`).
- 기존 schoolp **시스템 자체가** 새 걸 저장/노출해야 하는 **드문 경우에만**, 레거시 스키마 변경을 확정하지 말고 `HANDOFF.md`에 **제안**으로 올린다(개발자 검토 후 반영).
- **세부 스키마·API 설계는 각 플랫폼 담당 팀원이 자기 프로젝트에서** 진행한다. 07은 그 출발점 참고자료다.

## 0. 먼저 알아야 할 레거시 특성 (전 테이블 공통)

이걸 모르면 잘못 설계한다:

- **외래키(FK)가 하나도 없다.** 테이블 관계는 DB가 강제하지 않고 **컬럼명·애플리케이션 코드로만** 연결된다. (예: `order_item.ORDER_ID` ↔ `order.ORDER_ID`) → 조인·정합성은 코드 책임.
- **상태값이 대부분 `enum`이 아니라 `varchar` + COMMENT**다. 즉 실제 허용값은 스키마가 아니라 **코드/주석**에 있다. (아래 각 표의 "값"은 COMMENT + 코드 확인 결과)
- **컬럼 대소문자 혼용**: 대부분 대문자(`ORDER_ID`)인데 후기 추가분은 소문자(`discount_amount`, `coupon_id`, `editor_project_id`, `slot_code`). 한 테이블 안에 섞여 있다.
- **charset/collation 혼용**: utf8 / utf8mb4 / utf8_bin / utf8mb4_bin 이 테이블·컬럼마다 다르다. (`order`는 utf8mb4, 대부분은 utf8)
- **감사 컬럼 패턴**: 거의 모든 테이블에 `TRASH`(char1, 논리삭제 Y/N), `CREATE_USER/CREATE_DATE/MODIFY_USER/MODIFY_DATE`. 아래 표에서는 생략한다.
- **"삭제 예정" 레거시 컬럼 다수**: `order_item.DELIVERY_ID`, `order_item.ORDER_DELIVERY_ID`(주석 "이름 변경 예정"), `product.DELIVERY_GROUP`, `product.ALLOW_BUNDLED_DELIVERY` 등. 새로 만들 땐 쓰지 말 것.
- **참조 테이블 누락**: `product.DELIVERY_TYPES_ID`가 `delivery_types.id`를 참조한다고 주석에 있으나, 이 덤프엔 `delivery_types` 테이블이 없다(다른 DB이거나 미생성). 확인 필요.

---

## 1. 주문 · 결제

### `order` (주문, PK `ORDER_ID` varchar36)
- 식별/스토어: `USER_ID`('GUEST' 가능), `STORE_ID`, `STORE_ORDER_ID`, `STORE_USER_ID`, `SCHOOL_ID`, `SCHOOL_NAME`
- 수령/배송지: `RECEIVER_NAME/EMAIL/TEL/PHONE`, `POSTCODE`, `ADDRESS1/2`, `EXTRA_ADDRESS`, `SHIPPING_MESSAGE`
- 금액: `TOTALPRICE`, `discount_amount`, `coupon_id`
- **`PAY_METHOD`** varchar20 — 값 **`card`(카드결제) / `deposit`(무통장입금·계좌이체)**. ⚠️ 02 문서의 `transfer`는 오류 → 실제는 `deposit`.
- **`PAY_STATUS`** varchar20 — 값 `pending`, `ready`, `complete`, `cancel`, `exchange`, `refund` (코드 확인). enum 아님.
- **`RECEIPT_TYPE`** varchar20 — 세금계산서/현금영수증. ⚠️ **스키마 주석은 `CASH_RECEIPT`(단수), 코드는 `CASH_RECEIPTS`(복수)로 불일치.** 앱은 `CASH_RECEIPTS`/`TAX_BILL` 사용. null 가능.
- 기타: `PAY_DATE`, `RECEIPT_URL`, `INVOICE_DATE`(int), `NOTES`(관리자 메모)

### `order_delivery` (배송 번들, PK `DELIVERY_ID` varchar36)
- `ORDER_ID`, `TOTALPRICE`, `SHIPPING`, `shipping_discount`
- 배송: `SHIPMENT_COMPANY`, `TRACKING_NUMBER`, `TRACKING_URL`, `INVOICE_DATE`(datetime)
- **`DELIVERY_STATUS`** varchar10 — **이게 실제 제작·배송 공정 상태**다. 값 `READY`→`DESIGN`→`PRINT`→`DELIVERY`→`COMPLETE` (관리자 UI 드롭다운·컨트롤러 확인).
- 알림톡: `CMSGID`(메세지키), `LAST_MSG_DATE`

### `order_item` (주문 라인, PK `ITEM_ID` int) — ★핵심
- 연결: `ORDER_ID`, `ORDER_DELIVERY_ID`(주석 "이름 변경 예정"), `PRODUCT_ID`, `CART_ID`, `MERGE_CART_ID`(디자인 의뢰 병합), `BUNDLE_GROUP_ID`
- 상품 스냅샷: `PRODUCT_NAME`, `STORE_PRODUCT_CODE`, `SUBTITLE`, `THUMBNAIL`
- 옵션/템플릿(JSON longtext): `OPTIONS`, `OPTIONS_TEXT`, `ADDITIONAL_OPTIONS`, `ADDITIONALS`, `DESIGN_TEMPLATES`, `TEMPLATE`, `TEMPLATES`(3개 중복 — 레거시), `TEMPLATE_ID`, `editor_project_id`
- 금액: `PRICE`, `COUNT`, `TOTALPRICE`, `discount_amount`, `SHIPPING`, `CHARGE_METHOD`
- **`STATUS`** varchar10 — ⚠️ 실제 값 **`request`(주문접수) / `design`(디자인진행) / `print`(인쇄중) / `complete`(작업완료)** (컬럼 주석). 02 문서의 draft/submitted/in_progress 등은 오류.
- **`DESIGN_STATUS`** varchar10 — 실제 `COMPLETE`(그 외 null). 세분화된 디자인 상태는 없음.
- **`DELIVERY_STATUS`** **char(1)** — 레거시 `P`(준비중)/`T`(배송중)/`D`(완료). ⚠️ 위 `order_delivery.DELIVERY_STATUS`(varchar, READY/…/COMPLETE)와 **다른 필드**다. 관리자 UI가 쓰는 건 order_delivery 쪽이고, 이 char(1)은 옛 필드.
- 디자인/발주: `DESIGNER`(varchar32, 디자이너 ID — 값 기록 로직은 코드에 거의 없음), `DUE_DATE`, `PLACE_ORDER`(발주가능 Y/N), `IS_PLACE_ORDER`(발주됨 Y/N)

### `order_item_file` (원고/시안/최종 파일, PK `FILE_ID` int)
- `FILE_NAME`(해시), `FILE_ORIGIN_NAME`, `FILE_EXT`, `FILE_SIZE`, `CART_ID`(연결키 — item_id 아님), `FK_FILE_ID`
- **`FILE_SECTION`** varchar20 — 주석 "원고, 디자인시안, 최종본" → 앱 값 `manuscript`/`draft`/`final`
- **`CATEGORY`** varchar20 — 주석 "표지, 내지, 로고, 참고파일 등"
- ★페이지산정: 고객 원고가 여기 쌓인다(정답 라벨의 원천).

### `cart` (장바구니, PK `CART_ID` int)
- `order_item`과 거의 같은 스냅샷 구조 + `GUEST_TOKEN`/`GUEST_TOKEN_EXPIRE`(비회원), `MERGE_CART_ID`
- 옵션 JSON: `OPTIONS`, `ADDITIONAL_OPTIONS`, `DESIGN_TEMPLATES`, `ADDITIONALS`

### `payments` (아임포트 결제 원장, PK `imp_uid` varchar36)
- `merchant_uid`, `pay_method`, `pg_provider`, `channel`, `amount`, `cancel_amount`, `status`(varchar10: ready/paid/cancelled/failed), `paid_at`, `cancelled_at`, `cancel_reason`, `receipt_url`, buyer_* 필드
- `imp_uid` 컬럼 COMMENT에 아임포트 응답 JSON 스키마 전문이 참고로 박혀 있음.

### `private_payment` (수동/비공개 결제, PK `PAYMENT_ID` int)
- 관리자가 만드는 별도 결제 건: `USER_NAME`, `USER_PHONE`, `COMPANY_NAME`, `PRODUCT_NAME`, `PRICE`, `SHIPPING`, `DELIVERY_METHOD`, `STATUS`(default 'SELLING')

### 쿠폰 (6개 테이블)
- **`coupon_templates`** (PK id bigint) — 마스터. `discount_type` enum(**`PERCENTAGE`/`FIXED`/`SHIPPING`**), `discount_value`(decimal), `max_discount_amount`, `min_order_amount`, `min_order_target_type` enum(NONE/ALL/CATEGORY/PRODUCT), `target_type` enum(ALL/FIRST_PURCHASE/REPURCHASE/TARGETED/NEW_USER), `applicable_target_type` enum(ALL/CATEGORY/PRODUCT), `issue_method` enum(DOWNLOAD/IMMEDIATE/CODE/NEW_USER_AUTO), 발급/사용 기간, `issue_quantity`/`remain_quantity`, `template_code`, `is_active`, `is_deleted`
- **`coupons`** (PK id bigint) — 인스턴스. `template_id`, `coupon_code`(UNIQUE), **`status` enum(`AVAILABLE`/`USED`/`EXPIRED`/`PENDING`)** ⚠️ 02의 `CREATED`는 없음. `user_id`, `issue_type`, `issued_at`, `used_at`, `order_id`
- **`coupon_applicable_targets`**: `coupon_template_id`, `target_type` enum(PRODUCT/CATEGORY), `target_id`
- **`coupon_target_users`**: 템플릿별 대상 사용자, `is_issued`
- **`coupon_usage_history`**: `coupon_id`, `user_id`, `order_id`, `discount_amount`, `used_at`, `cancel_yn`
- (마스터=`coupon_templates`, 인스턴스=`coupons`. 02의 `CouponTemplate`/`Coupon` 명칭과 매핑)

### 후기: `order_review`(item별, score1~4, answer_*), `order_review_file`
### `ebooks`: 주문 아이템에서 파생된 전자책(`ORDER_ITEM_ID`, `LIBRARY_BOOK_ID`, `SHORT_URL`, `EXPIRES_AT`)

---

## 2. 상품 · 옵션 · 가격 (★AI챗봇 견적 / 페이지산정)

### `product` (상품, PK `PRODUCT_ID` int)
- 기본: `PRODUCT_NAME`, `CATEGORY_ID`, `SUBTITLE`, `THUMBNAIL`, `TAGS`, `CONTENT_TYPE`(img/iframe)
- 가격: `PRICE`, `ADDED_COST`, `DISCOUNT_PRICE`(직접지정), `DISCOUNT_PERCENTAGE`, 할인기간, 판매기간(`SALES_START/END_DATE`)
- 배송: `SHIPPING`, `SHIPPING_REPEAT_PRICE`, `SHIPPING_REPEAT_QUANTITY`, `BUNDLE_GROUP_ID`, `DELIVERY_DAYS`, `DELIVERY_TYPES_ID`(→ 누락 테이블 참조)
- **`STATUS`** varchar10 default 'SELLING' — 값 `STANDBY`/`SELLING`/`OUT`/`STOP`/`END`
- **`PRICE_CALC_METHOD`** enum(**`RAW`/`CUSTOM`/`REMOTE`**) — ⚠️ 02의 fixed/option_based/… 는 오류. **`REMOTE`= 외부 API 요청으로 금액 산출.** ★페이지산정 도구가 붙을 수 있는 지점(상품 가격을 외부 API로 계산하는 구조가 이미 있음).
- `CALC_PRICE`(Y/N), `PURCHASE_METHOD` enum(GENERAL/SHEET — SHEET=인쇄/출력물 시트 플로우), `use_editor`(Y/N), `SUPPORT_EBOOK`, `PLACE_ORDER`(인쇄톡 발주상품)
- 안내문: `FILEUPLOAD_DESCRIPTION`, `PLACE_ORDER_DESCRIPTION`, `REMARK_DESCRIPTION`

### `product_category` (PK `CATEGORY_ID` int)
- `PARENT_ID`(계층), `CATEGORY_NAME`, `CATEGORY_PATH`, `DEPTH`, `HAS_LEAF`

### `product_option` (옵션, PK `OPTION_ID` int)
- `PRODUCT_ID`, `OPTION_CODE`, `OPTION_NAME`, `OPTION_TYPE`(varchar — select/multi_select/text/number/date/image_upload 계열), `OPTION_SECTION`, `GROUP_NAME`
- 숫자형: `MIN_VALUE`, `MAX_VALUE`, `NUMBER_STEP`, `UNIT_NAME`
- `DEFAULT_VALUE`, `IS_REQUIRED`, `COMPONENT_NAME`, `metadata`(고급옵션 JSON), `PRICE`, 툴팁, `YN_USE`

### `product_option_item` (옵션 선택지, PK `KEY` int)
- `OPTION_ID`, `ITEM_CODE`, `ITEM_NAME`, `PRICE`, `OPTION_GROUP_CODE`(같은 그룹 중 하나만 선택; NULL이면 체크박스식 독립)
- **`PRICING_MODEL`** enum(**`FIXED`/`PRODUCT_QUANTITY`/`ITEM_QUANTITY`**) default PRODUCT_QUANTITY — ⚠️ 02의 fixed/per_unit/tiered 오류.
- **`DISABLE_OPTIONS`** — 이 선택지 선택 시 disable할 옵션코드들(콤마 구분)

### `product_option_rules` (옵션 연동 룰, PK `RULE_ID` int) — 견적 UI 제어
- `CONDITION_OPTION_CODE`, `CONDITION_ITEM_CODE`, **`ACTION_TYPE`** enum(**`HIDE_OPTION`/`HIDE_ITEM`/`SET_DEFAULT_VALUE`/`SET_MIN_VALUE`/`SET_MAX_VALUE`/`SET_STEP_VALUE`**) — ⚠️ 02의 SHOW/HIDE/DISABLE/ENABLE/SET_OPTIONS 오류.
- `TARGET_OPTION_CODE`, `TARGET_ITEM_CODE`, `RULE_GROUP`(AND 그룹), `PRIORITY`(낮을수록 먼저), `IS_ACTIVE`
- CHECK 제약: HIDE_ITEM이면 TARGET_ITEM_CODE 필수.

### `product_price_rules` (가격 계산 룰, PK `RULE_ID` int) — ★견적 핵심
- `CONDITION_OPTION_CODE`(총액 조건 시 특수코드 사용), **`CONDITION_OPERATOR`** enum(`equals`/`not_equals`/`greater_than`/`less_than`/`between`/`contains`), `CONDITION_VALUE`, `CONDITION_VALUE_TO`(between 상한)
- **`PRICE_ACTION`** enum — ⚠️ 실제 값(02 교정): **`ADD_FIXED`(고정추가) / `ADD_PER_UNIT`(수량당) / `ADD_PER_OPTION_UNIT`(옵션값당) / `DISCOUNT_RATE`(할인율) / `SET_FIXED_PRICE`(고정단가) / `SET_SHIPPING_FIXED` / `ADD_SHIPPING_FIXED` / `SET_SHIPPING_PER_UNIT` / `ADD_SHIPPING_PER_UNIT`**
- `AMOUNT`(decimal, 비율이면 %), `THRESHOLD`, `PRIORITY`, `VALID_FROM/TO`, `RULE_GROUP`
- CHECK 제약: between이면 CONDITION_VALUE_TO 필수.

### 부가
- `product_additional_item`: 추가상품(`ITEM_CODE`, `ITEM_NAME`, `PRICE`, 배송비 반복)
- `product_bundle_group`: 배송 묶음그룹, `CHARGE_METHOD`(MIN/MAX)
- `product_fileupload_item`: **상품별 파일 업로드 규칙** — `ACCEPTED_FILES`(허용 파일), `UPLOAD_LIMIT`(개수), `MAX_FILE_SIZE`, `MAX_PIXEL_SIZE`. ★페이지산정: 상품마다 원고 업로드 제약이 여기 정의됨.
- `product_related_image`: 상세 이미지

---

## 3. 디자인 · 템플릿 (★디자인허브 / 페이지산정)

⚠️ **중요: `design` / `design_file` 테이블은 없다.** 02·03 문서가 언급한 Design/DesignFile은 실제 DB에 테이블이 없다. 디자인 도메인은 아래로 구성된다:

### `product_design_slot` (상품 디자인 슬롯 메타, PK `product_id`+`slot_code`) — ★신규 발견, 디자인허브 핵심
- `slot_code`(cover/body/main/front/back 등), `label`(UI 라벨, 예: 표지/본문)
- **3가지 제작 모드 허용 플래그**: `allow_template_based`(템플릿 제작), `allow_design_agent`(**디자인 의뢰**), `allow_file_upload`(파일 업로드) — 각 tinyint(1)
- `display_order`
- → 상품마다 "표지/본문 등 슬롯"과 각 슬롯에서 허용되는 3모드(템플릿/의뢰/업로드)를 정의. **디자인허브·페이지산정 기획의 핵심 구조.**

### `product_design_item` (디자인 항목, PK `ITEM_ID` int)
- `PRODUCT_ID`(메인상품), `DESIGN_PRODUCT_ID`(참조할 디자인 상품), `TEMPLATE_CATEGORY_ID`(템플릿 목록 카테고리), `slot_code`, `is_default`
- `DESIGN_TYPE`, `INTERACTION_MODE`, `MAX_TEMPLATE_SELECTION`, `PRICE`, `IS_REQUIRED`

### `design_comment` (디자인 교정 코멘트, PK `COMMENT_ID` int) — 시안 피드백 루프
- `ITEM_ID`(order_item), `PARENT_ID`(답글 재귀), `TITLE`, `CONTENT`, `STATUS`(varchar10), 첨부(`FILE_NAME`/`FILE_ORIGIN_NAME`/`STORAGE_ID`)
- → 고객↔디자이너 수정요청 스레드. (관리자 UI에서 이걸 다루는 화면은 확인 안 됨)

### `product_template` / `product_template_combinations`
- `product_template`: 상품 디자인 템플릿(`CATEGORY_ID`, `TARGET_URL`(에디터 진입), `EDITOR_TEMPLATE_ID`, `PRICE`, `HIT_COUNT`, `IS_OPENED`)
- `product_template_combinations`: 템플릿 조합(`parent_id`, `template_id`, `quantity`, `sort_order`)

**디자인 상태·디자이너·시안파일**은 테이블이 아니라 `order_item`(DESIGN_STATUS/DESIGNER/DUE_DATE) + `order_item_file`(draft/final) + `design_comment`에 흩어져 있다. → 디자인허브는 이걸 정식 모델로 승격하는 게 첫 과제(02 6장과 동일 결론, 실측으로 확인).

---

## 4. 콘텐츠 · 파일 · 사용자 · 기타

- `post` / `post_file`: 게시판(`BOARD_ID`, `PARENT_ID`, `IS_SECRET`/`PASSWORD`, `STATUS`, `POST_CATEGORY`). 문의게시판 board_id=2.
- `faq` / `faq_group`: FAQ
- `banner`(`STATUS` default ACTIVE), `event`(`EVENT_METHOD`: DEFAULT/COMPONENT/TARGET), `holiday`(영업일 계산용)
- `file` / `file_storage`: 중앙 파일 메타 + 저장소 설정
- `cmsg_report`: 문자/알림톡 발송 리포트(`CMSGID`, `RESULT`)
- `user`: 회원(`USER_ID` UNIQUE, `PASSWORD`, `PHONE`, `EMAIL`, `PRIVILEGE`, `STATE` default ACTIVE, `LOGIN_SITE`, refresh token 등). ※ member 도메인은 이번 분석 범위 밖이지만 테이블은 존재.
- `user_address`: 배송지 주소록

---

## 5. 신규 4개 플랫폼 관점 핵심 테이블

| 플랫폼 | 봐야 할 테이블 |
|---|---|
| **AI챗봇(견적/상담)** | `product`, `product_option`, `product_option_item`, `product_option_rules`, `product_price_rules`(실제 enum 위 참조), `product.PRICE_CALC_METHOD`(REMOTE 존재) |
| **주문관리 고도화** | `order`, `order_delivery`(공정 상태 READY→…→COMPLETE), `order_item`(status request/design/print/complete), `order_item_file`, `payments`, `cmsg_report`(알림톡) |
| **디자인 페이지 산정** | `order_item_file`(원고=라벨원천), `product_fileupload_item`(업로드 규칙), `product_design_slot`(슬롯/모드), `product.PRICE_CALC_METHOD=REMOTE`(가격 외부계산 연결점), `order_item.OPTIONS`의 page 값 |
| **디자인허브** | `product_design_slot`(★슬롯/3모드), `product_design_item`, `design_comment`, `order_item`(DESIGN_STATUS/DESIGNER/DUE_DATE), `product_template*` |

## 6. 02 문서에 적용한 교정 요약

- `pay_method`: ~~card/transfer~~ → **card / deposit**
- `order_item.status`: ~~draft/submitted/in_progress/delivery/complete~~ → **request / design / print / complete**
- `coupon.status`: ~~CREATED/AVAILABLE/USED/EXPIRED~~ → **AVAILABLE / USED / EXPIRED / PENDING**
- `product.price_calc_method`: ~~fixed/option_based/quantity_based/hybrid~~ → **RAW / CUSTOM / REMOTE**
- `ProductOptionItem.pricing_model`: ~~fixed/per_unit/tiered~~ → **FIXED / PRODUCT_QUANTITY / ITEM_QUANTITY**
- `product_option_rules.action_type`: ~~SHOW/HIDE/DISABLE/ENABLE/SET_OPTIONS~~ → **HIDE_OPTION / HIDE_ITEM / SET_DEFAULT_VALUE / SET_MIN_VALUE / SET_MAX_VALUE / SET_STEP_VALUE**
- `product_price_rules.price_action`: ~~SET_PRICE_FIXED 등~~ → **ADD_FIXED / ADD_PER_UNIT / ADD_PER_OPTION_UNIT / DISCOUNT_RATE / SET_FIXED_PRICE / SET_SHIPPING_FIXED / ADD_SHIPPING_FIXED / SET_SHIPPING_PER_UNIT / ADD_SHIPPING_PER_UNIT**
- 디자인: `Design`/`DesignFile` 테이블 없음 → `design_comment` + `product_design_slot`/`product_design_item` + `order_item` 필드로 정정. **`product_design_slot`(슬롯별 템플릿/의뢰/업로드 3모드)** 신규 반영.
- `receipt_type`: 스키마 주석 `CASH_RECEIPT`(단수) vs 코드 `CASH_RECEIPTS`(복수) 불일치 명시.
