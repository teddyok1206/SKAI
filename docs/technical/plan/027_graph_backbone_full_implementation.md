# 027 Graph Backbone Full Implementation

Date: 2026-06-02

## Goal

Implement the full 3D dual graph leverage strategy described in:

- `docs/philosophy/006_3d_dual_graph_system_backbone.md`
- `docs/technical/012_graph_backbone_strategy.md`

The target is to make the graph the common system language for judge annotation, branch/replay, shared learning, user habit reports, model analysis, and research persistence.

## Non-Negotiable Interpretation

The graph must not be treated as only a pretty visualization.

Every implementation phase should move at least one core SKAI loop from raw transcript thinking to graph-state thinking:

```text
trace -> graph -> annotation -> skeleton/diff/motif/report -> learning action
```

## Scope

Included:

- Graph annotations on nodes, edges, and prompt-response-status pairs.
- Judge output mapped to graph targets.
- Graph detail UI that shows judge annotations and evidence.
- Branch/replay graph diff that compares orchestration state, not only text.
- Shared attempt graph skeleton as the primary learning view.
- Attempt-level graph habit report.
- Persisted graph snapshots for research and future DB-backed comparison.
- Admin/research export path.
- Model/provider response graph comparison design hooks.

Excluded for this plan's first implementation wave:

- Full multi-AI harness graph.
- Dense matrix storage in online product paths.
- Certification-grade anti-cheat.
- Production analytics dashboard.
- Automatic cross-user clustering at scale.

## Current Baseline

Existing files/modules:

- `lib/conversation-graph.ts`
- `components/conversation-graph-view.tsx`
- `lib/judge.ts`
- `lib/branch-diff.ts`
- `lib/counterfactual-judge.ts`
- `components/problem-solver.tsx`
- `components/share-attempt-client.tsx`
- `components/score-report-card.tsx`
- `lib/types.ts`
- Supabase migrations through counterfactual report support.

Existing behavior:

- `TraceEvent[]` is canonical.
- Graph is derived in memory.
- Graph tab can render 3D dual graph/projections/index.
- Score report has workflow and bottleneck data.
- Branch replay and counterfactual report exist.
- Shared page shows workflow before raw transcript.

Main missing behavior:

- Graph targets do not yet carry rich annotation payloads.
- Judge is not yet graph-target-native.
- Branch diff is not yet graph-state-first.
- Shared graph skeleton is not yet the dominant public learning artifact.
- Habit motifs are not extracted.
- Graph snapshots are not persisted.

## Phase 1: Graph Annotation Schema

### Goal

Create the typed annotation layer that everything else can reuse.

### Tasks

1. Add graph annotation types to `lib/types.ts` or a dedicated graph type module.
2. Add annotation target types:
   - node,
   - edge,
   - pair.
3. Add annotation kinds:
   - framing,
   - decomposition,
   - delegation,
   - material grounding,
   - verification,
   - adaptation,
   - context drift,
   - bottleneck,
   - recovery,
   - finalization,
   - model behavior,
   - cost efficiency.
4. Add severity/confidence/source/evidence fields.
5. Extend `ConversationGraph` to include annotation lookup indexes:
   - annotations by target id,
   - annotations by trace event id,
   - annotations by kind.
6. Keep graph build complexity at `O(n + b + e + a)`.

### Done Criteria

- Graph can carry annotations without changing raw `TraceEvent`.
- Existing graph UI still works with no annotations.

## Phase 2: Deterministic Annotation Builder

### Goal

Produce useful graph annotations before LLM judge calibration.

### Tasks

1. Add `lib/graph-annotations.ts`.
2. Generate deterministic annotations from existing data:
   - material used,
   - verification prompt,
   - pending response,
   - bottleneck from score report,
   - branch breakpoint,
   - high turn count/context switching,
   - missing material use when problem has materials.
3. Attach annotations to pair/node targets.
4. Add unit-like smoke cases using existing seed problems if test framework is absent.

### Done Criteria

- A graph built from an existing attempt shows useful annotations without LLM judge.

## Phase 3: Judge-To-Graph Annotation Mapping

### Goal

Move judge output from attempt-level commentary toward graph-targeted feedback.

### Tasks

1. Extend `ScoreReport` with optional `graphAnnotations`.
2. Map existing bottlenecks to pair annotations.
3. Map workflow steps to graph skeleton candidates.
4. Update heuristic judge to emit graph annotations where deterministic evidence exists.
5. Update LLM judge prompt/schema to request graph-targeted annotations.
6. Store judge disagreement per annotation where applicable.
7. Make confidence explicit.

### Done Criteria

- Judge can say "P3/S3/R3 caused drift" instead of only "your prompt was vague".
- Existing score report UI remains backward-compatible.

## Phase 4: Graph Tab Annotation UI

### Goal

Make the solve Graph tab operational for learning, not only structural inspection.

### Tasks

1. In `components/conversation-graph-view.tsx`, show annotation counts on compact nodes/pairs.
2. In the detail panel, show:
   - annotation title,
   - severity,
   - explanation,
   - evidence trace event ids,
   - confidence,
   - source.
3. Add filters:
   - all,
   - bottleneck,
   - verification,
   - material,
   - recovery.
4. Keep beginner copy simple; hide graph theory terms unless in index/detail areas.
5. Preserve branch-from-node action.

### Done Criteria

- Selecting a node/pair explains what happened at that orchestration state.

## Phase 5: Branch Diff As Graph State Transition

### Goal

Make replay answer "what state changed?" instead of "what text changed?"

### Tasks

1. Add `GraphStateTransition` type.
2. Extend `lib/branch-diff.ts` to build graph transitions from parent/child graphs.
3. Include before/after status and annotations:
   - parent `S3(bottleneck)`,
   - child `S3'(verification)` or similar.
4. Update `lib/counterfactual-judge.ts` to consume graph transitions.
5. Update solve UI branch diff panel to show parent/child graph-state cards.
6. Update shared attempt counterfactual section.

### Done Criteria

- User can see that a branch changed orchestration state, not merely prompt wording.

## Phase 6: Shared Graph Skeleton First

### Goal

Prevent prompt-copy culture and make shared attempts teach structure first.

### Tasks

1. Add `lib/graph-skeleton.ts`.
2. Generate skeleton steps from graph pairs and annotations.
3. Use labels such as:
   - problem reframe,
   - clarifying question,
   - material selection,
   - task decomposition,
   - draft generation,
   - verification,
   - revision,
   - finalization.
4. In shared attempt page, show skeleton before prompt skeleton/raw transcript.
5. Keep raw prompt and response expandable.
6. Preserve prompt-level comments by anchoring comments to skeleton steps/trace events.

### Done Criteria

- A published attempt can be understood from the graph skeleton without reading raw prompts first.

## Phase 7: Attempt-Level Graph Habit Report

### Goal

Turn graph motifs into coaching beyond a single score.

### Tasks

1. Add `lib/graph-motifs.ts`.
2. Detect MVP motifs:
   - late verification,
   - missing decomposition,
   - material not used in final,
   - context switching,
   - response unexamined,
   - early grounding,
   - strong recovery,
   - model drift.
3. Attach motif evidence pair ids.
4. Add habit report section to score report:
   - "Repeated pattern",
   - "Evidence",
   - "Next practice target".
5. Show at most 3 motifs to beginners.
6. Save all motifs in report metadata for founder/admin.

### Done Criteria

- Score report can say "you tend to verify late" with graph evidence.

## Phase 8: Graph Snapshot Persistence

### Goal

Make graph research/search/comparison possible without recomputing everything from raw trace every time.

### Tasks

1. Add Supabase migration for `conversation_graph_snapshots`.
2. Snapshot fields:
   - attempt id,
   - graph schema version,
   - trace event ids,
   - graph JSON,
   - annotations JSON,
   - motifs JSON,
   - generated at,
   - source.
3. Add sync route support when attempts are judged/submitted.
4. Keep raw `trace_events` canonical.
5. Add local fallback storage if practical.

### Done Criteria

- Judged attempts can persist a versioned graph snapshot.

## Phase 9: Admin/Research Export

### Goal

Prepare the data product and founder review layer.

### Tasks

1. Add export function for:
   - trace,
   - graph nodes,
   - graph edges,
   - annotations,
   - motifs,
   - score report,
   - model metadata.
2. Add admin route control to download JSON.
3. Later add CSV/edge-list export.
4. Include graph schema version.

### Done Criteria

- Founder can export an attempt as graph-centered research data.

## Phase 10: Model/Provider Response Graph Analysis Hooks

### Goal

Separate human orchestration from model behavior.

### Tasks

1. Add comparison helpers for similar prompt graphs under different models.
2. Mark response graph annotations:
   - model drift,
   - over-expansion,
   - grounded response,
   - refusal/failure,
   - latency/cost anomaly.
3. Keep this admin/research-only in the first version.
4. Do not expose model leaderboard as a primary learner UX.

### Done Criteria

- SKAI can start asking: "Given this prompt graph, which model response graph stayed aligned?"

## Phase 11: UX And Copy Guardrails

### Goal

Make graph power usable without overwhelming beginners.

### Tasks

1. Beginner UI labels:
   - "Step",
   - "What changed",
   - "Evidence",
   - "Try from here".
2. Expert/admin labels:
   - node,
   - edge,
   - incidence,
   - motif,
   - graph snapshot.
3. Keep raw transcript accessible but secondary.
4. Keep total score symbolic and less visually dominant than actionable feedback.

### Done Criteria

- Beginner users understand the graph's practical meaning without graph theory knowledge.

## Phase 12: Calibration And Smoke

### Goal

Validate whether graph-centered feedback teaches the intended skill.

### Tasks

1. Run weak/average/strong golden attempts.
2. Check whether annotations land on the correct graph locations.
3. Check whether skeleton summaries reflect actual orchestration.
4. Check whether branch graph diff explains bottleneck repair.
5. Check whether habit motifs match founder qualitative judgment.
6. Record misses in judge calibration notes.

### Done Criteria

- Founder can point to at least 3 graph annotations/diffs/motifs that teach the intended lesson.

## Dependencies

Should happen first or in parallel:

- Live provider smoke.
- Judge calibration.
- Playbook insertion operator UX.

This plan can begin before all three are complete, but Phases 3, 7, and 12 need real attempts to calibrate well.

## Verification

For each implementation phase:

- `conda run -n SKAI npm run typecheck`
- `conda run -n SKAI npm run lint`
- `conda run -n SKAI npm run build` when UI/routes/schema change
- Browser smoke through:
  - solve,
  - graph tab,
  - submit/judge,
  - branch replay,
  - shared attempt.

## Risks

- Too much graph terminology can hurt beginner UX.
- Judge annotations can become fake precision if confidence/source are hidden.
- Graph persistence can duplicate stale derived data if schema versions are not explicit.
- Model comparison can distract from human orchestration if surfaced too early.
- Motif extraction can overgeneralize from too few attempts.

## Rollback Notes

Each phase should be independently reversible:

- annotation types can be optional,
- UI can hide annotations,
- snapshots are derived and can be dropped/rebuilt,
- raw trace remains canonical,
- existing score reports should continue rendering without graph annotations.

## Immediate First Implementation Slice

The first code implementation should be:

1. Add graph annotation types.
2. Build deterministic annotations.
3. Pass annotations into `buildConversationGraph`.
4. Show annotation chips/detail in Graph tab.
5. Map existing bottlenecks to graph pair annotations.

This slice is small enough to implement safely and proves the whole backbone direction.

## Philosophy Check

This plan implements the core SKAI thesis more directly than any UI polish would. It turns chat history into an analyzable directed orchestration object, then uses that object for feedback, replay, sharing, habit formation, model research, and long-term data strategy.
