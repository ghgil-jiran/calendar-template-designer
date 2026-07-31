# 1.0.0-beta.1 — Foundation Developer Preview

릴리스 날짜: 2026-07-30  
공유 준비 확인: 2026-07-31

## 목적

이미 구현된 Designer Studio와 Runtime 기반을 GitHub에서 동료에게 공유하고, 제품 방향 및 다음 Workspace 통합에 대한 피드백을 받기 위한 첫 공개 베타입니다.

## 주요 기능

- 브라우저 기반 Designer Studio
- 페이지 및 오브젝트 편집
- 선택, 이동, 크기 조절을 포함한 Editor Core
- Calendar Domain 및 공통 Contract
- Template Runtime과 `ResolvedDocument`
- LegacyProjectAdapter와 DesignerRuntimeBridge
- Runtime 화면 미리보기
- SVG Publishing Renderer
- RenderDiff 및 Collision 진단 기반

## 검증 결과

2026-07-31 기준 다음 명령이 통과했습니다.

```bash
npm run verify
```

통과 항목:

- Template Runtime RC3 / RC5
- Designer Runtime Integration RC4 / RC5
- Contracts
- Editor Core Sprint 2
- Calendar Domain
- Renderer Core
- Sprint 2 제품 상호작용 회귀 검사
- Designer Studio 인라인 스크립트 검사

## 알려진 제한

- 편집 화면과 Runtime Renderer가 아직 하나의 Renderer로 완전히 통합되지 않았습니다.
- PDF/PNG 최종 인쇄 출력은 후속 Publishing Engine에서 구현합니다.
- Calendar Workspace는 구조만 준비되어 있으며 사용자용 제작 흐름은 다음 릴리스에서 연결합니다.
- 일부 문서는 개발 이력 보존을 위해 RC 기준으로 남아 있습니다.

## 동료에게 확인받고 싶은 항목

- 프로젝트 목표와 제품 구조가 이해되는가
- Designer Studio의 기본 편집 흐름이 자연스러운가
- 템플릿 디자이너와 학교 사용자 Workspace를 분리한 방향이 적절한가
- 실제 학사달력 제작에서 가장 먼저 필요한 사용자 기능은 무엇인가

## 다음 릴리스

**Workspace Integration**

템플릿 선택부터 학교 데이터 적용, 최종 미리보기까지의 사용자용 MVP를 현재 Runtime Contract에 연결합니다.
