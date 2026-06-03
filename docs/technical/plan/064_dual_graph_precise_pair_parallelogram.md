# 064 Dual Graph Precise Pair Parallelogram

## Goal

Refine only the 3D Dual Graph pair-binding parallelogram:

- The parallelogram must actually wrap the P/R node circles instead of crossing through them.
- Left and right sides remain vertical.
- Top and bottom edges follow the same down-right slope as the `P_i -> R_i` arrow.
- `R_i` stays exactly at the midpoint height between `P_i` and `P_{i+1}`.
- The Status connector starts from the right vertical edge and points to the Status node.

## Scope

- CSS/SVG geometry only.
- No graph data, graph semantics, API, or projection changes.

## Assumptions

- Node visual diameter is `68px`.
- Three spine centers in the SVG coordinate system are `P=100`, `R=300`, `S=500`.
- To wrap circular nodes while keeping the frame slope parallel to the P/R arrow, the row pitch must be taller than the previous `168px`.
- A compact but non-intersecting geometry is:
  - row pitch: `252px`
  - `P_i` center: `(100, 63)`
  - `R_i` center: `(300, 189)`
  - `P_{i+1}` center in next row: `(100, 315)`
  - midpoint: `(100, 189)` vertically, so `R_i` aligns with the midpoint height.

## Affected Files

- `components/conversation-graph-view.tsx`
- `app/globals.css`
- `docs/technical/plan/064_dual_graph_precise_pair_parallelogram.md`

## Data Model / API Changes

- None.

## Implementation Steps

1. Change 3D Dual row pitch from `168px` to `252px`.
2. Set `--dual-node-top` to `29px` and `--dual-half-step` to `126px`.
3. Update SVG viewBox height to `252`.
4. Set P/R arrow to `(100,63) -> (300,189)`.
5. Set pair parallelogram to approximately:
   - `(62,1) -> (338,175) -> (338,251) -> (62,77)`
6. Set Status connector to start from the right vertical edge and connect toward the Status node at `y=189`.
7. Preserve horizontal scroll and three-spine geometry.

## Verification Steps

- Run `git diff --check`.
- Run `conda run -n SKAI npm run typecheck`.
- Run `conda run -n SKAI npm run lint`.
- Run `conda run -n SKAI npm run build`.
- Manual visual check recommended:
  - The parallelogram does not cross P or R.
  - The P/R arrow meets the visual centers.
  - R is centered between consecutive P nodes.

## Implementation Result

- Increased 3D Dual row pitch from `168px` to `252px`.
- Moved Prompt node top to `29px` and Response/Status half-step to `126px`.
- Updated SVG viewBox height to `252`.
- Repositioned the P/R arrow to `(100,63) -> (300,189)`.
- Repositioned the pair parallelogram to `(62,1) -> (338,175) -> (338,251) -> (62,77)`, so the frame wraps the node circles instead of crossing them.
- Re-anchored the Status connector from the right vertical edge at `(338,189)` toward the Status node left edge at `(466,189)`.
- Added the slice to the orchestration index.

## Verification Result

- `git diff --check`: passed.
- `conda run -n SKAI npm run typecheck`: passed.
- `conda run -n SKAI npm run lint`: passed.
- `conda run -n SKAI npm run build`: passed.
- Browser visual verification remains recommended for final pixel-level tuning.

## Risks

- The graph becomes taller because exact geometry requires more vertical pitch.
- If dense traces become too long, a future zoom/compact toggle may be needed.

## Rollback Notes

- Revert this slice if the taller exact geometry hurts demo readability more than it helps mathematical clarity.

## Philosophy Check

This keeps the dual graph visually honest: `R_i` remains an edge-dual object between prompt states, and the status frame encloses the actual prompt-response pair without pretending status is a middle node.
