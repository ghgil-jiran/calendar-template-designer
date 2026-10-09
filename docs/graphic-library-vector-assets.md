# Graphic library vector assets — 2026-10-07

## Scope

The existing authenticated common graphic library now opens on the asset catalog.
Menus: assets, upload, generation. Existing raster uploads, archive/restore, and
raster placement remain supported. New vector assets have no template placement
buttons: page configuration, Runtime/Package delivery, production receipt, and
print-worker integration are explicitly deferred.

The current generator uses authenticated OpenAI Responses structured output to create new vector scene geometry. It does not generate bitmaps or trace them. Legacy deterministic recipes remain reproducible for existing assets.
First supported size is desk standard 260 × 180 mm. Background compositions:
circles, curves, diagonal shapes. Illustration compositions: plant and stationery.
Colors, gradient strength, decoration density (backgrounds), and scale are bounded
parameters. Free dragging and unrestricted AI prompt interpretation are outside this scope.
Free-form design prompts are sent to the provider together with current page settings
and, for revisions, the previous generated scene.

## Persistence contract

Existing endpoint: `/api/template-assets?graphicLibrary=1`, existing admin auth.
Existing storage and `graphic-library.v1` remain in use; no SQL migration.
Existing categories are preserved; `photo` and `vector` are additive.

POST `operation: generate-vector` accepts name/tags/source, a validated `design`,
and optional `parentGraphicId`. Server regenerates the SVG from the recipe. It
never trusts a client-provided generated SVG. Response: `{graphic}`.

A generated record adds:
- `design`: `graphic-vector-design.v1`, size/kind/page/style/palette/colors,
  gradient/density/scale/variation.
- `setInfo`: `graphic-month-set.v1` for monthly pages, academic month order
  3..12,1,2, variation, monthly colors, scope `background-only`.
- `physicalSizeMm`: 260 × 180; SVG viewBox 1300 × 900 is a coordinate system,
  not image DPI.
- `parentGraphicId`, `revision`: immutable variant ancestry. Creating a variant
  never changes the parent's original asset or recipe.
- Original/preview point to the generated SVG asset. No example photo/text is
  embedded. Monthly SVG files are not all pre-stored: their recipes/colors are
  stored, and future page application must explicitly resolve them.

Uploaded SVG is limited to basic geometry, paths, gradients, clipping and groups.
Scripts, event attributes, styles, embedded images, text, filters, external links,
entities, malformed markup, and files over 1 MiB are rejected. Illustrator exports
using unsupported constructs must be simplified before registration.

Pure preview shows only the SVG. Example preview overlays labeled reference zones,
not real template objects. It is not persisted into the actual background.
Seasonal/monthly mode uses predefined seasonal palettes; direct color controls
apply in same-color mode. Month title/grid styles are not modified by this feature.

## Verification

Tests cover vector-only outputs, recipe reproducibility, transparent illustrations,
academic month order, structural identity across monthly variants, uploaded SVG
restrictions, mocked storage reload and immutable variants, and UI callback flow
for default catalog, pure/example view, generation, variant reopening, failure retry,
and absence of new vector placement actions. Full build includes existing regression
checks. Cache-version test was updated to verify versioned resolver loading rather
than an obsolete exact date.

Generated SVG raster preview was inspected. A real browser/admin persistence flow
and final CMYK/PDF-X output have not been verified in this implementation session.
These are required before connecting vector assets to template publishing.

## Library interaction update

The dialog keeps a fixed 92vh height and one content scroll area. Refresh is in the
header. Search preserves its input element and waits for IME composition to finish.
Clicking a thumbnail opens an accessible modal with original preview and editable
name/category/tags/source. PATCH accepts only these metadata fields, status, and a
validated raster thumbnail; asset identities and generation recipes are preserved.
Vector recipe edits create a new variant through the generator.

Generate confirms a result without persistence. Save registers that generated recipe.
Changing recipe controls marks the result stale and disables save until regeneration.
Current prompt refinement uses an AI text model to generate new scene geometry.
The former bounded-command helper remains only for legacy recipe compatibility.

Thumbnails are generated in the browser at at most 240 pixels per edge and saved as
bounded WebP/PNG data URLs in private graphic metadata. Newly uploaded/generated
assets save thumbnails immediately. Existing previews are progressively displayed
and backfilled once; failures retain the existing preview. Catalog metadata loads
with four bounded concurrent requests rather than sequential per-item requests.
Original image resolution and content are never replaced by the thumbnail.

UI callback tests cover generate-before-save, stale result protection, prompt
application, metadata edits, and retry. Storage tests cover thumbnail validation,
metadata persistence, and preservation of original asset identity.

## AI scene generation — 2026-10-07

POST `operation: preview-vector` uses the existing admin auth and Vault key reader.
Default model `gpt-4.1` (server optional `OPENAI_VECTOR_MODEL`). Responses API with
strict JSON schema returns bounded ellipse/rect/path scene data, never executable
SVG or code. New generation invokes the provider only when explicitly requested.
It does not persist assets; Save sends the validated scene and settings through the
existing generate-vector storage operation. Engine/model/generation ID/time/prompt
are recorded, and original/variant ancestry remains unchanged.

Page selection is always available, including illustrations: cover, school symbols,
year overview, planner, month front/back, back cover. Role-specific constraints and
reserved zones go into the prompt. Cover and month back expose content layout
(one photo, two photos, information only, default). Background scene decorations
are clipped outside reserved information/photo rectangles. Reference zones are
preview overlays only and are not embedded as photos or text into the asset.

No result is shown before generation. Current form selections and optional free
prompt create a new composition. Regeneration includes previous scene data and
all current selections; failures retain the prior scene. Up to five prior results
can be restored in memory. Stale settings require regeneration before save.
Monthly sets use one stored scene with seasonal/monthly colors, not 24 saved pages.

Scene limits: 80 shapes, 120 KB normalized scene; per-path 6000 characters, finite
coordinates within bounded ranges, safe numeric paint/transform controls. No text,
external images, filters or scripts. Client and server use the same scene validation
and SVG renderer. Save validates again and regenerates SVG server-side.

Verification includes mocked provider responses for all pages, refinement context,
refusal/incomplete/error handling, scene limits, pure SVG validation, safe-zone
clipping, UI generation/save separation, stale protection and undo. Live paid
provider generation and authenticated browser appearance were not exercised here;
actual design quality and final CMYK/PDF must be reviewed separately. Template page
application remains deferred as requested.

API format reference: https://developers.openai.com/api/docs/guides/structured-outputs

## Focused cover composition 01

Default generator is now `composition: cover-circle-01`: a parametric, locally
generated pure SVG, without a paid AI request. This is an explicit composition
choice, not a silent fallback after failed AI. Existing AI assets and free-generation
mode are preserved as an experimental selection. New AI generation no longer sends
the previous scene; only prompt refinement does.

Composition 01 fixes an upper-left year/title area, large right circular photo,
small lower-left circular photo, and school-info footer. Photos and text are
reference overlays only. Background ribbons flow behind photo positions, with
circular accent borders and a footer band. There is no rectangular photo-zone
clipping. Photo position and circular proportions stay fixed while selected colors,
gradient strength, decorative detail density, and ornament scale affect the SVG.
Irrelevant layout/style/orientation controls are fixed/hidden for this composition.

UI tests cover local generation with no API call, changed controls affecting the
result, stale-save protection, persistence and variant reopening. Vector tests
cover circular geometry and reproducibility. A raster rendering of the actual
generated SVG was visually inspected; authenticated browser layout and final
CMYK/PDF output remain separate unperformed checks. Template application is deferred.

### Cover prompt refinement
Composition 01 now exposes initial and refinement prompts. The local interpreter
applies bounded supported instructions to visible recipe controls: seasonal colors,
gradient/density percentages 0..100, scale 60..140, more/fewer ornaments, larger/
smaller, and explicit hex colors for background/accent 1/accent 2/line. This is
parameter interpretation, not unrestricted AI design. Applied changes are displayed;
unsupported requests retain the prior result and show an explicit message. Known
layout/new-motif requests in mixed prompts are reported as unsupported while valid
parameter changes can proceed. Photo positions and base composition stay fixed.
Final saved record retains the exact recipe, prompt, and variant ancestry.

## 원형 표지 기준 시안 · 2026-10-07
첨부 시안을 참고해 얇은 사진 주변 호, 모서리 블루·세이지 원형 장식, 하단 블루 그라데이션 띠로 구성합니다. 순수 배경에는 사진·연도·학교정보가 들어가지 않으며 배치 예제에서 영역을 확인합니다.

- 세 설정은 50~150%, 기본 100%입니다.
- 그라데이션 농도: 색상·방향을 유지하며 배경 장식과 하단 띠의 색 농도를 변경합니다.
- 장식 밀도: 개수를 유지하고 장식을 바깥쪽 또는 안쪽으로 이동해 간격을 변경합니다.
- 장식 전체 크기: 원형 장식을 함께 확대·축소합니다. 사진 영역·연도·학교정보와 사진 주변 호는 고정합니다.
- coverTuning에 실제 적용값을 저장합니다. 기존 coverTuning 없는 자산의 벡터 재현 경로는 유지합니다. 기존 자산을 변형할 때 원본을 보존하며 새 기준값으로 생성합니다.
- 왼쪽 설정 변경 후 생성 버튼으로 결과에 적용합니다. 지원하는 프롬프트는 같은 설정값으로 변환하며 임의의 개체 편집은 지원하지 않습니다.

## 2026-10-08: Template graphic packages

- Catalog GET returns `graphics` (unchanged `graphic-library.v1` assets) and `packages` (`graphic-package.v1`). Old assets are never converted or overwritten.
- Asset browsing offers All / Individual images / Packages. Desktop cards use five columns, with responsive four/three/two column layouts. Existing upload, image detail, metadata and archive operations remain available.
- Package creation stores a named desk-standard 260 × 180mm draft. Save a cover first, then select and generate each page. The available roles cover cover/inside, interleaves, monthly front/back, rear interleaves/back-cover, and optional symbols/year/planner.
- Packages contain immutable asset references under `pages[role] = {graphicId, derivedFromCoverId, updatedAt}`. Each edit generates a separate asset and updates only that page reference. Cover replacement leaves all other pages untouched; the UI labels previous-cover-derived pages and provides explicit restart from the current cover.
- Monthly front/back retain one composition and a 12-month academic color set (March–February), rather than independent incompatible geometry.
- A saved vector asset for the selected role can be linked without altering its original. Current generation is vector-only; photo uploads retain the individual-asset flow.
- Standard circle covers derive page-aware margin compositions sharing palette and `familyTuning` (tone/spacing/scale, 50–150%, default 100). Legacy revision 1 clips safe content zones; new revision 2 retains independent backgrounds (see below). Cover photo zones are never copied to every page. AI-generated covers send a validated reference recipe to the experimental generator for subsequent pages.
- Create: POST `create-package`; metadata/archive: PATCH `update-package`; page save or existing-asset link: POST `save-package-page`. Revision conflicts return 409 and require reopening the package. The existing authenticated internal route and private graphics storage are reused; no SQL migrations or public diagnostic routes are added.
- This package is distinct from a Template Package. Selection/application is now available in Editor template page settings (see integration section below). User Service delivery and final print-PDF verification remain follow-up work.

## 2026-10-08: Simplified package and generator workspace

- The Package tab immediately displays existing active package cards and a Create new package button. Selecting a card opens the workspace directly. New-package metadata is saved before opening the page workspace; failed metadata requests retain the form.
- Existing and newly saved packages share one workspace: package identity, metadata edit, and a page selector with saved/uncreated/cover-required status. Linking an existing page asset and restarting from the cover are secondary collapsed actions. The full page-card grid is no longer repeated above the generator.
- Vector generation uses one form: basic settings across the top, design parameters and one generation/edit prompt at left, result and save/undo at right. Package name, size, kind and page are inherited rather than repeated as disabled inputs. Fixed SVG format and fixed composition controls are not selectable duplicates.
- First generation and regeneration use the same prompt and submit action. Editing retains the previous scene for the same page, and undo restores the matching prompt. Switching page/purpose in standalone generation does not reuse an unrelated page scene.
- Storage schemas, authenticated APIs, immutable asset preservation, template/runtime integration and print paths are unchanged.

### Direct package entry
The Package tab immediately displays saved active package cards and a New Package button. Clicking a saved package opens its page workspace directly; there is no Edit Existing gate or separate browse step. New Package still opens metadata entry before saving and entering the workspace. Refresh updates the visible package list.

### Compact page toolbar and work feedback
Live feedback is a separate labeled status panel. Page selector and page actions share one row, with contextual guidance underneath. The action dropdown lists existing compatible backgrounds and (for non-cover pages) restarts from the current cover style. Selecting an asset attaches it immediately without replacing its original record; selecting rebase resets only the current draft. Unsaved-change confirmation and API revision checks remain in place. Saved cover guidance no longer says the cover must be saved first.

### Package deletion
Package cards expose Edit and Delete. The authenticated DELETE API checks package schema and expected revision, then removes only its private JSON record from common-graphics storage. It does not archive the package or delete linked individual assets, template packages or snapshots. Confirmation is required; failures retain the visible card.

### Independent background revision 2
New generation explicitly saves backgroundRevision:2. Cover and month-back use layered large pale circles, secondary overlapping circles, fine arcs and small accents with different geometry. Other derived pages use a quieter shared family. Content example zones never clip these backgrounds; only page boundaries crop decorations. Tone changes color strength, density changes spacing without adding shapes, scale changes all ornament sizes. Legacy recipes without the revision retain revision 1 reproduction. Existing assets are not overwritten; regenerating creates a new result which must be saved explicitly.

### Warm ivory / terracotta / sand palette
The palette selector includes terracotta (#FCF9F3, #C48770, #D6C4A8, #745344). It works with existing compositions and package derivation; palette and exact colors are saved for reproduction. Korean terracotta, sand and warm ivory prompts select it. Composition 02 is implemented as described below.

### Composition 02: rectangular background
The cover generator offers cover-rectangle-02, defaults its palette to warm ivory / terracotta / sand when selected, and uses locally generated rounded rectangular planes. The layout example has one centered landscape photo, year beneath, and school information below; no footer band is painted. Pure SVG contains only background rectangles and gradients, without photo/text references or content-area cutouts. Tone, density and scale remain 50–150%; decoration count and example zones stay fixed. Stored style:rectangle carries the family into derived package pages and monthly sets. Composition 01 and existing records are preserved.


### Template page-setting integration (Preview, 2026-10-08)
- Design types shows aligned No AI design and Use vector image checkboxes. Vector mode uses the same authenticated `/api/template-assets?graphicLibrary=1` library list, requires a saved background package, and selects No AI design. Unchecking vector mode removes only managed package backgrounds; photos, text, calendar objects and original library assets remain intact.
- Selection copies a `template-graphic-package.v1` snapshot into `project.template.settings.graphicPackage`: package identity/revision, exact graphic/original asset references, normalized design recipes and per-page overrides. Refreshing, modifying or deleting the library package does not replace this snapshot. Selecting a package again deliberately captures its current version.
- Page settings shows current physical pages and automatic/manual/none choices. Annual and school-symbol purposes take precedence over physical cover/insert faces. Otherwise the matching physical face is used. A missing background is explicitly shown and leaves existing basic content/background intact. Page structure and all non-package objects are preserved.
- Existing templates use the Apply backgrounds button. New No AI templates apply the selection after default content layout. Monthly instances use actual `calendarMonth`, including January/February, and preserve the saved monthly color variation rule.
- Native SVG is regenerated from the copied recipe; thumbnail PNGs are never used for page backgrounds. The 260×180mm trim canvas is extended by 3mm per side to 266×186mm, with an enlarged SVG viewport and background fill. Multiple SVGs namespace their gradient IDs to avoid cross-page palette leakage. Other dimensions are rejected rather than silently stretched.
- Common screen vector helpers use the same recipe renderer; the existing Runtime adapter carries recipe/month/bleed in vector value and style with the expanded millimeter frame. The source models load before initial editor rendering so reopened templates can render these backgrounds immediately.
- Scope boundary: User Service has not been updated or deployed. Final native PDF primitive/gradient expansion is not implemented or certified by this change. Managed backgrounds explicitly retain a locked runtime-expansion-required print intent; they must not be promoted as a generic rectangle or declared print-ready. CMYK/PDF and real printing remain separate follow-up verification.
- Verification: mapping, DOM-handler contract, actual editor-renderer layer routing, serialized snapshot and Runtime adapter tests; 775 Studio tests and full build passed. The bleed SVG was rendered to PNG and inspected separately. Browser could not reach the local server, and protected Preview is not bypassed. Automated tests are not actual-screen or final-PDF approval.


### Compact vector settings and monthly variations (Preview, 2026-10-08)
- Design types owns one bounded workspace with top menus: package selection, page backgrounds, and monthly variations. Mapping is no longer located in the separate Page settings screen; it reads the saved page configuration there. Only the active pane is shown, with internal scrolling and preserved scroll position when choices change.
- A bottom Edit button is available in No AI mode. Vector mode applies the background configuration before entering editing; new templates retain the existing default-layout initialization path. Existing templates preserve their content and close settings after applying.
- Monthly front/back have independent same/seasonal/monthly color options, defaulting to monthly. Saved settings live in the template snapshot's monthlyVariations, never mutate the library package, and are copied into each actual page's effective design. Tuned standard recipes expose tone, spacing and scale (50–150%); legacy/custom recipes keep color controls without unsupported tuning sliders. Existing tuned package values are inherited.
- The monthly palette is now passed into circle/rectangular decoration generators as well as the canvas and global gradients. Shape geometry remains identical while actual ornament colors change. Preview thumbnails are regenerated from the same effective recipe used by editor background application, in actual academic-month order including January/February.
- Footer/menu handlers, independent monthly choices, foreground preservation and actual decorative color differences are covered by regression tests. Full Studio suite: 779 tests passed; full build passed. Circle and rectangular monthly SVGs were rendered to PNG for separate visual inspection; actual deployed-screen and final-PDF verification are not claimed. Native PDF/User Service scope boundaries from the previous section still apply.


## 카테고리·테마별 벡터 자산 (2026-10-08)

라이브러리 생성·관리 단계만 구현했다. 템플릿 에디터·사용자 서비스에서 새 테마 자산을 배치하는 연결은 후속 작업이다. 기존 도형·프레임·샘플 메뉴는 변경하지 않았다.

| 카테고리 | 기본 샘플 수 | 구성 |
| --- | ---: | --- |
| 학교·학습 | 8 | 연필, 책, 자, 학교, 지구본, 책가방, 학사모, 플라스크 |
| 계절·자연 | 8 | 새싹, 봄꽃, 햇살, 구름, 비, 잎, 눈꽃, 나무 |
| 행사·활동 | 8 | 깃발, 메달, 풍선, 버스, 달력, 트로피, 선물, 안내 |
| 장식 | 4 | 월계수, 배지, 모서리 장식, 물결 |
| 기본 도형 | 16 | 기존 에디터 분류를 참고한 새 경로 |
| 사진 프레임 | 8 | 사각·둥근·원·타원·아치·육각·별·하트 |

기본 샘플은 직접 작성한 도형·경로이다. AI 자유 생성이나 임의 프롬프트 생성으로 표시하지 않는다. 생성 개수는 사용자가 선택하며, 현재 카테고리의 고유 샘플 수를 상한으로 명시한다. 하나의 합성 그림이 아니라 개별 SVG 자산을 만든다. 표지/기준 개체 선행 저장을 요구하지 않는다.

흐름: 카테고리 → 새 테마/기존 테마 → 이름·개수·색상·선 두께 저장 → 현재 설정으로 생성 → 개별 이름·개체·색상 수정/재생성 → 개별 또는 전체 저장. 개체 선택과 색상 선택 변경은 다시 생성 버튼으로 반영한다. 선 두께는 40mm 기준 0.2~1.2mm이다. 테마 정보 수정 뒤 생성 버튼으로 전체 결과를 재생성할 수 있다.

`graphic-illustration-theme.v1`은 메타데이터와 슬롯별 자산 ID, optimistic revision을 저장한다. `graphic-illustration-recipe.v1`은 재현 설정이다. 개별 자산은 기존 `graphic-library.v1`에 저장하며 `vectorObject`에 100×100 좌표계의 경로·도형·색상·기준 크기·선 두께를 보관한다. 사진 프레임은 테두리와 별도 mask 경로를 함께 보관한다. 테마 수정 시 다른 카테고리로 이동하거나 저장된 슬롯을 생성 개수 밖으로 줄이지 않는다. 개별 재저장 시 부모 ID·개체 revision을 남기며 원본을 덮어쓰지 않는다. 원본은 버전으로 이미지 자산 목록에 남는다.

서버가 SVG를 재생성하고 허용 태그·속성을 검사한다. 외부 참조·사진·텍스트·폰트·필터가 없다. 구조 검사 통과는 PDF 출력 품질 인증이 아니다. `printQuality.structure=passed`, `output=not_run`, sRGB와 실제 기준 크기를 저장한다. 최종 크기에서의 선 두께·프레임 마스크·공통 Runtime/PDF Worker 매핑·CMYK 출력은 후속 연결 검증이 필요하다. 직접 SVG 검사를 native PDF 통과로 표시하지 않는다.

이미지 자산 첫 화면은 패키지 카드를 표시하지 않는다. 새 패키지 생성 자산은 서버 소유 메타데이터로 구분한다. 기존 패키지는 패키지 이름 접두어가 있는 생성 자산을 화면에서 제외하는 보수적 호환 규칙을 사용한다. 독립 자산을 기존 이미지 사용으로 패키지에 연결해도 소유권을 바꾸지 않는다. 과거에 이름이 변경되거나 패키지가 삭제된 자산은 자동 소유 분류가 어려워 목록에 남을 수 있다. 데이터 일괄 수정·삭제는 하지 않는다.

라이브러리 메뉴 이동과 닫기/재열기는 작성 초안을 보존하며 저장 확인을 요청하지 않는다. 실제 생성 작업을 다른 작업으로 교체하거나 테마/페이지를 바꿔 초안을 버리는 시점에는 대상이 명확한 확인을 유지한다. 업로드는 기존 원본 등록 경로를 유지하며 설정/미리보기/하단 등록 버튼으로 정리했다. SVG 업로드 한도는 1MB로 유지한다.


## 학교 특화 AI 테마 생성 (2026-10-09)

현재 테마 화면은 등록된 개별 벡터 이미지를 먼저 보여준다. 전체/카테고리와 테마 필터를 제공하고, 이미지가 없는 테마도 선택 목록에 표시해 수정할 수 있다. 기본 샘플 선택 생성은 새 테마의 기본 기능에서 제외했다. 기존 샘플 자산과 테마의 원본은 보존하며 기존 테마에 설명을 입력·저장해 AI 생성으로 전환할 수 있다.

새 테마 기본 입력은 이름, 카테고리, 만들 내용, 생성 개수(1~24), 그림 스타일이다. 색감은 선택적인 접힘 항목이며, 정해진 색상 조합·선 두께를 기본 폼에 노출하지 않는다. 테마마다 AI가 개체 주제와 설명, 네 가지 색, 공통 그림 스타일을 정한다. 선은 40mm 기준 0.35mm로 통일한다. 계획은 테마 JSON에 보관해 중단·재열기에도 유지하며, 정보 수정 시 재구성한다.

`plan-illustration-theme`은 기존 관리자 인증과 Vault AI 키를 통해 Responses API를 호출하고 테마의 이름·설명·개수·스타일을 반영한 계획을 저장한다. `preview-illustration-asset`은 저장된 계획의 한 슬롯을 대상으로 실제 경로·기하를 요청한다. 기존 OpenAI 모델 설정과 연결을 재사용하며 별도 서비스·키·공개 진단 경로를 추가하지 않는다. 카테고리 샘플을 가져오거나 AI 오류를 고정 샘플 성공으로 바꾸는 fallback이 없다.

`graphic-illustration-recipe.v2`는 generated 종류와 경로·도형 scene, 색상, 주제, 실제 선 두께를 저장한다. 경로 명령/좌표/길이, 도형 범위, 색상 인덱스, 개체 수를 검사하며 SVG는 서버에서 재생성하고 기존 검증기를 통과해야 저장된다. 텍스트·폰트·이모지·사진·필터·외부 참조를 허용하지 않는다. 프레임은 닫힌 사진 mask와 그림을 별도로 보관한다. 이는 구조 검사이며 프레임 개구부 모양의 적절성, 최종 배치 크기에서의 가독성, CMYK/PDF 출력 품질을 인증하는 검사는 아니다.

일괄 생성은 계획 후 개체별 순차 요청이다. 현재 개체 완료 후 중단, 개별 수정 프롬프트/재생성, 개별·완료 결과 일괄 저장을 지원한다. 생성 실패 시 해당 개체에 오류를 표시하고 이전 그림을 유지하며, 완료된 다른 결과를 저장할 수 있다. 생성 직후 자동 등록하지 않으며 명시적으로 저장한다. 재저장 시 이전 원본과 버전 연결을 보존한다. 생성 정보에 실제 사용 모델·생성 ID·수정 요청을 남긴다.

검증 구분: 자동 테스트는 provider 응답을 모의한 API·저장·UI 흐름 검사이다. 실제 OpenAI에 유료 호출을 실행한 품질 검증과 구분한다. 이 작업 환경에는 관리자 인증 세션과 Vault 연결 환경이 없으므로 여기서 실제 AI 이미지 품질을 확인했다고 주장하지 않는다. Preview에서 기존 관리자 AI 연결로 실행하는 경로를 제공하며, 보호 배포나 인증을 우회해 테스트하지 않는다. 공통 Runtime·사용자 서비스·최종 PDF 연결은 후속 단계이다.

### 2026-10-09 · 달력용 테마 생성 간소화
새 테마의 기본 입력은 학용품·계절·한국 전통문양·식물 중 테마 선택과 생성 개수(1~24)입니다. 저장 이름과 추가 요청은 접힌 선택사항이며 색상·스타일·카테고리 중복 입력을 제거했습니다. `themeKind`를 저장하고 기존 테마와 자산은 기존 경로로 유지합니다. 기존 테마 수정 시 같은 카테고리의 새 기준으로 전환할 수 있습니다.
학용품은 연필·지우개·자·공책 등 학용품만 생성합니다. 각 테마는 구별되는 24개 대상 중 요청 개수를 AI가 선택하며, 공급자 JSON schema의 이름 enum과 서버 검증 모두 테마 외 개체를 거부합니다. 추가 요청도 테마 범위를 확장하지 않습니다. 실제 형상은 AI가 생성하며 고정 SVG 샘플로 대체하지 않습니다. 개별 수정·원본 유지·새 자산 저장 흐름을 유지합니다. 윤곽·인접 색 대비·대상 특징을 생성 지침에 강화했습니다. 구조 검사는 디자인 만족도나 최종 PDF 인쇄 품질 검증과 다릅니다.

### 2026-10-09 · 직접 제작 기준 시안 8개
학용품(연필·지우개·자·공책), 계절(벚꽃·해바라기·단풍잎·눈송이)을 직접 좌표 제작한 순수 SVG로 제공합니다. AI 결과나 래스터 추적 결과가 아닙니다. `server/graphic-curated-data.js`는 실제 경로와 미리보기용 WebP 썸네일만 포함합니다. 모든 개체는 기존 recipe.v2 / vector-object.v1 구조로 저장해 개별 재생성·새 버전 저장 경로를 유지합니다. 40×40mm 기준 선 두께 0.28mm; 출력 검증은 not_run입니다.
관리자 인증을 통과한 최신 Preview의 그래픽 라이브러리 목록 요청에서 두 테마와 여덟 자산을 기존 저장소와 template_assets에 실제 등록합니다. 로컬에는 관리자 세션/서버 환경이 없으므로 배포 직후 원격 저장 완료를 단정하지 않습니다. edition별 결정적 UUID와 create-only 쓰기로 중복·원본 덮어쓰기를 방지합니다. 미완료 테마는 중간에 저장된 개체를 재사용하며 재시도합니다. 완료한 테마의 편집·보관 상태는 유지합니다. 새 공개 데이터 API나 인증 우회 경로는 추가하지 않습니다.
