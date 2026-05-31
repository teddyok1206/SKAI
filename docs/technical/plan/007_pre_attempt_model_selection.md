# 007 Pre-Attempt Model Selection

Date: 2026-06-01

## Goal

Move model/environment selection before attempt start, similar to choosing a programming language before solving/submitting on coding platforms.

## Rationale

The previous environment preset selector lived inside the solving toolbar. That made the model feel mutable during a solve. SKAI should treat model choice as part of the attempt configuration:

- Select problem.
- Select AI environment/model.
- Start attempt.
- Solve inside the selected model-shaped UI.
- Store the selected provider/model on the attempt trace.

## Scope

Included:

- Show a pre-attempt environment selection screen.
- Create the attempt only after the user starts.
- Lock the demo attempt to one selected AI environment.
- Remove in-solve model switching from the default UI.
- Keep internal provider/model metadata visible as read-only trace context.
- Document future multi-AI solving mode.

Excluded:

- Multi-agent parallel solving implementation.
- Expert/admin raw provider lab.
- Persisting selected environment as a separate DB column.

## Affected Files

- `components/problem-solver.tsx`
- `app/globals.css`
- `docs/000_orchestration.md`
- `docs/design/002_font_and_provider_surfaces.md`
- `docs/technical/000_decision_register.md`

## Implementation Steps

1. Change `attempt` state to start as `null`.
2. Add pre-attempt model/environment cards.
3. Add `Start Attempt` action that creates an attempt with the selected environment.
4. Remove mutable in-solve environment selector.
5. Show selected environment/model as locked metadata in the solve toolbar.
6. Make `New` return to model selection for a new attempt.
7. Update docs and decision register.

## Verification

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Manual smoke: open a problem, choose `Gemini형`, start attempt, verify the solve surface uses Gemini provider styling.

## Future Mode

Later SKAI should support solving modes:

- Single model mode: one selected AI environment per attempt.
- Multi-AI mode: multiple agents/models run in parallel or in assigned roles.
- Harness mode: user designs the AI workflow and assigns tasks to multiple AI workers.

The demo implements only single model mode.
