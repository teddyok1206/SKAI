# 012 Material Drag Drop And SaaS Hardening

Date: 2026-06-01

## Goal

Make official problem materials draggable into the prompt composer as visible attachments, and tighten MVP SaaS-facing operational/security guardrails across frontend and backend.

## Rationale

Real-world task solving should feel like a modern AI workspace: materials can be selected or dragged into the next prompt, and the backend should reject oversized or invalid request shapes before they reach model providers or persistence paths.

## Scope

Included:

- Drag official material cards into the composer dropzone.
- Show dragged material as a normal attachment chip.
- Prevent duplicate material attachments.
- Add frontend upload limits for file count and file size.
- Add shared attachment normalization/validation helpers.
- Harden `/api/chat` request size, message roles, provider allowance, attachment limits, and provider failure handling.
- Harden `/api/judge` trace/final-answer payload limits.
- Harden attempt/published sync payload limits and invalid JSON handling.
- Harden `/api/comments` by verifying that target attempts are published and trace events belong to the attempt before insert.
- Add Supabase prompt comment read RLS restriction to published attempts.
- Update orchestration and decision docs.

Excluded:

- Full rate limiting with Redis/Upstash.
- Virus scanning.
- OCR/XLSX/PDF parsing.
- Per-account quotas.
- Background queueing.

## Assumptions

- Demo materials are trusted first-party problem assets.
- User-uploaded files are untrusted and should be bounded before local read/model submission.
- SaaS-grade hardening is iterative; this pass handles low-cost high-risk gaps.

## Affected Files

- `components/problem-solver.tsx`
- `lib/attachment-context.ts`
- `lib/constants.ts`
- `.env.example`
- `app/api/chat/route.ts`
- `app/api/judge/route.ts`
- `app/api/comments/route.ts`
- `app/api/attempts/sync/route.ts`
- `app/api/published/sync/route.ts`
- `supabase/migrations/002_rls_policies.sql`
- `supabase/migrations/005_prompt_comment_read_policy.sql`
- `docs/000_orchestration.md`
- `docs/technical/000_decision_register.md`

## Implementation Steps

1. Add operation guardrail constants for message, attachment, upload, and text limits.
2. Bound file conversion in `attachment-context`.
3. Add material drag payload and drop handling to the solving UI.
4. Make composer dropzone accept both files and official materials.
5. Harden chat and judge route schemas.
6. Add provider/problem compatibility check and model-provider fallback error handling.
7. Verify comment POST targets a published attempt and matching trace event.
8. Tighten prompt comment read policy.
9. Verify typecheck, lint, build, and API smoke.

## Verification

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Manual drag/drop by dragging a material card into the composer.
- API smoke for rejected invalid chat/comment payloads.

## Risks

- Frontend upload limits can surprise users if the UI copy is unclear.
- Data URL limits may reject large images until object storage/OCR is added.
- Server-side payload limits are not a substitute for edge/WAF rate limiting.

## Rollback

Revert the drag/drop UI, route validation changes, and comment policy migration. Existing attempts and published attempts remain valid.
