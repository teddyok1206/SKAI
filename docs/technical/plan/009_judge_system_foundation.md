# 009 Judge System Foundation

Date: 2026-06-01

## Goal

Prepare SKAI's backend judge as a repeatable, auditable evaluation system before attempting any Codex-backed agent judge.

## Rationale

Judging is mostly repeated evaluation against a stable rubric. It does not need to be agentic first. SKAI should prioritize:

- consistent inputs,
- structured outputs,
- judge run records,
- deterministic fallback,
- optional LLM judge,
- future multi-judge voting.

Codex-backed judging should remain a local research spike until the normal judge pipeline is stable.

## Scope

Included:

- Keep heuristic judge as deterministic baseline.
- Add async judge pipeline.
- Add optional LLM judge mode.
- Add optional ensemble mode with multiple judge configs.
- Store judge run summaries on score reports.
- Add judge disagreement summaries.
- Add provider request hooks for judge-specific system prompts.
- Add Supabase score report metadata columns.
- Update orchestration and decision docs.

Excluded:

- Running Codex as a backend process.
- Queue worker implementation.
- Full human calibration dataset.
- Prompt injection hardening beyond basic system prompt separation.

## Environment Variables

- `SKAI_JUDGE_MODE`: `heuristic`, `llm`, or `ensemble`. Default: `heuristic`.
- `SKAI_JUDGE_PROVIDER`: provider for single LLM judge. Default: `gemini`.
- `SKAI_JUDGE_MODEL`: model for single LLM judge. Default follows provider.
- `SKAI_JUDGE_ENSEMBLE`: comma-separated configs such as `gemini:gemini-2.5-flash-lite,openai:gpt-4.1-mini`.

## Affected Files

- `lib/judge.ts`
- `lib/types.ts`
- `lib/providers/types.ts`
- `lib/providers/openai-compatible.ts`
- `app/api/judge/route.ts`
- `app/api/attempts/sync/route.ts`
- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/003_score_report_judge_metadata.sql`
- `docs/000_orchestration.md`
- `docs/technical/000_decision_register.md`

## Implementation Steps

1. Refactor heuristic judge into a baseline report builder.
2. Add judge run summary types and optional metadata to `ScoreReport`.
3. Add custom system/context prompt support to provider requests.
4. Add LLM judge prompt and JSON parser.
5. Add `heuristic`, `llm`, and `ensemble` execution modes.
6. Add simple disagreement detection across judge reports.
7. Persist judge metadata in score reports.
8. Update docs.

## Verification

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm audit --audit-level=moderate`
- Manual `/api/judge` mock smoke through the UI.

## Risks

- LLM judge JSON can be malformed. The system must fall back to heuristic.
- Ensemble mode can increase cost quickly. It must remain opt-in.
- Judge run metadata is not a substitute for a real queue worker.

## Rollback

Set `SKAI_JUDGE_MODE=heuristic` or revert the judge pipeline to the previous synchronous heuristic function.
