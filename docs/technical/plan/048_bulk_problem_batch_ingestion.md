# 048 Bulk Problem Batch Ingestion

Date: 2026-06-02

## Goal

Review the generated 30-problem batch, fix schema/product mismatches, preserve the raw generated artifact in the proper archive location, and make the usable problems available to the demo app.

## Scope

Included:

- Validate the generated JSON batch for enum mismatches, duplicate ids, missing fields, material metadata, and privacy risks.
- Normalize generated problem records into app-compatible `Problem` objects.
- Normalize generated playbooks into `ProblemPlaybook` objects.
- Preserve the original generated batch under `docs/problem_generation/batches/`.
- Update orchestration docs and verification notes.

Excluded:

- Creating real binary assets for synthetic `href` files.
- Supabase-backed bulk import UI.
- Manual editorial rewrite of all 30 problems beyond schema/safety corrections.
- Changing the core problem schema unless validation proves it is necessary.

## Assumptions

- Generated materials can use extracted text as the source of truth even if `href` points to synthetic paths.
- The first ingestion can live in typed app data rather than remote DB.
- Classification metadata should be preserved if feasible, but the current app only requires `Problem`.

## Affected Files

- `data/problems.ts`
- `data/problem-playbooks.ts`
- `data/generated-problem-batch-001.ts` or equivalent if a separate module is cleaner
- `docs/problem_generation/batches/001_30problems.json`
- `docs/000_orchestration.md`
- `docs/technical/000_decision_register.md`

## Implementation Steps

1. Run an automated validation summary on the raw generated JSON.
2. Decide whether to import all 30 or quarantine specific records.
3. Add a typed normalized module for generated problems/playbooks/classification.
4. Append/import generated problems into the app problem list.
5. Append/import generated playbooks into the operator playbook list.
6. Move the raw generated JSON to `docs/problem_generation/batches/`.
7. Verify typecheck, lint, build, and diff check.

## Risks

- Generated playbook mode names may not match current solving mode labels.
- Generated problem `href` paths may imply files that do not exist; the app should rely on `extractedText` for now.
- Some problems may contain high-risk domains; these must stay at structure/checklist level.
- Importing 30 problems may make the home list dense before filtering/search is improved.

## Rollback

- Remove the generated batch module imports from `data/problems.ts` and `data/problem-playbooks.ts`.
- Keep the archived raw batch for later reprocessing.

## Philosophy Check

Bulk authoring must increase the diversity of real unclear problems without turning SKAI into a prompt gallery. Each imported problem should still require problem definition, decomposition, material use, verification, and a multi-turn trace.

## Review Result

Raw batch:

- File moved from project root to `docs/problem_generation/batches/001_30problems.json`.
- Count: 30 problems.
- Category coverage: 5 each across workplace, research, creative, data_analysis, coding, strategy.
- Difficulty coverage: intro 8, standard 14, advanced 8.
- Goal profile coverage: 5 each across all 6 current profiles.
- Material coverage: text 52, spreadsheet 9, image 1, pdf 4, csv 12.
- Automated checks found no duplicate problem ids, invalid app enum values, missing material extracted text, broken attachment ids, or obvious phone/API-key-like sensitive strings.

Corrections made:

- Generated playbook mode labels were not SKAI app mode labels:
  - `evidence-grounded` -> `Material Grounded`
  - `multi-step-replay` -> `Verification Drill`
  - `guided-collaboration` -> `Single Model`
- Generated model label `strong-general-reasoning-model` was normalized to an operator-facing live smoke recommendation.
- Generated synthetic `href` values under `/synthetic/skai/` were removed at import time because no real binary files exist for them.
- Image material previews now expose extracted text in the pre-attempt material viewer.

## Implementation Result

Completed:

- Added `data/generated-problem-batch-001.ts`.
- Imported generated problems into `data/problems.ts` after the original seed problems.
- Imported generated playbooks into `data/problem-playbooks.ts` after the original seed playbooks.
- Preserved generated classification and review notes as exported batch metadata for later search/research features.
- Updated orchestration and decision register docs.

## Verification

- `git diff --check`
- `conda run -n SKAI npm run typecheck`
- `conda run -n SKAI npm run lint`
- `conda run -n SKAI npm run build`

All passed on 2026-06-02.

## Final Philosophy Check

This ingestion supports SKAI's core direction because it increases the diversity of realistic unclear tasks while preserving multi-turn playbooks, material grounding, failure patterns, and graph-oriented classification metadata. The main watchpoint is that the home problem list is now much larger without search/filter UI, so the next product slice should consider browsing and curation before adding another large batch.
