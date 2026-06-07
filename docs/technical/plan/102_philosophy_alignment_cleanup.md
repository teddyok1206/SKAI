# 102 Philosophy Alignment Cleanup

Date: 2026-06-07

## Purpose

SKAI의 최초 seed와 핵심 철학 문서 기준으로 발견한 9개 drift를 한 번에 정리한다.

핵심 기준:

- learner는 prompt template이나 정답지가 아니라 cold-start 문제정의와 오케스트레이션을 수행해야 한다.
- 모델은 병렬적 실행 엔진이며 user-facing hierarchy나 default/recommended copy를 만들지 않는다.
- 공유/리포트는 점수표가 아니라 graph artifact와 Intelligence Mirror가 중심이어야 한다.
- `.skai` core는 judge 없이도 trace + graph + branch snapshot을 담는 lightweight backbone이어야 한다.
- judge/coaching 정보는 core가 아니라 optional extension 또는 rich in-app analysis로 남긴다.

## Scope

1. Learner solve UI에서 playbook/final answer draft를 숨기고 operator query flag로만 노출한다.
2. `.skai` export/publish path가 score report 없이도 동작하도록 타입과 share rendering을 완화한다.
3. Local leaderboard를 score-sorted 경쟁 UI가 아니라 attempt history/replay navigation으로 바꾼다.
4. Score surfaces를 symbolic metadata로 낮추고 graph/mirror 중심성을 강화한다.
5. `recommendedModel`/`recommendedMode` naming을 operator smoke metadata로 정리한다.
6. Public problem search에서 hidden classification/failure metadata를 제외한다.
7. Provider failure가 자동 mock assistant turn으로 저장되지 않게 하고, 명시적 실패 trace로 처리한다.
8. Judge score clamp의 artificial floor를 제거한다.
9. Orchestration/docs/readme gap을 현 상태에 맞게 갱신한다.

## Affected Areas

- `components/problem-solver.tsx`
- `components/share-attempt-client.tsx`
- `components/score-report-card.tsx`
- `lib/skai-format.ts`
- `lib/skai-artifact.ts`
- `lib/types.ts`
- `lib/providers/index.ts`
- `lib/judge.ts`
- `data/problem-playbooks.ts`
- `data/generated-problem-batch-001.ts`
- `scripts/problem_corpus_check.mjs`
- `docs/000_orchestration.md`
- `docs/technical/000_decision_register.md`
- `README.md`

## Implementation Steps

1. Add an operator-only playbook gate using a URL flag such as `?operator=1` or `?playbook=1`.
2. Replace local leaderboard with local attempt history sorted by recency and showing branch/judge state, not rank.
3. Change provider fallback to return explicit failure from `/api/chat`; do not store mock output as if it came from the selected model.
4. Make `PublishedAttempt.scoreReport` optional and adjust share/publish/render paths.
5. Build `.skai` from published attempt with optional score report, deriving locale from problem/trace when needed.
6. Make `SkaiArtifact` score optional and render symbolic score only when a score exists.
7. Rename playbook fields to `operatorSmokeMode` and `operatorSmokeModel` while keeping raw generated provenance under review notes.
8. Remove hidden problem classification fields from public search haystack.
9. Lower score prominence and remove artificial judge floor.
10. Update active docs and verification baselines.

## Verification

- `npm run problem:check`
- `npm run verify:i18n`
- `npm run verify:skai`
- `conda run -n SKAI npm run build`

## Risks

- Making `PublishedAttempt.scoreReport` optional touches share, storage, Supabase sync, and `.skai` export paths.
- Existing local published attempts may have older shape; share rendering must remain backward compatible.
- Removing visible playbook controls may slow founder smoke tests, so operator flag should preserve the workflow.

## Rollback

- Restore `PublishedAttempt.scoreReport` as required and require judge before publish.
- Re-enable playbook strip unconditionally if operator testing is blocked.
- Restore old leaderboard section if attempt history causes UX regression.

## Philosophy Check

This cleanup directly protects SKAI from drifting into a prompt gallery, score grinder, model leaderboard, or chat-log export product. The intended result is a stricter learner surface and a clearer graph-first artifact backbone.

## Implementation Result

- Learner solve UI no longer shows playbook/final-answer drafts unless `?operator=1` or `?playbook=1` is present.
- Provider failures no longer create mock assistant trace events. The selected provider either responds or the UI shows a runtime notice.
- `PublishedAttempt.scoreReport` is optional, Supabase published sync accepts unjudged snapshots, and publish/share/`.skai` export can run from graph core alone.
- Local score leaderboard was replaced by recency-based attempt history with branch/judge state.
- Score report and share artifact surfaces keep symbolic score as secondary metadata, not the primary visual object.
- Playbook app metadata now uses `operatorSmokeMode` and `operatorSmokeModel`; generated raw batch import still accepts legacy `recommended*` fields as provenance input.
- Public problem search no longer indexes hidden goal/failure/bottleneck/classification metadata.
- Heuristic judge scores are clamped only to the 0-100 range.
- `README.md`, `docs/000_orchestration.md`, the decision register, MVP baseline docs, and `.skai` format plan were updated to match the current direction.

## Verification Result

- `conda run -n SKAI npm run problem:check`: passed.
- `conda run -n SKAI npm run verify:i18n`: passed after removing unused leaderboard/coach score copy keys.
- `conda run -n SKAI npm run verify:skai`: passed.
- `conda run -n SKAI npm run build`: passed.
