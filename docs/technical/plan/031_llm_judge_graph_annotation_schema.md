# 031 LLM Judge Graph Annotation Schema

Date: 2026-06-02

## Goal

Make LLM judge output graph-native feedback, not only attempt-level prose.

```text
LLM judge JSON
-> trace-event targeted raw annotations
-> server maps to graph pair/node ids
-> ScoreReport.graphAnnotations
-> Graph tab / shared skeleton / branch diff can consume them
```

## Scope

Included:

- Extend LLM judge JSON schema with `graphAnnotations`.
- Require LLM judge annotations to target `traceEventId`, not internal graph ids.
- Normalize raw judge annotations into `ConversationGraphAnnotation`.
- Map trace event ids to graph pair/node ids on the server.
- Preserve deterministic annotation generation and dedupe behavior.
- Keep heuristic judge behavior unchanged.
- Update judge prompt contract.

Excluded:

- Persisting annotations as first-class DB rows.
- Separate LLM judge calibration dataset.
- UI redesign for graph annotations.
- Multi-judge conflict resolution beyond current ensemble metadata.

## Implementation Steps

1. Add raw LLM judge graph annotation schema in `lib/judge.ts`.
2. Add a normalization helper that maps trace ids to graph pair/node targets.
3. Attach normalized annotations to LLM `ScoreReport.graphAnnotations`.
4. Include primary LLM annotations in ensemble aggregation.
5. Update judge prompt instructions with allowed annotation fields.
6. Update graph backbone/orchestration docs.
7. Verify typecheck, lint, build, and diff check.

## Done Criteria

- LLM judge can return `graphAnnotations`.
- Invalid trace ids are ignored rather than trusted.
- Normalized annotations have stable ids, graph schema version, source `llm_judge`, and valid graph targets.
- Existing heuristic path still works.

## Risks

- LLM judges may over-annotate. Limit count and trim text.
- LLM trace id copying can be unreliable. Server validation must reject invalid ids.
- Annotation confidence should not look more authoritative than calibration supports.

## Philosophy Check

This slice makes SKAI feedback attach to the user's actual orchestration states. It supports the core claim that AI skill is visible in the sequence of graph states, not only in a final score or generic coaching paragraph.

## Implementation Result

Completed on 2026-06-02.

Implemented:

- Extended LLM judge JSON schema with `graphAnnotations`.
- Added `lib/judge-graph-annotations.ts`.
- Raw LLM annotations target `traceEventId`, not graph ids.
- Server maps target trace ids to graph pair/node ids through `buildConversationGraph`.
- Invalid trace ids are ignored.
- Normalized annotations use:
  - stable SKAI annotation ids,
  - `conversation-graph.v0.annotations`,
  - source `llm_judge`,
  - validated graph targets,
  - bounded confidence and text length.
- `normalizeLlmReport` attaches normalized annotations to `ScoreReport.graphAnnotations`.
- Ensemble aggregation preserves primary LLM graph annotations.
- Judge prompt now documents allowed graph annotation fields, kinds, severities, and confidence behavior.

Verification:

- `conda run -n SKAI npm run typecheck`
- `conda run -n SKAI npm run lint`
- `conda run -n SKAI npm run build`
- `git diff --check`

Remaining:

- Actual LLM judge calibration on golden attempts.
- UI treatment for judge-native vs deterministic annotation confidence.
- Persisting annotations as first-class DB rows instead of only score report JSON.
