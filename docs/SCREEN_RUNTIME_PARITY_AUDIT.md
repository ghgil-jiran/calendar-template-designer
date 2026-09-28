# 화면 렌더링 규칙 이관 점검 · 2026-09-28

## 범위와 판정 기준

- 비교 자료: `desk-260x180-custom-digital-aura-motion-01@1.0.4` Package의 30면. 이 버전은 분석 기준이며 저장하거나 덮어쓰지 않는다.
- `개체가 Runtime 문서에 남아 있다`와 `두 서비스가 같은 픽셀로 그린다`는 별개로 판정한다.
- 이 문서는 소스 코드와 첨부된 에디터 3월 화면을 조사한 결과다. 최신 에디터 화면의 Package 버전 표시는 확인되지 않았으므로 화면과 Package의 동일 저장 시점은 미확정이다.
- 화면 비교, 저장·재열기, 최종 인쇄 PDF는 각각 별도의 검증 결과로 기록한다.

## 현재 Package 개체 범위

| 페이지 | 면수 | 페이지 개체 | Master 개체/면 | 내부 합성 |
| --- | ---: | ---: | ---: | --- |
| 월력 앞면 | 12 | 24 | 1 | 코드가 월력 영역을 별도 생성 |
| 월력 뒷면 | 12 | 48 | 1 | 페이지 개체 + Master |
| 나머지 표지·간지·뒷표지 | 6 | 26 | 0 | 페이지 개체 |
| 전체 | 30 | 98 | 월력 Master 2종 | 12개 월력 앞면에 내부 달력 추가 |

Master의 실제 표시 개체 수는 페이지별 상속·가림 규칙에 따라 계산해야 한다. 개체 수는 렌더링의 완전성을 증명하지 않는다.

## 규칙 경계

| 규칙 | 에디터 저장/화면 경로 | 사용자 서비스 경로 | 상태 |
| --- | --- | --- | --- |
| 면 순서, Master 가림, 페이지 개체 | `book.pageInstances`, `template.masterElements`, `book.elementsByPage` → `page-composition-runtime.js:visibleElements` | `designer-snapshot-adapter.ts:visibleElementsForPage`에서 별도로 구현 | 현재 Package 구조 검사 통과, 구현 공유는 미완료 |
| 개체의 x/y/크기, 데이터 연결, 표시 여부, 권한 | Package 개체 → 에디터 `renderFreeElements` | Package 개체 → Snapshot adapter → Runtime object | 전달 검사 통과, 시각적 결과는 별도 |
| 월력 영역 좌표 기준 | `.surface-content`가 공통 화면 배치 계약의 안쪽 영역을 사용; `.calendar-region`은 그 내부 좌표 | synthetic calendar를 같은 계약으로 페이지 좌표로 변환 | **코드 경로 일치, Preview 실측 미검증** |
| 월력 제목·요일·날짜 행 | 에디터 `renderPage` + `.calendar-region`/`.calendar-stage` CSS | `RuntimeMonthCalendar` React DOM + 별도 스타일 | 제목 마크업 6종과 outlined-pills 요일 CSS 공통화, 격자와 컨테이너는 별도 |
| `outlined-pills` 요일 테두리·모서리·간격 | 에디터가 공통 `shared-screen-calendar-presentation.css` 사용 | 사용자 서비스도 동일한 CSS 파일을 사용하고 공통 계산값으로 행·격자 간격 설정 | **코드 경로 일치, Preview 실측 미검증** |
| 레이어/가림 순서 | 달력 `z-index:5`, 일반 개체 묶음 `.free-layer` `z-index:20` | 개별 Runtime 개체의 `zIndex` 정렬 | 현재 교표 우선순위는 유사, 일반 규칙 일치는 미검증 |
| 미니월력 화면 | `shared-screen-mini-calendar.js`의 모델/마크업 | 동일 버전 모듈 복사본의 모델/마크업 | 공통 경로 있음, CSS와 실제 픽셀 일치 미검증 |
| 메모·벡터 등 | 일부 공통 마크업/벡터 모듈, 일부 에디터 CSS | 동일 모듈 복사본과 서비스 화면 규칙 혼용 | 종류별 추가 검사 필요 |
| 표지/상징/연력/뒷면의 모든 페이지 규칙 | 에디터 `renderWidgetContent`, `renderSemanticObject`, 페이지별 CSS | `RuntimeSnapshotObject`의 유형별 React 분기 | 일부 독립 구현, 전체 30면 시각 일치 미검증 |

## 3월 앞면에서 확인한 인과관계

저장된 월력 영역은 `(x=5,y=8,w=90,h=87)`이고 교표는 페이지 기준 `y=14.7,h=5.5`이다. 에디터에서는 월력 영역이 `surface-content`의 안쪽 좌표이므로 페이지 기준 시작점이 `y=7+0.88×8=14.04%`, 요일 시작점이 약 `21.7%`다. 서비스의 페이지 전체 좌표 해석에서는 요일 시작점이 약 `16.7%`라 교표 영역(`14.7~20.2%`)과 겹친다. 첨부된 최근 에디터 3월 화면은 요일이 교표 아래에 있는 모습이다. 이것은 현재 Package의 숫자를 바꾸라는 결론이 아니라 **좌표계 계약 누락을 확인한 사례**다.

## 공통 구현으로 옮길 순서

1. 페이지의 **좌표계**를 `screen-composition.v1`의 `contentFramePct`로 명시한다. `shared-screen-composition.js`가 기존 Package의 안쪽 영역 호환값과 새 Package의 역할별 값을 해결하고, 에디터 화면과 두 Runtime 변환에서 동일하게 사용하도록 연결했다. 편집 가능 개체의 레이어 그룹과 뒷면 위젯의 내부 좌표계는 아직 이 계약에 포함되지 않았다.
2. 공통 달력 화면 모듈이 제목·요일·격자의 **마크업과 스타일**까지 제공하도록 한다. `outlined-pills` 요일 표시와 월 제목의 여섯 가지 마크업을 공통 파일로 옮겼다. 월 제목 스타일은 공통 CSS에 연결했으나 기존 에디터 CSS 중복과 서비스 헤더 컨테이너 차이는 실측이 필요하다. 격자 유형 이름 네 가지는 공통 모듈이 해석한다. 날짜 격자의 DOM/CSS·다른 요일 스타일은 아직 분리되어 있다.
3. Master/페이지 개체 선택과 표시 여부를 단일 합성 함수로 통일한다. 사용자 데이터와 이미지 치환은 합성 후 값만 바꾸고 개체 정의·레이어·권한을 유지한다.
4. 각 Package 버전에 대해 대표 앞면·뒷면과 다른 유형 1면을 먼저 비교하고, 이후 30면의 객체 목록·화면·저장·재열기를 검증한다. 인쇄 경로는 별도 판정한다.

## 수용 조건

- 페이지/개체를 조용히 누락하거나 지원되지 않는 화면 규칙에 기본값을 임의 적용하지 않는다. 지원하지 않는 계약 버전은 명확한 진단을 낸다.
- 에디터와 서비스가 같은 Package ID/버전, 같은 샘플 Dataset에서 동일한 좌표계·레이어·스타일을 사용한다.
- 사용자 학교 정보/이미지로 Dataset만 바꿔도 화면의 개체 구조와 배치는 유지된다.
- 탁상형 외 제품군은 새 제품군 전용 서비스 CSS 분기를 추가하지 않아도 Package가 명시한 계약으로 그려져야 한다.

## 이번 경계 구현과 검증

- `shared-screen-composition.js@1.0.0-preview.1`을 에디터 화면·에디터 Runtime adapter·서비스 Snapshot adapter가 사용한다. 서비스의 vendor 복사본은 에디터 원본과 바이트가 같다.
- 이전 Package는 기존 에디터 화면의 안쪽 영역을 명시적인 호환값으로 사용한다. 새 Package는 `template.screenComposition = {schemaVersion:'screen-composition.v1',surfaces:{'monthly-front':{contentFramePct:{x,y,width,height}}}}`를 지정할 수 있다. 알 수 없는 버전과 잘못된 영역은 오류로 처리한다.
- 현재 분석 Package의 12개 월력 앞면을 실제 Snapshot adapter로 변환하여 요일 시작점이 교표 하단보다 낮음을 확인했다. 다른 안쪽 영역을 가진 Package도 좌표가 따라 변하는 테스트를 통과했다.
- `outlined-pills`의 색·테두리·반경·여백은 공통 CSS 원본과 서비스 복사본이 동일하다. 사용자 서비스의 중복 인라인 테두리와 `999px` 반경을 제거했고, 서비스 빌드는 통과했다.
- 현재까지 **좌표계·outlined-pills 요일·월 제목 마크업**을 공통화했다. 월 제목의 최종 CSS 우선순위, 레이어 그룹·날짜 격자의 실제 선/패딩/행 구성·다른 요일 스타일·페이지별 위젯은 분리돼 있으며 Preview 실측, 저장·재열기, PDF 검증은 남아 있다.

## 소스 근거

- 에디터: `apps/designer-studio/features/object-editing.js`, `apps/designer-studio/designer-studio-core.css`, `apps/designer-studio/page-composition-runtime.js`, `apps/designer-studio/shared-screen-calendar-layout.js`.
- 사용자 서비스: `src/lib/runtime-integration/designer-snapshot-adapter.ts`, `src/features/editor/runtime-shadow-preview.tsx`, `src/vendor/shared-screen-calendar-layout.js`.

## 2026-09-28 격자 비교

- 비교 Package `desk-260x180-custom-digital-aura-motion-01@1.0.4`의 Master 월력 `design.gridStyle`은 `boxed`다. 에디터는 요일·날짜를 한 `.calendar` 격자에 넣고 격자 좌·상단과 각 칸 우·하단에 선을 그린다. 사용자 서비스는 제목/요일/날짜를 각각 분리하고 `CalendarDay`의 개별 칸에 선을 그리므로 박스 경계와 내부 여백은 아직 일치 판정을 할 수 없다.
- 새 `shared-screen-grid-presentation.js`는 `boxed/minimal/open-rows/detached-cards`의 클래스 해석을 두 화면에 공통 적용하고 알 수 없는 값은 오류로 알린다. 서비스의 미지정 격자 기본값을 에디터와 같이 `boxed`로 맞췄다. 격자 DOM/CSS는 아직 옮기지 않았으며 원본 Package 버전은 수정하지 않았다.
- 에디터 관련 테스트 13개, 사용자 서비스 빌드는 통과했다. 두 Preview의 같은 버전 시각 비교 및 저장·재열기·PDF 일치 검증은 미완료다.

## 박스형 날짜 선 적용 (2026-09-28)

- 사용자 서비스의 `boxed` 날짜 격자에 외곽 좌·상단 선과 각 날짜 칸의 우·하단 선을 공통 CSS로 연결하고, 이 경우의 칸 사이 gap을 0으로 설정했다. 다른 세 격자 유형은 변경하지 않았다. 에디터의 캘린더는 요일과 날짜를 같은 Grid로 그리며, 사용자 서비스는 별도 Grid를 유지하므로 요일/날짜 경계와 행사 막대 배치가 정확히 일치한다고 판단할 수 없다.
- `desk-6` 전용 고정 선 색 CSS를 발견했으나 현재 비교 Package의 `metadata.sampleFamily`는 비어 있어 적용되지 않는다. 이 Package의 테마 선 색 `#f0a36b`와 같은 색인지 실제 Preview에서 판정해야 한다.
- 사용자 서비스 `npm run build` 통과. Preview 배포와 실측은 미완료이며 인쇄 검증 완료 Package `desk-260x180-custom-editorial-graphic-01@1.0.17`은 수정하지 않았다.

## 월력 칸 안의 미니월력 (2026-09-28)

- 에디터는 대상 월의 설정에 따라 미니월력을 5~6행으로 그리고, 사용자 서비스의 종전 `RuntimeMiniMonth`는 `buildMonthGrid`의 5행 고정 결과만 그렸다. 현재 비교 Package는 `calendarRows=6`이다.
- 공통 `shared-screen-mini-calendar.js`에 날짜 칸용 마크업 함수를 추가해 에디터와 서비스에서 동일하게 호출한다. 대상 월의 5/6행, 월 시작 요일, `desk-6` 적응형 행 수를 공통 모델에서 해석한다. 공통 CSS에 날짜 칸 미니월력 스타일을 포함했다.
- 모듈 테스트는 5/6행 개수와 제목·격자 계약을 통과하고 서비스 빌드를 통과했다. 런타임 전체 날짜/일정 오버레이 및 Preview에서의 실측은 아직 미검증이다.
