# Vercel First Deployment Guide

Date: 2026-06-03

## Purpose

This is the step-by-step guide for putting SKAI on the public web for the first external WAN smoke test.

Recommended deployment shape:

```text
User browser
  -> Vercel-hosted Next.js app
  -> Supabase Auth / Postgres
  -> Gemini/Groq/xAI/OpenAI provider APIs
```

Do not expose the MacBook directly to the public internet as the default strategy. Use the Mac for local development and emergency demos; use Vercel for WAN users.

Official references checked:

- Vercel Git deployments: https://vercel.com/docs/git
- Vercel environment variables: https://vercel.com/docs/environment-variables
- Vercel sensitive environment variables: https://vercel.com/docs/environment-variables/sensitive-environment-variables
- Supabase redirect URLs: https://supabase.com/docs/guides/auth/redirect-urls

## Mental Model

Vercel will run this Next.js app. It does not automatically read your local `.env.local`. Every production secret or public config value must be added in the Vercel project settings.

Supabase remains the database and auth system. Google OAuth still goes through Supabase first, then Supabase sends the user back to SKAI at:

```text
https://YOUR_VERCEL_DOMAIN/auth/callback
```

The SKAI app then exchanges the auth code and returns the user to the page they started from.

## Before You Start

You need:

- A GitHub repository containing the latest SKAI code.
- A Vercel account.
- The Supabase project where Google login already works locally.
- At least one model API key. For the first deployment, use Gemini unless deliberately testing Groq/xAI.
- Access to the email account that should be the founder/admin account.

Check local repo state:

```bash
git status --short
git remote -v
git log --oneline -5
```

Expected:

- `git status --short` should be empty before pushing.
- `git remote -v` should include `https://github.com/teddyok1206/SKAI.git`.
- The latest commit should include recent logo/home/deployment docs if those are intended for the public test.

Push to GitHub:

```bash
git push origin main
```

If this fails, fix GitHub auth before touching Vercel.

## Step 1: Verify Supabase Migrations

In Supabase Dashboard:

```text
Project -> SQL Editor
```

Confirm that the schema has already been created. If this is a fresh Supabase project, apply the migration files in order:

```text
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_rls_policies.sql
supabase/migrations/003_score_report_judge_metadata.sql
supabase/migrations/004_prompt_comment_metadata.sql
supabase/migrations/004_score_report_graph_annotations.sql
supabase/migrations/005_prompt_comment_read_policy.sql
supabase/migrations/006_branch_replay_metadata.sql
supabase/migrations/007_counterfactual_report.sql
supabase/migrations/008_seed_demo_problems_and_harden_problem_rls.sql
supabase/migrations/009_attempt_solving_mode.sql
supabase/migrations/010_prompt_comment_edit_delete_reports.sql
supabase/migrations/011_user_profiles.sql
```

Important:

- Do not blindly re-run migrations on a project that already has them. Some migrations create tables/policies and can fail if repeated.
- If unsure, open Supabase Table Editor and check whether these tables exist:

```text
problems
attempts
trace_events
score_reports
judge_runs
published_attempts
prompt_comments
prompt_comment_reports
```

For the first deployment, it is acceptable if generated problem publish state is still local-only. The seed problems should exist in app code and, after migration `008`, in Supabase.

## Step 2: Prepare Supabase Values

In Supabase Dashboard:

```text
Project Settings -> API
```

Copy:

```bash
NEXT_PUBLIC_SUPABASE_URL=<Project URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
```

Do not copy the service role key unless you intentionally need founder cohort all-user admin mode.

Optional founder admin mode:

```bash
SUPABASE_SERVICE_ROLE_KEY=<service_role secret>
SKAI_FOUNDER_EMAILS=<your-google-email@example.com>
```

Rules:

- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is public-by-design for browser clients.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only and powerful. Never put it in frontend code. Never prefix it with `NEXT_PUBLIC_`.
- If using `SUPABASE_SERVICE_ROLE_KEY` in Vercel, mark it as sensitive.

For the first smoke test, you can skip `SUPABASE_SERVICE_ROLE_KEY`. The app still works, but the founder cohort dashboard will only see data allowed by normal RLS unless service-role mode is configured.

## Step 3: Create The Vercel Project

Open:

```text
https://vercel.com/dashboard
```

Click:

```text
Add New... -> Project
```

Import from GitHub:

```text
Import Git Repository -> SKAI -> Import
```

If SKAI does not appear:

- Confirm the repo is pushed to GitHub.
- Confirm your Vercel account is connected to the GitHub account or organization that owns the repo.
- If the repo is under a GitHub organization, Vercel may need organization-level access.

Project settings during import:

```text
Project Name: skai
Framework Preset: Next.js
Root Directory: ./
Build Command: npm run build
Install Command: npm install
Output Directory: leave default
Development Command: leave default
```

Vercel should usually detect Next.js automatically. Do not select a static-only preset.

## Step 4: Add Environment Variables In Vercel

In the project import screen, or after import:

```text
Project -> Settings -> Environment Variables
```

For the first deployment, add variables to:

```text
Production
Preview
```

Adding to both avoids the common situation where the preview deployment works differently from production. If Vercel offers an "All Environments" option, use it for non-secret config. For secrets, still enable the sensitive option where available.

### Required Public Config

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
NEXT_PUBLIC_SKAI_KRW_PER_USD_ESTIMATE=1400
```

These are allowed to be visible to the browser because they are `NEXT_PUBLIC_`.

### Required Provider Config

Configure at least one live provider key. SKAI does not present a default solving model; users explicitly choose exactly one model before starting an attempt.

Recommended first live provider:

```bash
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GEMINI_MODEL=gemini-2.5-flash-lite
```

Mark `GEMINI_API_KEY` as sensitive.

Add OpenAI as an optional low-cost comparison provider:

```bash
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4.1-nano
```

Mark `OPENAI_API_KEY` as sensitive.

If using the generated local import helper, copy values from:

```text
.env.vercel.import
```

That file is ignored by git. Do not add `SKAI_DEFAULT_PROVIDER` or `SKAI_DEFAULT_MODEL`; those variables are obsolete for the solving UI.

You do not need to set `OPENAI_BASE_URL` or `GEMINI_BASE_URL` unless changing adapters. The code defaults to:

```text
OpenAI: https://api.openai.com/v1
Gemini: https://generativelanguage.googleapis.com/v1beta/openai
```

Alternative Groq config:

```bash
GROQ_API_KEY=YOUR_GROQ_API_KEY
```

Alternative xAI config:

```bash
XAI_API_KEY=YOUR_XAI_API_KEY
```

### Judge Config

Keep judge cheap and stable for first WAN smoke:

```bash
SKAI_JUDGE_MODE=heuristic
SKAI_COUNTERFACTUAL_JUDGE_MODE=heuristic
```

Do not turn on `ensemble` until provider latency/cost is measured on Vercel.

Later LLM judge option:

```bash
SKAI_JUDGE_MODE=llm
SKAI_JUDGE_PROVIDER=gemini
SKAI_JUDGE_MODEL=gemini-2.5-flash-lite
```

This uses `GEMINI_API_KEY`, so the matching key must exist.

### Safety And Limits

Copy these conservative demo limits:

```bash
SKAI_ALLOW_AUTHENTICATED_PROBLEM_SYNC=false
SKAI_MAX_TURNS_PER_ATTEMPT=18
SKAI_MAX_INPUT_CHARS_PER_TURN=6000
SKAI_MAX_MESSAGES_PER_REQUEST=40
SKAI_MAX_TRACE_EVENTS_PER_JUDGE=80
SKAI_MAX_ATTACHMENTS_PER_MESSAGE=6
SKAI_MAX_UPLOAD_BYTES=4000000
SKAI_MAX_ATTACHMENT_TEXT_CHARS=20000
SKAI_MAX_ATTACHMENT_DATA_URL_CHARS=5600000
SKAI_MAX_MESSAGE_CONTENT_CHARS=30000
SKAI_MAX_FINAL_ANSWER_CHARS=20000
SKAI_MAX_COMMENT_BODY_CHARS=1200
SKAI_MAX_MODEL_NAME_CHARS=160
SKAI_MAX_PUBLISHED_SNAPSHOT_CHARS=2000000
```

### Optional Founder Cohort Admin

Only add this if you want the admin dashboard to read all remote cohort attempts through service-role mode:

```bash
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
SKAI_FOUNDER_EMAILS=your-google-email@example.com
```

Mark `SUPABASE_SERVICE_ROLE_KEY` as sensitive.

If not configured, SKAI still works. The founder dashboard just uses the normal logged-in user's RLS scope.

## Step 5: Deploy

Click:

```text
Deploy
```

Vercel will run roughly:

```bash
npm install
npm run build
```

Wait for:

```text
Ready
```

Open the generated URL. It will look like:

```text
https://skai-xxxxx.vercel.app
```

This is your first Vercel URL. Copy it.

## Step 6: Configure Supabase Redirect URLs

In Supabase Dashboard:

```text
Authentication -> URL Configuration
```

Set:

```text
Site URL:
https://YOUR_VERCEL_DOMAIN
```

Add Redirect URLs:

```text
http://localhost:3000/auth/callback
https://YOUR_VERCEL_DOMAIN/auth/callback
```

For Vercel preview deployments, Supabase supports wildcard redirect patterns. Add this only if you intend to test preview URLs:

```text
https://*-<your-vercel-team-or-account-slug>.vercel.app/**
```

Example shape:

```text
https://*-teddyok1206.vercel.app/**
```

Use the exact production callback path for real production. Wildcards are useful for previews, but exact URLs are safer for the main smoke test.

## Step 7: Verify Google OAuth Provider

In Supabase Dashboard:

```text
Authentication -> Providers -> Google
```

Confirm Google is enabled and has:

```text
Client ID
Client Secret
```

In Google Cloud Console:

```text
APIs & Services -> Credentials -> OAuth 2.0 Client IDs -> your web client
```

Authorized redirect URI should be the Supabase callback, not the Vercel callback:

```text
https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback
```

Google sends users back to Supabase. Supabase then sends users back to SKAI through the `redirectTo` URL. That is why both settings exist:

```text
Google -> Supabase callback
Supabase -> SKAI /auth/callback
```

To make the Google consent screen say `SKAI` instead of the Supabase project hash, configure the OAuth consent app name in Google Cloud as `SKAI`.

## Step 8: Redeploy After Env/Auth Changes

If you added env vars after the first failed deployment:

```text
Vercel Project -> Deployments -> latest deployment -> Redeploy
```

If you push a new commit to `main`, Vercel will automatically create a new production deployment from Git.

Environment variable changes may require redeploying before the server sees the new values.

## Step 9: First Health Check

Open:

```text
https://YOUR_VERCEL_DOMAIN/api/deployment/health
```

Expected for first WAN smoke:

```text
Supabase URL: pass
Supabase anon key: pass
Live provider key: pass
LLM judge provider key: pass if heuristic mode is on
Counterfactual judge provider key: pass if heuristic mode is on
Problem sync policy: pass
KRW/USD estimate: pass
```

If health says:

```text
Supabase URL warn
```

Check `NEXT_PUBLIC_SUPABASE_URL`.

If health says:

```text
Supabase anon key warn
```

Check `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

If health says:

```text
No live provider API key is configured
```

Check `GEMINI_API_KEY` or whichever provider key you selected.

If health says judge provider failed while `SKAI_JUDGE_MODE=heuristic`, that is unexpected. Recheck the env value.

## Step 10: Verify Static Logo URL

Open:

```text
https://YOUR_VERCEL_DOMAIN/favicon.svg
https://YOUR_VERCEL_DOMAIN/skai-mark-512.png
```

Expected:

- Browser displays the graph mark.
- Network status is `200`.

Use this for OAuth/Supabase/Google branding fields if an image URL is requested:

```text
https://YOUR_VERCEL_DOMAIN/skai-mark-512.png
```

## Step 11: First User Smoke Flow

Use a normal browser window first:

1. Open `https://YOUR_VERCEL_DOMAIN`.
2. Confirm the home headline loads.
3. Confirm the browser tab icon appears.
4. Click `Google 로그인`.
5. Complete Google login.
6. Confirm topbar shows your email.
7. Click `첫 문제 풀기`.
8. Pick:

```text
풀이 모드: single model or material grounded
모델: Gemini / selected default
```

9. Send one visible prompt.
10. Confirm model response is live, not mock fallback.
11. Open Graph tab.
12. Submit/judge.
13. Publish/share.
14. Open the share URL in an incognito/private window.
15. Confirm share page loads while logged out.

Then check Supabase:

```text
Table Editor -> attempts
Table Editor -> trace_events
Table Editor -> score_reports
Table Editor -> published_attempts
```

Expected:

- New rows exist.
- Rows belong to your logged-in user.
- Published share page is public-readable.

## Step 12: Common Failure Modes

### Google login returns `Unsupported provider`

Cause:

```text
Google provider is not enabled in Supabase.
```

Fix:

```text
Supabase -> Authentication -> Providers -> Google -> Enable
```

### Login redirects to localhost

Cause:

```text
Supabase Site URL or Redirect URLs still point only to localhost.
```

Fix:

```text
Supabase -> Authentication -> URL Configuration
Site URL = https://YOUR_VERCEL_DOMAIN
Redirect URLs include https://YOUR_VERCEL_DOMAIN/auth/callback
```

### Login says redirect URL is not allowed

Cause:

```text
The exact callback URL generated by SKAI is not in Supabase Redirect URLs.
```

Fix:

Add:

```text
https://YOUR_VERCEL_DOMAIN/auth/callback
```

If testing a Vercel preview deployment, add the preview wildcard too.

### App says `Local demo`

Cause:

```text
Supabase env vars are missing in Vercel.
```

Fix:

Add:

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Then redeploy.

### Model response says mock fallback

Cause:

```text
Provider API key missing, wrong, exhausted, or provider request failed.
```

Fix:

- Confirm selected provider matches key.
- If provider is Gemini, check `GEMINI_API_KEY`.
- Check Vercel function logs.
- Try mock mode only if the test goal is UI flow rather than live model behavior.

### `/api/deployment/health` looks good but login still fails

Health only verifies env presence and safe shapes. It cannot verify Google OAuth provider credentials. Check Supabase provider settings and Google Cloud redirect URI.

### Build fails on Vercel but works locally

Check Vercel build logs:

```text
Project -> Deployments -> failed deployment -> Build Logs
```

Likely causes:

- Missing environment variable used at build time.
- Dependency install issue.
- Node/npm version mismatch.
- TypeScript or lint error from an uncommitted local state that was not pushed.

Run locally before pushing:

```bash
conda run -n SKAI npm run typecheck
conda run -n SKAI npm run lint
conda run -n SKAI npm run build
```

### Admin founder cohort cannot see all users

Cause:

```text
SUPABASE_SERVICE_ROLE_KEY or SKAI_FOUNDER_EMAILS is not configured.
```

Fix only if needed:

```bash
SUPABASE_SERVICE_ROLE_KEY=...
SKAI_FOUNDER_EMAILS=your-google-email@example.com
```

Mark service role as sensitive and redeploy.

## Step 13: Smoke-Test Operating Rules

For the first 10 users:

- Keep `SKAI_JUDGE_MODE=heuristic` unless explicitly testing judge quality.
- Use one live provider first.
- Do not expose raw provider/model lab to beginners.
- Publish only seed problems and founder-approved generated problems.
- Watch Vercel logs during the session:

```text
Vercel Project -> Logs
```

- Watch Supabase rows during the session:

```text
Supabase -> Table Editor
```

- Keep your model provider dashboard open to monitor quota/cost.

## Step 14: When To Add A Custom Domain

You do not need a custom domain for the first private smoke test. Vercel's generated `vercel.app` URL is enough.

Add a custom domain when:

- You want OAuth consent and shared links to look polished.
- You want a stable public URL that will not change.
- You are ready to invite users beyond close acquaintances.

After adding a custom domain, repeat:

```text
Supabase Site URL
Supabase Redirect URLs
Google OAuth branding/logo fields if needed
Health check
Login smoke
Share URL smoke
```

## Minimum Deploy Checklist

Before sharing the URL:

- [ ] `git status --short` is clean locally.
- [ ] Latest commit is pushed to GitHub `main`.
- [ ] Vercel project is connected to the GitHub repo.
- [ ] Vercel env vars are set for Production.
- [ ] Provider API key is marked sensitive.
- [ ] Supabase URL Configuration includes the Vercel callback.
- [ ] Google OAuth provider is enabled in Supabase.
- [ ] `/api/deployment/health` is pass or only expected warnings.
- [ ] `/skai-mark-512.png` loads.
- [ ] Google login works on deployed URL.
- [ ] One live model prompt succeeds without mock fallback.
- [ ] Submit/judge/share works.
- [ ] Share URL loads while logged out.

## Rollback

If a deployment is broken:

```text
Vercel Project -> Deployments -> choose previous working deployment -> Promote to Production
```

If an environment variable was wrong:

```text
Project -> Settings -> Environment Variables -> edit value -> Redeploy
```

If a secret may have been exposed:

1. Rotate it at the provider first.
2. Replace it in Vercel.
3. Redeploy.
4. Delete the old value from any local notes.

## SKAI Philosophy Check

This deployment path keeps the MacBook out of the public internet path and lets the smoke test focus on the actual product loop: problem selection, visible model interaction, material use, graph trace, judge feedback, branch/replay, and sharing. Vercel is infrastructure, not the product center. The deployment should not distract SKAI into becoming an API playground or model benchmark site.
