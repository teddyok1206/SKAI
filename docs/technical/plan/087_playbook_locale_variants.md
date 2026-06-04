# 087 Playbook Locale Variants

Date: 2026-06-05

## Goal

문제별 operator playbook이 UI locale과 같은 언어로 삽입될 수 있게 한다. Playbook prompt는 숨은 system prompt가 아니라 사용자가 직접 볼 수 있는 composer draft이므로, locale variant 역시 사용자에게 보이는 문제 풀이 artifact로 취급한다.

Status: completed.

## Scope

- `ProblemPlaybook`에 locale별 derived playbook variant를 추가한다.
- 3개 seed problem playbook에 English turn title/prompt/final answer draft를 추가한다.
- `ProblemSolver`가 현재 language preference에 맞는 localized playbook view를 사용한다.
- 생성 batch 30문제 playbook은 source locale fallback으로 유지한다.

## Non-Goals

- ChatGPT Pro 생성 batch 30개 playbook 전체 번역.
- Markdown playbook과 typed app playbook source-of-truth 통합.
- 자동 번역 API 연결.

## Implementation Steps

1. Playbook 타입에 `locale`, `availableLocales`, `localized` metadata를 추가한다.
2. `getLocalizedProblemPlaybook(problemId, locale)` helper를 추가한다.
3. Seed problem 3개의 English playbook variant를 작성한다.
4. `ProblemSolver`의 playbook lookup을 locale-aware helper로 교체한다.

## Result

- 3개 seed problem playbook은 English turn title/prompt/final answer draft를 가진다.
- `ProblemSolver`의 playbook strip은 current UI locale에 맞는 visible composer draft를 삽입한다.
- Generated batch playbooks는 source locale fallback으로 유지한다.

## Verification

- `npm run verify:i18n`
- `conda run -n SKAI npm run typecheck`
- `conda run -n SKAI npm run lint`
- `conda run -n SKAI npm run build`

## Philosophy Check

이 작업은 프롬프트 치트키를 숨겨 제공하는 것이 아니라, smoke/founder가 반복 테스트할 때 쓰는 visible operator script를 언어별로 명료하게 만드는 작업이다. Playbook 삽입은 계속 자동 전송이 아니라 composer draft로 남아야 한다.
