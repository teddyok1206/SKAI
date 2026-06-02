# 032 Graph Skeleton Sharing

Date: 2026-06-02

## Goal

Make shared attempts teach structure before prompt copying.

```text
conversation graph + annotations
-> graph skeleton steps
-> shared page first learning surface
-> raw prompts remain expandable/secondary
```

## Scope

Included:

- Add graph skeleton types.
- Add `lib/graph-skeleton.ts`.
- Generate skeleton steps from graph pairs, status layer, annotations, attachments, and prompt signals.
- Classify steps into:
  - problem reframe,
  - clarifying question,
  - material selection,
  - task decomposition,
  - draft generation,
  - verification,
  - revision,
  - finalization,
  - other.
- Show graph skeleton near the top of the shared attempt page.
- Keep prompt-level comments anchored to trace events.
- Keep raw transcript accessible but secondary.

Excluded:

- Persisted graph skeleton snapshots.
- Community comparison across multiple skeletons.
- LLM-generated skeleton labels.
- Habit motif aggregation.

## Implementation Steps

1. Extend `lib/types.ts` with graph skeleton types.
2. Implement deterministic graph skeleton generation.
3. Wire shared attempt page to build skeleton from `buildConversationGraph`.
4. Add compact skeleton UI before the dual graph/detail transcript sections.
5. Style the skeleton as a scan-first learning surface.
6. Update orchestration and graph backbone docs.
7. Verify typecheck, lint, build, and diff check.

## Done Criteria

- A published attempt can be understood from graph skeleton steps without reading raw prompts first.
- Skeleton steps link back to trace anchors for prompt comments and raw details.
- Graph skeleton uses graph pair/status/annotation data, not a separate ad hoc transcript parser.

## Risks

- Deterministic labels can be approximate.
- Too much copy can make the skeleton feel like another transcript.
- If the trace is very short, skeleton may duplicate workflow map.

## Philosophy Check

This slice protects SKAI from becoming a prompt gallery. The shared artifact should show the user's orchestration structure first, then let readers inspect raw prompts only when they need evidence or reusable details.

## Implementation Result

Completed on 2026-06-02.

Implemented:

- Added graph skeleton types:
  - `GraphSkeletonStepRole`
  - `GraphSkeletonStep`
- Added `lib/graph-skeleton.ts`.
- Generated deterministic skeleton steps from:
  - graph pairs,
  - task status,
  - annotations,
  - prompt signals,
  - attachments,
  - breakpoint flags.
- Added shared attempt `Graph Skeleton` section before dual graph, workflow, prompt detail anchors, and raw transcript.
- Renamed the previous prompt-level section to `Prompt Detail Anchors` to make it evidence/comment oriented instead of the primary reading path.
- Added compact graph skeleton styling and mobile layout support.

Verification:

- `conda run -n SKAI npm run typecheck`
- `conda run -n SKAI npm run lint`
- `conda run -n SKAI npm run build`
- `git diff --check`

Remaining:

- Persist graph skeleton snapshots.
- Compare skeletons across attempts.
- Add LLM-assisted skeleton labels after calibration.
- Build graph motif/habit reports from skeleton patterns.
