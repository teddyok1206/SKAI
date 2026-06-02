# 045 Supabase Cohort Review Dashboard

Date: 2026-06-02

## Goal

Extend the founder review dashboard beyond localStorage so smoke/demo attempts synced to Supabase can be reviewed from the admin page.

## Scope

Included:

- Add a founder cohort API route.
- Return a compact remote attempt summary with score, trace counts, branch/publish state, and estimated cost.
- Use service-role access only when the authenticated user's email is allowlisted by `SKAI_FOUNDER_EMAILS`.
- Fall back to normal authenticated Supabase reads when service role is absent or the user is not allowlisted.
- Preserve localStorage founder notes.
- Persist `solvingMode` to Supabase attempts through a new migration.
- Update the admin founder dashboard to show remote cohort and local attempts side by side.
- Update docs and decision register.

Excluded:

- Remote founder note table.
- Cross-user raw trace browsing beyond existing share links.
- HR/certification analytics.
- Export pipeline.

## Safety Rules

- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client.
- Never use service role unless a logged-in user email is explicitly allowlisted.
- If the admin route cannot safely query remote rows, return a local/fallback state rather than failing the dashboard.
- Do not replace local founder review. Local review remains useful for offline and unsynced smoke attempts.

## Implementation Steps

1. Add `solving_mode` to the Supabase attempts table.
2. Update attempt sync to write `solving_mode`.
3. Add server-only Supabase admin client helper.
4. Add `/api/founder/cohort`.
5. Add client loader in `lib/supabase-persistence.ts`.
6. Add remote cohort panel to `FounderReviewDashboard`.
7. Update docs and run verification.

## Done Criteria

- Admin dashboard can show a Supabase cohort summary when Supabase is configured and the user is authenticated.
- Service-role cohort access is guarded by founder email allowlist.
- Without service role, the route returns the current user's own attempts under RLS.
- Existing local dashboard behavior remains intact.

## Philosophy Check

Founder review is still qualitative first. This slice should not turn SKAI into a leaderboard dashboard; it should help the founder see whether real users are experiencing the intended AI-use transformation.

## Implementation Result

- Added migration `009_attempt_solving_mode.sql`.
- Updated attempt sync to persist `solving_mode`.
- Added server-only `createSupabaseAdminClient`.
- Added `/api/founder/cohort`.
- Added founder email allowlist guard via `SKAI_FOUNDER_EMAILS`.
- Added service-role cohort mode when the authenticated founder is allowlisted and `SUPABASE_SERVICE_ROLE_KEY` exists.
- Added RLS-scoped current-user fallback mode.
- Added `FounderCohortAttempt` and `FounderCohortSnapshot` types.
- Added `loadFounderCohortFromSupabase`.
- Updated the admin founder review dashboard to show remote cohort and local attempts side by side.
- Kept founder notes local for now.
- Updated orchestration and decision docs.

## Verification

- `git diff --check`: passed.
- `conda run -n SKAI npm run typecheck`: passed.
- `conda run -n SKAI npm run lint`: passed.
- `conda run -n SKAI npm run build`: passed.

## Final Philosophy Check

This keeps founder review as a smoke-test learning instrument rather than a competition dashboard. Cross-user cohort access is intentionally gated by server-only service role plus founder email allowlist; otherwise the product preserves the current authenticated user's RLS boundary.
