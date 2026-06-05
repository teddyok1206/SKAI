# Official Prompting And Agent Guidance Notes

## Sources

- OpenAI Help Center, Prompt engineering best practices for ChatGPT: https://help.openai.com/en/articles/10032626-prompt-engineering-best-practices-for-chatgpt
- Anthropic Claude Docs, Prompting best practices: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
- Anthropic Engineering, Building effective agents: https://www.anthropic.com/engineering/building-effective-agents

## Extracted Guidance For SKAI

### 1. Prompt clarity is necessary but not sufficient

OpenAI's guidance emphasizes clear, specific prompts, enough context, and iterative refinement. For SKAI, this should not become a prompt-template scoring game. The judge should look for whether the user:

- states the target outcome;
- states constraints and assumptions;
- tells the model what information is missing;
- refines based on the model's intermediate output.

### 2. Iteration is a first-class skill

OpenAI frames prompt engineering as iterative: start, review, refine. SKAI should therefore not reward one-shot final answers as the default ideal. A high-scoring attempt may be short, but only if the first prompt explicitly captures goal, constraints, materials, output contract, and verification plan.

### 3. Prompt behavior is model/version specific

Anthropic's current prompting docs explicitly discuss model-specific behavior, effort, tool triggering, and token spend. SKAI should record provider/model metadata and avoid treating all traces as if model behavior were constant.

Judge implication:

- score human orchestration relative to chosen provider/model;
- do not punish a user for model limitations when their prompt structure was sound;
- flag model/harness mismatch separately from user skill.

### 4. Tool use is a controllable behavior

Anthropic notes that tool use may need explicit triggering and that effort/cost settings affect agentic behavior. SKAI problems with materials should judge whether the user:

- attaches or references relevant materials at the right turn;
- tells the model how to use each material;
- separates data from instruction;
- asks for citations, evidence, or field-level grounding where applicable.

### 5. Agents should start with simple composable patterns

Anthropic's agent article argues that successful implementations often use simple, composable patterns rather than complex frameworks. SKAI should reward workflow clarity over over-engineered multi-agent decomposition.

Judge implication:

- high score: clear pipeline with minimal necessary steps;
- warning: unnecessary branching, excessive subtasking, or multi-agent ceremony that increases cost without improving verification;
- warning: agentic overreach where the user delegates final judgment or unsafe actions.

### 6. Cost, speed, and intelligence are explicit tradeoffs

Prompting docs now discuss effort, token spend, latency, and overthinking. SKAI should measure efficiency but not reduce it to "shorter is better."

Judge implication:

- efficiency = enough context and decomposition with minimal waste;
- penalize repeated context restatement caused by unclear task state;
- penalize unnecessary tool calls, model switches, or retries;
- avoid fake precision if actual token/cost metadata is missing.

## Direct Mapping To SKAI Rubric

| SKAI axis | Official guidance basis | Judge observation |
| --- | --- | --- |
| Problem definition | clarity/specificity | target, audience, constraints, success criteria |
| Instruction clarity | explicit scope/examples/output control | schema, format, role, action criteria |
| Adaptation | iterative refinement | response-aware follow-up, correction, branch |
| Material grounding | tool use/context guidance | attachments, source use instructions, evidence |
| Efficiency | effort/cost guidance | token/retry/context switching patterns |
| Harness judgment | simple composable agent patterns | decomposition without unnecessary framework complexity |
