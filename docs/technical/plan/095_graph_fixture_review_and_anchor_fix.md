# 095 Graph Fixture Review And Anchor Fix

## 목적

문제 corpus 확정 작업 중 실제 live solve graph를 만든 것은 아니므로, 현재 repo에 존재하는 `.skai` fixture graph와 graph builder를 기준으로 SKAI 3D Dual Graph 정합성을 검토한다.

## 범위

- `fixtures/skai/*.skai` child/parent graph의 dual relation invariant를 점검한다.
- Prompt edge, Response edge, Status edge가 의도한 node/dual node를 참조하는지 확인한다.
- Branch replay fixture의 breakpoint anchor가 실제 앱 graph builder와 같은 수준으로 저장되는지 확인하고, fixture 생성 스크립트가 비워 둔 anchor를 보정한다.
- 검토 결과를 orchestration 문서에 짧게 반영한다.

## 비범위

- 33개 문제를 live LLM API로 모두 풀이하지 않는다.
- Graph UI redesign은 하지 않는다.
- Judge/coaching 알고리즘을 바꾸지 않는다.

## 발견 사항

- `lib/conversation-graph.ts`의 실제 앱 graph builder는 `breakpointNodeId`와 `breakpointPairId`를 parent trace event/source trace event 기준으로 resolve한다.
- `scripts/generate_skai_fixtures.mjs`의 fixture용 graph builder는 같은 정보를 계산하지 않고 `undefined`로 둔다.
- 이 때문에 fixture graph는 structural invariant는 통과하지만, branch replay anchor fixture가 실제 제품 graph보다 약하게 저장된다.

## 구현 계획

1. fixture graph builder의 branchGraph 생성 로직을 실제 builder와 맞춘다.
2. fixtures를 재생성한다.
3. `.skai` validation, viewer smoke, judge regression, typecheck, lint를 다시 실행한다.

## 검증

- custom graph invariant check
- `npm run skai:fixtures`
- `npm run verify:skai`

## 상태

- 완료.

## 수행 결과

- fixture graph builder가 branch replay에서 `breakpointTraceEventId`, `breakpointNodeId`, `breakpointPairId`를 실제 앱 graph builder와 같은 방식으로 resolve하도록 수정했다.
- `fixtures/skai/branch-replay.skai`와 `fixtures/skai/derived/branch-replay.judged.skai`를 재생성했다.
- branch replay fixture의 child graph는 이제 `prompt:fixture-branch-replay-u2`와 `pair:fixture-branch-replay-u2:fixture-branch-replay-a2`를 breakpoint anchor로 가진다.
- custom invariant check에서 모든 fixture child/parent graph의 Prompt edge, Response edge, Status edge, dual node, branch anchor 참조가 통과했다.

## 검토 소감

- 현재 graph backbone은 수학적 구조 측면에서 우리가 의도한 dual graph 표현과 정합한다.
- 다만 fixture/playbook graph는 매우 정돈된 1:1 alternating chat이다. 실제 유저의 지저분한 풀이에서는 pending prompt, 장문 반복, 자료 미사용, mid-turn course correction, branch fan-out이 더 많이 생길 것이므로 smoke 로그 기반 graph density 검토가 필요하다.
- Status inference는 현재 structural/deterministic signal에 강하게 의존한다. judge/coaching이 충분히 성숙하기 전에는 `verification`/`material_used` 같은 상태가 keyword/attachment 중심으로 잡히므로, 실제 학습 피드백은 extension overlay calibration이 계속 필요하다.

## 검증 결과

- custom graph invariant check: 통과.
- `npm run skai:fixtures`: 통과.
- `npm run judge:fixture`: 통과.
