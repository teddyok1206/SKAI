# 069 Graph Surface Ladder Alignment And Tab Simplification

## Goal

Polish the current 3D Dual Graph and confirm its backend alignment:

- Keep the first-row R-origin stub neutral when selecting the first local set.
- Confirm that the ladder UI matches the backend graph data model.
- Remove redundant user-facing Prompt/Response/Status/Index graph tabs from the main solving graph surface.
- Keep backend projections and sparse index as internal data structures, not primary UX.

## Scope

- `ConversationGraphView` UI simplification.
- 3D Dual CSS cleanup.
- Documentation of backend alignment and UX decision.
- No graph builder, API, schema, persistence, or judge behavior changes.

## Backend Alignment Finding

The current ladder UI aligns with the backend data model as a visual dual projection:

- Backend `promptEdges` are `P_i -> P_{i+1}` and carry `dualNodeId = R_i`.
- Backend `responseEdges` are `R_{i-1} -> R_i` and carry `dualNodeId = P_i`.
- Backend `pairs` bind `P_i`, `R_i`, and `S_i` by id/sequence.
- Backend `statusEdges` are `S_i -> S_{i+1}` progression edges and remain visible in data/projection semantics.
- 3D Dual UI renders:
  - `P_i` node to `R_{i-1}->R_i` response-edge midpoint as the upper rung.
  - `R_i` node to `P_i->P_{i+1}` prompt-edge midpoint as the lower leftward rung.
  - `S_i` as a local status marker derived from the `P_i/R_i` cell.

This is not a fake graph. It is a faithful view of the dual-node/dual-edge relationships already stored through `dualNodeId`, `pairId`, and `sequence`.

## UX Decision

For smoke-test users, separate Prompt/Response/Status/Index tabs are too implementation-facing:

- Prompt/Response/Status projections are useful for engineers and future research export.
- Sparse index is useful for O(1) lookup, annotations, branch diff, and backend operations.
- They do not need to be primary user-facing tabs if 3D Dual node click already shows trace, status, annotations, and branch action.

Decision: keep these structures in backend and code paths where needed, but hide the projection/index tabs from the main Graph view for now.

## Affected Files

- `components/conversation-graph-view.tsx`
- `app/globals.css`
- `docs/000_orchestration.md`
- `docs/technical/plan/069_graph_surface_ladder_alignment_and_tab_simplification.md`

## Data Model / API Changes

- None.

## Implementation Steps

1. Remove active styling from the first-row R-origin stub.
2. Remove unused origin-stub active CSS.
3. Remove user-facing graph projection tabs from `ConversationGraphView`.
4. Always render the 3D Dual view in the graph canvas.
5. Remove now-unused projection/index rendering helpers and imports.
6. Remove the selected incidence/index block from the user-facing detail panel.
7. Update orchestration docs to record backend alignment and user-facing tab simplification.

## Implementation Result

- Fixed the first-row R-origin stub so it always stays visually neutral. Selecting `P1/R1/S1` now activates only the same-index local set and its real ladder rungs.
- Simplified `ConversationGraphView` to a single user-facing 3D Dual surface.
- Removed Prompt/Response/Status/Index tab controls and projection/index render helpers from the primary graph UI.
- Kept selected-node detail behavior: trace content, status reasons, annotations, and branch action remain available through node clicks.
- Removed unused graph projection/index CSS so the visible UI and styling surface match.
- Documented that the current ladder shape is aligned with backend `promptEdges`, `responseEdges`, `statusEdges`, `pairs`, and sparse index semantics.

## Verification Steps

- Run `git diff --check`.
- Run `conda run -n SKAI npm run typecheck`.
- Run `conda run -n SKAI npm run lint`.
- Run `conda run -n SKAI npm run build`.
- Manual visual check recommended:
  - selecting set 1 does not darken the R-origin stub;
  - Graph view no longer shows Prompt/Response/Status/Index tabs;
  - selected node detail still exposes the important trace/status/annotation information.

## Verification Result

- `git diff --check`: passed.
- `conda run -n SKAI npm run typecheck`: passed.
- `conda run -n SKAI npm run lint`: passed.
- `conda run -n SKAI npm run build`: passed.

## Risks

- Removing projection tabs could reduce debugging convenience in the browser.
- If founder/research workflows need them again, restore them behind an explicit developer/debug affordance rather than the primary user surface.

## Rollback Notes

- Reintroduce projection/index tabs only as a developer/debug mode if needed.

## Philosophy Check

This keeps SKAI centered on orchestration comprehension, not backend implementation exposure. The backend matrix/index remains rigorous, while the user sees the most meaningful integrated graph.
