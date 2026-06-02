# 050 Generated Problem Editorial Gate

Date: 2026-06-02

## Goal

Reflect Gemini response 004 by preventing unreviewed generated problems from appearing in the first smoke-test problem browser.

## Scope

Included:

- Preserve Gemini response 004 as a philosophy/action document.
- Add localStorage-backed editorial state for generated problems.
- Add a founder/admin generated problem editorial dashboard.
- Add a 4-step checklist:
  - anti-one-shot call,
  - material cross-reference,
  - extracted text usability,
  - domain accessibility.
- Gate generated problem visibility in `ProblemBrowser`.
- Simplify the default problem browser surface around scenario lanes.
- Move detailed filters into a collapsed advanced section.
- Hide internal `goalProfile` and `primarySkill` metadata from problem cards.
- Update orchestration docs and decision register.

Excluded:

- Supabase-backed generated problem publishing.
- Role-gated admin authorization.
- Full editorial workflow with reviewer assignment.
- Human score override.
- Graph animation slice.

## Assumptions

- For first smoke, seed problems remain always visible.
- Generated problems are hidden by default until founder publishes them locally.
- Local editorial state is acceptable for Mac/local smoke and can be migrated to Supabase later.
- Direct URL access to generated problems is not blocked in this slice; this is a discovery gate, not an authorization boundary.

## Affected Files

- `docs/philosophy/Gemini/004.md`
- `docs/technical/plan/050_generated_problem_editorial_gate.md`
- `lib/types.ts`
- `lib/constants.ts`
- `lib/local-store.ts`
- `lib/use-generated-problem-editorial.ts`
- `components/problem-browser.tsx`
- `components/generated-problem-editorial-dashboard.tsx`
- `app/admin/page.tsx`
- `app/globals.css`
- `docs/000_orchestration.md`
- `docs/technical/000_decision_register.md`

## Implementation Steps

1. Add generated problem editorial types and local persistence.
2. Add a generated problem editorial dashboard under Admin.
3. Change home ProblemBrowser to show seed problems plus published generated problems only.
4. Simplify the problem browser default surface into search + scenario lanes.
5. Collapse advanced filters and remove internal metadata chips from problem cards.
6. Update docs.
7. Verify diff check, typecheck, lint, build.

## Risks

- Hiding generated problems by default may make the new batch feel unused until founder reviews it.
- LocalStorage editorial state is not portable between machines.
- Checklist can become performative if founder does not actually read the problem materials.

## Rollback

- Remove editorial gate hook from `ProblemBrowser`.
- Delete dashboard component and local-store editorial functions.
- Generated problems will again appear through the static problem list.

## Philosophy Check

This slice protects SKAI from becoming a synthetic prompt dump. It treats problem quality as part of the product's authority and keeps the first smoke focused on real orchestration learning instead of browsing a large unvetted catalog.

## Implementation Result

Completed:

- Added `docs/philosophy/Gemini/004.md` as the actionable Gemini response record.
- Added generated problem editorial state types and local persistence.
- Added `useGeneratedProblemEditorialStates` and `useGeneratedProblemEditorialMap`.
- Added `GeneratedProblemEditorialDashboard` to Admin.
- Added the 4-step checklist and publish/hide gate.
- Changed `ProblemBrowser` to show seed problems plus published generated problems only.
- Simplified default problem discovery to search + three scenario lanes.
- Moved detailed filters into a collapsed advanced section.
- Removed internal `goalProfile`/`primarySkill` chips from problem cards.
- Updated orchestration docs and decision register.

## Verification

- `git diff --check`
- `conda run -n SKAI npm run typecheck`
- `conda run -n SKAI npm run lint`
- `conda run -n SKAI npm run build`

All passed on 2026-06-02.

## Final Philosophy Check

This implementation directly addresses Gemini's strongest warning: synthetic problems should not inherit product authority just because they pass schema validation. SKAI now treats generated problems as candidates that need founder review before smoke exposure. It also reduces the browser's default cognitive load and keeps model/provider out of discovery.
