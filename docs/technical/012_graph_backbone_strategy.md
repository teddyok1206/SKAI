# Graph Backbone Strategy

Date: 2026-06-02

Source: `docs/philosophy/006_3d_dual_graph_system_backbone.md`

Latest extension: `docs/philosophy/Gemini/006.md`

## Thesis

The 3D dual graph should become SKAI's system backbone.

It should not remain only a visualization tab. It should be the shared representation used by:

- judge annotation,
- coach feedback,
- branch replay and graph diff,
- shared attempt learning views,
- user habit reports,
- model/provider analysis,
- research export and future graph persistence.

## Current Graph Baseline

Already implemented:

- `TraceEvent[]` remains the canonical raw transcript.
- `buildConversationGraph(trace, scoreReport, branch?)` derives graph data from trace.
- Prompt graph, response graph, and task-status layer exist.
- Sparse indexes support node/pair lookup.
- Graph tab exists in the solve UI.
- Shared attempt page has graph-derived workflow sections.
- Breakpoint replay anchors branch metadata to graph pairs.
- Parent/child branch diff and counterfactual judge exist as baseline.
- Conversation graph annotations exist as an in-memory derived layer.
- Deterministic annotations are generated for bottlenecks, material use, verification, adaptation, pending responses, breakpoint anchors, and missing material use.
- Sparse annotation indexes support lookup by target id, trace event id, and kind.
- The Graph tab detail panel renders selected node/pair annotations and evidence.
- Score reports carry derived graph annotations.
- LLM judge can emit trace-event-targeted graph annotations that the server maps to graph pair/node targets.
- Branch diffs carry parent/child graph-state transitions.
- Counterfactual judge consumes graph-state status and annotation delta as evidence.
- Shared graph skeletons are generated from graph pairs, task status, and annotations.
- The solve Graph surface is now a single 3D Dual ladder view. Prompt/Response/Status projections and sparse index remain backend/research/debug structures rather than user-facing tabs.

Current limitation:

- LLM judge graph annotation schema exists, but calibration quality is not yet verified on golden attempts.
- Graph nodes/pairs can carry LLM judge-native annotations, but the visual surface does not yet overlay annotation severity onto nodes/edges. Bottlenecks, weak edges, recovery, verification, and material grounding are mostly read through the detail panel.
- Shared attempt UX now has a skeleton-first path, but cross-attempt skeleton comparison is not implemented.
- Parent/child branch diff carries graph-state transitions, but the UI does not yet render parent and child 3D Dual graphs side by side as a counterfactual comparison canvas.
- Multi-model/harness solving is still outside the demo contract. There is no `model lane` or `inter-model edge` data model yet.
- User habit reporting does not yet aggregate graph motifs.
- Graph snapshots are not yet persisted for offline research/search.

## System Principle

Every major SKAI loop should eventually answer through graph state:

```text
What did the user change?
What did the model return?
What task state did that create?
What evidence/material entered the loop?
What did the judge infer at that node/pair/edge?
What changed after replay?
What graph node or edge became a bottleneck?
What graph node or edge recovered after branch replay?
What changed between parent and child graph surfaces?
What changed when the same orchestration was routed through another model lane?
What pattern repeats across attempts?
```

## Core Entities To Add

### Graph Annotation

Attach judge and deterministic observations to graph nodes, edges, and pairs.

Candidate type:

```ts
type GraphAnnotationTargetKind = "node" | "edge" | "pair";

type GraphAnnotationKind =
  | "framing"
  | "decomposition"
  | "delegation"
  | "material_grounding"
  | "verification"
  | "adaptation"
  | "context_drift"
  | "bottleneck"
  | "recovery"
  | "finalization"
  | "model_behavior"
  | "cost_efficiency";

interface GraphAnnotation {
  id: string;
  attemptId: string;
  graphSchemaVersion: string;
  targetKind: GraphAnnotationTargetKind;
  targetId: string;
  kind: GraphAnnotationKind;
  severity: "info" | "positive" | "watch" | "critical";
  axis?: string;
  scoreImpact?: number;
  confidence: number;
  title: string;
  explanation: string;
  evidenceTraceEventIds: string[];
  source: "deterministic" | "heuristic_judge" | "llm_judge" | "human";
  createdAt: string;
}
```

### Graph Diff

Represent parent/child replay as graph-state transition, not text diff.

Candidate type:

```ts
interface GraphStateTransition {
  id: string;
  parentAttemptId: string;
  childAttemptId: string;
  breakpointPairId: string;
  before: {
    promptNodeId?: string;
    statusNodeId?: string;
    responseNodeId?: string;
    status?: string;
    annotations: GraphAnnotation[];
  };
  after: {
    promptNodeId?: string;
    statusNodeId?: string;
    responseNodeId?: string;
    status?: string;
    annotations: GraphAnnotation[];
  };
  transitionLabels: string[];
  processDelta: {
    turnDelta: number;
    tokenDelta?: number;
    materialUseChanged: boolean;
    verificationMovedEarlier: boolean;
  };
  scoreDelta?: Record<string, number>;
}
```

### Graph Evaluation Overlay

Represent judge/deterministic annotations as a graph-readable visual layer.

Candidate type:

```ts
type GraphOverlaySeverity = "neutral" | "positive" | "watch" | "critical";
type GraphOverlayTargetKind = "node" | "edge" | "pair";

interface GraphOverlayTarget {
  id: string;
  targetKind: GraphOverlayTargetKind;
  targetId: string;
  pairId?: string;
  sequence?: number;
  severity: GraphOverlaySeverity;
  signal:
    | "bottleneck_node"
    | "weak_edge"
    | "recovery"
    | "verification"
    | "material_grounding"
    | "model_drift"
    | "cost_anomaly"
    | "neutral";
  annotationIds: string[];
  confidence: number;
  label: string;
  explanation: string;
}
```

Implementation principle:

- This should be derived from `ConversationGraph.annotations` and existing `pairs/edges`.
- Do not duplicate raw judge text into a separate source of truth.
- In the first slice, pair-level annotations can drive local node/edge treatment even when edge-specific annotations are sparse.
- Overlay must degrade gracefully when judge annotations are missing.

### Parallel Graph Comparison

Represent counterfactual replay as two graph surfaces with a transition bridge.

Candidate type:

```ts
interface ParallelGraphComparison {
  id: string;
  parentAttemptId: string;
  childAttemptId: string;
  breakpointTraceEventId: string;
  parentGraph: ConversationGraph;
  childGraph: ConversationGraph;
  transition?: GraphStateTransition;
  focusPairIds: {
    parentPairId?: string;
    childPairId?: string;
  };
  summaryLabels: string[];
}
```

Implementation principle:

- Parent/child comparison should make annotation delta visible before text diff.
- A branch is successful when the user can see what orchestration state changed, not only which prompt wording changed.
- The comparison should initially be scoped to branch attempts, not arbitrary cross-user attempts.

### Multi-Model Graph Lanes

Represent future multi-AI/harness solving without breaking single-model attempts.

Candidate direction:

```ts
interface GraphModelLane {
  id: string;
  provider: ProviderId;
  model: string;
  label: string;
  graph: ConversationGraph;
}

interface InterModelEdge {
  id: string;
  sourceLaneId: string;
  sourceNodeId: string;
  targetLaneId: string;
  targetNodeId: string;
  sourceTraceEventId?: string;
  targetTraceEventId?: string;
  transferKind: "copy" | "summary" | "artifact" | "verification_request" | "tool_result";
  label: string;
}
```

Implementation principle:

- Do not expose this as a model leaderboard.
- The research question is how the human routed intent/material/artifact between execution engines.
- The first demo remains single-model; multi-model lanes are a future-compatible shape.

### Graph Skeleton

Summarize a trace as a visible orchestration skeleton.

Candidate type:

```ts
interface GraphSkeletonStep {
  id: string;
  pairId: string;
  sequence: number;
  label: string;
  role:
    | "problem_reframe"
    | "clarifying_question"
    | "material_selection"
    | "task_decomposition"
    | "draft_generation"
    | "verification"
    | "revision"
    | "finalization"
    | "other";
  annotationIds: string[];
  summary: string;
  expandableTraceEventIds: string[];
}
```

### Graph Motif

Aggregate repeated orchestration behavior.

Candidate type:

```ts
interface GraphMotif {
  id: string;
  userId?: string;
  problemId?: string;
  scope: "attempt" | "user" | "problem" | "model";
  kind:
    | "late_verification"
    | "missing_decomposition"
    | "material_not_used_in_final"
    | "context_switching"
    | "response_unexamined"
    | "early_grounding"
    | "strong_recovery"
    | "model_drift";
  evidencePairIds: string[];
  count: number;
  explanation: string;
  recommendation?: string;
}
```

### Graph Snapshot

Persist derived graph state after submission/judge.

Candidate table:

```text
conversation_graph_snapshots
  id uuid primary key
  attempt_id uuid
  graph_schema_version text
  trace_event_ids jsonb
  graph jsonb
  annotations jsonb
  generated_at timestamptz
  source text
```

Do not replace `trace_events`. Trace remains canonical. Snapshot is derived and versioned.

## Required Product Surfaces

### 1. Judge Annotation Surface

Where:

- solve Graph tab detail panel,
- score report card,
- shared attempt graph view.

Behavior:

- select a graph node/pair,
- show judge annotations attached to that target,
- show evidence trace events,
- show score impact when available.

### 2. Graph Diff Surface

Where:

- branch diff panel,
- counterfactual judge section,
- future branch tree explorer.

Behavior:

- show parent and child graph states side by side,
- mark changed prompt/status/response,
- show transition labels,
- explain whether the changed prompt changed orchestration state.

### 3. Graph Skeleton Sharing Surface

Where:

- shared attempt page,
- problem-level published attempts,
- future community comparison.

Behavior:

- show skeleton before raw transcript,
- raw prompt/response only on expand,
- preserve learning from structure rather than prompt copying.

### 4. Graph Habit Report

Where:

- attempt result page,
- future profile/dashboard,
- founder review dashboard.

Behavior:

- extract motifs from one attempt,
- later aggregate motifs across user attempts,
- give practice targets based on graph behavior.

### 5. Model/Provider Response Graph Analysis

Where:

- admin/research surfaces first,
- model provider/startup data product later.

Behavior:

- compare response graphs under similar prompt graphs,
- separate human orchestration quality from model behavior,
- store model drift/stability annotations.

## Implementation Order

1. Add graph annotation types and deterministic annotation builder. Done in `028`.
2. Attach heuristic/LLM judge feedback to graph pairs. Baseline done in `029`; LLM custom schema done in `031`.
3. Render annotations in the Graph tab detail panel. Done in `028`.
4. Convert branch diff UI into graph-state transition UI. Done in `029`.
5. Build graph skeleton generator and use it in shared attempts. Done in `032`.
6. Build graph motif extractor for attempt-level habit report.
7. Persist graph snapshots after judged submission.
8. Add admin/research export of graph, annotations, motifs, and snapshots.
9. Later: compare same/similar prompt graphs across models.

## Complexity Target

Graph derivation should remain efficient:

- trace pass: `O(n)`,
- annotation attach: `O(a)`,
- pair/node lookup: `O(1)` using sparse maps,
- motif extraction: `O(V + E + a)` for MVP rules,
- snapshot storage: `O(V + E + a)`.

Avoid dense graph matrices in the online product path. Dense incidence/adjacency matrices can be generated for offline research exports only.

## Anti-Goals

- Do not turn graph into decorative analytics.
- Do not hide raw trace, but do not make raw trace the default learning path.
- Do not make judge annotations look more certain than they are.
- Do not replace human qualitative founder review during early smoke tests.
- Do not make model comparison override human orchestration assessment.
- Do not force all feedback into numeric scores.

## Open Questions

- When should graph annotations move from `ScoreReport` JSON to a separate persisted entity?
- Should LLM judge produce custom annotations directly, or should SKAI continue to derive them from bottleneck/workflow outputs first?
- What confidence threshold should be shown to beginners?
- How many motif kinds should be visible in beginner mode?
- Should material attachments become first-class graph nodes or pair metadata in the MVP?
- Should graph snapshot persistence wait until Supabase deployment hardening?

## Philosophy Check

This strategy directly implements SKAI's core claim: AI skill is a directed process of problem framing, task assignment, response interpretation, and verification. The graph becomes the common language that keeps judge, replay, sharing, habit analysis, and model research tied to human orchestration rather than generic chatbot output.
