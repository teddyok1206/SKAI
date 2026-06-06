# 100 Live Gemini Judge Watchpoint

## 목적

다음 watchpoint를 실제 route에서 검증한다.

> Gemini LLM judge가 실제 trace에서 stable graph id를 제대로 참조하고, founder가 쓸 만한 finding을 내는가?

이 검증은 judge 본체의 이론적 설계가 아니라 `/api/judge` live route, Gemini response, schema normalization, graph annotation mapping, human-review signal이 함께 작동하는지 확인하는 작업이다.

## 전제

- `.env.local`에는 사용자 풀이용 `GEMINI_API_KEY`만 있고 judge 전용 `SKAI_JUDGE_GEMINI_API_KEY`는 없었다.
- 프로덕션 원칙은 judge key와 learner chat key를 분리하는 것이다.
- 이번 로컬 검증에서는 파일을 수정하지 않고 임시 process env에서만 `SKAI_JUDGE_GEMINI_API_KEY=$GEMINI_API_KEY`로 주입했다.
- 검증 대상 문제는 `ambiguous-research-brief`의 weak / average / strong golden samples다.

## 구현 변경

### Calibration Runner Observability

`scripts/judge_calibration_smoke.mjs`를 확장했다.

- `judgePromptVersion`, `rubricVersion`, `confidence`, `needsHumanReview`, `uncertaintyNotes` 출력.
- `judgeRuns`에서 heuristic/LLM 성공/실패와 error를 출력.
- `graphAnnotations`의 target kind/id, kind, severity, evidence trace ids, source를 출력.
- axis별 confidence/evidence ids도 출력.

이 변경으로 단순 점수 ordering이 아니라 stable graph id anchoring을 직접 검토할 수 있다.

### LLM Output Normalization

Gemini live response에서 다음 변형을 발견했다.

- legacy `bottlenecks[].severity`에 `watch` / `critical`을 사용.
- `findings[].severity`와 `graphAnnotations[].severity`에 `low` / `medium` / `high`를 사용.
- optional `replaySuggestion`에 `null`을 사용.
- weak trace에서 finding을 `attempt` 수준으로만 내보내 graph annotation이 0개가 됨.

이에 따라 `lib/judge.ts`에서 다음을 보정했다.

- legacy bottleneck severity는 `watch -> medium`, `critical -> high`, `info/positive -> low`로 normalize.
- finding/graph annotation severity는 `low -> info`, `medium -> watch`, `high -> critical`로 normalize.
- `replaySuggestion: null`은 `undefined`로 normalize.
- attempt-level finding은 첫 user trace event를 fallback anchor로 삼아 pair annotation으로 올린다.
- attempt-level fallback annotation confidence는 낮춰서 review layer에 걸리기 쉽게 한다.
- `uncertaintyNotes` 또는 judge disagreement가 있으면 `needsHumanReview=true`로 보정한다.

## 검증 결과

### 중간 실패: graph anchor gap 발견

Report:

- `docs/technical/judge_calibration/2026-06-06T18-53-27-722Z_judge_calibration.md`
- `docs/technical/judge_calibration/2026-06-06T18-53-27-722Z_judge_calibration.json`

결과:

- LLM judge 자체는 weak / average / strong 모두 성공.
- ordering과 gap은 통과.
- weak sample에서 graph annotation이 0개라 `annotationPassed=false`.

해석:

- Gemini는 weak trace의 bottleneck을 식별했지만 graph id 대신 attempt-level comment에 가깝게 냈다.
- SKAI graph-first philosophy상 이 finding도 graph 위에 표시되어야 하므로 fallback anchor가 필요했다.

### 최종 통과

Report:

- `docs/technical/judge_calibration/2026-06-06T19-14-57-844Z_judge_calibration.md`
- `docs/technical/judge_calibration/2026-06-06T19-14-57-844Z_judge_calibration.json`

중간 report:

- `docs/technical/judge_calibration/2026-06-06T19-11-21-655Z_judge_calibration.md`
- `docs/technical/judge_calibration/2026-06-06T19-11-21-655Z_judge_calibration.json`

이 중간 report는 fallback anchor 보정 후 ordering/gap/annotation은 통과했지만, uncertainty/disagreement가 `needsHumanReview`로 강제 반영되기 전 상태를 기록한다.

결과:

- status: `passed`
- judge mode: `llm`
- weak / average / strong 모두 Gemini LLM judge 성공.
- scores: weak 35 / average 65 / strong 86
- gaps: 30 / 21
- annotationPassed: true
- weak graph annotations: 6
- average graph annotations: 9
- strong graph annotations: 16
- graph targets는 모두 stable `pair:...` id로 normalize됐다.

품질 관찰:

- Weak trace는 문제 정의, decomposition, delegation, verification, final quality, efficiency 병목을 같은 첫 pair에 정확히 anchor했다.
- Average trace는 좋은 framing/delegation과 약한 decomposition/adaptation/verification을 같은 graph 위에 함께 올렸다.
- Strong trace는 positive decomposition/adaptation과 final verification gap을 구분했다.
- LLM/heuristic disagreement와 uncertainty notes는 `needsHumanReview=true`로 표면화된다.

## 남은 Watchpoint

- Gemini가 confidence를 지나치게 높게 주는 경향이 있다. 일부 axis confidence가 `1`로 고정되는 사례가 많다.
- Average sample에서 deterministic annotation과 LLM finding이 같은 현상을 중복으로 잡는 경우가 있다. dedupe/merge 전략이 필요하다.
- `final_answer_coverage` evidence가 model에게 간접적으로 해석되는 방식은 더 정교한 final-answer evidence packet이 필요하다.
- 아직 한 문제 triplet만 검증했다. 다음 검증은 `club-budget-workflow`처럼 materials가 있는 문제에서 material grounding target을 확인해야 한다.

## SKAI Philosophy Check

이번 보정은 judge를 점수 산출기가 아니라 graph-anchored feedback system으로 유지하기 위한 작업이다. 특히 weak trace에서도 bottleneck이 원문 prose로만 떠다니지 않고 Prompt/Response pair 위에 올라오게 만든 점이 중요하다.

드리프트 위험은 있다. LLM judge가 confidence를 과도하게 높게 주거나 중복 finding을 내면 사용자가 점수를 과신할 수 있다. 따라서 다음 단계는 점수보다 evidence, graph target, human-review signal을 더 신뢰하는 방향으로 calibration을 계속해야 한다.
