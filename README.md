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

## Demo Materials

The budget workflow problem includes fixture files under `public/materials/club-budget/`.

To regenerate them:

```bash
conda run -n SKAI python scripts/generate_demo_materials.py
```
