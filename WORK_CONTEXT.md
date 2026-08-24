# Work Context

## 현재 상태 · 2026-08-25

- 현재 브랜치: `refactor/designer-structure-a2`
- 원격 기준: `6b55dbf`의 Supabase 템플릿 영구 저장·Vercel Preview 검증 완료 상태
- 사용자 계정의 통합 개발 Supabase `calendar-editor-runtime-dev`에 템플릿 영구 저장 표 5개와 비공개 `template-assets` 버킷을 적용했다.
- 라이브러리는 템플릿별 최신본 한 개만 표시하고, 명시적 저장은 수정 불가 버전으로 누적하며 자동저장은 임시본 한 개만 갱신한다.
- Vercel Node API에 최신본·정식 저장·자동저장·버전 목록·복원·이미지 자산 저장 경로를 추가했다.
- 에디터는 IndexedDB에 먼저 저장한 뒤 원격 저장하며, 원격 장애 시 로컬 사본을 유지한다.
- Base64 이미지는 SHA-256으로 중복 제거해 비공개 Storage에 저장하고 원격 JSON에는 `acdl-asset://<id>`만 남긴다.
- Vercel Preview에 Supabase URL, service role, 내부 접근 토큰을 등록하고 재배포했다.
- 첫 Preview에서 정적 Package·디자인 토큰 404와 시스템 베이스 원격 저장의 ID·분류 오류를 확인해 Vercel 전용 정적 출력과 저장 결과 처리를 보완했다.
- Vercel의 실제 작업 위치와 저장소 루트 양쪽에서 정적 출력을 생성하도록 빌드 경로를 보완했다.
- 루트 URL에서 사용하는 모든 상대 스크립트·스타일을 정적 출력 루트에도 배치하고 HTML 참조 파일 누락을 자동검사한다.
- 다른 브라우저에서 원격 저장본을 열 때 원격 템플릿 ID·stable key·최신 버전 번호를 편집 Project에 복원한다.
- 전체 Studio 자동검사 127/127, 제품 상호작용, 인라인 스크립트 19개, 스타일 보호 검사가 통과했다.
- 사용자 육안 검증에서 접근 코드, 시스템 베이스 불러오기, A3 세로 13면 페이지 이동, 원격 저장, 다른 브라우저 재조회가 모두 정상 동작했다.
- 라이브러리에는 최신 카드 한 개만 표시되고 같은 템플릿의 재저장은 `v2`로 누적되며, 다시 연 뒤 편집한 개체 위치가 유지됨을 확인했다.
- 초기 재열기 오류로 생성된 중복 프로젝트는 삭제하지 않고 `archived_at`으로 보관 처리해 버전 증거를 유지했다.

## 다음 할 일

1. 최신 카드에서 필요할 때만 펼치는 버전 이력 목록과 이전 버전 미리보기·복원 UI를 완성한다.
2. 복원이 과거 버전을 덮어쓰지 않고 새 최신 버전으로 누적되는지 자동검사와 Preview 육안검사로 확인한다.
3. 드래그 성능, Undo/Redo, 복제, 정렬, 잠금, 수치 입력을 달력 템플릿 에디터 지속 개선 작업으로 분리해 우선순위를 확정한다.
4. 개선된 편집기에서 벽걸이형 표준 01 디자인을 마무리한 뒤 결정적 Template Package 내보내기를 진행한다.
5. 내보낸 벽걸이형 Package를 사용자 서비스에서 선택·편집·저장·재오픈·13면 미리보기·PDF까지 검증한다.

---

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
- 대표 Runtime 기준 Package: `desk-academic-standard@1.0.0`
- 정밀 배치 검토 Package: `desk-academic-standard@1.1.0` (`runtime-parity-review`, 배포 불가)

## 2026-08-23 작업 결과

- 사용자 서비스 샘플과 Runtime PDF 28면 일괄 비교에서 검증된 좌표를 새 Template Package 버전으로 분리
- `1.1.0`에 연간 제목·월력, 월력 헤더·요일·본문, 사진·메모의 절대 frame 계약 추가
- 공통 TypeScript Runtime과 브라우저 Shadow Runtime이 `1.1.0`의 `layoutContract`를 실제 렌더 좌표로 소비하도록 연결
- 연간 12개월·월력 세 영역·사진/메모 두 영역을 Package 데이터만으로 구성하며 `1.0.0` 출력 계약은 그대로 유지
- `1.1.0`을 템플릿 에디터 시스템 베이스의 검토 완료 Sample Template로 등록
- Package 28면을 편집기 Project로 변환하고 개체 이동·크기 변경을 기존 저장 형식으로 보존하는 Adapter와 회귀검사 추가
- 사용자 로컬 브라우저에서 2028 Sample 선택·14장 28면·기본 양식·개체 이동/크기 변경·저장·재오픈 보존을 육안 확인
- Studio 전체 진입 파일 무결성 보호, bridge 정적 경로, 포트 인자와 라이브러리 필터 오류를 복구
- 기존 `1.0.0` 소비 경로와 사용자 UI·저장·PDF 경로는 변경하지 않음
- 다음 단계는 검증된 `1.1.0` Sample을 사용자 서비스의 선택 가능한 정확 버전 Package로 연결하고 동일 편집·저장·재오픈 Runtime 결과를 확인하는 것

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
- undo/redo의 대용량 `data:` 이미지 중복 제거와 참조 복원을 `persistence-history.js`로 분리
- 프로젝트 clone·변경 hash·자동 복구 레코드 생성을 `persistence-project.js`로 분리
- 기존 JSON 저장 형식, 자동 복구 `latest` 키, 선택 페이지와 IndexedDB 연결은 유지
- IndexedDB 공통 열기·읽기·쓰기를 `persistence-indexeddb.js`로 분리
- 기존 `acdl-template-storage-v25/templates`, `acdl-v361-assets/assets·recovery` 계약을 테스트로 고정
- Legacy Project→Runtime 페이지·개체 변환을 `runtime-project-adapter.js`로 분리
- 기존 Designer Dataset과 외부 사용자 서비스 Dataset을 같은 Runtime 경로에 주입할 수 있는 인자 경계 추가
- 외부 Dataset 주입 시 원본 프로젝트와 28면 페이지 구성 Adapter를 변경하지 않는 검사 추가
- GitHub 앱에서 사용자 서비스 비공개 저장소 조회가 403으로 차단되어 실제 v1.1 필드 Adapter는 원본 재확인 전까지 보류
- 이후 GitHub 연결로 사용자 서비스 `integration/runtime-v2`의 Dataset 계약·Adapter·테스트를 원본 확인
- 변환 로직을 복제하지 않고 Adapter 결과를 검사하는 `user-service-dataset-bridge.js` 추가
- 3월 시작·일요일 시작·5행, 학교명, 연락처 배열, 월별 AssetRef·원본 쪽수, 출처 ID를 Shadow mode 진입 전에 검증
- 사용자 서비스 진단과 템플릿 경계 진단을 합치고 오류 Dataset은 28면 구성을 시작하지 않도록 차단
- 기존 사용자 UI, Designer Dataset, 저장·미리보기·PDF 기본 경로는 변경하지 않음
- 사용자 서비스의 실제 이미지 경로가 IndexedDB `calendar-uploads/assets`의 `dataUrl` 우선, Supabase `print-assets/user/{id}` 폴백임을 확인
- 저장소 구현을 주입받는 `user-service-asset-resolver.js`를 추가하고 URL·로컬·클라우드·누락 경로를 회귀검사로 고정
- 원본 AssetRef와 Dataset을 변경하지 않고 Shadow Runtime 전용 복제본에만 렌더 가능한 `src` 추가
- 동일 ID 비동기 조회를 캐시하고 누락 이미지는 `ASSET_NOT_FOUND` 경고로 반환
- Dataset→Asset→28면→Package→HTML 렌더→Parity를 한 번에 수행하는 숨은 `user-service-shadow-session.js` 추가
- 학교명·일정·월별 이미지 키·이미지 해석 수와 28면 역할 구성을 원본과 Runtime 사이에서 자동 비교
- 사용자 서비스 `school.contacts[]`를 Package의 `school.contact` 읽기 모델로만 투영하고 원본은 보존
- 실제 Package와 12개월 URL 이미지를 사용하는 28면 통합 회귀검사 통과, 사용자 경로 교체 승인은 계속 false
- Shadow 세션 결과를 `user-service-shadow-diagnostic.v1` JSON으로 축약하는 브라우저 진단 경계 추가
- 학교 Dataset, 렌더 HTML, 이미지 본문과 알 수 없는 진단 필드를 보고서에서 제거하는 회귀검사 추가
- 동일 진단 규칙을 `@calendar-publishing/designer-runtime-integration` TypeScript 모듈로 내보내 사용자 서비스가 import할 진입점 준비
- Template Package를 URL 또는 직접 import JSON으로 조립하는 공통 TypeScript 로더 추가
- manifest 필수 파일과 ID·버전 불일치를 공통 모듈에서 차단
- Package Master→공통 문서 변환과 28면·5행·사진·연락처 진단을 TypeScript Runtime으로 공개
- 기존 브라우저 Runtime과 공통 TypeScript Runtime의 문서·진단 결과 동등성 검사 추가
- 사용자 Dataset의 학사연도·시작월만으로 14장 28면을 만드는 공통 Surface Plan API 추가
- Legacy Designer Project 없이 Dataset+Template Package로 공통 문서를 생성하는 API 추가
- 3월~다음 해 2월, 월력 12면·사진/메모 12면·끝지 순서를 기존 브라우저 기준과 대조
- 사용자 서비스 전용 ESM·타입 선언·고정 Template Package 배포 폴더 생성 도구 추가
- `@calendar-publishing/user-service-runtime-bridge@0.1.0-alpha.1`과 `desk-academic-standard@1.0.0` 버전 고정
- 배포 파일 SHA-256 기록과 임시 설치본 실제 import·28면 생성 검사 추가

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

1. 로컬 브라우저에서 `1.1.0` Sample Template 선택과 28면 순서 확인
2. 교가 등 개체 이동·크기 변경 후 저장·재오픈 화면 확인
3. 동일 2028 Dataset으로 `1.0.0`과 `1.1.0` 28면 PDF 결과 재비교
4. 사용자 서비스에는 review 버전 선택 경계만 연결하고 기본 버전 전환은 승인 후 진행
5. PDF/X-4 실물 비교와 Preflight는 기능 구조 통합 뒤 별도 승인 단계에서 진행
