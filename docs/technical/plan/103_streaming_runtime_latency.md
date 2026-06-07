# 103 Streaming Runtime Latency

Date: 2026-06-08

## Purpose

실제 ChatGPT/Gemini 사용환경처럼 prompt 전송 후 응답이 시작되는 느낌을 빠르게 만든다.

SKAI의 핵심 제약:

- 빠른 척하기 위해 mock/fake assistant turn을 저장하지 않는다.
- streaming 중 partial response는 UI runtime buffer로만 보여주고, canonical trace에는 완료된 assistant event만 저장한다.
- graph는 trace backbone을 흔들지 않되, pending 상태를 사용자가 즉시 볼 수 있게 만든다.
- loading icon은 별도 장식이 아니라 SKAI 3-node directed mark의 packet-flow 언어를 재사용한다.

## Scope

1. Provider adapter에 optional streaming capability를 추가한다.
2. `/api/chat`은 `stream: true` 요청을 받으면 NDJSON streaming response를 반환한다.
3. OpenAI-compatible provider는 Chat Completions SSE stream을 NDJSON chunk로 변환한다.
4. Mock provider도 명시적으로 선택된 경우에만 streaming chunk를 제공한다.
5. Solver UI는 streaming partial response를 임시 assistant message로 렌더링하고, 완료 후 하나의 assistant trace event로 commit한다.
6. Runtime status를 `context_compiled -> waiting_first_token -> streaming_response -> trace_committed` 흐름으로 보여준다.
7. Prompt 전송 직후 pending assistant graph/message 상태를 보여준다.
8. Context compile cache metadata와 modelRun timing metadata(`requestStartedAt`, `firstTokenAt`, `completedAt`, `timeToFirstTokenMs`, `tokensPerSecond`)를 저장한다.
9. SKAI mark 기반 runtime loader를 만든다.

## Non-Scope

- Provider별 tool calling/image generation streaming.
- Queue worker.
- Token-level exact accounting for providers that do not return stream usage.
- Supabase schema migration for timing metadata. Local trace and published JSON snapshot can carry optional fields first.
- Fake prewritten assistant response.

## Affected Files

- `lib/providers/types.ts`
- `lib/providers/openai-compatible.ts`
- `lib/providers/mock.ts`
- `lib/providers/index.ts`
- `app/api/chat/route.ts`
- `lib/types.ts`
- `lib/context-compiler.ts`
- `components/problem-solver.tsx`
- `app/globals.css`
- `lib/i18n/copy-registry.json`
- `docs/000_orchestration.md`

## Data Model

`ModelRun` and `TraceEvent` gain optional timing fields:

- `requestStartedAt`
- `firstTokenAt`
- `completedAt`
- `timeToFirstTokenMs`
- `tokensPerSecond`

The server stream protocol uses newline-delimited JSON:

```json
{"type":"ready","modelRun":{...},"compiledContext":{...}}
{"type":"delta","delta":"..."}
{"type":"done","message":"...","modelRun":{...},"compiledContext":{...}}
{"type":"error","error":"..."}
```

Only `done` creates the assistant trace event.

## Implementation Steps

1. Extend provider types with `ProviderStreamEvent` and optional `stream()`.
2. Extract OpenAI-compatible message construction into a helper and implement SSE parsing.
3. Add mock streaming by splitting the deterministic mock response into small chunks.
4. Add `streamProviderRequest()` with explicit no-fallback behavior.
5. Add `stream` flag to `/api/chat`; keep JSON route for compatibility.
6. Add lightweight context compiler cache keyed by branch id + message/attachment shape.
7. Add solver streaming states: partial message, runtime status, first-token tracking.
8. Render SKAI runtime loader and partial assistant message.
9. Add copy keys for runtime statuses.
10. Update docs and run verification.

## Verification

- `conda run -n SKAI npm run typecheck`
- `conda run -n SKAI npm run lint`
- `conda run -n SKAI npm run verify:i18n`
- `conda run -n SKAI npm run build`

## Risks

- Some OpenAI-compatible providers may not return usage in streamed chunks. In that case cost remains unknown rather than fabricated.
- Client-side parsing must handle chunks split across arbitrary byte boundaries.
- Streaming errors after partial text must not be committed as an assistant trace.

## Rollback

- Keep `/api/chat` JSON path intact.
- If streaming breaks a provider, disable `stream: true` from the client while preserving the existing `complete()` flow.

## Philosophy Check

This slice improves perceived and actual responsiveness without turning SKAI into a fake-fast chatbot. It makes the runtime graph/process visible while preserving canonical trace integrity.

## Implementation Result

- Added `ProviderStreamEvent` and optional provider `stream()` capability.
- Added OpenAI-compatible Chat Completions SSE streaming and mock provider streaming.
- Added `streamProviderRequest()` with no automatic mock fallback.
- Added `/api/chat` NDJSON streaming path behind `stream: true`; existing JSON response path remains.
- Added context compiler cache metadata.
- Added optional model timing fields to `ModelRun` and `TraceEvent`.
- Updated solver chat flow to render partial assistant output from a runtime buffer and commit only completed assistant responses to trace.
- Added SKAI mark packet-flow runtime loader and runtime status pill.
- Added runtime copy registry entries.

## Verification Result

- `conda run -n SKAI npm run typecheck`: passed.
- `conda run -n SKAI npm run lint`: passed.
- `conda run -n SKAI npm run verify:i18n`: passed.
- `conda run -n SKAI npm run build`: passed.
- Local production smoke on `127.0.0.1:3014` with mock provider streaming returned `context`, `ready`, multiple `delta`, and `done` NDJSON events.
- Repeated smoke request returned `cacheHit: true`.
