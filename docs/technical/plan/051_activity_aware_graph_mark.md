# 051 Activity-Aware Graph Mark

Date: 2026-06-03

## Goal

Reflect Gemini response 005 by keeping the 3-node graph as the primary mark while adding Engine Mode activity feedback that feels energetic without becoming a literal flame logo.

## Scope

Included:

- Preserve Gemini response 005 as a philosophy/action document.
- Add activity variants to `SkaiMark`.
- Use root `data-skai-activity` to express solving state.
- Connect `ProblemSolver` state to activity:
  - ready,
  - primed,
  - busy,
  - structured.
- Increase packet-flow speed/density during active solving.
- Add subtle artifact-node pulse when structure forms.
- Add reduced-motion safety.
- Update design/technical docs and decision register.

Excluded:

- Literal flame SVG or flame-first brand mark.
- Provider-specific logo animation.
- Full graph step-by-step animation in the workspace.
- Persisting activity state.

## Affected Files

- `components/skai-mark.tsx`
- `components/problem-solver.tsx`
- `app/globals.css`
- `docs/philosophy/Gemini/005.md`
- `docs/technical/plan/051_activity_aware_graph_mark.md`
- `docs/design/002_font_and_provider_surfaces.md`
- `docs/000_orchestration.md`
- `docs/technical/000_decision_register.md`

## Implementation Steps

1. Add extra packet/spark elements to the graph mark.
2. Add CSS activity states under Engine Mode.
3. In `ProblemSolver`, sync current solving activity to `document.documentElement.dataset.skaiActivity`.
4. Clean up the activity dataset when leaving the solver.
5. Update docs.
6. Verify diff check, typecheck, lint, build.

## Risks

- Motion can become decorative or distracting.
- Global root state can be stale if not cleaned up.
- Animation must not imply hidden model behavior or provider-specific intelligence.

## Rollback

- Remove `data-skai-activity` sync from `ProblemSolver`.
- Remove extra packet elements and activity CSS.
- Engine Mode returns to the existing subtle packet-flow animation.

## Philosophy Check

The mark should show structured energy: intent and material packets moving toward artifact. It should not become a literal flame, an AI power icon, or a theatrical loading spinner.

## Implementation Result

Completed:

- Added `docs/philosophy/Gemini/005.md`.
- Added extra graph packet/spark/halo SVG elements without changing the mark silhouette.
- Added Engine Mode activity CSS for `ready`, `primed`, `busy`, and `structured`.
- Connected `ProblemSolver` state to root `data-skai-activity`.
- Added reduced-motion fallback.
- Updated orchestration/design docs and decision register.

## Verification

- `git diff --check`
- `conda run -n SKAI npm run typecheck`
- `conda run -n SKAI npm run lint`
- `conda run -n SKAI npm run build`

All passed on 2026-06-03.

## Final Philosophy Check

This implementation keeps the graph as SKAI's primary identity while making Engine Mode feel alive during actual work. The energy is contained in directed packet flow from intent/material nodes toward artifact, so it supports orchestration agency rather than AI worship or decorative flame branding.
