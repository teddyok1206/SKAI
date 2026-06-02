# 044 Gemini001 Artifact Mirror Universalization

Date: 2026-06-02

## Goal

Translate the remaining implementation directions from `docs/philosophy/Gemini/001.md` into product surfaces without disrupting the current SKAI architecture.

## Source Signals

Key Gemini 001 directions not yet fully reflected in implementation:

- The Artifact: users should want to share their directed graph timeline more than a score.
- Intelligence Mirror: SKAI should show human metacognition and control, not just AI output.
- Field Test / Universality: complex graph machinery should appear simple enough for non-AI-native users.
- Anti-servant framing: feedback should teach structured orchestration, not commanding AI as a servant.
- Packet-flow identity: Engine Mode mark should show intent/material packets converging to artifact.
- Final report headline: the report should open with a concise SKAI-native line.
- Patent-ready graph transitions: graph state changes should be readable as an algorithmic flow.

## Conflict Rule

If a Gemini-derived direction conflicts with an already accepted SKAI principle, preserve current SKAI state.

Preserve:

- Cold-start live chat.
- Mode/model separation.
- 3D dual graph as backbone.
- Trace as canonical raw state.
- No hidden context injection.
- Korean-first Pretendard + JetBrains Mono stack.
- Score as symbolic, not the product goal.

## Scope

Included:

- Add a derived SKAI Artifact card to shared attempts.
- Add a lightweight SVG export for the artifact card without adding a dependency.
- Add an Intelligence Mirror section to score reports.
- Add a universal four-part reading layer for shared attempts.
- Add Engine Mode packet-flow mark animation and subtle workspace entry ritual.
- Add graph transition log derivation for share/research readability.
- Update docs and decision register.

Excluded:

- New database tables.
- PNG rendering dependency.
- Replacing current graph model.
- Changing provider prompts or judge prompts in live chat.
- Full community redesign.

## Implementation Steps

1. Add a derived artifact/mirror helper module.
2. Render Artifact and universal summary in the shared attempt page.
3. Render Intelligence Mirror in the score report card.
4. Add packet-flow SVG elements and Engine Mode CSS animation.
5. Add graph transition log output to shared attempts.
6. Update orchestration/design/philosophy/decision docs.
7. Verify typecheck, lint, build, and diff check.

## Done Criteria

- Shared attempts expose a visible SKAI Artifact before detailed graph sections.
- Users can download the artifact as an SVG file.
- Score report opens with SKAI-native mirror language.
- Beginners can read the attempt through problem/material/process/verification without graph jargon.
- Engine Mode mark has subtle packet motion.
- Graph transition log is available without changing persistence.

## Philosophy Check

This slice should make SKAI feel less like a score app and more like a mirror of human orchestration. It must not turn the product into marketing theater: every visual or copy change must point back to intent, materials, structure, verification, and artifact.

## Implementation Result

- Added `lib/skai-artifact.ts` to derive SKAI Artifact, Intelligence Mirror, universal summary, and graph transition logs from existing trace/score/graph state.
- Added a SKAI Artifact card to shared attempts.
- Added SVG export and text-copy actions for the artifact card without adding dependencies.
- Added a universal reading layer using problem/material/process/checking language.
- Added graph transition log output to shared attempts.
- Added Intelligence Mirror sections to `ScoreReportCard`.
- Reworded heuristic judge feedback so it points to structure, responsibility, and verification rather than commanding AI.
- Added sparse Engine Mode packet-flow motion to the SKAI mark.
- Added a subtle Engine Mode surface entry animation.
- Updated orchestration, philosophy, design, and decision docs.

## Verification

- `git diff --check`: passed.
- `conda run -n SKAI npm run typecheck`: passed.
- `conda run -n SKAI npm run lint`: passed.
- `conda run -n SKAI npm run build`: passed.

## Final Philosophy Check

The implementation preserves the current SKAI architecture. Live chat remains cold-start, no hidden prompt/context behavior changed, model choice remains independent from solving mode, and trace remains canonical. The new surfaces make the existing graph backbone more visible to both beginners and advanced users: beginners get problem/material/process/checking, while advanced users get artifact export and transition logs.
