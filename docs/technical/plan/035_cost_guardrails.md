# 035 Cost Guardrails

Date: 2026-06-02

## Goal

Make live model usage cost-visible at the attempt and turn level.

```text
provider usage tokens
-> model pricing table
-> estimated turn cost
-> attempt total cost
-> budget status in UI
```

## Scope

Included:

- Add a model pricing registry with source links and effective dates.
- Estimate turn cost from input/output token usage where pricing is known.
- Keep unknown pricing explicit instead of guessing.
- Attach `estimatedCostUsd` to live `ModelRun` records.
- Show attempt-level token/cost summary in the solver toolbar.
- Add a compact budget panel in the problem sidebar.
- Update orchestration docs.

Excluded:

- Provider billing API integration.
- Real KRW/USD exchange-rate refresh.
- User/project-level spend ledger.
- Rate limiting by monthly budget.
- Per-tenant accounting.

## Price Source Policy

- Prices are best-effort defaults, not billing guarantees.
- Official provider pages are preferred.
- If model pricing is ambiguous or missing, SKAI returns `unknown`.
- Environment-specific discounts, free tiers, prompt caching, batch mode, tool calls, and image token details are not modeled in this slice.

## Implementation Steps

1. Create `lib/model-pricing.ts`.
2. Add known prices for current demo model options:
   - `mock-orchestrator`
   - `gemini-2.5-flash-lite`
   - `llama-3.3-70b-versatile`
   - `grok-4-fast`
   - `gpt-4.1-nano`
3. Use the pricing helper in the OpenAI-compatible provider adapter.
4. Add attempt cost summary helpers in the solver.
5. Render visible cost/budget status in the toolbar and sidebar.
6. Update orchestration docs.
7. Verify typecheck, lint, build, and diff check.

## Done Criteria

- Live model responses store `estimatedCostUsd` when token usage and pricing are known.
- Unknown model pricing stays visibly unknown.
- Solver UI shows total tokens and estimated cost.
- Budget panel references founder budget guardrails:
  - monthly cap: KRW 200,000
  - per-event cap: KRW 100,000

## Risks

- Provider prices change frequently.
- Token usage may be absent for some provider-compatible APIs.
- xAI naming/pricing can drift; the code must keep `unknown` available.
- Estimated cost can create false precision if the UI does not label it as an estimate.

## Philosophy Check

Cost is not a side metric in SKAI. It is part of orchestration skill: a good AI operator must choose scope, model, context, and verification strategy while understanding cost. This slice makes that skill visible without making score-chasing the main product behavior.

## Implementation Result

Completed on 2026-06-02.

Implemented:

- Added `lib/model-pricing.ts`.
- Added demo pricing entries for:
  - `mock/mock-orchestrator`
  - `gemini/gemini-2.5-flash-lite`
  - `groq/llama-3.3-70b-versatile`
  - `xai/grok-4-fast`
  - `openai/gpt-4.1-nano`
- Added source labels, source URLs, effective dates, and pricing notes.
- OpenAI-compatible provider adapter now estimates `ModelRun.estimatedCostUsd` when:
  - provider returns input/output token usage,
  - the selected provider/model has known pricing.
- Solver toolbar now shows total events, tokens, and estimated cost.
- Problem sidebar now shows:
  - attempt estimate in USD,
  - rough KRW estimate,
  - token count,
  - unknown-cost event count,
  - KRW 100,000 event cap,
  - KRW 200,000 monthly cap.
- Added `NEXT_PUBLIC_SKAI_KRW_PER_USD_ESTIMATE` support through `budgetGuardrails.krwPerUsdEstimate`.

Verification:

- `conda run -n SKAI npm run typecheck`
- `conda run -n SKAI npm run lint`
- `conda run -n SKAI npm run build`
- `git diff --check`

Remaining:

- This is not a billing ledger.
- Official prices can change and must be checked before paid demos.
- Free tier, prompt cache, batch mode, image/audio/tool-specific pricing, and provider passthrough fees are not modeled.
- Unknown pricing is not persisted as a separate field yet; it is inferred from usage tokens without `estimatedCostUsd`.
- Future production hardening should add per-user/provider spend records and rate limits.

Post-task philosophy check:

- The implementation reinforces SKAI's claim that AI orchestration includes cost-aware model/context selection.
- Cost is shown as operational context, not as the primary score target.
- Unknown pricing is surfaced instead of guessed, which is important for trust.
