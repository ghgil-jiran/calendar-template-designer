# Repository Structure Specification v1.0

## 저장소 이름

`calendar-publishing-platform`

## 권장 구조

```text
calendar-publishing-platform/
├─ apps/
│  ├─ designer-studio/
│  ├─ preview-workspace/
│  └─ calendar-workspace/
├─ packages/
│  ├─ domain/
│  ├─ schemas/
│  ├─ template-runtime/
│  ├─ calendar-engine/
│  ├─ publishing-contract/
│  └─ school-domain/
├─ docs/
├─ schemas/
├─ samples/
├─ tools/
├─ README.md
├─ CHANGELOG.md
└─ ROADMAP.md
```

## 현재 단일 HTML 데모 처리 원칙

릴리스 직전에 무리하게 모노레포로 완전 분해하지 않는다. 최신 실행 소스는 우선 `apps/designer-studio/`에 보존하고, 구조 분리는 외부 MVP 분석과 Integration Contract 확정 후 진행한다.
