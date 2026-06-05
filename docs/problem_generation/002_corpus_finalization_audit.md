# SKAI Problem Corpus Finalization Audit

Date: 2026-06-06

## 결론

현재 앱에 들어와 있는 33개 문제는 smoke 후보가 아니라 실제 풀이 가능한 SKAI corpus로 확정한다.

- Seed 문제: 3개
- Generated batch 001 문제: 30개
- 총 문제 수: 33개
- 자동 검증 명령: `npm run problem:check`
- 검증 결과: 통과

이 audit의 의미는 “모든 문제를 live LLM API로 비용을 들여 완주했다”가 아니다. 현재 데모 단계에서 필요한 기준, 즉 문제 정의, 자료 사용, 세분화, 검증, 최종 산출물 형성이 가능한 구조인지와 playbook/material 정합성이 맞는지를 확인했다는 뜻이다.

## 확정 기준

각 문제는 아래 기준을 통과해야 한다.

1. 사용자가 바로 문제 화면에 들어가 풀이를 시작할 수 있다.
2. 첫 playbook prompt는 hidden SKAI context 없이 cold-start 모델에게 던질 수 있다.
3. 자료가 있는 문제는 playbook에서 실제 material id를 참조한다.
4. 자료가 2개 이상이면 자료 간 대조 또는 material control이 요구된다.
5. 단순 one-shot 정답보다 문제정의, 세분화, 검증, task 배분이 더 좋은 풀이 경로다.
6. final answer draft 또는 제출용 정리 지시가 있다.
7. 지나친 도메인 전문성 때문에 orchestration 평가가 흐려지지 않는다.
8. synthetic/demo 자료는 개인정보나 실데이터처럼 오해되지 않도록 앱 내 추출 텍스트 중심으로 제공된다.

## 이번 보정

- `docs/problem_generation/batches/001_30problems.json`의 일부 material description이 너무 짧아, 자료 목록에서 사용자가 의미를 알 수 있도록 설명을 보강했다.
- generated 8개 문제의 `classification.expectedTurns`가 실제 playbook 4턴과 어긋나 있어 모두 4로 정합시켰다.
- `scripts/problem_corpus_check.mjs`를 추가해 duplicate id, missing seed playbook, material/attachment mismatch, short first prompt, missing final answer draft를 자동 검사한다.
- `npm run problem:check`를 추가했고 `npm run verify:skai` 앞단에 corpus check를 연결했다.

## 확정 문제 목록

| Problem | 축 / 난이도 | 자료 | 핵심 역량 | 풀이상 bottleneck / watchpoint | Status |
| --- | --- | ---: | --- | --- | --- |
| `ambiguous-research-brief` | research / intro | 0 | problem_definition | 넓은 “자료조사” 요청을 바로 요약하지 않고 청중, 시간, 검증 기준, 발표 메시지로 좁히는지 확인 | confirmed |
| `club-budget-workflow` | strategy / standard | 3 | material_grounding / workflow_design | 영수증, 이체 내역, 신청표를 대조하고 AI task와 사람 검토 지점을 분리하는지 확인 | confirmed |
| `counterfactual-product-review` | data_analysis / advanced | 0 | verification | 작은 리뷰 데이터에서 과잉 일반화를 막고 반례/추가 수집 데이터로 결론을 낮추는지 확인 | confirmed |
| `meeting-action-owner-map` | workplace / standard | 2 | material_grounding | Turn 2에서 자료 간 후속 발언을 회의 결정에 연결하는 지점 | confirmed |
| `expense-reconciliation-with-policy` | workplace / standard | 3 | verification | Turn 2에서 OCR D의 34,900원과 신청표 34,400원의 불일치를 발견하는 지점 | confirmed |
| `onboarding-workflow-redesign` | workplace / advanced | 4 | workflow_design | Turn 3에서 HR 표준화와 팀별 자율성의 충돌을 파일럿 구조로 해결하는 지점 | confirmed |
| `client-email-triage` | workplace / intro | 1 | decomposition | Turn 1에서 답장 작성보다 이슈 분해와 확인 질문을 먼저 요구하는 지점 | confirmed |
| `remote-incident-briefing` | workplace / standard | 3 | workflow_design | Turn 2에서 사실·가설·영향·액션을 네 칸으로 분리하는 지점 | confirmed |
| `youth-library-research-plan` | research / intro | 0 | problem_definition | Turn 1에서 목표를 '이용 증가'에서 검증 가능한 리서치 질문으로 좁히는 지점 | confirmed |
| `abstract-conflict-evidence-map` | research / standard | 3 | verification | Turn 2에서 연구 설계 차이와 측정 지표 차이를 표로 분리하는 지점 | confirmed |
| `grant-program-fit-analysis` | research / advanced | 4 | cost_control | Turn 3에서 자부담 현금 최소 요건과 현 예산의 차이를 계산해 조건부 전략으로 전환하는 지점 | confirmed |
| `competitor-feature-evidence-map` | research / standard | 3 | problem_definition | Turn 2에서 관찰 사실, 사용자 pain point, 구현 난이도를 별도 축으로 분리하는 지점 | confirmed |
| `policy-feedback-synthesis` | research / advanced | 4 | stakeholder_alignment | Turn 3에서 의견 빈도보다 쟁점 다양성과 영향받는 집단을 중심으로 재구성하는 지점 | confirmed |
| `nonprofit-campaign-concept` | creative / intro | 1 | problem_definition | Turn 1에서 '좋은 문구' 요청을 '대상-감정-행동' 구조로 바꾸는 지점 | confirmed |
| `recipe-video-script-adaptation` | creative / standard | 2 | decomposition | Turn 2에서 원본 단계와 댓글의 혼란 포인트를 연결해 컷 구조를 짜는 지점 | confirmed |
| `brand-voice-refresh-conflict` | creative / advanced | 4 | adaptation | Turn 3에서 콘텐츠 유형별 톤 허용 범위를 나누고 금지선을 정의하는 지점 | confirmed |
| `museum-audio-guide-sprint` | creative / standard | 2 | adaptation | Turn 2에서 작품별 핵심 메시지와 관람객 질문을 연결해 90초 구조로 압축하는 지점 | confirmed |
| `branching-game-narrative-seed` | creative / intro | 0 | decomposition | Turn 1에서 '흥미로운 이야기'를 '선택-결과-상태 변화' 표로 바꾸는 지점 | confirmed |
| `customer-review-priority-analysis` | data_analysis / standard | 2 | material_grounding | Turn 2에서 리뷰 카테고리와 리소스 제약을 함께 반영하는 지점 | confirmed |
| `monthly-kpi-anomaly-check` | data_analysis / standard | 3 | verification | Turn 2에서 신규 리드 증가율과 MRR 성장률을 재계산하고 집계 기준 변경을 표시하는 지점 | confirmed |
| `survey-segmentation-plan` | data_analysis / advanced | 4 | problem_definition | Turn 3에서 통계 결론이 아니라 검증 가능한 세그먼트 가설로 표현을 낮추는 지점 | confirmed |
| `inventory-forecast-cleaning` | data_analysis / advanced | 4 | verification | Turn 2에서 품절·프로모션 태그를 판매량과 연결해 관측 왜곡을 표시하는 지점 | confirmed |
| `personal-budget-category-cleanup` | data_analysis / intro | 1 | workflow_design | Turn 1에서 목표를 재무 조언이 아니라 반복 가능한 분류 규칙으로 제한하는 지점 | confirmed |
| `api-timeout-debugging` | coding / standard | 3 | decomposition | Turn 2에서 로그의 3000ms timeout과 queue length 증가를 가설로 연결하되 단정하지 않는 지점 | confirmed |
| `sql-query-validation-basics` | coding / intro | 3 | problem_definition | Turn 1에서 '첫 구매한 사용자 수'의 기간 기준을 명확히 묻고 집계 단위를 user로 고정하는 지점 | confirmed |
| `spreadsheet-script-refactor` | coding / advanced | 4 | workflow_design | Turn 3에서 코드 결함과 업무 프로세스 결함을 분리해 테스트 모드와 상태 전이를 설계하는 지점 | confirmed |
| `accessibility-regression-test-plan` | coding / standard | 3 | verification | Turn 2에서 증상, HTML 결여 요소, 릴리즈 변경점을 연결해 테스트 항목으로 바꾸는 지점 | confirmed |
| `data-pipeline-incident-replay` | coding / standard | 4 | verification | Turn 2에서 로그의 late_events_excluded와 샘플의 ingested_at/session_id 결측을 별도 원인으로 나누는 지점 | confirmed |
| `community-event-under-budget` | strategy / standard | 3 | cost_control | Turn 3에서 장소 비용과 운영 리스크를 함께 비교해 대체 시나리오를 만드는 지점 | confirmed |
| `product-prioritization-conflict` | strategy / advanced | 4 | stakeholder_alignment | Turn 3에서 18인주 제약 안에서 Now 조합을 만들고 제외 기능의 설명을 설계하는 지점 | confirmed |
| `job-hunt-weekly-system` | strategy / intro | 0 | problem_definition | Turn 1에서 직무 선택을 확정하지 않고 탐색-실험 루틴으로 설계하는 지점 | confirmed |
| `emergency-communication-tree` | strategy / standard | 3 | workflow_design | Turn 2에서 역할표를 연락처가 아닌 책임 흐름으로 변환하는 지점 | confirmed |
| `micro-course-launch-go-no-go` | strategy / intro | 1 | problem_definition | Turn 1에서 '출시하고 싶다'를 Go/No-Go 기준과 검증 질문으로 바꾸는 지점 | confirmed |

## 운영 메모

- Generated Problem Gate는 삭제하지 않는다. 다만 current batch 001은 이미 확정 corpus이므로 홈 노출에는 local publish state를 사용하지 않는다.
- 향후 batch 002부터는 raw import 직후 `npm run problem:check`와 이 audit 양식 업데이트가 merge 전 조건이다.
- 실제 live model 품질 검증은 별도 judge/coaching calibration 작업에서 수행한다. 이 문서는 문제 구조와 playbook 정합성을 확정한다.
