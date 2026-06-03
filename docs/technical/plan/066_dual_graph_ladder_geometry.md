# 066 Dual Graph Ladder Geometry

## Goal

Replace the diagonal 3D Dual Graph geometry with a stricter dual-graph ladder:

- No diagonal `P_i -> R_i` edge.
- Prompt graph and response graph are parallel vertical spines.
- Horizontal ladder rungs represent dual relations:
  - `P_i` node ↔ `R_{i-1} -> R_i` edge midpoint.
  - `P_i -> P_{i+1}` edge midpoint ↔ `R_i` node.
- `R_i` stays halfway between `P_i` and `P_{i+1}`.
- Status remains the rightmost third spine and binds the local ladder cell.
- Selecting a node should animate the incident ladder edges with packet-flow similar to the SKAI mark.

## Scope

- Update only the 3D Dual view and supporting CSS/docs.
- Keep graph builder, projection tabs, sparse index, annotations, branching, and score behavior unchanged.

## Assumptions

- The graph already has correct prompt/response/status projections after `061`.
- This slice supersedes the diagonal visual direction from `063`, `064`, and `065`.
- A row represents the prompt interval from `P_i` to `P_{i+1}`.
- Compact ladder geometry:
  - row pitch: `220px`
  - node diameter: `68px`
  - `P_i` center: y `54`
  - `R_i`/`S_i` center: y `164`
  - `P_{i+1}` center in next row: y `274`
  - midpoint relation: `(54 + 274) / 2 = 164`

## Affected Files

- `components/conversation-graph-view.tsx`
- `app/globals.css`
- `docs/000_orchestration.md`
- `docs/technical/plan/066_dual_graph_ladder_geometry.md`

## Data Model / API Changes

- None.

## Implementation Steps

1. Replace the pair parallelogram SVG with a `graph-dual-ladder` SVG overlay.
2. Draw horizontal rungs:
   - top rung: `P_i node -> response-edge midpoint`.
   - lower rung: `prompt-edge midpoint -> R_i node`.
   - status rung: `R_i/status local cell -> S_i node`.
3. Remove diagonal P/R arrow rendering from the 3D Dual view.
4. Set row pitch to `220px`, prompt top to `20px`, half-step to `110px`.
5. Add selected-node incident-edge classes.
6. Add packet-flow animated dots on active rungs, reusing the SKAI mark's activity language.
7. Update orchestration docs to state the ladder semantics and retire the diagonal edge statement.

## Verification Steps

- Run `git diff --check`.
- Run `conda run -n SKAI npm run typecheck`.
- Run `conda run -n SKAI npm run lint`.
- Run `conda run -n SKAI npm run build`.
- Manual visual check recommended:
  - R nodes are halfway between P nodes.
  - P/R connection is horizontal ladder rungs, not diagonal.
  - Selecting P/R/S nodes animates the relevant local incident rungs.

## Implementation Result

- Removed the diagonal `P_i -> R_i` overlay from the 3D Dual view.
- Removed the pair parallelogram visual from the active renderer.
- Added a `graph-dual-ladder` SVG overlay for each prompt interval row.
- Added horizontal rungs:
  - `P_i node -> response-edge midpoint` at the prompt node height.
  - `prompt-edge midpoint -> R_i node` at the response/status midpoint height.
  - `R_i/local cell -> S_i status node` at the status midpoint height.
- Reset compact row geometry to `220px` pitch with:
  - prompt center y `54`,
  - response/status center y `164`,
  - next prompt center y `274`,
  - midpoint relation `(54 + 274) / 2 = 164`.
- Added packet-flow dots on selected-node incident rungs, using SKAI mark's moving-packet interaction language.
- Added reduced-motion handling that hides ladder packets.
- Updated orchestration docs to mark the ladder geometry as the current direction and the diagonal geometry as superseded.

## Verification Result

- `git diff --check`: passed.
- `conda run -n SKAI npm run typecheck`: passed.
- `conda run -n SKAI npm run lint`: passed.
- `conda run -n SKAI npm run build`: passed.
- Browser visual verification remains recommended for final pixel-level tuning.

## Risks

- The first `P_0 node -> R edge` rung references the synthetic response-origin edge, which is not drawn as a node.
- Packet-flow animation could be visually noisy on dense traces; keep it active only for selected-node incident edges.

## Rollback Notes

- Revert this slice if the ladder becomes less understandable than the diagonal version, but keep the semantic documentation for future renderer work.

## Philosophy Check

This is a structural correction: duality is represented between nodes and opposite-side edges, not as a direct diagonal node-to-node shortcut.
