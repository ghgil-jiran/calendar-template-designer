# Work Context

## 현재 프로젝트

Calendar Template Designer / Calendar Publishing Platform Core Engine

## 현재 상태

- Designer Studio v1.0.0-beta.1 구현 완료
- Template Runtime, ResolvedDocument, Screen/SVG Renderer, RenderDiff, Collision Diagnostics 포함
- 기존 사용자용 Academic Calendar Workspace MVP는 별도 프로젝트로 존재
- schoolp 개발 기준 r015를 기존 화면과 기능을 보존한 상태로 적용
- 우리학교인쇄 운영 서버에는 아직 배포하지 않음

## 제품 통합 순서

1. 현재 저장소를 독립 환경에서 빌드·테스트·검증
2. GitHub private 저장소에 문서와 소스, 로드맵을 함께 저장
3. 기존 사용자 MVP를 Runtime Contract에 연결
4. 가격 산정, 주문 데이터, 최종 인쇄 파일 전달 계약 검증
5. 통합 QA와 실제 인쇄 파일 검수
6. 검증 완료 후 우리학교인쇄 운영 서버 환경에 배포

## 보존 원칙

- 기존 Designer Studio 화면과 기능을 starter 예제로 교체하지 않는다.
- `apps/designer-studio/index.html`을 현재 제품 UI의 기준으로 유지한다.
- schoolp 디자인 토큰은 별도 요청 전까지 적용하지 않는다.
- 인증, 결제, 개인정보, 운영 DB, 주문 서버 연동은 자동 변경하지 않는다.
