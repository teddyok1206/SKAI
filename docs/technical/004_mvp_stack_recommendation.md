# MVP Stack Baseline

Date: 2026-06-01

Source archive: `ARCHIVE_prompt_long/004.md`

## Accepted Baseline

Use this as the first implementation stack:

- App: Next.js full-stack app.
- Hosting: Vercel for the web app and API routes.
- Database/Auth: Supabase.
- Auth start: Google login.
- Auth later: email/password, GitHub login, and account linking.
- Model access: provider adapter architecture.
- First live providers: one cheap/fast provider plus one higher-quality judge fallback. The exact first provider will be fixed after an API spike.
- Judge execution: synchronous initially, with persisted `judge_runs` so queueing can be added later.

## Why Supabase For DB/Auth

Supabase is the best first recommendation for SKAI because the MVP needs:

- Postgres-style relational data for attempts, trace events, judge runs, score reports, comments, and published attempts.
- Auth with Google login.
- Row-level security later.
- A dashboard that is useful during founder analysis.
- Fast integration with Next.js.

Neon is strong for serverless Postgres, but it does not solve auth by itself.

Firebase is strong for quick apps, but SKAI's trace, scoring, sharing, comment, and similarity data fits relational tables better than a document-first model.

Turso is attractive for cheap SQLite-style distribution, but auth and product dashboard needs make it less convenient for this MVP.

## Why Next.js

Next.js fits the first product because it can keep:

- Problem pages.
- Chat UI.
- Auth-protected pages.
- API routes.
- Judge submission endpoints.
- Share pages.

inside one repo and one deployment path.

## Model Provider Strategy

The founder wants to support all major model providers. The implementation should support this through an adapter layer, not by hard-coding provider-specific behavior into product logic.

Provider families to plan for:

- OpenAI.
- Google Gemini.
- xAI Grok.
- Groq.
- OpenRouter.
- Anthropic later if budget allows.
- Hugging Face Inference later.
- Local/Ollama later for experiments.

Important distinction:

- Grok means xAI's Grok API.
- Groq means GroqCloud inference.

Both should be treated as separate providers.

## First Provider Strategy

For early testing:

1. Use Groq or xAI Grok for cheap/fast user conversations if quality is acceptable.
2. Use a stronger model for judge fallback only when necessary.
3. Keep OpenAI-compatible client abstractions where possible because Groq and xAI expose OpenAI-compatible API patterns.
4. Consider OpenRouter only as an optional routing layer, not as the only integration path, because direct provider integrations give cleaner usage/cost tracking.

## Judge Model Separation

Conversation model and judge model should be separate.

Reasons:

- The model that is fun and cheap for users may not be stable enough for evaluation.
- The judge needs structured output reliability.
- Judge cost must be independently controlled.
- Provider comparison becomes easier when judge behavior is decoupled.

## Synchronous First, Queue-Ready Later

Judge runs should execute synchronously in the first MVP.

However, the database should include a `judge_runs` table with statuses:

- `pending`
- `running`
- `succeeded`
- `failed`
- `cancelled`

This allows queue migration later without changing the product model.

## Per-Problem Leaderboard

Each problem should have its own leaderboard.

The leaderboard should be secondary to learning and portfolio value, but it is still needed for the Baekjoon-like shape of the product.

## Admin Problem Authoring

An admin problem authoring surface is needed.

MVP version can be simple:

- Create/edit problem.
- Define visible rubric.
- Define goal profile.
- Define allowed models.
- Define starter materials.
- Preview problem.
- Publish/unpublish problem.

Enterprise/HR-style customers will eventually need problem authoring, so the data model should support it from the beginning.

## Budget Guardrails

Current budget:

- Monthly cap: KRW 200,000.
- Single demo/event cap: KRW 100,000.

Implementation guardrails:

- Hard per-user attempt cap during demo.
- Hard per-attempt token cap.
- Separate cap for judge calls.
- Disable expensive models by default.
- Log estimated cost per model run.
- Add provider spend limits where available.
- Store `usage_input_tokens`, `usage_output_tokens`, `estimated_cost_usd`, and `provider_request_id` when available.

## What Can Fail In First Demo

Accepted technically acceptable rough edges:

- Polished admin authoring UI.
- Queue-based judge worker.
- Robust prompt similarity detection.
- Certification-grade anti-cheat.
- Multi-provider support for every model on day one.
- Perfect counterfactual replay.
- Full comment threading.
- High-scale leaderboard.
- Enterprise-grade privacy controls.

## What Must Not Fail In First Demo

Accepted non-negotiables:

- In-app AI conversation.
- Full trace capture.
- Attempt submission.
- Judge feedback.
- Coach-style report.
- Strategy-first shared attempt view.
- Basic per-problem comparison.
- API key safety.
- Cost guardrails.
- The core realization that better AI use comes from better problem framing, decomposition, prompting, and verification.

## Official References Checked

- Supabase pricing: https://supabase.com/pricing
- Supabase Next.js Auth quickstart: https://supabase.com/docs/guides/auth/quickstarts/nextjs
- Supabase Google login: https://supabase.com/docs/guides/auth/social-login/auth-google
- Vercel pricing: https://vercel.com/pricing
- Vercel Hobby plan: https://vercel.com/docs/accounts/plans/hobby
- Groq pricing: https://groq.com/pricing
- Groq OpenAI-compatible API docs: https://console.groq.com/docs
- Groq spend limits: https://console.groq.com/docs/spend-limits
- xAI API introduction: https://docs.x.ai/docs/introduction
- xAI model pricing docs: https://docs.x.ai/docs/models/grok-4-fast
- xAI rate limits: https://docs.x.ai/developers/rate-limits
- Gemini API pricing: https://ai.google.dev/gemini-api/docs/pricing
- Gemini API billing: https://ai.google.dev/gemini-api/docs/billing
- OpenAI API pricing: https://platform.openai.com/docs/pricing
- OpenAI rate limits: https://platform.openai.com/docs/guides/rate-limits/usage-tiers
- OpenRouter pricing: https://openrouter.ai/pricing
