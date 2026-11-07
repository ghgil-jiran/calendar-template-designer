# 01. 시스템 전체 구조

## 서비스 개요

schoolp(우리학교인쇄)는 학교·기관 대상 **인쇄물 주문 제작 플랫폼**이다.
문집/책자류를 중심으로 고객이 상품 옵션(사이즈, 용지, 제본, 페이지수, 부수 등)을 선택해 견적을 내고,
원고를 업로드하면 내부에서 디자인 → 인쇄 → 배송으로 이어지는 제작 파이프라인을 운영한다.
디자인은 고객이 직접 완성 파일을 주는 경우(print-only)와 디자인을 의뢰하는 경우(디자인 상품)로 나뉜다.

## 프로젝트 구성

```
                    ┌──────────────────────┐
  고객              │  schoolp-web (Vue 2) │  app.schoolp.co.kr
  ─────────────────▶│  상품탐색/견적/주문/  │
                    │  원고업로드/디자인확인 │
                    └──────────┬───────────┘
                               │ REST (Bearer JWT)
                    ┌──────────▼───────────┐        ┌────────────────────┐
                    │  schoolp-api (PHP)   │◀──────▶│ member.schoolp.co.kr│
                    │  Slim 3 + Eloquent   │  OAuth │ (회원/인증, 분석 제외)│
                    │  api.schoolp.co.kr   │        └────────────────────┘
                    └──────────▲───────────┘
                               │ REST (/admin/**)
  운영자            ┌──────────┴───────────┐        ┌────────────────────┐
  ─────────────────▶│ schoolp-admin-unified│◀──────▶│ schoolp-editor      │
                    │ (React 18)           │  별도  │ (온라인 에디터 서버) │
                    │ 주문/상품/콘텐츠/통계 │  JWT   │ /editor/api/**      │
                    └──────────────────────┘        └────────────────────┘
```

| 항목 | schoolp-api | schoolp-web | schoolp-admin-unified |
|---|---|---|---|
| 스택 | PHP, Slim Framework 3, Illuminate(Eloquent) 쿼리빌더, JWT(tuupola/slim-jwt-auth) | Vue 2.6, Vuex 3, Vue Router 3, Webpack 4, Bootstrap 4, Filepond | React 18, Recoil, React Router 6, react-scripts, Bootstrap 5 |
| 역할 | 도메인 로직·DB의 원천. 회원/비회원/스토어/관리자 4개 컨트롤러 네임스페이스 | 고객 주문 여정 전체 | 주문 운영, 상품/가격 관리, 콘텐츠, 통계, 에디터 자산 관리 |
| API 베이스 | - | `https://api.schoolp.co.kr` (`src/Constant.js`) | 동일 + 에디터 서버 `https://dev.schoolp.co.kr/editor/api` 별도 인스턴스 |

## 컨트롤러 네임스페이스 (schoolp-api)

- `App\Controllers` — 고객(회원) API
- `App\Controllers\Guest` — 비회원 주문/장바구니
- `App\Controllers\Admin` — 관리자 API (`/admin/**`)
- `App\Controllers\Store` — 외부 스토어/파트너 중개 (JAJAK 등, `store_id` 개념)

## 멀티 스토어

주문에는 `store_id`가 있으며 관리자 화면 기준 `SCHOOLP` / `PINGO` / `JAJAK` 스토어를 구분한다.
schoolp-web에는 JAJAK 파트너용 4단계 주문 플로우가 별도로 존재한다
(`schoolp-web/src/components/external/jajak/OrderProcess.vue`).

## 외부 연동 서비스

| 서비스 | 용도 | 근거 |
|---|---|---|
| 아임포트(Iamport) PG | 카드/계좌이체 결제 (`payments` 테이블, `imp_uid`) | `schoolp-api/app/Models/Payments.php` |
| KCP | 관리자 결제취소 흐름에서 언급 | admin `POST /payments/cancel` |
| ChannelIO (채널톡) | 고객 실시간 상담 위젯 | `schoolp-web/src/assets/js/ChannelService.js` |
| 알림톡/문자 (CMSG) | 배송/시안 안내 발송 (`cmsgid`, `last_msg_date`) | `order_delivery` 필드, admin `POST /admin/orders/{id}/message` |
| 오피스메신저 | 디자인 확정 시 내부 팀 알림 | `schoolp-api/app/Controllers/DesignController.php:75` 부근, `OfficeMessenger::send` |
| 인쇄톡 (발주) | 인쇄 협력사 발주 | admin `POST /admin/orders/{id}/place`, `is_place_order` |
| AWS S3 | 파일 저장 (AWS SDK 2.x) | `schoolp-api/composer.json` |
| Daum 우편번호 | 배송지 입력 | schoolp-web 결제 화면 |
| schoolp-editor | 온라인 디자인 에디터 (템플릿/그래픽 자산, `editor_project_id`) | admin `src/modules/editor/`, `order_item.editor_project_id` |

## 인증 흐름

- 고객: `member.schoolp.co.kr` OAuth → 콜백에서 API 토큰 발급 → Bearer 토큰 (`schoolp-web/src/store/modules/auth.js`)
- 비회원: `guest_token` (장바구니), 주문번호+이메일 조회 (`/guest/**`)
- 관리자: 로그인 → localStorage `authToken`. 에디터 서버 호출 시 이 토큰으로 `/editor/api/admin/login`을 거쳐 별도 에디터 JWT 발급
- 관리자 권한은 현재 **단일 관리자 모델** — 역할(디자이너/상담원 등) 구분 없음

## 형제 프로젝트 (참고)

`/Users/mac/workspace/schoolp/` 하위에는 이 외에도 `schoolp-editor`(에디터), `schoolp-member`(회원),
`schoolp-library`(서재 플랫폼 — admin-unified의 `/library` 메뉴가 이를 관리), `pdf-viewer-frontend` 등이 있다.
member는 이번 분석 범위에서 제외했다.
