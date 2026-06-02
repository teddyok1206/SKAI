# 043 Route Mode Logo Sync Bugfix

Date: 2026-06-02

## Goal

Make the SKAI topbar mark reliably switch between Human Mode and Engine Mode.

## Problem

The previous implementation used:

```css
:root:has(.ui-mode-surface[data-ui-mode="engine"]) ...
```

This is elegant but fragile because the topbar lives outside each route's `main` surface, and the behavior depends on browser support and selector invalidation for `:has()` on `:root`.

## Scope

Included:

- Add a tiny client bridge that syncs the current route mode to `document.documentElement.dataset.uiMode`.
- Use `html[data-ui-mode="engine"]` selectors for the topbar mark and wordmark.
- Keep route-level `data-ui-mode` wrappers as the semantic source of the page surface.
- Keep the existing `:has()` selectors only as progressive fallback.

Excluded:

- Logo redesign.
- Packet-flow animation.
- Full brand lockup.

## Implementation Steps

1. Add `components/ui-mode-sync.tsx`.
2. Mount it in `app/layout.tsx`.
3. Update topbar mark CSS to target `:root[data-ui-mode="engine"]`.
4. Verify typecheck, lint, build, and diff check.

## Philosophy Check

This is a reliability fix for the existing Human/Engine visual contract. It does not alter prompt behavior, model behavior, or the core graph doctrine.

## Implementation Result

- Added `components/ui-mode-sync.tsx`.
- Mounted `UiModeSync` in the root layout so route changes set `document.documentElement.dataset.uiMode`.
- Updated mark/brand CSS so `:root[data-ui-mode="engine"]` controls circle-to-hex switching.
- Kept the existing `:has()` selector as a progressive fallback.
- Updated orchestration and design docs.

## Verification

- `git diff --check`: passed.
- `conda run -n SKAI npm run typecheck`: passed.
- `conda run -n SKAI npm run lint`: passed.
- `conda run -n SKAI npm run build`: passed.

## Final Philosophy Check

The fix makes the visual state follow the route-level Human/Engine distinction reliably. It preserves SKAI's core separation between UI mode and model behavior: only the product surface changes, not the prompt context or provider request.
