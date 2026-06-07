# 101 Home Copy And Remaining Operational Slices

## 목적

홈페이지의 모든 visible copy를 더 짧고 명확하게 정리하고, 직전 대화에서 정한 남은 slice 1-7을 한 턴 안에서 가능한 한 end-to-end로 처리한다.

홈 copy의 기준은 다음이다.

- SKAI는 AI 사용법 팁 사이트가 아니라 문제 정의, 자료 통제, task 분해, 검증, 산출물 형성을 훈련하는 플랫폼이다.
- 홈은 landing page가 아니라 바로 문제를 고르는 작업대여야 한다.
- "Smoke", "candidate", "advanced filter"처럼 내부 운영자 냄새가 강한 단어는 사용자가 보는 첫 화면에서 줄인다.
- 모델/랭킹/프롬프트 치트키 느낌을 내지 않는다.
- Prometheus/fire headline은 유지하되, 그 아래 문제 탐색 문법이 실사용 loop를 설명해야 한다.

## 범위

### Home Copy Pass

- `home.*`
- `problemBrowser.*`
- `localDraft.list.*`
- 문제 카드 자체의 problem content는 이번 범위 밖이다. 문제 내용은 corpus/source content이며 UI chrome과 분리한다.

### Slice 1. Materials-heavy Live Judge

- `club-budget-workflow` golden triplet으로 live Gemini judge를 실행한다.
- material grounding 관련 graph annotation, score ordering, human-review signal을 확인한다.
- 결과는 `docs/technical/judge_calibration/`에 저장한다.

### Slice 2. Founder Calibration Supabase Persistence

- founder calibration label을 Supabase에 저장하는 최소 migration/API/client helper를 추가한다.
- local-first behavior는 유지한다.
- service-role 또는 RLS 아래에서 founder/user 범위 저장이 가능해야 한다.

### Slice 3. Judge Report Metrics

- calibration runner가 target hit rate, fallback anchor rate, duplicate finding rate를 계산해 report한다.
- 점수보다 graph target/evidence 품질을 보게 만든다.

### Slice 4. Finding Dedupe/Merge

- deterministic annotation과 LLM finding이 같은 target/kind/title을 반복할 때 중복을 줄인다.
- graph overlay가 번잡해지는 것을 막는다.

### Slice 5. Playbook Source-Of-Truth Guard

- 완전한 source-of-truth 통합은 큰 migration이므로 이번 slice에서는 drift를 자동 감지하는 check를 추가한다.
- Markdown playbook과 typed app playbook의 Turn 1/attachment 기본 정합성을 검사한다.

### Slice 6. Supabase-backed Authoring / Founder Review 보강

- 2번 persistence를 founder review dashboard에 연결한다.
- authoring은 현재 local draft MVP를 유지하되, export/import/playbook editor는 후속으로 남긴다.

### Slice 7. Deployed Smoke

- `https://skai-sable.vercel.app/` public route와 health route를 확인한다.
- push 후 Vercel reflection은 가능하면 확인한다.

## 비범위

- 모든 admin raw copy를 완전 i18n으로 이전.
- Supabase-backed full problem CMS.
- 모든 33개 problem live judge calibration.
- OCR/xlsx/pdf parser 완성.
- multi-model harness mode.

## 구현 단계

1. 홈 copy inventory와 registry update.
2. calibration runner metrics 확장.
3. LLM/deterministic annotation dedupe.
4. founder calibration persistence migration/API/client/dashboard 연결.
5. playbook drift check script 추가 및 `problem:check`에 연결.
6. materials-heavy live judge run.
7. docs update, verification, commit, push, deployed smoke.

## 검증

- `npm run verify:i18n`
- `npm run problem:check`
- `npm run verify:skai`
- `conda run -n SKAI npm run build`
- live `/api/judge` materials-heavy calibration
- deployed health/public URL check after push

## 위험

- 한 턴에 모든 slice를 다루므로 각 slice는 MVP 수준으로 제한한다.
- Supabase migration은 사용자가 직접 적용해야 production DB에 반영된다.
- live Gemini judge 결과는 변동성이 있으므로 report를 evidence로 남기되 절대적 정답으로 취급하지 않는다.

## SKAI Philosophy Check

이 작업은 홈 첫 화면부터 문제 선택, 자료 통제, trace/judge/graph feedback으로 이어지는 흐름을 명료하게 만든다. 핵심 위험은 홈페이지가 철학 문구만 많은 landing page가 되거나, judge가 점수/리더보드처럼 보이는 것이다. 따라서 홈 copy는 짧게, judge 결과는 graph/evidence/human-review 중심으로 유지한다.

## 구현 결과

2026-06-07에 다음 범위를 구현했다.

- Home copy pass: home/problem browser/local draft chrome copy를 더 짧고 직접적인 작업 언어로 정리했다. `Smoke`, `candidate`, 내부 운영자 용어는 홈 첫 화면에서 줄였다.
- Slice 1: `club-budget-workflow` materials-heavy live Gemini judge watchpoint를 수행했다.
  - Clean full triplet run: `docs/technical/judge_calibration/2026-06-07T09-40-35-468Z_judge_calibration.md`
  - Full triplet ordering은 weak < average < strong으로 통과했다.
  - 세 level 모두 LLM judge succeeded이며, graph target hit rate 1, duplicate finding rate 0으로 통과했다.
- Slice 2/6: `supabase/migrations/012_founder_review_notes.sql`, `/api/founder/review-notes`, founder review dashboard remote note sync를 추가했다. Local-first save는 유지하고, Supabase가 가능하면 reviewer/attempt 단위로 note와 calibration label을 upsert한다.
- Slice 3: calibration runner가 graph target hit rate, low-confidence anchor rate, duplicate finding rate를 JSON/Markdown report에 기록한다.
- Slice 4: conversation graph annotation merge/dedupe를 target/kind/axis/title 기준으로 보강하고, LLM judge bottleneck label 중복을 줄였다.
- Slice 5: `scripts/playbook_source_check.mjs`를 추가하고 `npm run problem:check`에 연결했다. Seed playbook Markdown과 typed playbook의 turn count, cold-start Turn 1, attachment hint 정합성을 검사한다.
- Slice 7: local production build와 local live judge smoke를 완료했다. Public Vercel smoke는 commit/push 뒤 수행한다.

## 구현 중 발견한 Watchpoints

- Gemini judge는 의미상 정상인 JSON에서도 enum label을 느슨하게 낸다. `targetKind`, `finding.kind`, legacy `bottlenecks[].replaySuggestion`을 strict failure가 아니라 normalization/truncation path로 받아야 한다.
- Low-confidence anchor rate는 약한/불완전 trace에서 높아진다. 이 값은 judge failure가 아니라 founder가 확인해야 할 calibration signal로 봐야 한다.
- Founder review notes migration `012`는 production Supabase에서 직접 적용해야 한다. 적용 전에도 local-first founder review는 동작한다.

## 검증 결과

- `npm run verify:i18n`: 통과
- `npm run problem:check`: 통과
- `npm run verify:skai`: 통과
- `conda run -n SKAI npm run build`: 통과
- live Gemini judge:
  - `club-budget-workflow` full triplet ordering 통과
  - `club-budget-workflow` 세 level 모두 LLM judge 성공 확인
