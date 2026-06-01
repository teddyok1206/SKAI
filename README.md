# SKAI

SKAI is a demo-first platform for practicing AI orchestration: defining unclear problems, decomposing them, assigning tasks to AI, verifying intermediate outputs, and sharing the full prompt trace as a learning artifact.

## Current Demo

The current implementation is a Next.js MVP shell with:

- In-app AI conversation.
- Full prompt trace capture.
- Mock provider for zero-key demos.
- OpenAI-compatible provider adapter for Groq, xAI, OpenAI, and OpenRouter-style APIs.
- Synchronous judge endpoint.
- Coach-style score report with total score and multi-axis scores.
- Strategy-first published attempt view.
- Local per-problem leaderboard.
- Supabase-ready schema and auth helper.

## Local Development

The project uses a conda environment named `SKAI`.

```bash
conda env create -f environment.yml
conda activate SKAI
npm install
npm run dev
```

Or without activating:

```bash
conda run -n SKAI npm run dev
```

Open:

```text
http://localhost:3000
```

## Verification

```bash
conda run -n SKAI npm audit --audit-level=moderate
conda run -n SKAI npm run typecheck
conda run -n SKAI npm run lint
conda run -n SKAI npm run build
```

## Environment

Copy `.env.example` to `.env.local` and fill provider/Supabase keys when needed. The app runs in mock mode without keys.

### Supabase

Create a Supabase project, run the migrations in `supabase/migrations/`, then set:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

For Google login:

1. Create a Google OAuth web client.
2. In Google Cloud, add the Supabase auth callback as an authorized redirect URI:

```text
https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback
```

3. In Supabase Auth provider settings, enable Google and paste the Google client ID/secret.
4. In Supabase Auth URL settings, add this local app redirect URL:

```text
http://localhost:3000/auth/callback
```

For production, also add the deployed app callback URL:

```text
https://YOUR_DOMAIN/auth/callback
```

The SKAI login button sends users through `/auth/callback?next=...`, so Supabase must allow the callback URL. After changing auth or env settings, restart the dev server.

### Live Model Provider

The app runs with `SKAI_DEFAULT_PROVIDER=mock` until a real provider key is set.

For Groq:

```bash
SKAI_DEFAULT_PROVIDER=groq
SKAI_DEFAULT_MODEL=llama-3.3-70b-versatile
GROQ_API_KEY=
```

For xAI Grok:

```bash
SKAI_DEFAULT_PROVIDER=xai
SKAI_DEFAULT_MODEL=grok-4-fast
XAI_API_KEY=
```

After changing `.env.local`, restart the dev server.

## Demo Materials

The budget workflow problem includes fixture files under `public/materials/club-budget/`.

To regenerate them:

```bash
conda run -n SKAI python scripts/generate_demo_materials.py
```
