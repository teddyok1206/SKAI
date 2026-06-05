# 097 Judge Criteria Research Grounding

## 목적

SKAI judge의 판단 기준을 내부 직관만으로 만들지 않고, 최신 prompt engineering, agent/harness engineering, LLM-as-a-judge, evaluation 연구와 실무자의 공개 인사이트에 근거해 재설계한다.

SKAI의 judge는 모델 성능 평가기가 아니라 인간의 AI orchestration 역량 평가기다. 따라서 연구 수집도 단순 prompting trick이 아니라 문제정의, decomposition, tool/material grounding, verification, adaptation, context control, final artifact 품질을 평가할 수 있는 근거를 중심으로 한다.

## 범위

- SOTA 논문과 원문 자료를 검색한다.
- 저장 가능한 open paper PDF는 `docs/technical/judge_research/sources/papers/`에 저장한다.
- 블로그, 인터뷰, 공식 가이드, 저작권 있는 웹 글은 전문 복사 대신 `docs/technical/judge_research/sources/notes/`에 링크와 judge 설계 인사이트를 저장한다.
- 수집된 근거를 바탕으로 SKAI judge rubric과 implementation plan을 작성한다.
- 실제 judge 코드 변경은 다음 slice로 남긴다.

## 비범위

- 유료 논문 원문 우회 다운로드.
- 저작권 있는 기사/블로그 전문 복사.
- LLM judge prompt/schema 즉시 교체.
- Gemini live judge 대량 호출.

## 수집 축

1. Prompting foundations: Chain-of-Thought, Self-Consistency, Tree-of-Thoughts, ReAct, Reflexion.
2. Harness/agent foundations: tool use, planning, memory, context engineering, RAG, agent workflow design.
3. Evaluation foundations: LLM-as-a-judge, MT-Bench, Prometheus, JudgeBench, AgentBench/WebArena/SWE-bench류.
4. Practitioner insights: OpenAI/Anthropic/Google official guides, Karpathy, Simon Willison, Hamel Husain, Lilian Weng, Eugene Yan 등 공개 글.
5. SKAI mapping: 각 근거를 human orchestration judge axis로 변환한다.

## 산출물

- `docs/technical/judge_research/000_source_index.md`
- `docs/technical/judge_research/001_synthesis_for_skai_judge.md`
- `docs/technical/judge_research/002_judge_rubric_plan.md`
- `docs/technical/judge_research/sources/papers/*.pdf`
- `docs/technical/judge_research/sources/notes/*.md`

## 검증

- 저장된 PDF/notes 경로가 source index와 일치하는지 확인한다.
- 모든 주요 주장에 원문 링크를 둔다.
- Judge plan이 SKAI의 핵심 축인 문제정의, 세분화, task 배분, 자료 통제, 검증, adaptation, artifact 품질로 환원되는지 확인한다.
- 저작권 있는 자료는 긴 원문 복사를 피하고 요약/링크/짧은 인용만 사용한다.

## 위험

- 연구가 너무 넓어져 구현 가능한 judge 기준으로 수렴하지 못할 수 있다.
- prompt engineering 연구가 모델 출력 기술에 치우쳐 인간 orchestration 평가로 직접 연결되지 않을 수 있다.
- LLM-as-a-judge 연구는 결과 평가에 강하지만 과정 평가에는 별도 graph/trace grounding이 필요하다.

## 롤백

- 연구 자료 저장은 코드 실행 경로와 분리되어 있어 서비스 동작에는 영향이 없다.
- 잘못 저장한 source note는 source index에서 제거하고 해당 파일을 삭제하면 된다.

## 상태

- 완료.

## 결과

- `docs/technical/judge_research/sources/papers/`에 open PDF 24개를 저장했다.
- `docs/technical/judge_research/000_source_index.md`에 source index와 SKAI relevance를 정리했다.
- `docs/technical/judge_research/sources/notes/`에 공식 가이드/실무자 인사이트 note를 저장했다.
- `docs/technical/judge_research/001_synthesis_for_skai_judge.md`에 연구 기반 SKAI judge 원칙을 정리했다.
- `docs/technical/judge_research/002_judge_rubric_plan.md`에 judge rubric과 implementation slices를 작성했다.

## 다음 작업

다음 judge 구현 slice는 `002_judge_rubric_plan.md`의 Slice A부터 진행한다.

1. Evidence Packet Builder
2. Judge Output Schema V1
3. Gemini LLM Judge Prompt V2
4. Calibration Fixture Expansion
5. Founder Review Calibration Loop
6. Viewer Overlay Upgrade
