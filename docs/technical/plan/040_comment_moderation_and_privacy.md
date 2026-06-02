# 040 Comment Moderation And Privacy

Date: 2026-06-02

## Goal

Add first-pass privacy and misuse guardrails for public prompt comments.

```text
comment draft
-> sanitize sensitive text
-> block obvious abuse
-> local + Supabase comment save
-> visible notice
```

## Scope

Included:

- Add shared comment moderation helper.
- Redact common sensitive strings:
  - email addresses,
  - phone-like numbers,
  - API-key-like tokens,
  - long account/card-like numbers.
- Block obvious HTML/script injection attempts and excessive-link spam.
- Apply the same helper on client and server comment routes.
- Show a small privacy notice near the comment form.
- Update orchestration docs.

Excluded:

- ML moderation API.
- Admin delete/restore queue.
- User report workflow.
- Notification system.
- Per-user bans/rate limits.

## Product Rules

- The first guardrail should be conservative and transparent.
- Do not silently preserve secrets in localStorage.
- Server-side moderation must exist even if the client is bypassed.
- Redaction is acceptable for demo comments; exact original private text should not be stored.

## Implementation Steps

1. Create `lib/comment-moderation.ts`.
2. Use it in `ShareAttemptClient` before local save.
3. Use it in `POST /api/comments` before Supabase insert.
4. Add a visible privacy notice.
5. Update CSS if needed.
6. Update `docs/000_orchestration.md`.
7. Verify typecheck, lint, build, and diff check.

## Done Criteria

- Email/phone/key-like text is redacted before local comment save.
- Server route also redacts or blocks unsafe comments.
- Obvious script/comment spam is blocked.
- User sees when a comment was blocked or sanitized.

## Risks

- Regex moderation can false-positive or miss sensitive data.
- Phone/account redaction is language/region imperfect.
- This is not sufficient for a public production community.

## Philosophy Check

SKAI's community layer asks people to discuss prompt traces and workflows. That can become sensitive quickly. This slice protects the habit of sharing by making privacy a default behavior, while acknowledging that production moderation needs a deeper system later.

## Implementation Result

Completed on 2026-06-02.

Implemented:

- Added `lib/comment-moderation.ts`.
- Client comment submission now:
  - redacts email-like text,
  - redacts phone-like text,
  - redacts API-key-like text,
  - redacts long number-like text,
  - blocks script-like content,
  - blocks comments with more than two links,
  - shows a visible saved/sanitized/blocked notice.
- Server `POST /api/comments` applies the same moderation helper before Supabase insert.
- Share page shows a privacy notice near the comment identity controls.
- Updated `docs/000_orchestration.md`.

Verification:

- `conda run -n SKAI npm run typecheck`
- `conda run -n SKAI npm run lint`
- `conda run -n SKAI npm run build`
- `git diff --check`

Remaining:

- Comment edit/delete.
- User reports and admin moderation queue.
- Per-user rate limiting.
- ML moderation API.
- Notification system.

Post-task philosophy check:

- This protects prompt trace discussion from accidentally preserving obvious private strings.
- The same rule runs on client and server, so localStorage and Supabase paths are both covered.
- The guardrail is intentionally first-pass and transparent, not presented as production-grade moderation.
