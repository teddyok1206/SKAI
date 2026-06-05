# Supabase Deployment Checklist

Date: 2026-06-02

## Purpose

This checklist is for the first deployed SKAI smoke test with Supabase Auth and persistence enabled.

## Required Environment

Set these in the deployment provider:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SKAI_KRW_PER_USD_ESTIMATE=1400
```

Set at least one live model key:

```bash
GEMINI_API_KEY=
GROQ_API_KEY=
XAI_API_KEY=
OPENAI_API_KEY=
OPENROUTER_API_KEY=
```

Keep these server-only:

```bash
SKAI_JUDGE_MODE=llm
SKAI_JUDGE_PROVIDER=gemini
SKAI_JUDGE_MODEL=gemini-2.5-flash-lite
SKAI_JUDGE_GEMINI_API_KEY=
SKAI_COUNTERFACTUAL_JUDGE_MODE=heuristic
SKAI_ALLOW_AUTHENTICATED_PROBLEM_SYNC=false
```

Do not expose service-role keys to the browser. The current app does not require a service-role key for the demo path.

`GEMINI_API_KEY` is for user-selected solving traffic. `SKAI_JUDGE_GEMINI_API_KEY` is for SKAI's backend judge traffic. Production smoke must configure the judge-specific key so judge calls can be budgeted, rotated, and rate-limited independently from learner chat. Local development can opt into temporary fallback with `SKAI_ALLOW_JUDGE_GEMINI_KEY_FALLBACK=true`, but this should not be used in production.

## Supabase Migrations

Apply migrations in order:

```text
001_initial_schema.sql
002_rls_policies.sql
003_score_report_judge_metadata.sql
004_prompt_comment_metadata.sql
004_score_report_graph_annotations.sql
005_prompt_comment_read_policy.sql
006_branch_replay_metadata.sql
007_counterfactual_report.sql
008_seed_demo_problems_and_harden_problem_rls.sql
009_attempt_solving_mode.sql
010_prompt_comment_edit_delete_reports.sql
011_user_profiles.sql
```

Migration `008` does two important things:

- seeds the three current demo problems,
- removes broad authenticated insert/update policies on `public.problems`.

After `008`, normal learners should not be able to mutate problem definitions through Supabase RLS.

## Google OAuth

Supabase Dashboard:

- Enable Google provider.
- Set the Google client ID and client secret.
- Add the deployed app URL to allowed redirect URLs.
- Include:

```text
https://YOUR_DOMAIN/auth/callback
http://localhost:3000/auth/callback
```

Google Cloud Console:

- OAuth app name can be set to `SKAI`; this controls the user-facing consent label better than the Supabase project hash.
- Authorized redirect URI should include the Supabase callback URL from the Supabase Google provider page.

## Health Check

After deployment, open:

```text
/api/deployment/health
```

Expected before external smoke:

- Supabase URL: pass
- Supabase anon key: pass
- Live provider key: pass
- LLM judge provider key: pass. If judge uses Gemini, `SKAI_JUDGE_GEMINI_API_KEY` should be configured.
- Problem sync policy: pass

This endpoint returns booleans/status text only. It must never expose actual secret values.

## Smoke Flow

Run this once after login:

```text
problem -> mode/model -> playbook turn -> send -> graph -> submit -> publish -> share URL -> comment
```

Confirm:

- Login survives refresh.
- Attempt appears in Supabase `attempts`.
- Trace rows appear in `trace_events`.
- Score report appears after judge.
- Published attempt appears in `published_attempts`.
- Share page loads while logged out.
- Comment insert requires login.
- Prompt comments are readable only when the attempt is published.

## RLS Review

Expected access:

- `problems`: public read for published problems; no learner insert/update after migration `008`.
- `attempts`: user can read/write own attempts only.
- `trace_events`: user can read/write rows belonging to own attempts only.
- `score_reports`: user can read/write rows belonging to own attempts only.
- `judge_runs`: user can read/write rows belonging to own attempts only.
- `published_attempts`: public read; owner insert/update only.
- `prompt_comments`: public read only for published attempts; authenticated insert only.

## Known Limits

- No production moderation queue yet.
- No virus scanning or object storage for uploads yet.
- No per-user spending ledger or rate limit yet.
- No HR-grade certification or anti-cheat yet.
- Local fallback can hide remote sync failure unless the founder checks Supabase rows.
