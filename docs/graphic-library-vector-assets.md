# Graphic library vector assets — 2026-10-07

## Scope

The existing authenticated common graphic library now opens on the asset catalog.
Menus: assets, upload, generation. Existing raster uploads, archive/restore, and
raster placement remain supported. New vector assets have no template placement
buttons: page configuration, Runtime/Package delivery, production receipt, and
print-worker integration are explicitly deferred.

Generation is deterministic geometry, not raster AI generation or bitmap tracing.
First supported size is desk standard 260 × 180 mm. Background compositions:
circles, curves, diagonal shapes. Illustration compositions: plant and stationery.
Colors, gradient strength, decoration density (backgrounds), and scale are bounded
parameters. Free dragging and natural-language editing are outside this scope.

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
