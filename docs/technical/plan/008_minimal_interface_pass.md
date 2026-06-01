# 008 Minimal Interface Pass

Date: 2026-06-01

## Goal

Make the SKAI demo interface clearer, quieter, and more visually refined while preserving the current product structure.

## Design Direction

The reference is Apple's discipline of showing only necessary information, not Apple's specific trade dress, campaign language, or visual assets.

Principles for this pass:

- Reduce internal/demo-only explanation on the homepage.
- Make the primary action obvious.
- Keep cards flatter and quieter.
- Use whitespace, hierarchy, and restrained contrast instead of decorative styling.
- Keep selected model environment clear before attempt start.
- Keep the solving surface focused on prompt trace, materials, and composer.

## Scope

Included:

- Clean homepage hero and problem list.
- Remove the design concept section from the homepage.
- Refine base color, panel, card, button, and tag styles.
- Refine pre-attempt model selection cards.
- Simplify the solve toolbar by removing long environment descriptions after the attempt starts.
- Update design docs and orchestration doc.

Excluded:

- New branding assets.
- Animation-heavy redesign.
- New information architecture beyond current pages.
- Exact replication of Apple's layout, fonts, or components.

## Affected Files

- `app/page.tsx`
- `components/problem-solver.tsx`
- `app/globals.css`
- `docs/000_orchestration.md`
- `docs/design/000_design_principles.md`
- `docs/design/001_theme_recommendation.md`

## Verification

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Manual smoke: homepage and `/problems/club-budget-workflow`

## Risks

- Removing the design concept section hides theme rationale from users. This is acceptable because it belongs in docs, not the user-facing homepage.
- A quieter UI may make demo affordances less obvious if labels become too subtle. Keep primary actions high-contrast.

## Rollback

Restore the previous homepage sections and CSS from the prior commit.
