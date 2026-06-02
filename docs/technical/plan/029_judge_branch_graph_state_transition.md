# 029 Judge Branch Graph State Transition

Date: 2026-06-02

## Goal

Move the next SKAI graph backbone slice from visualization to system behavior:

```text
judge report -> graph annotations
branch diff -> parent/child graph-state transition
counterfactual judge -> graph-state evidence
solve/share UI -> graph-state-first replay comparison
```

## Scope

Included:

- Add typed graph-state transition objects to `BranchDiff`.
- Build parent and child graph snapshots around the replay breakpoint.
- Compare graph status, annotation kinds, annotation labels, directed degree, and node/pair anchors.
- Make counterfactual heuristic claims consume graph-state transition evidence.
- Persist judge-derived graph annotations in `ScoreReport.graphAnnotations`.
- Dedupe graph annotations when score reports are fed back into `buildConversationGraph`.
- Show parent/child graph-state cards in solve and shared counterfactual views.

Excluded:

- Dense matrix export.
- Graph snapshot database table.
- Multi-branch tree explorer.
- LLM judge-native custom annotation schema beyond current bottleneck/workflow outputs.

## Implementation Steps

1. Extend `lib/types.ts` with `GraphStateSnapshot`, `GraphAnnotationDelta`, and `GraphStateTransition`.
2. Add annotation dedupe in `lib/conversation-graph.ts`.
3. Add graph annotation attachment in `lib/judge.ts`.
4. Update `lib/branch-diff.ts` to build parent/child graph-state transition.
5. Update `lib/counterfactual-judge.ts` to use transition labels and annotation deltas.
6. Update solve and share counterfactual views.
7. Update orchestration and graph backbone docs.
8. Verify with typecheck, lint, build, and diff check.

## Done Criteria

- `BranchDiff` includes a graph-state transition.
- Counterfactual report can explain what graph state changed, not only prompt text.
- UI shows before/after graph status and annotation delta.
- `ScoreReport.graphAnnotations` exists after judge runs.

## Risks

- The branch comparison can look more precise than the heuristic evidence supports.
- Annotation deltas by title/kind are more stable than raw annotation ids across attempts, but still approximate.
- Judge report annotations are derived in memory for now; persistence remains via existing score report JSON.

## Philosophy Check

This slice directly supports SKAI's core thesis: replay is not just "try another prompt", it is a controlled change to an orchestration state. The user should see how a prompt changed task status, material grounding, verification, and bottleneck evidence.

## Implementation Result

Completed on 2026-06-02.

Implemented:

- Added graph-state transition types:
  - `GraphStateSnapshot`
  - `GraphAnnotationDelta`
  - `GraphStateTransition`
- Extended `BranchDiff` with `graphTransition`.
- Built parent/child graph snapshots from the same replay breakpoint.
- Compared before/after status, directed degree, graph annotation labels, and annotation delta.
- Updated counterfactual heuristic scoring to use graph-state transition signals:
  - bottleneck signal reduced,
  - verification evidence introduced,
  - material grounding changed,
  - new bottleneck signal appeared.
- Added graph-state causal claims to counterfactual reports.
- Added `GraphStateTransitionView` for solve/share counterfactual surfaces.
- Attached judge-derived graph annotations to `ScoreReport.graphAnnotations`.
- Added annotation dedupe in `buildConversationGraph`.
- Added Supabase score report persistence support for `graph_annotations`.

Verification:

- `conda run -n SKAI npm run typecheck`
- `conda run -n SKAI npm run lint`
- `conda run -n SKAI npm run build`
- `git diff --check`

Remaining:

- LLM judge-native custom graph annotation schema.
- Shared graph skeleton generator.
- Graph snapshot persistence table.
