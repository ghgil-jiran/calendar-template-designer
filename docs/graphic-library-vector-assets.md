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
- Standard circle covers derive page-aware margin compositions sharing palette and `familyTuning` (tone/spacing/scale, 50–150%, default 100). Safe content zones are clipped out. Cover photo zones are never copied to every page. AI-generated covers send a validated reference recipe to the experimental generator for subsequent pages.
- Create: POST `create-package`; metadata/archive: PATCH `update-package`; page save or existing-asset link: POST `save-package-page`. Revision conflicts return 409 and require reopening the package. The existing authenticated internal route and private graphics storage are reused; no SQL migrations or public diagnostic routes are added.
- This package is distinct from a Template Package. Selection/application in template page settings, User Service delivery and final print-PDF verification remain follow-up work.

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
The palette selector includes terracotta (#FCF9F3, #C48770, #D6C4A8, #745344). It works with existing compositions and package derivation; palette and exact colors are saved for reproduction. Korean terracotta, sand and warm ivory prompts select it. Composition 02 remains a design proposal at this stage.

### Composition 02: rectangular background
The cover generator offers cover-rectangle-02, defaults its palette to warm ivory / terracotta / sand when selected, and uses locally generated rounded rectangular planes. The layout example has one centered landscape photo, year beneath, and school information below; no footer band is painted. Pure SVG contains only background rectangles and gradients, without photo/text references or content-area cutouts. Tone, density and scale remain 50–150%; decoration count and example zones stay fixed. Stored style:rectangle carries the family into derived package pages and monthly sets. Composition 01 and existing records are preserved.
