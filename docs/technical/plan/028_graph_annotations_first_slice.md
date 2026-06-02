# 028 Graph Annotations First Slice

Date: 2026-06-02

## Goal

Implement the first code slice of the graph backbone strategy:

```text
graph annotation type
-> deterministic annotation builder
-> existing bottleneck/material/verification/breakpoint signals attached to graph targets
-> Graph tab detail panel display
```

## Scope

Included:

- Add conversation graph annotation types.
- Extend `ConversationGraph` and `ConversationGraphIndex` with annotation indexes.
- Add deterministic annotation generation from existing trace/score/branch data.
- Attach annotations to graph pair/node targets during graph build.
- Show annotation counts on graph nodes.
- Show selected node/pair annotations in the Graph detail panel.
- Keep existing graph behavior backward-compatible.

Excluded:

- LLM judge schema changes.
- Persisted graph snapshot tables.
- Branch graph-state transition UI.
- Habit motif report.
- Shared skeleton rewrite.

## Affected Files

- `lib/types.ts`
- `lib/conversation-graph.ts`
- `lib/graph-annotations.ts`
- `components/conversation-graph-view.tsx`
- `app/globals.css`
- `docs/000_orchestration.md`

## Data Model Or API Changes

No database migration in this slice.

Graph annotations are derived in-memory and included in the `ConversationGraph` return shape.

New index fields:

- `annotationIdsByTargetId`
- `annotationIdsByTraceEventId`
- `annotationIdsByKind`

## Implementation Steps

1. Define `ConversationGraphAnnotation` and related union types.
2. Add annotation arrays and indexes to `ConversationGraph`.
3. Add `lib/graph-annotations.ts`.
4. Generate annotations for:
   - bottleneck from score report,
   - material attached,
   - verification prompt,
   - pending response,
   - breakpoint replay anchor,
   - missing material use when the attempt problem likely expects material grounding.
5. Wire annotation builder into `buildConversationGraph`.
6. Render annotation counts on graph node buttons.
7. Render selected target annotations in the graph detail panel.
8. Update orchestration docs with first-slice completion state.

## Verification

- `conda run -n SKAI npm run typecheck`
- `conda run -n SKAI npm run lint`
- `conda run -n SKAI npm run build`
- Browser/local smoke:
  - open a problem,
  - send prompt or inspect existing attempt if available,
  - Graph tab still renders,
  - selecting a node shows annotation details when available.

## Risks

- Too many badges on compact nodes can damage graph readability.
- Annotation confidence can look too authoritative if not labeled as deterministic/heuristic.
- Missing material-use inference can be noisy without problem metadata.

## Rollback Notes

Remove the annotation module, type fields, UI section, and graph builder integration. Raw trace and existing graph rendering remain valid because annotations are optional derived data.

## Philosophy Check

This first slice converts graph from structural view to learning object. It starts making SKAI feedback node/pair-specific without waiting for LLM judge calibration.

## Implementation Result

Completed on 2026-06-02.

Implemented:

- Added conversation graph annotation types.
- Added annotation indexes to `ConversationGraphIndex`.
- Added `ConversationGraph.annotations`.
- Added deterministic annotation generation in `lib/graph-annotations.ts`.
- Attached current signals to graph pair/node targets:
  - bottlenecks from score reports,
  - material-grounded prompts,
  - verification prompts,
  - adaptation/course-correction prompts,
  - pending responses,
  - breakpoint replay anchors,
  - missing material use when problem materials exist.
- Wired problem material count into graph building from solve/share surfaces.
- Added annotation count badges to compact graph nodes.
- Added graph annotation cards to the Graph tab detail panel.

Not included yet:

- LLM judge-native graph annotation output.
- Persisted graph snapshots.
- Branch graph-state transition UI.
- Habit motif report.

Verification:

- `conda run -n SKAI npm run typecheck`
- `conda run -n SKAI npm run lint`
- `conda run -n SKAI npm run build`
