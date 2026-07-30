# v1.0 Beta RC3 — Runtime Extraction

## 추가
- `packages/template-runtime` TypeScript 패키지
- Template, Dataset, Binding, Runtime, ResolvedDocument, Renderer 경계 정의
- BindingResolver, ObjectResolver, PageResolver, LayoutEngine, RenderModelBuilder 구현
- Runtime JSON Schema 3종
- 자동 빌드 및 최소 회귀 테스트

## 유지
- RC2 Designer Studio는 그대로 실행 가능하다.
- RC3 Runtime은 아직 기존 UI 렌더링 경로를 대체하지 않는다.

## 다음
RC4에서 Designer Studio에 Adapter를 추가하고 현재 페이지·전체 미리보기를 ResolvedDocument 기반으로 전환한다.
