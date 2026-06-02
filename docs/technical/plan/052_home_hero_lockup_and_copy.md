# 052 Home Hero Lockup And Copy

## Goal

Remove the duplicated SKAI lockup from the home hero and prepare sharper headline candidates that reflect SKAI's philosophy.

## Scope

- Remove the hero-level `SkaiLockup` from `app/page.tsx`.
- Keep the topbar as the single primary brand lockup on the home screen.
- Replace the generic home headline with the selected Orchestrator mood copy.
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

## Verification

- Run `git diff --check`.
- Run `conda run -n SKAI npm run typecheck`.
- Run `conda run -n SKAI npm run lint`.
- Run `conda run -n SKAI npm run build`.

## Implementation Result

- Removed the duplicated hero lockup.
- Archived the founder's three mood copy set in `ARCHIVE_prompt_long/010.md`.
- Selected the Orchestrator mood, but corrected the home headline to avoid claiming that AI/model intelligence is literally constant.
- Updated the home headline to `모델의 성능은 조건입니다. 변수는 당신의 오케스트레이션입니다.`
- Updated the lead to `의도와 현실을 구조화하고, 자료를 통제하며, 검증 가능한 산출물로 남긴다.`

## Risks

- Removing the hero lockup can make the first viewport slightly less branded. This is acceptable because the topbar already carries the official lockup.
- A headline that is too abstract can weaken beginner comprehension. The lead sentence should keep the practical explanation.

## Philosophy Check

This change keeps SKAI away from decorative landing-page branding and puts the emphasis back on the user's orchestration act. The headline candidates should express SKAI's claim without turning the product into a generic AI tips site.
