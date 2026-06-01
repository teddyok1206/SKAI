# 021 Conversation Graph Visual Tabs

Date: 2026-06-02

## Goal

Expose SKAI's core 3-dimensional dual graph model as a usable visual tab in the live solving screen.

## Rationale

SKAI is not just a chat UI. The key artifact is the user's orchestration trace:

- prompt graph,
- response graph,
- task-status layer.

The backend already derives this graph from the flat trace. The next step is to make it visible and operational while solving, not only as a conceptual data model.

## Scope

Included:

- Add a reusable `ConversationGraphView` component.
- Add `Chat / Graph` tabs to the problem solving panel.
- Visualize the 3-layer dual graph as prompt/status/response lanes.
- Add projection tabs for dual graph, prompt graph, response graph, status layer, and sparse index.
- Allow node selection with trace content and incidence details.
- Allow branch replay directly from graph nodes that map to trace events.
- Reuse the existing `buildConversationGraph` derivation and branch creation logic.

Excluded:

- Canvas/WebGL graph physics.
- Multi-branch tree explorer.
- Dragging graph nodes.
- Persisted graph layout.

## UX Rule

The graph tab should not replace the chat. It should reveal what SKAI is already tracking:

- user prompts as nodes,
- model responses as dual nodes/edges,
- task status as the third layer,
- branch breakpoints as actionable graph anchors.

## Implementation Steps

1. Build `components/conversation-graph-view.tsx`.
2. Compute `buildConversationGraph` in `ProblemSolver`.
3. Add tab state to `ProblemSolver`.
4. Wire graph node branch buttons to existing `branchFrom`.
5. Add graph visualization CSS.
6. Update orchestration docs and decision register.
7. Verify typecheck, lint, build, and page smoke.

## Verification

- Empty attempts show a graph empty state.
- After at least one prompt/response pair, the graph tab shows prompt, status, and response layers.
- Selecting a node shows details and incidence information.
- Branching from a prompt/response node creates a breakpoint replay attempt.

## Philosophy Check

This is directly aligned with SKAI. It moves the product away from generic chatbot UX and toward visible orchestration structure. The graph must stay derived from the trace so it remains auditable and does not become decorative.
