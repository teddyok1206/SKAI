# 037 Admin Authoring MVP

Date: 2026-06-02

## Goal

Create the first problem authoring surface so new demo problems can be drafted and solved without editing source code.

```text
admin form
-> local authored problem
-> local problem list
-> solve local problem
-> export JSON for future seed/Supabase authoring
```

## Scope

Included:

- Replace the placeholder admin page with a local authoring client.
- Store authored problem drafts in localStorage.
- Show authored drafts on the home page.
- Add a local problem solve route.
- Support core problem fields:
  - title,
  - subtitle,
  - category,
  - difficulty,
  - goal profile,
  - estimated minutes,
  - statement,
  - user goal,
  - constraints,
  - starter context,
  - deliverables,
  - one optional text/material record.
- Show exportable JSON for founder review or later migration.

Excluded:

- Supabase-backed admin create/edit/publish.
- Multi-material upload UI.
- Rubric editor.
- Auth-based admin permissions.
- Playbook authoring.

## Product Rules

- Authored problems are local demo drafts, not public production records.
- A draft must be solvable through the same `ProblemSolver`.
- The form should expose problem structure, not hide it behind a generic text box.
- Defaults should produce a valid problem even when optional material is empty.

## Implementation Steps

1. Extend local storage keys and helpers for authored problems.
2. Build `AdminAuthoringClient`.
3. Update `app/admin/page.tsx`.
4. Add `AuthoredProblemList` to the home page.
5. Add `app/problems/local/[problemId]/page.tsx`.
6. Add `LocalProblemSolver` client loader.
7. Add focused CSS.
8. Update orchestration docs.
9. Verify typecheck, lint, build, and diff check.

## Done Criteria

- Admin page can create a local problem draft.
- Home page shows local drafts after creation.
- Local draft problem can be opened and solved with the existing solver.
- Export JSON is visible for future migration/seed workflows.

## Risks

- localStorage drafts are not shared across devices.
- This does not solve real team authoring or HR-grade problem management.
- Rubric defaults are reused, so advanced custom evaluation still needs a later slice.
- A local route cannot be shared with another user unless the problem is exported/imported later.

## Philosophy Check

Problem authoring is central to SKAI because the platform is only as good as the unclear real-world problems it can encode. This slice keeps the first authoring path simple, but it forces every new problem to declare goal, constraints, deliverables, and materials, which preserves SKAI's structural philosophy.

## Implementation Result

Completed on 2026-06-02.

Implemented:

- Added local authored problem storage:
  - `SKAI_STORAGE_KEYS.authoredProblems`
  - `getAuthoredProblems`
  - `saveAuthoredProblem`
  - `getAuthoredProblem`
  - `subscribeAuthoredProblems`
- Added `useAuthoredProblems` and `useAuthoredProblem` via `useSyncExternalStore`.
- Replaced admin placeholder with `AdminAuthoringClient`.
- Admin authoring supports:
  - structured problem fields,
  - category/difficulty/goal profile,
  - constraints/starter context/deliverables as line lists,
  - one optional material with extracted text,
  - default rubric,
  - JSON export preview.
- Added `AuthoredProblemList` to the home page.
- Added `/problems/local/[problemId]`.
- Local drafts open in the existing `ProblemSolver`.
- Added authoring UI CSS and responsive layout.
- Updated `docs/000_orchestration.md`.

Verification:

- `conda run -n SKAI npm run typecheck`
- `conda run -n SKAI npm run lint`
- `conda run -n SKAI npm run build`
- `git diff --check`

Remaining:

- Supabase-backed admin create/edit/publish.
- Import JSON back into the authoring tool.
- Multiple materials and file upload extraction.
- Rubric editor and public rubric preview.
- Playbook authoring for new problems.
- Admin permission model.

Post-task philosophy check:

- New problems must declare structure, not only a freeform prompt.
- Authored drafts are immediately solvable through the same trace/graph/judge flow.
- The slice supports founder-led problem iteration without pretending to be a production CMS.
