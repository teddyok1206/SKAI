# 018 Strict Cold-Start Chat Context

Date: 2026-06-02

## Goal

Correct the user-facing model runtime contract:

- Do not show SKAI system/background prompts in the learner UI.
- Do not send SKAI system/background prompts to the live problem-solving model.
- Keep Markdown/LaTeX rendering.

## Product Rule

The model selected by the learner should behave like a real blank LLM conversation inside the chosen problem environment.

For `/api/chat`, the provider receives only:

- visible attempt trace messages selected by SKAI,
- user-attached problem materials or uploaded files,
- multimodal image parts when supported by the provider adapter.

The provider does not receive:

- hidden SKAI system prompts,
- problem statements unless the user typed or attached them,
- rubric text,
- starter context,
- material catalog unless a material is attached,
- branch metadata as natural language.

## Context Management

SKAI still controls context, but outside the live model prompt:

- breakpoint replay selects the child branch trace,
- branch creation clones or replaces visible trace events,
- pruning limits how many visible trace messages are sent,
- source trace ids and branch ids remain stored in SKAI's graph/index,
- judge and counterfactual flows can use separate internal prompts.

This preserves the 3-dimensional dual graph model without contaminating the live LLM's prompt.

## Implementation Steps

1. Remove context debug UI from assistant messages.
2. Remove `ContextDebugSnapshot` from runtime types.
3. Change the chat context compiler into a strict visible-trace pruner.
4. Stop returning `contextDebug` from `/api/chat`.
5. Stop passing `systemPrompt` and `contextMessage` from `/api/chat`.
6. Change provider adapters so system/context messages are included only when explicitly supplied.
7. Adjust the mock provider so first-turn chat replies use the latest user prompt, not hidden problem goals.
8. Update context compiler docs.
9. Verify typecheck, lint, build, and a direct `/api/chat` smoke request.

## Expected Smoke Result

For the prompt:

> 생성형 AI가 교육에 미치는 영향을 발표해야 하는데, 우선 수많은 분야들 중에서 이 발표에 적합한 분야를 추천해줄 수 있어?

Gemini should receive that prompt as the first active message, with no hidden SKAI background. If the user has attached files, only those attachments are added.

## Philosophy Check

This correction is important. SKAI teaches orchestration by controlling and studying the process around the model, not by secretly steering the model. Hidden task background would make scores and branch comparisons less meaningful because the learner would not be responsible for the same context the model used.
