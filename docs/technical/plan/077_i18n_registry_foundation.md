# 077 I18n Registry Foundation

Date: 2026-06-05

## Goal

Implement the smallest bilingual copy registry foundation for SKAI.

The registry must support one-sided copy edits without pretending the other language is already correct.

## Scope

Included:

- `lib/i18n/types.ts`;
- `lib/i18n/protected-terms.ts`;
- `lib/i18n/copy-registry.json`;
- `lib/i18n/registry.ts`;
- `lib/i18n/index.ts`;
- `components/language-toggle.tsx`.

Excluded:

- route-level locale switching;
- replacing all hardcoded copy;
- browser locale auto-detection;
- problem statement localization.

## Architecture

Use JSON as canonical copy storage:

```text
lib/i18n/copy-registry.json
```

TypeScript reads and exposes it through:

```text
lib/i18n/registry.ts
```

This keeps the source editable by scripts while still giving app code typed helper functions.

## Philosophy Gate

- Protected terms remain visible in both locales where required.
- Philosophy copy receives official ko/en forms, not literal translation.
- Locale switching is explicit. No hidden browser auto-detection in the first demo.

## Verification

- `npm run i18n:check`
- `conda run -n SKAI npm run typecheck`
- `conda run -n SKAI npm run lint`

## Result

- Added initial registry foundation and language toggle component.
- Added JSON-backed copy registry with 35 high-priority entries.
- Added typed registry accessors through `lib/i18n/registry.ts`.
- Added protected SKAI terms list.
- Added explicit localStorage-based language preference hook and `LanguageToggle` component.

## Verification Result

- `node scripts/i18n_check.mjs --fix`: completed initial checksum hydration.
- `npm run i18n:inventory`: passed.
- `npm run i18n:check`: passed.
- `conda run -n SKAI npm run typecheck`: passed.
- `conda run -n SKAI npm run lint`: passed.

## Strengthened Philosophy Check

- Alignment: registry entries preserve concepts like `.skai`, `Artifact`, `Trace`, `3D Dual Graph`, `Judge`, and `Coaching`.
- Anti-drift: the app has a foundation for locale selection without auto-detecting or silently changing the user's language context.
- Watchpoint: the toggle is not wired into topbar yet; slice 079 must not imply the whole app is localized until major surfaces actually consume registry keys.
