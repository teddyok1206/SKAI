# SKAI Project Seed

## Origin

SKAI started from a practical question:

> AI 시대에 문제를 정의하고 이해하고 세분화한 뒤 해결 전략을 설계하고, AI에게 구체적인 task를 지시 및 배분하는 역량을 어떻게 증명할 수 있는가?

The follow-up insight was that the current market lacks a Baekjoon-like training and evaluation space for AI orchestration: problem definition, decomposition, prompt sequencing, tool/model selection, intermediate feedback handling, verification, and final result quality.

The original long-form prompt is archived at `ARCHIVE_prompt_long/001.md`.

## Working Definition

SKAI evaluates and trains the ability to solve unclear real-world problems with AI systems.

This is not only prompt engineering. The target skill includes:

- Defining the problem under ambiguity.
- Identifying constraints and missing information.
- Decomposing work into sub-tasks.
- Assigning each sub-task to AI models, tools, or humans.
- Writing instructions that are specific enough to execute.
- Interpreting intermediate outputs.
- Updating the plan when new information appears.
- Applying domain knowledge at the right abstraction level.
- Detecting hallucination, drift, and weak reasoning.
- Managing cost, time, context, and model limitations.
- Producing a final artifact that meets the original goal.

## Core Belief

The key AI-era skill is not "using English as a programming language" in a shallow sense. After natural language becomes the interface, the differentiator is still design: abstraction, decomposition, constraint management, verification, and orchestration.

## Initial Product Hypothesis

If users can repeatedly solve realistic AI orchestration problems, receive structured feedback, compare their prompt traces with others, and improve through tiers or courses, SKAI can become:

- A training ground for AI beginners.
- A portfolio and proof-of-skill layer for advanced users.
- A benchmark data source for model and agent startups.
- A practical AX education tool for companies.
- A community where prompt traces and orchestration strategies are studied like code.

## Important Ideas From The Seed Prompt

- The full sequence of prompts matters more than any single prompt.
- Bottleneck prompts should be detected and explained.
- Feedback should cover problem framing, decomposition, task assignment, adaptation, domain knowledge use, and verification.
- Complete AI beginners need a low-installation practice space.
- Users should be able to choose models like programmers choose languages.
- Cold-start comparability matters.
- Prompt traces can become shareable learning artifacts.
- Quantification should be used where it is honest: token usage, elapsed time, context switches, schema validity, turn count, cost, and judge votes.
- Not everything should be forced into a numeric score.
- The incentive structure should eventually work for learners, developers, startups, big tech, HR teams, and business practitioners.

## First Demo Direction

The demo should prioritize the smallest loop that can prove the product:

1. User solves one realistic AI-use problem.
2. SKAI captures or imports the prompt trace.
3. SKAI evaluates the trace and final output.
4. SKAI gives useful feedback.
5. The result can be compared with at least one other attempt or reference attempt.

Everything else is secondary until this loop works.

## Non-Negotiables To Revisit Often

- Do not let scoring become fake objectivity.
- Do not let model performance fully obscure human orchestration skill.
- Do not leak private prompt traces by default.
- Do not build a beautiful platform before the judge loop works.
- Do not make installation or account setup the first barrier for beginners.

