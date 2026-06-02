# 056 OpenAI Nano Provider Baseline

## Goal

Attach the provided OpenAI Platform API key to SKAI's local and Vercel-import environment files, and make OpenAI's low-cost `gpt-4.1-nano` the OpenAI baseline in code, pricing, and docs.

## Scope

- Store the OpenAI API key only in ignored env files.
- Set local/default provider to OpenAI `gpt-4.1-nano`.
- Update OpenAI model option, provider defaults, judge defaults, and pricing registry.
- Update deployment and operational docs.
- Do not commit secrets.

## Source Check

Official OpenAI pages checked on 2026-06-03:

- `https://platform.openai.com/docs/models/gpt-4.1-nano`
- `https://platform.openai.com/docs/pricing/`

OpenAI's pricing page lists `gpt-5-nano` as cheaper than `gpt-4.1-nano`, but SKAI's current adapter is Chat Completions-compatible. `gpt-4.1-nano` is confirmed to support Chat Completions and is the safer low-cost baseline for this slice.

## Affected Files

- `.env.local` ignored
- `.env.vercel.import` ignored
- `lib/providers/index.ts`
- `lib/model-options.ts`
- `lib/model-pricing.ts`
- `lib/judge.ts`
- `lib/counterfactual-judge.ts`
- `.env.example`
- `README.md`
- `docs/000_orchestration.md`
- `docs/technical/000_decision_register.md`
- `docs/technical/014_vercel_first_deployment_guide.md`
- `docs/design/002_font_and_provider_surfaces.md`
- `docs/technical/plan/035_cost_guardrails.md`

## Implementation Steps

1. Add OpenAI env values to ignored env files without printing secrets.
2. Make OpenAI default model fallback `gpt-4.1-nano`.
3. Update the visible model selector option.
4. Update pricing registry with official OpenAI token prices.
5. Update docs and decision register.
6. Run verification.

## Verification

- Confirm ignored env files contain OpenAI keys by key name only.
- Run `git diff --check`.
- Run `conda run -n SKAI npm run typecheck`.
- Run `conda run -n SKAI npm run lint`.
- Run `conda run -n SKAI npm run build`.
- Run direct OpenAI API smoke with `gpt-4.1-nano`.
- Run local SKAI `/api/chat` smoke with provider `openai` and model `gpt-4.1-nano`.

## Implementation Result

- Added OpenAI env values to ignored `.env.local` and `.env.vercel.import`.
- Set ignored local/Vercel-import defaults to `SKAI_DEFAULT_PROVIDER=openai` and `SKAI_DEFAULT_MODEL=gpt-4.1-nano`.
- Updated OpenAI provider default, model selector option, judge defaults, counterfactual judge defaults, and pricing registry to `gpt-4.1-nano`.
- Made OpenAI GPT-4.1 Nano the default pre-attempt model option while keeping SKAI Mock selectable.
- Updated README, Vercel deployment guide, decision register, orchestration, and design/technical notes.

## Verification Result

- Ignored env files contain OpenAI key names and OpenAI nano defaults.
- Direct OpenAI API smoke: succeeded with `SKAI_OPENAI_OK`.
- Local SKAI `/api/chat` smoke: succeeded with `SKAI_ROUTE_OPENAI_OK`, provider `openai`, model `gpt-4.1-nano`, token usage, and estimated cost.
- `git diff --check`: passed.
- `conda run -n SKAI npm run typecheck`: passed.
- `conda run -n SKAI npm run lint`: passed.
- `conda run -n SKAI npm run build`: passed.

## Risks

- The provided key appeared in conversation and terminal echo during setup. Use it for immediate wiring, but rotate the OpenAI key before broader external use if secrecy matters.
- Vercel is not updated until `.env.vercel.import` is imported into Vercel or the equivalent values are manually added there.
- `gpt-5-nano` may be a future cheaper baseline once SKAI migrates from Chat Completions compatibility to Responses API.

## Philosophy Check

OpenAI is an execution engine, not a mode. This slice adds a cheap baseline model while preserving SKAI's separation between model choice and solving mode.
