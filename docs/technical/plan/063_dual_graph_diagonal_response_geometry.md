# 063 Dual Graph Diagonal Response Geometry

## Goal

Correct the 3D Dual Graph geometry so it matches the mathematical dual interpretation:

- `R_i` should sit halfway between `P_i` and `P_{i+1}` in vertical position.
- The `P_i -> R_i` connector should be a diagonal arrow pointing down-right.
- The arrow should connect node centers, not float near the nodes.
- The status/binding frame should become a parallelogram-like shape:
  - left and right sides vertical,
  - top and bottom sides diagonal in the same down-right direction as the `P_i -> R_i` arrow.

## Scope

- Update 3D Dual Graph visual geometry.
- Keep graph data and projection semantics unchanged.
- Use SVG overlays for the diagonal prompt-response arrow and pair-binding frame.

## Assumptions

- A graph row represents the interval from `P_i` to `P_{i+1}`.
- `R_i` and `S_i` belong to that interval and should sit around its midpoint.
- Exact graph topology is already correct after `061`; this slice is visual geometry.

## Affected Files

- `components/conversation-graph-view.tsx`
- `app/globals.css`
- `docs/000_orchestration.md`
- `docs/technical/plan/063_dual_graph_diagonal_response_geometry.md`

## Data Model / API Changes

- None.

## Implementation Steps

1. Replace the CSS-only horizontal P/R connector with an SVG diagonal arrow overlay.
2. Replace the rectangular pair frame with an SVG parallelogram-like binding overlay.
3. Make 3D Dual rows use a fixed interval pitch.
4. Place Prompt nodes near the top of each interval.
5. Place Response and Status nodes at half-step vertical offset inside the interval.
6. Adjust vertical spine connectors so P/R/S spines still connect down their own columns.
7. Keep the narrow-screen horizontal-scroll behavior from `061`.

## Verification Steps

- Run `git diff --check`.
- Run `conda run -n SKAI npm run typecheck`.
- Run `conda run -n SKAI npm run lint`.
- Run `conda run -n SKAI npm run build`.
- Manual visual check recommended:
  - `P_i -> R_i` arrow points down-right and meets the node centers.
  - `R_i` is visually halfway between `P_i` and `P_{i+1}`.
  - Binding frame reads as a parallelogram-like status enclosure.

## Implementation Result

- Replaced the CSS-only horizontal prompt-response connector with an SVG diagonal `P_i -> R_i` arrow.
- Replaced the rectangular pair frame with an SVG parallelogram-like binding overlay.
- Changed the 3D Dual row geometry from same-height lanes to prompt intervals.
- Placed Prompt nodes near the top of each interval.
- Placed Response and Status nodes at the interval half-step, so `R_i` reads as the dual node of the `P_i -> P_{i+1}` transition.
- Recalibrated P/R/S vertical spine connectors against the new interval coordinates.
- Kept narrow-screen horizontal scroll while preserving the three-column geometry.

## Verification Result

- `git diff --check`: passed.
- `conda run -n SKAI npm run typecheck`: passed.
- `conda run -n SKAI npm run lint`: passed.
- `conda run -n SKAI npm run build`: passed.
- Browser visual verification remains recommended because exact perceived alignment depends on rendered viewport width.

## Risks

- SVG overlay coordinates depend on the 3-column visual grid.
- The parallelogram frame is an approximation around circular nodes; very dense traces may require a later canvas/SVG graph renderer.

## Rollback Notes

- Revert the SVG overlays and row interval CSS if the diagonal geometry hurts readability.

## Philosophy Check

This slice makes the visual graph closer to the underlying dual graph: model response `R_i` is not a same-height chat bubble but the dual object living on the edge between prompt states.
