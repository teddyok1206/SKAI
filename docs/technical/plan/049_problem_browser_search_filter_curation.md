# 049 Problem Browser Search Filter Curation

Date: 2026-06-02

## Goal

Add a clear home problem browser now that the app has 33 problems.

## Scope

Included:

- Replace the static home problem grid with a client-side browser.
- Add keyword search across problem title, subtitle, statement, user goal, constraints, deliverables, material text, and generated classification metadata.
- Add filters for category, difficulty, goal profile, material profile, and curation lane.
- Add small result summary and reset action.
- Preserve the first-problem hero action and authored/local problem section.
- Keep generated classification metadata as optional enrichment, not as a hard dependency for seed problems.
- Update docs and verification.

Excluded:

- Server-side search index.
- Supabase-backed problem discovery.
- Full personalized recommendation engine.
- Pagination or infinite scroll.
- Changing the problem schema.

## Design Direction

The browser should feel like a compact work surface rather than a marketplace. Filters should help a learner choose a training situation:

- quick start,
- material-heavy,
- verification practice,
- advanced replay,
- no-material framing.

The UI must keep model choice out of problem discovery. Model choice still happens before solving the selected problem.

## Affected Files

- `app/page.tsx`
- `components/problem-browser.tsx`
- `app/globals.css`
- `docs/000_orchestration.md`
- `docs/technical/000_decision_register.md`

## Implementation Steps

1. Add a `ProblemBrowser` client component.
2. Move home problem grid rendering into the browser.
3. Add search/filter/curation derivation helpers.
4. Wire generated classification metadata into the home page.
5. Add responsive CSS.
6. Verify typecheck, lint, build, and diff check.

## Risks

- Too many filters can make the first screen feel like admin tooling.
- Curation lanes may accidentally imply a single correct path. Keep them as discovery aids, not scoring categories.
- Search over extracted material text may match hidden details; this is fine for authored official problem materials but should be reconsidered when private/user-uploaded material enters problem discovery.

## Rollback

- Restore the old static grid in `app/page.tsx`.
- Remove `components/problem-browser.tsx` and associated CSS.

## Philosophy Check

Problem discovery should guide users toward the kind of orchestration skill they want to practice, not toward model comparison or point farming. The browser should make the diversity of unclear real-world tasks legible.

## Implementation Result

Completed:

- Added `components/problem-browser.tsx`.
- Replaced the static home problem grid with the browser.
- Added keyword search over problem fields, materials, and generated classification metadata.
- Added filters for category, difficulty, goal profile, material kind, and curation lane.
- Added result count, top domain summary, reset action, and empty state.
- Kept authored/local problem list separate.
- Updated orchestration and decision register docs.

## Verification

- `git diff --check`
- `conda run -n SKAI npm run typecheck`
- `conda run -n SKAI npm run lint`
- `conda run -n SKAI npm run build`
- Local server responded at `http://127.0.0.1:3000` with HTTP 200.

All passed on 2026-06-02.

## Final Philosophy Check

The browser keeps discovery centered on the user's practice target: real-world domain, ambiguity level, materials, verification, and problem definition. It does not turn model choice into the browsing axis, preserving SKAI's separation between problem discovery and attempt-level model selection. The next watchpoint is curation quality after actual smoke logs: the lanes should be tuned from observed user behavior rather than becoming arbitrary labels.
