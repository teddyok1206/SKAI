# 025 Google Login Integration

Date: 2026-06-02

## Goal

Make the already-decided Google login path reliable enough for local and deployed smoke tests.

## Scope

Included:

- Harden the Supabase Google OAuth start button.
- Preserve the current page through the OAuth callback.
- Sanitize callback redirects to avoid open redirect behavior.
- Surface OAuth/configuration errors in a simple URL state.
- Refresh the app shell after sign-in/sign-out so authenticated sync paths can pick up the new session.
- Update setup docs and orchestration state.

Excluded:

- Creating the Supabase project or Google Cloud OAuth client.
- Adding email/password or GitHub login.
- Full deployed OAuth verification.
- Auth-gated pages or role-based access control.

## Assumptions

- Supabase remains the MVP auth provider.
- Google OAuth is configured in Supabase Dashboard outside the codebase.
- `.env.local` contains `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` when auth is enabled.
- The app must still run in local demo mode when Supabase env vars are absent.

## Affected Files

- `components/auth-status.tsx`
- `app/auth/callback/route.ts`
- `README.md`
- `docs/000_orchestration.md`

## Data Model Or API Changes

No database schema changes.

The existing callback route keeps the same path:

```text
GET /auth/callback
```

It now treats `next` as a local-only redirect path.

## Implementation Steps

1. Update `AuthStatus` to compute `next` from the current path/search params.
2. Build a callback URL with `next` embedded.
3. Add pending/error UI states for sign-in/sign-out actions.
4. Refresh the router after auth state changes and sign-out.
5. Harden `/auth/callback`:
   - handle OAuth `error`,
   - require `code`,
   - sanitize `next`,
   - redirect with a compact auth status query on failure.
6. Update README with exact Supabase/Google redirect settings.
7. Update `docs/000_orchestration.md` current state/gap wording.

## Verification Steps

- `conda run -n SKAI npm run typecheck`
- `conda run -n SKAI npm run lint`
- `conda run -n SKAI npm run build`
- Restart dev server.
- Manual check:
  - without Supabase env vars, topbar shows local demo mode;
  - with Supabase env vars, Google button starts OAuth;
  - callback rejects missing code safely;
  - callback does not redirect to external domains through `next`.

## Risks

- Supabase dashboard redirect URL mismatch can still break OAuth.
- Google provider configuration lives outside the repo and cannot be fully verified without credentials.
- Query-bearing callback URLs may require matching redirect allowlist settings in Supabase.

## Rollback Notes

Revert `AuthStatus` and callback route changes. The app will return to the older direct OAuth button and callback behavior.

## Philosophy Check

Google login is not a core learning feature, but it supports trace ownership, persistence, sharing, comments, and founder review. The implementation must stay quiet and infrastructural, not become a product focus.
