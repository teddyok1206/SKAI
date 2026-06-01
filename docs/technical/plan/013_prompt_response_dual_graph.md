# 013 Prompt Response Dual Graph

Date: 2026-06-01

## Goal

Restrict material/file drag-and-drop to the attachment dropzone only, and introduce SKAI's prompt-response dual graph data model as a first-class trace representation.

## Rationale

The solving UI should behave like a controlled AI workspace: materials attach only through the explicit attachment surface, not by accidental text drops into the prompt textarea.

The trace model should also move beyond a flat transcript. A SKAI attempt is better represented as a dual directed graph:

- prompt graph: user prompts are nodes, model responses are directed edges between prompt states,
- response graph: model responses are nodes, user prompts are directed edges that produce/transform responses,
- task-status layer: each prompt-response pair has a status node/edge describing orchestration progress and evaluation state.

This enables graph visualization, incidence-matrix analysis, prompt-flow retrieval, bottleneck localization, and future prompt-engineering research.

## Scope

Included:

- Block drag/drop into prompt textarea so only the dropzone accepts materials/files.
- Document the dual graph model deeply.
- Add typed graph entities to `lib/types.ts`.
- Add a deterministic `buildConversationGraph` helper from existing trace + score report.
- Add prompt/response incidence dictionaries and prompt-response pair status records.
- Render a compact graph section on the shared attempt page.
- Update orchestration, evaluation, materials, and decision docs.

Excluded:

- Full graph visualization canvas.
- Persisted graph tables in Supabase.
- Graph algorithms beyond deterministic indexing and derived counts.
- LLM-generated semantic task status.

## Assumptions

- Existing trace events are alternating enough for MVP pairing, but the builder must tolerate missing responses or system events.
- Task status can start as deterministic metadata inferred from attachments, bottlenecks, scores, and whether a response exists.
- Persisting graph snapshots can wait until the representation proves useful in the share UI and judge pipeline.

## Affected Files

- `components/problem-solver.tsx`
- `components/share-attempt-client.tsx`
- `lib/types.ts`
- `lib/conversation-graph.ts`
- `docs/technical/007_dual_graph_trace_model.md`
- `docs/technical/003_evaluation_direction.md`
- `docs/technical/006_materials_and_attachments.md`
- `docs/000_orchestration.md`
- `docs/technical/000_decision_register.md`

## Implementation Steps

1. Prevent textarea drag/drop defaults for the prompt composer.
2. Define graph node/edge/task status types.
3. Build graph helper from trace and score report.
4. Add dictionaries and adjacency/incidence arrays for efficient lookup.
5. Use the graph helper on the share page.
6. Render a compact graph overview and prompt-response pair rows.
7. Document future persistence and research implications.
8. Verify typecheck, lint, build, and API smoke.

## Backend Complexity Target

The graph builder should not repeatedly scan the trace for each prompt.

Target:

- Build time: `O(n + b + e)`, where `n` is trace event count, `b` is bottleneck count, and `e` is derived edge count.
- Storage: `O(V + E)` using sparse adjacency/incidence dictionaries.
- Lookup: `O(1)` for trace-event-to-node and trace-event-to-pair lookup.

Implementation direction:

- Build `bottleneckByTraceEventId` once.
- Walk `TraceEvent[]` once.
- Maintain `pendingPrompt` and `lastResponseNodeId` while walking.
- Finalize a prompt-response pair only when the next prompt or trace end is reached.
- Avoid `findIndex`, `slice().find`, and repeated reverse scans in the builder.

## Verification

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Manual check that dropping over the prompt textarea does not insert material IDs or files.
- Manual check that the share page renders graph metadata from existing traces.

## Risks

- The graph terminology can become too abstract for beginner UX. Keep visible UI compact and explanatory only where useful.
- Deterministic status inference is a placeholder. LLM judge integration should refine status later.
- Branching/replay will require graph edges beyond simple alternating turns.

## Rollback

Remove the graph helper, graph UI section, and textarea drag/drop blockers. The original flat trace remains untouched.
