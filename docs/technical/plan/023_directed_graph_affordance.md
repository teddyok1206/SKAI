# 023 Directed Graph Affordance

Date: 2026-06-02

## Goal

Make the directed nature of the 3D dual graph easier to perceive.

## Rationale

The graph has directed edges in the data model, but the compact visual nodes need stronger directional affordances. Users should be able to see flow without opening the index:

- prompt node leads to status node,
- status leads to response node,
- response/prompt projections have explicit source and target,
- sequence direction is visible.

## Scope

Included:

- Add direction labels and step numbers in the 3D dual graph rows.
- Strengthen arrowheads and connector lines.
- Mark projection edge chips with source/target labels.
- Add node out/in degree indicators in the detail panel.

Excluded:

- SVG edge routing.
- Force-directed layout.
- Animated graph flow.

## Verification

- Typecheck, lint, build.
- Direction appears in the visual graph without relying on long text summaries.

## Philosophy Check

SKAI's graph is not decorative. Direction matters because orchestration is a sequence of human instructions causing model responses and task-state changes. The UI should make causality and flow legible.
