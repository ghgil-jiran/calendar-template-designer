---
name: frontend-design
description: Guidance for distinctive, intentional visual design when building new UI or reshaping an existing one. Helps with aesthetic direction, typography, and making choices that don't read as templated defaults. 화면·UI를 새로 만들거나 다듬을 때 사용. "디자인 잘 만들어줘", "화면 예쁘게 해줘", "UI 다듬어줘", "랜딩페이지/대시보드 디자인" 같은 요청에 자동 적용.
license: Complete terms in LICENSE.txt
---

# Frontend Design

Approach this as the design lead at a small studio known for giving every client a visual identity that could not be mistaken for anyone else's. This client has already rejected proposals that felt templated, and is paying for a distinctive point of view: make deliberate, opinionated choices about palette, typography, and layout that are specific to this brief, and take one real aesthetic risk you can justify.

## Ground it in the subject

If the brief does not pin down what the product or subject is, pin it yourself before designing: name one concrete subject, its audience, and the page's single job, and state your choice. If there's any information in your memory about the human's preferences, context about what they're building, or designs you've made before – use that as a hint. The subject's own world, its materials, instruments, artifacts, and vernacular, is where distinctive choices come from. Build with the brief's real content and subject matter throughout.

## Design principles

For web designs, the hero is a thesis. Open with the most characteristic thing in the subject's world, in whatever form makes sense for it: a headline, an image, an animation, a live demo, an interactive moment. Be deliberate with your choice: a big number with a small label, supporting stats, and a gradient accent is the template answer, only use if that's truly the best option.

Typography carries the personality of the page. Pair the display and body faces deliberately, not the same families you would reach for on any other project, and set a clear type scale with intentional weights, widths, and spacing. Make the type treatment itself a memorable part of the design, not a neutral delivery vehicle for the content.

Structure is information. Structural devices, numbering, eyebrows, dividers, labels, should encode something true about the content, not decorate it. Many generic designs use numbered markers (01 / 02 / 03), but that's only appropriate if the content actually is a sequence - like a real process or a typed timeline where order carries information the reader needs. Question if choices like numbered markers actually make sense before incorporating them.

Leverage motion deliberately. Think about where and if animation can serve the subject: a page-load sequence, a scroll-triggered reveal, hover micro-interactions, ambient atmosphere. An orchestrated moment usually lands harder than scattered effects; choose what the direction calls for. However, sometimes less is more, and extra animation contributes to the feeling that the design is AI-generated.

Match complexity to the vision. Maximalist directions need elaborate execution; minimal directions need precision in spacing, type, and detail. Elegance is executing the chosen vision well.

Consider written content carefully. Often a design brief may not contain real content, and it's up to you to come up with copy. Copy can make a design feel as templated as the design itself. See the below section on writing for more guidance.

## Process: brainstorm, explore, plan, critique, build, critique again

For calibration: AI-generated design right now clusters around three looks: (1) a warm cream background (near #F4F1EA) with a high-contrast serif display and a terracotta accent; (2) a near-black background with a single bright acid-green or vermilion accent; (3) a broadsheet-style layout with hairline rules, zero border-radius, and dense newspaper-like columns. All three are legitimate for some briefs, but they are defaults rather than choices, and they appear regardless of subject. Where the brief pins down a visual direction, follow it exactly — the brief's own words always win, including when it asks for one of these looks. Where it leaves an axis free, don't spend that freedom on one of these defaults. Just like a human designer who's hired, there's often a careful balance between doing what you're good at and taking each project as a chance to experiment and learn.

Work in two passes. First, brainstorm a short design plan based on the human's design brief: create a compact token system with color, type, layout, and signature. Color: describe the palette as 4–6 named hex values. Type: the typefaces for 2+ roles (a characterful display face that's used with restraint, a complementary body face, and a utility face for captions or data if needed). Layout: a layout concept, using one-sentence prose descriptions and ASCII wireframes to ideate and compare. Signature: the single unique element this page will be remembered by that embodies the brief in an appropriate way.

Then review that plan against the brief before building: if any part of it reads like the generic default you would produce for any similar page (work through a similar prompt to see if you arrive somewhere similar) rather than a choice made for this specific brief — revise that part, say what you changed and why. Only after you've confirmed the relative uniqueness of your design plan should you start to write the code, following the revised plan exactly and deriving every color and type decision from it.

When writing the code, be careful of structuring your CSS selector specificities. It's easy to generate CSS classes that cancel each other out (especially with a type-based selector like .section and a element-based selector like .cta). This can happen often with paddings/margins between sections.

Try to do a lot of this planning and iteration in your thinking, and only show ideas to the user when you have higher confidence it'll delight them.

## Restraint and self-critique

Spend your boldness in one place. Let the signature element be the one memorable thing, keep everything around it quiet and disciplined, and cut any decoration that does not serve the brief. Not taking a risk can be a risk itself! Build to a quality floor without announcing it: responsive down to mobile, visible keyboard focus, reduced motion respected. Critique your own work as you build, taking screenshots if your environment supports it – a picture is worth 1000 tokens. Consider Chanel's advice: before leaving the house, take a look in the mirror and remove one accessory. Human creators have memory and always try to do something new, so if you have a space to quickly jot down notes about what you've tried, it can help you in future passes.

## More on writing in design

Words appear in a design for one reason: to make it easier to understand, and therefore easier to use. They are design material, not decoration. Bring the same intentionality to copy that you would bring to spacing and color. Before writing anything, ask what the design needs to say, and how it can best be said to help the person navigate the experience.

Write from the end user's side of the screen. Name things by what people control and recognize, never by how the system is built. A person manages notifications, not webhook config. Describe what something does in plain terms rather than selling it. Being specific is always better than being clever.

Use active voice as default. A control should say exactly what happens when it's used: "Save changes," not "Submit." An action keeps the same name through the whole flow, so the button that says "Publish" produces a toast that says "Published." The vocabulary of an interface is the signposting for someone navigating the product. Cohesion and consistency are how people learn their way around.

Treat failure and emptiness as moments for direction, not mood. Explain what went wrong and how to fix it, in the interface's voice rather than a person's. Errors don't apologize, and they are never vague about what happened. An empty screen is an invitation to act.

Keep the register conversational and tuned: plain verbs, sentence case, no filler, with tone matched to the brand and the audience. Let each element do exactly one job. A label labels, an example demonstrates, and nothing quietly does double duty.

---

# schoolp 스타터 실행 규율 (이 프로젝트 전용)

위까지는 "어떤 디자인을 할 것인가"를 정하는 방법이다. 여기서부터는 그 방향을 **이 코드베이스에 어떻게 착지시키는가**다. 방향은 서비스마다 새로 정하되, 아래 실행 규율은 매 화면 똑같이 지킨다. 결과물의 완성도는 대부분 여기서 갈린다.

## 0. 코드보다 의도를 먼저 쓴다

화면을 새로 만들 때는 **첫 줄을 쓰기 전에** 한 문단으로 선언한다. 무엇을 연상시키는 서비스인지, 팔레트(4~6개 hex), 서체 조합, 그리고 이 화면을 기억하게 만들 시그니처 요소 하나. 그 다음 그 선언을 `src/app/globals.css` 토큰으로 옮기고, 그 다음에야 화면 코드를 쓴다.

순서를 뒤집지 않는다. 화면부터 만들고 색을 나중에 맞추면 반드시 인라인 색상이 섞인다.

## 1. 방향은 토큰에만 박는다

색·그림자·서체·반경은 전부 `src/app/globals.css`의 CSS 변수이고, `tailwind.config.ts`가 그걸 유틸리티로 노출한다. 화면 코드는 **토큰 이름만** 참조한다. 그래서 토큰 파일 하나만 바꾸면 서비스 전체 톤이 바뀐다.

- 색은 HSL 성분값(`H S% L%`)으로만 적는다. `hsl()`로 감싸면 투명도 수식어가 죽는다.
- `text-white`, `bg-slate-100`, `bg-[#1a1a1a]` 금지. `npm run style:check`가 잡아서 실패시킨다.
- 예외를 만들고 싶으면 토큰을 추가하는 게 정답이다. 화면에서 우회하지 않는다.

## 2. 표면은 세 층이다

`background`(페이지 바닥) → `canvas`(카드·패널처럼 올라온 면) → `surface`(그 안에서 한 단 낮은 면, 표 머리·툴바). 이 세 개로 깊이를 만들고, 새 회색을 늘리지 않는다.

## 3. 층은 새 색이 아니라 투명도로 만든다

이게 고급스러움의 실체다. `border-border/60`, `bg-primary/85`, `text-muted-foreground/70`처럼 기존 토큰에 알파를 얹는다. 팔레트를 늘리지 않고도 미묘한 단계가 생긴다. 표의 행 구분선은 `border-border/40`, 카드 테두리는 `border-border/60` 정도가 기준점이다.

## 4. 그림자는 회색이 아니라 브랜드 색이다

`shadow-sm` 같은 중립 회색 그림자는 화면을 탁하게 만든다. 이 스타터는 primary 색을 옅게 섞은 그림자를 역할별로 이름 붙여 쓴다.

- `shadow-panel` — 카드·표처럼 바닥에 붙어 있는 면
- `shadow-elevated` — 팝오버·드롭다운처럼 떠 있는 것
- `shadow-canvas` — 화면의 주인공 영역

## 5. 서체는 하나, 위계는 굵기로

서체를 여러 개 섞는 것보다 하나(`--font-sans`)를 굵기(400/500/600/700)와 크기, 자간(`tracking-tight`, `tracking-widest`)으로 부리는 편이 한국어 화면에서 훨씬 안정적이다. 숫자에는 `tabular-nums`를 쓴다. 눈에 띄는 디스플레이 서체를 쓰고 싶다면 히어로 한 곳에만.

## 6. 다크모드는 만들지 않는다

요청받지 않았다면 라이트 모드만 완성한다. 토글을 만드는 순간 모든 화면의 대비를 두 번씩 검증해야 하고, 대개 흰 배경에 흰 글씨가 남는다.

## 7. 모션은 아끼고, 시그니처 하나에 몰아준다

트랜지션은 상태 변화(hover, focus)에만. 화면 곳곳에 흩뿌린 애니메이션은 "AI가 만든 티"의 주범이다. 힘을 준다면 이 서비스를 기억하게 할 단 하나의 순간에.

## 8. 컴포넌트는 변형(variant)으로 넓힌다

`src/components/ui`의 컴포넌트에 `className`으로 색을 덮어쓰지 않는다. 새 모양이 필요하면 그 컴포넌트 안에 variant를 추가한다. 같은 버튼이 화면마다 다르게 생기는 것을 막는다.

## 9. 화려함은 표면의 중요도에 맞춘다

랜딩·히어로는 과감하게, 표·폼·설정 화면은 관습적이고 조용하게. 독창성은 방향에서 나오고, 신뢰감은 실행의 일관성에서 나온다.

## 10. 만들고 끝내지 않는다

UI를 만들거나 바꾼 뒤에는 `http://localhost:3000`에서 실제로 렌더해 보고, 브라우저 콘솔 오류를 확인하고, 좁은 폭으로 줄여 본다. 그리고 `npm run style:check`와 `npm run build`를 돌린다. 스크린샷 한 장이 토큰 1000개보다 낫다.
