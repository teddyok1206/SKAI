# 006 Interaction Environment Presets

Date: 2026-06-01

Status: Superseded by `019_decouple_solving_mode_from_model_choice.md`. The original environment preset idea coupled provider brand and workflow mode too tightly.

## Goal

Replace the default user-facing raw model/provider selector with a small set of realistic AI-use environment presets.

## Rationale

SKAI should train users in conditions that resemble real ChatGPT/Gemini-style usage. Showing many providers and editable model IDs makes the demo feel like an API playground, not a practice environment.

## Scope

Included:

- Add interaction environment presets.
- Keep provider/model adapters internally.
- Show a small environment selector in the solve page.
- Hide raw model editing from the default user flow.
- Keep enough provider/model metadata for trace capture and founder debugging.
- Update design and orchestration docs.
- Clarify the model-selection decision record.

Excluded:

- Exact copying of ChatGPT, Gemini, or other provider product UI.
- Removing provider adapter support.
- Full beginner/expert mode split.
- Admin-only model lab.

## Initial Presets

- SKAI Practice: mock provider, no API key required.
- ChatGPT-like: OpenAI-compatible text-first environment.
- Gemini-like: Gemini environment for multimodal/material-heavy tasks.

The UI should describe these as environments, not as a list of raw model brands to optimize.

## Affected Files

- `components/problem-solver.tsx`
- `lib/interaction-environments.ts`
- `lib/providers/index.ts`
- `docs/000_orchestration.md`
- `docs/design/002_font_and_provider_surfaces.md`
- `docs/technical/000_decision_register.md`

## Implementation Steps

1. Add typed environment preset definitions.
2. Change solve toolbar selector from provider/model controls to environment controls.
3. Map selected environment to internal provider/model values.
4. Update Gemini default model to the cheaper multimodal Flash-Lite default.
5. Keep provider-specific chat surface variables.
6. Update docs to distinguish user-facing environment selection from internal model routing.

## Verification

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Manual page smoke at `/problems/club-budget-workflow`

## Risks

- Hiding raw model selection may make provider smoke testing less convenient.
- If provider keys are absent, ChatGPT-like and Gemini-like presets fall back to mock behavior through the existing fallback path.

## Rollback

Restore the raw provider/model selector in `components/problem-solver.tsx` and remove `lib/interaction-environments.ts`.
