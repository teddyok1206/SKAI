# 059 Dual Graph Spine Sequence Layout

## Goal

Realign the graph UI with SKAI's original 3D dual graph mental model:

- Prompt graph as a continuous left-side downward spine.
- Response graph as a continuous right-side downward spine, slightly lower/offset from the prompt spine.
- A status node bridge for each prompt-response pair.
- Projection tabs as continuous long-exact-sequence-like paths, not repeated 2-node/1-edge cards.

## Scope

- Replace the current row-lane 3D Dual visualization with a two-spine bridge layout.
- Keep the existing graph data model: prompt nodes, response nodes, status nodes, pairs, edges, sparse indexes.
- Reuse existing node selection, annotations, branch-from-node, detail panel, and graph tabs.
- Replace projection `EdgeList` with a sequence path renderer that avoids repeated node cards such as `P1 -> P2` followed by `P2 -> P3`.
- Preserve visible directed arrows.
- Keep responsive behavior usable on narrow screens.

## Assumptions

- The graph builder already produces the correct semantic projections.
- The current issue is representational: the UI shows pair rows and repeated edge cards, hiding the dual/spine structure.
- Status nodes belong to prompt-response pairs. In the 3D Dual view they should visually bind the left prompt node and the right response node.
- Projection tabs should read as a path:

```text
P1 -> P2 -> P3 -> ...
R0 -> R1 -> R2 -> ...
P1 -> S1 -> R1 / P2 -> S2 -> R2 / ...
```

The status projection may still show repeated prompt/response context between different pairs, but each pair bridge itself should read as a compact sequence, not isolated edge rows.

## Affected Files

- `components/conversation-graph-view.tsx`
- `app/globals.css`
- `docs/000_orchestration.md`
- `docs/technical/plan/059_dual_graph_spine_sequence_layout.md`

## Data Model / API Changes

- No data model change.
- No Supabase migration.
- No API route change.

## Implementation Steps

1. Replace `EdgeList` with `GraphSequencePath`.
   - Sort edges by sequence.
   - Render a de-duplicated source/arrow/target sequence where consecutive edges share nodes.
   - Keep clickable node references and active selected styling.
2. Replace row-lane 3D Dual view with `graph-dual-spine`.
   - Left column: prompt spine nodes.
   - Center column: status bridge nodes and horizontal directed connectors.
   - Right column: response spine nodes, slightly lower via CSS offset.
   - Vertical directed spine connectors show prompt progression and response progression.
3. Keep status pair badges and branch marks on nodes, not edge text boxes.
4. Add CSS for:
   - continuous prompt/response spine lines,
   - status bridge connectors,
   - sequence path arrows,
   - responsive fallback.
5. Update orchestration notes.
6. Run verification.

## Verification Steps

- Run `git diff --check`.
- Run `conda run -n SKAI npm run typecheck`.
- Run `conda run -n SKAI npm run lint`.
- Run `conda run -n SKAI npm run build`.
- Manual browser check recommended:
  - 3D Dual view shows left prompt spine and right response spine.
  - Response spine is slightly lower than prompt spine.
  - Status nodes bind each prompt-response pair.
  - Prompt/Response projection tabs render as a continuous sequence, not repeated edge cards.
  - Directed arrows remain visible.

## Implementation Result

- Replaced the 3D Dual row-lane visualization with a two-spine layout:
  - prompt nodes form the left downward spine,
  - response nodes form the right downward spine with a slight vertical offset,
  - status nodes sit in the center as pair bridges.
- Replaced projection edge cards with `GraphSequencePath`.
  - Consecutive edges that share a node render the shared node once.
  - This avoids `P1 -> P2`, `P2 -> P3` style duplicate-node presentation.
  - Disconnected pair segments, especially in status projection, use a lower-emphasis continuation arrow to keep the path readable as one sequence without pretending it is a scored semantic edge.
- Added CSS for spine connectors, bridge arrows, sequence arrows, selected node refs, and mobile fallback.

## Verification Result

- `git diff --check`: passed.
- `conda run -n SKAI npm run typecheck`: passed.
- `conda run -n SKAI npm run lint`: passed.
- `conda run -n SKAI npm run build`: passed.
- Browser visual verification remains recommended because Playwright/browser automation is not installed in this repo.

## Risks

- CSS-only spine connectors can become visually dense on very long traces.
- Status projection has a different topology from pure prompt/response projections; if it becomes confusing, it may need a dedicated pair-bridge sequence instead of a generic graph sequence.
- Browser visual verification is still manual unless Playwright is added later.

## Rollback Notes

- If the spine layout is visually confusing, revert only the `renderDualGraph` UI while keeping `GraphSequencePath` for projection tabs.
- Existing data structures and persistence are not touched, so rollback is isolated to React/CSS.

## Philosophy Check

This slice moves the graph UI away from transcript-like rows and toward SKAI's core substrate: two dual directed graphs bound by task-status nodes. It strengthens the idea that orchestration is a structured flow, not a list of chat turns.
