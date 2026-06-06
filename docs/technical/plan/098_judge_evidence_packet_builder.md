# 098 Judge Evidence Packet Builder

## 목적

연구 기반 judge 강화의 첫 구현 slice로, trace/problem/material/graph에서 결정적 evidence packet을 만든다.

현재 judge는 heuristic keyword와 LLM context 문자열 중심이다. 이 slice 이후 judge는 LLM에게 원문 trace만 주지 않고, 사용자의 orchestration 행동을 구조화한 evidence를 함께 제공한다.

## 범위

- `lib/judge-evidence.ts`를 새로 만든다.
- trace, final answer, problem materials, conversation graph에서 deterministic signals를 추출한다.
- evidence packet을 LLM judge context에 포함한다.
- heuristic judge가 최소한 일부 evidence signal을 재사용하도록 연결한다.
- fixture 기반 evidence smoke script를 추가한다.
- `verify:skai`에 evidence smoke를 추가한다.

## 비범위

- LLM judge output schema v1 전면 교체.
- Gemini judge prompt v2 전체 재작성.
- founder human calibration UI.
- 새 `.skai` extension schema 추가.
- 공개 UI 변경.

## 설계

### Evidence Packet

```ts
interface JudgeEvidencePacket {
  schemaVersion: "skai.judge.evidence.v1";
  attemptId: string;
  problemId: string;
  generatedAt: string;
  counts: {
    turnCount: number;
    userTurnCount: number;
    assistantTurnCount: number;
    promptPairCount: number;
    attachmentCount: number;
    requiredMaterialCount: number;
    attachedRequiredMaterialCount: number;
  };
  signals: {
    hasExplicitGoal: boolean;
    hasConstraints: boolean;
    hasDeliverableContract: boolean;
    hasDecomposition: boolean;
    hasMaterialInstruction: boolean;
    hasVerification: boolean;
    hasAssumptionSeparation: boolean;
    hasHumanDecisionBoundary: boolean;
    hasAdaptationReference: boolean;
    branchReplayUsed: boolean;
    finalAnswerCoverage: number;
    repeatedContextBurden: number;
  };
  materialCoverage: Array<...>;
  graphSignals: Array<...>;
  evidenceItems: Array<...>;
  warnings: string[];
}
```

### 원칙

- Evidence packet은 canonical trace를 대체하지 않는다.
- Evidence packet은 LLM judge의 입력 근거이며, core `.skai`에 넣지 않는다.
- 모든 evidence item은 가능하면 trace event id, pair id, node id 중 하나를 참조한다.
- keyword detector는 한국어/영어 혼합 trace를 모두 처리한다.

## 영향 파일

- `lib/judge-evidence.ts` new
- `lib/judge.ts`
- `lib/types.ts`
- `scripts/judge_evidence_smoke.mjs` new
- `package.json`
- `docs/technical/judge_research/002_judge_rubric_plan.md`
- `docs/000_orchestration.md`

## 검증

- `npm run judge:evidence`
- `npm run judge:regression`
- `npm run skai:viewer-smoke`
- `npm run verify:skai`
- `conda run -n SKAI npm run typecheck`
- `conda run -n SKAI npm run lint`
- `conda run -n SKAI npm run build`

## 위험

- keyword 기반 signal이 과신될 수 있다. 따라서 evidence packet은 confidence/summary 근거로만 쓰고, 최종 점수는 다음 slice의 calibrated rubric에서 조정한다.
- finalAnswerCoverage는 단순 deliverable keyword coverage라 도메인 정답성을 뜻하지 않는다.
- materialCoverage는 첨부/참조/지시 여부를 보는 것이지 OCR/파일 파싱 품질을 보장하지 않는다.

## 롤백

- `lib/judge.ts`에서 evidence context 삽입을 제거하고 `lib/judge-evidence.ts`와 script/package script를 제거하면 기존 judge로 돌아간다.

## 상태

- 완료.

## 구현 결과

- `lib/judge-evidence.ts`를 추가했다.
- `JudgeEvidencePacket` 관련 타입을 `lib/types.ts`에 추가했다.
- `judgeAttempt()`가 trace/problem/final answer/3D dual graph에서 evidence packet을 먼저 만든 뒤 heuristic judge와 LLM judge context에 전달한다.
- LLM judge context에는 `Deterministic evidence packet` JSON이 포함된다.
- heuristic judge는 evidence packet을 약하게 반영해 explicit goal, decomposition, deliverable contract, verification, material instruction, final answer coverage, repeated context burden 등을 점수와 rationale에 반영한다.
- `scripts/judge_evidence_smoke.mjs`와 `npm run judge:evidence`를 추가했다.
- `npm run verify:skai`에 evidence smoke를 포함했다.

## Calibration 결과

`node scripts/judge_calibration_smoke.mjs --no-write` 결과:

- `ambiguous-research-brief`: weak 48, average 66, strong 91
- `club-budget-workflow`: weak 48, average 64, strong 80
- `counterfactual-product-review`: weak 50, average 55, strong 74

세 문제 모두 weak < average < strong ordering을 유지했다.

## 다음 작업

다음 slice는 `docs/technical/judge_research/002_judge_rubric_plan.md`의 Slice B다.

- Judge Output Schema V1
- graph target anchoring 강화
- unanchored LLM finding reject/fallback
- judge prompt version / confidence / needsHumanReview 저장 구조 정리
