# 094 Problem Corpus Finalization

## 목적

현재 들어와 있는 33개 문제를 smoke 후보가 아니라 실제 풀이 가능한 SKAI corpus로 확정한다.

요구사항:

- 각 문제는 사용자가 바로 들어가서 풀 수 있어야 한다.
- 문제는 단순 prompt trick이 아니라 문제정의, 자료 사용, task decomposition, verification, artifact formation을 훈련해야 한다.
- generated 문제는 더 이상 local editorial toggle을 켜야 보이는 후보가 아니라, 검토 완료된 corpus로 홈에서 노출되어야 한다.
- 문제별 playbook은 founder/operator가 실제로 문제를 풀어보며 judge calibration에 쓸 수 있는 self-contained trace여야 한다.

## 범위

- 전체 33개 문제의 구조적 검증.
- playbook attachment reference와 material 존재 여부 검증.
- 문제별 “풀이 가능성” audit 문서 작성.
- generated 문제를 브라우저에서 hidden candidate가 아니라 confirmed corpus로 노출.
- 현 `Generated Problem Gate`는 향후 batch authoring/editorial tool로 유지하되, 현재 batch 001의 홈 노출 gating에는 쓰지 않는다.

## 비범위

- 33개 문제 각각의 full final answer를 모두 앱 DB에 저장하지 않는다.
- LLM API를 호출해 모든 문제를 실제 비용으로 live solve하지 않는다.
- certification/anti-cheat는 다루지 않는다.
- 문제 데이터의 대규모 재작성은 논리 오류가 발견될 때만 수행한다.

## 검토 기준

각 문제는 아래 기준을 통과해야 한다.

1. 목표가 명확한가?
2. 불확실성/제약/자료/산출물이 존재하는가?
3. one-shot 최종답보다 단계적 orchestration이 유리한가?
4. 제공 자료가 있으면 자료 간 cross-reference 또는 material control이 필요한가?
5. playbook prompt가 hidden SKAI context 없이 cold-start 모델에게 충분히 자명한가?
6. attachment ids가 실제 material ids와 일치하는가?
7. final answer draft가 문제 deliverable을 충족하는가?
8. 지나친 도메인 전문성 때문에 orchestration 평가가 흐려지지 않는가?
9. 개인정보/민감정보가 실데이터처럼 보이더라도 synthetic/demo context로 안전한가?

## 구현 계획

1. 문제 corpus 자동 검증 스크립트 추가
   - raw generated batch JSON + seed playbook registry를 확인한다.
   - duplicate id, missing playbook, invalid attachment reference, empty material text, no turn, no final answer draft를 잡는다.
2. 전체 문제 audit 문서 작성
   - 33개 문제별 final status, expected orchestration path, watchpoint, 수정 필요 여부를 기록한다.
3. 문제 브라우저 gating 제거
   - current batch 001 generated 문제는 confirmed corpus로 모두 노출한다.
   - editorial dashboard는 future/generated batch QA 도구로 유지한다.
4. 문서 업데이트
   - `docs/000_orchestration.md`에 corpus 확정 상태 반영.
   - AGENT/problem authoring 규칙에 “문제 추가/수정 시 corpus audit와 automated corpus check”를 추가.
5. 검증
   - corpus check
   - `npm run verify:i18n`
   - typecheck/lint/build
   - `npm run verify:skai`

## 리스크

- 모든 문제를 “확정”하면 문제 품질 리스크가 더 이상 숨김 처리로 완충되지 않는다.
- 해결책: 모든 문제에 audit status와 watchpoint를 남기고, future batch부터는 이 audit/check를 통과해야 merge한다.

## 상태

- 완료.

## 수행 결과

- `scripts/problem_corpus_check.mjs`를 추가했다.
- `package.json`에 `problem:check`를 추가했고 `verify:skai` 앞단에 연결했다.
- Generated batch 001의 짧은 material description 6개를 보강했다.
- Generated batch 001의 `classification.expectedTurns`를 실제 playbook turn count와 정합시켰다.
- `docs/problem_generation/002_corpus_finalization_audit.md`를 추가해 33개 문제를 모두 `confirmed`로 기록했다.
- 홈 `ProblemBrowser`에서 current generated batch local editorial gating을 제거했다. 이제 현재 33개 문제는 모두 visible playable corpus다.
- `Generated Problem Gate`는 삭제하지 않고 future batch QA 도구로 유지한다.
- `AGENT.md`, `docs/000_orchestration.md`, `docs/technical/000_decision_register.md`에 corpus 확정 정책을 반영했다.

## 검증 결과

- `npm run problem:check`: 통과.

나머지 앱 검증은 최종 verification 단계에서 함께 수행한다.
