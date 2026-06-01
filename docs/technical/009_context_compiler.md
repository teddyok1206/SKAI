# Context Compiler

Date: 2026-06-02

## Core Rule

AI API context is not storage.

SKAI's canonical state is the immutable attempt trace plus branch metadata. Every provider call should receive a freshly materialized context compiled from that state.

This means "delete" and "restore" are runtime compilation behaviors:

- Delete: do not include events outside the current attempt/branch path in the provider request.
- Restore: recompile the provider request from the selected attempt trace.

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
- context message,
- bounded provider messages,
- compile metadata.

The context message includes:

- problem statement,
- user goal,
- constraints,
- deliverables,
- starter context,
- material catalog,
- branch replay metadata,
- source trace lineage for copied/replacement events,
- explicit pruning notice if older messages were excluded.

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
