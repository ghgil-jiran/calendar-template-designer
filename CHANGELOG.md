# Changelog

## 2026-09-01 — 탁상형 표준 01 30면 전체 구성

- 학교 전경 표지, 12개월 연력, 앞간지 2면, 월력 앞뒤 24면, 뒷표지 2면을 실제 콘텐츠로 구성했다.
- 앞간지는 학교 소개·연혁과 교육 비전 기본 면으로 만들고 편집 안내 전용 화면을 제거했다.
- 맨 뒷표지는 학교 전경·교표·학교 정보 면과 교훈·교가·교목·교화 상징 면으로 분리했다.
- 6번 원본 계열의 청록색·반투명 사각 장식과 제본 영역 표현을 적용했다.
- 기존 30면 작업본을 문서 버전 3으로 갱신하되 학교 정보·이미지·월별 데이터를 보존한다.

## 2026-08-31 — 탁상형 표준 01 작업본 구분 준비

- 신규 30면 시스템 베이스와 기존 저장 작업본의 재열기 경로를 구분했다.
- 30면 `desk-sample-6` 작업본에만 적용되는 문서 버전 2 migration을 추가했다.
- 기존 저장 원본을 덮어쓰지 않고 작업 사본에서 표준 identity와 월력 뒷면 공통 Master를 보완한다.
- 28면 보관 샘플과 다른 템플릿은 migration 대상에서 제외했다.
- 6번 실물 PDF 기준 월력 뒷면 Master 좌표를 1차 보정했으며, 다음 단계에서 화면을 나란히 비교해 최종 확정한다.

## Build and verification stabilization — 2026-08-04

- GitHub `main` 기준의 깨끗한 작업 환경에서 `npm ci` 후 전체 빌드 검증
- 누락되어 있던 Template Runtime 기본 동작·계약 버전 검사 추가
- 흩어진 패키지 검사와 Designer Studio 회귀 검사를 `npm run verify`로 통합
- 실행되지 않던 Designer Studio 회귀 검사의 잘못된 정규식 수정
- 새 달력 만들기 마법사의 초기화 함수 보완
- TypeScript 컴파일을 포함한 `npm run build` 전체 통과

## Documentation & sharing update — 2026-07-31

- GitHub 공유용 README를 제품 소개 및 실행 중심으로 개편
- 제품 비전과 현재 범위 문서 추가
- Developer Preview 릴리스 노트와 GitHub 공개 절차 추가
- `npm run verify` 전체 통과 확인

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
