# Changelog

## 2026-09-02 - 탁상형 표준 01 특수면 화면·PDF 일치 보정

- 28면 검토 PDF 전체를 재검토해 월력·플래너 24면의 구성과 이미지 상태를 확인했다.
- 표지·연력·뒷표지의 고정 px 텍스트를 페이지 폭 비례 크기로 바꿔 화면과 검토 PDF의 상대 크기를 통일했다.
- 표지의 복합 교표와 연락처 배치를 원본에 맞추고, 문서 버전 11 migration에서 뒷표지 전경·교표 fallback 이미지를 복원·보존한다.

## 2026-09-02 - 탁상형 표준 01 뒷표지 원본 비율 보정

- 6번 실물 PDF의 28면을 기준으로 연도·사진 프레임·복합 교표·주소·연락처의 크기와 세로 위치를 다시 맞췄다.
- 연락처 목록을 원본처럼 한 줄 정보 띠로 표시하고, 문서 버전 10 migration은 사용자 이미지와 다른 면을 보존한 채 뒷표지만 갱신한다.

## 2026-09-02 - Desk sample 6 full visual parity pass

- Added adaptive five/six-week monthly grids, English weekday tabs, clean adjacent mini calendars, and the source-matched twelve-month color sequence.
- Added review-only sample schedules so single-day and range-event styling can be evaluated before approval.
- Rebuilt the cover, annual calendar, school-symbol page, back cover, and planner proportions against the 28-page source PDF.
- Added document migration v9 so the existing desk planner review document receives the unified visual baseline.

## 2026-09-01 - Review PDF export

- Added a template-menu action that renders every project surface into a browser-saveable review PDF.
- Preserved trim dimensions and removed editor-only controls and binding badges from review output.
- Kept review PDF output explicitly separate from production PDF/X-4 package validation.

## 2026-09-01 — 검토본 CMYK 이미지·연락처 표시 수정

- PDF에서 추출한 CMYK 이미지가 WebP 변환 중 반전되던 문제를 수정해 전경·교가·교목·교화의 원본 색상을 복구했다.
- 초기 연락처를 에디터 표준 `phone`·`fax` 구조로 저장하고 이전 검토본의 `value` 구조도 문서 버전 8 migration에서 변환한다.

## 2026-09-01 — 탁상형 표준 01 샘플 자료 검토본

- 6번 실물 PDF에서 추출한 학교 전경·교가·교목·교화 이미지와 교체 가능한 복합 교표 SVG를 등록했다.
- 지란중학교 이름·영문명·교훈·주소·연락처와 학교 상징 설명을 초기 검토 데이터로 연결했다.
- 템플릿 문서 버전 7 migration은 비어 있거나 기본 샘플인 값만 채우며 기존 사용자 학교 정보와 이미지를 보존한다.
- 검토 상태와 `publicPackage: false`를 문서에 명시해 Package 발행·공개 승격과 분리했다.

## 2026-09-01 — 6번 월력 원본 조합·월별 색상 복구

- 기존 저장본에 `monthKey`가 없더라도 연도·월과 월력 순서로 월별 스타일을 찾아 3월 초록색 등 파스텔 색상 토큰을 복구한다.
- 월별 스타일을 찾지 못했을 때도 유효한 테마 기본색 또는 고정 색상을 사용해 채움 탭 CSS가 무효화되지 않도록 했다.
- `6번 원본형`과 `3번 원본형` 빠른 디자인 조합을 추가해 제목·정렬·요일·격자가 서로 섞이지 않도록 했다.
- 관련 집중 회귀검사 62건, 인라인 스크립트 20개와 diff 검사가 통과했다.

## 2026-09-01 — 월 제목·요일·격자 프리셋 시각 연결 보강

- 3번 원본 PDF 5면을 다시 렌더링해 가로형 제목 순서를 `연도 → 큰 월 숫자 → 영문월`로 정정했다.
- 3번 요일 표시는 작은 캡슐 장식이 아니라 각 열 폭을 채우는 라운드 테두리 박스로 수정했다.
- 열린 가로줄은 원본처럼 주차 경계가 분명하도록 회색 선 농도와 셀 안쪽 여백을 보정했다.
- 월 표시 형식을 `6번 큰 숫자형`, `3번 숫자·영문월 가로형`, `한글형`으로 선택하고 실제 렌더링하도록 연결했다.
- 3번 독립 테두리 캡슐의 선·여백·채움과 일·토요일 색상 대비를 강화했다.
- 열린 가로줄 격자의 세로선을 제거하고 월별 색상과 섞인 가로선을 적용해 박스형과 명확히 구분했다.
- 관련 집중 회귀검사 62건, 인라인 스크립트 20개와 diff 검사가 통과했다.

## 2026-09-01 — 표준 01 편집형 페이지 배경 프리셋 기반

- CSS에 고정돼 있던 표지·연력·학교 상징·뒷표지 장식을 재사용 가능한 도형 조합 프리셋 4종으로 전환했다.
- 각 배경 조각은 일반 그래픽 개체처럼 선택해 위치·크기·색상·레이어를 조정할 수 있다.
- 일부 조각은 인쇄 영역 밖에서 시작하도록 구성해 페이지 경계 클리핑과 Bleed 배치를 지원한다.
- 문서 버전 6 migration으로 기존 표준 01 작업 사본에도 편집형 배경을 적용한다.
- 관련 집중 회귀검사 62건, 인라인 스크립트 20개와 diff 검사가 통과했다.

## 2026-09-01 — 현재 페이지 편집의 Master 분리

- 후순위 Canvas 선택 모듈이 기존 분리 처리를 덮어써 리사이즈가 Master에 남던 경로를 수정했다.
- 캔버스 이동·크기·회전과 오른쪽 콘텐츠·스타일·배치 저장이 모두 같은 페이지 전용 대체 사본을 편집하도록 통일했다.
- `현재 페이지`에서 Master 개체를 선택하면 해당 면 전용 대체 사본을 생성하고 Master 원본은 다른 면에 유지하도록 수정했다.
- 현재 면에서는 Master 원본 대신 페이지 대체 사본만 표시해 스타일·배치·권한 변경이 다른 월로 번지지 않도록 했다.
- 플래너·월 명언 삽입도 강제 Master 대신 사용자가 선택한 현재 페이지·같은 Master 전체 범위를 따르도록 통일했다.
- 페이지 대체 관계는 문서에 저장되므로 저장·재열기 후에도 현재 면 수정 범위를 유지한다.
- 인라인 스크립트 검사와 관련 회귀검사 61건, `git diff --check`가 통과했다.
- 페이지 전용 대체 사본은 현재 전체 개체 snapshot 방식이며, 이후 Master 변경을 속성별로 다시 상속하는 기능은 후속 UX 과제로 기록했다.

## 2026-09-01 — 새 편집 화면 삽입·속성 동작 1차 완성

- 삽입 적용 범위를 중앙 도구막대에서 왼쪽 개체 삽입 영역으로 옮기고 현재 페이지와 같은 Master 전체를 선택하도록 동기화했다.
- 학교·달력·도형/프레임·기본 개체 모두를 왼쪽 검색에서 찾을 수 있도록 범주 공통 검색을 적용했다.
- 오른쪽에 선택 개체 유형·페이지/Master 범위·데이터 연결 상태를 표시하는 요약을 추가했다.
- 텍스트·학교·달력 개체를 포함한 모든 선택 개체에 데이터와 사용자 편집 권한 패널이 생성되도록 보완했다.
- 인라인 스크립트 검사와 관련 UI·마법사 회귀검사 56건, `git diff --check`가 통과했다.

## 2026-09-01 — 편집기 자료·개체·스타일·페이지 역할 분리

- 페이지 구성과 선택을 왼쪽 세로 목록에서 화면 하단 가로 도크로 이동했다.
- 왼쪽은 샘플 학교 자료 입력과 `학교·달력·도형/프레임·기본` 개체 삽입 전용 영역으로 재구성했다.
- 오른쪽은 페이지 또는 선택 개체의 스타일·콘텐츠·배치 속성 편집 영역으로 유지하고 현재 선택 상태에 맞춰 제목을 표시한다.
- 기존 개체 생성기와 학교 데이터 연결을 재사용해 저장 문서 구조와 Master 적용 계약은 변경하지 않았다.
- 인라인 스크립트 검사와 관련 UI 회귀검사 55건, `git diff --check`가 통과했다.

## 2026-09-01 — 6번 원본 고정 면 배경과 미니 월력 보정

- 표지·뒷표지에서 교표 이미지에 포함되는 학교명·영문명 개체를 제거하고 교표 연결 영역을 넓혔다.
- 6번 원본의 청록 반투명 사각형 배치를 기준으로 표지·연력·뒷표지 배경 장식을 보정했다.
- 5×7로 제한되어 있던 빈 날짜 셀 미니 월력을 6×7 월력에서도 설정값에 따라 표시하도록 수정했다.
- 기존 작업 사본에도 고정 면 개체 정리가 적용되도록 문서 버전을 5로 올렸다.

## 2026-09-01 — 탁상형 표준 01을 6번 원본의 28면 순서로 정정

- 6번 실물 PDF 전체를 다시 확인해 `표지 → 연력 → 학교 상징 → 3월 플래너 → 3월 월력 … → 2월 플래너 → 2월 월력 → 뒷표지`의 28면 순서를 고정했다.
- 잘못 추가한 학교 소개·교육 비전 2면과 별도 뒷표지 한 면을 제거했다.
- 표지·연력·학교 상징·뒷표지는 학교 정보와 이미지를 나중에 교체할 수 있는 편집 가능 기본 개체로 유지했다.
- 문서 버전 4 migration이 기존 30면 작업 사본을 28면으로 재배열하면서 월별 페이지 데이터와 고정 면의 학교 정보를 보존한다.
- 시작 연도·월 변경 시 플래너가 월력보다 먼저 오는 순서에서도 같은 월로 묶이도록 날짜 동기화를 보완했다.

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
