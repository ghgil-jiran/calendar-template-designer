# Work Context

## 현재 프로젝트

달력 템플릿 에디터 / 학사달력 에디터 서비스 통합 기반

## 현재 기준

- 작업 브랜치: `refactor/designer-structure-phase1`
- 시작 기준: GitHub `main`의 PR #5 병합 커밋 `d5784ae`
- 제품 버전: `2.0.0-alpha.1`
- Template Runtime: `1.0.0-beta.1`
- 주요 편집 화면: `apps/designer-studio/index.html`
- 기존 로컬 `v2-development`의 갈라진 작업은 별도 폴더에 보존
- 우리학교인쇄 운영 서버에는 아직 배포하지 않음

## 2026-08-13 작업 결과

- 정식 명칭과 별칭을 README와 전체 개발 방향에 반영
- `docs/architecture/05-DESIGNER-STUDIO-MODULARIZATION.md`에 구조 분리 기준 작성
- Template, Dataset, 사용자 프로젝트, ResolvedDocument의 데이터 소유권 구분
- `index.html`의 기능별 목표 위치와 단계별 이동 순서 기록
- 사용자 서비스 v1.1 UI·인쇄 결과·음력·24절기·공휴일 처리 보존 원칙 기록
- 학사연도 12개월 순서 계산을 `calendar-domain-bridge.js`로 처음 분리
- 연도 전환과 잘못된 시작월 회귀 검사 추가
- 기존 UI와 사용자 동작은 변경하지 않음
- Designer Studio 회귀검사 58개, 인라인 JavaScript 19개, 전체 빌드 통과

## 표준 검증

1. `npm ci`
2. `npm run build`

`npm run build`는 스타일 보호 검사, 전체 패키지 검사, Designer Studio 회귀검사와 인라인 스크립트 검사를 실행한다.

## 보존 원칙

- 달력 템플릿 에디터 화면과 기능을 구조 개선 중 변경하지 않는다.
- 학사달력 에디터 서비스 v1.1의 UI·사용 흐름·인쇄 결과를 기준선으로 보존한다.
- `apps/designer-studio/index.html`을 현재 제품 UI의 기준으로 유지한다.
- schoolp 디자인 토큰은 별도 요청 전까지 적용하지 않는다.
- 인증, 결제, 개인정보, 운영 DB, 주문 서버 연동은 자동 변경하지 않는다.
- 구조 개선은 기능 추가와 섞지 않고 전용 브랜치에서 진행한다.
- 대표 탁상형 통합이 검증될 때까지 다른 달력 유형 확장을 진행하지 않는다.

## 다음 할 일

1. 월력 셀 계산의 현재 결과를 경계 사례 테스트로 고정
2. 기간 일정의 주간 분할과 lane 계산 결과를 테스트로 고정
3. 위 순수 계산을 `calendar-domain`으로 옮기고 화면 결과 비교
4. 대표 탁상형 Template Package의 manifest·binding·print 계약 확정
5. 이후 Project, Canvas, Inspector, Preview, Persistence 순서로 한 영역씩 분리
