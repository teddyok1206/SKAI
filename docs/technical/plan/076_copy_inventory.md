# 076 Copy Inventory

Date: 2026-06-05

## Goal

Inventory the current user-facing copy before moving strings into the bilingual registry.

This slice is not a translation pass. It classifies copy by product role so later slices can migrate copy without flattening SKAI's technical concepts.

## Scope

Included:

- `docs/design/004_copy_inventory.md`;
- first migration candidates for home, navigation, problem browser, `.skai` viewer, share fallback, judge/coaching extension labels;
- protected terms and translation posture per category.

Excluded:

- replacing component strings;
- problem content localization;
- LLM-generated coaching localization.

## Philosophy Gate

The inventory must preserve the distinction between:

- technical concepts that should remain stable across languages;
- philosophy/brand copy that should be rewritten per language;
- simple UI actions that should be translated directly.

## Verification

- `git diff --check`
- manual review against `docs/technical/plan/075_language_system_track.md`

## Result

- Created copy inventory document.
- Identified high-priority registry entries for slices 077-078.
- Classified copy into protected technical tokens, per-language philosophy rewrites, direct UI translations, locale-specific content, and deferred system/API text.
- First registry cut covers home, nav/auth, problem browser, `.skai` viewer, extension labels, share fallback, and philosophy mantra.

## Verification Result

- `git diff --check`: pending final task check.
- Manual review against `075_language_system_track`: completed.

## Strengthened Philosophy Check

- Alignment: the inventory preserves SKAI's technical vocabulary instead of flattening it into generic Korean/English UI.
- Anti-drift: problem content and playbooks are explicitly deferred so the trace/artifact distinction is not blurred by premature translation.
- Watchpoint: when slice 079 starts replacing component strings, protected tokens must remain visible where they describe graph/file architecture.
