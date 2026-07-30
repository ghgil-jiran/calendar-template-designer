# RC5 Render Model 1.1

`ResolvedDocument`는 Renderer가 소비하는 유일한 문서 경계다.

```text
Template + Dataset
        ↓
TemplateRuntime
        ↓
ResolvedDocument 1.1
        ↓
RenderNode[]
        ├─ ScreenRenderer
        ├─ Runtime Preview
        ├─ PublishingRenderer(SVG)
        └─ RenderDiffEngine
```

RenderNode의 핵심 필드는 `id`, `type`, `frame`, `rotation`, `opacity`, `style`, `payload`, `fingerprint`이다. fingerprint는 부분 갱신과 parity 분석을 위해 사용한다.
