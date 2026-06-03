# 058 Explicit Model Choice, Message Copy, And Graph Visual Fix

## Goal

Remove visible model defaulting from the solving experience and tighten the next set of high-friction demo UX issues discovered during real use: per-message copying, Markdown rendering, directed graph readability, and 3D dual graph overflow/edge clutter.

## Scope

1. Model choice must be explicit.
   - The user must choose exactly one model before starting an attempt.
   - No model card should appear as the default or preferred option.
   - Models should be presented as parallel execution engines, independent from solving mode.
   - OpenAI/Gemini/Groq/xAI/etc. should not be framed as ranked presets.
2. Add a copy button to every assistant response.
   - The button should copy the full response content for that one message.
   - The button should sit at the message footer, near token/cost metadata if present.
   - The copied text should be suitable for pasting into the final answer area.
3. Fix Markdown emphasis rendering in AI responses.
   - `**bold**` and similar Markdown emphasis should render as formatted text, not raw syntax.
   - The fix should apply to live provider responses and mock responses wherever they use the shared message renderer.
4. Make prompt/response graph direction visible.
   - Prompt nodes and response nodes need clear directed edges.
   - Edge arrows should be readable without adding explanatory labels.
5. Fix 3D dual graph row overflow.
   - Rows should not extend beyond the white rectangular graph container.
   - Horizontal overflow should be constrained by responsive layout, clipping, scaling, or scroll treatment that does not break the graph's meaning.
6. Remove text boxes near 3D dual graph edges.
   - Edge-adjacent labels are visual noise in the current demo.
   - Keep directed edges and node selection/detail panels instead.

## Assumptions

- This is a UI/interaction slice, not a database schema slice.
- Existing backend trace storage already keeps assistant responses as independent trace events, so message copy can be implemented client-side.
- `MarkdownContent` already exists; the likely bug is that some response surfaces are still rendering raw string content instead of using the shared Markdown renderer.
- The current code still has Gemini fallback after plan `057`; this plan changes the product-facing model selection contract and may keep a backend safety fallback only where strictly needed for malformed API calls.

## Affected Files / Modules

- `components/problem-solver.tsx`
- `components/markdown-content.tsx`
- `components/conversation-graph-view.tsx`
- `components/graph-state-transition-view.tsx`
- `app/globals.css`
- `lib/model-options.ts`
- `app/api/chat/route.ts`
- `docs/000_orchestration.md`
- `docs/technical/000_decision_register.md`

## Data Model / API Changes

- No Supabase migration expected.
- Attempt records still require exactly one `provider` and one `model`.
- UI state should allow `modelOptionId` to be unset before attempt creation.
- `/api/chat` should not be treated as the user's model-selection source of truth. Preferred behavior:
  - UI always sends explicit provider/model after user choice.
  - API route either validates explicit provider/model or keeps a server-side defensive fallback that is not exposed as a product default.

## Implementation Steps

### 3-Hour Execution Slices

Slice A: Explicit parallel model choice.

- Remove visible model defaults from the pre-attempt solver.
- Require one explicit model choice before attempt creation.
- Remove backend `/api/chat` provider/model defaults so malformed direct calls do not silently become Gemini.
- Keep provider/model fixed once the attempt starts or an existing attempt is restored.

Slice B: Message copy and Markdown rendering.

- Add a per-assistant-response copy button that copies the whole raw assistant message.
- Keep copy controls low-emphasis and near the message footer.
- Route AI responses through the shared Markdown renderer and normalize escaped emphasis markers such as `\*\*bold\*\*`.

Slice C: Directed graph readability.

- Make projection graph edges visually directed from source node to target node.
- Remove edge-adjacent text pills from the 3D dual graph.
- Constrain 3D dual graph rows so they do not push outside the graph container.

### Detailed Steps

1. Replace solving setup's initial `modelOptionId` with an unselected state.
2. Disable `Start attempt` until both solving mode and model are explicitly selected.
3. Update model cards so none has default/recommended wording or initial active styling.
4. Audit `getDefaultModelOption()` usage:
   - Remove it from visible solving setup.
   - Keep or replace only defensive fallback paths that cannot affect normal user experience.
5. Add assistant-message copy action:
   - Use the Clipboard API.
   - Provide short copied/error state without shifting layout.
   - Copy exactly the trace event content, not rendered HTML.
6. Audit every assistant response render path and route it through `MarkdownContent`.
7. Strengthen directed edges in prompt/response graph:
   - Add arrow markers or explicit arrowheads.
   - Ensure direction is visible in both dense and short traces.
8. Fix 3D dual graph layout overflow:
   - Constrain rows to container width.
   - Avoid text-driven row expansion.
   - Test desktop and narrower viewport widths.
9. Remove edge-adjacent text boxes from the 3D dual graph and rely on node click/detail panels for text.
10. Update docs and run verification.

## Verification Steps

- Run `git diff --check`.
- Run `conda run -n SKAI npm run typecheck`.
- Run `conda run -n SKAI npm run lint`.
- Run `conda run -n SKAI npm run build`.
- Manual local browser checks:
  - New attempt screen starts with no selected model.
  - Starting is blocked until a model is chosen.
  - Selecting Gemini/OpenAI/Groq/etc. looks parallel, not ranked.
  - Every assistant message has a copy button and copies the full message.
  - AI response `**bold**` renders as bold.
  - Prompt/response graph edges show direction.
  - 3D dual graph rows stay inside the container.
  - 3D dual graph edge text boxes are gone.

## Implementation Result

- Slice A completed:
  - `modelOptionId` now starts as `null`; no model card is selected before the user acts.
  - `Start attempt` is disabled until a model is explicitly selected.
  - `newAttempt` requires a `ModelOption`; there is no implicit model option fallback for new attempts.
  - Existing/restored attempts rehydrate their recorded provider/model state.
  - `/api/chat` now requires explicit `provider` and `model` in the request body.
  - `lib/model-options.ts` no longer exports a default model option or returns Gemini as a lookup fallback.
- Slice B completed:
  - Assistant messages now expose a low-emphasis `Copy answer` footer button.
  - The button copies the raw full assistant message for that trace event.
  - `MarkdownContent` normalizes escaped emphasis markers before rendering and styles rendered `strong` text.
- Slice C completed:
  - Projection graph edges render as source node -> directed vector -> target node paths.
  - 3D dual graph lane links no longer show edge-adjacent text/status pills.
  - 3D lane columns and node sizing were tightened to reduce horizontal overflow.

## Verification Result

- `conda run -n SKAI npm run typecheck`: passed.
- `git diff --check`: passed.
- `conda run -n SKAI npm run lint`: passed.
- `conda run -n SKAI npm run build`: passed.
- Local production smoke:
  - `GET /`: returned `200`.
  - `POST /api/chat` without `provider`/`model`: returned `400` with explicit field errors for both fields.
  - Smoke server was stopped after the check.
- Browser visual smoke was not run because Playwright/browser automation is not installed in this repo.

## Risks

- Removing defaults can add one click of friction. This is intentional because model choice is part of the orchestration act.
- If `/api/chat` removes all defaults, malformed direct API calls may return validation errors instead of Gemini fallback. That is acceptable if UI calls remain explicit.
- Graph CSS changes can easily fix one viewport and break another; verify desktop and narrow widths.
- Copy buttons can clutter the chat UI if they are visually too heavy. Use low-emphasis icon/button treatment.

## Rollback Notes

- If explicit model choice creates too much smoke-test friction, restore a soft "last used model" local preference rather than a global default.
- If Markdown rendering introduces unsafe HTML risk, keep the renderer restricted to safe Markdown components and avoid raw HTML rendering.
- If graph arrowheads degrade dense graph readability, keep arrowheads only on active/hovered edges.

## Open Questions

- Should SKAI remember the user's last chosen model locally without calling it a default?
- Should backend `/api/chat` reject missing provider/model, or keep a defensive Gemini fallback for non-UI calls?
- Should copy actions be available only for assistant responses or also for user prompts and final answer drafts?

## Philosophy Check

This slice directly strengthens SKAI's core premise: model selection is part of orchestration, not a hidden product preference. Copy buttons and Markdown rendering improve the practical solving loop, while directed graph/3D graph fixes make the trace structure easier to read without turning SKAI into a generic chatbot or model leaderboard.
