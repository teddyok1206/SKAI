# Judge Criteria Source Index

작성일: 2026-06-06

이 폴더는 SKAI judge 기준을 만들기 위한 research corpus다. PDF 원문은 open paper 또는 공식 공개 PDF만 저장했고, 웹 글/인터뷰는 전문 복사 대신 요약 note와 링크만 저장한다.

## Stored Papers

| File | Source | SKAI relevance |
| --- | --- | --- |
| `sources/papers/2201.11903_chain_of_thought.pdf` | Chain-of-Thought Prompting Elicits Reasoning in Large Language Models, https://arxiv.org/abs/2201.11903 | 복잡한 reasoning task에서 중간 reasoning structure가 필요하다는 근거. SKAI는 CoT 자체보다 사용자가 reasoning scaffold를 요구했는지 평가해야 한다. |
| `sources/papers/2203.11171_self_consistency.pdf` | Self-Consistency Improves Chain of Thought Reasoning in Language Models, https://arxiv.org/abs/2203.11171 | 단일 경로보다 여러 reasoning trajectory와 convergence가 중요하다는 근거. SKAI verification/adaptation 축에 반영한다. |
| `sources/papers/2305.10601_tree_of_thoughts.pdf` | Tree of Thoughts, https://arxiv.org/abs/2305.10601 | 복수 후보 탐색, lookahead, backtracking의 중요성. SKAI branch/replay와 counterfactual judge에 직접 연결된다. |
| `sources/papers/2210.03629_react.pdf` | ReAct, https://arxiv.org/abs/2210.03629 | reasoning과 action/tool use의 interleaving. SKAI는 prompt가 생각만 요구했는지, 자료/도구 사용 action으로 이어졌는지 평가해야 한다. |
| `sources/papers/2303.11366_reflexion.pdf` | Reflexion, https://arxiv.org/abs/2303.11366 | 실패 피드백을 언어 memory로 축적해 다음 시도에 반영하는 구조. SKAI coach, replay, branch feedback 근거. |
| `sources/papers/2308.09687_graph_of_thoughts.pdf` | Graph of Thoughts, https://arxiv.org/abs/2308.09687 | thought를 graph로 구성해 의존성과 변환을 표현. SKAI 3D dual graph의 연구적 근거. |
| `sources/papers/2203.06566_promptchainer.pdf` | PromptChainer, https://arxiv.org/abs/2203.06566 | multi-prompt chain authoring과 debugging. SKAI가 prompt sequence를 artifact로 취급해야 하는 근거. |
| `sources/papers/2211.01910_automatic_prompt_engineer.pdf` | Automatic Prompt Engineer, https://arxiv.org/abs/2211.01910 | 좋은 prompt 자체도 search/optimization 대상임. SKAI는 정답 prompt 암기가 아니라 prompt 설계 탐색 능력을 봐야 한다. |
| `sources/papers/2310.03714_dspy.pdf` | DSPy, https://arxiv.org/abs/2310.03714 | prompt template보다 metric-driven pipeline optimization. SKAI judge도 rubric과 trace metric을 분리해야 한다. |
| `sources/papers/2302.04761_toolformer.pdf` | Toolformer, https://arxiv.org/abs/2302.04761 | 언제 어떤 tool을 호출하고 결과를 어떻게 통합할지의 중요성. SKAI material/tool use 평가 근거. |
| `sources/papers/2405.17935_tool_learning_survey.pdf` | Tool Learning with Large Language Models: A Survey, https://arxiv.org/abs/2405.17935 | tool learning taxonomy. SKAI의 material/tool grounding rubric에 활용. |
| `sources/papers/2005.11401_rag.pdf` | Retrieval-Augmented Generation, https://arxiv.org/abs/2005.11401 | 외부 지식 retrieval과 generation의 분리. SKAI는 자료 선택, 근거 연결, 최신성 확인을 별도 평가해야 한다. |
| `sources/papers/2507.13334_context_engineering_survey.pdf` | A Survey of Context Engineering for Large Language Models, https://arxiv.org/abs/2507.13334 | prompt를 넘어 context retrieval/processing/management/system integration까지 확장. SKAI judge의 context control 축 근거. |
| `sources/papers/2605.27922_harness_bench.pdf` | Harness-Bench, https://arxiv.org/abs/2605.27922 | 모델 단독이 아니라 harness configuration이 성능을 좌우한다는 근거. SKAI의 핵심 철학과 직접 정합. |
| `sources/papers/agent_harness_engineering_survey_openreview.pdf` | Agent Harness Engineering: A Survey, https://openreview.net/forum?id=3hXEPbG0dh | prompt -> context -> harness engineering 진화와 cost-quality-speed tradeoff. SKAI judge의 advanced axes 근거. |
| `sources/papers/2307.13854_webarena.pdf` | WebArena, https://arxiv.org/abs/2307.13854 | realistic interactive tasks, final completion, traces. SKAI 문제 설계와 trace 기반 평가 근거. |
| `sources/papers/2310.06770_swe_bench.pdf` | SWE-bench, https://arxiv.org/abs/2310.06770 | real-world issue resolution, repository context, executable verification. SKAI의 현실 문제/검증 철학 근거. |
| `sources/papers/2306.05685_llm_as_judge_mt_bench.pdf` | Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena, https://arxiv.org/abs/2306.05685 | LLM judge와 human preference alignment의 대표 기준. SKAI judge calibration의 출발점. |
| `sources/papers/2310.08491_prometheus.pdf` | Prometheus, https://arxiv.org/abs/2310.08491 | custom rubric 기반 fine-grained evaluation. SKAI axis별 근거/점수/피드백 설계 근거. |
| `sources/papers/2410.12784_judgebench.pdf` | JudgeBench, https://arxiv.org/abs/2410.12784 | LLM judge 평가 프레임워크와 judge 자체의 한계. SKAI에서 judge confidence/human review가 필요한 근거. |
| `sources/papers/2412.05579_llms_as_judges_survey.pdf` | LLMs-as-Judges Survey, https://arxiv.org/abs/2412.05579 | LLM judge 방법론 survey. deterministic check, human calibration, bias 관리에 활용. |
| `sources/papers/2505.14534_gemini_indirect_prompt_injection.pdf` | Lessons from Defending Gemini Against Indirect Prompt Injections, https://arxiv.org/abs/2505.14534 | untrusted context/tool output 방어. SKAI materials와 user upload가 judge/security rubric에 들어가야 하는 근거. |
| `sources/papers/2302.12173_indirect_prompt_injection_real_world_apps.pdf` | Not what you've signed up for, https://arxiv.org/abs/2302.12173 | retrieval/tool-integrated apps에서 indirect prompt injection 위험. SKAI material use의 안전성 평가 근거. |
| `sources/papers/owasp_top_10_for_llms_2025.pdf` | OWASP Top 10 for LLM Applications 2025, https://owasp.org/www-project-top-10-for-large-language-model-applications/ | prompt injection, insecure output handling, excessive agency 등. SKAI advanced/security judge 근거. |

## Practitioner And Official Notes

| Note | Source | SKAI relevance |
| --- | --- | --- |
| `sources/notes/official_prompting_and_agents.md` | OpenAI Help, Anthropic Claude Docs, Anthropic Building Effective Agents | clarity, iteration, examples, tool use, simple composable agent patterns. |
| `sources/notes/practitioner_eval_context_security.md` | Hamel Husain/Humanloop, Lilian Weng, Simon Willison, Karpathy, OWASP/Harness Bench | human calibration, planning/memory/tool use, context engineering, prompt injection separation, trace capture. |

## Copyright Policy

- Open arXiv/OpenReview/official PDF files are stored as source artifacts.
- Web articles and interviews are not copied in full. Notes contain paraphrased takeaways, short compliant excerpts only where necessary, and links.
- SKAI judge implementation must cite stable source IDs from this index when a rubric axis is derived from external work.
