# Context Compiler

Date: 2026-06-02

## Core Rule

AI API context is not storage.

SKAI's canonical state is the immutable attempt trace plus branch metadata. Every provider call should receive a freshly materialized context compiled from that state.

This means "delete" and "restore" are runtime compilation behaviors:

- Delete: do not include events outside the current attempt/branch path in the provider request.
- Restore: recompile the provider request from the selected attempt trace.

The underlying trace is not deleted or rewritten.

## Cold-Start Definition

Cold-start in SKAI means the provider should not rely on hidden provider-side memory, account personalization, or opaque threads.

It does not mean the model receives an empty prompt. SKAI intentionally materializes declared exercise context so that the model can solve the selected problem:

- problem statement,
- user goal,
- constraints,
- deliverables,
- starter context,
- material catalog,
- branch and lineage metadata.

The critical product rule is transparency: the user should be able to inspect the exact context SKAI added before the latest prompt.

## Why

Provider-native threads are convenient, but they are the wrong canonical state for SKAI because they make these tasks hard:

- branch replay,
- parent/child comparison,
- judge replay,
- public sharing,
- research export,
- provider switching,
- cold-start comparability.

SKAI should be able to reconstruct a provider request without relying on hidden provider memory.

## MVP Compiler

Current module:

- `lib/context-compiler.ts`

Inputs:

- problem,
- trace-like chat messages,
- optional branch metadata.

Outputs:

- system prompt,
- context message marked as `SKAI BACKGROUND CONTEXT`,
- bounded provider messages,
- compile metadata.
- debug snapshot for UI inspection.

The context message includes:

- an instruction that this is background, not the active user request,
- problem statement,
- user goal,
- constraints,
- deliverables,
- starter context,
- material catalog,
- branch replay metadata,
- source trace lineage for copied/replacement events,
- explicit pruning notice if older messages were excluded.

The provider message order is:

1. SKAI system prompt.
2. SKAI background context as a user-role message for broad provider compatibility.
3. Attempt trace messages, where the latest user message is the active instruction.

The adapter may append normalized attachment text to user trace messages and may pass image attachments as multimodal image parts.

## Branch Replay Semantics

In a branch attempt, the compiler receives only the child attempt trace. Parent trace events are not restored from provider memory.

Parent linkage appears as metadata:

- `branch.parentAttemptId`
- `branch.parentTraceEventId`
- `message.sourceTraceEventId`
- `message.branchId`

This lets the model know whether the current prompt is replacing a parent prompt or reacting to a copied parent response, while the provider only sees the current branch path.

## Complexity

- Compile time: `O(n + m)`.
- Message lookup: array pass only.
- Storage: no new provider context storage.
- Runtime memory: bounded by max provider messages and material catalog size.

Later, the compiler can add:

- graph-aware compression,
- checkpoint summaries,
- material node selection,
- provider-specific context packing,
- token-budget-aware pruning.
