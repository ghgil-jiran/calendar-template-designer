# Work Log

## 2026-08-14 — 달력 계산 구조 개선 A2

- 월력 셀 계산을 `calendar-domain-bridge.js`로 이동하고 기존 화면 함수는 위임 방식으로 유지
- 6행 42칸과 5행 35칸을 모두 지원하며, 기존 5행 달력의 여섯째 주 `extra` 병합 규칙 보존
- 기간 일정의 주별 segment 분할과 lane·overflow 계산을 DOM 독립 함수로 이동
- 월 경계, 5행 병합, 여러 주 기간 일정, 우선순위 및 최대 lane 회귀검사 추가
- 사용자 서비스 데이터, 기존 UI, 저장 형식, 인쇄 설정 변경 없음
- Designer Studio 회귀검사 58개, 제품 상호작용 검사, 인라인 JavaScript 19개, 스타일 검사 통과
- 현재 실행 환경의 TypeScript 의존성 부재로 전체 패키지 빌드는 후속 검증 대상으로 기록

## 2026-08-14 — Dataset 경계와 대표 탁상형 패키지 기준선

- 학교 profile 기본 구조 생성과 학사일정 날짜별 인덱스를 `dataset-domain-bridge.js`로 분리
- 과거의 일부 profile을 자동 보완하지 않고 일정 객체 원본 참조를 유지하는 회귀검사 추가
- `desk-academic-standard@1.0.0`의 manifest, template 참조, Binding, print, assets 구조 생성
- 실제 페이지 구조 추출 전이므로 패키지를 배포 불가 기준선으로 명시
- 현재 Binding과 공휴일·음력·24절기 Adapter 예정 Binding을 구분
- 사용자 서비스 v1.1 인수인계의 인쇄 확정값을 참조 전용으로 기록하고 기존 출력기는 유지
- Designer Studio 회귀검사 60개, 제품 상호작용 검사, 인라인 JavaScript 19개, 스타일 검사 통과

## 2026-08-14 — 대표 탁상형 구조 정본 후보 선택

- GitHub의 사용자 서비스 v1.1 `integration/runtime-v2` 소스에서 실제 14장 28면 순서 확인
- 사용자 서비스의 월력 앞면+다음 달 사진·메모 뒷면 구조와 두 Designer Studio 샘플 비교
- 월별 이미지 구조가 가까운 `desk-sample-2`를 통합 출발점으로 선택하고 `desk-sample-6`은 참조 후보로 유지
- 사용자 서비스 페이지 순서를 Template Package의 `pageSequence`로 기록
- 사용자 서비스 기준 5행 월력을 패키지 기본값으로 설정하고 기존 5·6행 지원은 보존
- 사진+메모 및 연락처 Master는 v1.1 실물 비교 전 좌표를 추측하지 않도록 미완료 상태로 명시
- 선택 근거와 후속 검증을 `docs/integration/DESK-TEMPLATE-BASELINE-SELECTION.md`에 기록
- 전체 TypeScript 패키지 컴파일과 contracts·calendar-domain·editor-core·renderer-core·template-runtime·integration 검사 통과
- Designer Studio 회귀검사 60개, 제품 상호작용 검사, 인라인 JavaScript 19개, 스타일 검사 재통과
- `desk-sample-2`의 표지·연간·학교 상징·월력·이미지 콜라주 개체를 frame·binding 단위로 Template Package에 추출
- 월별 이미지 Binding의 현재 경로와 목표 Dataset 경로를 함께 기록해 추후 Adapter에서 검증하도록 보호

## 2026-08-14 — v1.1 사진·메모/끝지 계약 추출

- 사용자 서비스 v1.1의 `MonthPhotoBackCanvas`, `BackContactCanvas`, `COVER_BACK_PARTS`를 대조
- 월별 사진+메모 면을 고정 좌표 추측이 아닌 안전영역 `사진 1.7 : 메모 1` 복합 Master로 기록
- PDF 괘선 품질 방어를 위해 메모 7칸·DOM 선 6개 규칙과 화면 전용 빈 슬롯 정책 기록
- 끝지 교표·사진·연락처 카드의 실제 측정 좌표와 빈 연락처 숨김 정책을 Template Package에 반영
- `school.contacts[]`를 v1.1 연락처 5필드로 투영하는 순수 Adapter와 회귀검사 추가
- Runtime Dataset 생성 책임을 `dataset-domain-bridge.js`로 이동하고 월별 이미지·명언을 읽기 전용 복사본으로 포함
- 월별 이미지 목표 Binding을 `monthlyImages.{YYYY-MM}` 패턴으로 명확화
- Runtime 페이지 Adapter에서 기존 `calendar.monthlyImages.current`와 새 패턴을 실제 페이지 연월 경로로 치환
- 이미지 개체의 중첩 `image.binding`도 Runtime 계약으로 읽도록 보완
- 사용자 서비스 v1.1의 14장 28면 정본을 생성하는 `integration-parity-bridge.js` 추가
- 현재 프로젝트와 정본의 면 개수·역할·연월을 순서대로 비교하는 숨은 Parity Report 연결
- 같은 달 앞/뒷면인 현재 구조와 다음 달 사진이 뒷면인 v1.1 구조 차이를 회귀검사로 고정
- 월별 사진 누락과 끝지 연락처 전체 누락을 별도 데이터 진단으로 기록
- 기존 Runtime 상태 표시와 편집 UI에는 Parity 경고를 노출하지 않음
- 원본 페이지와 개체를 수정하지 않고 v1.1 순서로 재참조하는 28면 페이지 구성 Adapter 추가
- 구성 Adapter 결과를 기존 Runtime Adapter의 별도 입력으로 연결
- Template Package 네 파일을 manifest 기준으로 불러오고 ID·버전을 검증하는 로더 추가
- Package Master를 별도 28면 Runtime 문서로 해석하고 5행 월력·사진·연락처 진단 추가
- 전체 28면 Package 문서에서 구조 오류 0건, 비어 있는 샘플 사진만 정보 진단으로 분리하는 검사 통과
- Template Package 상태를 `runtime-contract-wired`로 갱신하고 `publishable: false` 유지
- 커밋 전 전체 TypeScript 패키지 컴파일·검사, Studio 회귀검사 63건, 제품 상호작용, 인라인 스크립트 19개, 스타일 보호 검사 통과
- 사용자 서비스 UI, 프로젝트 저장 형식, 기존 출력기에는 변경 없음

## 2026-08-14 — 대표 탁상형 숨은 Renderer 연결

- `desk-academic-standard@1.0.0`의 28면 Package 문서를 기존 화면과 분리된 HTML 결과로 생성
- 5행 월력 35칸과 마지막 칸의 30·31일 병기 결과를 회귀검사로 고정
- 월별 사진+메모의 `1.7:1` 배치, 메모 7칸·DOM 구분선 6개, 교훈·홈페이지 푸터 렌더링 추가
- 끝지 연락처에서 빈 필드를 제외하고 전체가 비면 카드 자체를 숨기는 규칙 적용
- 끝지 전용 사진이 없을 때 학교 전경으로 이어지는 fallback Binding을 Runtime에 연결
- 결과를 `ACDLRuntimeBridge.lastDeskAcademicShadowRender`에만 보관해 기존 사용자 UI·저장·인쇄 경로를 변경하지 않음
- 대체 차단 조건을 미구현 Master가 아닌 `VISUAL_PARITY_NOT_VERIFIED`, `PRINT_PARITY_NOT_VERIFIED`로 전환
- Package 상태를 `shadow-renderer-wired`로 갱신하되 `publishable: false` 유지
- 전체 TypeScript 패키지 컴파일·검사, Studio 회귀검사 64건, 제품 상호작용, 인라인 스크립트 19개, 스타일 보호 검사 통과

## 2026-08-14 — v1.1 시각 비교 준비

- GitHub의 사용자 서비스 `integration/runtime-v2`에서 `sample-doc.ts`, `constants.ts`, `editor-pages.ts`, `canvas.tsx`를 다시 대조
- 제작면 266×186mm, 5행×7열, 사진:메모 `1.7:1`, 메모 7칸·선 6개, 연락처 빈 필드 제거를 독립 시각 기준으로 고정
- Shadow Renderer에 mm 기반 개체 frame 배치와 월력·사진/메모·연락처 전용 스타일 연결
- 대표 월력, 사진+메모, 끝지 연락처를 검토하는 독립 QA 페이지 추가
- 전체 28면 결과의 구조 기준을 자동 검사하고 `structurallyReady`와 사람의 `visuallyApproved`를 구분
- 구조 자동검사는 통과했지만 육안 승인과 PDF/X-4 비교 전이므로 `publishable: false` 유지
- Package 상태를 `visual-review-ready`로 갱신
- 첫 브라우저 캡처에서 5행 월력과 30·31일 병기, 메모 7칸·6선, 연락처 필드 구성이 정상임을 확인
- 사진이 없는 QA 입력 때문에 사진:메모 비율과 끝지 상단 구성을 육안 판단하기 어려운 점을 발견
- 전용 QA 입력에 저장소와 무관한 내장 학교 전경 샘플, 끝지 학교명 영역을 추가해 다음 육안 비교를 보완
- 실제 프로젝트에서 사진이 비어 있는 경우에는 화면 전용 안내만 보이고 인쇄에서는 숨는 정책을 CSS로 명시

## 2026-08-13 — 달력 템플릿 에디터 구조 개선 1단계

- GitHub `main`의 PR #5 병합본 `d5784ae`를 기준으로 구조 개선 전용 브랜치 생성
- 제품 정식 명칭을 `달력 템플릿 에디터`, `학사달력 에디터 서비스`로 문서에 반영
- 4,136줄 규모 Designer Studio의 책임, 데이터 소유권, 기능별 코드 이동표와 단계별 분리 계획 작성
- 기존 사용자 서비스 v1.1의 UI·인쇄·음력·24절기·공휴일 처리 보존 원칙 기록
- 첫 순수 계산 분리로 학사연도 12개월 순서를 `calendar-domain-bridge.js`로 이동
- 연도 경계와 잘못된 시작월 회귀 검사 추가
- Designer Studio 회귀검사 58개, 인라인 JavaScript 19개, 전체 빌드 통과

## 2026-08-12 — 새 개체 이동 시 기존 개체가 함께 움직이는 오류 수정

- 새 개체가 주 선택 대상이 될 때 남아 있던 이전 선택 목록을 새 개체 하나로 교체
- `Shift`·`Ctrl`로 만든 정상적인 다중 선택은 유지
- 삭제되었거나 현재 페이지에 없는 선택값을 자동 정리
- 선택 상태 동기화 회귀 검사 추가
- Designer Studio 회귀검사 57개, 인라인 JavaScript 19개, 전체 빌드 통과

## 2026-08-12 — Designer Studio 손상 구간 복구

- `apps/designer-studio/index.html`의 제어문자와 잘린 JavaScript 구간을 정상 이력 기준으로 복원
- 기본 설정, 학교 정보, 색상·폰트, Master, 일정 분류, 출력 설정 저장 처리 복원
- 월력 편집 버튼의 중복 없는 단일 전환 처리 복원
- 표지 Master 글자 크기 일괄 적용과 처음 화면 복귀 시 이전 프로젝트 초기화 처리 복원
- 인라인 JavaScript 19개 구문 검사 통과
- Designer Studio 회귀검사 57개 전체 통과
- 전체 `npm run build` 통과

## 2026-08-04 — 월력용 명언 자유 배치 수정

- 명언 개체에만 적용되던 충돌 회피 자동 배치 제거
- 명언 개체도 다른 개체처럼 겹쳐서 자유롭게 배치하도록 통일
- 이동·크기 조절 시 선택한 개체만 변경되는 회귀 검사 추가
- 레이어의 `맨 앞으로`·`맨 뒤로` 동작은 그대로 유지
- Studio 검사 55개와 전체 패키지 검사 통과

## 2026-08-04 — 전체 소스 안정화

- 원격 `main` 커밋 `e714321`을 기준으로 기존 로컬 변경과 분리된 작업본 생성
- `npm ci`로 잠금 파일 기준 TypeScript 의존성 설치
- Template Runtime에 실제 테스트가 없는데 존재하지 않는 테스트 파일을 실행하던 오류 수정
- Runtime 바인딩 및 계약 버전 검사 2개 추가
- 루트의 모든 Designer Studio 회귀 검사가 표준 검증에서 실행되도록 통합
- 기존 회귀 검사 정규식 오류와 마법사 초기화 함수 누락 수정
- 패키지 TypeScript 컴파일, 패키지 검사, Studio 회귀 검사 45개, 인라인 스크립트 17개 검사 통과
- 화면 구성과 기존 편집 기능은 변경하지 않음

## 2026-07-30 — schoolp r015 안전 적용

- 정본 ZIP의 AI_START_HERE.md, STARTER_VERSION.md, CHANGELOG.md, AI_COMMANDS.md, docs/UPDATE_APPLY_GUIDE.md, starter-manifest.json 확인
- 현재 프로젝트를 구현 진행 중인 정적 Designer Studio + TypeScript Runtime으로 진단
- safeApply 범위의 문서, 스킬 폴더, 설정, 훅, scripts를 반영
- `.schoolp/starter-state.json`에는 appliedStandard r015만 반영하고 디자인 토큰 계약은 활성화하지 않음
- 기존 UI, 스타일, 기능, `apps/designer-studio/index.html` 보존
- 우리학교인쇄 서비스 경계, 주문/파일 연동 초안, 배포 단계를 문서화
- `npm run style:check`, `npm run build` 검증 예정
