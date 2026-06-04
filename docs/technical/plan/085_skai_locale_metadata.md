# 085 `.skai` Locale Metadata

Date: 2026-06-05

## Goal

Let exported/shared `.skai` files declare language context without translating artifact content.

## Scope

Included:

- optional `locale` and `availableLocales` on `.skai` manifest;
- manifest locale derived from `PublishedAttempt.scoreReport.locale` or source locale;
- viewer manifest grid display for locale metadata.

Excluded:

- raw trace translation;
- problem content translation;
- multi-locale artifact bundles;
- extension-level translated variants beyond the optional metadata added in slice 083.

## Implementation Result

- `SkaiFileManifest` now supports optional `locale` and `availableLocales`.
- `buildSkaiFileArtifact` writes manifest locale metadata from the published attempt score report, defaulting to Korean for old reports.
- `SkaiFileViewer` displays manifest locale and available locales.

## Verification Result

- `npm run verify:i18n`: passed; 366 entries.
- `conda run -n SKAI npm run typecheck`: passed.
- `conda run -n SKAI npm run lint`: passed.
- `conda run -n SKAI npm run build`: passed.

## Strengthened Philosophy Check

- Alignment: `.skai` stays a stable graph/trace contract. Locale metadata tells the reader how the surrounding report layer was produced without mutating the trace.
- Watchpoint: when multi-locale coaching extensions exist, `availableLocales` should list approved extension locales, not guessed raw prompt languages.
