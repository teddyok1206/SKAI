# 016 Branch Diff Counterfactual Judge

Date: 2026-06-02

## Goal

Implement parent/child branch diff and counterfactual judge as working product features.

## Rationale

Breakpoint replay is only half of the learning loop. Users also need to see whether the branch actually changed the orchestration in a useful way.

The comparison must be process-aware, not only final-answer-aware:

- What changed at the breakpoint?
- Did the new prompt reduce ambiguity?
- Did the response become more grounded or useful?
- Did verification/material use improve?
- Did the score or cost change?

## Scope

Included:

- Add typed `BranchDiff` and `CounterfactualJudgeReport`.
- Build deterministic parent/child branch diff.
- Build heuristic counterfactual judge baseline.
- Add `/api/counterfactual-judge`.
- Add solve UI section for branch attempts.
- Store the report on child attempts and published snapshots.
- Add shared attempt rendering for counterfactual reports.
- Add Supabase sync/migration field for counterfactual report JSON.
- Update docs and decision register.

Excluded:

- Full branch tree explorer.
- Side-by-side visual graph diff canvas.
- Persistent separate `counterfactual_judge_runs` table.
- Mandatory LLM judge execution without API keys.

## Data Model

`BranchDiff` captures:

- parent/child attempt ids,
- breakpoint trace event,
- changed prompt before/after,
- response before/after,
- process deltas,
- score deltas.

`CounterfactualJudgeReport` captures:

- verdict: improved, regressed, mixed, inconclusive,
- confidence,
- judge mode/provider/model,
- summary,
- causal claims,
- risks,
- next replay suggestion,
- embedded branch diff.

The report is attached to the child attempt as `counterfactualReport`.

## Implementation Steps

1. Extend domain types.
2. Add `lib/branch-diff.ts`.
3. Add `lib/counterfactual-judge.ts`.
4. Add API route.
5. Wire solve UI for branch attempts.
6. Wire shared attempt UI.
7. Add Supabase migration and sync fields.
8. Update docs.
9. Verify typecheck, lint, build.

## Complexity Target

- Diff build time: `O(n + m)`, where `n` is parent trace length and `m` is child trace length.
- Storage: `O(1)` report per child attempt plus bounded text snippets.
- No provider call required for baseline heuristic mode.

## Verification

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Manual smoke: branch an attempt, continue, submit child, run counterfactual judge.

## Risks

- Heuristic counterfactual judge is useful for demo flow but weaker than LLM review. Label it clearly as baseline.
- Comparing total turns between parent and child can be misleading when the child branch starts from a copied prefix. Show process deltas as signals, not final truth.

## Rollback

Remove branch diff/counterfactual types, helper modules, API route, UI sections, and Supabase migration. Existing attempts remain valid because the field is optional.
