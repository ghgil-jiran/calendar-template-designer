# Common library illustration connection

The editor picker adds active illustration assets with `graphic-vector-object.v1` as `type: vector`, `assetId: graphic-library-vector`. Photo-mask frames are excluded until their separate image/mask contract is implemented. Arbitrary uploaded SVG files without this validated definition are not enabled by this change.

Each placed element contains a snapshot of paths, primitive geometry, four paint colors and stroke width, plus `graphicSource` ID, original asset ID and source revision. The initial physical size is 40 × 40 mm converted to the current page percentages. Vector coordinate dimensions are never interpreted as raster pixels or DPI. Thumbnail images are only catalog previews.

The shared vector helper validates and renders the embedded definition. The service vendor copy is identical to the editor helper; it does not fetch a mutable catalog during template rendering. The designer snapshot adapter retains palette, geometry and source version. Color/layout edits retain the saved custom geometry rather than switching to a stock icon. Existing drawing tools and stock asset IDs remain compatible.

## User-service permissions

Current source has click/drop insertion in ElementsPanel and RuntimePackageEditorSurface. Ordered documents disable editing. UserProductionCheckModal also blocks final confirmation/submission when the separate page-element store contains any added elements (`hasAddedElements`). Therefore insertion is not currently supported from editing through production submission. This change does not grant insertion permissions or remove that guard. Template-contained illustrations use the existing snapshot Runtime.

A future user insertion feature must explicitly define per-template permissions and include newly inserted objects in the frozen submission snapshot and the shared Runtime/PDF path before removing the guard. Reading a central catalog alone is not sufficient.

## Scope and verification

This connects common-library illustrations to template authoring and service rendering. It does not migrate the editor's stock icons or the service's static SVG/bitmap catalogs, and does not turn school-specific uploads into common assets. These remain a later migration task with legacy-ID compatibility.

Native print intent remains `runtime-expansion-required`; this is not a print-ready certification. Tests check all 56 curated definitions, pure vector rendering, immutable snapshots, inspector preservation, service snapshot transfer and existing user insertion contracts. Authenticated deployed UI and final CMYK PDF require separate verification.
