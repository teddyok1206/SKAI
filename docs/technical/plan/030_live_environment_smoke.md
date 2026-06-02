# 030 Live Environment Smoke

Date: 2026-06-02

## Goal

Make live provider testing repeatable before demo seminars.

```text
running local SKAI server
-> smoke runner calls /api/chat
-> detect live success vs mock fallback
-> write provider/model/latency/token/failure notes
```

## Scope

Included:

- Add a local live smoke runner.
- Select provider automatically from available local env keys, or explicitly through CLI flags.
- Use `docs/problem_playbooks/` Turn 1 prompt as the smoke input.
- Call the real SKAI `/api/chat` route rather than bypassing the app.
- Detect mock fallback and treat it as non-live success.
- Write timestamped JSON and Markdown smoke reports.
- Add an npm script for repeatable execution.

Excluded:

- Full golden attempt generation.
- Multi-turn live conversations.
- Judge calibration.
- Provider price calculation.
- Deployment smoke outside the local machine.

## Implementation Steps

1. Add `scripts/live_provider_smoke.mjs`.
2. Add `npm run smoke:live`.
3. Create `docs/technical/live_smoke/` as the report location.
4. Run against `http://127.0.0.1:3000`.
5. Record whether the selected provider returned live output or fell back to mock.
6. Update orchestration docs with the runner and latest smoke result.
7. Verify typecheck, lint, build, and diff check.

## Done Criteria

- One command can run a live provider smoke:

```bash
conda run -n SKAI npm run smoke:live
```

- The report clearly says `live_success`, `fallback_mock`, or `failed`.
- The report includes no API keys or secrets.

## Risks

- If the dev server was started before `.env.local` changed, the runner can see env keys while the server cannot. The report must make mock fallback visible.
- Provider errors are external and may be transient.
- A single-turn smoke proves connectivity, not model quality.

## Philosophy Check

This slice keeps demo validation grounded in SKAI's actual app path. The smoke should test the same cold-start user model route that learners experience, not a separate hidden provider harness.

## Implementation Result

Completed on 2026-06-02.

Implemented:

- Added `scripts/live_provider_smoke.mjs`.
- Added `npm run smoke:live`.
- Added timestamped reports under `docs/technical/live_smoke/`.
- Auto-selects the first configured provider from:
  - Gemini,
  - Groq,
  - xAI,
  - OpenRouter,
  - OpenAI.
- Reads Turn 1 from `docs/problem_playbooks/ambiguous-research-brief.md`.
- Calls the real local SKAI `/api/chat` route.
- Detects:
  - `live_success`,
  - `mock_success`,
  - `fallback_mock`,
  - `provider_mismatch`,
  - `failed`.
- Keeps API key values out of logs.

Smoke result:

- status: `live_success`
- provider/model: `gemini` / `gemini-2.5-flash-lite`
- problem: `ambiguous-research-brief`
- latency: `8843ms`
- usage: `243` input tokens, `1524` output tokens
- report:
  - `docs/technical/live_smoke/2026-06-02T05-45-09-065Z_gemini_ambiguous-research-brief.md`
  - `docs/technical/live_smoke/2026-06-02T05-45-09-065Z_gemini_ambiguous-research-brief.json`

Verification:

- `conda run -n SKAI npm run smoke:live`
- `conda run -n SKAI npm run typecheck`
- `conda run -n SKAI npm run lint`
- `conda run -n SKAI npm run build`
- `git diff --check`

Operational note:

- In this Codex sandbox, Node `fetch` to localhost can fail with `EPERM`. The smoke runner may need the already-approved escalated command prefix:

```bash
conda run -n SKAI npm run smoke:live
```
