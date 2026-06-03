# 061 Status Right Spine And Dedup Status Graph

## Goal

Fix the graph representation after visual testing:

- Status must always render as the rightmost spine in the 3D Dual view.
- Prompt and Response remain the first two spines and connect directly.
- Status binds the prompt-response pair as metadata/control state, not as a middle node.
- The Status projection must stop repeating Prompt and Response nodes.
- The Status graph should be its own directed spine: `S1 -> S2 -> S3`.

## Scope

- Update graph builder status edges.
- Update 3D Dual CSS so narrow widths keep Status on the right via horizontal scroll instead of collapsing the graph into one column.
- Update documentation to clarify that status edges are status-to-status progression edges.

## Assumptions

- Pair membership is already represented by `ConversationGraphPair`.
- Status does not need `P -> S` and `S -> R` edges to preserve semantics.
- Prompt/Response binding in the UI can use pair ids and visual frames.
- Status projection should answer "how did orchestration state evolve?", not "which prompt/response did this pair contain?"

## Affected Files

- `lib/conversation-graph.ts`
- `app/globals.css`
- `docs/000_orchestration.md`
- `docs/technical/plan/061_status_right_spine_and_dedup_status_graph.md`

## Data Model / API Changes

- No type/schema changes.
- `statusEdges` semantics change:
  - Before: two per pair, `Prompt -> Status` and `Status -> Response`.
  - After: one progression edge between consecutive status nodes, `Status(n) -> Status(n+1)`.
- Pair binding remains available through `ConversationGraphPair.promptNodeId`, `responseNodeId`, and `statusNodeId`.

## Implementation Steps

1. Add `lastStatusNodeId` tracking in `buildConversationGraph`.
2. Remove `Prompt -> Status` and `Status -> Response` status edges.
3. Emit only status progression edges between consecutive status nodes.
4. Keep pair ids on status progression edges for O(1) lookup/index behavior.
5. Change 3D Dual CSS from `overflow: hidden` to horizontal scroll.
6. Give 3D Dual rows/header a fixed minimum visual width so P/R/S remain three side-by-side spines.
7. Override narrow breakpoint CSS so it does not collapse the 3D Dual rows into one column.
8. Update orchestration docs with the corrected semantics.

## Verification Steps

- Run `git diff --check`.
- Run `conda run -n SKAI npm run typecheck`.
- Run `conda run -n SKAI npm run lint`.
- Run `conda run -n SKAI npm run build`.
- Manual browser check recommended:
  - Status stays rightmost even in narrower windows.
  - Status projection shows only status nodes and status-to-status progression.
  - 3D Dual still shows P -> R direct connector and pair binding toward S.

## Implementation Result

- Changed `statusEdges` from pair-internal `Prompt -> Status -> Response` edges to `Status(n) -> Status(n+1)` progression edges.
- Kept prompt-response binding through `ConversationGraphPair`, not duplicated status edges.
- Preserved 3D Dual ordering as Prompt / Response / Status.
- Made the 3D Dual canvas horizontally scrollable and prevented the narrow breakpoint from collapsing P/R/S into one vertical column.
- Updated orchestration docs to state that Status is always the rightmost spine and the Status projection does not repeat Prompt/Response nodes.

## Verification Result

- `git diff --check`: passed.
- `conda run -n SKAI npm run typecheck`: passed.
- `conda run -n SKAI npm run lint`: passed.
- `conda run -n SKAI npm run build`: passed.
- Browser visual verification remains recommended for exact bracket/edge placement.

## Risks

- Existing code that expected status incidence to include prompt/response nodes could show fewer incoming/outgoing edges for P/R. Pair ids still preserve the relationship.
- Very narrow screens will require horizontal scrolling in the 3D Dual tab.

## Rollback Notes

- If status-to-status projection proves too sparse, add a dedicated pair-binding view instead of restoring P/R duplication in the status graph.

## Philosophy Check

This change makes the third graph genuinely independent as a status progression layer. It prevents SKAI from accidentally visualizing status as a causal middle step between user intent and model output.
