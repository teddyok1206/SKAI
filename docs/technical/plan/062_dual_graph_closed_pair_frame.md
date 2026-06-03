# 062 Dual Graph Closed Pair Frame

## Goal

Tighten the 3D Dual Graph pair-binding visual after browser inspection:

- Close the prompt-response pair frame on the right side.
- Connect the new right vertical frame edge to the Status node through the existing horizontal binding line.
- Keep Status as the rightmost spine.
- Prevent the Response node from visually protruding outside the pair frame.

## Scope

- CSS-only visual adjustment.
- No graph data, API, schema, or component logic changes.

## Assumptions

- The prompt-response pair frame should read as a closed binding container around P/R.
- The right edge of that container is the anchor point for the line toward S.
- Response should remain slightly lower than Prompt, but not so low that it escapes the pair frame.

## Affected Files

- `app/globals.css`
- `docs/technical/plan/062_dual_graph_closed_pair_frame.md`

## Data Model / API Changes

- None.

## Implementation Steps

1. Change `.graph-pair-frame` from an open ㄷ shape to a closed rounded rectangle.
2. Keep `.graph-pair-frame::after` as the connector from the closed right edge toward the Status spine.
3. Add a small arrowhead/terminal affordance to that connector if it improves readability.
4. Increase frame bottom clearance and reduce response vertical offset enough to avoid protrusion.
5. Mirror the offset change in the narrow breakpoint override.

## Verification Steps

- Run `git diff --check`.
- Run `conda run -n SKAI npm run typecheck`.
- Run `conda run -n SKAI npm run lint`.
- Run `conda run -n SKAI npm run build`.
- Manual visual check recommended:
  - Pair frame is closed.
  - The connector starts from the closed right edge and points toward S.
  - R node no longer protrudes from the frame.

## Implementation Result

- Closed the prompt-response pair frame by restoring the right border and full rounded rectangle.
- Kept the Status connector as a horizontal line starting from the new right vertical edge.
- Made the connector width responsive to the P/R frame width so it reaches toward the Status node instead of staying as a short fixed segment.
- Reduced the Response spine vertical offset from `12px` to `8px`.
- Extended frame vertical clearance so the Response node no longer visually protrudes.

## Verification Result

- `git diff --check`: passed.
- `conda run -n SKAI npm run typecheck`: passed.
- `conda run -n SKAI npm run lint`: passed.
- `conda run -n SKAI npm run build`: passed.
- Browser visual verification remains recommended for exact line-to-node alignment.

## Risks

- Fully closed frames can look visually heavier in dense traces.
- If the connector is too short on very wide layouts, it may need percentage-based placement instead of a fixed segment.

## Rollback Notes

- Revert only the `.graph-pair-frame`, `.graph-pair-frame::after`, and response offset CSS if the closed frame is visually worse.

## Philosophy Check

This is a visual precision slice. It keeps Status as the right-side binding graph while making each prompt-response pair read as a complete controlled unit.
