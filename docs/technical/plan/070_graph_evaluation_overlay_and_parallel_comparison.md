# 070 Graph Evaluation Overlay And Parallel Comparison

Date: 2026-06-04

## Goal

Reflect `docs/philosophy/Gemini/006.md` by turning the 3D Dual Graph from a clean structural view into a graph-readable learning surface:

- show bottleneck nodes and weak edges directly on the graph;
- show recovery, verification, and material grounding as graph overlay signals;
- compare parent/child replay branches as side-by-side graph states;
- prepare future multi-model/harness graph lanes without breaking the current single-model demo.

The immediate implementation target is not a full analytics system. It is a smoke-test-ready visual layer that lets a user see "where my orchestration broke or recovered" before reading the textual report.

## Source Inputs

- `docs/philosophy/Gemini/006.md`
- `docs/philosophy/006_3d_dual_graph_system_backbone.md`
- `docs/technical/012_graph_backbone_strategy.md`
- `docs/technical/010_branch_diff_and_counterfactual_judge.md`
- `docs/technical/plan/027_graph_backbone_full_implementation.md`
- `docs/technical/plan/069_graph_surface_ladder_alignment_and_tab_simplification.md`

## Scope

Included:

- derive a visual overlay model from existing `ConversationGraph.annotations`, `pairs`, and edges;
- apply overlay classes to 3D Dual prompt/response/status nodes and ladder rungs;
- surface a small legend and layer controls in beginner-safe language;
- allow users to toggle the whole overlay or individual overlay layers;
- keep the detail panel as evidence expansion, not the primary signal;
- add a parent/child graph comparison plan and first UI integration point;
- document future `model lane` / `inter-model edge` design hooks.

Excluded from the first slice:

- full multi-AI solving mode;
- graph snapshot persistence;
- arbitrary cross-user graph comparison;
- ML-based weak-edge detection;
- certification-grade model/prompt audit;
- dense matrix storage in online product paths.

## Assumptions

- `TraceEvent[]` remains the canonical raw record.
- `ConversationGraph` remains a derived object built from trace, score report, and branch metadata.
- Current graph annotations already include enough signal for a first overlay:
  - `bottleneck`,
  - `verification`,
  - `material_grounding`,
  - `adaptation`,
  - `recovery`,
  - `model_behavior`,
  - `cost_efficiency`.
- Pair-level annotations can drive local cell styling even when edge-specific annotations are not yet present.
- Beginner-facing copy should say "병목", "약한 연결", "검증", "자료 사용", "회복" rather than incidence, duality, or edge-target semantics.
- Overlay is a lens over the base graph, not the graph itself. Users must be able to turn it off to inspect the clean structure.

## Affected Files / Modules

Likely implementation files:

- `lib/types.ts`
- `lib/conversation-graph.ts`
- `lib/graph-annotations.ts`
- `lib/branch-diff.ts`
- `components/conversation-graph-view.tsx`
- `components/graph-state-transition-view.tsx`
- `components/problem-solver.tsx`
- `components/share-attempt-client.tsx`
- `app/globals.css`

Documentation files:

- `docs/000_orchestration.md`
- `docs/technical/012_graph_backbone_strategy.md`
- `docs/technical/010_branch_diff_and_counterfactual_judge.md`
- `docs/technical/000_decision_register.md`
- this plan file.

## Data Model / API Changes

Slice 1 can avoid persistence/API changes by deriving overlay data in the client or a pure helper.

Candidate derived type:

```ts
type GraphOverlaySeverity = "neutral" | "positive" | "watch" | "critical";

type GraphOverlaySignal =
  | "bottleneck_node"
  | "weak_edge"
  | "recovery"
  | "verification"
  | "material_grounding"
  | "model_drift"
  | "cost_anomaly"
  | "neutral";

interface GraphOverlayTarget {
  id: string;
  targetKind: "node" | "edge" | "pair";
  targetId: string;
  pairId?: string;
  sequence?: number;
  severity: GraphOverlaySeverity;
  signal: GraphOverlaySignal;
  annotationIds: string[];
  confidence: number;
  label: string;
  explanation: string;
}
```

Candidate local UI state:

```ts
interface GraphOverlayControls {
  enabled: boolean;
  layers: {
    bottleneck: boolean;
    weakEdge: boolean;
    verification: boolean;
    materialGrounding: boolean;
    recovery: boolean;
    modelBehavior: boolean;
    costEfficiency: boolean;
  };
}
```

Initial default:

- `enabled: true`
- `bottleneck: true`
- `weakEdge: true`
- `recovery: true`
- `verification: false`
- `materialGrounding: false`
- `modelBehavior: false`
- `costEfficiency: false`

Reason: first smoke users should immediately see the critical learning signals, but should not face every analysis layer at once.

## Backend Strategy

### Core Principle

Use the existing SKAI graph stack instead of inventing a separate overlay data model:

```text
immutable TraceEvent[]
-> ConversationGraph nodes/edges/pairs
-> ConversationGraphAnnotation[]
-> sparse GraphOverlayIndex
-> UI layer controls
```

The overlay is not a new judgment source. It is a fast, toggleable projection of existing graph annotations onto graph nodes, edges, and pair cells.

### Why This Fits The Existing Philosophy

- `TraceEvent[]` remains canonical.
- `ConversationGraph` remains the structural representation of prompt/response/status.
- `ConversationGraphAnnotation` remains the auditable judgment/evidence layer.
- `GraphOverlayIndex` becomes only a visual lookup layer.
- Toggling overlay layers never changes the underlying graph, score report, judge output, or trace.

### Proposed Derived Index

```ts
interface GraphOverlayIndex {
  schemaVersion: string;
  targetsById: Record<string, GraphOverlayTarget>;
  targetIdsByGraphTargetId: Record<string, string[]>;
  targetIdsByPairId: Record<string, string[]>;
  targetIdsBySequence: Record<number, string[]>;
  targetIdsByLayer: Record<keyof GraphOverlayControls["layers"], string[]>;
  targetIdsByEdgeId: Record<string, string[]>;
  summaryByNodeId: Record<string, GraphOverlaySummary>;
  summaryByEdgeId: Record<string, GraphOverlaySummary>;
  summaryByPairId: Record<string, GraphOverlaySummary>;
}

interface GraphOverlaySummary {
  severity: GraphOverlaySeverity;
  signals: GraphOverlaySignal[];
  annotationIds: string[];
  label: string;
  confidence: number;
}
```

### Build Algorithm

1. Start from a fully built `ConversationGraph`.
2. Create O(1) maps:
   - `nodeById`;
   - `edgeById`;
   - `pairById`;
   - `pairByNodeId`;
   - `pairByEdgeId`;
   - `pairByTraceEventId` from existing graph index.
3. For every `ConversationGraphAnnotation`:
   - map annotation kind/severity/source/confidence to one or more `GraphOverlayTarget`s;
   - keep `annotationIds` and evidence references;
   - attach to exact `node`/`edge` target if available;
   - attach to `pair` when target is pair-level;
   - use pair fallback only when the rule is explicit.
4. Aggregate summaries:
   - for each node;
   - for each edge;
   - for each pair/cell.
5. Store lookup dictionaries by layer and by local graph cell.

### Complexity Target

- `buildConversationGraph`: stays `O(V + E + A)`.
- `buildGraphOverlayIndex`: `O(A + P + E)`.
- Looking up overlays for a selected node/pair/edge: `O(1)`.
- Applying layer controls: `O(k)` where `k` is the small number of overlay targets attached to that visible cell, not the full trace.
- Branch comparison: build two overlay indexes independently, then compare only breakpoint/focus pair summaries unless the user expands all deltas.

### Accuracy Rules

- Do not let CSS infer semantics. CSS only renders the result of `GraphOverlayTarget`.
- Every visible overlay must be traceable to annotation ids, evidence trace event ids, source, and confidence.
- Pair-level bottleneck can mark the local P/R/S cell, but should not claim a specific edge is weak unless:
  - the annotation targets that edge; or
  - the fallback mapping rule is documented, such as `context_drift` on a pair maps to the local response-to-prompt rung.
- Source priority should be explicit:
  - human override,
  - LLM judge,
  - heuristic judge,
  - deterministic signal.
- Confidence should break ties, not replace source/evidence.

### Toggle Strategy

Controls should filter the prebuilt overlay index:

```text
activeTargetIds = enabled
  ? union(targetIdsByLayer[layer] for active layers)
  : empty
```

For rendering a graph row:

```text
pairTargetIds = targetIdsByPairId[pair.id]
visibleTargetIds = pairTargetIds ∩ activeTargetIds
summary = aggregate(visibleTargetIds)
```

For performance, the first implementation can compute these in `useMemo` from `graph` and `overlayControls`. The pure helper should remain UI-independent so it can later move server-side or into persisted graph snapshots.

### Persistence Strategy

Do not persist overlay index first.

Order:

1. derive overlay index in memory;
2. verify it teaches users in smoke tests;
3. when graph snapshots are introduced, persist `ConversationGraph` + annotations + overlay schema version as derived snapshot metadata;
4. keep raw trace canonical.

The first version should be recomputable from `ConversationGraph`.

Future multi-model/harness types should remain design hooks until the product explicitly enters multi-AI solving:

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
  transferKind: "copy" | "summary" | "artifact" | "verification_request" | "tool_result";
  label: string;
}
```

## Implementation Slices

### Slice 1: Single-Attempt Evaluation Overlay

Goal:

- make the existing 3D Dual Graph visually communicate annotation severity.

Steps:

1. Add a pure helper, likely `lib/graph-overlay.ts`, that maps `ConversationGraph` to overlay targets.
2. Build severity aggregation:
   - `critical` wins over `watch`;
   - `positive` marks recovery/verification/material success;
   - low-confidence annotations should not dominate the surface.
3. Map annotation kinds to visual signals:
   - `bottleneck` -> bottleneck node/cell;
   - `context_drift` or negative `model_behavior` -> weak edge / drift;
   - `verification` -> verification ring or blue/green signal;
   - `material_grounding` -> material grounding signal;
   - `recovery` / `adaptation` -> recovery signal.
4. Update `ConversationGraphView`:
   - apply overlay class to `GraphNodeButton`;
   - apply overlay class to ladder rungs when the pair/cell has a weak-edge or bottleneck signal;
   - keep same-index selection behavior intact;
   - do not make origin stub active.
5. Add compact overlay controls:
   - 전체 overlay on/off;
   - 병목;
   - 약한 연결;
   - 검증;
   - 자료 사용;
   - 회복;
   - advanced-only model/cost layers.
6. Add a compact legend:
   - 병목,
   - 약한 연결,
   - 검증,
   - 자료 사용,
   - 회복.
7. Keep the detail panel as the explanation/evidence surface.

Done criteria:

- A judged attempt with bottleneck annotations shows visible warning treatment on the relevant graph cell.
- A material/verification/recovery signal is visible without opening raw transcript.
- Turning overlay off returns the graph to the clean structural ladder view.
- Turning individual layers on/off changes only visual treatment, not graph data or detail evidence.
- No graph theory vocabulary is required to interpret the overlay.

### Slice 2: Weak Edge And Pair-Level Fallback

Goal:

- represent "weak edge" even before edge-target-native judge output is common.

Steps:

1. Treat pair-level `context_drift`, `bottleneck`, and negative `model_behavior` annotations as weak local transition signals.
2. Prefer edge-target annotations when present.
3. For the current ladder geometry:
   - prompt-side rung represents how user prompt enters response-state flow;
   - response-side rung represents how model response updates next prompt-state flow.
4. Add CSS treatments:
   - thin/dim/dashed for weak;
   - critical pulse for bottleneck;
   - constructive pulse for recovery/material/verification.
5. Ensure accessibility:
   - preserve text labels in detail panel;
   - use color plus stroke/shape, not color alone.

Done criteria:

- Even if annotations target `pair`, the graph can still show weak local flow.
- Edge treatment does not make the ladder visually noisy in a 5-8 turn attempt.

### Slice 3: Parent/Child Parallel Graph Comparison

Goal:

- show counterfactual replay as graph-state comparison before text diff.

Steps:

1. Create a reusable comparison component, likely `GraphComparisonView`.
2. Render parent graph and child graph side by side.
3. Anchor both graphs at the branch breakpoint pair.
4. Use existing `BranchDiff.graphTransition` and `annotationDelta` to produce comparison labels:
   - bottleneck removed;
   - verification added;
   - material grounding added;
   - new bottleneck appeared;
   - no meaningful state change.
5. Reuse the same overlay helper from Slice 1.
6. Reuse the same overlay controls in comparison mode, with linked toggles across parent and child graphs.
7. Put text diff below graph comparison as evidence.
8. Use the comparison in:
   - solve branch/counterfactual panel;
   - shared attempt counterfactual section.

Done criteria:

- A user can see parent vs child graph difference without reading the raw prompts first.
- Branch replay communicates state repair, not prompt beautification.

### Slice 4: Multi-Model/Harness Design Hook

Goal:

- prepare the graph architecture for future multi-AI orchestration without shipping a premature feature.

Steps:

1. Document `GraphModelLane` and `InterModelEdge` in `docs/technical/012_graph_backbone_strategy.md`.
2. Keep existing `Attempt` single-model in the first smoke contract.
3. If adding code hooks, keep them optional and unused:
   - no UI toggle;
   - no public model comparison;
   - no attempt schema migration unless a real multi-model solving mode is built.
4. Define future event semantics:
   - response from model A copied/summarized into prompt for model B;
   - artifact from one lane verified by another lane;
   - cross-lane material transformation.

Done criteria:

- Future multi-model design is clear, but current demo remains focused.

## Verification Steps

For docs-only planning:

- `git diff --check`
- manual review of docs for consistency.

For Slice 1 implementation:

- `conda run -n SKAI npm run typecheck`
- `conda run -n SKAI npm run lint`
- `conda run -n SKAI npm run build`
- browser smoke:
  - open a judged attempt;
  - enter Graph tab;
  - confirm annotation overlay appears;
  - toggle overlay off and confirm the clean structural graph remains readable;
  - toggle individual layers and confirm unrelated layers disappear;
  - select `P_i/R_i/S_i`;
  - confirm detail panel evidence matches overlay;
  - confirm origin stub does not activate.

For Slice 3 implementation:

- create a parent attempt and child branch;
- submit/judge both if needed;
- run counterfactual judge;
- verify side-by-side graph comparison highlights the breakpoint and annotation delta.

## Risks

- Overlay can become visually noisy if every annotation gets a strong treatment.
- Too many toggles can become an expert dashboard. Keep first-smoke controls compact and use beginner-safe layer labels.
- Users may mistake judge confidence for objective truth if confidence/source is hidden.
- Weak-edge styling can overclaim causality before LLM judge calibration improves.
- Parallel graph comparison can become too wide for mobile.
- Multi-model lane design can pull SKAI toward model benchmarking if exposed too early.

## Rollback Notes

- Overlay classes should be removable without changing graph data.
- Overlay controls should be local UI state first. Persisting user overlay preferences can wait.
- The detail panel should continue to work if overlay helper is disabled.
- Branch text diff/counterfactual report should remain available if graph comparison is hidden.
- Multi-model lane types should not be persisted until the feature is real.

## Open Questions

- Should overlay severity be computed from max severity, weighted confidence, or source priority?
- What should the first-smoke default layer set be: bottleneck-only, bottleneck+recovery, or bottleneck+weak-edge+recovery?
- Should pair-level bottleneck highlight all three local nodes, or only the status node plus affected rung?
- How much animation is acceptable before the graph stops feeling precise?
- Should weak edges be generated deterministically, or only by LLM/human judge?
- In branch comparison, should parent/child graphs share scroll position and selected sequence?

## Philosophy Check

This plan advances SKAI's core direction because it makes orchestration state visible. The graph overlay should teach users to debug framing, material use, verification, and recovery, not to chase decorative graph effects. The main watchpoint is model comparison: future multi-model lanes must show human routing decisions, not become a model leaderboard detached from human orchestration skill.
