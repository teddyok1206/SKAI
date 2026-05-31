# Font And Provider Surfaces

Date: 2026-06-01

## Font Decision

Default:

- UI font: Pretendard Variable.
- Mono font: JetBrains Mono.
- Heading font: Pretendard Variable with heavier weights, not a separate display font.

Reasoning:

- SKAI is Korean-first in the current demo but should not feel local-only.
- Pretendard handles dense Korean UI text cleanly and does not make the product look decorative.
- JetBrains Mono gives materials, extracted text, token metrics, and trace metadata a technical surface without turning the whole app into a terminal.

Fallback:

- Use system sans-serif after Pretendard.
- Use system monospace after JetBrains Mono.

## Interaction Environment Rule

The default user experience should expose a small set of AI-use environments before an attempt starts, not a long list of raw providers and editable model IDs inside the solving surface.

Reason:

- SKAI is not an API playground.
- Beginners should practice in conditions that resemble real ChatGPT/Gemini usage.
- Internal provider/model routing is still necessary for cost, evaluation, and research.
- Model choice should feel like choosing a programming language before a coding problem attempt.

Environment selection may change the interaction surface, but only at the level of mood and workflow affordance. Once the demo attempt starts, the selected environment is locked for that attempt.

Allowed:

- Accent color.
- Density.
- Metadata emphasis.
- Empty-state and coach tone.
- Surface labels that explain the interaction mode.

Not allowed:

- Copying exact provider layouts.
- Using provider logos as the primary UI structure.
- Replicating proprietary animations, gradients, button shapes, or product trade dress.
- Making SKAI feel like a skin over another product.

## Current Environment Mapping

- SKAI Practice: default practice environment with mock provider fallback.
- ChatGPT-like: text-first general AI conversation environment.
- Gemini-like: material-heavy, multimodal AI conversation environment.

## Solving Modes

Demo mode:

- Single model mode.
- The user chooses one AI environment before starting.
- The attempt trace records that selected provider/model.

Future modes:

- Multi-AI mode: several models run in parallel for comparison or debate.
- Harness mode: the user designs a workflow and assigns subtasks to multiple AI workers.
- Expert lab mode: raw provider/model selection, cost probes, and evaluation diagnostics.

## Internal Provider Mapping

- SKAI Mock: workbench default, evidence-first.
- OpenAI: minimal, neutral, reasoning-focused.
- Gemini: exploratory, evidence and comparison oriented.
- xAI Grok: direct, high-contrast, bottleneck-oriented.
- Groq: compact, speed and iteration oriented.
- OpenRouter: routing and comparison oriented.

This mapping is intentionally lightweight. The core SKAI UI remains stable so users can compare attempts without the interface itself becoming the main variable. Raw provider/model selection belongs in expert/admin tooling, not the beginner-facing solving surface.
