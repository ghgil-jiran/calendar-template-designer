# Calendar Template Designer v1.0 Beta RC4

## 목표
Runtime Extraction 결과를 Designer Studio와 연결해 Integration Ready 상태를 만든다.

## 구현
- `designer-runtime-integration` 패키지 추가
- LegacyProjectAdapter 구현
- DesignerRuntimeBridge 구현
- ScreenRenderer render-model adapter 구현
- Designer Studio의 모든 `render()` 이후 Runtime 자동 실행
- `window.ACDLRuntimeBridge` 공개 API
- `acdl:resolved-document` 브라우저 이벤트
- Runtime 상태 배지 및 진단 확인
- 월력 페이지에 합성 Calendar Render Object 생성
- Master 요소와 Page 요소를 동일한 ResolvedPage에 병합

## 안전 전략
기존 렌더링은 유지하고 Runtime을 Shadow mode로 연결했다. 따라서 RC4는 화면 회귀 위험을 줄이면서 실제 프로젝트 데이터에 Runtime을 지속 실행한다.
