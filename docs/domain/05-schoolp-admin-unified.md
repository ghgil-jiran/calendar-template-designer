# 05. schoolp-admin-unified (통합 관리자) 상세

- 위치: `/Users/mac/workspace/schoolp/schoolp-admin-unified`
- 스택: React 18 + Recoil(+persist), React Router 6, Bootstrap 5, react-hook-form, ApexCharts/Chart.js, FullCalendar, React Quill, axios
- API: `https://api.schoolp.co.kr` + 에디터 서버 `.../editor/api`(별도 axios 인스턴스, admin 토큰으로 에디터 JWT 교환)
- 권한: **단일 관리자 모델** (localStorage `authToken`, 역할 구분 없음)
- 구조: `src/modules/{print|library|accounts|editor}/` 아래 `routes.js` / `menu.js` / `pages/` / `api/`

## 1. 메뉴 구조

```
/admin/unified
├── /print (우리학교인쇄 — 핵심)
│   ├── /orders      주문/결제 관리 (★)
│   ├── /products    상품 관리 (+/products/estimate 견적 조회)
│   ├── /users       회원 관리
│   ├── /ebooks      전자책
│   ├── /marketing   마케팅 (쿠폰/배너/이벤트)
│   ├── /contents    콘텐츠 (공지, 문의 inquiries, 후기)
│   ├── /editor      에디터 자산 (graphics, templates)
│   └── /stats       통계 (매출/주문, 엑셀 다운로드)
├── /library         서재 플랫폼 관리 (sites/books/billing/users/stats)
└── /accounts        계정/학교 정보 관리 (가입대기 승인 포함)
```

## 2. 주문 관리 (핵심 업무 화면)

### 2.1 주문 목록 (`src/modules/print/pages/orders/index.js`)

- 필터: 사이트(`store_id`: SCHOOLP/PINGO/JAJAK), 기간(기본 1년), 검색어(디바운스), 결제상태
- 상태 탭 집계: 전체/입금대기(ready)/결제완료(complete)/취소·환불(cancel)
- 컬럼: 주문번호 / 주문자(학교명+수령자) / 상품정보(외 N건) / 결제금액 / 결제방법 / 지출증빙(무통장만) / 결제상태(인라인 드롭다운) / 액션
- 반응형 3단 레이아웃 (모바일 카드 / 태블릿 / 데스크탑 테이블)
- 엑셀 다운로드: `GET /admin/stats/orders/excel`

### 2.2 주문 상세 (`src/modules/print/pages/orders/detail.js`, 약 2,400줄 — 기능 집약)

관리자가 할 수 있는 액션 전체:

| 영역 | 액션 | API |
|---|---|---|
| 주문 | 결제상태/스토어/지출증빙/메모 변경, 사용자 변경, 견적서 출력 | `PATCH /admin/orders/{id}` |
| 주문 | 카드 결제취소 (KCP 연동) | `POST /payments/cancel` |
| 주문 | 주문 삭제 | `DELETE /admin/orders/{id}` |
| 배송지 | 수령자/주소/배송메시지 수정 | `PATCH /admin/orders/{id}` |
| 상품 라인 | 옵션 변경(OptionEditor), 템플릿 설정(TemplateSelector), 가격 인라인 수정(EditableCell), 상품 추가/삭제 | `PATCH/POST/DELETE /admin/orders/{id}/items/{itemId}` |
| 파일 | manuscript 다운로드(읽기전용) / draft·final 업로드·삭제 | `POST /admin/orders/{id}/items/{itemId}/files`, `DELETE /admin/order-files/{fileId}` |
| 공정 | 배송상태 변경: READY→DESIGN→PRINT→DELIVERY→COMPLETE (detail.js:1077-1081) | `PATCH /admin/orders/{id}/delivery/{deliveryId}` |
| 발주 | 인쇄톡 발주 (미발주→발주됨→재발주) | `POST /admin/orders/{id}/place` |
| 알림 | 알림톡 발송 (시안 안내, `last_msg_date` 표시) | `POST /admin/orders/{id}/message` |
| 배송비 | 번들별 배송비 인라인 수정 | `PATCH .../delivery/{deliveryId}` |

주문 상세 응답 구조: `order → bundles[](delivery + items[]) → items[].designs[]`(병합된 디자인 의뢰 상품),
`items[].files[]`(섹션별).

### 2.3 주요 컴포넌트 (`src/modules/print/components/`)

design-wizard.js(디자인 상품 추가 마법사: 카테고리→옵션→템플릿 3단계), option-editor.js,
template-selector.js, estimate.js(A4 견적서 프린트), file-upload-form.js / file-upload-cell.js,
editable-cell.js, user-selector.js, payment-cancel-form.js

## 3. 디자인 관련 현황

- **에디터 자산 관리만 존재**: `/print/editor/graphics`(SVG 그래픽 CRUD+업로드), `/print/editor/templates`(템플릿 CRUD) — `/editor/api/admin/**`
- 주문 내 디자인 = 파일 업로드(draft/final) + 배송상태 DESIGN + 알림톡 발송이 전부
- **없는 것**: 디자이너 배정 UI, 디자이너별 작업 목록, 작업 진행률, 시안 버전 관리, 교정 이력 화면
- 디자인 코멘트(DesignComment)를 관리자 화면에서 다루는 UI도 확인되지 않음 — 고객이 남긴 수정 요청을 관리자가 어디서 어떻게 확인하는지가 기획 시 확인 필요 사항 (오피스메신저 알림 의존으로 추정)

## 4. 상품/견적 관리

- 상품 목록: 대/중/소 3단 카테고리 필터 + 상태 탭(selling/standby/out/stop/end)
- 상품 상세: 기본정보, 가격/할인, 옵션 CRUD, 추가상품, 디자인 상품 연계, 발주 설정(place_order), 템플릿 배정
- 견적 조회(`/print/products/estimate`): 관리자가 상품+옵션+디자인 상품을 조합해 실시간 가격 계산, A4 견적서 출력
  → 상담 시 관리자가 수동으로 견적 뽑아주는 도구. AI챗봇이 자동화할 업무의 관리자측 원형

## 5. 상담/문의 관리

- 문의게시판(`/print/contents/inquiries`, board_id=2): 답변상태 필터(R 대기/C 완료), 리치텍스트 답변 작성(`POST /admin/posts/{id}`)
- 채널톡 상담은 관리자 화면 밖(채널톡 자체 콘솔)에서 처리 — 주문 데이터와 단절

## 6. 운영 업무 흐름 (현재)

```
1. 주문 유입 (pay_status=ready) → 목록에서 확인
2. 입금 확인 → pay_status=complete로 변경
3. 원고(manuscript) 확인 → 시안(draft) 업로드 (→ delivery_status 자동 DESIGN)
4. 알림톡 발송 → 고객이 web에서 시안 확인/수정요청/승인(design_status=COMPLETE, 팀 메신저 알림)
5. 최종(final) 업로드 → delivery_status=PRINT → 인쇄톡 발주
6. 송장 등록 → DELIVERY → COMPLETE (일부 배치 자동 전환)
7. 통계/정산: /print/stats, 엑셀 다운로드
```

이 흐름 전체가 주문 상세 화면 한 곳에 집중되어 있어(2,400줄 단일 파일),
공정별 작업 큐·담당자 관점의 화면이 없다는 것이 "주문관리자 고도화"와 "디자인허브"의 출발점이다.
