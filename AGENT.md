# SKAI Agent Guidelines

## Project Identity

SKAI is a demo-first project for training, evaluating, and sharing AI orchestration skill: defining unclear problems, decomposing them, assigning tasks to AI systems, reacting to intermediate outputs, and verifying final results.

The current goal is not to build a full Baekjoon-scale platform. The first goal is to make a credible demo that can be used in an AX seminar and can prove that the feedback/scoring loop is worth building.

## Working Language

- Use Korean for planning, product philosophy, and user-facing project notes unless the file or user request requires English.
- Use English for code identifiers, schemas, filenames, APIs, and protocol names where that is clearer.

## Repository Memory Rules

- Long prompts from the user belong in `ARCHIVE_prompt_long/`.
- Use zero-padded integer filenames such as `001.md`, `002.md`, `003.md`.
- Never overwrite an existing archive file.
- If a long prompt is not already archived, create the next numbered markdown file before doing substantial work.
- Philosophy, mission, positioning, and legacy thinking belong in `docs/philosophy/`.
- Technical implementation decisions, architecture, schemas, deployment, APIs, and operations belong in `docs/technical/`.
- Keep philosophy and implementation separate unless a document is explicitly a bridge between them.

## Product Principles

- Measure what can be measured, but do not force fake precision onto judgment-heavy work.
- Treat the user's prompt sequence as a first-class artifact, not as disposable chat history.
- Evaluate both outcome quality and process quality.
- Preserve cold-start comparability: model memory, hidden context, and user-specific setup must be controlled or explicitly recorded.
- Prefer a simple demo that captures prompt traces and produces useful feedback over a polished interface with weak evaluation.
- Make beginner education and expert benchmarking compatible, but do not assume they need the same UX.
- Design around real unclear problems, not only clean benchmark tasks.
- Respect data ownership and consent from the beginning. Shared prompt traces must have a deliberate privacy model.

## Demo Priorities

The first demo should prove as many of these as possible:

1. A user can select or receive a problem.
2. The system can capture the user's AI interaction trace.
3. The trace can be represented in a structured format.
4. A judge pipeline can evaluate process and final output.
5. The user receives feedback on strengths, bottlenecks, missed constraints, and next practice targets.
6. The attempt can be compared with other attempts on the same problem.
7. A safe subset of the prompt trace can be shared or reviewed.

## Budget Principles

- Prefer free tiers, local development, static hosting, serverless hosting, managed databases with free tiers, and small-model judging while prototyping.
- Do not commit API keys or secrets.
- Use environment variables for credentials.
- Before choosing a paid service, verify current pricing and limits from official sources.
- Track estimated cost per attempt as a core metric, not as an afterthought.

## Data Principles

- Separate raw private traces from public/shared traces.
- Record the model, provider, timestamp, token usage if available, cost estimate, latency, problem ID, and rubric version for every judged attempt.
- Treat problem statements, rubrics, hidden judge criteria, prompt traces, model outputs, and score results as separate entities.
- Every score should be tied to a rubric version and judge version.

## Evaluation Principles

- Combine deterministic metrics with LLM judgment.
- Deterministic metrics can include schema validity, required field coverage, token usage, elapsed time, number of turns, number of restatements, and constraint violations.
- LLM judgment can evaluate decomposition quality, goal alignment, domain use, adaptation to new information, verification behavior, and final answer quality.
- LLM-as-judge results should be explainable and auditable.
- Multi-judge voting is allowed, but judge disagreement should be stored, not hidden.

## Implementation Style

- Read existing docs before adding new architecture or product direction.
- Keep edits scoped and preserve legacy context.
- Add a new decision record when a technical choice becomes binding.
- Prefer structured formats such as JSON, YAML, or typed schemas for problem definitions and attempt traces.
- Do not build a large framework before the first judged demo attempt works end to end.

## Open Questions Index

- Project seed and legacy summary: `docs/philosophy/000_project_seed.md`
- Philosophy and direction questions: `docs/philosophy/001_foundation_questions.md`
- Initial demo answers: `docs/philosophy/002_initial_demo_answers.md`
- Foundation answers part 1: `docs/philosophy/003_foundation_answers_part1.md`
- Foundation answers part 2: `docs/philosophy/004_foundation_answers_part2.md`
- Technical decision register: `docs/technical/000_decision_register.md`
- Demo and technical questions: `docs/technical/001_demo_decision_questions.md`
- Current demo direction: `docs/technical/002_current_demo_direction.md`
- Evaluation direction: `docs/technical/003_evaluation_direction.md`
- MVP stack baseline: `docs/technical/004_mvp_stack_recommendation.md`
- MVP implementation baseline: `docs/technical/005_mvp_implementation_baseline.md`
