# 033 Golden Attempts Judge Calibration

Date: 2026-06-02

## Goal

Create repeatable golden attempt calibration for judge behavior.

```text
seed problems
-> weak / average / strong attempts
-> /api/judge
-> score ordering + judge metadata + graph annotation counts
-> calibration report
```

## Scope

Included:

- Add golden attempt samples for the three current seed problems.
- Add `scripts/judge_calibration_smoke.mjs`.
- Add `npm run calibrate:judge`.
- Call the real local SKAI `/api/judge` route.
- Record score, axis scores, judge mode, judge runs, bottlenecks, graph annotation count, and expected ordering.
- Write timestamped JSON and Markdown calibration reports.

Excluded:

- Human-reviewed final calibration labels.
- Multi-provider judge ensemble calibration.
- Persisted calibration dashboard.
- UI for founder review.

## Implementation Steps

1. Add the calibration runner.
2. Encode weak/average/strong sample traces for each seed problem.
3. Call `/api/judge` for each sample.
4. Check whether score order is `weak <= average <= strong`.
5. Write reports under `docs/technical/judge_calibration/`.
6. Update orchestration docs.
7. Verify typecheck, lint, build, and diff check.

## Done Criteria

- One command runs the calibration set:

```bash
conda run -n SKAI npm run calibrate:judge
```

- Report includes 9 samples unless filtered.
- Report explicitly says `passed`, `needs_review`, or `failed`.
- The same runner can be reused after enabling `SKAI_JUDGE_MODE=llm`.

## Risks

- Heuristic judge can over-reward keyword stuffing.
- LLM judge results will vary and require human review.
- Local server env controls judge mode; changing `.env.local` requires server restart.

## Philosophy Check

This slice starts turning SKAI's judge from a black box into an auditable system. The point is not to worship scores, but to expose whether the judge ranking matches known weak/average/strong orchestration behavior.

## Implementation Result

Completed on 2026-06-02.

Implemented:

- Added `scripts/judge_calibration_smoke.mjs`.
- Added `npm run calibrate:judge`.
- Encoded 9 golden attempt samples:
  - 3 seed problems,
  - weak / average / strong for each.
- Runner calls local `/api/judge`.
- Runner records:
  - total score,
  - axis scores,
  - judge mode/provider/model,
  - judge run metadata,
  - bottleneck labels,
  - graph annotation count,
  - weak/average/strong ordering.
- Reports are written under `docs/technical/judge_calibration/`.

Calibration result:

- status: `passed`
- judge mode: `heuristic`
- sample count: `9`
- ordering checks:
  - `ambiguous-research-brief`: weak `51`, average `62`, strong `86`
  - `club-budget-workflow`: weak `51`, average `64`, strong `74`
  - `counterfactual-product-review`: weak `53`, average `56`, strong `71`
- report:
  - `docs/technical/judge_calibration/2026-06-02T05-57-19-349Z_judge_calibration.md`
  - `docs/technical/judge_calibration/2026-06-02T05-57-19-349Z_judge_calibration.json`

Verification:

- `conda run -n SKAI npm run calibrate:judge`
- `conda run -n SKAI npm run typecheck`
- `conda run -n SKAI npm run lint`
- `conda run -n SKAI npm run build`
- `git diff --check`

Remaining:

- Re-run this exact calibration after restarting the server with `SKAI_JUDGE_MODE=llm`.
- Founder should review whether the small score gap on `counterfactual-product-review` weak/average is acceptable.
- Future LLM calibration should compare judge-native graph annotations, not only total score.
