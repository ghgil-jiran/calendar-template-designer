# ADR-003: ResolvedDocument를 렌더러 경계로 사용

- 상태: Accepted
- 결정: 모든 Renderer는 Template JSON을 직접 읽지 않고 Runtime이 생성한 ResolvedDocument만 읽는다.
- 이유: Designer Studio, Workspace, PDF, Thumbnail의 결과 일관성을 보장하고 UI 구현과 도메인 해석을 분리한다.
- 영향: 기존 단일 HTML 렌더링은 RC4에서 Runtime Adapter를 거쳐 단계적으로 전환한다.
