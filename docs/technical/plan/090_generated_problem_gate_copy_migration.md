# 090 Generated Problem Gate Copy Migration

## 목적

`Generated Problem Gate` 화면의 user-facing copy를 i18n copy registry로 이전한다. 이 화면은 생성 문제를 smoke test에 노출할지 결정하는 founder/operator 안전장치이므로, 한국어/English 모드가 같은 구조 위에서 작동해야 한다.

## 범위

- `components/generated-problem-editorial-dashboard.tsx`의 고정 텍스트, placeholder, action label, checklist label/description을 registry key로 이전한다.
- 동적 수치(`generated`, `touched`, `published`, material count)는 copy suffix/key를 통해 locale에 맞게 표현한다.
- `lib/i18n/copy-registry.json`에 `admin.generatedGate.*` key를 추가한다.
- `scripts/i18n_source_baseline.json`을 새 baseline으로 갱신한다.
- `docs/000_orchestration.md`, `docs/technical/plan/075_language_system_track.md`에 현재 진척을 반영한다.

## 비범위

- 생성 문제 데이터 자체의 localization은 다루지 않는다. 문제 본문/자료는 `Problem.localized` 또는 source material/derived material layer에서 별도 관리한다.
- editorial state persistence 구조와 publish 조건은 바꾸지 않는다.
- Supabase-backed admin publish flow는 후속 slice다.

## 구현 순서

1. Generated Problem Gate copy key 목록을 정의한다.
2. registry에 ko/en approved entry를 추가한다.
3. 컴포넌트에서 `useLanguagePreference`와 `getCopy`를 사용해 렌더링한다.
4. source baseline을 갱신한다.
5. `verify:i18n`, typecheck, lint, build 또는 `verify:skai`로 회귀를 확인한다.
6. 문서와 plan 상태를 갱신하고 커밋한다.

## 리스크

- admin/operator UI의 영어 표현은 사용자-facing product copy만큼 다듬어지지 않았을 수 있다. 다만 registry로 옮겨야 이후 stale/missing 운영이 가능하다.
- classification 값과 문제 데이터 값은 구조 데이터라 그대로 둔다. 이를 억지로 registry로 옮기면 문제 source와 UI copy가 섞인다.

## 철학 점검 기준

- 생성 문제를 무분별하게 공개하지 않고, 실제 orchestration 훈련에 적합한 문제만 선별하게 만드는가?
- UI copy 관리가 SKAI를 generic chatbot/admin toy가 아니라 문제 품질과 trace 품질을 통제하는 시스템으로 강화하는가?

## 결과

- `admin.generatedGate.*` registry key 27개를 추가했다.
- `GeneratedProblemEditorialDashboard`의 header, summary, action, checklist, detail label, note placeholder를 registry 기반으로 이전했다.
- 문제 title/subtitle, classification, review note 등 생성 문제의 구조 데이터는 problem/source data로 남겼다.
- source raw JSX/attribute baseline은 87개에서 77개 entry로 줄었다.
- `verify:i18n`, typecheck, lint, build, `verify:skai`를 통과했다.

## 상태

- 완료.
