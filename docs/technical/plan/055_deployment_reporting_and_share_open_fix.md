# 055 Deployment Reporting And Share Open Fix

## Goal

Update agent operating rules for the new Vercel deployment workflow and harden the share-open path after publishing an attempt.

## Scope

- Add local/commit/push/Vercel reporting rules to `AGENT.md`.
- Make publish sync observable instead of fire-and-forget.
- Keep `공유 보기` disabled/loading until the local publish snapshot is saved and Supabase sync has completed or safely fallen back.
- Add share page loading/fallback state so remote fetch races do not immediately look like missing content.
- Preserve localStorage fallback for same-browser demos.

## Assumptions

- Vercel production URL exists: `https://skai-sable.vercel.app/`.
- Normal code changes should be committed; push/Vercel deployment should be explicitly reported and only performed when requested or clearly required.
- The current share bug likely comes from an asynchronous publish/sync/read race or an unclear fallback state.

## Affected Files

- `AGENT.md`
- `components/problem-solver.tsx`
- `components/share-attempt-client.tsx`
- `lib/supabase-persistence.ts`
- `docs/000_orchestration.md`

## Implementation Steps

1. Add Git/Vercel reporting rules to `AGENT.md`.
2. Return a sync result from `syncPublishedAttemptToSupabase`.
3. Make `publishAttempt` async and expose publishing state/notice.
4. Render `공유 보기` only after a share URL is ready and make it an absolute URL anchor.
5. Add loading state to shared attempt page while Supabase/local fallback is being checked.
6. Verify typecheck/lint/build.

## Verification

- Run `git diff --check`.
- Run `conda run -n SKAI npm run typecheck`.
- Run `conda run -n SKAI npm run lint`.
- Run `conda run -n SKAI npm run build`.

## Implementation Result

- Added Git/Vercel reporting rules to `AGENT.md`.
- Changed Supabase sync helpers to return sync results instead of silently swallowing all status.
- Made publish async and ordered as local published snapshot -> local published attempt state -> remote attempt sync -> remote published snapshot sync.
- Added publishing state and share sync notice to the problem solver.
- Changed `공유 보기` to use the generated absolute share URL.
- Reworked shared attempt loading to show an explicit loading state while checking Supabase/local fallback.
- Preserved existing local published snapshots when a remote snapshot is loaded.

## Verification Result

- `git diff --check`: passed.
- `conda run -n SKAI npm run typecheck`: passed.
- `conda run -n SKAI npm run lint`: passed after moving share-page state updates out of the synchronous effect body.
- `conda run -n SKAI npm run build`: passed.

## Philosophy Check

Publishing and sharing are part of SKAI's learning loop. The UI should make the trace artifact reliable and understandable rather than pretending a share succeeded when the artifact is not yet readable.
