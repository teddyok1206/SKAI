# 038 Branch Tree Explorer

Date: 2026-06-02

## Goal

Show parent/child breakpoint replay attempts as a navigable lineage instead of isolated local attempts.

```text
local attempts
-> parent/child branch links
-> lineage tree
-> open any branch
-> compare and judge
```

## Scope

Included:

- Add a branch tree builder for attempts belonging to the same problem.
- Add a compact branch tree explorer component.
- Show root attempts and child replay branches.
- Highlight the current attempt.
- Let the user open another attempt from the tree.
- Update orchestration docs.

Excluded:

- Supabase-backed cross-user branch trees.
- Visual canvas/tree layout.
- Dragging/reparenting branches.
- Multi-branch aggregate judge.
- Branch merge.

## Product Rules

- Branch tree is a navigation surface, not a scoring surface.
- The current branch still uses the existing branch diff and counterfactual judge for evaluation.
- Labels should emphasize breakpoint position, score, and event count.
- The explorer must not hide the original parent attempt.

## Implementation Steps

1. Create `lib/branch-tree.ts`.
2. Create `components/branch-tree-explorer.tsx`.
3. Add `openAttemptFromTree` to `ProblemSolver`.
4. Render the branch tree in the problem sidebar.
5. Add CSS for compact lineage rows.
6. Update `docs/000_orchestration.md`.
7. Verify typecheck, lint, build, and diff check.

## Done Criteria

- A parent attempt and at least one replay branch appear in a lineage view.
- Current attempt is visibly marked.
- Clicking another attempt opens it in the solver.
- Existing branch diff/counterfactual judge sections still work after switching.

## Risks

- localStorage-only lineage is not enough for community/research usage.
- Large attempt sets will need pagination or filtering later.
- Nested branch trees can get visually dense if many branches are created from branches.

## Philosophy Check

Breakpoint replay is one of SKAI's strongest learning mechanics. The branch tree makes counterfactual exploration visible as a structure: where the learner stopped, what they changed, and which path improved. This directly supports the 3D dual graph philosophy because branches are alternative continuations from graph-anchored moments.

## Implementation Result

Completed on 2026-06-02.

Implemented:

- Added `lib/branch-tree.ts`.
- Added `components/branch-tree-explorer.tsx`.
- `ProblemSolver` now builds a local branch tree from attempts for the active problem.
- Sidebar shows:
  - total local attempts,
  - total branch attempts,
  - root attempts,
  - child replay branches,
  - breakpoint trace labels,
  - event counts,
  - score when judged.
- Current attempt is highlighted.
- Clicking a node opens that attempt in the solver and restores final answer/branch diff context.
- Updated `docs/000_orchestration.md`.

Verification:

- `conda run -n SKAI npm run typecheck`
- `conda run -n SKAI npm run lint`
- `conda run -n SKAI npm run build`
- `git diff --check`

Remaining:

- Supabase-backed branch tree across devices/users.
- Multi-branch aggregate comparison.
- Canvas/graph branch tree view.
- Branch tree filters when many attempts exist.

Post-task philosophy check:

- Branch exploration is now visible as lineage, not just a single diff.
- The explorer does not replace graph-state diff or counterfactual judge; it routes the learner to the right attempt.
- This strengthens SKAI's GDB-like breakpoint metaphor and makes replay paths easier to inspect.
