# Work Context

## 현재 프로젝트

달력 템플릿 에디터 / 학사달력 에디터 서비스 통합 기반

## 현재 기준

- 작업 브랜치: `refactor/designer-structure-a2`
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

## 2026-08-14 작업 결과

- 6행 월력 42칸 계산을 `calendar-domain-bridge.js`로 분리
- 기존 5행 달력의 여섯째 주 날짜를 마지막 행 `extra`에 합치는 규칙을 그대로 분리
- 기간 일정의 주간 segment 계산과 우선순위·겹침 lane/overflow 계산을 DOM 밖으로 분리
- 기존 `calendarGridFor`, `buildRangeSegments`, `assignRangeLanes` 이름과 화면 호출 구조 유지
- 월력 경계, 5행 병합, 기간 일정 분할, lane 초과 회귀검사 추가
- 사용자 서비스 데이터, UI, 저장 형식, 출력 설정은 변경하지 않음
- Designer Studio 회귀검사 58개, 제품 상호작용 검사, 인라인 JavaScript 19개, 스타일 검사 통과
- 기존 작업 폴더에 설치된 동일 버전 TypeScript 컴파일러로 전체 패키지 빌드와 검사를 완료
- 학교 profile 기본 구조와 일정 날짜별 인덱스를 `dataset-domain-bridge.js`로 분리
- 일부만 존재하는 과거 학교 profile을 임의 보완하지 않는 기존 규칙과 기간 일정 날짜 확장 결과를 테스트로 고정
- `desk-academic-standard@1.0.0` 패키지 기준선 생성
- 패키지를 아직 배포 불가 상태로 표시하고, 현재 Binding과 사용자 서비스 v1.1 Adapter 예정 Binding을 구분
- v1.1 인수인계의 260×180mm 재단, 266×186mm 제작, PDF/X-4 등 인쇄 확정값을 참조 전용으로 기록
- 전체 Studio 회귀검사 60개 통과
- GitHub의 사용자 서비스 v1.1 `integration/runtime-v2`에서 14장 28면, 5행 월력, 사진·메모 짝 구조 확인
- 대표 탁상형 출발점을 월별 이미지 구조가 가까운 `desk-sample-2`로 선택
- 사용자 서비스의 표지/연간, 학교 상징/3월 사진, 3~1월 월력/다음 달 사진, 2월 월력/연락처 순서를 `pageSequence`로 기록
- 현재 템플릿 패키지의 기본 월력 행을 사용자 서비스 기준인 5행으로 설정하되 기존 5·6행 지원은 유지
- 사진+메모는 안전영역 `1.7:1` 복합 Master, 끝지는 실측 3개 부품 Master로 v1.1 계약 추출 완료
- contracts, calendar-domain, editor-core, renderer-core, template-runtime, designer-runtime-integration 전체 컴파일·검사 통과
- `desk-sample-2`의 표지 4개, 연간 월력, 학교 상징 4개, 월력 영역, 이미지 콜라주 4개 frame·binding을 Template Package로 추출
- 월별 이미지의 현재 Binding과 목표 Dataset Binding 불일치를 명시적으로 함께 기록하고 자동 변경하지 않음
- Runtime Dataset 생성을 `dataset-domain-bridge.js`로 분리하고 월별 이미지·명언·5행 설정을 포함
- 템플릿 에디터의 연락처 배열을 저장 구조 변경 없이 사용자 서비스 v1.1 연락처 5필드로 투영
- 월별 이미지 목표 경로를 페이지 연월 기반 `monthlyImages.{YYYY-MM}` 패턴으로 명확화
- Runtime 페이지 Adapter가 기존/신규 월별 이미지 Binding을 실제 `monthlyImages.YYYY-MM` 경로로 해석
- 사용자 서비스 v1.1의 28면 정본과 현재 페이지를 역할·연월 단위로 비교하는 숨은 Parity Report 추가
- 현재 템플릿 에디터의 같은 달 앞/뒷면 구조와 v1.1의 다음 달 사진 뒷면 구조가 다름을 테스트로 고정
- 월별 사진 12개 및 끝지 연락처 누락 상태를 UI 변경 없이 비교 보고서에 기록
- 원본 페이지를 수정하지 않고 v1.1 순서의 28면 참조 페이지를 만드는 구성 Adapter 완료
- Template Package manifest/template/bindings/print 로더와 ID·버전 검증 추가
- Package Master를 28면 숨은 Runtime 문서로 변환하고 5행·사진·연락처 진단 연결
- Package 상태는 `print-review-ready`, 배포 가능 상태는 계속 false
- 28면 Package를 화면과 분리된 HTML로 생성하는 숨은 Renderer 연결
- 5행 35칸·30/31일 병기, 사진:메모 1.7:1, 메모 7칸/6선, 빈 연락처 숨김 회귀검사 추가
- mm 좌표 스타일과 대표 월력·사진/메모·끝지 전용 QA 화면 추가
- v1.1 독립 구조 기준 자동검사와 대표 3면 육안 확인 완료
- PDF/X-4 인쇄 계약 자동검사 통과, 기준/Runtime PDF와 Preflight 증거는 미확보

## 2026-08-17 작업 결과

- PDF 실물 비교는 후속으로 보류하고 Phase 4 화면 기능 모듈화를 시작
- 프로젝트 기본 문서 생성과 탁상형 대표 템플릿 보정을 `project-document.js`로 분리
- 기존 `makeProject` 함수 이름과 뒤쪽 달력 유형 확장 순서를 유지하여 화면 호출 구조를 보존
- 탁상형·벽걸이형·벽보형 생성 결과, 빈 일정, `acdl-project@2.18.0` 저장 기준 회귀검사 추가
- 사용자 서비스 UI, 템플릿 에디터 화면, 저장·불러오기, 출력 경로는 변경하지 않음
- Canvas 개체 이동·8방향 크기 조절·회전·키보드 이동 계산을 `canvas-geometry.js`로 분리
- 다중 선택, pointer 이벤트, undo 기록, DOM 갱신 순서는 유지하고 좌표 계산만 위임
- Canvas 0~100% 경계, 최소 크기 3%, 회전 5도 맞춤 회귀검사 추가
- Canvas 단일·다중 선택 목록과 주 선택 전환을 `canvas-selection.js`로 분리
- 새 개체 선택 시 과거 선택 교체, 삭제된 선택 정리, 전체 선택·복제 후 선택 순서를 회귀검사로 고정
- Canvas 드래그 원본·중심점·회전 시작각·변경 여부를 `canvas-gesture.js`로 분리
- 다중 개체 이동과 주 개체 크기 조절·회전 결과를 독립 검사로 고정
- 드래그 종료의 변경 여부·임시 undo 폐기·안내 메시지 판정을 같은 모듈로 통합
- pointer capture 등록·해제와 pointer listener 정리를 `canvas-input.js`로 분리
- 전체 선택·삭제·방향키 이동의 입력 해석을 분리하고 실제 변경·undo·render 순서는 유지
- Inspector 변경 서명과 숫자 범위 검증을 `inspector-form.js`로 분리
- 그래픽 개체 스타일·배치·사진 프레임·권한 반영을 `inspector-graphic.js`로 분리
- Inspector DOM 입력 읽기, undo·dirty·render·알림 순서는 유지
- 텍스트 콘텐츠·스타일, 이미지 표시와 개체 배치 보정을 `inspector-element.js`로 분리
- 월력·일정·의미 객체 Inspector는 도메인 모듈 경계가 정해질 때까지 기존 연결 유지
- 미리보기 페이지 조회·선택 페이지 복구·편집 상태 저장과 복원을 `preview-state.js`로 분리
- 미리보기 복제본의 ID·편집 핸들·선택·잠금·Binding 오류 표시 제거를 모듈화
- 전체 미리보기 DOM 카드·오류 카드·확대·축소·modal 순서는 유지

## 표준 검증

1. `npm ci`
2. `npm run build`

`npm run build`는 스타일 보호 검사, 전체 패키지 검사, Designer Studio 회귀검사와 인라인 스크립트 검사를 실행한다.

2026-08-14 커밋 전 검증에서는 기존 작업본의 동일한 TypeScript 의존성을 임시 연결해 npm의 네트워크 접근 없이 아래를 직접 실행했다.

- contracts, calendar-domain, editor-core, renderer-core, template-runtime, designer-runtime-integration 컴파일·검사 통과
- Designer Studio 회귀검사 63건 통과
- 제품 상호작용 검사 통과
- 인라인 JavaScript 19개 통과
- 스타일 보호 검사와 `git diff --check` 통과

## 보존 원칙

- 달력 템플릿 에디터 화면과 기능을 구조 개선 중 변경하지 않는다.
- 학사달력 에디터 서비스 v1.1의 UI·사용 흐름·인쇄 결과를 기준선으로 보존한다.
- `apps/designer-studio/index.html`을 현재 제품 UI의 기준으로 유지한다.
- schoolp 디자인 토큰은 별도 요청 전까지 적용하지 않는다.
- 인증, 결제, 개인정보, 운영 DB, 주문 서버 연동은 자동 변경하지 않는다.
- 구조 개선은 기능 추가와 섞지 않고 전용 브랜치에서 진행한다.
- 대표 탁상형 통합이 검증될 때까지 다른 달력 유형 확장을 진행하지 않는다.

## 다음 할 일

1. 브라우저에서 Canvas 선택·이동·크기 조절·회전·키보드 이동을 확인
2. 브라우저에서 페이지·전체 미리보기 진입과 편집 복귀를 확인
3. 로컬 저장·복구·프로젝트 직렬화 Persistence 경계를 정리
4. 사용자 서비스 연결 전에 숨은 Runtime 비교 결과를 다시 확인
5. PDF/X-4 실물 비교는 기능 구조 통합 뒤 별도 승인 단계에서 진행
