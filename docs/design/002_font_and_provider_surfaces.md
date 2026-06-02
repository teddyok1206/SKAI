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
- This implements SKAI's Human Mode / Engine Mode split:
  - Human Mode: access, home, admin, community, review use the sans UI layer.
  - Engine Mode: problem solving, prompt composer, material viewer, graph, judge, replay, and metrics lean into mono/evidence surfaces.
- Geist Sans/Mono remains a future candidate for Latin-heavy brand surfaces, but Pretendard/JetBrains Mono is the correct Korean-first demo stack.

Fallback:

- Use system sans-serif after Pretendard.
- Use system monospace after JetBrains Mono.

Implementation note, 2026-06-02:

- Major route surfaces now carry `data-ui-mode`.
- `data-ui-mode="human"` is used for home, admin, and shared attempt reading/review.
- `data-ui-mode="engine"` is used for problem setup, solving, local solving, trace, graph, judge, and replay work.
- Global CSS exposes mode tokens for font, control font, hairline borders, and panel background.
- Engine Mode gives controls, graph, material, prompt, trace, and judge evidence stronger JetBrains Mono emphasis.
- Human Mode keeps the calm sans surface.
- The primary SKAI mark remains the same 3-node directed graph, but Engine Mode renders the node treatment with sharper hex geometry.
- The topbar mark follows `html[data-ui-mode]`, which is synchronized from the current route by a client bridge. The route-level `data-ui-mode` wrappers remain the page-surface contract.
- Engine Mode now allows sparse packet-flow motion in the SKAI mark. Motion should stay structural and subtle: intent/material packets move toward artifact, without turning the brand into theatrical decoration.
- Engine Mode packet-flow is activity-aware:
  - `ready`: quiet structural flow,
  - `primed`: prompt/material energy becomes more visible,
  - `busy`: packet speed and density increase while a model call is in flight,
  - `structured`: the artifact node pulses subtly after trace structure forms.
- Flame is not a mark shape. Flame-like energy may only appear as contained packet/current inside the graph.
- The reusable lockup combines the mark, `SKAI`, and `Social Knowledge of AI`. It is allowed on entry/review surfaces; compact topbar usage should keep the smaller mark-only treatment.
- No Geist package has been installed yet.

## Mode And Model Rule

The default user experience should separate solving mode from model choice before an attempt starts.

Reason:

- SKAI is not an API playground.
- Beginners should practice in conditions that resemble real ChatGPT/Gemini usage.
- Internal provider/model routing is still necessary for cost, evaluation, and research.
- Model choice should feel like choosing a programming language before a coding problem attempt.
- A provider brand should not define the user's workflow or evaluation lens.

Mode selection may change UI emphasis and later judge weighting, but it must not inject hidden instructions into the live model prompt. Model selection chooses the execution engine. Once the demo attempt starts, both are locked for that attempt.

## Brand Mark Rule

The top-level SKAI mark is the 3-node directed dual graph:

```text
intent + materials -> artifact
```

Provider surfaces may change accent colors, but they must never override this mark or make SKAI look like a branded skin over another model product.

Allowed:

- Accent color.
- Density.
- Metadata emphasis.
- Empty-state and coach tone tied to the selected solving mode.
- Surface labels that distinguish mode from model.

Not allowed:

- Copying exact provider layouts.
- Using provider logos as the primary UI structure.
- Replicating proprietary animations, gradients, button shapes, or product trade dress.
- Making SKAI feel like a skin over another product.
- Describing Gemini as the material mode or OpenAI as the general-chat mode.

## Current Mode Mapping

- Single Model: one selected model, broad orchestration practice.
- Material Grounded: any selected model, material use and evidence discipline emphasized.
- Verification Drill: any selected model, critique, uncertainty, and validation emphasized.

## Current Model Mapping

- SKAI Mock: no-cost local demo path.
- Gemini Flash-Lite: low-cost live smoke candidate.
- Groq Llama: fast hosted text model candidate.
- xAI Grok Fast: low-cost Grok API candidate.
- OpenAI GPT-4.1 Mini: stable baseline candidate with cost caution.

## Future Solving Modes

Demo mode:

- Single selected model per attempt.
- The user chooses one solving mode and one model before starting.
- The attempt trace records that selected provider/model.

Future modes:

- Multi-AI mode: several models run in parallel for comparison or debate.
- Harness mode: the user designs a workflow and assigns subtasks to multiple AI workers.
- Expert lab mode: raw provider/model selection, cost probes, and evaluation diagnostics.

## Provider Surface Mapping

Provider surface styling is allowed only as lightweight execution metadata:

- provider accent,
- provider label,
- model id,
- latency/cost metadata when available.

It should not imply a workflow. The core SKAI UI remains stable so users can compare attempts without the interface itself becoming the main variable. Raw provider/model editing belongs in expert/admin tooling, not the beginner-facing solving surface.
