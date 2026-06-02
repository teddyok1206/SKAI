# 052 Home Hero Lockup And Copy

## Goal

Remove the duplicated SKAI lockup from the home hero and prepare sharper headline candidates that reflect SKAI's philosophy.

## Scope

- Remove the hero-level `SkaiLockup` from `app/page.tsx`.
- Keep the topbar as the single primary brand lockup on the home screen.
- Preserve the current headline in code until the founder selects a replacement.
- Add a design note with curated headline candidates.

## Assumptions

- The duplicated logo is the hero-level lockup, not the topbar brand.
- Home should not become a decorative landing page. It should keep the first action close to problem solving.
- The headline should frame AI skill as orchestration over intent, materials, task flow, verification, and artifact creation.

## Affected Files

- `app/page.tsx`
- `docs/design/003_home_hero_copy_candidates.md`

## Implementation Steps

1. Remove the unused `SkaiLockup` import from `app/page.tsx`.
2. Remove `<SkaiLockup />` from the home hero.
3. Document headline candidates and the selection criteria.

## Verification

- Run `git diff --check`.
- Run `conda run -n SKAI npm run typecheck`.
- Run `conda run -n SKAI npm run lint`.
- Run `conda run -n SKAI npm run build`.

## Risks

- Removing the hero lockup can make the first viewport slightly less branded. This is acceptable because the topbar already carries the official lockup.
- A headline that is too abstract can weaken beginner comprehension. The lead sentence should keep the practical explanation.

## Philosophy Check

This change keeps SKAI away from decorative landing-page branding and puts the emphasis back on the user's orchestration act. The headline candidates should express SKAI's claim without turning the product into a generic AI tips site.
