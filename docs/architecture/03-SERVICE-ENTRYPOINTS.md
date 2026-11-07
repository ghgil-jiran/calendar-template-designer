# Service Entrypoints

## Current source of truth

- Vercel project identity: no `.vercel/project.json` is present locally, so the Vercel dashboard Root Directory/team binding cannot be confirmed from this checkout. The repository root is the intended deployment root and now contains the routing lock in `vercel.json`.
- Service entry HTML: `apps/designer-studio/index.html`.
- Local service command: `npm run dev`, served by `tools/serve-designer-studio.mjs` on `http://localhost:3000`.
- Release metadata entrypoint: `apps/designer-studio/index.html`.

## Screen flow

The entry screen, Designer Studio home, setup screens, template library, editor, inspector, object drawer, resource modal, and preview overlays are states inside the same Designer Studio HTML document. The library close action hides the modal and restores the current Designer Studio state without changing the URL or replacing the project.

Selecting or opening a template calls the existing in-app project loader and then renders the same header, sidebar, canvas, inspector, and ACDS styles. Project data remains in the existing in-memory and browser storage paths.

## Legacy surfaces

`apps/editor-core-demo/index.html` remains as a source-level editor-core test fixture. It is no longer a service entrypoint. The legacy demo server's root route now serves Designer Studio, and legacy demo paths are mapped to Designer Studio. Vercel rewrites the same legacy paths to the Designer Studio entry HTML.

There are no service-flow uses of `window.location`, `location.href`, `history.back`, or iframe navigation in the Designer Studio. `tools/serve-sprint2-demo.mjs` is retained only for compatibility and now also serves the unified Designer Studio at its root.

## Validation checklist

- First visit resolves to Designer Studio.
- Open and close template library in the same app state.
- Open a template and keep the Designer Studio shell and ACDS styles.
- Repeat library open/close after editing.
- Exercise object selection, move, resize, rotate, copy, delete, undo, and redo.
- Save and load through the existing controls.
- Refresh and resolve back to the same Designer Studio entrypoint.