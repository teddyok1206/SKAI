# 014 Breakpoint Branch Replay

Date: 2026-06-02

## Goal

Change branch/replay from a destructive trace truncation into a GDB-like breakpoint replay model: the user can select a trace event, fork a new attempt from that point, and continue with an alternative prompt while preserving graph lineage.

## Rationale

SKAI should let users experience counterfactual prompting directly:

- "If I restart from this moment, what changes?"
- "Was this event actually the bottleneck?"
- "Did a different instruction produce a better branch?"

This is core to SKAI's learning loop. It makes process quality visible, not merely graded.

## Scope

Included:

- Archive the breakpoint/replay idea.
- Add typed branch metadata to attempts, published attempts, and trace events.
- Replace destructive `branchFrom` behavior with new child attempt creation.
- Preserve parent trace linkage with `sourceTraceEventId` and `branchId`.
- Extend the conversation graph so branch attempts still use prompt graph, response graph, and task-status layer.
- Mark the breakpoint pair inside the graph without adding a fourth graph dimension.
- Show branch/breakpoint context in the solve and share UI.
- Add Supabase columns and API sync fields for branch metadata.
- Update orchestration and decision docs.

Excluded:

- Side-by-side branch diff UI.
- Counterfactual judge scoring between parent and child branches.
- Branch tree explorer.
- Queue-backed replay jobs.

## Assumptions

- A replay branch is a new `Attempt`, not a mutation of the parent attempt.
- The child attempt copies the parent trace prefix with new child trace IDs.
- User-prompt breakpoints stop before the selected prompt so the next user prompt can replace it.
- Assistant-response breakpoints include the selected response so the next user prompt can react to it.
- Each copied event keeps `sourceTraceEventId` pointing to the parent event.
- New events generated after the fork carry `branchId`.
- The first replacement user prompt after a user-prompt breakpoint receives `sourceTraceEventId` pointing to the parent prompt.
- The breakpoint is anchored to an existing prompt-response pair when possible.

## Affected Files

- `lib/types.ts`
- `lib/branching.ts`
- `lib/conversation-graph.ts`
- `components/problem-solver.tsx`
- `components/share-attempt-client.tsx`
- `app/api/attempts/sync/route.ts`
- `app/api/published/sync/route.ts`
- `supabase/migrations/006_branch_replay_metadata.sql`
- `docs/technical/008_breakpoint_branch_replay.md`
- `docs/technical/007_dual_graph_trace_model.md`
- `docs/technical/000_decision_register.md`
- `docs/000_orchestration.md`

## Data Model

`Attempt.branch` records:

- branch id,
- mode: `breakpoint_replay`,
- parent attempt id,
- parent trace event id,
- parent trace index,
- parent graph pair id when known,
- label and creation timestamp.

`TraceEvent.sourceTraceEventId` records which parent trace event a copied child event came from, or which parent prompt the first replacement prompt corresponds to.

`TraceEvent.branchId` records which branch the child event belongs to.

`ConversationGraph.branch` records the branch overlay, but the attempt itself still builds the same three graph projections:

- prompt graph,
- response graph,
- task-status layer.

The branch breakpoint is a property of an existing prompt-response pair, not a fourth graph layer.

## Implementation Steps

1. Add branch and source trace types.
2. Add a pure helper that creates child attempts from a breakpoint index.
3. Update solve UI `Branch` action to create a child attempt instead of truncating the current attempt.
4. Carry branch metadata into new trace events and published snapshots.
5. Extend graph builder to mark breakpoint pairs and expose sparse branch lookup metadata.
6. Add solve/share UI indicators for branch source and breakpoint pair.
7. Add Supabase migration and sync schema fields.
8. Update technical docs and orchestration index.
9. Verify typecheck, lint, and build.

## Complexity Target

- Branch creation: `O(k)`, where `k` is the copied trace prefix length.
- Graph build remains `O(n + b + e)`.
- Parent/child trace lookup remains `O(1)` through dictionaries.
- Storage remains sparse: branch metadata is `O(1)`, copied prefix is already required for replay execution.

## Verification

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Manual local smoke: create an attempt, click `Branch`, verify a new attempt id appears and the parent attempt is preserved in local storage.
- Manual graph smoke: publish a branch attempt and verify the share page marks the breakpoint.

## Risks

- Copying trace prefixes duplicates storage. This is acceptable for MVP because it makes replay executable without reconstructing context from multiple attempts.
- Users might think branch modifies the original attempt. UI copy must signal that it creates a replay attempt.
- Branching from an assistant response and from a user prompt have slightly different semantics. MVP allows both.

## Rollback

Revert `lib/branching.ts`, branch metadata type additions, UI indicators, and Supabase migration. The old flat attempt trace still works because branch fields are optional.
