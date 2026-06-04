# 079 Topbar Home Problem Browser Localization

Date: 2026-06-05

## Goal

Wire the first visible route surfaces to the i18n registry:

- topbar navigation;
- language toggle;
- home hero;
- problem browser labels, filters, empty state, and card actions.

## Scope

Included:

- `components/topbar-nav.tsx`;
- `components/home-hero.tsx`;
- `components/auth-notice.tsx`;
- registry additions for problem browser labels;
- `ProblemBrowser` copy lookup by selected locale;
- topbar language toggle mounted in the app shell.
- topbar auth/theme/accessibility labels.

Excluded:

- solve flow;
- `.skai` viewer;
- public share;
- judge/coaching report;
- problem content localization.

## Implementation Rules

- Locale selection is explicit and stored in `localStorage`.
- Do not use browser locale auto-detection.
- Keep `SKAI`, `Problems`, `Admin`, and model/provider names stable unless registry says otherwise.
- Do not claim the whole app is localized yet.

## Strengthened Philosophy Gate

- Home hero must preserve the Prometheus/fire metaphor as discipline and capability, not decorative AI spectacle.
- Problem browser copy must not turn model/provider choice into a leaderboard.
- Technical terms should remain crisp; do not flatten `Trace`, `Artifact`, or `Orchestration` into vague Korean labels.

## Verification

- `npm run i18n:check`
- `npm run verify:i18n`
- `conda run -n SKAI npm run typecheck`
- `conda run -n SKAI npm run lint`
- `conda run -n SKAI npm run build`

## Implementation Result

- Added `TopbarNav` and mounted `LanguageToggle` in the app shell.
- Added `HomeHero` so the official philosophy copy is read from the registry.
- Moved topbar auth notice, auth status, theme selector labels, problem browser filters, curation chips, summaries, empty state, card actions, accessibility labels, material count, and minute labels to the copy registry.
- Kept problem statements, problem titles, material content, model/provider names, and theme option names outside this slice.
- Updated `useLanguagePreference` so the selected locale is explicit, stored in `localStorage`, reflected into `document.documentElement.lang`, and not browser-auto-detected.

## Verification Result

- `npm run i18n:inventory`: passed; 83 entries.
- `npm run verify:i18n`: passed.
- `conda run -n SKAI npm run typecheck`: passed.
- `conda run -n SKAI npm run lint`: passed.
- `conda run -n SKAI npm run build`: passed.

## Strengthened Philosophy Check

- Alignment: the first impression layer now supports Korean/English without turning SKAI into a translation gimmick. The hero remains the approved fire/fuel discipline copy, and the problem browser still emphasizes problem selection and material control rather than model ranking.
- Boundary: problem content localization is intentionally deferred. A problem's source language is part of the task context, while UI language is the user's reading surface.
- Watchpoint: solve flow localization must keep cold-start comparability intact. It must not insert prompt templates, hidden coaching, or model-specific shortcuts into the user's chat environment.
