# 041 Gemini Manifesto And Brand Mark

Date: 2026-06-02

## Goal

Preserve the Gemini branding/philosophy transcript and convert its strongest ideas into SKAI's working doctrine and first brand-mark implementation.

```text
raw Gemini transcript
-> archived source
-> philosophy extraction
-> design rules
-> agent memory
-> 3-node directed graph mark
```

## Scope

Included:

- Move `docs/philosophy/Gemini001.md` to `docs/philosophy/Gemini/001.md`.
- Add a derived philosophy document for intelligence, brand, and SKAI's deeper stance.
- Update design docs with:
  - 3-node directed dual graph as the primary brand mark,
  - Human Mode / Engine Mode typography,
  - AI-as-slave anti-pattern,
  - Prometheus/fire as capability, not decoration.
- Update `AGENT.md` so future sessions read this doctrine.
- Replace the flame icon in the topbar with a minimal 3-node directed graph mark.
- Update orchestration docs.

Excluded:

- Full visual redesign.
- Animated logo.
- Dark control-room theme.
- Font package migration to Geist.
- Marketing copy rewrite.

## Design Guardrails

- Preserve the original transcript; do not rewrite it.
- Treat Gemini's expressive language as source material, not automatic product copy.
- Keep SKAI minimal and restrained.
- Do not make the whole product dark slate or neon.
- The mark should be precise and structural, not mythic or decorative.

## Done Criteria

- Gemini transcript lives under `docs/philosophy/Gemini/001.md`.
- New doctrine document points to that source.
- Existing design docs and `AGENT.md` reflect the new principles.
- Topbar no longer uses a flame as the primary mark.
- Typecheck, lint, build, and diff check pass.

## Philosophy Check

This slice protects the founder's core obsession: SKAI must teach the invariant structure of intelligence and orchestration, not trendy prompt tricks. It also keeps implementation sober by translating the source conversation into working rules instead of turning the app into theatrical branding.

## Implementation Result

Completed on 2026-06-02.

Implemented:

- Moved raw transcript:
  - from `docs/philosophy/Gemini001.md`
  - to `docs/philosophy/Gemini/001.md`
- Added `docs/philosophy/007_intelligence_and_brand_manifesto.md`.
- Updated:
  - `docs/philosophy/000_project_seed.md`
  - `docs/design/000_design_principles.md`
  - `docs/design/001_theme_recommendation.md`
  - `docs/design/002_font_and_provider_surfaces.md`
  - `docs/000_orchestration.md`
  - `AGENT.md`
- Added `components/skai-mark.tsx`.
- Replaced the topbar flame icon with a 3-node directed dual graph mark.
- Added CSS for:
  - graph edges,
  - directed arrow,
  - Human Mode circle nodes,
  - Engine Mode hex nodes on problem-solving routes,
  - mono brand wordmark treatment on solving routes.

Verification:

- `conda run -n SKAI npm run typecheck`
- `conda run -n SKAI npm run lint`
- `conda run -n SKAI npm run build`
- `git diff --check`

Remaining:

- Full logo lockup and spacing calibration.
- Packet-flow animation from intent/material nodes to artifact.
- Explicit Human Mode / Engine Mode design tokens instead of route-based CSS `:has()` only.
- Potential future Geist Sans/Mono evaluation for Latin-heavy brand surfaces.
- Broader visual pass to make the graph mark appear in loading, share cards, and report artifacts.

Post-task philosophy check:

- The source transcript is preserved rather than rewritten.
- The product now visually leads with the graph structure, not mythology.
- The doctrine explicitly rejects AI-as-servant framing and centers intelligence as orchestration.
- The implementation stays minimal: one precise mark, no theatrical redesign.
