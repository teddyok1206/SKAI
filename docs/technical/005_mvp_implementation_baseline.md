# MVP Implementation Baseline

Date: 2026-06-01

This is the current implementation baseline for the first SKAI demo.

## Stack

- Next.js full-stack app.
- Vercel deployment.
- Supabase Postgres.
- Supabase Auth with Google login first.
- Provider adapter layer for model APIs.
- Synchronous judge execution first.
- Queue-ready `judge_runs` model from the beginning.

## Model Strategy

SKAI should support many providers over time, but the MVP should not integrate every provider before the core loop works.

Accepted provider direction:

- Conversation model and judge model are separate.
- Users can choose models.
- Provider logic goes behind adapters.
- xAI Grok and GroqCloud are separate providers.
- First live provider should be cheap and fast.
- A stronger judge fallback can be used only when needed.
- Exact first provider is decided after a small API spike that checks price, latency, structured output reliability, and rate limits.

## First Demo Must Preserve

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

## First Demo Can Be Rough

- Admin authoring UI can be minimal.
- Queue worker can wait.
- Prompt similarity detection can be basic or stubbed.
- Certification-grade anti-cheat can wait.
- Multi-provider support can start with one or two providers.
- Counterfactual replay can begin as judge explanation before full replay.
- Comment threads can be minimal.
- Cross-attempt comparison can be basic, but should not be a score-sorted learner leaderboard.
- Enterprise-grade privacy controls can wait, while publish boundaries and warnings must exist.

## Build Order

1. Scaffold Next.js app.
2. Add Supabase project config and local env template.
3. Implement Google login.
4. Define DB schema for users, problems, attempts, trace events, model runs, judge runs, score reports, published attempts, comments, and structural comparison metadata.
5. Build one seed problem.
6. Build in-app chat with trace capture.
7. Add provider adapter interface and one live provider.
8. Add attempt submission.
9. Add synchronous judge endpoint.
10. Add coach-style report.
11. Add strategy-first shared attempt view.
12. Add local attempt history and shared trace comparison.
13. Add admin problem authoring MVP.
14. Add budget guardrails and founder log review view.
