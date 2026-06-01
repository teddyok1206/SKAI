# 022 Compact Graph Nodes

Date: 2026-06-02

## Goal

Make the graph tab read visually as a graph, not as a row of large summary cards.

## Rationale

The first graph tab rendered each node as a large card with a summary. That exposed useful text, but it made the projection feel like a list. The user's requested behavior is closer to Obsidian-style graph scanning:

- small, stable nodes,
- short fixed labels only,
- detail-on-click in the side panel.

## Scope

Included:

- Shrink graph nodes to compact fixed-size visual nodes.
- Keep only essential fixed-length labels on the node.
- Move summaries and trace content to the selected-node panel.
- Make lane rows and projection strips feel more like connected graph structure.
- Preserve click selection and `Branch from node`.

Excluded:

- Force-directed layout.
- Canvas rendering.
- Persisted custom layout.

## Verification

- Typecheck, lint, build.
- Graph nodes no longer include long summary text inside the node body.

## Philosophy Check

The graph is a structural view of orchestration, not another transcript surface. Raw prompt/response text belongs in the detail panel and raw transcript, while the graph itself should reveal topology, status, and branch anchors.
