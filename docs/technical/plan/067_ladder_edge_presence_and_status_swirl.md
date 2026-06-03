# 067 Ladder Edge Presence And Status Swirl

## Goal

Refine the 3D Dual ladder semantics after visual testing:

- Draw ladder rungs only when the required nodes exist.
- The `R_i node -> P_i->P_{i+1} edge` rung must point left, and its packet animation must also flow left.
- Move each Status node to the center of the smallest local rectangle formed by:
  - top: `P_i node -> R_{i-1}->R_i edge midpoint`,
  - bottom: `R_i node -> P_i->P_{i+1} edge midpoint`.
- Remove direct connector edges between the P/R bundle and Status.
- Make the Status node slightly larger and add a clear counterclockwise swirl animation to show that Status is updated by the local P/R cell.

## Scope

- Update only the 3D Dual view, CSS, and orchestration docs.
- Keep graph builder, graph projections, sparse indexes, comments, branching, and judge logic unchanged.

## Assumptions

- A rung is drawable only when the visible local prompt/response node needed for that relation exists.
- Synthetic origin/terminal nodes may still define graph edges in data, but no rung should be drawn when the concrete response node for the pair is missing.
- Status is no longer drawn as a right-side connector endpoint in 3D Dual; it is a local cell state marker.
- Status projection tab still shows the status graph progression independently.

## Affected Files

- `components/conversation-graph-view.tsx`
- `app/globals.css`
- `docs/000_orchestration.md`
- `docs/technical/plan/067_ladder_edge_presence_and_status_swirl.md`

## Data Model / API Changes

- None.

## Implementation Steps

1. Compute rung visibility per pair:
   - prompt node exists,
   - response node exists,
   - adjacent prompt/response edge context exists in graph data.
2. Render the top rung only when its required node/edge context exists.
3. Render the lower rung from `R_i` leftward to the prompt-edge midpoint.
4. Reverse lower-rung packet animation path from right to left.
5. Remove status-binding rung from the ladder SVG.
6. Render the Status node as an absolute overlay centered in the P/R local rectangle.
7. Enlarge Status node slightly in that overlay.
8. Add counterclockwise swirl animation around the Status node, with reduced-motion fallback.
9. Update orchestration docs to record the local-cell status marker semantics.

## Verification Steps

- Run `git diff --check`.
- Run `conda run -n SKAI npm run typecheck`.
- Run `conda run -n SKAI npm run lint`.
- Run `conda run -n SKAI npm run build`.
- Manual visual check recommended:
  - no rung is drawn into a missing response,
  - lower rung arrow/packet flows left,
  - Status sits at the center of the P/R local rectangle,
  - Status has no connector edge to the P/R bundle.

## Implementation Result

- Added per-pair rung visibility checks so ladder rungs render only when the local prompt/response context exists.
- Reversed the lower rung direction to `R_i node -> P_i->P_{i+1} edge midpoint`.
- Reversed the lower rung packet-flow path from right to left.
- Removed the Status connector rung from the 3D Dual ladder.
- Removed the unused right-side Status spine from the 3D Dual view and deleted stale `status-spine` CSS.
- Rendered Status as an absolute local-cell marker at the center of the rectangle formed by the top and lower P/R rungs.
- Enlarged the local Status node from `68px` to `78px`.
- Added a counterclockwise Status swirl animation and faster/highlighted selected-state swirl.
- Added reduced-motion fallback for the Status swirl.
- Updated orchestration docs to record centered Status marker semantics.

## Verification Result

- `git diff --check`: passed.
- `conda run -n SKAI npm run typecheck`: passed.
- `conda run -n SKAI npm run lint`: passed.
- `conda run -n SKAI npm run build`: passed.
- Browser visual verification remains recommended for final pixel-level tuning.

## Risks

- If Status no longer sits on a right spine, the phrase "third spine" becomes less precise for the 3D Dual view. The status projection remains a separate graph.
- Always-on swirl animation may be visually busy; reduced-motion fallback and subtle opacity should mitigate it.

## Rollback Notes

- Revert only this slice if the centered Status marker is less clear than the previous right-side status binding rung.

## Philosophy Check

This slice keeps duality as a ladder between prompt/response graphs and makes status a local state update derived from the P/R cell, not a causal node or connector edge.
