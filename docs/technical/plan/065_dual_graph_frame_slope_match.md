# 065 Dual Graph Frame Slope Match

## Goal

Tune the 3D Dual Graph pair frame after visual inspection:

- The parallelogram frame slope should visually match the `P_i -> R_i` connector slope.
- The left side of the frame should move slightly upward.
- The right side of the frame should move downward enough to wrap R cleanly.
- `R_i` must remain at the midpoint height between `P_i` and `P_{i+1}`.

## Scope

- SVG/CSS coordinate tuning only.
- No graph semantics, data model, API, or projection changes.

## Assumptions

- Use a slightly taller interval pitch so the frame can wrap both circular nodes while preserving slope.
- New geometry:
  - row pitch: `280px`
  - `P_i` center: `(100,70)`
  - `R_i` center: `(300,210)`
  - `P_{i+1}` center: `(100,350)`
  - P/R slope: `(210 - 70) / (300 - 100) = 0.7`
  - pair frame: `(60,0) -> (340,196) -> (340,280) -> (60,84)`

## Affected Files

- `components/conversation-graph-view.tsx`
- `app/globals.css`
- `docs/000_orchestration.md`
- `docs/technical/plan/065_dual_graph_frame_slope_match.md`

## Data Model / API Changes

- None.

## Implementation Steps

1. Change row pitch from `252px` to `280px`.
2. Set prompt node top to `36px`, making the prompt center `70px`.
3. Set half-step to `140px`, making response/status centers `210px`.
4. Update SVG viewBox height to `280`.
5. Update P/R arrow to `(100,70) -> (300,210)`.
6. Update frame polygon to `(60,0) -> (340,196) -> (340,280) -> (60,84)`.
7. Re-anchor the Status connector at y `210`.

## Verification Steps

- Run `git diff --check`.
- Run `conda run -n SKAI npm run typecheck`.
- Run `conda run -n SKAI npm run lint`.
- Run `conda run -n SKAI npm run build`.
- Manual visual check recommended for the final frame slope.

## Implementation Result

- Changed row pitch from `252px` to `280px`.
- Set prompt node center to y `70` and response/status center to y `210`.
- Updated P/R arrow to `(100,70) -> (300,210)`, slope `0.7`.
- Updated pair frame to `(60,0) -> (340,196) -> (340,280) -> (60,84)`, whose top/bottom edges also have slope `0.7`.
- Re-anchored the Status connector from `(340,210)` to `(466,210)`.
- Added this slice to the orchestration index.

## Verification Result

- `git diff --check`: passed.
- `conda run -n SKAI npm run typecheck`: passed.
- `conda run -n SKAI npm run lint`: passed.
- `conda run -n SKAI npm run build`: passed.
- Browser visual verification remains recommended for final pixel-level tuning.

## Risks

- The graph gets slightly taller.
- The frame is now a tight wrap around the circles; a future visual pass may add a compact/zoom mode.

## Rollback Notes

- Revert this coordinate-only slice if the tighter slope match is visually worse than the previous looser frame.

## Philosophy Check

This is still structural polish, not decoration: the frame should communicate that P/R is one controlled pair while preserving the actual diagonal dual relation.
