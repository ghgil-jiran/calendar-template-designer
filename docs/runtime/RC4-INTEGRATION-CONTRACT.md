# RC4 Integration Contract

## 목적
Designer Studio의 기존 `acdl-project` 데이터를 Template Runtime Contract로 변환하고, `ResolvedDocument`를 화면·PDF·썸네일 렌더러의 공통 경계로 사용한다.

## RC4 실행 경로

`Legacy Project → LegacyProjectAdapter → Template + Dataset → TemplateRuntime → ResolvedDocument`

RC4에서는 기존 DOM 렌더러를 제거하지 않는다. 동일한 프로젝트를 Runtime에도 전달하는 **Shadow Integration**을 사용한다. 편집 결과는 기존 화면에 유지되며 Runtime 결과는 `window.ACDLRuntimeBridge.lastDocument`에 보관된다.

## 브라우저 이벤트
Runtime 실행이 끝나면 `acdl:resolved-document` 이벤트를 발생시킨다. 외부 Workspace, Preview, PDF Adapter가 이 이벤트 또는 `execute()` API를 이용할 수 있다.

## 전환 규칙
1. RC4: Shadow mode, 기존 Renderer가 화면의 기준
2. RC5: 비교 mode, Legacy DOM과 ScreenRenderer 결과 회귀 비교
3. v1.0 Beta: Runtime Renderer가 화면 기준, Legacy Renderer는 fallback
