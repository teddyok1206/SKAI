# 088 Raw JSX Baseline Reduction

Date: 2026-06-05

## Goal

086에서 만든 raw JSX/attribute text baseline을 줄인다. 새 raw text 증가를 막는 것에서 한 단계 나아가, 노출도가 큰 surface부터 copy registry 경로로 이전한다.

Status: completed.

## Scope

- Admin page header raw copy를 registry 기반 client header로 이전한다.
- `.skai` viewer page title prop의 raw string을 제거하고 viewer 내부 localized fallback을 사용한다.
- `scripts/i18n_source_baseline.json`을 갱신해 감소된 baseline을 고정한다.

## Non-Goals

- Admin/founder dashboard의 모든 raw copy를 한 번에 이전.
- 문제 본문/자료 원문을 UI copy registry로 이동.
- copy 품질 재작성.

## Implementation Steps

1. Admin header용 copy registry entry를 추가한다.
2. `AdminPageHeader` client component를 추가한다.
3. `app/admin/page.tsx`의 raw header copy를 component로 교체한다.
4. `app/skai/viewer/page.tsx`의 raw title prop을 제거한다.
5. source baseline을 재생성하고 `verify:i18n`으로 확인한다.

## Result

- `admin.header.eyebrow`, `admin.header.title`, `admin.header.lead` copy registry entries were added.
- Admin page header now renders through `AdminPageHeader`.
- `/skai/viewer` no longer passes a raw `SKAI File Viewer` title prop and uses viewer fallback copy.
- `scripts/i18n_source_baseline.json` now records 145 hardcoded source entries, down from 149.

## Verification

- `npm run verify:i18n`
- `conda run -n SKAI npm run typecheck`
- `conda run -n SKAI npm run lint`
- `conda run -n SKAI npm run build`

## Philosophy Check

이 작업은 디자인 polish가 아니라 운영 규율이다. SKAI의 언어 레이어가 핵심 오케스트레이션 UI를 안정적으로 지탱하게 하려면 raw copy를 점진적으로 줄이고 registry/source check를 개발 습관으로 고정해야 한다.
