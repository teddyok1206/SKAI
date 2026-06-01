# Branch Diff And Counterfactual Judge

Date: 2026-06-02

## Parent/Child Branch Diff

Parent/child diff compares two attempts that share a branch lineage.

The first useful diff is not a text diff. It is an orchestration diff:

- where the child branch forked,
- which parent prompt or response was replaced,
- how the next user prompt changed,
- whether the model response became more constrained, more grounded, or more useful,
- whether materials were used earlier/later,
- whether verification happened sooner,
- whether token/time/turn cost changed,
- whether the final score axis changed.

## Diff Inputs

Required:

- parent attempt,
- child attempt,
- child `Attempt.branch`,
- parent/child `TraceEvent.sourceTraceEventId`,
- parent/child conversation graphs,
- score reports when available.

## Diff Output Shape

Candidate structured output:

```ts
interface BranchDiff {
  parentAttemptId: string;
  childAttemptId: string;
  breakpointTraceEventId: string;
  changedPrompt?: {
    before: string;
    after: string;
    semanticDelta: string[];
  };
  responseDelta?: {
    before?: string;
    after?: string;
    observedChange: string[];
  };
  processDelta: {
    turnDelta: number;
    tokenDelta?: number;
    materialUseChanged: boolean;
    verificationMovedEarlier: boolean;
  };
  scoreDelta?: Record<string, number>;
}
```

## Counterfactual Judge

Counterfactual judge answers:

> Did the branch actually improve the orchestration, and why?

It should not merely ask which final answer is better. It should compare the causal effect of the changed prompt or strategy.

Good counterfactual judge questions:

- What changed at the breakpoint?
- Did the new prompt reduce ambiguity?
- Did it introduce better constraints or output format?
- Did it use available materials more effectively?
- Did it avoid the previous bottleneck?
- Did it improve final quality, process quality, or both?
- Was the improvement worth the extra cost/turns?

## Judge Modes

Coach mode:

- Gives narrative feedback.
- Helps the learner understand why the branch worked or failed.

Strict mode:

- Uses a fixed rubric.
- Reports only evidence-grounded deltas.
- Useful for certification or hiring-style tests.

## Architecture

Current MVP path:

1. Build parent graph.
2. Build child graph.
3. Locate breakpoint pair through `sourceTraceEventId`.
4. Generate deterministic diff metrics.
5. Run heuristic counterfactual judge.
6. Optionally run LLM counterfactual judge when `SKAI_COUNTERFACTUAL_JUDGE_MODE=llm`.
7. Store diff/judge metadata separately from the original score report.

The original judge report remains immutable. Counterfactual judge is a second-order evaluation over two attempts.

## Current Implementation

- `lib/branch-diff.ts`
- `lib/counterfactual-judge.ts`
- `app/api/counterfactual-judge/route.ts`
- solve UI branch diff section
- shared attempt counterfactual judge section

The heuristic report works without API keys. LLM mode is opt-in and falls back to the heuristic report if the configured provider fails.

## Research Value

Across many users, branch diffs can reveal:

- which prompt edits most often repair drift,
- which bottlenecks are model-caused vs user-caused,
- which materials improve outcomes,
- which workflow motifs correlate with better final quality.
