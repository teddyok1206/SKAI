# Foundation Answers Part 1

Date: 2026-06-01

Source archive: `ARCHIVE_prompt_long/003.md`

## Identity

## Tagline Candidate

> 프로메테우스가 불을 선물한 것처럼, 인류는 스스로에게 AI를 선물했다. 이제, 장작을 넣을 차례이다.

## Product Type

SKAI is primarily:

- A community.
- An education platform.

It should grow in the direction of Baekjoon: repeated practice, problem solving, shared attempts, and skill growth.

## Core Demo Claim

The first demo should prove:

> This framework helps users improve their AI capability.

This is a qualitative smoke-test claim first, not a statistically proven claim.

## Differentiation

SKAI differs from prompt lectures, videos, and prompt collections because users can:

- Actually practice without local setup.
- Receive feedback on their own prompts.
- Communicate through a community.
- Learn the essence of problem abstraction and structuring.

## View Of AI Skill

SKAI treats "using AI well" and "designing a problem-solving structure with AI" as the same core capability.

## Evaluation Scope

SKAI should evaluate all major layers:

- Individual prompts.
- Full conversation trace.
- Final artifact.
- Problem-solving strategy.
- Human orchestration process.
- Model/tool selection and usage.
- Verification and cost management.

## Initial Skill Axes

The founder proposes two large axes:

1. Problem definition, decomposition, and instruction writing.
2. Model selection, verification, and cost management.

These can later expand into finer-grained score dimensions.

## Goal-Aware Evaluation

There may be no universal definition of "good AI orchestration." The product should support goal-aware evaluation, either through user account settings or problem categories.

Example goal categories:

- Accuracy-constrained problems.
- Speed-constrained problems.
- Cost-constrained problems.
- Organizational adoption and workflow-settlement problems.

## Structure-First Behavior

Users should receive credit for structuring the problem before demanding an immediate answer.

## Evaluating Error Correction

When a user detects and corrects a model error, SKAI can evaluate the correction through counterfactual simulation:

1. Identify the point where the user intervened.
2. Simulate or estimate what would likely have happened without the intervention.
3. Compare the counterfactual path with the actual improved path.
4. Score the user's intervention by its effect on goal alignment, error prevention, cost, or final quality.

## Clarifying Questions And Uncertainty Management

The ability to say "I do not know enough yet" and ask for missing information should be rewarded, but only when the question reduces real uncertainty.

Accepted scoring principle:

- Reward high-value clarification that changes the plan, constraints, or evaluation criteria.
- Do not reward generic hesitation or questions whose answers are already in the prompt.
- Penalize avoidable assumptions when a low-cost clarification would have prevented failure.
- In time-constrained problems, reward bounded clarification: asking the minimum question needed to proceed.

This ability should be evaluated as "uncertainty management," not simply as "number of questions asked."

## Process vs Outcome

Process quality and final output quality should be evaluated separately. A good final answer with weak process and a good process with weak final answer should not be collapsed into the same score.

## Human Skill vs Model Skill

The service's main topic is human orchestration skill. Model capability can be measured behind the scenes by product engineers and evaluation algorithms, but user-facing SKAI scoring should focus on the human's orchestration choices.

## Problem Types

SKAI should support both:

- Problems with clearer answer criteria.
- Problems with multiple valid solution paths.

The user should be able to choose or encounter both types.

## Ambiguity

Problem ambiguity can vary by problem. Some problems can be direct, while others can intentionally include ambiguity, missing conditions, or unclear constraints.

## Clarifying Questions

Users should be able to ask clarifying questions when the problem requires it.

## First Problem Set

Instead of choosing one type prematurely, SKAI should create samples across multiple categories.

Potential sample categories:

- Workplace-style problem.
- Research problem.
- Creative problem.
- Data analysis problem.
- Coding problem.
- Strategy/design problem.

## Beginner vs Advanced Evaluation

Beginner and advanced problems can share the same core evaluation system, but advanced problems may include additional dimensions such as:

- Context switching.
- Workflow design.
- Harnessing.
- Tool orchestration.
- Multi-step verification.

## Model Answers

SKAI should avoid forcing users into a single official solution. Prompt feedback should be individualized coaching, not alignment to one canonical answer.

## Rubric Transparency

Rubrics should be public.

## Difficulty Estimation

Difficulty can be estimated using:

- Token usage from AI attempts during problem creation.
- Complexity ratings by AI models.
- Human review.
- Number of constraints, required transformations, and validation steps.
