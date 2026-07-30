# Sprint 1 — Runtime First Architecture

## Decision
The project keeps the existing beta application intact while introducing four stable boundaries:

1. `packages/contracts`: shared document contract.
2. `packages/editor-core`: UI-independent editor state and history.
3. `packages/calendar-domain`: academic-calendar concepts and month generation.
4. `packages/renderer-core`: renderer interface and registry.

The existing `template-runtime` and `designer-runtime-integration` packages remain operational. Migration is incremental; no legacy code is deleted until parity tests prove replacement safety.

## Pipeline
`CalendarDocument + Dataset → Runtime → ResolvedDocument → Renderer`

## Exit criteria
- New packages compile in strict TypeScript mode.
- Unit tests pass.
- Existing runtime and integration tests continue to pass.
- Designer Studio remains unchanged and executable.
