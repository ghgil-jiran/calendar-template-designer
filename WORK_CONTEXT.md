# Work Context

## 현재 프로젝트

Calendar Template Designer / Calendar Publishing Platform Core Engine

## 현재 기준

- 작업 브랜치: `v2-development`
- 복구 전 기준 커밋: `a6c78e7`
- 제품 버전: `2.0.0-alpha.1`
- Template Runtime: `1.0.0-beta.1`
- 주요 편집 화면: `apps/designer-studio/index.html`
- 우리학교인쇄 운영 서버에는 아직 배포하지 않음

## 2026-08-12 복구 결과

- Designer Studio의 손상된 JavaScript 구간을 정상 이력 기준으로 복원
- 기본 설정, 학교 정보, 색상·폰트, Master, 일정 분류, 출력 설정 저장 처리 복원
- 월력 편집 버튼의 단일 전환 처리 복원
- 처음 화면으로 돌아갈 때 이전 프로젝트를 초기화하는 처리 복원
- 표지 Master 글자 크기를 모든 표지 학교명에 적용하는 처리 복원
- 인라인 JavaScript 19개 구문 검사 통과
- Designer Studio 회귀검사 57개 전체 통과
- 전체 `npm run build` 통과

## 표준 검증

1. `npm ci`
2. `npm run build`

`npm run build`는 스타일 보호 검사, 전체 패키지 검사, Designer Studio 회귀검사와 인라인 스크립트 검사를 실행한다.

## 보존 원칙

- 기존 Designer Studio 화면과 기능을 starter 예제로 교체하지 않는다.
- `apps/designer-studio/index.html`을 현재 제품 UI의 기준으로 유지한다.
- schoolp 디자인 토큰은 별도 요청 전까지 적용하지 않는다.
- 인증, 결제, 개인정보, 운영 DB, 주문 서버 연동은 자동 변경하지 않는다.
- 복구 변경은 `v2-development` 브랜치에 저장하며, 이후 작업도 이 브랜치에서 이어간다.

## 다음 할 일

1. 노트북에서 `Fetch origin` 후 최신 복구 커밋을 Pull
2. 로컬 브라우저에서 시작 화면 → 템플릿 선택 → 편집 화면 진입 확인
3. 기본 설정과 Master 설정 저장 동작을 직접 확인
4. 이후 기존 기능 개발 재개

## 후속 구조 개선

- 약 4천 줄 규모의 `apps/designer-studio/index.html`을 기능별로 단계적으로 분리한다.
- 우선 분리 대상은 Preview, Wizard, Template Library, Editor Interaction이다.
- 구조 개선은 기능 추가와 섞지 않고 별도 작업으로 진행한다.
