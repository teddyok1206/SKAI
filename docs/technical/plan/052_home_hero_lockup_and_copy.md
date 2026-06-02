# 052 Home Hero Lockup And Copy

## Goal

Remove the duplicated SKAI lockup from the home hero and prepare sharper headline candidates that reflect SKAI's philosophy.

## Scope

- Remove the hero-level `SkaiLockup` from `app/page.tsx`.
- Keep the topbar as the single primary brand lockup on the home screen.
- Replace the generic home headline with the founder-selected Prometheus Hearth copy.
- Remove the hero subtitle.
- Add a design note with curated headline candidates.

## Assumptions

- The duplicated logo is the hero-level lockup, not the topbar brand.
- Home should not become a decorative landing page. It should keep the first action close to problem solving.
- The headline should frame AI skill as orchestration over intent, materials, task flow, verification, and artifact creation.

## Affected Files

- `app/page.tsx`
- `docs/design/003_home_hero_copy_candidates.md`
- `ARCHIVE_prompt_long/010.md`

## Implementation Steps

1. Remove the unused `SkaiLockup` import from `app/page.tsx`.
2. Remove `<SkaiLockup />` from the home hero.
3. Archive the founder's stronger home-copy mood direction.
4. Document headline candidates and the selection criteria.
5. Apply the selected Orchestrator copy with model-performance wording corrected from `constant` to `condition`.
6. Replace that intermediate copy with the founder-selected one-line Prometheus Hearth headline and remove the subtitle.

## Verification

- Run `git diff --check`.
- Run `conda run -n SKAI npm run typecheck`.
- Run `conda run -n SKAI npm run lint`.
- Run `conda run -n SKAI npm run build`.

## Implementation Result

- Removed the duplicated hero lockup.
- Archived the founder's three mood copy set in `ARCHIVE_prompt_long/010.md`.
- Initially selected the Orchestrator mood, but corrected the home headline to avoid claiming that AI/model intelligence is literally constant.
- Final founder decision: use the Prometheus Hearth line as the only hero copy.
- Updated the home headline to `불꽃은 주어졌습니다. 이제 당신의 장작을 넣을 차례입니다.`
- Rendered the headline as two visual lines: `불꽃은 주어졌습니다.` and `이제 당신의 장작을 넣을 차례입니다.`
- Removed the lead/subtitle from the hero.

## Risks

- Removing the hero lockup can make the first viewport slightly less branded. This is acceptable because the topbar already carries the official lockup.
- A metaphor-only headline can weaken beginner comprehension. The next screen's problem browser and first problem entry must make the practical loop clear.

## Philosophy Check

This change keeps fire as a restrained origin metaphor in text, not as a logo/icon/decorative theme. The practical product loop must still carry SKAI's structure: intent, materials, orchestration, verification, and artifact.
