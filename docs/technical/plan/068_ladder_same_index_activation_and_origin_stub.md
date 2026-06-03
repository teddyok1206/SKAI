# 068 Ladder Same Index Activation And Origin Stub

## Goal

Refine 3D Dual ladder behavior:

- Selecting `P_i`, `R_i`, or `S_i` activates only the same-index set: `P_i/R_i/S_i`.
- Selecting `S_i` must activate the same local set and its incident ladder rungs.
- Status swirl should rotate clockwise.
- Ladder rungs should render only when their required visible node context exists.
- The first prompt has no previous response edge to point at, so the first row should use a small origin stub above `R_1`; the `P_1` rung should meet the start of that stub.

## Scope

- 3D Dual view logic and CSS only.
- No graph data, API, projection, sparse index, judge, or persistence changes.

## Assumptions

- Same-index activation means sequence equality, not graph adjacency:
  - select `P_i` -> active set is pair `i`,
  - select `R_i` -> active set is pair `i`,
  - select `S_i` -> active set is pair `i`.
- Projection tabs may still use exact selected-node behavior; this slice targets the 3D Dual view.
- The first row origin stub is a visual affordance, not a graph data edge.

## Affected Files

- `components/conversation-graph-view.tsx`
- `app/globals.css`
- `docs/000_orchestration.md`
- `docs/technical/plan/068_ladder_same_index_activation_and_origin_stub.md`

## Data Model / API Changes

- None.

## Implementation Steps

1. Replace adjacent-edge activation heuristics with same-sequence activation.
2. Pass same-sequence active state to P/R/S nodes in the 3D Dual view.
3. Make `S_i` selection activate the same rungs and status marker.
4. Reverse Status swirl animation from counterclockwise to clockwise.
5. Keep lower rung visible only when `P_i`, `R_i`, and `P_{i+1}` exist.
6. Render the top rung when `P_i` and `R_i` exist:
   - for `i = 1`, target the R-origin stub;
   - for `i > 1`, target the response-edge midpoint.
7. Draw the first-row R-origin stub above `R_1`.
8. Update orchestration docs with same-index activation and origin-stub semantics.

## Verification Steps

- Run `git diff --check`.
- Run `conda run -n SKAI npm run typecheck`.
- Run `conda run -n SKAI npm run lint`.
- Run `conda run -n SKAI npm run build`.
- Manual visual check recommended:
  - selecting any of `P_i/R_i/S_i` activates only that same-index set;
  - `S_i` click activates the local rungs and swirl;
  - first row has a short R-origin stub and the top rung meets its start;
  - status swirl rotates clockwise.

## Implementation Result

- Replaced adjacent-edge activation with same-index activation.
- Selecting any of `P_i`, `R_i`, or `S_i` now activates the same local `P_i/R_i/S_i` set in the 3D Dual view.
- P/R/S nodes in the selected local set all receive the selected border treatment.
- The top/lower ladder rungs activate only for the selected same-index local set.
- `S_i` selection now activates the same rungs and swirl as `P_i`/`R_i`.
- Reversed the status swirl from counterclockwise to clockwise and renamed the keyframe accordingly.
- Updated rung visibility so synthetic origin/terminal nodes do not count as real edge endpoints.
- Added the first-row R-origin visual stub above `R_1`; the `P_1` top rung points to the stub start.
- Updated orchestration docs and the plan index.

## Verification Result

- `git diff --check`: passed.
- `conda run -n SKAI npm run typecheck`: passed.
- `conda run -n SKAI npm run lint`: passed.
- `conda run -n SKAI npm run build`: passed.
- Browser visual verification remains recommended for final pixel-level tuning.

## Risks

- Same-index activation is simpler but no longer highlights adjacent mathematical edges around `P_i`; this is intentional per the current UX decision.
- The first-row stub is a visual convention and should not be mistaken for a real response node.

## Rollback Notes

- Revert this slice if same-index activation feels less informative than incident-edge activation during browser testing.

## Philosophy Check

This keeps the visual language disciplined: same-number P/R/S form a local orchestration cell, while missing graph context is represented as a small affordance instead of a fake full edge.
