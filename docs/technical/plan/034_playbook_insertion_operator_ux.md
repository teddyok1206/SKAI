# 034 Playbook Insertion Operator UX

Date: 2026-06-02

## Goal

Let the founder and smoke testers create repeatable sample attempts without hand-typing every prompt.

```text
problem playbook
-> visible composer insertion
-> optional material attachment
-> normal Send flow
-> ordinary trace + graph + judge pipeline
```

## Scope

Included:

- Add a typed playbook data module for the three seed problems.
- Show compact playbook turn controls inside the solver composer.
- Insert the selected turn into the visible prompt composer.
- Attach required official problem materials for playbook turns that need them.
- Add an optional final answer draft insertion control.
- Update orchestration docs.

Excluded:

- Automatic sending.
- Hidden prompt injection.
- Dynamic LLM-generated playbooks.
- Admin UI for editing playbooks.
- Per-user playbook progress persistence.

## Product Rules

- A playbook turn is only an operator-visible draft. The operator can edit it before sending, and the normal learner path must not expose this playbook panel.
- Required materials are added as normal visible attachment chips.
- Existing composer text is not discarded. New playbook text appends below it.
- The UI should stay compact enough to preserve the chat-first workflow.
- This is an operator/smoke UX, not a second hidden instruction layer.

## Implementation Steps

1. Create `data/problem-playbooks.ts`.
2. Mirror the current Markdown playbooks into typed prompt turns.
3. Import the playbook in `ProblemSolver`.
4. Add `insertPlaybookTurn` and `insertFinalAnswerDraft` helpers.
5. Render a compact `Playbook` strip above the attachment dropzone.
6. Style the strip in `app/globals.css`.
7. Update `docs/000_orchestration.md`.
8. Verify typecheck, lint, build, and diff check.

## Done Criteria

- Every seed problem shows playbook turn buttons.
- Clicking a turn visibly inserts text into the composer.
- `club-budget-workflow` Turn 1 also attaches all three official materials.
- Clicking final draft visibly fills/appends the final answer field.
- No playbook text is sent unless the user presses `Send`.

## Risks

- Long prompt text can make the composer feel heavy.
- If the shortcut feels like a fixed answer key, it could weaken SKAI's anti-template philosophy.
- Playbook data can drift from `docs/problem_playbooks/` unless future authoring centralizes it.

## Philosophy Check

This slice is acceptable only because it exposes the orchestration skeleton instead of hiding it. The user still sees, edits, sends, branches, and is judged on the prompt flow. The goal is not to force a single correct prompt, but to make repeatable founder smoke testing and future problem authoring easier.

## Implementation Result

Completed on 2026-06-02.

Implemented:

- Added `data/problem-playbooks.ts`.
- Added typed playbook turns for all three seed problems.
- Added compact `Playbook` controls inside the solver composer.
- Clicking a turn appends the prompt into the visible composer.
- `club-budget-workflow` Turn 1 attaches all three official materials as visible attachment chips.
- Added a `Final draft` insertion button that fills or appends the final answer draft.
- Updated orchestration docs to mark this slice complete and capture the remaining source-of-truth gap.

Verification:

- `conda run -n SKAI npm run typecheck`
- `conda run -n SKAI npm run lint`
- `conda run -n SKAI npm run build`
- `git diff --check`

Remaining:

- Consolidate Markdown playbooks and typed app playbooks into one authoring source later.
- Add admin authoring support so future problems can define playbook turns without code edits.
- Consider tracking which playbook turn seeded a prompt as metadata, but only if it remains visible and auditable.

Post-task philosophy check:

- The implementation does not add hidden context.
- The model still sees only normal visible user messages plus visible attachments.
- The shortcut supports founder smoke testing and education without treating the playbook as a canonical answer.
