# 060 Three-Spine Dual Graph Pair Status

## Goal

Correct the 3D Dual Graph visual model so it matches the intended SKAI structure:

- Prompt graph is the first downward directed spine.
- Response graph is the second downward directed spine.
- Status graph is the third downward directed spine.
- Each status node visually wraps/binds the corresponding prompt-response pair instead of sitting between prompt and response.
- Selected nodes are indicated by stronger/thicker borders, not by adding `selected` text inside/near the node.

## Scope

- Update only graph UI and graph CSS.
- Preserve existing graph data, pair mapping, annotations, detail panel, branch behavior, and projection tabs.
- Improve P/R/S color distinction while keeping a coherent palette.

## Assumptions

- A prompt-response pair should be read primarily as `Prompt -> Response`.
- A status node is metadata/control state over that pair, not a middle step in the causal flow.
- The three spines should feel like parallel directed graph trunks:

```text
Prompt spine     Response spine     Status spine
P1  --------->   R1                 S1 wraps P1/R1
|                |                  |
v                v                  v
P2  --------->   R2                 S2 wraps P2/R2
|                |                  |
v                v                  v
P3  --------->   R3                 S3 wraps P3/R3
```

## Affected Files

- `components/conversation-graph-view.tsx`
- `app/globals.css`
- `docs/technical/plan/060_three_spine_dual_graph_pair_status.md`

## Data Model / API Changes

- None.

## Implementation Steps

1. Remove `selected` label pseudo-content from selected graph nodes.
2. Increase selected node border thickness/color/contrast instead.
3. Change 3D Dual row JSX from `Prompt / Status Bridge / Response` to `Prompt / Response / Status`.
4. Make prompt-response connector direct and rightward.
5. Make status node visually bind the pair with a bracket/wrapper line from the P/R pair toward S.
6. Add vertical directed spine connectors to P, R, and S columns.
7. Tune colors:
   - Prompt: teal/accent family.
   - Response: blue family.
   - Status: gold/amber family.
8. Keep narrow viewport fallback readable.

## Verification Steps

- Run `git diff --check`.
- Run `conda run -n SKAI npm run typecheck`.
- Run `conda run -n SKAI npm run lint`.
- Run `conda run -n SKAI npm run build`.
- Manual visual check recommended:
  - Selecting a node thickens/darkens the border without text.
  - P and R are directly connected.
  - S appears as the wrapper/binding graph, not an intermediate node.
  - P/R/S colors are clearly distinguishable.

## Implementation Result

- Removed selected text from graph nodes.
- Selected graph nodes now use thicker/darker borders and a subtle outer ring.
- Reordered the 3D Dual view from `Prompt / Status / Response` to `Prompt / Response / Status`.
- Added a direct Prompt -> Response connector.
- Added a pair-frame/bracket treatment that visually groups each Prompt/Response pair and points to the matching Status node.
- Kept Status as the third directed spine rather than an intermediate causal node.
- Tuned colors so Prompt, Response, and Status use distinct teal, blue, and amber families.
- Added mobile fallback that removes decorative frame/connector lines when the graph collapses into one column.

## Verification Result

- `git diff --check`: passed.
- `conda run -n SKAI npm run typecheck`: passed.
- `conda run -n SKAI npm run lint`: passed.
- `conda run -n SKAI npm run build`: passed.
- Browser visual verification remains recommended because Playwright/browser automation is not installed in this repo.

## Risks

- CSS bracket/wrapper lines may need browser visual tuning.
- Dense traces may make three parallel spines visually busy.
- Status graph semantics are still pair-derived, so it should not be mistaken as an independent chronological agent.

## Rollback Notes

- Roll back only the 3D Dual JSX/CSS if the three-spine view is visually weaker.
- Projection graph sequence path from `059` can remain independent.

## Philosophy Check

This slice clarifies the core duality: user prompts and AI responses are the two primary directed graphs, while status is the binding/evaluation layer over each pair. It avoids misrepresenting status as a causal middle step.
