# 080 Solve Flow Localization

Date: 2026-06-05

## Goal

Localize the user-facing solving loop while preserving SKAI's cold-start discipline.

## Scope

Included:

- pre-attempt setup labels;
- solving mode explanatory copy;
- model selection explanatory copy;
- material panel controls;
- composer, attachment/dropzone, playbook insertion UI;
- chat workspace tabs and action labels;
- final answer, judge, publish/share notices;
- local draft fallback copy.

Excluded:

- problem title, subtitle, statement, constraints, deliverables, and material extracted text;
- raw prompt/response trace content;
- provider names and model identifiers;
- graph/viewer/share public page surfaces, handled in later slices;
- judge/coaching report prose, handled in slice 083.

## Implementation Rules

- Use the copy registry for UI labels and instructional helper text.
- Do not translate the problem payload in place. Problem content localization is slice 084 because original language can be part of the task context.
- Do not add prompt templates or coaching hints that change the cold-start conversation.
- Model/provider labels remain factual execution metadata, not ranking language.
- `Prompt`, `Response`, `Trace`, `Artifact`, `Branch`, `Replay`, and `Judge` remain protected concept terms where used.

## Verification

- `npm run verify:i18n`
- `conda run -n SKAI npm run typecheck`
- `conda run -n SKAI npm run lint`
- `conda run -n SKAI npm run build`

## Strengthened Philosophy Gate

- The solve UI may explain controls, but it must not tell users what prompt to write unless they explicitly use founder playbooks for smoke operation.
- The language layer must make material control clearer without smuggling hidden context into the model request.
- Branch/Replay labels must keep emphasizing structural diagnosis, not score optimization.

## Implementation Result

- `ProblemSolver` now reads selected locale through `useLanguagePreference`.
- Pre-attempt setup, solving mode cards, model selection cards, selected model summary, problem/material panel labels, budget labels, workspace tabs, chat empty state, answer copy button, Branch action, playbook strip, attachment dropzone, composer actions, final answer section, publish/share controls, Branch Diff fallback copy, and notices now read from the copy registry.
- `LocalProblemSolver` fallback copy now reads from the registry.
- Solving mode and model option descriptions are localized through registry keys while provider names and model ids remain factual execution metadata.
- Problem title/subtitle/statement/constraints/deliverables/material text and raw trace content remain unmodified source content.

## Verification Result

- `npm run verify:i18n`: passed; 182 entries.
- `conda run -n SKAI npm run typecheck`: passed.
- `conda run -n SKAI npm run lint`: passed.
- `conda run -n SKAI npm run build`: passed.

## Strengthened Philosophy Check

- Alignment: this slice makes the solve surface more readable in Korean/English without changing what the model sees. That preserves cold-start comparability and keeps user orchestration, not hidden system help, as the evaluated skill.
- Anti-goal check: no model leaderboard copy was added; model descriptions stay execution metadata. No prompt template or shortcut was inserted into the live chat path.
- Watchpoint: the founder playbook strip is still operationally useful for smoke tests, but it must remain clearly separate from the normal user's cold-start practice path.
