# 001 Next.js Supabase Demo MVP

Date: 2026-06-01

## Goal

Build the first runnable SKAI demo as a Next.js full-stack app that demonstrates the core loop:

1. User selects a problem.
2. User chats with an AI inside SKAI.
3. SKAI captures the full trace.
4. User submits an attempt.
5. SKAI generates a coach-style judge report with total and axis scores.
6. User can publish/share the attempt in a strategy-first view.
7. Users can see per-problem comparison data.

## Scope

This plan implements a local/deployable MVP shell, not the final production system.

Included:

- Next.js App Router scaffold.
- Supabase-ready auth/data structure.
- Google-login-ready Supabase client wiring.
- Local demo fallback when Supabase/model keys are missing.
- Seed problem catalog.
- In-app chat UI.
- Trace event schema.
- Provider adapter interface.
- Mock provider for zero-key demos.
- OpenAI-compatible provider adapter stub for Groq/xAI/OpenRouter-style APIs.
- Synchronous judge endpoint.
- Coach-style score report.
- Strategy-first published attempt view.
- Basic per-problem leaderboard/comparison using local demo storage.
- Admin problem-authoring placeholder.
- Cost guardrail constants.

Excluded or stubbed:

- Full Supabase persistence in every flow.
- Production-grade queue worker.
- Robust prompt similarity detection.
- Certification anti-cheat.
- Full multi-provider matrix.
- Full Slack-like comment threading.
- True branch replay from arbitrary trace points.

## Assumptions

- The repo root will become the Next.js app root while preserving `docs/` and `ARCHIVE_prompt_long/`.
- Commands run through `conda run -n SKAI ...`.
- The first demo must run without paid model keys, so mock mode is required.
- Real provider calls should be enabled by environment variables, not hard-coded.
- API keys must never be committed.
- Supabase env vars may be absent during local development.

## Affected Files And Modules

- `package.json`
- `package-lock.json`
- `next.config.mjs`
- `tsconfig.json`
- `app/`
- `components/`
- `lib/`
- `data/`
- `supabase/migrations/`
- `.env.example`
- `.gitignore`

## Data Model

Initial entities:

- `User`
- `Problem`
- `Attempt`
- `TraceEvent`
- `ModelRun`
- `JudgeRun`
- `ScoreReport`
- `PublishedAttempt`
- `PromptComment`
- `LeaderboardEntry`

The app will define TypeScript types first and include a Supabase SQL migration draft.

## API Design

Initial endpoints:

- `POST /api/chat`
  - Input: problem, messages, provider, model.
  - Output: assistant message, model run metadata.
- `POST /api/judge`
  - Input: problem, trace, final answer, mode.
  - Output: score report.

## Implementation Steps

1. Add Next.js/React/TypeScript dependencies.
2. Add app configuration files.
3. Add global CSS and layout.
4. Define SKAI domain types.
5. Add seed problems.
6. Add provider adapter interface.
7. Add mock provider.
8. Add OpenAI-compatible provider adapter.
9. Add judge logic and scoring schema.
10. Add API routes.
11. Build main problem list page.
12. Build solve page with chat, trace capture, submission, report, publish action.
13. Build share page with workflow-first attempt view.
14. Build leaderboard page or section.
15. Build admin placeholder page.
16. Add Supabase client helpers and migration.
17. Add `.env.example`.
18. Run lint/build.
19. Start dev server.
20. Commit implementation.

## Verification Steps

- `conda run -n SKAI npm install`
- `conda run -n SKAI npm run lint`
- `conda run -n SKAI npm run build`
- `conda run -n SKAI npm run dev`
- Open the local app.
- Complete a mock attempt.
- Submit and receive score report.
- Publish attempt and view share page.

## Risks

- Full Supabase integration may require project credentials not available in this environment.
- Real model provider testing requires API keys and provider spend limits.
- Next.js build may expose client/server boundary mistakes.
- Local-storage demo data is not production persistence.

## Rollback Notes

- The implementation is additive.
- If the scaffold fails, remove app/package files and keep docs/archives intact.
- Do not remove committed project docs.

## Open Questions

- Which real provider should be enabled first: Groq, xAI Grok, OpenRouter, Gemini, or OpenAI?
- What is the first canonical seed problem?
- How strict should the first budget limits be per attempt?
- Should demo mode require login or allow a local anonymous session?

## Implementation Status

Status: implemented as first local MVP shell.

Completed:

- Next.js App Router scaffold.
- Domain types and seed problem catalog.
- Mock provider.
- OpenAI-compatible provider adapter.
- Chat API.
- Judge API.
- Heuristic coach judge.
- Problem list page.
- Solve page with trace capture.
- Branch-from-trace-point action.
- Final answer submission.
- Score report.
- Publish action.
- Strategy-first share page.
- Local per-problem leaderboard.
- Admin placeholder.
- Supabase migration draft.
- `.env.example`.

Verification completed:

- `conda run -n SKAI npm audit --audit-level=moderate`
- `conda run -n SKAI npm run typecheck`
- `conda run -n SKAI npm run lint`
- `conda run -n SKAI npm run build`
- `curl -I http://localhost:3000`
- `POST /api/chat` mock smoke
- `POST /api/judge` mock smoke

Known limitations:

- Supabase persistence is schema-ready but not wired into every client flow.
- Google login is planned through Supabase but not yet exposed in UI.
- Shared attempts use local storage, so links are local-browser only until DB persistence is wired.
- Real provider calls require API keys and provider spend limits.
- Node 22 was not available from the default Anaconda channel; the `SKAI` env currently uses Node 20.17.0. Runtime verification passes, but npm may warn that some lint packages prefer Node 20.19+.
