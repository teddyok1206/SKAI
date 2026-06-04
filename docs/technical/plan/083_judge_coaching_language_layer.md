# 083 Judge Coaching Language Layer

Date: 2026-06-05

## Goal

Make judge/coaching outputs locale-aware at the data boundary instead of treating them as UI strings.

## Scope

Included:

- send selected UI locale to `/api/judge`;
- store `locale`, `sourceLocale`, and `translationStatus` metadata on `ScoreReport`;
- include locale metadata hooks on optional `.skai` judge/coaching extensions;
- make heuristic judge prose minimally bilingual;
- instruct LLM judge to write human-facing prose in the requested locale;
- localize `ScoreReportCard` chrome.

Excluded:

- translating old score reports;
- separate bilingual coaching extensions for the same graph;
- problem content localization;
- human review override localization.

## Implementation Rules

- Score report prose is generated content, not regular UI copy.
- UI labels come from the copy registry; generated judge/coaching prose records its locale metadata.
- `.skai` core remains language-neutral. Judge/coaching language belongs to report metadata or optional extensions.
- LLM judge prompt must explicitly state the requested prose language.

## Verification

- `npm run verify:i18n`
- `conda run -n SKAI npm run typecheck`
- `conda run -n SKAI npm run lint`
- `conda run -n SKAI npm run build`

## Strengthened Philosophy Gate

- Locale-aware coaching should improve learning clarity without turning feedback into fake precision.
- The judge still evaluates human orchestration, not model performance.
- Generated prose must remain tied to graph/trace ids through stable report fields, not translated detached summaries.

## Implementation Result

- `/api/judge` accepts `locale: "ko" | "en"` and defaults to Korean for old requests.
- `ProblemSolver` sends the selected UI locale when submitting to judge.
- `ScoreReport` now supports optional `locale`, `sourceLocale`, and `translationStatus` metadata.
- Optional `.skai` judge/coaching extension base now supports the same locale metadata.
- Heuristic judge now produces core coach summary, axis labels/rationales, bottlenecks, workflow fallback, practice targets, and disagreement/fallback notes in the requested locale.
- LLM judge prompt now explicitly instructs the provider to write human-facing fields in the requested locale.
- `ScoreReportCard` chrome reads from the copy registry and displays report locale metadata when available.
- `Intelligence Mirror` summaries follow `report.locale` for Korean/English.

## Verification Result

- `npm run verify:i18n`: passed; 366 entries.
- `conda run -n SKAI npm run typecheck`: passed.
- `conda run -n SKAI npm run lint`: passed.
- `conda run -n SKAI npm run build`: passed.

## Strengthened Philosophy Check

- Alignment: judge/coaching language is now part of the report contract, not hidden UI translation. This protects the audit trail and keeps feedback tied to the original judged attempt.
- Anti-goal check: no new scoring gamification was added. The score remains symbolic and the feedback remains process-oriented.
- Watchpoint: future bilingual coaching for the same graph should be represented as a separate versioned extension or report layer, not by overwriting the source report prose.
