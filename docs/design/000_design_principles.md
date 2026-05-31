# SKAI Design Principles

Date: 2026-06-01

## Product Nature

SKAI is not a landing page, AI toy, generic chatbot, or prompt gallery. It is a practice environment for solving unclear real-world problems with AI.

The interface should feel like:

- A problem-solving workbench.
- A research notebook.
- A judge console.
- A community archive of reasoning traces.

It should not feel like:

- A crypto/AI neon dashboard.
- A lecture landing page.
- A gamified score grinder.
- A soft pastel study app.
- A pure enterprise admin panel.

## Core UX Promise

The user should feel:

> I can see how my thinking, prompts, materials, AI outputs, and verification steps connect.

The design should make process visible before outcome.

## Visual Hierarchy

1. Problem and constraints.
2. Available materials and selected attachments.
3. Prompt trace and workflow.
4. Final answer.
5. Coach report and score.
6. Community comparison.

The total score should be visible but never visually dominate the whole experience.

## Interaction Principles

- The trace is the primary artifact.
- Materials are evidence, not decorative attachments.
- Branching from a prompt should feel like reopening an experiment.
- Shared attempts should show workflow first, raw transcript second.
- Beginner mode should hide advanced metrics until they are useful.
- Expert mode can expose token, latency, context-switching, and model metadata.

## Layout Principles

- Prefer dense but readable work surfaces.
- Use sidebars for problem context and materials.
- Use the center area for active solving.
- Use panels for tools, repeated items, reports, and modals.
- Avoid page sections that look like marketing cards.
- Do not nest cards inside cards.
- Keep card radius at 8px or less.

## Typography

- Use system UI fonts first for speed and clarity.
- Use strong weight sparingly for labels, axes, and commands.
- Do not use oversized hero type inside tool surfaces.
- Keep letter spacing at 0.
- Do not scale font size with viewport width beyond normal responsive breakpoints.

## Color Principles

- Avoid one-hue UI.
- Avoid purple/blue AI gradients.
- Avoid beige/cream/sand/tan dominance.
- Avoid dark slate dominance.
- Use restrained accents to communicate action, evidence, warning, and score.

## Motion And Feedback

- Motion should clarify state changes, not entertain.
- Prefer subtle hover, selected, loading, and branch states.
- Do not use decorative orbs, bokeh blobs, or ambient gradients.

## Accessibility And Trust

- The app must be legible on laptops in seminar settings.
- Buttons and controls should clearly communicate actions.
- File attachment and publish actions need explicit state.
- Public/private trace boundaries must be visually obvious.

