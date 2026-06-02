# SKAI Orchestration

Date: 2026-06-01

이 문서는 SKAI 작업의 상위 운영판이다. 철학, 기술, 디자인 문서를 모두 읽기 전에 현재 좌표와 다음 실행 후보를 빠르게 파악하기 위한 파일이다.

## North Star

SKAI는 사용자가 불명확한 현실 문제를 정의하고, 세분화하고, AI에게 task를 배분하고, 중간 산출물과 새 정보를 반영하고, 최종 결과를 검증하는 능력을 훈련/평가/공유하는 플랫폼이다.

데모의 핵심 성공 신호:

- 사용자가 "AI가 이상한 것이 아니라 내가 AI를 쓰는 방식이 문제였구나"를 체감한다.
- 프롬프트 원문보다 문제 구조화, task 분배, 자료 활용, 검증 흐름이 먼저 보인다.
- founder가 10명 이하 smoke test 로그를 보고 방향성이 맞는지 정성 검증할 수 있다.

## Current State

완료된 큰 덩어리:

- Next.js 기반 SKAI 데모 앱이 동작한다.
- 문제 목록, 문제 풀이 화면, in-app AI 대화, trace capture, 제출, judge report, 공유 화면이 있다.
- Admin page에서 local authored problem draft를 만들고, 홈에서 확인하고, `/problems/local/...`에서 기존 solver로 풀 수 있다.
- Admin page에는 local smoke attempts를 문제/모델/모드/점수/비용/branch 상태로 훑고 founder note를 저장하는 review dashboard가 있다.
- Mock provider는 API key 없이 동작한다.
- OpenAI-compatible provider adapter가 있다.
- 내부적으로 OpenAI, Groq, xAI, Gemini, OpenRouter provider adapter를 지원한다.
- `npm run smoke:live`로 local `/api/chat` live provider smoke를 반복 실행할 수 있다.
- 2026-06-02 smoke에서 `gemini-2.5-flash-lite`가 `ambiguous-research-brief` Turn 1을 live route로 성공 처리했다.
- `npm run calibrate:judge`로 3개 seed problem의 weak/average/strong golden attempts 9개를 `/api/judge`에 반복 채점할 수 있다.
- 2026-06-02 heuristic judge calibration에서 세 문제 모두 weak < average < strong ordering을 통과했다.
- demo model pricing registry가 있고, token usage가 있는 live `ModelRun`은 가능한 경우 `estimatedCostUsd`를 저장한다.
- 풀이 화면은 attempt-level token, estimated USD cost, rough KRW estimate, founder budget guardrail을 보여준다.
- 사용자 기본 UI는 풀이 시작 전 `풀이 모드`와 `모델`을 독립적으로 고르게 한다.
- 데모에서는 하나의 attempt가 하나의 풀이 모드와 하나의 모델에 고정된다.
- 각 문제는 `docs/problem_playbooks/`에 paste-ready prompt playbook을 가진다.
- 풀이 화면 composer에는 문제별 playbook turn을 visible draft로 삽입하는 operator UX가 있다.
- playbook turn은 자동 전송되지 않으며, 필요한 문제 자료도 visible attachment chip으로만 붙는다.
- Supabase Auth, Google OAuth sign-in/callback/sign-out flow, Supabase persistence baseline이 있다.
- Google OAuth callback은 현재 page 복귀용 `next` 값을 local path로 sanitize한다.
- `/api/deployment/health`는 Supabase/provider/judge/problem-sync 설정 상태를 secret 없이 점검한다.
- production attempt sync는 client-submitted problem definition을 기존 문제 row에 덮어쓰지 않는다.
- Supabase migration `008`은 seed demo problems를 넣고 broad authenticated problem insert/update RLS policies를 제거한다.
- local fallback 저장이 유지된다.
- 문제 자료와 사용자 업로드 파일을 solving loop에 포함했다.
- 문제 자료 카드를 composer로 드래그하면 다음 프롬프트 첨부로 들어간다.
- 첨부 drag-and-drop은 composer dropzone에서만 처리되고 prompt textarea drop은 차단된다.
- API route에는 message/trace/attachment/comment 크기 제한과 provider 허용 검사가 들어갔다.
- 영수증 이미지, 이체 내역, CSV 같은 demo material이 있다.
- 특정 trace 지점에서 branch restart가 가능하다.
- branch restart는 parent attempt를 파괴하지 않고 새 breakpoint replay attempt를 만든다.
- theme selector와 3개 디자인 옵션이 있다.
- Pretendard Variable + JetBrains Mono font system이 적용됐다.
- provider별 chat surface mood가 적용됐다.
- 홈과 풀이 시작 화면은 내부 설명을 줄이고 현재 행동 중심의 미니멀 UI로 정리됐다.
- Judge pipeline은 heuristic baseline, opt-in LLM judge, opt-in ensemble mode를 지원한다.
- Score report에는 judge run summary와 judge disagreement metadata를 저장할 수 있다.
- 공유 화면은 overview, workflow map, prompt skeleton, bottleneck/replay, coach report, raw transcript 순서로 풀이를 보여준다.
- 공유 화면은 graph skeleton을 첫 구조 학습 표면으로 보여주고, prompt detail/raw transcript는 근거 확인용으로 둔다.
- 공유 화면의 prompt skeleton 카드에는 trace event별 댓글과 답글을 남길 수 있다.
- 공유 화면은 flat trace에서 파생한 prompt-response dual graph와 task-status layer를 표시한다.
- conversation graph builder는 single trace pass와 sparse indexes로 생성된다.
- 풀이 화면에는 `Chat / Graph` 탭이 있고, Graph 탭에서 3D dual graph, projection graph, sparse index를 볼 수 있다.
- Graph 탭의 trace node에서 바로 breakpoint replay branch를 만들 수 있다.
- 풀이 화면 sidebar에는 local attempts의 parent/child breakpoint lineage를 보는 Branch Tree explorer가 있다.
- 3D dual graph는 judge annotation, branch graph diff, sharing skeleton, habit report, model analysis, research snapshot의 시스템 백본으로 확장하는 방향이 확정됐다.
- Conversation graph는 deterministic graph annotations와 sparse annotation indexes를 포함한다.
- Graph tab detail panel은 선택한 graph node/pair의 annotation과 evidence trace를 보여준다.
- Score report는 judge 결과에서 파생된 graph annotations를 포함한다.
- LLM judge는 trace event id를 기준으로 graph annotation 후보를 낼 수 있고, 서버가 이를 graph pair/node target으로 검증 매핑한다.
- `buildConversationGraph`는 score report annotations와 deterministic annotations를 중복 제거해 sparse index에 올린다.
- `/api/chat`은 provider thread memory가 아니라 immutable trace에서 매번 materialized context를 컴파일해 호출한다.
- parent/child branch diff와 counterfactual judge baseline이 있다.
- Branch diff는 parent/child graph-state transition을 포함한다.
- Counterfactual judge는 prompt text delta뿐 아니라 graph-state status/annotation delta를 증거로 사용한다.
- Graph skeleton generator는 graph pair/status/annotation에서 공유용 구조 요약을 파생한다.
- Mac local runtime은 개발용 `dev:lan`과 안정 데모용 `build + serve:lan`으로 분리한다.

현재 데모가 증명하는 것:

- SKAI 안에서 문제를 풀며 AI와 대화하는 경험.
- 전체 대화 trace를 평가 대상으로 삼는 구조.
- flat trace를 prompt graph, response graph, status layer로 파생하는 구조.
- graph lookup을 위해 trace-event/node/pair dictionary와 sparse incidence index를 쓰는 구조.
- breakpoint replay branch를 기존 3D dual graph의 prompt-response pair anchor로 표시하는 구조.
- provider API context는 현재 attempt/branch path에서 재컴파일하는 구조.
- branch attempt가 parent attempt와 비교되어 prompt/response/process/score delta를 산출하는 구조.
- branch attempt가 parent attempt와 비교되어 graph-state transition과 annotation delta를 산출하는 구조.
- 자료를 보고 선택하고 모델 입력에 포함하는 흐름.
- process score와 final output score를 분리할 수 있는 기본 구조.
- 공유 화면에서 workflow를 원문보다 먼저 보여주는 방향.
- 공유 화면에서 graph skeleton만 읽어도 풀이의 오케스트레이션 흐름을 파악할 수 있는 방향.

## Current Gaps

아직 약한 부분:

- 추가 provider별 품질/비용/latency 비교가 필요하다. Gemini live connectivity baseline은 통과했다.
- raw provider/model selector는 expert/admin tooling으로 분리해야 한다.
- 미래에는 여러 AI를 동시에 굴리는 multi-AI/harness solving mode가 필요하다.
- Judge는 기본값이 아직 heuristic이다. Golden calibration runner는 있으나, `SKAI_JUDGE_MODE=llm` 재시작 후 LLM judge 품질을 별도로 검토해야 한다.
- Queue worker는 아직 없다. 현재 judge는 synchronous pipeline이다.
- Supabase RLS, sync path, deployed Google OAuth settings는 checklist와 health route가 생겼지만 실제 원격 프로젝트 적용/배포 smoke는 아직 필요하다.
- Admin problem authoring은 local draft MVP다. Supabase-backed create/edit/publish, multi-material upload, rubric editor는 아직 없다.
- 공개 풀이 댓글의 moderation, edit/delete, notification은 아직 없다.
- Founder review dashboard는 localStorage 기준이다. Supabase-backed cohort review, export, filtering은 아직 없다.
- Branch Tree explorer는 localStorage attempts 기준이다. Supabase-backed cross-user/multi-session branch tree는 아직 없다.
- Graph tab은 단일 attempt 내부 구조 시각화이고, Branch Tree는 여러 attempt 사이 lineage navigation이다.
- LLM judge-native graph annotation calibration, skeleton comparison, habit motif report, graph snapshot persistence는 아직 구현 전이다.
- counterfactual judge는 heuristic baseline이며 LLM mode는 API key 기반 opt-in이다.
- SaaS 운영 관점의 rate limiting, abuse detection, virus scanning, object storage는 아직 없다.
- per-problem leaderboard는 local/basic 수준이다.
- 비용 추적은 provider usage token과 demo pricing registry 기반의 추정치다. 실제 billing API, free tier, cache, image/tool 세부 과금은 아직 반영하지 않는다.
- uploaded xlsx/pdf/OCR 파싱은 MVP 밖으로 남아 있다.
- certification/anti-cheat/prompt similarity는 아직 구현 전이다.
- Playbook prompt는 UI에서 삽입 가능하지만, Markdown playbook과 typed app playbook이 아직 이중 관리된다.
- 장시간 로컬 운영은 아직 terminal-run 방식이며, launchd/터널/Vercel 선택은 smoke 이후 결정해야 한다.

## Demo Contract

다음 smoke test에서 반드시 통과해야 하는 한 줄 흐름:

```text
문제 선택 -> 풀이 모드/모델 선택 -> 자료 확인/첨부 -> live chat 풀이 -> Graph 확인 -> 제출/채점 -> bottleneck branch -> parent/child 비교 -> 공유/리뷰
```

첫 데모가 약속하는 것:

- 사용자는 숨은 SKAI 배경 prompt 없이 cold-start 모델과 대화한다.
- 사용자가 선택한 자료와 업로드한 파일만 모델 context에 들어간다.
- 전체 trace는 prompt-response-status graph로 파생된다.
- judge는 최종 산출물뿐 아니라 문제정의, 세분화, 자료 활용, 검증, 방향 수정 과정을 평가한다.
- branch replay는 "여기서 다르게 물었으면 어땠을까"를 학습 가능한 비교 대상으로 만든다.
- founder는 10명 이하 사용자의 log를 직접 읽고 정성 검증할 수 있어야 한다.

첫 데모 밖으로 미루는 것:

- multi-AI/harness solving mode 구현.
- certification/HR-grade anti-cheat.
- production-grade moderation/notification.
- dense graph analytics and export.
- xlsx/pdf/OCR 자동 파싱의 완성형.

## Execution Rules

새 작업을 시작할 때:

1. 이 문서에서 현재 상태와 next queue를 확인한다.
2. 구현 작업이면 `docs/technical/plan/`에 새 plan을 먼저 만든다.
3. 기존 plan의 후속 작업이면 해당 plan을 업데이트한다.
4. 구현 후 이 문서의 Current State, Current Gaps, Next Queue를 갱신한다.
5. 기술 선택이 고정되면 `docs/technical/000_decision_register.md`에 남긴다.

이 문서는 실행 큐를 잡는 부모 문서이고, 개별 plan 파일은 특정 작업의 상세 실행 계약이다.

## Next Queue

현재 상위 로드맵:

- `docs/technical/plan/024_post_graph_demo_execution_plan.md`
- `docs/technical/plan/027_graph_backbone_full_implementation.md`

우선순위 0: freeze demo contract and smoke path

- 이 문서의 Demo Contract를 기준으로 다음 구현 요청을 판단한다.
- smoke path는 `문제 -> 모델/모드 -> 자료 -> chat -> graph -> judge -> branch -> compare -> share`로 고정한다.
- 완료 조건: 다음 구현 계획이 이 smoke path 중 어느 단계에 기여하는지 명확히 말할 수 있다.

우선순위 1: live environment smoke

- `.env.local`에 사용 가능한 API key를 넣고 실제 provider 1개를 호출한다. (완료: Gemini)
- 첫 후보는 Gemini, Groq, xAI 순으로 비용/latency/attachment handling을 본다. (Gemini baseline 완료, 나머지는 후속 비교)
- `docs/problem_playbooks/`의 paste-ready prompts로 sample attempt를 만든다. (Turn 1 smoke 완료)
- 같은 문제, 같은 첫 프롬프트로 mock/live 응답 차이를 기록한다.
- 모델별 latency, token usage, failure mode를 기록한다. (Gemini 기록 완료)
- 완료 조건: 적어도 하나의 live provider로 문제 풀이 1회가 end-to-end 성공한다. (완료)

우선순위 1.5: graph backbone second slice

- LLM/heuristic judge output을 graph annotation schema에 직접 맞춘다. (완료, calibration은 후속)
- branch diff를 parent/child graph-state transition으로 보여준다. (완료)
- graph skeleton generator를 만들어 공유 화면에서 raw transcript보다 먼저 노출한다. (완료)
- 완료 조건: judge/replay/sharing 중 하나 이상이 graph annotation을 1차 입력으로 사용한다. (완료)

우선순위 2: golden attempts and LLM judge calibration

- 각 seed problem마다 weak/average/strong attempt를 만든다. (완료)
- `SKAI_JUDGE_MODE=llm` 또는 `ensemble`으로 실제 judge provider를 켠다.
- heuristic report와 LLM judge report를 비교한다. (heuristic baseline 완료, LLM 비교 후속)
- malformed JSON, provider failure, judge disagreement를 기록한다.
- coach review와 strict rubric mode를 분리할 준비를 한다.
- 완료 조건: 최소 9개 sample attempt에서 judge 결과를 founder가 정성 검토한다. (runner 완료, founder/LLM review 후속)

우선순위 3: playbook insertion and smoke operator UX

- 문제별 playbook prompt를 UI에서 composer로 삽입할 수 있게 한다. (완료)
- 필요한 자료 첨부를 step별로 명시한다. (완료)
- 삽입된 prompt는 숨은 context가 아니라 사용자가 볼 수 있는 composer text여야 한다. (완료)
- 완료 조건: 손타이핑 없이 반복 가능한 sample attempt를 생성한다. (완료)
- 후속: Markdown playbook과 typed app playbook의 source of truth를 통합한다.

우선순위 4: cost and budget guardrails

- provider/model별 단가 설정 파일을 만든다. (완료)
- attempt별 예상 비용을 계산하고 admin/expert UI에 노출한다. (부분 완료: solver UI)
- 월 20만원, 1회 10만원 founder budget 기준을 운영 지표로 연결한다. (완료: display guardrail)
- 완료 조건: live environment attempt마다 비용 추정치 또는 `unknown`이 저장된다. (부분 완료: known pricing이면 저장, unknown은 UI에서 unknown event로 노출)
- 후속: 실제 spend ledger, rate limiting, deployed billing dashboard를 만든다.

우선순위 5: Supabase deployment hardening

- RLS 정책을 실제 사용자 flow 기준으로 점검한다. (완료: checklist/migration draft)
- anonymous/local fallback과 authenticated sync의 경계를 정리한다. (완료: production problem sync hardening)
- Vercel env var 체크리스트를 만든다. (완료: deployment checklist)
- 완료 조건: 배포 환경에서 로그인, 풀이 저장, 공유 조회가 재현된다. (후속: 실제 배포 smoke 필요)

우선순위 6: admin authoring MVP

- 문제 statement, constraints, deliverables, materials, rubric을 작성/수정하는 UI를 만든다. (부분 완료: local draft form, default rubric)
- 자료 업로드와 extracted text 입력을 지원한다. (부분 완료: one extracted material text field)
- rubric public preview를 제공한다. (후속)
- 완료 조건: 코드 수정 없이 새 demo problem을 만들 수 있다. (완료: localStorage draft route)
- 후속: Supabase-backed authoring, import/export, rubric editor, playbook editor.

우선순위 7: branch tree explorer

- parent attempt 아래의 여러 child branch를 한 화면에서 비교한다. (부분 완료: local lineage navigation)
- 어떤 breakpoint에서 어떤 branch가 갈라졌는지 tree/lineage로 보여준다. (완료)
- 완료 조건: 한 parent에서 생성된 branch 2개 이상을 lineage view로 탐색한다. (완료: local attempts 기준)
- 후속: Supabase-backed tree, multi-branch aggregate comparison, canvas tree.

우선순위 8: founder review dashboard

- 모든 smoke attempts를 문제, 모델, 모드, judge mode 기준으로 모아본다. (부분 완료: local attempts)
- founder note를 attempt 옆에 기록한다. (완료: local notes)
- 완료 조건: DB table을 직접 열지 않아도 smoke test 정성 분석이 가능하다. (부분 완료: local dashboard)
- 후속: Supabase-backed cohort dashboard, filters, export, automatic insight extraction.

## Decision Gates

다음 결정은 구현 전에 명확히 해야 한다:

- 첫 live user model을 Gemini, Groq, xAI, OpenAI 중 무엇으로 고정할지.
- expert/admin용 raw provider/model lab을 언제 분리할지.
- multi-AI solving mode를 언제부터 설계/노출할지.
- judge model을 conversation model과 같은 provider로 둘지, 별도 저가/강한 모델로 둘지.
- judge calibration용 golden trace를 몇 개 만들지.
- public sharing의 기본 공개 범위: workflow only, summarized prompts, full raw transcript 중 어디까지인지.
- 자료 업로드의 MVP 한계: text/image만 우선할지, xlsx/pdf parsing까지 넣을지.
- smoke test에서 사용자가 풀 첫 문제 1개를 무엇으로 할지.

## Plan Index

- `docs/technical/plan/001_nextjs_supabase_demo_mvp.md`: Next.js/Supabase 데모 MVP 최초 구현.
- `docs/technical/plan/002_materials_auth_persistence.md`: 자료, 인증, 저장 흐름 보강.
- `docs/technical/plan/003_supabase_auth_live_provider_baseline.md`: Supabase auth와 live provider baseline.
- `docs/technical/plan/004_theme_selector_design_pass.md`: theme selector와 디자인 옵션.
- `docs/technical/plan/005_fonts_provider_ui_adaptation.md`: font system과 provider별 UI surface.
- `docs/technical/plan/006_interaction_environment_presets.md`: 초기 환경 preset 실험. `019`에서 superseded.
- `docs/technical/plan/007_pre_attempt_model_selection.md`: 풀이 시작 전 attempt 단위 모델 고정. `019`에서 모드/모델 분리로 보정.
- `docs/technical/plan/019_decouple_solving_mode_from_model_choice.md`: 풀이 모드와 모델 선택 분리.
- `docs/technical/plan/008_minimal_interface_pass.md`: 홈/풀이 시작/풀이 화면을 명료한 미니멀 UI로 정리.
- `docs/technical/plan/009_judge_system_foundation.md`: heuristic/LLM/ensemble judge pipeline과 judge metadata 준비.
- `docs/technical/plan/010_shared_attempt_information_architecture.md`: 공유 풀이 화면의 workflow, prompt skeleton, bottleneck, raw transcript 정보 구조 강화.
- `docs/technical/plan/011_shared_attempt_discussion.md`: prompt skeleton 카드별 댓글과 답글 thread 구현.
- `docs/technical/plan/012_material_drag_drop_and_saas_hardening.md`: 자료 drag-and-drop 첨부와 API/업로드/comment guardrail 보강.
- `docs/technical/plan/013_prompt_response_dual_graph.md`: textarea drop 차단과 prompt-response dual graph 파생 모델 구현.
- `docs/technical/plan/014_breakpoint_branch_replay.md`: GDB-like breakpoint replay branch와 graph anchor 구현.
- `docs/technical/plan/015_context_compiler_and_counterfactuals.md`: immutable trace 기반 context compiler와 branch diff/counterfactual judge 방향.
- `docs/technical/plan/016_branch_diff_counterfactual_judge.md`: parent/child branch diff와 counterfactual judge 구현.
- `docs/technical/plan/020_problem_prompt_playbooks.md`: 문제별 paste-ready prompt playbook.
- `docs/technical/plan/021_conversation_graph_visual_tabs.md`: 풀이 화면 3D dual graph tab.
- `docs/technical/plan/022_compact_graph_nodes.md`: graph node를 compact token 중심으로 정리.
- `docs/technical/plan/023_directed_graph_affordance.md`: directed graph flow와 source/target affordance 강화.
- `docs/technical/plan/024_post_graph_demo_execution_plan.md`: 설계/계획/철학/진척도 분석 기반 post-graph 실행 로드맵.
- `docs/technical/plan/025_google_login_integration.md`: Google OAuth sign-in/callback/sign-out hardening.
- `docs/technical/plan/026_local_mac_runtime_strategy.md`: MacBook/Mac mini local runtime strategy.
- `docs/technical/plan/027_graph_backbone_full_implementation.md`: 3D dual graph를 judge/replay/sharing/habit/model/research 백본으로 확장하는 전체 구현 계획.
- `docs/technical/plan/028_graph_annotations_first_slice.md`: deterministic graph annotations와 Graph tab detail panel 표시.
- `docs/technical/plan/029_judge_branch_graph_state_transition.md`: judge graph annotations와 branch graph-state transition 연결.
- `docs/technical/plan/030_live_environment_smoke.md`: local `/api/chat` live provider smoke runner와 Gemini baseline 기록.
- `docs/technical/plan/031_llm_judge_graph_annotation_schema.md`: LLM judge graph annotation schema와 trace id 기반 graph target mapping.
- `docs/technical/plan/032_graph_skeleton_sharing.md`: graph skeleton generator와 공유 화면 skeleton-first 읽기 경로.
- `docs/technical/plan/033_golden_attempts_judge_calibration.md`: 9개 golden attempt judge calibration runner와 heuristic baseline 기록.
- `docs/technical/plan/034_playbook_insertion_operator_ux.md`: 문제별 playbook prompt를 composer/final answer에 visible draft로 삽입하는 operator UX.
- `docs/technical/plan/035_cost_guardrails.md`: provider/model pricing registry와 attempt-level 비용 표시.
- `docs/technical/plan/036_supabase_deployment_hardening.md`: deployment health route, production sync boundary, Supabase RLS checklist.
- `docs/technical/plan/037_admin_authoring_mvp.md`: localStorage 기반 문제 출제 초안 작성, 홈 노출, local problem solve route.
- `docs/technical/plan/038_branch_tree_explorer.md`: local attempts parent/child breakpoint lineage explorer.
- `docs/technical/plan/039_founder_review_dashboard.md`: local smoke attempt founder review dashboard와 local qualitative notes.

다음 plan 후보:

- `040_comment_moderation_and_privacy.md`

## Reading Map

철학:

- `docs/philosophy/000_project_seed.md`
- `docs/philosophy/002_initial_demo_answers.md`
- `docs/philosophy/005_materials_and_real_world_context.md`
- `docs/philosophy/006_3d_dual_graph_system_backbone.md`

기술:

- `docs/technical/000_decision_register.md`
- `docs/technical/005_mvp_implementation_baseline.md`
- `docs/technical/006_materials_and_attachments.md`
- `docs/technical/007_dual_graph_trace_model.md`
- `docs/technical/008_breakpoint_branch_replay.md`
- `docs/technical/009_context_compiler.md`
- `docs/technical/010_branch_diff_and_counterfactual_judge.md`
- `docs/technical/011_local_mac_operations.md`
- `docs/technical/012_graph_backbone_strategy.md`

디자인:

- `docs/design/000_design_principles.md`
- `docs/design/001_theme_recommendation.md`
- `docs/design/002_font_and_provider_surfaces.md`

## Update Trigger

이 문서는 다음 경우 반드시 갱신한다:

- 새 plan이 추가될 때.
- 구현 완료로 current state가 바뀔 때.
- 어떤 gap이 해결되거나 새 gap이 발견될 때.
- smoke test 결과로 우선순위가 바뀔 때.
- 중요한 기술/제품 결정이 decision register에 추가될 때.
