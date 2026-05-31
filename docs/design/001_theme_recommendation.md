# Theme Recommendation

Date: 2026-06-01

## Recommended Theme

**Promethean Workbench**

SKAI's seed metaphor is Prometheus and fire, but the UI should not look fiery, mythic, or cinematic. The better interpretation is:

- Fire as capability.
- Workbench as practice.
- Evidence as materials.
- Trace as a research record.
- Judge report as coaching, not punishment.

The theme should feel like a serious workspace where users learn to put "fuel" into AI through better problem framing, decomposition, materials, and verification.

## Why This Theme Fits SKAI

- It respects the founder's origin line without turning the product into a fantasy brand.
- It supports both beginners and advanced users.
- It works for education, research, portfolio, and later certification.
- It keeps focus on traces, materials, and decisions.
- It can grow into a Baekjoon-like community without becoming visually childish.

## Palette Direction

Recommended palette role names:

- `Ink`: primary text and serious UI surfaces.
- `Mist`: neutral app background.
- `Porcelain`: panels and tool surfaces.
- `Oxidized Teal`: primary actions and selected states.
- `Signal Amber`: warnings, pending states, "fire" accent.
- `Cobalt`: links, model/provider identity, information states.
- `Vermilion`: errors and high-severity bottlenecks.

Suggested colors:

```text
Ink             #171A1F
Graphite        #3F4752
Muted           #697381
Mist            #F4F7F8
Porcelain       #FFFFFF
Line            #D9E0E7
Oxidized Teal   #087C7C
Teal Deep       #075E63
Signal Amber    #D89024
Cobalt          #2D63B8
Vermilion       #C24137
Success         #2F855A
```

Current CSS note:

- The current `#f7f5ef` background is workable for a prototype but reads slightly paper/cream.
- For the next visual pass, move the background toward `Mist #F4F7F8` and keep warmth only as amber accents.
- This avoids SKAI becoming a beige study app while preserving the Prometheus "fuel" metaphor.

## UI Mood

Keywords:

- Clear.
- Dense.
- Evidential.
- Tool-like.
- Serious but not corporate.
- Educational but not childish.
- Community-oriented but not social-media-like.

Avoid:

- Neon AI purple.
- Black terminal hacker aesthetic.
- Cozy study beige.
- Oversized landing-page hero treatment.
- Competitive game UI as the main mood.

## Font Direction

Recommended default:

- UI: Pretendard Variable.
- Mono/evidence/code-like text: JetBrains Mono.
- Headings: Pretendard Variable with heavier weights.

Avoid adding a separate decorative display font in the demo. The product needs to feel like a serious practice surface, and the brand can come from layout, evidence handling, trace structure, and scoring language instead of typography novelty.

## Provider Surface Direction

Provider selection can subtly alter the chat surface, but SKAI should never look like a copied version of another model product.

Use provider-inspired interaction moods:

- OpenAI: minimal and quiet.
- Gemini: exploratory and evidence-oriented.
- xAI Grok: direct and bottleneck-oriented.
- Groq: compact and speed-oriented.
- OpenRouter: routing and comparison-oriented.
- SKAI Mock: workbench default.

Keep the shared SKAI structure stable across providers so prompt traces remain comparable.

## Component Language

Primary components:

- Problem context sidebar.
- Material/evidence drawer.
- Trace timeline.
- Prompt event cards.
- Branch controls.
- Attachment chips.
- Score axis bars.
- Coach report blocks.
- Workflow map.
- Comment threads attached to prompt events.

Control style:

- Use icon buttons where the action is familiar.
- Use text+icon buttons for important commands.
- Use segmented controls for modes.
- Use tabs or a tab-like list for materials.
- Use badges/chips only for metadata and selected files.

## Brand Mark Direction

Keep the flame icon only as a compact brand signal. Do not turn the whole UI into fire imagery.

Possible future mark:

- A small flame inside a square workbench tile.
- A spark connected to trace nodes.
- A monogram `SKAI` with one amber cut.

## Information Design

For solve pages:

1. Left: problem, constraints, materials, local leaderboard.
2. Center: active chat and trace.
3. Bottom or right: final answer and coach report.
4. Share page: workflow first, transcript expandable.

For future desktop layout:

- Consider a three-pane expert mode:
  - left: problem/materials,
  - center: trace/chat,
  - right: judge/report/metrics.

For mobile:

- Collapse materials and report into tabs.
- Keep chat and current attachments visible.

## Recommended Next Design Pass

1. Replace the warm paper background with neutral mist.
2. Tighten solve page density.
3. Make material selection more tab-like.
4. Make trace events more clearly connected as a timeline.
5. Reduce the visual dominance of card shadows.
6. Add clearer selected/published/private states.
7. Add severity colors for bottlenecks.
8. Add mode controls: beginner, standard, expert.

## Alternative Themes Considered

### Research Bench

Very close to the recommendation. It emphasizes evidence, materials, and experiments. It is slightly less distinctive than Promethean Workbench.

### Civic AI Lab

Good for public education and "everyone's AI" positioning. It may feel too institutional if overused.

### AI Arena

Good for ranking and Baekjoon-like competition. Not recommended as the default because SKAI should prioritize learning, research, and portfolio before competition.
