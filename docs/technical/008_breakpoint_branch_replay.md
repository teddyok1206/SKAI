# Breakpoint Branch Replay

Date: 2026-06-02

Source: `ARCHIVE_prompt_long/007.md`

## Core Idea

Branch replay should feel like a lightweight GDB breakpoint for AI orchestration.

The user points at a trace event and asks:

> What happens if I restart from here and try a different instruction?

SKAI then creates a new branch attempt from that point. The parent attempt remains intact. The child attempt contains the copied prefix context and can continue with a different prompt.

For user-prompt breakpoints, the child attempt stops before the selected prompt. The next user prompt becomes the replacement prompt and points back to the parent prompt with `sourceTraceEventId`.

For assistant-response breakpoints, the child attempt includes the selected response. The next user prompt becomes a different reaction to that response.

## Why This Is Core

This feature turns bottleneck feedback into lived evidence.

A judge can say "this prompt caused drift," but replay lets the user test it:

- restart from the suspected point,
- give a tighter instruction,
- compare the resulting model behavior,
- see whether the final outcome improves.

That is much closer to SKAI's philosophy than a static prompt critique.

## Data Model

Branch replay uses three levels of metadata:

1. `Attempt.branch`
   - Identifies the child attempt as a breakpoint replay.
   - Stores parent attempt id, parent trace event id, parent trace index, and parent graph pair id when known.

2. `TraceEvent.sourceTraceEventId`
   - On copied prefix events, points to the parent trace event.
   - On the first replacement user prompt after a user-prompt breakpoint, points to the parent prompt being replaced.
   - This creates child-to-parent lineage without reusing trace IDs.

3. `TraceEvent.branchId`
   - Marks all copied and newly generated child events as part of the replay branch.

The child attempt uses fresh IDs because database trace events must remain distinct rows.

## Graph Compliance

Branch replay must not break SKAI's 3-dimensional dual graph-matrix model.

The branch is not a fourth graph dimension in the main attempt graph. Instead:

- the child attempt still builds a prompt graph,
- the child attempt still builds a response graph,
- the child attempt still builds a task-status layer,
- the breakpoint is marked as a property of an existing prompt-response pair.

This keeps the main graph interpretable:

```text
Prompt_i --Response_i--> Prompt_i+1
Response_i-1 --Prompt_i--> Response_i
Prompt_i --> Status_i --> Response_i
```

The replay branch metadata says:

```text
Child pair k corresponds to parent pair j and is the breakpoint anchor.
```

Later, a separate branch lineage view can show a tree across attempts, but that is an inter-attempt graph, not a replacement for the intra-attempt 3D dual graph.

## Backend Complexity

MVP complexity goals:

- Create child branch attempt: `O(k)` for copied prefix length.
- Build graph: `O(n + b + e)`, same as normal attempts.
- Lookup source trace relation: `O(1)` through maps.
- Store graph indexes sparsely: `O(V + E)`.

Dense incidence matrices remain an offline/research export option. They should not be used in the interactive request path.

## Product Behavior

In the solving UI:

- `Branch` creates a new attempt.
- The parent attempt is not modified.
- If the breakpoint is a user prompt, the child attempt starts before that prompt.
- If the breakpoint is an assistant response, the child attempt starts after that response.
- The next user prompt is the alternative path.
- The toolbar shows that the current attempt is a breakpoint replay.

In the shared attempt UI:

- the dual graph marks the breakpoint pair,
- prompt skeleton or raw transcript can show copied source trace references,
- future comparison can show parent vs branch score deltas.

## Future Work

- Branch tree explorer.
- Side-by-side parent/child trace diff.
- Counterfactual judge report: "what changed because of the branch prompt?"
- Branch-aware bottleneck confidence.
- Replay templates suggested by the judge.
- Research export of branch lineage graphs across many users and problems.
