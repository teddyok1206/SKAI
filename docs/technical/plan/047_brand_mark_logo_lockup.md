# 047 Brand Mark Logo Lockup

Date: 2026-06-02

## Goal

Create a reusable SKAI logo lockup that combines the 3-node directed graph mark, the SKAI wordmark, and the full project name.

## Scope

Included:

- Add a reusable `SkaiLockup` component.
- Use it on the home hero as the first brand signal.
- Keep the existing topbar compact mark.
- Preserve the actual usable home/problem list experience.
- Update docs and verification.

Excluded:

- Full marketing landing page.
- Provider-branded lockups.
- Replacing the topbar mark.
- Non-SKAI decorative imagery.

## Implementation Steps

1. Add `components/skai-lockup.tsx`.
2. Add lockup CSS for Human and Engine compatibility.
3. Replace the home hero eyebrow with the lockup.
4. Update orchestration/design docs.
5. Verify typecheck, lint, build, and diff check.

## Done Criteria

- SKAI has a reusable official lockup component.
- Home first viewport shows brand/product as more than tiny nav text.
- The page remains a usable problem list, not a generic landing page.

## Philosophy Check

The lockup should make the 3-node graph doctrine visible without turning SKAI into a decorative brand exercise. The first action remains solving a problem.

## Implementation Result

Completed:

- Added `components/skai-lockup.tsx`.
- Added Human/Engine compatible lockup CSS.
- Replaced the home hero eyebrow with the reusable SKAI lockup.
- Kept the topbar compact mark unchanged.
- Updated the orchestration parent document, design note, and decision register.

## Verification

- `git diff --check`
- `conda run -n SKAI npm run typecheck`
- `conda run -n SKAI npm run lint`
- `conda run -n SKAI npm run build`

All passed on 2026-06-02.

## Final Philosophy Check

This slice supports the Gemini 001 brand direction without changing the product into a landing page. The home first viewport now exposes the SKAI identity as `3-node directed mark + SKAI + Social Knowledge of AI`, while the primary action remains starting a problem. The change preserves Human/Engine mode separation and does not introduce provider-like branding.
