# Designer Studio 구조개선 기준선과 코드 지도

- 작성일: 2026-09-06
- 기준 커밋: `main@99aaf67a1e93b59fcdb8672480119ffdf8c310ba`
- 운영 기준: `https://calendar-template-designer.vercel.app/` HTTP 200
- 대상: `apps/designer-studio/index.html`
- 원칙: 화면, 저장 형식, API, 인쇄 결과와 사용자 동작을 바꾸지 않는다.

## 0단계 · 기준선 확인

| 항목 | 기준값 |
|---|---|
| HTML 크기 | 714,352 bytes |
| HTML 줄 수 | 4,547 |
| 인라인 실행 스크립트 | 23개 |
| 외부 스크립트 참조 | 47개 |
| 함수 선언 | 447개 |
| 이벤트 등록 | 221개 |
| `window.*` 재노출 | 86개 |
| 함수 재할당 형태 | 93개 |
| 전체 Studio 검사 | 293개 |
| 최신 starter 기준 | r015, 최신 상태 |

Production HTML은 기준 커밋과 같은 714,352 bytes이며 HTTP 200으로 확인했다. 운영본의 자산 복구 모듈 쿼리는 `20260906.3`이다. 기준 커밋의 회귀검사는 `20260906.4`를 요구하지만 HTML 세 참조만 `.3`으로 남아 전체 빌드 마지막 두 검사가 실패했다. 구조 이동 전에 세 참조를 `.4`로 맞춘다. 이는 실행 파일의 내용이나 기능을 바꾸지 않고 브라우저 캐시만 무효화하는 기준선 정합성 수정이다.

### 기준선에서 반드시 보존할 동작

1. Master Admin 로그인과 랜딩 진입
2. 새 템플릿 9단계 설정과 AI 대표 디자인 생성
3. 12개월 앞·뒷면 24개 자산 확장과 편집 화면 진입
4. 월력 5×7·6×7, 일정 막대, 미니 월력과 월별 개체 렌더링
5. 개체 선택·다중 선택·이동·크기·회전·복제·삭제·되돌리기
6. 현재 페이지·전체 페이지 미리보기와 검토용 PDF
7. 로컬/원격 저장, 버전 이력, 복원, 편집, 템플릿으로 새로 만들기
8. 기존 `acdl-asset://` 및 과거 Supabase 서명 URL 자산 복구

### 모든 기능 묶음의 공통 통과 절차

`대상 회귀검사 → npm run build → GitHub 저장 → Vercel Production 배포 → Production HTTP/기능 확인`

한 묶음이 운영 확인을 통과하기 전에는 다음 묶음을 이동하지 않는다. 실패하면 같은 묶음 안에서 되돌리거나 수정하며 다른 기능을 함께 손대지 않는다.

## 1단계 · 현재 파일의 실행 순서 지도

### 문서와 실행 블록

| 줄 | 현재 책임 | 특징과 위험 | 첫 이동 대상 |
|---|---|---|---|
| 1–282 | 외부 의존 로드, 랜딩·설정·편집기·미리보기·라이브러리 DOM | 모든 모듈이 기대하는 ID 계약 | 마지막까지 HTML에 유지 |
| 283–289 | 첫 진입 임시 연결 | 뒤 초기화가 실패해도 진입을 보장 | 템플릿 설정/라이브러리 묶음 |
| 290–314 | Designer Home 진입 연결 | 같은 버튼을 뒤 런타임도 다시 연결 | 템플릿 설정/라이브러리 묶음 |
| 316–2991 | 핵심 전역 상태와 대부분의 제품 기능 | 2,676줄, 전역 상태·렌더·편집·저장·AI가 강결합 | 다섯 기능 묶음으로 순차 분리 |
| 3011–3149 | 사용자 Workspace 권한 보정 | 기존 함수를 감싸 재할당 | 개체 편집 묶음 |
| 3163–3295 | v34 사용자 옵션·전체 미리보기 보정 | `window.render`, `openFullPreview` 재할당 | 미리보기/PDF 묶음 |
| 3389–3442 | v35 최종 편집 보정 | 삽입 도구, 미리보기, 일정 자동 맞춤 | 개체 편집 후 미리보기 |
| 3450–3507 | v36 템플릿 데이터 입력 | 월별 이미지·색상·사용자 입력 | 템플릿 설정/라이브러리 묶음 |
| 3515–3536 | 이미지 메모리·IndexedDB | 저장 경계와 결합 | 템플릿 설정/라이브러리 묶음 |
| 3549–3657 | 달력 유형 Runtime | 유형 관리·생성·보존 | 템플릿 설정/라이브러리 묶음 |
| 3672–3714 | 안정성 보정 | 저장·렌더 함수 감싸기 | 해당 소유 모듈로 해체 |
| 3739–3776 | 유형 관리자 | 유형 UI와 저장 | 템플릿 설정/라이브러리 묶음 |
| 3793–3912 | Release Candidate 보정 | 프로젝트 생성·렌더·저장 재할당 | 소유 기능별로 분산 이동 |
| 3919–3934 | RC4 Runtime 연결 | 숨은 Runtime 결과 생성 | 월력 렌더링 묶음 |
| 3940–3949 | RC5 비교 미리보기 | Runtime 결과 표시 | 미리보기/PDF 묶음 |
| 3961–4028 | Sprint 2 제품 연결 | 명령·선택·Inspector·Runtime 연결 | 개체 편집 묶음 |
| 4054–4067 | 서비스 Shell 진입 | 진입 모드와 컨텍스트 | 템플릿 설정/라이브러리 묶음 |
| 4071–4089 | 설정 자동 저장·유형 규칙 | 이벤트 중복과 지연 저장 | 템플릿 설정/라이브러리 묶음 |
| 4090–4126 | 미리보기 진입 최종본 | 앞 구현을 무효화하고 최종 핸들러 설치 | 미리보기/PDF 묶음 |
| 4159–4252 | 편집 Workspace 최종 레이아웃 | 개체 탭·검색·Inspector 이벤트 | 개체 편집 묶음 |
| 4324–4366 | 캔버스 자동 맞춤 | `window.renderPage` 감싸기 | 개체 편집 묶음 |
| 4367–4425 | 검토용 PDF | 전체 페이지 복제·이미지 경량화·jsPDF | 미리보기/PDF 묶음 |
| 4426–4443 | 관리자 랜딩 | 인증과 진입 가드 | 템플릿 설정/라이브러리 묶음 |
| 4499–4545 | 템플릿 설정 최종 UI | ⑧ 디자인 유형과 ⑨ AI 생성 연결 | AI 이후 템플릿 설정 묶음 |

### 이미 분리되어 있는 기반

다음 파일은 새로 옮길 대상이 아니라 인라인 코드가 의존하는 기존 경계다.

| 기반 | 현재 역할 |
|---|---|
| `ai-design/*.js`, `ai-design-settings.js`, `ai-design-generation-request.js`, `ai-design-client.js` | 버전이 고정된 AI 규칙·요청·품질 검사 |
| `calendar-domain-bridge.js`, `calendar-preset-catalog.js` | 날짜 셀·일정 lane·월력 프리셋 계산 |
| `project-document.js` | 프로젝트 기본 문서와 템플릿별 보정 |
| `canvas-geometry.js`, `canvas-selection.js`, `canvas-gesture.js`, `canvas-input.js` | 편집 계산과 입력 해석 |
| `inspector-*.js` | Inspector의 독립 계산·검증 |
| `preview-state.js` | 미리보기 진입·복원·복제 계약 |
| `persistence-*.js`, `template-remote-persistence.js` | 이력·IndexedDB·원격 저장 |
| `template-library-runtime.js`, `template-project-loader.js` | 라이브러리와 저장본 복원 |
| `runtime-project-adapter.js`, `desk-academic-*.js` | Runtime 변환·비교·인쇄 기준 |

새 모듈은 이 기반을 호출하며 동일 계산을 다시 만들지 않는다.

## 전역 상태와 결합 지점

핵심 전역 상태는 356행의 단일 선언에 집중되어 있다.

| 상태 묶음 | 변수 | 소유 목표 |
|---|---|---|
| 프로젝트 | `project`, `savedHash` | 공통 session facade |
| 페이지/개체 선택 | `selectedPageId`, `selectedDate`, `selectedElementId`, `selectedElementScope`, `calendarEditing` | 개체 편집 |
| Inspector | `inspectorActiveTab`, `inspectorDirty`, `inspectorNotice` | 개체 편집 |
| 편집 기록 | `history`, `future`, `elementDrag`, `calendarDrag` | 개체 편집 |
| 미리보기 | `preview`, `previewType` | 미리보기/PDF |
| 자산 입력 | `pendingImageElementId`, `pendingSemanticRole`, `semanticImageDraft` | 템플릿 설정/라이브러리 |
| 화면 문맥 | `activeExplorer`, `activeResourcePage`, `currentWorkflowLabel` | 템플릿 설정/라이브러리 |

첫 분리에서는 상태 저장 방식을 바꾸지 않는다. 새 파일은 `window.ACDLDesignerStudioState` 같은 단일 facade를 통해 기존 값을 읽고 쓰되, 저장 JSON에는 이 UI 상태를 추가하지 않는다.

### 함수 재할당 위험

현재 뒤쪽 스크립트는 앞 함수를 93회 감싸거나 교체한다. 특히 아래 최종 연결 순서를 유지해야 한다.

- `render` → Workspace 권한 → 사용자 옵션 → 안정성 → Sprint 2 연결
- `renderPage` → 이벤트 자동 맞춤 → 캔버스 fit
- `openFullPreview` → 사용자 옵션 보정 → 최종 `preview-entry-runtime`
- `makeProject` → 유형별 문서 보정 → Release Candidate migration
- `saveTemplate`, `openSavedTemplateForEdit`, `createFromSavedTemplate` → 원격 저장과 자산 복구
- `switchResourcePage` → 템플릿 설정 ⑧/⑨ 최종 화면

이 순서는 테스트로 먼저 고정하고, 모듈 이동 시에는 최종 구현 하나와 명시적 초기화 함수 하나로 합친다.

## 요청 순서에 따른 분리 지도

### 1. AI 디자인 생성

목표 파일: `features/ai-design-runtime.js`

- 대상: AI 역할 판정, 중립 기준 생성, 대표 세트 적용, 월력 뒷면 구성, 12개월 확장, 재생성, 품질 검사, 편집 화면 진입 진행 상태
- 대표 함수: `pageMatchesAIDesignRole`, `aiDesignTargetPages`, `prepareNeutralAIDesignBase`, `applyAICoverLayout`, `applyAIMonthBackLayout`, `applyAIDesignSampleDraft`, `regenerateFailedAIDesignTargets`, `finishNewTemplateSetup`, `startTemplateEditorAfterGeneration`
- 외부 의존: `ACDLAIDesignSettings`, `ACDLDesignSpec`, `ACDLDesignLayoutApplication`, `ACDLDesignObjectStylePresets`, `ACDLDesignSetExpansion`, `ACDLDesignQuality`
- 보존 검사: 6개 역할, 24개 월별 자산, 새 초안 분리, 편집 개체 유지, 실패 시 원상 복구

### 2. 월력 렌더링

목표 파일: `features/calendar-rendering.js`

- 대상: 월력 영역, 행 수, 제목·요일·날짜 셀, 공공 달력 정보, 기간 일정 막대, 미니 월력, 연력·띠력·플래너·월별 문구 렌더
- 대표 함수: `calendarReferenceForDate`, `calendarGridFor`, `calendarRowCountFor`, `renderCellMiniCalendar`, `buildRangeSegments`, `assignRangeLanes`, `renderRangeEvents`, `renderCalendar`, `renderWidgetElement`
- 외부 의존: `ACDLCalendarDomain`, `ACDLCalendarPresetCatalog`, `project`, 현재 페이지
- 보존 검사: 5×7/6×7, 첫 가로선, 월 제목 간격, 일정 lane, 미니 월력, 월별 인쇄 결과

### 3. 개체 편집

목표 파일: `features/object-editing.js`

- 대상: 자유 개체 렌더, 선택, 페이지 override, 이동·크기·회전, 키보드, 추가·복제·삭제·정렬, Inspector 적용
- 대표 함수: `pageElements`, `masterElements`, `sourceElement`, `materializePageOverride`, `renderFreeElements`, `selectElement`, pointer handlers, `createGraphicElement`, `applyGraphicInspector`, `renderInspector`
- 외부 의존: canvas/inspector 기반 파일, `render`, `snapshot`, `markDirty`
- 보존 검사: 단일·다중 선택, Master/현재 페이지 범위, undo/redo, 잠금·권한, AI 배경 비선택

### 4. 미리보기/PDF

목표 파일: `features/preview-pdf.js`

- 대상: 현재/전체 미리보기, 페이지 복제·정리, 확대, 편집 상태 복원, 검토용 PDF 페이지 렌더와 AI 배경 경량화
- 대표 함수: `hardResetPreviewState`, `openPagePreview`, `openFullPreview`, `fitFullPreviewPage`, `exportReviewPdf`, `waitForImages`, `compressReviewImage`
- 외부 의존: `ACDLPreviewState`, `renderPage`, `html2canvas`, `jspdf`
- 보존 검사: 28면 순서, 260×180mm, 빈 프레임 숨김, 원래 선택 복원, AI 배경 JPEG 경량화

### 5. 템플릿 설정/라이브러리

목표 파일: `features/template-settings-library.js`

- 대상: 랜딩·진입, 새 템플릿 설정, 학교/자산/일정/색상/폰트/Master/출력, 유형 관리, 라이브러리 필터·카드·저장·복원·복제
- 대표 함수: `showDesignerHome`, `openDesignerSetup`, `switchResourcePage`, `openResourceModal`, `renderTemplateLibrary`, `saveTemplate`, `openSavedTemplateForEdit`, `createFromSavedTemplate`
- 외부 의존: `ACDLTemplateLibraryRuntime`, `ACDLTemplateRemotePersistence`, `ACDLTemplateProjectLoader`, `ACDLAdminAuth`
- 보존 검사: 상태 즉시 반영, 저장 진행 표시, 버전 복원, 기존 AI 이미지 복구, 편집/새로 만들기 28면 유지

## 초기화 계약

각 새 파일은 로드 시 즉시 여러 번 이벤트를 붙이지 않는다. 다음 형태를 공통 기준으로 사용한다.

1. 파일은 API 객체만 `window`에 한 번 노출한다.
2. `index.html`의 마지막 bootstrap이 의존 순서대로 `init()`을 한 번 호출한다.
3. `init()`은 중복 호출을 무시한다.
4. 기존 DOM ID와 이벤트 순서는 유지한다.
5. 분리 완료 전에는 기존 함수 이름을 얇은 호환 wrapper로 남긴다.

## 다음 실행 단위

첫 실제 이동은 AI 디자인 생성 묶음이다. 먼저 현재 AI 진입·확장·실패 복구 특성 테스트를 보강하고, 해당 함수만 새 파일로 이동한 뒤 공통 통과 절차를 수행한다. 월력 렌더링은 AI 묶음의 Production 확인이 끝난 뒤 시작한다.
