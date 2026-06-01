# 020 Problem Prompt Playbooks

Date: 2026-06-02

## Goal

Create paste-ready prompt playbooks for every demo problem so the founder can run realistic attempts quickly without manually typing long prompts.

## Rationale

Live chat is now strict cold-start: the selected model receives only visible trace messages and explicitly attached files/materials. Therefore a demo runner needs a practical script that includes enough context in the first user prompt.

These playbooks also become a problem-authoring quality gate. If the author cannot write a plausible prompt sequence for a problem, the problem is probably underspecified, untestable, or weak as an orchestration exercise.

## Scope

Included:

- Add a `docs/problem_playbooks/` directory.
- Add one playbook per current problem.
- Include exact prompt blocks to paste into the composer.
- Include attachment instructions where relevant.
- Include an optional final-answer field draft.
- Update `AGENT.md` so future problem additions require a playbook.
- Add a decision record.

Excluded:

- UI automation that inserts playbook prompts.
- Seed attempts generated into local storage.
- Changing problem definitions or rubrics.

## Playbook Rules

- The first prompt must be self-contained enough for a cold-start model.
- Do not rely on hidden SKAI problem background.
- If the problem has official materials, specify which files to attach before sending each prompt.
- Prompts should demonstrate the target orchestration behavior without becoming a canonical answer users must copy.
- Keep a distinction between prompt text and final-answer field text.

## Verification

- Markdown files render as normal docs.
- `AGENT.md` includes the future authoring rule.
- `rg` can find each problem id in `docs/problem_playbooks/`.

## Philosophy Check

Prompt playbooks should not turn SKAI into a prompt gallery. They are founder/operator scripts and authoring test fixtures. Their purpose is to verify that a problem can elicit problem definition, decomposition, material use, verification, and final synthesis in a realistic trace.
