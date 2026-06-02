# 042 Human Engine Mode UI Split

Date: 2026-06-02

## Goal

Make SKAI's two cognitive UI modes explicit in implementation:

```text
Human Mode
-> access, home, admin, community, review

Engine Mode
-> problem setup, solving, trace, graph, judge, replay
```

## Scope

Included:

- Add explicit `data-ui-mode` markers to major route surfaces.
- Add CSS tokens for Human Mode and Engine Mode.
- Keep Pretendard as the Human Mode base font.
- Increase JetBrains Mono emphasis in Engine Mode surfaces without harming Korean readability.
- Make Engine Mode surfaces more precise through hairline borders, tighter metadata, and controlled mono labels.
- Keep the topbar brand mark mode-aware.
- Add a Gemini briefing Markdown file that explains the current SKAI progress and philosophy.
- Update orchestration/design docs.

Excluded:

- Installing Geist Sans/Mono.
- Full dark control-room redesign.
- Animated packet-flow logo.
- Rebuilding all layout components.
- Changing provider/model behavior.

## Product Rules

- Human Mode should be clear, calm, and approachable.
- Engine Mode should feel precise, technical, and trace-oriented.
- Engine Mode must not become an unreadable terminal UI.
- Korean body text should remain readable; mono is for controls, metadata, evidence, graph, prompt, and judge surfaces.
- No hidden prompt/context changes are allowed.

## Implementation Steps

1. Add route-level `data-ui-mode` wrappers.
2. Add global CSS tokens and selectors for mode-specific typography and surfaces.
3. Add mode labels only where they clarify the current work state.
4. Update design docs and orchestration docs.
5. Create `docs/philosophy/Gemini/002.md` as a concise current-progress briefing for Gemini.
6. Verify typecheck, lint, build, and diff check.

## Done Criteria

- Home/admin/share are marked as Human Mode.
- Problem setup/solve/local solve are marked as Engine Mode.
- Engine Mode visibly leans into mono/precision surfaces.
- Human Mode remains sans/clear/community-facing.
- Gemini briefing exists and is complete enough to hand to Gemini without the whole repo.

## Risks

- Overusing mono can reduce Korean readability.
- Route-based mode wrappers are a first step; future nested surfaces may need component-level mode tokens.
- The Gemini briefing can become stale unless updated after major milestones.

## Philosophy Check

This slice implements the founder's typography insight: people should feel a cognitive shift when they move from discussion/review into AI orchestration work. The UI should not just look different; it should make the structure of thinking more legible.

## Implementation Result

- Added route-level `data-ui-mode="human"` for home, admin, and shared attempt reading surfaces.
- Added route-level `data-ui-mode="engine"` for problem setup, solving, and local solving surfaces.
- Added global mode tokens for font, control font, hairline border, and panel surface.
- Kept Pretendard as the default Human Mode UI font.
- Added `--font-engine` so Engine Mode can lean into JetBrains Mono while keeping Korean fallback readability.
- Made Engine Mode controls, graph, material, prompt, trace, and judge evidence more technical through mono emphasis and tighter border treatment.
- Switched the existing SKAI graph mark from circle nodes to hex nodes on Engine Mode routes.
- Created `docs/philosophy/Gemini/002.md` as a current-progress briefing for Gemini.
- Updated orchestration, design, and decision docs.

## Verification

- `git diff --check`: passed.
- `conda run -n SKAI npm run typecheck`: passed.
- `conda run -n SKAI npm run lint`: passed.
- `conda run -n SKAI npm run build`: passed.

## Final Philosophy Check

This slice keeps SKAI aligned with the core doctrine. It does not add hidden prompt behavior, model-brand workflow coupling, or decorative branding. It makes the user's cognitive transition more legible: Human Mode is for access/review/community, and Engine Mode is for orchestration work where trace, graph, materials, judge evidence, and replay matter.
