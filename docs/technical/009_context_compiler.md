# Context Compiler

Date: 2026-06-02

## Core Rule

AI API context is not storage.

SKAI's canonical state is the immutable attempt trace plus branch metadata. Every provider call should receive a freshly materialized context compiled from that state.

For live user chat, "compiled context" means selected visible trace messages only. SKAI does not add hidden system prompts or hidden problem background to the learner's model call.

## Live Chat Contract

`/api/chat` sends the provider only:

- visible user and assistant messages from the current attempt or branch path,
- files/materials the user explicitly attached to those messages,
- image parts for attached images when the provider adapter supports multimodal input.

`/api/chat` does not send:

- SKAI system prompt,
- problem statement,
- starter context,
- rubric,
- material catalog unless the user attached that material,
- branch metadata as natural-language prompt text.

This makes Gemini/Groq/xAI behave like a real cold-start LLM conversation from the user's perspective.

## Context Management

SKAI still manages context outside the live model prompt:

- Delete: do not include events outside the current attempt/branch path in the provider request.
- Restore: recompile the provider request from the selected attempt trace.
- Breakpoint replay: create a child trace that represents the branch path, then send that child trace.
- Pruning: send only the newest bounded visible trace messages.

The underlying trace is not deleted or rewritten.

## Why

Provider-native threads are convenient, but they are the wrong canonical state for SKAI because they make these tasks hard:

- branch replay,
- parent/child comparison,
- judge replay,
- public sharing,
- research export,
- provider switching,
- cold-start comparability.

SKAI should be able to reconstruct a provider request without relying on hidden provider memory, while also avoiding hidden SKAI steering in the learner's live model call.

## MVP Compiler

Current module:

- `lib/context-compiler.ts`

Inputs:

- visible trace-like chat messages,
- optional branch metadata for SKAI-side compile metadata.

Outputs:

- bounded provider messages,
- compile metadata.

The metadata includes:

- materialized timestamp,
- source message count,
- provider message count,
- omitted message count,
- branch ids for SKAI-side debugging and analytics.

## Internal Judge Exception

Judge and counterfactual judge flows are not the learner's live model conversation. They may still use explicit system/context prompts because their job is to evaluate an attempt against a rubric.

This exception must not leak into `/api/chat`.

## Branch Replay Semantics

In a branch attempt, the compiler receives only the child attempt trace. Parent trace events are not restored from provider memory.

Parent linkage remains in SKAI storage:

- `branch.parentAttemptId`
- `branch.parentTraceEventId`
- `message.sourceTraceEventId`
- `message.branchId`

The live provider does not need this metadata unless it appears in visible user text.

## Complexity

- Compile time: `O(n)`.
- Message lookup: array slice only.
- Storage: no new provider context storage.
- Runtime memory: bounded by max provider messages and attached material size.

Later, the compiler can add:

- graph-aware compression of visible prior turns,
- checkpoint summaries generated from visible trace,
- material node selection controlled by user attachment,
- provider-specific token-budget packing.
