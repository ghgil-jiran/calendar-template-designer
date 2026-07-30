# Calendar Template Designer v1.0 Beta

Calendar Publishing Platform의 첫 공개 베타 패키지다. Designer Studio, Template Runtime, 기존 프로젝트 어댑터, Runtime 화면 미리보기와 SVG Publishing Renderer를 함께 제공한다.

## 빠른 실행

1. `apps/designer-studio/index.html`을 Chrome 또는 Edge에서 연다.
2. 새 템플릿을 만들거나 기존 JSON을 불러온다.
3. 좌측 하단의 Runtime 상태와 `Runtime 미리보기`로 현재 페이지의 해석 결과를 확인한다.

## 핵심 구조

```text
Designer Studio
  → LegacyProjectAdapter
  → Template Runtime
  → ResolvedDocument
  → ScreenRenderer / PublishingRenderer
```

현재 편집 조작은 안정성을 위해 기존 편집 Renderer를 유지하고, Runtime Renderer는 미리보기·검증·출판 중간 모델의 기준으로 사용한다. 이 제한은 숨기지 않으며 `docs/release/KNOWN-ISSUES.md`와 전환 계획에 기록되어 있다.

## 패키지

- `packages/template-runtime`: Template + Dataset → ResolvedDocument
- `packages/designer-runtime-integration`: Legacy adapter, bridge, screen/SVG renderer, parity comparator
- `schemas/runtime`: 입력·출력 JSON Schema
- `apps/designer-studio`: 브라우저에서 바로 실행하는 Designer Studio

## 검증

루트에서 다음 명령을 실행한다.

```bash
npm run verify
```

개별 패키지 테스트:

```bash
cd packages/template-runtime && npm test
cd ../designer-runtime-integration && npm test
```

## 릴리스 상태

- 버전: `1.0.0-beta.1`
- 상태: Public Beta
- 다음 목표: Runtime Renderer를 편집 화면의 기본 Renderer로 단계적으로 승격하고 기존 Calendar Workspace MVP와 통합

## 우리학교인쇄에서의 역할

이 저장소는 우리학교인쇄의 회원·주문·결제·배송 시스템을 대체하는 앱이 아니라, 서비스 안에서 호출되는 달력 편집 및 출판 엔진입니다. 엔진과 사용자 MVP를 독립 환경에서 먼저 검증한 뒤, 가격 산정·주문 데이터·최종 인쇄 파일 전달을 연결하고 마지막에 우리학교인쇄 운영 서버에 배포합니다.

자세한 경계와 배포 순서는 다음 문서를 참고합니다.

- `docs/integration/SCHOOLP-PRINT-SERVICE-BOUNDARY.md`
- `docs/integration/PRINT-ORDER-INTEGRATION-DRAFT.md`
- `docs/deployment/DEPLOYMENT-STAGES.md`
- `WORK_CONTEXT.md`
- `HANDOFF.md`
