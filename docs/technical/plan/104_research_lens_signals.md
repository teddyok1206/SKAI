# 104 Research Lens Signals

Date: 2026-06-08

## Purpose

논문/실무 리서치에서 뽑은 `material/context grounding`, `harness fit`, `security/permission boundary`, `branch/replay topology`를 실제 SKAI judge/evidence/graph overlay 구조에 접목한다.

핵심 원칙:

- 공개 점수축은 늘리지 않는다.
- 새 개념은 graph-anchored evidence lens와 overlay signal로 먼저 들어간다.
- 모든 signal은 trace event, material, pair/node/edge 중 하나로 역추적 가능해야 한다.
- `.skai` core나 DB schema를 흔들지 않는다.

## Scope

1. `JudgeEvidencePacket`에 optional derived signal summary를 추가한다.
2. Evidence packet builder가 아래 신호를 계산한다.
   - material cross-reference
   - claim/source linkage approximation
   - context boundary / untrusted instruction handling
   - harness fit
   - branch topology
3. Deterministic graph annotations가 위 신호를 기존 annotation kind/layer로 매핑한다.
4. Graph overlay는 새 signal vocabulary를 이해하되 기존 layer toggle UX를 유지한다.
5. Judge prompt context에 새 signals가 들어가도록 compact evidence formatter를 업데이트한다.
6. 관련 research/orchestration 문서를 실제 구현 완료 상태로 갱신한다.

## Non-Scope

- 새 public score axis 추가.
- Supabase migration.
- 새로운 viewer 또는 별도 report UI.
- PDF/xlsx/OCR parsing.
- LLM judge prompt version bump. 이번 slice는 deterministic evidence input을 확장하고, prompt wording은 후속 calibration 후 조정한다.

## Affected Files

- `lib/types.ts`
- `lib/judge-evidence.ts`
- `lib/graph-annotations.ts`
- `lib/graph-overlay.ts`
- `lib/conversation-graph.ts`
- `lib/judge.ts`
- `app/globals.css`
- `lib/i18n/copy-registry.json`
- `docs/technical/judge_research/001_synthesis_for_skai_judge.md`
- `docs/000_orchestration.md`

## Data Model

`JudgeEvidencePacket`에 optional `derivedSignals`를 추가한다.

```ts
derivedSignals?: {
  materialCrossReference: { status; materialIds; traceEventIds; confidence; summary };
  claimSourceLinkage: { status; materialIds; traceEventIds; confidence; summary };
  contextBoundary: { status; traceEventIds; confidence; summary };
  harnessFit: { status; traceEventIds; confidence; summary };
  branchTopology: { status; pairIds; traceEventIds; confidence; summary };
}
```

Status vocabulary는 점수처럼 보이지 않게 `strong | partial | weak | absent | not_applicable | risky`를 사용한다.

## Implementation Steps

1. 타입에 derived signal 구조와 overlay signal vocabulary를 추가한다.
2. `judge-evidence`에 material/context/harness/branch detector helper를 만든다.
3. Evidence items와 warnings에 새 signal을 추가하되, 기존 score axis는 유지한다.
4. `graph-annotations`에서 evidence packet을 optional input으로 받아 pair-level deterministic annotation을 만든다.
5. `conversation-graph` 호출 경로가 evidence packet을 넘기지 못하는 곳에서는 기존 동작을 유지한다.
6. `graph-overlay`가 새 signal을 기존 layer에 매핑하게 한다.
7. 문서를 implementation result로 업데이트한다.

## Verification

- `conda run -n SKAI npm run typecheck`
- `conda run -n SKAI npm run lint`
- `conda run -n SKAI npm run verify:i18n`
- `conda run -n SKAI npm run build`
- `conda run -n SKAI npm run judge:fixture`

## Risks

- Keyword 기반 detector가 과신될 수 있다. Confidence를 낮게 두고 `needsHumanReview` warning으로 처리한다.
- material/source linkage는 실제 claim parser가 아니므로 approximation으로 명시한다.
- Overlay layer가 많아지면 UI가 복잡해질 수 있다. 새 layer는 기존 toggle에 붙이고 기본 on/off를 보수적으로 유지한다.

## Rollback

- `derivedSignals`는 optional이므로 제거해도 기존 judge packet과 viewer는 동작한다.
- Graph annotation 추가가 과도하면 `graph-annotations`의 evidence-derived block만 되돌리면 된다.

## Philosophy Check

이 slice는 prompt wording 점수화가 아니라, 사용자가 현실 자료와 context를 어떻게 통제했고 branch/replay로 문제 구조를 어떻게 바꿨는지를 trace evidence로 읽게 한다. SKAI를 generic chatbot이나 prompt gallery가 아니라 AI orchestration 훈련 시스템으로 유지하는 작업이다.

## Implementation Result

- `JudgeEvidencePacket`에 optional `derivedSignals`를 추가했다.
- Deterministic evidence builder가 아래 lens를 계산한다.
  - `materialCrossReference`
  - `claimSourceLinkage`
  - `contextBoundary`
  - `harnessFit`
  - `branchTopology`
- Derived lens는 `evidenceItems`와 `warnings`에도 연결된다.
- `buildConversationGraph`는 optional `evidencePacket`을 받아 graph annotations를 더 풍부하게 만들 수 있다. evidence가 없으면 기존 동작을 유지한다.
- Deterministic graph annotation kind에 `security_boundary`, `harness_fit`, `branch_topology`를 추가했다.
- Graph overlay layer에 `contextBoundary`, `harnessFit`, `branchTopology` 토글을 추가했다.
- `/api/judge` 최종 report graph annotations 생성 경로에 evidence packet을 연결했다.
- 새 overlay/annotation copy key를 Korean/English registry에 추가했다.

## Verification Result

- `conda run -n SKAI npm run typecheck`: passed.
- `conda run -n SKAI npm run lint`: passed.
- `conda run -n SKAI npm run verify:i18n`: passed.
- `conda run -n SKAI npm run judge:fixture`: passed and wrote no fixture diff.
- `conda run -n SKAI npm run judge:regression`: passed.
- `conda run -n SKAI npm run build`: passed.
- `conda run -n SKAI npm run verify:skai`: passed.
- Local route-level `npm run calibrate:judge` against `127.0.0.1:3000` succeeded with graph target hit rate `1`, low-confidence anchor rate `0`, duplicate finding rate `0`.
- Calibration status remained `needs_review` because the existing `counterfactual-product-review` weak/average score gap is still small. That is a judge calibration watchpoint, not a route failure.
