# 053 Home Hero Line Integrity

## Goal

Keep the Prometheus home headline from wrapping inside each sentence. The only visual line break should be between the two sentences.

## Scope

- Replace raw text plus `<br />` with two explicit headline line spans.
- Add hero-specific CSS that prevents per-sentence wrapping.
- Reduce the hero headline font size responsively so the longer second sentence fits across viewport widths.

## Assumptions

- The founder wants exactly two visual lines:
  - `불꽃은 주어졌습니다.`
  - `이제 당신의 장작을 넣을 차례입니다.`
- It is acceptable for the headline to scale down on narrow screens to preserve this line integrity.
- This should not affect other page `h1` elements.

## Affected Files

- `app/page.tsx`
- `app/globals.css`
- `docs/technical/plan/052_home_hero_lockup_and_copy.md`

## Verification

- Run `git diff --check`.
- Run `conda run -n SKAI npm run typecheck`.
- Run `conda run -n SKAI npm run lint`.
- Run `conda run -n SKAI npm run build`.

## Implementation Result

- Replaced the raw `<br />` headline with two explicit `.home-hero-title-line` spans.
- Added `.home-hero-title-line { white-space: nowrap; }` so wrapping can only happen between the two sentences.
- Added `.home-hero-title` responsive font sizing with `clamp(18px, 5.6vw, 72px)` so the longer second sentence scales down on narrow screens.

## Philosophy Check

This is a presentation-quality fix. It preserves the founder-selected metaphor while making the first viewport feel deliberate instead of accidentally wrapped.
