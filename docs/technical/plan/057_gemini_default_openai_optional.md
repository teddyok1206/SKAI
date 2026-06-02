# 057 Gemini Default OpenAI Optional

## Goal

Keep Gemini Flash-Lite as the default solving model everywhere, while keeping OpenAI `gpt-4.1-nano` available as an optional low-cost provider.

## Scope

- Set ignored local and Vercel-import defaults back to Gemini.
- Set the problem solver's pre-attempt default model option back to Gemini.
- Set shared model option fallback and raw `/api/chat` request fallback to Gemini.
- Keep OpenAI API key/model env entries available.
- Update docs that previously described OpenAI as the default.
- Do not remove OpenAI pricing/model option/provider support.

## Assumptions

- The user wants "default" to mean both environment defaults and the visible model selected when starting an attempt.
- OpenAI should remain selectable after the key is configured.
- Vercel still needs manual Environment Variable updates for OpenAI keys.

## Affected Files

- `.env.local` ignored
- `.env.vercel.import` ignored
- `app/api/chat/route.ts`
- `components/problem-solver.tsx`
- `lib/model-options.ts`
- `.env.example`
- `README.md`
- `docs/000_orchestration.md`
- `docs/technical/014_vercel_first_deployment_guide.md`
- `docs/technical/plan/056_openai_nano_provider_baseline.md`

## Verification

- Confirm ignored env files have `SKAI_DEFAULT_PROVIDER=gemini`.
- Confirm UI, model option fallback, and raw `/api/chat` fallback default to Gemini.
- Run `git diff --check`.
- Run `conda run -n SKAI npm run typecheck`.
- Run `conda run -n SKAI npm run lint`.
- Run `conda run -n SKAI npm run build`.

## Implementation Result

- Restored ignored `.env.local` and `.env.vercel.import` defaults to `SKAI_DEFAULT_PROVIDER=gemini` and `SKAI_DEFAULT_MODEL=gemini-2.5-flash-lite`.
- Restored the problem solver's pre-attempt model selection to Gemini Flash-Lite.
- Added a shared `defaultModelOptionId`/`getDefaultModelOption()` path so invalid or missing model option lookups fall back to Gemini, not mock.
- Changed raw `/api/chat` schema defaults to `provider=gemini` and `model=gemini-2.5-flash-lite`.
- Kept OpenAI `gpt-4.1-nano` as an optional selectable provider, with pricing and provider fallback still configured.
- Updated README, Vercel guide, orchestration, decision register, and the previous OpenAI baseline plan to describe OpenAI as optional rather than global default.

## Verification Result

- Ignored `.env.local` and `.env.vercel.import` default lines confirmed as `SKAI_DEFAULT_PROVIDER=gemini` and `SKAI_DEFAULT_MODEL=gemini-2.5-flash-lite` without printing secrets.
- UI default, model option fallback, new attempt fallback, and raw `/api/chat` fallback now default to Gemini Flash-Lite.
- `git diff --check`: passed.
- `conda run -n SKAI npm run typecheck`: passed.
- `conda run -n SKAI npm run lint`: passed.
- `conda run -n SKAI npm run build`: passed.

## Philosophy Check

This preserves model/mode independence: Gemini is the demo default engine, OpenAI is an optional engine, and neither is tied to a solving mode.
