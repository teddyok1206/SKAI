# 017 Markdown Rendering Context Transparency

Date: 2026-06-02

Status: Superseded by `018_strict_cold_start_chat_context.md` for the live chat runtime. Markdown/LaTeX rendering remains valid, but user-facing context debug and hidden SKAI background injection were rejected as product behavior.

## Goal

Fix two smoke-test issues found in a live problem attempt:

- Render model output as Markdown and LaTeX instead of raw text.
- Make the provider request context transparent enough to explain exactly what SKAI sends before and after the user's prompt.

## Current Diagnosis

The chat route currently compiles provider context in this order:

1. `systemPrompt`: SKAI assistant behavior and orchestration rules.
2. `contextMessage`: problem statement, user goal, constraints, deliverables, starter context, material catalog, branch metadata, trace lineage, pruning notice.
3. `messages`: the actual attempt trace, including the latest user prompt.

The provider adapter sends `contextMessage` as a `user` role message before the real user prompt. This preserves cold-start behavior relative to provider-side memory, but it is not a blank prompt. In the research brief problem, the injected problem statement mentions a friend's broad education-AI presentation request, so Gemini reasonably followed that background as if it were the active task.

## Product Rule

Cold-start in SKAI means:

- no provider-side hidden memory,
- no previous account personalization,
- no undeclared context,
- every provider request is rebuilt from SKAI's stored trace.

It does not mean:

- no problem context,
- no rubric context,
- no material catalog,
- no branch replay metadata.

Therefore, SKAI must show the materialized context clearly and mark it as background, not as the latest user instruction.

## Scope

Included:

- Add a Markdown renderer component with GitHub-flavored Markdown and math support.
- Import KaTeX styles globally.
- Render chat messages and public raw transcript content through the renderer.
- Add a typed provider context debug snapshot.
- Return the context debug snapshot from `/api/chat`.
- Attach the snapshot to the assistant trace event locally.
- Show a collapsible "Context sent to provider" section on assistant messages.
- Adjust the compiler wording so SKAI context is explicitly background and the latest user prompt is the active instruction.
- Update context compiler docs with the cold-start definition.

Excluded:

- Full provider payload capture including API keys or headers.
- Public sharing of internal debug context.
- Provider-specific token packing optimization.
- Replacing the `contextMessage` design with a separate provider-native developer message, because not every target provider supports that abstraction consistently.

## Implementation Steps

1. Install `react-markdown`, `remark-gfm`, `remark-math`, `rehype-katex`, and `katex`.
2. Add `components/markdown-content.tsx`.
3. Add `ContextDebugSnapshot` domain type.
4. Extend `compileProviderContext` to return `debugSnapshot`.
5. Update `/api/chat` response shape to include `contextDebug`.
6. Store `contextDebug` on the assistant `TraceEvent` created by the solve UI.
7. Render message content with `MarkdownContent`.
8. Add compact debug UI and CSS.
9. Update docs.
10. Run typecheck, lint, and build.

## Risk Controls

- Do not enable raw HTML rendering in Markdown.
- Do not expose API keys, Authorization headers, or `.env.local` values.
- Keep public publish snapshots free of context debug data.
- Keep the debug snapshot bounded to text already sent to the provider.

## Expected Smoke Result

For the observed Gemini turn, the user should be able to open the assistant message's context panel and see:

- the SKAI system prompt,
- the SKAI background context containing the research brief problem,
- the actual latest user prompt after that background context.

The response should render headings, lists, code, tables, and inline/block math without showing raw Markdown syntax.

## Philosophy Check

This change supports SKAI's core claim: AI skill is not merely prompt text, but awareness of context, decomposition, and execution environment. If SKAI silently injects context, it weakens the user's ability to learn orchestration. If it exposes the context, the system itself becomes a teaching surface.
