# 081 Graph And `.skai` Viewer Localization

Date: 2026-06-05

## Goal

Localize SKAI's core graph and `.skai` file reading surfaces without weakening the graph contract.

## Scope

Included:

- `ConversationGraphView`;
- `GraphComparisonView`;
- `GraphStateTransitionView`;
- `SkaiFileViewer`;
- `SkaiExtensionRegistry`;
- `/skai/viewer` page header.

Excluded:

- graph ids and node tokens;
- raw trace content;
- extension-generated judge/coaching prose;
- `.skai` core schema fields;
- public share page layout, handled in slice 082.

## Implementation Rules

- Keep `P/R/S`, `Prompt`, `Response`, `Status`, `Trace`, `.skai`, `3D Dual Graph`, `Branch`, `Replay`, `Judge`, `Coaching`, and `Extension` as protected terms.
- Localize labels, empty states, helper text, buttons, integrity status, graph overlay controls, and viewer import/save/share messages.
- Do not mutate `.skai` artifact content while rendering. Viewer UI language is independent from artifact content language.
- Graph overlay controls must stay layer toggles, not advice prompts.

## Verification

- `npm run verify:i18n`
- `conda run -n SKAI npm run typecheck`
- `conda run -n SKAI npm run lint`
- `conda run -n SKAI npm run build`

## Strengthened Philosophy Gate

- The 3D Dual Graph must remain the central reading surface, not become hidden under translated prose.
- Localization must clarify how to read structure and integrity, not reinterpret the user's attempt.
- `.skai` viewer language must be a reading layer over a stable file contract.

## Implementation Result

- `SkaiFileViewer` now localizes import/save/share notices, integrity labels, viewer descriptions, empty states, trace evidence labels, and action labels.
- `/skai/viewer` page header now uses a client `SkaiViewerPageHeader` with registry copy.
- `ConversationGraphView` now localizes graph stats, empty state, overlay controls, node kind labels, detail panel labels, annotation labels, and branch action labels.
- `GraphComparisonView` and `GraphStateTransitionView` now localize comparison headers, transition labels, and fallback text.
- `SkaiExtensionRegistry` now localizes registry chrome, extension status, field labels, and unknown extension warnings while preserving extension-generated content.
- Graph ids, node tokens, raw trace text, `.skai` payload, and generated judge/coaching prose are not mutated.

## Verification Result

- `npm run verify:i18n`: passed; 268 entries.
- `conda run -n SKAI npm run typecheck`: passed.
- `conda run -n SKAI npm run lint`: passed.
- `conda run -n SKAI npm run build`: passed.

## Strengthened Philosophy Check

- Alignment: the graph remains the main object. Localization clarifies controls and reading labels without replacing the structural representation with explanatory prose.
- Contract check: `.skai` artifact content remains stable; only the viewer chrome changes by locale.
- Watchpoint: public share localization must reuse these viewer labels where possible so share, import, and PDF output do not become three separate reading surfaces.
