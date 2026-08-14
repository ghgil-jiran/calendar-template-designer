# 달력 템플릿 에디터 구조 분리 계획

- 문서 상태: Phase 1 기준
- 기준 소스: `main`의 `d5784ae` (PR #5 병합본)
- 대상 화면: `apps/designer-studio/index.html`
- 우선 대상: 탁상형 학사달력 1종

## 1. 목적

현재 Designer Studio는 정상 동작하는 제품 기준선이지만, 하나의 HTML 파일에서 화면, 편집 상태, 템플릿 생성, 달력 계산, 저장, 미리보기, 출력 설정을 함께 처리한다. 이 문서는 기존 UI와 기능을 유지하면서 이를 단계적으로 분리하는 기준을 정한다.

이 작업은 화면을 새로 디자인하거나 사용자 서비스 기능을 곧바로 합치는 작업이 아니다. 먼저 달력 템플릿 에디터의 내부 경계를 분명히 하여, 이후 학사달력 에디터 서비스가 같은 Template·Dataset·Runtime 계약을 사용할 수 있게 준비한다.

## 2. 제품 명칭

| 구분 | 정식 명칭 | 허용 별칭 | 코드상 대응 |
|---|---|---|---|
| 학교 사용자용 서비스 | 학사달력 에디터 서비스 | 학사달력 사용자 서비스, 사용자 서비스 | Calendar Workspace |
| 템플릿 제작 도구 | 달력 템플릿 에디터 | 템플릿 에디터 | Designer Studio |

문서에서는 처음 등장할 때 정식 명칭을 쓰고, 같은 문서 안에서는 별칭을 사용할 수 있다. `Designer Studio`, `Calendar Workspace`는 코드와 기존 아키텍처를 설명할 때만 병기한다.

## 3. 변하지 않는 원칙

1. 학사달력 에디터 서비스 v1.1의 UI·사용 흐름·인쇄 결과를 통합 기준선으로 보존한다.
2. 달력 템플릿 에디터의 현재 UI와 동작을 구조 분리 과정에서 바꾸지 않는다.
3. Template은 디자인 구조와 편집 권한을 소유한다.
4. Dataset은 학교 정보, 학사일정, 음력·절기·공휴일, 월별 콘텐츠를 소유한다.
5. 사용자 프로젝트는 선택한 템플릿의 식별 정보와 사용자 입력·허용된 변경값을 소유한다.
6. Runtime은 Template과 Dataset을 해석해 `ResolvedDocument`를 만든다.
7. 화면과 인쇄는 같은 `ResolvedDocument`를 입력으로 사용한다.
8. 달력 유형 확장은 탁상형 통합이 검증된 뒤 진행한다.

## 4. 목표 구조와 책임

| 영역 | 책임 | 두면 안 되는 내용 |
|---|---|---|
| `apps/designer-studio` | 템플릿 제작 화면, 패널, 사용자 입력, 화면 연결 | 날짜 계산, 계약의 정본, 인쇄 규칙의 독자 구현 |
| `packages/contracts` | Template·Dataset·Project·Publishing 공통 타입과 검증 | DOM, 화면 상태, 저장소 접근 |
| `packages/calendar-domain` | 학사연도, 월 순서, 일정 정규화, 공휴일·음력·24절기 모델 | 템플릿 좌표, 화면 표시 코드 |
| `packages/template-runtime` | Template + Dataset → `ResolvedDocument` | 사용자 서비스 화면, 주문 처리 |
| `packages/editor-core` | 선택, 명령, 변경 이력, 되돌리기 | 제품별 템플릿 내용 |
| `packages/renderer-core` | 공통 렌더 모델과 화면 출력 기반 | 사용자 입력 데이터의 소유 |
| `packages/designer-runtime-integration` | 기존 프로젝트 형식과 Runtime 사이의 변환 | 새 계약의 정본 |
| 후속 `packages/publishing` | 용지, 도련, 안전영역, DPI, 폰트, PDF 검증 | 편집 화면 상태, 주문·결제 |
| 후속 `templates/<template-id>` | 템플릿별 구조, 바인딩, 기본값, 출력 규격, 자산 | 학교별 실제 데이터, DOM 이벤트 |

## 5. 데이터 소유권

### Template Package

- `templateId`, 템플릿 버전, Schema 호환 범위
- 상품 유형과 페이지 순서
- Master, Page, Object, Binding
- 편집 가능 항목과 잠금 규칙
- 기본 스타일과 월별 변경 허용 범위
- 인쇄 규격과 필요한 자산 목록

### Dataset

- 학교명, 연락처, 교표, 학교 전경, 교훈·교가·교목·교화
- 학사연도와 시작월
- 단일·기간 일정
- 공휴일, 음력, 24절기 등 달력 보조 데이터
- 월별 이미지와 문구

### 사용자 프로젝트

- `templateId`, `templateVersion`, `schemaVersion`, `runtimeVersion`
- 사용자 입력 원본
- 템플릿이 허용한 콘텐츠·표시 변경값
- 자산 참조와 저장 상태

### ResolvedDocument

- 계산이 끝난 페이지 순서와 개체
- 화면·인쇄가 공통으로 읽는 값
- 누락 Binding, 공간 초과, 낮은 해상도 등 진단 결과

`ResolvedDocument`는 저장 원본이 아니라 언제든 Template과 Dataset에서 다시 만들 수 있는 계산 결과로 취급한다.

## 6. Template Package 권장 형태

첫 통합에서는 탁상형 대표 템플릿 하나만 다음 구조로 고정한다.

```text
templates/
  desk-academic-standard/
    1.0.0/
      manifest.json
      template.json
      bindings.json
      print.json
      assets/
```

- `manifest.json`: 템플릿 ID, 이름, 버전, 상품 유형, 지원 기능, 호환 버전
- `template.json`: Master·Page·Object 구조와 스타일
- `bindings.json`: 필요한 Dataset 경로와 누락 시 처리
- `print.json`: 완성 크기, 도련, 안전영역, 색상, DPI 조건
- `assets/`: 템플릿에 포함되는 고정 이미지·벡터·폰트 참조

현재 `template-catalog.js`의 항목은 장기적으로 manifest를 읽어 만든 목록이어야 한다. 카탈로그 항목과 실제 템플릿 정의를 따로 수기 관리하지 않는다.

## 7. 현재 코드 이동표

`index.html`의 함수 이름과 화면 구역을 기준으로 분류한다. 실제 이동은 아래 순서를 지키며 한 묶음씩 검증한다.

| 현재 코드 묶음 | 예시 | 목표 위치 | 판정 | 이동 시 주의점 |
|---|---|---|---|---|
| 시작 화면·진입 | `showDesignerHome`, `openDesignerSetup` | `apps/designer-studio/shell/` | 보강 | DOM 이벤트 순서 유지 |
| 제작 Wizard | `wizard-flow.js`, 설정 단계 | `apps/designer-studio/features/setup/` | 유지·보강 | 이미 분리된 상태를 기준으로 확장 |
| 카탈로그 | `template-catalog.js`, Library runtime | `apps/designer-studio/features/template-library/` | 보강 | 후속 manifest 기반으로 교체 |
| 프로젝트 생성 | `SIZE_PRESETS`, `monthSequence`, `makeProject` | 계약은 packages, 화면 조립은 `features/project/` | 교체 | 하드코딩 템플릿 생성과 UI 입력 분리 |
| 학교·자산 데이터 | `ensureSchoolProfile`, semantic object 함수 | `packages/contracts`, `features/assets/` | 보강 | Dataset 원본과 편집용 placeholder 분리 |
| 달력 계산 | `calendarGridFor`, 기간 일정 segment·lane | `packages/calendar-domain`, `packages/template-runtime` | 교체 | DOM 없이 같은 결과를 내는 테스트부터 작성 |
| 편집 상태 | 전역 `selected*`, `history`, `future`, drag 상태 | `packages/editor-core` + UI session | 교체 | 영속 데이터와 선택·hover 상태 분리 |
| Canvas 상호작용 | 개체 선택·이동·크기·회전 | `features/editor-canvas/` | 보강 | 다중 선택 오류 회귀검사 유지 |
| Inspector | 입력 채우기·저장·탭 전환 | `features/inspector/` | 보강 | 저장 전 임시 입력과 project 변경 구분 |
| Runtime 미리보기 | Runtime bridge, page/full preview | `features/preview/` | 유지·보강 | 기존 Renderer와 결과 비교 유지 |
| 저장·불러오기 | localStorage, 파일, 템플릿 저장 | `features/persistence/` | 보강 | 원본을 조용히 마이그레이션하지 않음 |
| 출력 설정 | bleed, crop mark, color mode, export setting | 후속 `packages/publishing` + `features/publishing/` | 교체 | 사용자 서비스 v1.1 PDF 규칙 분석 후 연결 |
| 뒤쪽 보정 스크립트 | 함수 재할당, IIFE 확장 코드 | 각 기능 모듈 | 교체 | 초기화 순서와 중복 이벤트부터 특성 테스트로 고정 |

## 8. 단계별 분리 순서

### Phase 0 — 기준선 고정

- 최신 `main` 커밋과 검증 결과 기록
- 대표 탁상형 프로젝트 JSON, 주요 화면, 인쇄 결과 확보
- 저장→불러오기, 새 개체 선택·이동, 미리보기 회귀검사 유지

완료 조건: 현재 기능과 UI가 기준 자료로 재현된다.

### Phase 1 — 경계와 특성 테스트

- 본 문서의 책임과 데이터 소유권을 기준으로 고정
- 전역 상태·함수 재할당·이벤트 등록 위치 목록화
- 날짜 계산, 프로젝트 생성, 저장 형식의 현재 결과를 테스트로 고정
- 새 기능을 추가하지 않음

완료 조건: 무엇을 어디로 옮길지와 이동 전후 비교 방법이 명확하다.

### Phase 2 — 순수 계산 분리

- 월 순서와 학사연도 계산
- 월력 셀과 기간 일정 분할·lane 계산
- 학교 데이터와 일정 정규화
- Binding 경로 검증

완료 조건: 브라우저 DOM 없이 실행되는 테스트가 통과하고 기존 화면 결과가 같다.

첫 적용:

- `calendar-domain-bridge.js`에서 학사연도 12개월 순서를 계산한다.
- 기존 `monthSequence`는 화면 호환을 위해 이름을 유지하되 위 모듈에 계산을 위임한다.
- 연도 경계와 잘못된 시작월을 브라우저 독립 테스트로 고정한다.

두 번째 적용:

- 월력 셀 계산을 `calendar-domain-bridge.js`로 옮기고 기존 `calendarGridFor`가 위임한다.
- 6행 42칸과 5행 35칸 결과를 모두 고정한다. 5행에 들어가지 않는 해당 월 날짜는 기존 화면처럼 마지막 행의 `extra`로 합친다.
- 기간 일정을 보이는 주별 구간으로 나누는 계산과, 우선순위·겹침에 따른 lane 및 overflow 계산을 DOM 밖으로 옮긴다.
- 기존 `buildRangeSegments`, `assignRangeLanes` 함수 이름과 화면 호출 순서는 유지한다.
- 사용자 서비스 데이터, UI, 저장 형식, 출력 설정은 이 적용에서 변경하지 않는다.

세 번째 적용:

- Runtime Dataset 스냅샷 생성을 `dataset-domain-bridge.js`로 옮긴다.
- 템플릿 에디터의 가변 `school.contacts[]`는 저장 원본을 바꾸지 않고 사용자 서비스 v1.1의 고정 연락처 필드로 투영한다.
- 월별 이미지와 명언을 Dataset에 포함하되 새 객체로 복사하여 Runtime 해석이 프로젝트 저장 상태를 직접 수정하지 못하게 한다.
- 기존 RC4 `adapt` 함수는 페이지·개체 변환 순서를 유지하고 Dataset 생성만 위 모듈에 위임한다.

### Phase 3 — 템플릿 패키지화

- 대표 탁상형을 `desk-academic-standard@1.0.0`으로 고정
- manifest, template, bindings, print, assets 분리
- 카탈로그가 manifest 정보와 불일치하지 않게 변경

완료 조건: 템플릿을 저장·다시 불러와도 페이지·Binding·출력 규격이 같다.

첫 기준선:

- `templates/desk-academic-standard/1.0.0/`에 manifest, template 참조, bindings, print, assets 경계를 생성한다.
- 아직 페이지·개체 구조를 완전히 추출하지 않았으므로 `publishable: false`, `extractionStatus: pending`으로 명시한다.
- 현재 Runtime에서 확인된 Binding과 사용자 서비스 v1.1 Adapter에서 추가할 공휴일·음력·24절기 Binding을 상태로 구분한다.
- 사용자 서비스 v1.1 인수인계의 인쇄 확정값은 참조 기준으로 기록하되, 화면·PDF 비교 전에는 기존 출력기를 교체하지 않는다.

### Phase 4 — 화면 기능 모듈화

- Template Library, Project, Canvas, Inspector, Preview, Persistence 순서로 분리
- 한 번에 한 영역만 이동
- 각 이동마다 전체 회귀검사와 브라우저 수동 확인

완료 조건: `index.html`에는 화면 골격과 모듈 진입점만 남고 도메인 계산은 남지 않는다.

### Phase 5 — 사용자 서비스 연결

- 사용자 서비스 v1.1 Adapter가 만든 Dataset을 Runtime에 전달
- 기존 UI 안에서 새 결과를 숨은 비교 모드로 생성
- 기존 미리보기·PDF와 페이지, 텍스트, 일정, 이미지 결과 비교
- 차이가 허용 범위에 들어온 뒤에만 사용자 화면의 데이터 공급 경로 변경

완료 조건: 사용자 서비스 UI를 바꾸지 않고 대표 탁상형 템플릿을 교체할 수 있다.

## 9. 사용자 서비스 v1.1에서 가져올 기준

다음 기능은 템플릿 에디터의 `index.html`로 복사하지 않는다.

| 사용자 서비스 강점 | 통합 위치 | 초기 처리 |
|---|---|---|
| 음력·24절기·공휴일 | `calendar-domain`과 Dataset Adapter | 데이터 모델과 결과 비교부터 진행 |
| AI 일정 인식·중복 방지 | 사용자 서비스 입력 계층 | UI와 기존 처리 유지 |
| 사진·사용자 편집 상태 | 사용자 프로젝트와 Asset 계약 | Adapter로 변환 |
| 인쇄 품질·PDF/X·폰트·색상 | 후속 `publishing` | 기존 PDF 결과를 기준 자료로 보존 |
| 현재 탁상형 UI/UX | 학사달력 에디터 서비스 | 초기 통합에서 변경 금지 |

## 10. 버전 관리

서로 다른 수명을 가진 버전을 하나로 묶지 않는다.

| 대상 | 예시 | 원칙 |
|---|---|---|
| 학사달력 에디터 서비스 | `v1.1.0` | 기준 태그는 수정하지 않음 |
| 달력 템플릿 에디터 | `2.0.0-alpha.x` | 구조 개선 체크포인트마다 증가 |
| Template Package | `desk-academic-standard@1.0.0` | 템플릿 내용 변경 이력 |
| Dataset Schema | `1.x` | 사용자 데이터 계약 변경 이력 |
| Template Schema | `2.x` | 템플릿 저장 구조 변경 이력 |
| Runtime | `1.x` | 해석 결과와 호환성 변경 이력 |

사용자 프로젝트에는 최소한 `templateId`, `templateVersion`, `datasetSchemaVersion`, `templateSchemaVersion`, `runtimeVersion`을 기록한다. 구버전 입력은 단계별 migration report를 만든 뒤 사용자가 저장할 때만 새 형식으로 기록한다.

## 11. 이번 단계에서 하지 않는 일

- 사용자 서비스 화면 개편
- 사용자 서비스 v1.1 PDF 생성기 교체
- 벽걸이형·벽보형·엽서형 동시 구현
- 운영 DB, 인증, 결제, 주문 API 변경
- `index.html` 전체 재작성
- TypeScript 또는 프레임워크 전면 전환
- 정상 동작 확인 없이 함수 묶음을 기계적으로 잘라내는 작업

## 12. Phase 1 완료 기준

- 제품 명칭과 두 서비스의 책임이 문서에서 일관된다.
- 현재 `index.html` 코드 묶음이 목표 모듈과 연결된다.
- 사용자 서비스 v1.1에서 보존·재사용할 영역이 구분된다.
- 대표 탁상형만 먼저 통합한다는 범위가 유지된다.
- 최신 기준 소스에서 `npm run build`가 통과한다.
- 다음 변경은 달력 계산 특성 테스트 추가부터 시작할 수 있다.
