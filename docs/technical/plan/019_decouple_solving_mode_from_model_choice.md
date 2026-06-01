# 019 Decouple Solving Mode From Model Choice

Date: 2026-06-02

## Goal

Separate "how the user wants to solve" from "which model executes the conversation."

The previous demo grouped ChatGPT-like with a general conversation environment and Gemini-like with a material exploration environment. That was a useful shortcut for an early UI, but it conflicts with SKAI's philosophy.

## Product Rule

Mode classification and model classification are independent.

- Solving mode: the user's practice intent and evaluation lens.
- Model choice: the engine selected for this attempt.

Any model can be used in any mode, as long as the problem allows that provider.

## Why

SKAI should evaluate the human's orchestration choices. If the product implies "Gemini means material exploration" or "ChatGPT means general chat," it shifts agency from the user to the provider brand.

The user should decide:

- whether this attempt is exploratory, material-grounded, verification-oriented, or later multi-agent/harness-oriented,
- which model they want to use for that attempt.

## Scope

Included:

- Replace interaction environment presets with independent solving modes and model options.
- Add a solving mode field to attempts.
- Update the pre-attempt UI to show two distinct sections: mode and model.
- Keep attempt-level model locking after start.
- Keep provider-inspired visual accents abstract and lightweight.
- Update docs and decision register.

Excluded:

- Mode-specific hidden prompts to the live model.
- Mode-specific judge weighting changes.
- Multi-AI/harness execution.
- Admin raw provider/model lab.

## Implementation Steps

1. Add `SolvingModeId` to domain types and attempts.
2. Add `lib/solving-modes.ts`.
3. Add `lib/model-options.ts`.
4. Update `components/problem-solver.tsx` to select mode and model independently.
5. Delete the old bundled `interaction-environments` model.
6. Update design and orchestration docs.
7. Run typecheck, lint, build.

## Philosophy Check

This change restores user agency. A model is not a pedagogy. A provider is not a workflow. SKAI's core claim is that the user's problem framing, decomposition, material use, verification, and model choice are all explicit decisions that can be practiced and evaluated.
