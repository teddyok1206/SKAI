# 015 Context Compiler And Counterfactuals

Date: 2026-06-02

## Goal

Implement the backend context management layer implied by breakpoint replay: API context should be materialized from immutable trace data on every model call, not deleted/restored inside provider memory.

Also document the next branch features:

- parent/child branch diff,
- counterfactual judge.

## Rationale

Branch replay makes AI context management explicit. A user may jump between parent and child attempts, but provider APIs should receive only the context for the currently executing attempt.

The product should therefore use:

- immutable raw traces,
- child attempts for branch replay,
- source trace lineage,
- a deterministic context compiler that turns trace + problem + materials + branch metadata into provider messages.

This avoids brittle provider-thread state and keeps SKAI's graph/judge/research data auditable.

## Scope

Included:

- Add a context compiler module.
- Extend chat message schemas with branch lineage metadata.
- Send branch metadata from the solve UI to `/api/chat`.
- Use the compiler in `/api/chat` before calling providers.
- Keep provider calls stateless: every call receives a fully materialized context.
- Document parent/child diff and counterfactual judge architecture.
- Update decision and orchestration docs.

Excluded:

- Full UI for branch diff.
- Actual counterfactual judge endpoint.
- LLM-generated trace summarization.
- Provider-native thread/session storage.

## Data Flow

```text
Attempt trace + branch metadata + problem
  -> ContextCompiler
  -> systemPrompt + contextMessage + provider messages
  -> provider API
```

No provider thread is the canonical state.

## Context Rules

- Never delete parent trace data to simulate a branch.
- Never depend on provider conversation memory as canonical state.
- Runtime "restore" means compiling a context window from the selected attempt.
- Runtime "delete" means excluding events outside the current branch path from the provider request.
- The raw trace remains immutable for judge, sharing, research, and diff.

## Affected Files

- `lib/context-compiler.ts`
- `lib/types.ts`
- `components/problem-solver.tsx`
- `app/api/chat/route.ts`
- `docs/technical/009_context_compiler.md`
- `docs/technical/010_branch_diff_and_counterfactual_judge.md`
- `docs/technical/000_decision_register.md`
- `docs/000_orchestration.md`

## Implementation Steps

1. Define context compiler input/output types.
2. Include problem statement, goal, constraints, deliverables, starter context, and material catalog in context.
3. Include branch metadata and source trace lineage when present.
4. Add deterministic pruning for oversized message lists, keeping the most recent executable context.
5. Extend chat route schema and call compiler before provider completion.
6. Send branch and source trace fields from the solve UI.
7. Document parent/child diff and counterfactual judge as next-stage features.
8. Verify typecheck, lint, and build.

## Complexity Target

- Context compile time: `O(n + m)`, where `n` is message count and `m` is material count.
- Storage impact: none beyond existing branch metadata.
- Provider request size: bounded by `SKAI_MAX_MESSAGES_PER_REQUEST`.

## Verification

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Manual smoke: normal attempt chat still works.
- Manual smoke: branch attempt chat sends lineage metadata without mutating parent trace.

## Risks

- Deterministic pruning can hide older context. For MVP it should make the omission explicit in the context message.
- Provider-specific multimodal behavior remains imperfect. The compiler should preserve attachment metadata and let providers handle image parts.

## Rollback

Remove `lib/context-compiler.ts`, revert `/api/chat` to passing parsed messages directly, and keep branch metadata as stored trace information only.
