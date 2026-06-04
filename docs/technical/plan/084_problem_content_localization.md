# 084 Problem Content Localization

Date: 2026-06-05

## Goal

문제 탐색/풀이/judge/share/export에서 쓰이는 문제 본문을 UI copy registry와 분리된 `Problem` content localization layer로 관리한다.

이 slice의 목적은 전체 문제 번역 완성이 아니라, SKAI의 문제 원문, 번역본, 자료 원문, 추후 judge/coaching 입력이 서로 섞이지 않도록 백본을 만드는 것이다.

## Scope

- `Problem`에 source locale과 locale별 derived problem content metadata를 추가한다.
- `ProblemMaterial`에는 원문 source locale과 derived text metadata를 받을 수 있는 선택 필드를 추가하되, 자료 원문은 이번 slice에서 번역하지 않는다.
- 3개 seed problem에는 영어 문제 본문 view를 추가한다.
- 문제 브라우저와 풀이 화면은 현재 language preference에 맞는 localized problem view를 표시한다.
- judge context는 요청 locale에 맞는 localized problem view를 사용하되, trace 원문과 자료 첨부 원문은 그대로 보존한다.
- 공유 화면과 `.skai` export는 share/viewer locale chrome과 독립적으로 attempt 당시 문제 locale metadata를 보존할 수 있게 한다.

## Non-Goals

- ChatGPT Pro 생성 batch 30개 전체 번역.
- 자료 이미지, xlsx/csv/pdf extracted text 번역.
- 문제별 playbook prompt variant 전체 작성.
- 자동 번역 API 연결.
- language switch가 기존 attempt trace 원문을 번역하는 기능.

## Assumptions

- SKAI 데모의 source problem locale은 현재 대부분 `ko`다.
- UI locale과 problem source locale은 다를 수 있다.
- 문제의 원문 자료는 평가의 근거이므로 번역본이 있더라도 derived material로만 취급해야 한다.
- 일반 chat provider에는 문제 본문이 hidden system context로 들어가지 않는다. Cold-start 원칙을 지키기 위해 이 slice에서도 문제 본문을 provider에게 자동 주입하지 않는다.

## Affected Files

- `lib/types.ts`
- `lib/problem-localization.ts`
- `data/problems.ts`
- `components/problem-browser.tsx`
- `components/problem-solver.tsx`
- `components/share-attempt-client.tsx`
- `lib/judge.ts`
- `lib/skai-format.ts`
- `docs/000_orchestration.md`
- `docs/technical/plan/075_language_system_track.md`

## Data Model

```ts
interface Problem {
  locale?: ReportLocale;
  availableLocales?: ReportLocale[];
  localized?: Partial<Record<ReportLocale, LocalizedProblemContent>>;
}

interface LocalizedProblemContent {
  locale: ReportLocale;
  sourceLocale: ReportLocale;
  translationStatus: TranslationStatus;
  title?: string;
  subtitle?: string;
  statement?: string;
  userGoal?: string;
  constraints?: string[];
  starterContext?: string[];
  deliverables?: string[];
}
```

`ProblemMaterial`에는 번역 텍스트를 원문 field에 덮어쓰지 않고 derived field로 붙일 수 있는 metadata만 준비한다.

## Implementation Steps

1. `Problem`/`ProblemMaterial` 타입에 locale metadata를 추가한다.
2. `getLocalizedProblem(problem, locale)` helper를 만든다.
3. 3개 seed problem의 영어 problem content를 추가한다.
4. `ProblemBrowser` 검색/카드가 localized problem view를 사용하게 한다.
5. `ProblemSolver`의 문제 preview, sidebar, attempt title, publish `.skai` snapshot이 localized view를 사용하게 한다.
6. judge context가 `input.locale` 기준 localized problem view를 사용하게 한다.
7. 공유 화면의 문제 제목 fallback도 localized view를 사용하게 한다.
8. 075 plan과 orchestration 문서를 갱신한다.

## Verification

- `npm run verify:i18n`
- `conda run -n SKAI npm run typecheck`
- `conda run -n SKAI npm run lint`
- `conda run -n SKAI npm run build`

## Risks

- 문제 본문 번역을 hidden provider context로 넣으면 cold-start comparability가 깨진다.
- 자료 번역을 원문처럼 취급하면 material grounding 평가가 흐려진다.
- 생성 문제 전체 번역을 서두르면 품질 검증보다 텍스트 양산에 끌려갈 수 있다.

## Rollback

- `localized` metadata와 helper 사용을 제거하면 기존 Korean source problem fields로 즉시 fallback된다.
- seed problem의 영어 content는 optional field라 제거해도 runtime은 기존 field를 사용한다.

## Philosophy Check

이 slice는 SKAI를 단순 bilingual chatbot으로 만드는 작업이 아니라, 같은 orchestration problem을 여러 언어에서 풀 수 있도록 문제 구조와 자료 원문을 분리하는 작업이다. 자료/trace 원문 보존, derived translation 분리, judge locale metadata를 지켜야 SKAI의 핵심인 trace와 material grounding의 진실성이 유지된다.
