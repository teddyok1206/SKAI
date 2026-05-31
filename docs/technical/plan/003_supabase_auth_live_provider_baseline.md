# 003 Supabase Auth Live Provider Baseline

Date: 2026-06-01

## Goal

Prepare the remaining large implementation step before real credentials are available:

- Make Google OAuth callback work with Supabase.
- Move persistence from direct client table writes to server API routes.
- Add Supabase RLS-ready policies.
- Make published attempt lookup work through server API.
- Make provider key setup explicit so a real API key can be dropped into `.env.local` and tested.

## Scope

Included:

- Supabase server client helper.
- Supabase OAuth callback route.
- Attempt sync API route.
- Published attempt lookup API route.
- Client persistence helper that calls the server API and falls back to local mode.
- RLS policy migration for MVP tables.
- README instructions for Supabase and provider keys.

Excluded until credentials arrive:

- Actually creating/configuring the Supabase project.
- Actually verifying Google OAuth against Supabase.
- Actually calling a live provider with a real API key.
- Production RLS hardening.

## Assumptions

- LocalStorage remains the no-key fallback.
- `.env.local` will eventually include Supabase URL/anon key and at least one provider key.
- Supabase server routes can use the authenticated user session from cookies after OAuth callback.
- If Supabase is not configured, API routes must return local/no-op responses instead of failing.

## Affected Files

- `lib/supabase-server.ts`
- `lib/supabase-persistence.ts`
- `app/auth/callback/route.ts`
- `app/api/attempts/sync/route.ts`
- `app/api/published/[attemptId]/route.ts`
- `components/auth-status.tsx`
- `components/share-attempt-client.tsx`
- `supabase/migrations/002_rls_policies.sql`
- `README.md`

## Verification

- `npm audit --audit-level=moderate`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `POST /api/attempts/sync` returns local mode when Supabase is absent.
- `GET /api/published/nonexistent` returns 404/local-safe JSON when Supabase is absent.

## Risks

- Full OAuth cannot be verified without real Supabase credentials and allowed redirect URLs.
- RLS policies are MVP-friendly and should be revisited before real user data.
- Live provider call still depends on the API key the user will provide.

## Implementation Status

Status: implemented as credential-ready baseline.

Completed:

- Supabase server client helper.
- OAuth callback route at `/auth/callback`.
- Auth UI now redirects through the callback route.
- Server-side attempt sync route.
- Server-side published-attempt sync route.
- Server-side published-attempt lookup route.
- Client persistence helper now uses server API routes.
- RLS migration for MVP tables.
- README setup notes for Supabase and live provider keys.

Verification completed:

- `conda run -n SKAI npm audit --audit-level=moderate`
- `conda run -n SKAI npm run typecheck`
- `conda run -n SKAI npm run lint`
- `conda run -n SKAI npm run build`
- `POST /api/attempts/sync` local fallback smoke when Supabase is absent.
- `GET /api/published/nonexistent` local fallback smoke when Supabase is absent.

Still requires credentials:

- Supabase project URL and anon key.
- Google OAuth provider configured in Supabase.
- Live model provider API key.
