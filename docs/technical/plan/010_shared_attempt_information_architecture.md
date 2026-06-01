# 010 Shared Attempt Information Architecture

Date: 2026-06-01

## Goal

Strengthen the published attempt page so other users learn the solver's orchestration structure before reading raw prompts.

## Rationale

SKAI should not become a prompt gallery. A shared attempt should foreground:

- workflow,
- prompt skeleton,
- material use,
- bottlenecks,
- replay suggestions,
- raw transcript only on demand.

This matches the principle that the prompt sequence is a first-class artifact, but the learning object is the problem-solving structure behind it.

## Scope

Included:

- Rebuild the share page information order.
- Add a compact attempt overview.
- Derive prompt skeleton cards from user trace events.
- Surface material use and prompt intent signals.
- Move bottlenecks into a first-class section before the full coach report.
- Keep raw prompt/model transcript collapsed by default.
- Add share-page-specific responsive CSS.
- Update orchestration docs.

Excluded:

- Persistent comments/threading.
- Prompt similarity or anti-cheat.
- Server-side generated prompt summaries.
- Privacy controls beyond the current published snapshot.

## Assumptions

- Current `PublishedAttempt` already contains `workflow`, `trace`, and `scoreReport`.
- For this pass, prompt skeleton can be deterministic and derived from the trace content.
- LLM-generated summaries can be added later after live judge calibration.

## Affected Files

- `components/share-attempt-client.tsx`
- `app/globals.css`
- `docs/000_orchestration.md`

## Implementation Steps

1. Add helper functions to derive prompt intent, signals, attachment count, and compact summaries from user trace events.
2. Reorder the shared attempt page into learning-first sections.
3. Add bottleneck cards with linked trace event IDs.
4. Keep raw transcript in collapsed detail rows.
5. Add responsive CSS for overview, skeleton, timeline, and bottleneck surfaces.
6. Verify typecheck, lint, build, and a browser-renderable share path.

## Verification

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Manual visual check for `/share/[attemptId]` after publishing an attempt or loading local sample data.

## Risks

- Deterministic prompt skeletons may be too shallow. Keep labels modest and avoid pretending they are semantic judge output.
- If trace events are sparse, the page may look empty. Provide graceful fallback copy.
- Raw transcript visibility still depends on current published snapshot policy.

## Rollback

Revert `components/share-attempt-client.tsx` and the share-page CSS changes. The published attempt data model remains unchanged.
