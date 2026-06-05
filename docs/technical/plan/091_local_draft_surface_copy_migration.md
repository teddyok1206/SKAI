# 091 Local Draft Surface Copy Migration

## 목적

로컬 문제 초안 목록과 local draft not-found 표면의 raw UI copy를 i18n registry로 이전한다. 직접 만든 문제도 seed/generated 문제와 같은 문제 브라우저 문법 위에 있어야 하므로, category/difficulty label은 기존 problem browser registry key를 재사용한다.

## 범위

- `components/authored-problem-list.tsx`의 section header, aria-label, action label, minute suffix를 registry로 이전한다.
- `components/local-problem-solver.tsx`의 `Local Draft` eyebrow를 registry로 이전한다.
- 기존 `problemBrowser.category.*`, `problemBrowser.difficulty.*` key를 재사용한다.
- 필요한 신규 `localDraft.*` 또는 `solve.localDraft.*` key를 `lib/i18n/copy-registry.json`에 추가한다.
- source baseline, orchestration docs, language track을 갱신한다.

## 비범위

- 로컬 draft 저장 구조와 problem content localization은 바꾸지 않는다.
- Admin authoring form 구조와 Supabase publish/edit flow는 다루지 않는다.

## 구현 순서

1. 필요한 local draft copy key를 정의한다.
2. registry에 ko/en approved entry를 추가한다.
3. `AuthoredProblemList`와 `LocalProblemSolver`가 locale preference를 읽도록 수정한다.
4. source baseline을 갱신하고 i18n/type/lint/build/`.skai` 회귀를 확인한다.
5. 문서와 plan 상태를 완료로 갱신하고 커밋한다.

## 철학 점검 기준

- 로컬 draft도 SKAI 문제로서 같은 분류/풀이 문법을 따른다는 점이 유지되는가?
- UI copy migration이 문제 data/source와 operator chrome을 분리하는 방향을 강화하는가?

## 결과

- `localDraft.list.*` key 5개와 `solve.localDraft.eyebrow` key를 추가했다.
- `AuthoredProblemList`는 locale preference를 읽고, category/difficulty label은 기존 `problemBrowser.*` registry key를 재사용한다.
- `LocalProblemSolver`의 local draft not-found eyebrow도 registry 기반으로 이전했다.
- source raw JSX/attribute baseline은 77개에서 72개 entry로 줄었다.
- `verify:i18n`, typecheck, lint, build, `verify:skai`를 통과했다.

## 상태

- 완료.
