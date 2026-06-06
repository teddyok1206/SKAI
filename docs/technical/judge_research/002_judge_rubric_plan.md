# SKAI Judge Rubric Implementation Plan

작성일: 2026-06-06

## 목표

연구 기반 SKAI judge를 만든다. 핵심은 LLM judge prose가 아니라 trace와 graph에 anchored 된 evidence, deterministic signals, human-calibrated rubric이다.

## Judge Architecture

```text
.skai core artifact
  -> deterministic signal extraction
  -> graph-indexed evidence packet
  -> LLM judge with fixed rubric
  -> normalized judge extension
  -> coach extension
  -> unified viewer overlays
  -> founder calibration + regression
```

## Rubric Axes V1

### 1. Problem Framing

평가 질문:

- 사용자가 모호한 목표를 평가 가능한 문제로 재정의했는가?
- 대상, 목적, 성공 기준, 제약, 가정을 분리했는가?
- 무엇이 아직 불확실한지 명시했는가?

Evidence:

- first user prompt;
- clarification prompt;
- explicit assumptions;
- constraints/deliverables mention;
- problem-specific requirement coverage.

Low score:

- "조사해줘", "정리해줘" 수준으로 목표를 모델에게 넘김.

High score:

- 목적/청중/산출물/검증 기준을 분리하고, 누락 조건을 표시함.

### 2. Decomposition And Workflow Design

평가 질문:

- 문제를 하위 task로 나누었는가?
- task 간 입력/출력/의존 관계가 분명한가?
- 단순한 checklist가 아니라 실제 실행 가능한 workflow인가?

Evidence:

- task/subtask language;
- input/output contract;
- sequence of prompt-response pairs;
- graph status transitions;
- branch/replay usage.

Low score:

- 최종 답만 요구하거나, 모든 작업을 하나의 model turn에 밀어 넣음.

High score:

- 탐색, 자료 처리, 초안, 검증, 최종화를 분리함.

### 3. Instruction And Output Control

평가 질문:

- 모델에게 명확한 역할, 범위, 형식, 금지 사항을 주었는가?
- 산출물 schema나 acceptance criteria를 정의했는가?
- 모델이 과도하게 추측하지 않도록 통제했는가?

Evidence:

- required sections;
- schema/table/template instructions;
- "do not assume" style controls;
- explicit final-answer contract.

Low score:

- 답변 형식과 성공 기준이 없어 모델 output이 검증 불가능함.

High score:

- 산출물 형식, 필드, 근거 표시, 한계 표시가 분명함.

### 4. Material And Context Grounding

평가 질문:

- 문제 자료/업로드/외부 정보가 적절한 turn에 사용됐는가?
- 자료를 모델에게 그냥 던진 것이 아니라 어떻게 쓰라고 지시했는가?
- claim이 source/material과 연결되는가?
- 자료와 instruction을 분리했는가?

Evidence:

- attachments by traceEventId;
- material ids and names;
- explicit material usage instructions;
- output citations/source references;
- claim-source matching;
- ignored required material.

Low score:

- 자료가 있는데 첨부/참조하지 않음.
- 자료 속 instruction-like text를 그대로 따름.

High score:

- 자료별 역할을 정의하고, 교차 검증을 수행하며, 출처와 검증 상태를 표시함.

### 5. Adaptation And Feedback Use

평가 질문:

- 사용자가 모델의 중간 산출물에 반응했는가?
- 새 정보, 오류, 누락 조건을 반영했는가?
- branch/replay나 수정 turn을 통해 병목을 해결했는가?

Evidence:

- follow-up prompt references previous response;
- correction/redo/compare language;
- branch metadata;
- changed requirements;
- before/after graph diff.

Low score:

- 첫 응답을 그대로 받아 최종화.

High score:

- 모델 응답의 약점/누락을 짚고 다음 task를 재설계함.

### 6. Verification And Uncertainty Control

평가 질문:

- 최종 산출물 전에 검증 단계가 있는가?
- 근거, 반례, 실패 가능성, 한계를 확인했는가?
- 사람 판단과 AI task를 분리했는가?

Evidence:

- verification keywords;
- explicit source check;
- adversarial review prompt;
- "assumptions vs facts" separation;
- human approval/decision boundary.

Low score:

- 모델의 그럴듯한 답변을 검증 없이 제출.

High score:

- 근거, 반례, 한계, 추가 확인 항목을 분리하고 최종 결정권을 사람에게 둠.

### 7. Efficiency And Context Economy

평가 질문:

- 필요한 context를 충분히 주되 불필요한 반복/과잉 context를 줄였는가?
- turn 수, token, latency, model/tool calls가 문제 난이도에 비해 합리적인가?
- context switching이나 재설명 비용을 줄였는가?

Evidence:

- token usage when available;
- turn count;
- repeated restatement;
- model/provider switch;
- attachment duplication;
- branch depth.

Low score:

- 모호한 요청 때문에 같은 맥락을 반복 설명함.

High score:

- compact context packet, clear state transition, 적절한 재사용.

### 8. Final Artifact Quality

평가 질문:

- 최종 산출물이 문제 deliverable을 충족하는가?
- 과정에서 정한 기준과 최종 답변이 연결되는가?
- 실사용자가 바로 쓸 수 있는가?

Evidence:

- finalAnswer;
- deliverable coverage;
- problem rubric match;
- source-backed claims;
- unresolved assumptions.

Low score:

- 말은 맞지만 문제 요구 산출물 형태가 아님.

High score:

- 요구 산출물, 검증 상태, 한계, 다음 action이 분명함.

## Deterministic Signal Layer

LLM judge 전에 deterministic layer가 evidence packet을 만든다.

### Required Signals

- `turnCount`
- `userTurnCount`
- `assistantTurnCount`
- `attachmentUseByTurn`
- `requiredMaterialCoverage`
- `hasExplicitGoal`
- `hasConstraints`
- `hasDeliverableContract`
- `hasDecomposition`
- `hasMaterialInstruction`
- `hasVerification`
- `hasAssumptionSeparation`
- `hasHumanDecisionBoundary`
- `hasAdaptationReference`
- `repeatedContextBurden`
- `branchReplayUsed`
- `finalAnswerCoverage`

### Graph Signals

- prompt node count;
- response node count;
- status node count;
- pair status distribution;
- cross-pair dependency hints;
- selected bottleneck candidates;
- edge-level context switch candidates.

## LLM Judge Input Contract

LLM judge should receive:

- problem snapshot;
- problem rubric;
- materials metadata and extracted text summaries;
- trace events;
- graph ids and pair ids;
- deterministic evidence packet;
- final answer;
- locale;
- instruction: evaluate human orchestration, not model intelligence.

LLM judge should not receive:

- hidden ideal answer as normal context unless explicitly in a judge-only field;
- user account identity;
- model API keys or operational secrets;
- unrelated system background prompt.

## LLM Judge Output Contract V1

```ts
type SkaiJudgeOutputV1 = {
  rubricVersion: string;
  judgePromptVersion: string;
  totalScore: number;
  confidence: number;
  needsHumanReview: boolean;
  axisScores: Array<{
    axis: SkaiJudgeAxis;
    score: number;
    confidence: number;
    rationale: string;
    evidenceIds: string[];
  }>;
  findings: Array<{
    id: string;
    kind: "strength" | "bottleneck" | "risk" | "missed_opportunity";
    severity: "info" | "positive" | "watch" | "critical";
    axis: SkaiJudgeAxis;
    targetKind: "attempt" | "pair" | "prompt_node" | "response_node" | "status_node" | "edge" | "trace_event";
    targetId: string;
    evidenceIds: string[];
    title: string;
    explanation: string;
    replaySuggestion?: string;
  }>;
  nextPracticeTargets: string[];
  uncertaintyNotes: string[];
};
```

## Calibration Plan

### Fixture Set

기존 fixture를 유지하되 다음 fixture를 추가한다.

- `one-shot-good-output-bad-process.skai`
- `material-attached-but-ignored.skai`
- `material-grounded-strong.skai`
- `prompt-injection-material-risk.skai`
- `over-decomposed-costly-trace.skai`
- `strong-branch-recovery.skai`
- `good-final-bad-verification.skai`
- `weak-final-good-process.skai`

### Human Label Format

Founder/human labels should store:

- target ids;
- axis scores;
- severity;
- expected finding titles;
- notes on why LLM judge was right/wrong.

### Agreement Metrics

- axis score mean absolute error;
- finding target hit rate;
- severity agreement;
- weak/average/strong ordering;
- human override rate;
- needsHumanReview precision.

## Implementation Slices

### Slice A. Evidence Packet Builder

Files likely affected:

- `lib/judge.ts`
- `lib/conversation-graph.ts`
- `lib/judge-evidence.ts` new
- `types` for evidence packet

Deliverable:

- deterministic evidence packet from trace/problem/materials/graph;
- unit tests or script checks against fixtures.

Status:

- Completed in `docs/technical/plan/098_judge_evidence_packet_builder.md`.
- `lib/judge-evidence.ts` builds `skai.judge.evidence.v1`.
- `npm run judge:evidence` checks fixture trace/graph/material input shape.
- `judgeAttempt()` now passes the deterministic evidence packet into heuristic and LLM judge paths.

### Slice B. Judge Output Schema V1

Files likely affected:

- `lib/judge.ts`
- `lib/judge-graph-annotations.ts`
- `.skai` extension renderer

Deliverable:

- strict zod schema for `SkaiJudgeOutputV1`;
- normalization that rejects unanchored findings or moves them to attempt-level with low confidence.

Status:

- Completed in `docs/technical/plan/099_research_judge_remaining_slices.md`.
- LLM judge schema now accepts `findings`, confidence, prompt/rubric version, uncertainty, and human-review metadata while preserving legacy output compatibility.
- Direct graph targets can be normalized from pair/node/edge ids.

### Slice C. Gemini LLM Judge Prompt V2

Files likely affected:

- `lib/judge.ts`
- `docs/technical/judge_research/003_judge_prompt_v2.md` new

Deliverable:

- judge prompt that explicitly evaluates human orchestration;
- uses evidence packet;
- outputs graph-indexed JSON only;
- stores prompt version.

Status:

- Completed in `docs/technical/judge_research/003_judge_prompt_v2.md`.
- Runtime prompt version is `judge-prompt.research-v2.001`.
- Judge context includes deterministic evidence packet and graph target guide.

### Slice D. Calibration Fixture Expansion

Files likely affected:

- `fixtures/skai/*.skai`
- `scripts/generate_skai_fixtures.mjs`
- `scripts/judge_fixture.mjs`
- `docs/technical/judge_calibration/`

Deliverable:

- new fixture set;
- expected findings file;
- regression that checks ordering and target hit rate.

Status:

- Partially completed as calibration runner hardening in `docs/technical/plan/099_research_judge_remaining_slices.md`.
- Runner now reports score gaps and graph annotation presence.
- Larger fixture expansion remains useful after live Gemini judge traces are collected.

### Slice E. Founder Review Calibration Loop

Files likely affected:

- founder review dashboard;
- Supabase score report metadata;
- override APIs.

Deliverable:

- store human label/override against judge run;
- export calibration dataset;
- show agreement/drift summary.

Status:

- Local-first baseline completed in `docs/technical/plan/099_research_judge_remaining_slices.md`.
- Founder dashboard stores calibration verdict and expected score in local founder notes.
- Supabase persistence/export remains a future schema slice.

### Slice F. Viewer Overlay Upgrade

Files likely affected:

- unified `.skai` viewer;
- graph overlay registry;
- share page.

Deliverable:

- axis overlay toggles;
- finding severity overlay;
- material-grounding overlay;
- uncertainty/needsHumanReview badge.

Status:

- Completed as viewer/overlay baseline in `docs/technical/plan/099_research_judge_remaining_slices.md`.
- `.skai` extension viewer shows confidence, prompt version, finding kind, and evidence ids.
- Graph overlay has a review layer for low-confidence or human-source annotations.

## Non-Goals

- Do not turn SKAI into a model leaderboard.
- Do not reward prompt templates or fixed magic phrases.
- Do not expose hidden judge criteria to the learner in a way that encourages score grinding.
- Do not make LLM judge the only source of truth.

## Acceptance Criteria

- LLM judge can separate final quality from process quality.
- LLM judge can identify material ignored vs material grounded.
- LLM judge findings always reference stable graph ids.
- Heuristic and LLM judge disagreement is stored.
- Founder can label and override judge results.
- Regression catches unanchored findings and ordering failures.
