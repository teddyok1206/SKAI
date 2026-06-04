# 078 Copy Sync Tooling

Date: 2026-06-05

## Goal

Add CLI tooling so a developer can change one locale and have the opposite locale become `stale` or `missing` automatically.

## Scope

Included:

- `scripts/i18n_common.mjs`;
- `scripts/i18n_inventory.mjs`;
- `scripts/i18n_update_entry.mjs`;
- `scripts/i18n_check.mjs`;
- `scripts/i18n_draft_translate.mjs`;
- package scripts:
  - `i18n:inventory`;
  - `i18n:check`;
  - `i18n:update`;
  - `i18n:draft`;
  - `verify:i18n`.

Excluded:

- external translation management service integration;
- live LLM translation API calls;
- automatic approval of translations.

## Operating Contract

```text
npm run i18n:update -- --key home.hero.line1 --locale ko --value "..."
```

must:

- update Korean value;
- set source locale to Korean;
- recompute checksum;
- mark English as `stale` if present;
- mark English as `missing` if absent;
- keep protected-term checks available through `i18n:check`.

## Philosophy Gate

Tooling must make drift visible. It should not silently convert SKAI into a generic translated website or auto-approve machine output for core philosophy copy.

## Verification

- `npm run i18n:inventory`
- `npm run i18n:check`
- `npm run verify:i18n`
- `conda run -n SKAI npm run typecheck`
- `conda run -n SKAI npm run lint`

## Result

- Added copy sync tooling.
- Added registry helper module shared by i18n CLI scripts.
- Added inventory, check, update, and draft scripts.
- Added package scripts `i18n:inventory`, `i18n:check`, `i18n:update`, `i18n:draft`, and `verify:i18n`.
- `i18n:update` changes one locale, sets it as `sourceLocale`, recomputes checksum, and marks the opposite locale `stale` or `missing`.
- `i18n:draft` writes draft text without approval and without changing the source checksum.

## Verification Result

- `npm run i18n:inventory`: passed.
- `npm run i18n:check`: passed.
- `npm run verify:i18n`: passed.
- `conda run -n SKAI npm run typecheck`: passed.
- `conda run -n SKAI npm run lint`: passed.

## Strengthened Philosophy Check

- Alignment: tooling makes language drift explicit rather than letting one locale silently become canonical.
- Anti-drift: machine/draft translation cannot become approved copy automatically.
- Watchpoint: future `i18n:draft` may call an LLM, but it must remain a draft generator and must never approve philosophy or coaching copy without founder review.
