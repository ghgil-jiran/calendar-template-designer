# Customer common object tools

Desk and poster calendars share the same object tools and limited editing policy. The sidebar always uses `편집도구`, with the selected object's label underneath. Only permitted targets are selectable on the canvas. Pages with no permitted objects show a dedicated message; pages awaiting selection show a selection hint.

Bound text has a positive visibility checkbox where the corresponding school field permits hiding. It reflects saved state and preserves the value while hidden. Font family, size and color use compact rows. Bold, italic and underline are contextual toolbar actions. Coordinates are adjusted on the canvas rather than through numeric sidebar fields. Hidden grouped contacts retain the other visible contact rows.

Replaceable monthly-front photos can move and resize. Poster school text and images use the same supported controls; calendar/year/background objects, hard locks and excluded school data remain protected. Semantic and ordinary image fitting use the same authored renderer as customer previews.

Sharing checkboxes initially are off and reset when selecting another object/page. Enabling a checkbox applies the current corresponding property immediately, and subsequent edits of that selected object use the selected scope. Layout sharing copies geometry only. Image sharing changes only image content and preserves recipient fitting and geometry. One action has one undo/redo step, including a shared image reset. School-common image bindings retain their common behavior; when a non-logo image has a valid sharing group it can use per-page image overrides. Logos retain common school-image replacement and expose only geometry sharing.

Desk sharing targets monthly fronts; poster sharing targets corresponding poster pages. Counterpart matching uses stable identity, an explicit correspondence key, binding, or an unambiguous role. Missing, ambiguous and locked recipients are skipped; objects are not created. Copying a template image stores a source descriptor rather than a temporary URL. User photo copies refer to the durable photo ID. Both reconstruct through the saved project and existing snapshot pipeline, and imported references cannot read protected image objects.

## 2026-11-13 editor entry and commands

New projects enter the editor directly from design details. School text starts with the authored sample values. School information and schedule/display settings are accessible from the library sidebar, along with an embedded image-registration dialog. Older saved input steps reopen in the editor.

The text toolbar shares the sidebar's style state and adds left, center, right and justified paragraph alignment. Image selection keeps text commands disabled. Editable objects, including bound school objects, can be copied and pasted across pages. Copies retain their binding and use a stable source descriptor plus existing editor edits, rather than storing temporary image URLs. Copies and deletion participate in undo/redo and persisted snapshots. Protected source objects cannot be duplicated. The school-information save button persists the currently edited school data using the existing material-save path; linked text changes use the same school values on other pages.

Validation: customer tests cover copied bound text, cross-page paste, styling, restored image assets, deletion/undo, and protection checks. Browser verification is recorded separately from build/test results.
