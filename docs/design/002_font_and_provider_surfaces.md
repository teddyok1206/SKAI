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

## Provider Surface Rule

Model/provider selection may change the interaction surface, but only at the level of mood and workflow affordance.

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

## Current Provider Mapping

- SKAI Mock: workbench default, evidence-first.
- OpenAI: minimal, neutral, reasoning-focused.
- Gemini: exploratory, evidence and comparison oriented.
- xAI Grok: direct, high-contrast, bottleneck-oriented.
- Groq: compact, speed and iteration oriented.
- OpenRouter: routing and comparison oriented.

This mapping is intentionally lightweight. The core SKAI UI remains stable so users can compare attempts without the interface itself becoming the main variable.
