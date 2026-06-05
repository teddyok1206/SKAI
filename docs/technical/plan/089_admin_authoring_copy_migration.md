# 089 Admin Authoring Copy Migration

Date: 2026-06-06

## Goal

`components/admin-authoring-client.tsx`의 raw JSX/attribute text를 copy registry 기반으로 이전해 i18n source baseline을 크게 줄인다.

Status: completed.

Admin authoring은 smoke-test 사용자의 기본 풀이 surface는 아니지만, SKAI 문제를 만드는 운영 도구다. 문제 출제 도구가 언어 시스템을 우회하면 장기적으로 문제 품질과 다국어 운영이 분리되므로, registry 경로로 묶어둔다.

## Scope

- Admin authoring form labels, section titles, placeholders, action labels, empty states를 `lib/i18n/copy-registry.json`에 추가한다.
- `AdminAuthoringClient`가 `useLanguagePreference`와 `getCopy`를 사용하도록 바꾼다.
- `scripts/i18n_source_baseline.json`을 재생성해 감소된 raw text baseline을 고정한다.

## Non-Goals

- Problem draft content field 자체를 자동 번역하지 않는다.
- Category/difficulty/goalProfile enum display name 전체를 이번 slice에서 번역하지 않는다.
- Supabase-backed authoring, rubric editor, playbook editor는 다루지 않는다.

## Implementation Steps

1. Admin authoring copy entries를 registry에 추가한다.
2. `AdminAuthoringClient`에 locale hook과 `t()` helper를 연결한다.
3. JSX text, placeholders, action labels를 copy lookup으로 교체한다.
4. source baseline을 재생성한다.
5. i18n/typecheck/lint/build를 검증한다.

## Result

- Admin authoring form labels, placeholders, actions, empty states, and fallback draft text now use copy registry entries.
- The i18n source checker ignores TypeScript generic/code fragments that were previously misclassified as JSX text.
- `scripts/i18n_source_baseline.json` now records 87 hardcoded source entries, down from 145.

## Verification

- `npm run verify:i18n`
- `conda run -n SKAI npm run typecheck`
- `conda run -n SKAI npm run lint`
- `conda run -n SKAI npm run build`

## Philosophy Check

이 작업은 admin 도구를 번역하는 데 그치지 않는다. SKAI의 문제 출제/운영 표면도 같은 언어 관리 규칙을 따르게 해서, 문제 정의와 자료 구조화라는 핵심 행위가 UI copy drift에 끌려가지 않게 만드는 작업이다.
