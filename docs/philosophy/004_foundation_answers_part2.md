# Foundation Answers Part 2

Date: 2026-06-01

Source archive: `ARCHIVE_prompt_long/004.md`

## Score Meaning

SKAI should include a symbolic 100-point total score, but it should not become a game where maximizing the score is the main purpose.

The total score exists for:

- Fast comprehension.
- Comparison.
- Ritual and symbolic familiarity.

The detailed axis feedback is more important.

## Initial Score Axes

Use the previously proposed example axes first:

- Problem definition.
- Decomposition.
- Instruction clarity.
- Adaptation.
- Verification.
- Efficiency.
- Final quality.

These axes can be grouped into larger categories when needed:

- Framing: problem definition, decomposition, instruction clarity.
- Operation: adaptation, verification, efficiency.
- Outcome: final quality.

## Metrics By Mode

Token usage, elapsed time, turn count, and context switching should be reflected differently by mode.

For beginners, these concepts may be hidden or explained lightly.

For advanced, hiring, certification, or harness-engineering modes, these metrics can become explicit.

## Bottleneck Prompt

The definition of a bottleneck prompt is an important unresolved decision.

Initial candidates:

- A prompt that causes model drift.
- A prompt that misses a key constraint.
- A prompt that forces unnecessary context reload.
- A prompt that produces low-value output relative to token/time cost.
- A prompt after which the user has to repair direction, assumptions, or output format.

## Feedback Mode

Default feedback should be coach-like.

Strict rubric-style feedback should be used for modes such as:

- Applicant skill verification.
- Certification tests.
- Completion tests for education programs.

## Disputes And Regrading

Users should be able to dispute judge feedback.

Regrading should be possible, but the system must preserve:

- Original judge result.
- New judge result.
- Rubric version.
- Judge model version.
- User dispute reason.

## Branching Replay

Users should be able to restart from a specific point in the trace.

This is a core product idea because it lets users directly experience:

- Where the bottleneck happened.
- What would change if they had prompted differently.
- How an alternative strategy changes model behavior and final output.

This makes "what if I had done this here?" visible, not merely theoretical.

## Multi-Judge

LLM judge voting should be included as a product direction.

The first implementation can be simple, but judge disagreement should eventually be shown or stored.

## Shared Attempt View

The default shared view should reveal the strategy before the raw transcript:

1. Workflow: problem abstraction, structuring, task distribution.
2. Prompt summaries and contextual flow.
3. Expandable raw prompts and model responses.

Raw prompts and model responses should not be the first thing users see, but they should be accessible.

## Incentive To Share

Users who publish their prompt traces should gain access to other published prompt traces.

## Similarity And Certification

For modes where identity and authorship matter, such as certification, completion tests, or hiring-style assessment, prompt similarity should be checked against the database.

This is not primarily to block learning by imitation in community mode. It is to protect high-stakes verification modes.

## Community Interactions

SKAI should support community discussion around individual prompts.

A useful model is Slack-style threaded comments attached to a specific prompt or trace event.

## Community Goal

The community should be oriented around:

- Learning.
- Research.
- Portfolio building.

Competition can emerge naturally, but the product should not over-optimize for competitive behavior.

## First User Insight

The desired user realization is:

> 아, AI는 이렇게 쓰는 거구나. AI 성능이 안 좋은게 아니라 내가 쓰는 방법을 제대로 몰라서 이상한 소리를 해왔던 거구나.

The first demo succeeds when this appears in real user feedback.

## User Report

The report should analyze the user's AI habits and prompt history in detail, with friendly but specific coaching comments.

The report should focus on the highest-signal observations rather than overwhelming the user.

## Founder Analysis

For the first demo, preserve all logs so the founder can inspect and analyze them.

