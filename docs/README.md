# 문서 안내

이 문서는 `docs/`에서 지금 무엇을 먼저 읽어야 하는지 안내하는 인덱스다. 기존 문서는 삭제하거나 이동하지 않고 목적과 유효성을 기준으로 분류한다.

## 지금 통합 작업의 기준 문서

| 순서 | 문서 | 역할 | 상태 |
|---|---|---|---|
| 1 | [`product/00-VISION.md`](product/00-VISION.md) | 제품 비전과 범위 | 현재 기준 |
| 2 | [`architecture/01-PLATFORM-ARCHITECTURE.md`](architecture/01-PLATFORM-ARCHITECTURE.md) | Designer Studio, Workspace, Platform Core의 책임 | 현재 구조 기준 |
| 3 | [`adr/ADR-001-DESIGNER-SOURCE-OF-TRUTH.md`](adr/ADR-001-DESIGNER-SOURCE-OF-TRUTH.md) | 템플릿 정본의 소유권 | 승인된 결정 |
| 4 | [`adr/ADR-002-PREVIEW-IS-QA-TOOL.md`](adr/ADR-002-PREVIEW-IS-QA-TOOL.md) | Preview Workspace의 역할 | 승인된 결정 |
| 5 | [`adr/ADR-003-RESOLVED-DOCUMENT-BOUNDARY.md`](adr/ADR-003-RESOLVED-DOCUMENT-BOUNDARY.md) | 화면·인쇄 렌더러의 공통 입력 | 현재 구조 기준 |
| 6 | [`integration/SCHOOLP-PRINT-SERVICE-BOUNDARY.md`](integration/SCHOOLP-PRINT-SERVICE-BOUNDARY.md) | 사용자 MVP·출판 플랫폼·우리학교인쇄의 책임 분리 | 현재 통합 기준 |
| 7 | [`integration/MVP-DATA-MAPPING.md`](integration/MVP-DATA-MAPPING.md) | 사용자 MVP 데이터와 Runtime Dataset의 연결 | 통합 작업 기준 |
| 8 | [`integration/INTEGRATION-PLAN.md`](integration/INTEGRATION-PLAN.md) | 대표 템플릿부터 연결하는 실행 계획 | 통합 작업 기준 |
| 9 | [`integration/PRINT-ORDER-INTEGRATION-DRAFT.md`](integration/PRINT-ORDER-INTEGRATION-DRAFT.md) | 가격·주문·인쇄 파일 연동 초안 | 협의 전 초안 |

실제 구현 계약은 문서 설명보다 다음 파일을 우선 확인한다.

- `schemas/runtime/template-contract.schema.json`
- `schemas/runtime/dataset-contract.schema.json`
- `packages/template-runtime/src/types.ts`
- `packages/designer-runtime-integration/src/LegacyProjectAdapter.ts`

문서와 코드가 다르면 차이를 숨기지 말고 `MVP-DATA-MAPPING.md`의 미확정·보완 항목에 기록한 뒤 계약과 구현을 함께 수정한다.

## 제품과 구조 참고

- `product/`: 제품 비전, 현재 제공 범위, Project 1 범위
- `architecture/`: 플랫폼 구조, 저장소 구조, 서비스 진입점, Runtime 우선 설계
- `adr/`: 이미 합의한 구조적 결정
- `runtime/`: RC3~RC5에서 형성된 Runtime·통합·렌더 모델
- `deployment/`: 독립 개발부터 운영 서버 반영까지의 단계

이 문서들은 설계 배경과 현재 구조를 이해하기 위한 자료다. RC 번호가 붙은 문서는 당시 단계의 계약이므로, 통합 구현 시에는 현재 Schema와 TypeScript 타입을 함께 확인한다.

## 테스트와 안정화 안내

- `SOURCE_STABILIZATION.md`: 기준 소스와 변경 안정화 원칙
- `SPRINT2_TEST_GUIDE.md`: Editor Core 테스트 방법
- `SPRINT2_PRODUCT_TEST_GUIDE.md`: Designer Studio 통합 테스트 방법

## 릴리스 기록

- `release/`: RC1~RC5 및 v1 Beta의 릴리스 노트, QA 결과, 알려진 문제, 체크리스트

`release/`는 당시 상태를 보존하는 이력이다. 현재 요구사항이나 통합 계약을 정하는 문서로 사용하지 않는다.

## 우리학교인쇄 레거시 참고자료

- `domain/`: 기존 schoolp 서비스, API, 관리자, DB 구조에 대한 현황 자료

이 자료는 우리학교인쇄의 현재 동작과 용어를 이해하기 위한 참고용이다. 사용자 MVP나 새 Runtime의 API·DB 계약으로 그대로 복사하지 않는다.

## 개발 작업 규칙

- `API_CONTRACT.md`, `COLLABORATION_MODEL.md`
- `GITHUB_WORKFLOW.md`, `VERCEL_DEPLOYMENT.md`
- `PLANNING_ELICITATION.md`, `SUPABASE_WORKFLOW.md`
- `UPDATE_POLICY.md`, `UPDATE_APPLY_GUIDE.md`, `SCHOOLP_STARTER_GUIDE.md`
- `schoolp/`: starter 적용 당시의 파일 목록과 적용 기록

이 문서들은 제품 기능 명세가 아니라 프로젝트 작업 방식과 안전 기준이다.

## 현재 다음 단계

1. 사용자 MVP 저장소와 대표 프로젝트 JSON을 확보한다.
2. `MVP-DATA-MAPPING.md`의 원본 필드 열을 실제 코드 기준으로 채운다.
3. 탁상형 대표 템플릿 한 개로 최소 통합 흐름을 구현한다.
4. 화면 미리보기와 인쇄용 PDF까지 같은 Dataset으로 검증한다.
5. 가격 산정과 우리학교인쇄 파일 전달은 기존 MVP 흐름을 보존한 채 마지막 경계에서 연결한다.
