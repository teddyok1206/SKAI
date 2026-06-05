# Synthesis For SKAI Judge

작성일: 2026-06-06

## 결론

SKAI judge는 "프롬프트가 예쁜가"를 평가하면 안 된다. 연구와 실무 자료를 종합하면, 실제 역량은 다음에 있다.

1. 불명확한 목표를 평가 가능한 문제로 바꾸는 능력.
2. 문제를 하위 task와 workflow로 나누는 능력.
3. 자료, 도구, context를 의도에 맞게 배치하고 통제하는 능력.
4. 중간 산출물을 보고 방향을 수정하는 능력.
5. 최종 산출물을 검증하고 한계를 표시하는 능력.
6. 비용, 시간, context switching을 관리하는 능력.
7. trace를 재사용 가능한 구조물로 남기는 능력.

이것은 prompt engineering보다 context/harness engineering에 가깝다.

## 연구별 핵심 반영

### Chain-of-Thought / Self-Consistency

CoT와 Self-Consistency는 복잡한 문제에서 단일 응답보다 중간 reasoning structure와 복수 경로 검토가 중요하다는 근거를 준다.

SKAI 반영:

- 사용자가 "생각해봐"라고 했는지만 보지 않는다.
- 문제의 성격에 맞는 reasoning scaffold를 설계했는지 본다.
- 복수 후보 비교, 반례 검토, 검증 질문이 있으면 높은 verification/adaptation 신호로 본다.
- 단, CoT 자체를 공개하도록 강요하지 않는다. 결과적으로 trace에서 구조적 검토가 드러나는지가 중요하다.

### Tree/Graph of Thoughts

ToT와 GoT는 문제 해결을 선형 대화가 아니라 탐색 그래프로 볼 수 있음을 보여준다.

SKAI 반영:

- branch/replay는 장식 기능이 아니라 judge의 핵심 근거다.
- bottleneck은 "그 turn이 나빴다"가 아니라 "그 turn 이후 가능한 탐색 공간이 어떻게 좁아졌는가"로 읽어야 한다.
- 3D dual graph는 Prompt/Response/Status의 시각화만이 아니라 judge target index다.

### ReAct / Toolformer / Tool Learning

ReAct와 Toolformer 계열은 reasoning과 action/tool use를 분리하지 않는다. 좋은 orchestration은 생각과 행동을 교차시킨다.

SKAI 반영:

- 자료가 있는 문제에서 자료를 보지 않은 좋은 답변은 낮게 평가한다.
- 자료를 첨부했더라도 "어떻게 사용하라"고 지시하지 않으면 부분 점수만 준다.
- tool/material result를 다음 turn에 다시 통합했는지 본다.
- action 없이 추론만 한 trace와, 추론 없이 tool call만 한 trace를 모두 경계한다.

### PromptChainer / DSPy / APE

PromptChainer는 chaining과 debugging을, DSPy는 metric-driven pipeline optimization을, APE는 prompt 자체가 탐색/최적화 대상임을 보여준다.

SKAI 반영:

- judge는 prompt text보다 pipeline contract를 봐야 한다.
- 각 turn의 입력, 출력, 성공 기준, 다음 step 연결성이 평가 대상이다.
- 향후 SKAI는 high-score prompt template을 공유하는 플랫폼이 아니라, problem-solving architecture를 공유하는 플랫폼이어야 한다.

### RAG / Context Engineering

RAG와 context engineering survey는 외부 지식과 context payload 구성이 모델 성능을 결정한다는 근거를 준다.

SKAI 반영:

- context control은 별도 axis가 되어야 한다.
- 자료 선택, 자료 압축, 자료 순서, relevance, provenance를 평가해야 한다.
- context flooding, 누락 자료, 오래된 정보, 출처 없는 주장, material hallucination을 bottleneck으로 탐지해야 한다.

### AgentBench / WebArena / SWE-bench / Harness-Bench

현실 agent benchmark들은 final answer만으로는 부족하고, 실행 trace, tool call, artifact, validator output, 비용/시간을 함께 봐야 함을 보여준다.

SKAI 반영:

- final artifact quality와 process quality를 분리한다.
- 가능한 경우 deterministic validator를 먼저 쓰고, LLM judge는 qualitative diagnostic으로 보조한다.
- harness/model 선택은 trace metadata다. 사용자 score는 모델 자체의 능력과 분리한다.
- "모델이 잘해서 맞았다"와 "사용자가 구조를 잘 설계했다"를 분리해야 한다.

### LLM-as-a-Judge / Prometheus / JudgeBench

LLM judge는 강력하지만 bias, calibration, domain mismatch 문제가 있다. Fine-grained rubric과 human agreement 측정이 필요하다.

SKAI 반영:

- 점수는 항상 rubric version, judge prompt version, judge model, confidence와 함께 저장한다.
- LLM judge의 prose가 그럴듯해도 신뢰하지 말고 founder/human calibration set으로 검증한다.
- judge disagreement, human override, needsHumanReview를 UI와 데이터 모델에 남긴다.
- 숫자 점수는 보조 신호이며, graph-indexed finding과 next practice target이 핵심이다.

### Prompt Injection / OWASP

untrusted input과 instruction이 섞일 때 위험이 생긴다. 자료와 user upload가 있는 SKAI 문제에서는 이 위험을 교육적으로도 평가해야 한다.

SKAI 반영:

- advanced 문제에는 noisy/malicious material이 들어갈 수 있다.
- judge는 사용자가 자료를 instruction으로 오인하거나, 자료 안의 instruction-like text를 그대로 따르게 했는지 탐지해야 한다.
- 고위험 task에서는 "AI에게 맡김"보다 permission, human approval, output validation을 명시한 사용자를 높게 평가한다.

## SKAI Judge의 핵심 원칙

### Principle 1. Outcome and process are separate

좋은 최종 답변이 나왔더라도 과정이 취약하면 낮은 process score를 준다. 반대로 final answer가 다소 미흡해도 문제정의, 자료 통제, 검증 구조가 좋으면 process learning value를 높게 본다.

### Principle 2. Trace is evidence

Judge는 사용자의 의도를 추측하지 않고 trace에 남은 행동을 근거로 평가한다. 보이지 않는 사고 과정은 점수화하지 않는다.

### Principle 3. Materials are not context decoration

자료가 있는 문제에서 자료 사용은 핵심이다. 첨부 여부, 사용 지시, 근거 연결, 결과 통합, 검증 상태를 모두 본다.

### Principle 4. A good judge is graph-indexed

모든 주요 finding은 `traceEventId`, `pairId`, `nodeId`, `edgeId` 중 하나에 anchored 되어야 한다. "전반적으로 아쉽다"는 코칭은 보조 설명일 뿐이다.

### Principle 5. Calibration beats judge eloquence

LLM judge가 유창하게 설명해도 인간 평가와 맞지 않으면 실패다. Founder-labeled fixture가 judge prompt보다 상위 기준이다.

### Principle 6. Security and permissions are orchestration skill

자료, tool, upload, action 권한이 있는 순간 안전성은 별도 보안 주제가 아니라 orchestration 역량의 일부다.

### Principle 7. Avoid prompt trick reward

특정 문구, 템플릿, "think step by step" 사용 여부를 직접 보상하지 않는다. 그것이 실제 decomposition, verification, material grounding으로 이어졌을 때만 보상한다.

## 현재 SKAI와의 Gap

| Gap | 현재 상태 | 필요 변화 |
| --- | --- | --- |
| Heuristic judge 둔감함 | weak/average/strong 순서는 맞지만 일부 점수 차가 작음 | axis별 evidence detector와 LLM judge rubric 강화 |
| Material grounding | 첨부 count와 간단한 keyword 중심 | material id, field reference, claim-source mapping 필요 |
| Graph-indexed feedback | annotations는 존재 | 모든 LLM finding이 stable graph target을 가져야 함 |
| Human calibration | founder dashboard 있음 | calibration fixture set과 agreement metric 필요 |
| Security/context separation | app guardrail 일부 있음 | judge rubric에 untrusted material handling 추가 |
| Multi-turn adaptation | workflow/bottleneck 있음 | response-aware correction, branch improvement metric 강화 |

## Judge 개선 방향 한 줄

SKAI judge는 "좋은 답을 냈는가"보다 "불명확한 현실을 모델이 다룰 수 있는 구조로 변환하고, 그 구조가 산출물과 검증까지 이어졌는가"를 평가해야 한다.
