# 086 I18n Regression Hardening

Date: 2026-06-05

## Goal

언어 시스템이 한 번 붙은 뒤 다시 raw UI text, 누락 key, 미사용 copy, stale 번역 누적으로 흐트러지는 것을 자동 검증으로 막는다.

이 slice는 번역 품질을 LLM으로 평가하는 작업이 아니라, 개발 workflow에서 바로 잡을 수 있는 구조적 regression을 차단하는 작업이다.

## Scope

- `verify:i18n`이 registry 내부 검사뿐 아니라 source usage 검사를 함께 수행하게 한다.
- 정적 `getCopy("...")` / `t("...")` key가 registry에 존재하는지 확인한다.
- registry key가 source에서 쓰이지 않는 경우를 탐지하되, 동적 key template과 의도적 reserve key는 allowlist로 관리한다.
- 이미 localized 대상으로 지정한 component/app 파일에서 새 raw user-facing JSX text가 추가되는 것을 baseline 방식으로 막는다.
- source check의 기준 파일과 allowlist를 문서화한다.

## Non-Goals

- 모든 admin/founder tooling copy를 이번 slice에서 완전 i18n으로 이전.
- 문제 본문/자료 원문 번역 품질 검사.
- AI 번역 품질 자동 채점.
- route-level locale URL 구조.

## Assumptions

- 기존 코드에는 아직 raw text가 일부 남아 있다. 이것을 한 번에 모두 제거하면 scope가 커진다.
- regression hardening은 "현재 baseline보다 나빠지지 않게 하는 것"부터 시작한다.
- 동적 key template은 SKAI UI에서 의도적으로 쓰인다. 예: `solve.mode.${mode.id}.description`.

## Affected Files

- `scripts/i18n_source_check.mjs`
- `scripts/i18n_source_baseline.json`
- `scripts/i18n_usage_allowlist.json`
- `package.json`
- `docs/technical/plan/075_language_system_track.md`
- `docs/000_orchestration.md`

## Implementation Steps

1. source usage checker를 추가한다.
2. static copy key missing 검사와 dynamic template matching을 구현한다.
3. unused registry key 검사를 추가하고, 현재 의도적 reserve/dynamic usage는 allowlist로 둔다.
4. selected localized source file의 hardcoded JSX text snapshot을 baseline으로 저장한다.
5. `npm run verify:i18n`이 `i18n:check`와 `i18n:source-check`를 모두 실행하게 한다.
6. 075 language track과 orchestration 문서를 갱신한다.

## Verification

- `npm run verify:i18n`
- `conda run -n SKAI npm run typecheck`
- `conda run -n SKAI npm run lint`
- `conda run -n SKAI npm run build`

## Risks

- 너무 엄격한 source scan은 legitimate code string까지 막을 수 있다.
- 너무 느슨한 baseline은 raw copy 제거를 미룰 수 있다.
- dynamic key template을 잘못 해석하면 registry key가 unused로 오탐될 수 있다.

## Rollback

- `verify:i18n`에서 `i18n:source-check`를 제거하면 기존 registry-only check로 돌아간다.
- baseline/allowlist 파일은 source checker만 사용하므로 runtime 영향이 없다.

## Philosophy Check

이 slice는 SKAI를 "번역된 웹사이트"로 포장하는 작업이 아니라, Orchestration/Trace/Artifact 같은 핵심 개념어와 문제 풀이 UI가 두 언어에서 일관되게 유지되도록 개발 체계를 잠그는 작업이다. 사용자의 오케스트레이션 흔적과 judge/coaching 리포트가 언어 전환 때문에 흐려지지 않게 하는 것이 핵심이다.
