# 046 Comment Edit Delete And Reports

Date: 2026-06-02

## Goal

Move shared-attempt prompt comments from create-only MVP toward a safer community primitive.

## Scope

Included:

- Add local edit, soft-delete, and report actions.
- Add Supabase columns for `updated_at`, `deleted_at`, and `report_count`.
- Add `prompt_comment_reports` table.
- Add report-count trigger.
- Add owner-only update policy for comments.
- Add API PATCH/DELETE for comments.
- Add API POST for comment reports.
- Add UI actions on shared attempt comments and replies.
- Update docs and decision register.

Excluded:

- Notifications.
- Founder moderation queue UI.
- ML moderation.
- Hard delete.
- Admin override deletion.

## Safety Rules

- Remote comment edits/deletes are owner-only under RLS.
- Delete is soft-delete, preserving thread structure.
- Reports are separate records and do not expose reporter identity to the public client.
- Existing privacy redaction still applies to edits.

## Implementation Steps

1. Add migration for comment metadata and reports.
2. Extend `PromptComment`.
3. Add local store helpers.
4. Add PATCH/DELETE to `/api/comments`.
5. Add `/api/comments/report`.
6. Add persistence helpers.
7. Update shared-attempt UI.
8. Update docs and verify.

## Done Criteria

- A user can edit a comment locally and through Supabase when allowed.
- A user can soft-delete a comment locally and through Supabase when allowed.
- A user can report a comment.
- Report count can be displayed.
- Existing comment creation and replies still work.

## Philosophy Check

SKAI's community surface should help people discuss orchestration choices without becoming noisy or unsafe. Comment controls should preserve learning context while giving users a way to correct, withdraw, and flag problematic discussion.

## Implementation Result

- Added migration `010_prompt_comment_edit_delete_reports.sql`.
- Added `updated_at`, `deleted_at`, and `report_count` to `prompt_comments`.
- Added `prompt_comment_reports` table and report-count trigger.
- Added owner-only comment update policy.
- Extended `PromptComment` with update/delete/report metadata.
- Added local edit, soft-delete, and report helpers.
- Added PATCH and DELETE handlers to `/api/comments`.
- Added `/api/comments/report`.
- Added Supabase persistence helpers for update/delete/report.
- Added edit, delete, and report controls to shared attempt comments and replies.
- Updated orchestration and decision docs.

## Verification

- `git diff --check`: passed.
- `conda run -n SKAI npm run typecheck`: passed.
- `conda run -n SKAI npm run lint`: passed.
- `conda run -n SKAI npm run build`: passed.

## Final Philosophy Check

The implementation keeps prompt-level discussion useful without erasing learning context. Soft-delete preserves thread structure; reports create a moderation signal without immediately turning comments into a heavy moderation product.
