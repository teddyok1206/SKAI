# 004 Theme Selector Design Pass

Date: 2026-06-01

## Goal

Implement the first SKAI-specific design pass based on the `Promethean Workbench` recommendation while allowing the demo viewer to choose among three concept options.

## Scope

Included:

- Theme option model with priority labels.
- Theme selector in the top navigation.
- Local persistence for selected theme.
- CSS variable themes.
- Default theme set to `Promethean Workbench`.
- Visual shift away from warm paper toward neutral workbench mist.
- Distinct SKAI concept language, not copied from another site.

Theme options:

1. `Promethean Workbench`: recommended/default.
2. `Research Bench`: more neutral, evidence-heavy.
3. `Civic AI Lab`: public education and institutional trust.

Excluded:

- Full component redesign.
- Animation pass.
- Full dark mode.
- Brand/logo redesign.

## Verification

- Theme selector appears.
- Theme choice persists after reload.
- No layout regression on desktop/mobile.
- Typecheck, lint, and build pass.

## Risks

- Too many theme options can distract from the product demo. Keep it to exactly three.
- Themes must preserve the same information hierarchy.

## Implementation Status

Status: implemented.

Completed:

- Theme option model.
- Theme provider with local persistence.
- Top-nav theme selector.
- Three prioritized options.
- Home page concept section.
- CSS variable themes for Promethean Workbench, Research Bench, and Civic AI Lab.
- Default theme set to Promethean Workbench.
- Visual pass from warm paper toward neutral workbench mist.

Verification completed:

- `conda run -n SKAI npm audit --audit-level=moderate`
- `conda run -n SKAI npm run typecheck`
- `conda run -n SKAI npm run lint`
- `conda run -n SKAI npm run build`
