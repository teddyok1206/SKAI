# 039 Founder Review Dashboard

Date: 2026-06-02

## Goal

Give the founder a local dashboard for reviewing smoke attempts without opening localStorage or database tables directly.

```text
local attempts
-> problem/model/mode/judge summary
-> score/cost/branch signal
-> founder note
-> next product decision
```

## Scope

Included:

- Add local attempt subscription helpers.
- Add local founder review notes.
- Add an admin dashboard section for attempts.
- Show problem, provider/model, solving mode, events, score, estimated cost, judge mode, branch status, and publish status.
- Let founder write a note per attempt.
- Update orchestration docs.

Excluded:

- Supabase-backed review dashboard.
- Cross-user analytics.
- Export CSV.
- Filtering/search/pagination.
- Automated insight generation.

## Product Rules

- Founder notes are qualitative product/research notes, not user-facing scores.
- The dashboard should reveal enough metadata to choose which trace to inspect next.
- It should stay local-first until the smoke cohort produces real data.

## Implementation Steps

1. Extend storage keys for founder review notes.
2. Add attempt subscription events and hook.
3. Add founder note helpers and hook.
4. Build `FounderReviewDashboard`.
5. Render it on the admin page.
6. Add compact table/card CSS.
7. Update `docs/000_orchestration.md`.
8. Verify typecheck, lint, build, and diff check.

## Done Criteria

- Admin page shows local attempts when they exist.
- Each attempt row shows model/mode/score/cost/branch metadata.
- Founder can save a local note per attempt.
- Notes survive refresh in localStorage.

## Risks

- Local dashboard is not enough once multiple testers use different devices.
- Notes are not synced or backed up yet.
- Without filters, the table will get crowded after many attempts.

## Philosophy Check

SKAI's first validation must be qualitative. The founder needs to read traces and decide whether the product is teaching the right thing. This dashboard helps identify which attempts deserve close reading without pretending early metrics are already final truth.

## Implementation Result

Completed on 2026-06-02.

Implemented:

- Added `FounderReviewNote`.
- Added `SKAI_STORAGE_KEYS.founderReviewNotes`.
- Added local storage helpers:
  - attempt change subscription,
  - founder note read/write,
  - founder note subscription.
- Added `lib/use-local-review.ts`.
- Added `components/founder-review-dashboard.tsx`.
- Admin page now shows:
  - attempt count,
  - judged count,
  - branch count,
  - total estimated cost,
  - per-attempt problem/model/mode/event metadata,
  - score,
  - judge mode,
  - branch trace point,
  - share link when published,
  - founder note textarea.
- Updated `docs/000_orchestration.md`.

Verification:

- `conda run -n SKAI npm run typecheck`
- `conda run -n SKAI npm run lint`
- `conda run -n SKAI npm run build`
- `git diff --check`

Remaining:

- Supabase-backed cohort review dashboard.
- Filters by problem/model/mode/judge mode.
- CSV/JSON export.
- Automatic insight extraction from founder notes.
- Direct deep-link to a selected local attempt state.

Post-task philosophy check:

- The dashboard prioritizes qualitative review instead of premature leaderboard thinking.
- It helps the founder select traces for close reading and product decisions.
- It remains local-first until real smoke cohort data justifies a synced analytics layer.
