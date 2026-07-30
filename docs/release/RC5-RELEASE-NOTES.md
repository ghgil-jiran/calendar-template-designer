# RC5 Release Notes — Renderer Parity & Publishing Core

RC5는 Legacy Renderer를 즉시 제거하지 않고, Runtime Renderer를 실제 화면에서 비교할 수 있는 parity 단계까지 올린 릴리스다.

## 구현
- RenderNode 1.1 공통 모델: frame, rotation, opacity, style, payload, fingerprint
- RenderDiffEngine: added/removed/changed/unchanged 노드 계산
- CollisionEngine: 겹침 진단
- Text auto-fit/overflow, image fit, calendar grid 기본값 정규화
- ScreenRenderer DOM mount API
- PublishingRenderer SVG 페이지 출력
- ParityComparator
- Designer Studio의 `Runtime 미리보기` 패널

## 전환 정책
현재 편집 화면의 기준은 Legacy Renderer다. RC5 Runtime 미리보기와 출력 모델을 병행 검증한 뒤 v1.0 Beta에서 기본 렌더러 전환 여부를 결정한다. 이 방식은 편집 회귀 위험을 줄인다.
