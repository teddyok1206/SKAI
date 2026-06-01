# 011 Shared Attempt Discussion

Date: 2026-06-01

## Goal

Add Slack-like discussion threads to shared prompt skeleton cards so learners can ask questions and leave feedback on specific orchestration moments.

## Rationale

SKAI's community value should form around how a person defined, decomposed, delegated, verified, and corrected a problem-solving process. Comments should therefore attach to trace events, not only to the whole published attempt.

## Scope

Included:

- Add `PromptComment` domain type.
- Add local comment persistence for offline/demo mode.
- Add Supabase-backed comment API routes.
- Add prompt comment metadata columns for author labels.
- Add thread UI on prompt skeleton cards.
- Support top-level comments and replies.
- Update orchestration and decision docs.

Excluded:

- Moderation queue.
- Notifications.
- Edit/delete comments.
- Rich text or markdown rendering.
- Anti-abuse controls beyond length validation.

## Assumptions

- Published attempts already contain trace event IDs.
- Existing Supabase `prompt_comments` table is the intended storage base.
- Anonymous/local comments are acceptable in demo mode, but synced remote comments require authenticated Supabase users.
- A later privacy pass will decide whether all prompt skeletons are commentable in certification mode.

## Affected Files

- `lib/types.ts`
- `lib/constants.ts`
- `lib/local-store.ts`
- `lib/supabase-persistence.ts`
- `app/api/comments/route.ts`
- `components/share-attempt-client.tsx`
- `app/globals.css`
- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/002_rls_policies.sql`
- `supabase/migrations/004_prompt_comment_metadata.sql`
- `docs/000_orchestration.md`
- `docs/technical/000_decision_register.md`

## Implementation Steps

1. Define prompt comment shape and local storage helpers.
2. Add API routes for listing and creating comments.
3. Extend Supabase prompt comment schema with `author_label`.
4. Load local comments first, then merge Supabase comments.
5. Render comments and replies inside each prompt skeleton card.
6. Add compact composer for top-level comments and replies.
7. Add CSS for thread readability without turning the page into a generic forum.
8. Verify typecheck, lint, build, and basic local comment creation.

## Verification

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Manual local comment add on a shared attempt page.

## Risks

- Without Supabase auth, comments only persist locally.
- Thread UI can visually overwhelm prompt skeleton cards if it is too loud.
- Comments should support learning around orchestration, not become generic social chatter.

## Rollback

Revert the comment API, local-store additions, share UI changes, and prompt comment metadata migration. Existing published attempt snapshots remain valid.
