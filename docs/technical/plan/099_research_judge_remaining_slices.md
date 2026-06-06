# 099 Research Judge Remaining Slices

## 목적

`docs/technical/judge_research/002_judge_rubric_plan.md`에 남은 Slice B-F를 순서대로 구현한다.

이번 작업의 목표는 SKAI judge를 단순 점수 산출에서 graph-anchored, evidence-backed, human-calibratable, viewer-renderable evaluation system으로 끌어올리는 것이다.

## Slice B. Judge Output Schema V1

범위:

- LLM judge output schema를 `rubricVersion`, `judgePromptVersion`, `confidence`, `needsHumanReview`, axis confidence/evidence, finding target/evidence 중심으로 확장한다.
- 기존 LLM output과의 호환을 위해 legacy shape도 normalize한다.
- unanchored finding은 버리지 않고 attempt-level fallback + 낮은 confidence + human review signal로 normalize한다.

영향 파일:

- `lib/judge.ts`
- `lib/judge-graph-annotations.ts`
- `lib/types.ts`

## Slice C. Gemini LLM Judge Prompt V2

범위:

- prompt version을 `judge-prompt.research-v2.001`로 문서화한다.
- LLM judge가 evidence packet과 graph ids를 쓰도록 system/user prompt를 강화한다.
- "모델 성능이 아니라 인간 orchestration을 평가" 원칙을 명확히 한다.

영향 파일:

- `lib/judge.ts`
- `docs/technical/judge_research/003_judge_prompt_v2.md`

## Slice D. Calibration Fixture Expansion

범위:

- synthetic fixture를 대량 추가하기보다 현재 fixture와 golden calibration runner에 expectation checks를 추가한다.
- ordering뿐 아니라 score gap, mode, graph annotation presence, evidence smoke를 검사한다.

영향 파일:

- `scripts/judge_calibration_smoke.mjs`
- `scripts/judge_evidence_smoke.mjs`
- docs update

## Slice E. Founder Review Calibration Loop

범위:

- local founder note를 calibration label shape로 확장한다.
- local attempts에 대해 judge mode, needs human review, score band, graph annotation count를 founder dashboard에 보여준다.
- remote cohort는 DB schema 확장 없이 표시 가능한 metadata만 강화한다.

영향 파일:

- `lib/types.ts`
- `lib/local-store.ts`
- `components/founder-review-dashboard.tsx`

## Slice F. Viewer Overlay Upgrade

범위:

- unified `.skai` viewer extension registry에서 judge extension의 confidence/needsHumanReview를 더 명확히 보여준다.
- graph overlay control에 review/uncertainty 관점을 추가 가능한 타입/표시를 준비한다.
- core `.skai`는 수정하지 않고 optional extension renderer만 강화한다.

영향 파일:

- `components/skai-extension-registry.tsx`
- `lib/types.ts`
- `lib/graph-overlay.ts`
- `components/conversation-graph-view.tsx` if needed

## 검증

- `npm run judge:evidence`
- `npm run judge:regression`
- `npm run skai:viewer-smoke`
- `npm run verify:skai`
- `npm run verify:i18n`
- local `/api/judge` calibration smoke when feasible
- `conda run -n SKAI npm run build`

## 위험

- Slice B가 너무 strict하면 기존 LLM judge output이 모두 실패할 수 있다. 따라서 v1 schema는 preferred path로 두되 legacy output을 normalize한다.
- Founder calibration loop는 DB schema 없이 local-first로 제한한다.
- Viewer overlay는 core `.skai`를 바꾸지 않는다.

## 상태

- 완료.

## 구현 결과

### Slice B 완료

- LLM judge schema가 `rubricVersion`, `judgePromptVersion`, `totalScore`, `confidence`, `needsHumanReview`, `uncertaintyNotes`, `axisScores[].confidence`, `axisScores[].evidenceIds`, `findings[]`를 받을 수 있게 확장됐다.
- 기존 `strengths`, `improvements`, `bottlenecks`, `graphAnnotations` legacy shape도 계속 normalize한다.
- `findings[]`는 score report prose, bottleneck list, graph annotation으로 함께 변환된다.
- graph annotation normalizer는 이제 direct `pair`, `node`, `edge` target id를 받을 수 있다.

### Slice C 완료

- `judgePromptVersion = judge-prompt.research-v2.001`를 코드와 문서에 고정했다.
- `docs/technical/judge_research/003_judge_prompt_v2.md`를 추가했다.
- LLM judge context에 deterministic evidence packet과 graph target guide를 함께 넣는다.

### Slice D 완료

- `scripts/judge_calibration_smoke.mjs`가 ordering뿐 아니라 score gap과 graph annotation presence를 기록한다.
- gap이 너무 작으면 `needs_review`로 보고해 judge 둔감함을 숨기지 않는다.

### Slice E 완료

- Founder local review note에 `calibrationLabel`을 추가했다.
- Founder dashboard에서 local/remote attempts에 calibration verdict, expected score, human review signal, graph annotation count를 볼 수 있게 했다.

### Slice F 완료

- `.skai` extension viewer가 judge confidence, prompt version, finding kind, evidence ids를 표시한다.
- graph overlay에 낮은 confidence/human source를 위한 `review` layer를 추가했다.
- core `.skai` artifact는 변경하지 않고 optional extension/view lens만 강화했다.

## 검증 결과

- `npm run typecheck`: 통과.
- `npm run lint`: 통과.
- `npm run verify:i18n`: 통과.
- `npm run verify:skai`: 통과.
- `conda run -n SKAI npm run build`: 통과.
- local production server `/api/judge` calibration smoke: 실행 성공, status는 `needs_review`.
  - `ambiguous-research-brief`: weak 48 / average 66 / strong 91, gap 통과.
  - `club-budget-workflow`: weak 48 / average 64 / strong 80, gap 통과.
  - `counterfactual-product-review`: weak 50 / average 55 / strong 74, weak-average gap 5로 `needs_review`.
  - 해석: route는 정상이며, calibration runner가 judge 둔감 구간을 숨기지 않고 founder 검토 대상으로 표면화한다.

## 다음 작업

- Live Gemini judge watchpoint는 `docs/technical/plan/100_live_gemini_judge_watchpoint.md`에서 1차 통과했다.
- 다음 live judge 검증은 `club-budget-workflow`처럼 materials-heavy 문제에서 material grounding target과 source-use finding을 확인한다.
- LLM output이 unanchored finding을 내면 현재는 첫 user trace pair로 낮은-confidence fallback anchor를 부여한다. 다음 단계는 target hit rate와 fallback rate를 report metric으로 분리하는 것이다.
- Founder calibration labels를 Supabase에 저장하려면 별도 migration/API slice가 필요하다.
