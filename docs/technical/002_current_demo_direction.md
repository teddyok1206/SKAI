# Current Demo Direction

Date: 2026-06-01

This document converts the initial answer set into technical direction. It is not a full architecture yet.

## Accepted For First Demo

- Build an in-app AI conversation flow.
- Target fewer than 10 simultaneous users on personal laptops.
- Use a backend.
- Include login if it does not slow down the demo significantly.
- Use founder-provided model/API credentials at first.
- Store full prompt traces.
- Show both total score and multi-axis score.
- Include prompt sharing.
- Make the shared view show prompt structure and flow first, with raw prompts and model responses expandable.

## Still Open

- Exact first problem.
- Exact model provider.
- Whether "grok" means xAI Grok, Groq, or generally low-cost inference.
- Whether the first backend should use Next.js API routes, a separate Node server, or another stack.
- Whether auth should be GitHub login, Google login, magic link, or simple invite-code identity.
- Whether a database free tier should be Supabase, Neon, Turso, Firebase, or another option.
- Whether judge execution should be synchronous or job-based.

## Codex/Agent Backend Note

The founder wants a backend that uses Codex like a multi-threaded agent if possible.

Practical distinction:

- Using this live Codex session or ChatGPT subscription quota directly as a production backend is not a stable product architecture.
- Building an agent loop with API models, OpenAI Agents/Responses-style tooling, or provider APIs is the product direction to investigate.
- A local Codex CLI wrapper may be useful for experiments, but it introduces deployment, security, concurrency, observability, and billing-control issues.

Initial recommendation:

- Treat "Codex-backed multi-agent judging" as a research spike, not the default demo path.
- First implement a normal backend judge pipeline with one cheap model provider and a clean trace schema.
- Later add multiple judge workers or model providers once the end-to-end loop is proven.

## Minimum Backend Responsibilities

1. User/session identity.
2. Problem loading.
3. Conversation turn storage.
4. Model call proxying.
5. Attempt submission.
6. Judge execution.
7. Score/result storage.
8. Public share view generation.

## Minimum Data Entities

- `User`
- `Problem`
- `Attempt`
- `TraceEvent`
- `ModelRun`
- `JudgeRun`
- `ScoreReport`
- `PublishedAttempt`

## First UI Flow

1. User logs in or enters a temporary identity.
2. User opens one SKAI problem.
3. User chats with an AI model inside SKAI.
4. SKAI stores every turn.
5. User marks a final answer or submits the attempt.
6. Judge evaluates the full trace and final answer.
7. User sees total score, axis scores, bottlenecks, good moves, and next improvement targets.
8. User can publish the attempt.
9. Other users see the structural flow first and can expand raw prompts/model responses.

## Immediate Technical Risks

- Model cost can grow quickly if every turn and judge call is paid by the founder.
- Full trace storage requires privacy warnings from the start.
- Prompt sharing needs a publish step, not automatic exposure.
- Judge prompt injection must be considered even in the demo.
- If login is added, auth implementation should stay simple and not consume the core demo budget.

## References To Verify Before Implementation

- OpenAI Agents guide: https://platform.openai.com/docs/guides/agents
- OpenAI code generation/Codex guide: https://platform.openai.com/docs/guides/code-generation
- OpenAI Codex CLI help: https://help.openai.com/en/articles/11096431
- OpenAI shell tool guide: https://platform.openai.com/docs/guides/tools-shell

