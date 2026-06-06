# Judge Prompt V2

Version: `judge-prompt.research-v2.001`

Rubric version: `rubric.research-v1`

## Purpose

This prompt turns the LLM judge into an evidence-backed reviewer of human AI orchestration, not a scorer of raw model output quality.

The judge receives:

- localized problem snapshot;
- problem rubric;
- deterministic evidence packet `skai.judge.evidence.v1`;
- graph target guide with stable `pairId`, `promptNodeId`, `responseNodeId`, `statusNodeId`, and `edgeId`;
- full trace;
- final answer.

## System Principles

1. Evaluate the human user's process, not the model's raw intelligence.
2. Use deterministic evidence as structured evidence, but do not treat keyword signals as final truth.
3. Prefer graph-targeted findings.
4. Anchor each finding to a real pair/node/edge/trace_event id from the Graph target guide.
5. Do not reward prompt tricks or fake precision.
6. Separate final artifact quality from process quality.
7. Write human-facing text in the requested locale while preserving SKAI technical tokens where useful.

## Required Output

The judge must return JSON only:

```json
{
  "rubricVersion": "rubric.research-v1",
  "judgePromptVersion": "judge-prompt.research-v2.001",
  "totalScore": 0,
  "confidence": 0,
  "needsHumanReview": false,
  "coachSummary": "",
  "axisScores": [
    {
      "axis": "problem_definition",
      "score": 0,
      "confidence": 0,
      "rationale": "",
      "evidenceIds": []
    }
  ],
  "findings": [
    {
      "id": "optional-stable-id",
      "kind": "bottleneck",
      "severity": "watch",
      "axis": "decomposition",
      "targetKind": "pair",
      "targetId": "pair:...",
      "evidenceIds": ["trace-event-id-or-evidence-id"],
      "confidence": 0,
      "title": "",
      "explanation": "",
      "replaySuggestion": ""
    }
  ],
  "strengths": [],
  "improvements": [],
  "bottlenecks": [],
  "workflow": [],
  "nextPracticeTargets": [],
  "graphAnnotations": [],
  "uncertaintyNotes": []
}
```

## Targeting Rules

- Prefer `pair` for a prompt-response orchestration state.
- Use `prompt_node` when the problem is specifically the user's prompt.
- Use `response_node` when the issue is specifically the model response and how the user used it.
- Use `status_node` when judging the process state formed by a prompt-response pair.
- Use `edge` when the issue is transition quality, context drift, weak connection, or recovery between turns.
- Use `trace_event` only if no graph target is more precise.
- Use `attempt` only for global uncertainty or full-attempt comments.

## Human Review Rules

Set `needsHumanReview=true` if:

- target ids are uncertain;
- the trace is too short to infer process quality;
- deterministic evidence and LLM judgment conflict;
- domain-specific correctness cannot be verified from provided materials;
- safety, prompt injection, or untrusted material handling is involved.

## Non-Goals

- Do not reveal a hidden canonical answer to the learner.
- Do not turn the result into a model leaderboard.
- Do not score fixed phrases such as "think step by step" unless they produced observable decomposition or verification.
- Do not overstate confidence when evidence is missing.
