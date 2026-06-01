# Dual Graph Trace Model

Date: 2026-06-01

Source: `ARCHIVE_prompt_long/006.md`

## Core Idea

SKAI should not treat an attempt as only a flat chat transcript. A transcript is easy to store, but it hides the structure that SKAI is trying to teach:

- how the user frames the problem,
- how the user changes or constrains the task,
- how the model response changes the user's next move,
- where materials enter the workflow,
- where verification or bottlenecks occur.

The proposed representation is a directed dual graph over the same trace.

## Projection 1: Prompt Graph

In the prompt graph:

- Nodes are user prompts.
- Directed edges are model responses.
- A response edge points from one user prompt state to the next user prompt state.

Interpretation:

```text
Prompt_1 --Response_1--> Prompt_2 --Response_2--> Prompt_3
```

This projection asks:

- What did the user ask?
- What did the AI return?
- How did that response affect the user's next instruction?

It is useful for showing the learner's orchestration flow because the visible nodes are the user's decisions.

## Projection 2: Response Graph

In the response graph:

- Nodes are model responses.
- Directed edges are user prompts.
- A user prompt edge points from the previous model response state to the next model response state.

Interpretation:

```text
Response_origin --Prompt_1--> Response_1 --Prompt_2--> Response_2
```

This projection asks:

- What input caused this model response?
- Which user intervention transformed the response state?
- Did the user steer the model, verify it, or let it drift?

It is useful for model/provider evaluation because the visible nodes are the model outputs.

## Projection 3: Task Status Layer

Each prompt-response pair receives a status node.

```text
Prompt_i --> Status_i --> Response_i
```

Initial deterministic statuses:

- `pending`: a prompt has no response yet.
- `responded`: a normal response exists.
- `material_used`: the prompt used official/user-uploaded materials.
- `verification`: the prompt appears to ask for validation, evidence, errors, limits, or sources.
- `bottleneck`: the judge marked this trace event as a bottleneck.

Later LLM judge statuses can add:

- `framing`
- `decomposition`
- `delegation`
- `course_correction`
- `counterfactual_high_impact`
- `finalization`
- `off_track`

## Why It Matters

This model matches SKAI's core claim: AI skill is not just writing a good individual prompt. It is directing a sequence of transformations.

The dual graph makes the sequence measurable:

- Prompt graph measures human orchestration.
- Response graph measures model behavior under human steering.
- Status layer connects process quality, task state, materials, and judge results.

## Data Structure

The MVP graph is derived from flat `TraceEvent[]`.

Important entities:

- `ConversationGraphNode`
- `ConversationGraphEdge`
- `ConversationGraphPair`
- `ConversationGraphIndex`
- `ConversationGraph`

The graph stores sparse lookup structures:

- `promptNodeByTraceEventId`
- `responseNodeByTraceEventId`
- `pairByPromptTraceEventId`
- `pairByResponseTraceEventId`
- `adjacency`
- `incidence`

This gives the project the benefits of incidence matrices and dictionaries without forcing a heavy graph database in the demo.

## MVP Implementation

Current code:

- `lib/conversation-graph.ts`
- `buildConversationGraph(trace, scoreReport)`
- shared attempt page compact graph section

The builder:

1. Extracts user trace events as prompt nodes.
2. Extracts assistant trace events as response nodes.
3. Pairs each user prompt with the next assistant response before the next user prompt.
4. Creates prompt graph edges where responses act as edges.
5. Creates response graph edges where prompts act as edges.
6. Creates a status node for each prompt-response pair.
7. Adds sparse incidence and adjacency indexes.

## Research Implications

This representation can support prompt-engineering and harness-engineering research:

- Correlate graph motifs with score axes.
- Detect repeated context switching.
- Measure whether material use improves final quality.
- Compare models by response graph stability under the same prompt graph.
- Locate high-impact user interventions.
- Build counterfactual replay from graph branches.
- Cluster prompt strategies across users solving the same problem.

## Future Persistence

Do not replace `trace_events` yet. Keep trace as the canonical raw record.

When the model stabilizes, add:

- `conversation_graph_snapshots`
- `conversation_graph_nodes`
- `conversation_graph_edges`
- `conversation_graph_pair_statuses`

The first durable snapshot should include:

- graph schema version,
- attempt ID,
- trace event IDs,
- judge report ID,
- generated-at timestamp,
- status inference mode: deterministic, LLM judge, ensemble judge, human labeled.

## Product Guidance

Beginner UI should not expose heavy graph theory. It should show:

- "Prompt nodes"
- "Response nodes"
- "Status"
- "Bottleneck"
- "Material used"

Expert/research/admin UI can expose:

- adjacency,
- incidence,
- graph export,
- graph diff,
- graph motif search,
- score-axis correlation.

## Open Questions

- Should task status be attached to a pair, an edge, or a separate node in persisted storage?
- How should branches and replay attempts connect to the original graph?
- Should material attachments become first-class nodes or metadata on prompt nodes?
- Should judge reports annotate existing graph nodes or produce a parallel evaluation graph?
- What graph serialization should be used for export: JSON Graph, GraphML, custom JSON, or a compact edge list?
