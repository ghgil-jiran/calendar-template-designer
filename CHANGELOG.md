# Changelog

## 1.0.0-beta.1 — 2026-07-30

첫 공개 베타 릴리스.

- CalendarType과 시작 템플릿·크기 프리셋 관리
- Template Runtime과 ResolvedDocument 계약
- LegacyProjectAdapter 및 DesignerRuntimeBridge
- RenderNode 1.1, RenderDiff, Collision 진단
- Runtime ScreenRenderer와 SVG PublishingRenderer
- Designer Studio Runtime 상태 및 페이지 비교 미리보기
- Runtime JSON Schema와 통합 문서
- 루트 `npm run verify` 검증 명령
- 제품·Runtime·통합 패키지 버전을 `1.0.0-beta.1`로 통일

## 1.0.0-beta.rc5

- RenderNode 1.1 및 fingerprint
- RenderDiffEngine과 CollisionEngine
- ScreenRenderer mount API
- SVG PublishingRenderer 및 ParityComparator
- Designer Studio Runtime 미리보기 패널

## 1.0.0-beta.1-schoolp-r015 - 2026-07-30

### Added
- schoolp 개발 기준 r015 문서, 스킬, 훅, 설정, 업데이트 검사 스크립트 적용
- 프로젝트 상태 및 우리학교인쇄 통합 순서를 `WORK_CONTEXT.md`에 기록
- 운영 서버 배포 전에 확인할 연동 항목을 `HANDOFF.md`에 기록
- 기존 정적 Designer Studio에 맞춘 비파괴 `style:check` 및 `build` 검증 명령 추가

### Preserved
- Designer Studio UI, 스타일, 기능
- Template Runtime 및 Renderer 소스
- 기존 제품 문서와 릴리스 이력

### Not Applied
- starter의 `src/**`, 예제 화면, 디자인 토큰
- Next.js 의존성 및 운영 API/DB/인증/결제 변경
