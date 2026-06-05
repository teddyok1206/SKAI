# Practitioner Eval, Context, And Security Notes

## Sources

- Hamel Husain interview/transcript via Humanloop, Why Your AI Product Needs Evals: https://humanloop.com/blog/why-your-product-needs-evals
- Lilian Weng, LLM Powered Autonomous Agents: https://lilianweng.github.io/posts/2023-06-23-agent/
- Simon Willison, Prompt injection attacks against GPT-3: https://simonwillison.net/2022/Sep/12/prompt-injection/
- Simon Willison, You can't solve AI security problems with more AI: https://simonwillison.net/2022/Sep/17/prompt-injection-more-ai/
- Andrej Karpathy context engineering post mirror: https://twicopy.com/karpathy/tweet/1937902205765607626
- Harness Bench project page: https://www.harness-bench.ai/
- OWASP Top 10 for LLM Applications: https://owasp.org/www-project-top-10-for-large-language-model-applications/

## Extracted Guidance For SKAI

### 1. LLM judge must be calibrated against human judgment

Hamel Husain's practical eval advice is directly relevant: a team should measure agreement between human/domain expert judgment and an LLM judge, then iterate using human critiques. For SKAI, founder review is not optional polish. It is the calibration loop.

Judge implication:

- each LLM judge result should store judge prompt version, model/provider, rubric version, and confidence;
- founder/human override must remain a first-class artifact;
- judge quality should be measured by agreement against human-labeled traces, not by nice prose.

### 2. Agent systems require planning, memory, and tool use

Lilian Weng's agent overview breaks agent systems into planning, memory, and tool use. SKAI should evaluate whether a user creates enough structure for the model to plan and act, but should not confuse hidden model planning with human orchestration.

Judge implication:

- look for explicit subgoals and task decomposition;
- detect memory/context management across turns;
- detect tool/material use and whether outputs are reincorporated;
- reward reflection and refinement only when it changes the next action.

### 3. Context engineering is broader than prompt wording

Karpathy's context engineering framing says industrial LLM apps are about filling the context window with the right information, not just writing a short task prompt. This aligns with SKAI's thesis.

Judge implication:

- "good prompt" means the right information architecture, not clever phrasing;
- score material selection, compression, ordering, and relevance;
- track context switching and repeated re-grounding as bottlenecks;
- judge should be graph-aware, because context flow is structural.

### 4. Prompt injection shows why data/instruction separation matters

Simon Willison's prompt injection writing argues that mixing instructions with untrusted input creates a security problem. OWASP similarly treats prompt injection and insecure output handling as core LLM application risks.

Judge implication:

- if a user uploads or attaches documents, judge should check whether the user treats those documents as data rather than instructions;
- advanced problems should include malicious or noisy material to evaluate safe context handling;
- SKAI should not claim LLM judge security guarantees. Deterministic guardrails and human review are needed for high-risk workflows.

### 5. Harness quality is not model quality

Harness Bench captures traces, token usage, tool calls, final artifacts, and execution metadata, then combines deterministic oracle checks with rubric summaries. This maps almost exactly to SKAI's architecture.

Judge implication:

- report model choice as trace metadata, not as the main score;
- judge process quality, efficiency, and failure behavior alongside final artifact;
- use deterministic validators where possible and LLM summaries for qualitative diagnostics;
- preserve the full trace for replay and counterfactual analysis.

## Direct Mapping To SKAI Rubric

| SKAI concept | Practitioner basis | Judge requirement |
| --- | --- | --- |
| Founder review dashboard | Hamel eval calibration | human labels, overrides, disagreement tracking |
| 3D dual graph | Context/harness engineering | graph-indexed findings and overlays |
| Branch/replay | Reflexion/planning practice | counterfactual bottleneck analysis |
| Materials panel | Context engineering/security | data/instruction separation, provenance |
| `.skai` artifact | Harness trace capture | portable trace, graph, metadata, extensions |
| Anti-score-grinder stance | LLM judge limitations | confidence, uncertainty, human review instead of fake precision |
