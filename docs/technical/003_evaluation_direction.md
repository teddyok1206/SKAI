# Evaluation Direction

Date: 2026-06-01

Source: `docs/philosophy/003_foundation_answers_part1.md`

## Scoring Philosophy

SKAI should not collapse all user behavior into one vague score. It should show:

- A total score for intuitive comparison.
- Multi-axis scores for learning and diagnosis.
- Separate process and outcome evaluations.

## Initial Score Axes

Top-level grouping:

1. Framing axis:
   - Problem definition.
   - Decomposition.
   - Instruction quality.
2. Operation axis:
   - Model/tool selection.
   - Verification.
   - Cost management.

Possible expanded axes:

- Goal alignment.
- Uncertainty management.
- Adaptation to new information.
- Error detection and correction.
- Context management.
- Workflow/harness design.
- Final artifact quality.

## Goal-Aware Scoring

Each problem should declare its goal profile. Examples:

- `accuracy_first`
- `speed_first`
- `cost_constrained`
- `workflow_adoption`
- `learning_oriented`
- `exploration`

Score weights can vary by goal profile.

## Counterfactual Evaluation

For important user interventions, especially correction of model mistakes, SKAI can run counterfactual evaluation.

Minimum viable version:

1. Judge identifies a user intervention.
2. Judge explains what error or drift the intervention prevented.
3. Judge assigns impact level: low, medium, high.

Advanced version:

1. Replay from the previous state without the user's correction.
2. Ask a model to continue the trace.
3. Compare actual and counterfactual outcomes.
4. Estimate the intervention value.

## Clarification Scoring

Clarifying questions should be scored by value, not quantity.

Accepted principle:

- Treat this as uncertainty management, not question count.
- Reward questions that reduce material uncertainty.
- Penalize avoidable assumptions when a cheap clarification would have prevented failure.

Positive signals:

- The question exposes missing constraints.
- The answer changes the plan.
- The question prevents a likely failure.
- The question is appropriately scoped for the problem's time/cost constraints.

Negative signals:

- The question repeats given information.
- The question delays execution without reducing uncertainty.
- The user asks broad questions because they have not formed a plan.

## Rubrics

Rubrics should be visible to users.

Hidden judge prompts may exist for robustness, but the evaluation standards should be public enough that users understand what skill they are practicing.

## Judge System Direction

Judging should be repeatable before it is agentic.

Current intended layers:

1. Heuristic baseline judge.
2. Optional LLM judge with structured JSON output.
3. Optional ensemble mode that records judge disagreement.
4. Later queue worker for slow or high-traffic judging.
5. Codex-backed deep judge only as a local research spike until reliability, security, and cost are understood.

Judge runs should store enough metadata to audit the result:

- judge provider,
- judge model,
- judge mode,
- status,
- latency,
- axis scores,
- error if any,
- disagreement notes across judge runs.

## Graph-Based Evaluation

SKAI attempts should be evaluable as a dual graph, not only as a transcript.

Initial graph alignment:

- Prompt nodes can receive process-quality annotations: framing, decomposition, instruction clarity, verification, adaptation.
- Response nodes can receive output-quality annotations: usefulness, correctness, drift, missing constraints, hallucination risk.
- Prompt-response pair status nodes can receive task-progress annotations: pending, responded, material-used, verification, bottleneck.

Research direction:

- Correlate graph motifs with rubric scores.
- Detect high-cost context switching by repeated prompt-state resets.
- Detect strong interventions by comparing response graph drift before and after user correction.
- Compare models on the same prompt graph by response-node stability and quality.
- Use graph branches for counterfactual evaluation and replay.

The flat trace remains the canonical raw record. The graph is a derived evaluation and visualization layer until persistence is proven useful.

## Difficulty

Difficulty can combine:

- Estimated token usage.
- Number of required subtasks.
- Number of constraints.
- Need for domain knowledge.
- Need for tool/model switching.
- Need for verification.
- AI solver benchmark results.
