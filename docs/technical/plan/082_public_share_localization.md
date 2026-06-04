# 082 Public Share Localization

Date: 2026-06-05

## Goal

Localize the public share page chrome while preserving the shared Artifact as the source of truth.

## Scope

Included:

- share loading/not-found states;
- public page header and overview stat labels;
- SKAI Artifact action labels and fallback notices;
- Universal Reading Layer, Graph Skeleton, Transition Log, Dual Graph, Workflow Map, Prompt Detail Anchors, Bottleneck & Replay, Counterfactual Judge, Raw Transcript section headers and helper text;
- comment form labels and action labels;
- moderation/local/remote notice fallback copy.

Excluded:

- generated workflow step prose;
- skeleton step summaries;
- score report prose;
- raw transcript content;
- problem content;
- judge/coaching generated content.

## Implementation Rules

- Viewer language is independent from shared attempt language.
- Do not translate or rewrite the artifact payload, trace content, or score report content in place.
- Reuse existing graph/viewer registry keys where possible.
- Public sharing must remain a structural reading surface, not a scoreboard or prompt gallery.

## Verification

- `npm run verify:i18n`
- `conda run -n SKAI npm run typecheck`
- `conda run -n SKAI npm run lint`
- `conda run -n SKAI npm run build`

## Strengthened Philosophy Gate

- Public share should let another person inspect orchestration structure before raw prompt text.
- Localization must not hide the fact that the artifact is a trace-derived graph object.
- Comment copy should invite interpretation and alternatives, not competitive scoring.

## Implementation Result

- `ShareAttemptClient` now reads selected locale through `useLanguagePreference`.
- Loading/not-found states, page header, overview stat labels, Artifact action labels, old `.skai` snapshot fallback, Universal Reading Layer header, Graph Skeleton header/empty states, Transition Log header/empty states, Dual Graph helper labels, Workflow Map empty state, Prompt Detail header, comment labels/actions/notices, Bottleneck & Replay empty/link text, Counterfactual Judge helper text, Raw Transcript role labels, and footer snapshot notice now read from the copy registry.
- Skeleton role labels and prompt-intent labels now have registry entries.
- Generated workflow content, skeleton summaries, score report prose, raw transcript, problem content, and judge/coaching generated content remain unmodified.

## Verification Result

- `npm run verify:i18n`: passed; 359 entries.
- `conda run -n SKAI npm run typecheck`: passed.
- `conda run -n SKAI npm run lint`: passed.
- `conda run -n SKAI npm run build`: passed.

## Strengthened Philosophy Check

- Alignment: public share now supports bilingual chrome while keeping the graph-derived Artifact and raw Trace as the inspected object.
- Anti-goal check: no leaderboard-style share copy was introduced; comment copy invites interpretation, questions, and alternative instructions.
- Watchpoint: score report and judge/coaching generated prose remain locale-sensitive work for slice 083. They should become versioned coaching/judge language layers, not ad hoc translations inside the share page.
