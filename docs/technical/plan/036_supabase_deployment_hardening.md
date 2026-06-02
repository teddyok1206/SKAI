# 036 Supabase Deployment Hardening

Date: 2026-06-02

## Goal

Make the Supabase-backed demo safer and easier to validate before a deployed smoke test.

```text
env health
-> OAuth readiness
-> Supabase sync boundary
-> RLS checklist
-> deployed smoke confidence
```

## Scope

Included:

- Add a deployment health helper and API route that reports configuration status without exposing secrets.
- Add provider/judge/Supabase environment checks.
- Harden attempt sync so production does not blindly upsert client-supplied problem payloads.
- Add a deployment migration/checklist for seeding demo problems and tightening problem RLS.
- Update `.env.example`.
- Update orchestration docs.

Excluded:

- Applying migrations to the live Supabase project.
- Full Vercel deployment.
- Service-role admin backend.
- Object storage and file virus scanning.
- Production moderation, notification, or billing ledger.

## Implementation Steps

1. Create `lib/deployment-health.ts`.
2. Add `GET /api/deployment/health`.
3. Change `POST /api/attempts/sync` problem handling:
   - check if the problem exists,
   - seed only in dev or when explicitly enabled,
   - do not update existing problem definitions from client payload.
4. Add a Supabase SQL migration that:
   - inserts the three current demo problems,
   - removes broad authenticated problem insert/update policies.
5. Add a technical deployment checklist.
6. Update `.env.example`.
7. Update `docs/000_orchestration.md`.
8. Verify typecheck, lint, build, and diff check.

## Done Criteria

- `/api/deployment/health` returns pass/warn/fail checks.
- The health route never returns actual secret values.
- Production attempt sync does not mutate `problems` from client-submitted data.
- There is a concrete Supabase checklist for OAuth redirect, RLS, and smoke flow.

## Risks

- A fresh Supabase project must seed problems before production sync works.
- Existing Supabase projects may still have older broad RLS policies until the new migration is applied.
- The health route can only validate env presence and basic shape, not dashboard-side OAuth provider correctness.
- Local fallback can still hide remote sync failures if the founder does not inspect health/sync responses.

## Philosophy Check

This slice supports trust. SKAI asks users to expose their AI work process, so the infrastructure must be explicit about what is local, what is synced, and what is public. The hardening work is not glamorous, but it protects the community and research layer that SKAI eventually wants to build.

## Implementation Result

Completed on 2026-06-02.

Implemented:

- Added `lib/deployment-health.ts`.
- Added `GET /api/deployment/health`.
- Health checks cover:
  - Supabase URL shape,
  - Supabase anon key presence,
  - at least one live provider key,
  - LLM judge provider key when LLM judge is enabled,
  - counterfactual judge provider key when LLM mode is enabled,
  - production problem sync policy,
  - explicit KRW/USD estimate configuration.
- Hardened `POST /api/attempts/sync`:
  - existing problem rows are no longer overwritten from client-submitted payloads,
  - missing problems are inserted only outside production or when `SKAI_ALLOW_AUTHENTICATED_PROBLEM_SYNC=true`,
  - production returns `problem_not_seeded` if the DB was not prepared.
- Added `supabase/migrations/008_seed_demo_problems_and_harden_problem_rls.sql`.
- Added `docs/technical/013_supabase_deployment_checklist.md`.
- Updated `.env.example`.
- Updated `docs/000_orchestration.md`.

Local health result:

- `status`: `warn`
- Supabase URL/key: `pass`
- live provider key: `pass` with `gemini`
- judge provider key: `pass` because judge mode is heuristic
- counterfactual judge key: `pass` because LLM mode is off
- problem sync policy: `pass`
- KRW/USD estimate: `warn` because local env uses the default rough estimate

Verification:

- `conda run -n SKAI npm run typecheck`
- `conda run -n SKAI npm run lint`
- `conda run -n SKAI npm run build`
- `git diff --check`
- `curl -s http://127.0.0.1:3000/api/deployment/health`

Remaining:

- Apply Supabase migration `008` to the actual project.
- Set `NEXT_PUBLIC_SKAI_KRW_PER_USD_ESTIMATE` explicitly for deployed demos.
- Run a deployed smoke through login, attempt sync, judge, publish, share, and comment.
- Add object storage, upload scanning, moderation, and spend ledger in later slices.

Post-task philosophy check:

- This slice makes remote persistence boundaries explicit.
- It reduces the chance that a learner can mutate shared problem definitions.
- It keeps local demo fallback but gives the founder a route to see when the remote layer is only partially ready.
