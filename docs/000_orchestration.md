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
- Mock provider는 API key 없이 동작한다.
- OpenAI-compatible provider adapter가 있다.
- 내부적으로 OpenAI, Groq, xAI, Gemini, OpenRouter provider adapter를 지원한다.
- 사용자 기본 UI는 raw model selector가 아니라 풀이 시작 전 SKAI Practice, ChatGPT-like, Gemini-like 환경 preset을 고르게 한다.
- 데모에서는 하나의 attempt가 하나의 AI 환경/모델에 고정된다.
- Supabase Auth, Google OAuth callback, Supabase persistence baseline이 있다.
- local fallback 저장이 유지된다.
- 문제 자료와 사용자 업로드 파일을 solving loop에 포함했다.
- 영수증 이미지, 이체 내역, CSV 같은 demo material이 있다.
- 특정 trace 지점에서 branch restart가 가능하다.
- theme selector와 3개 디자인 옵션이 있다.
- Pretendard Variable + JetBrains Mono font system이 적용됐다.
- provider별 chat surface mood가 적용됐다.
- 홈과 풀이 시작 화면은 내부 설명을 줄이고 현재 행동 중심의 미니멀 UI로 정리됐다.
- Judge pipeline은 heuristic baseline, opt-in LLM judge, opt-in ensemble mode를 지원한다.
- Score report에는 judge run summary와 judge disagreement metadata를 저장할 수 있다.
- 공유 화면은 overview, workflow map, prompt skeleton, bottleneck/replay, coach report, raw transcript 순서로 풀이를 보여준다.
- 공유 화면의 prompt skeleton 카드에는 trace event별 댓글과 답글을 남길 수 있다.

현재 데모가 증명하는 것:

- SKAI 안에서 문제를 풀며 AI와 대화하는 경험.
- 전체 대화 trace를 평가 대상으로 삼는 구조.
- 자료를 보고 선택하고 모델 입력에 포함하는 흐름.
- process score와 final output score를 분리할 수 있는 기본 구조.
- 공유 화면에서 workflow를 원문보다 먼저 보여주는 방향.

## Current Gaps

아직 약한 부분:

- Live provider API key 검증과 실제 환경별 품질/비용/latency 비교가 필요하다.
- raw provider/model selector는 expert/admin tooling으로 분리해야 한다.
- 미래에는 여러 AI를 동시에 굴리는 multi-AI/harness solving mode가 필요하다.
- Judge는 기본값이 아직 heuristic이다. 실제 API key로 LLM judge 품질을 smoke/calibration해야 한다.
- Queue worker는 아직 없다. 현재 judge는 synchronous pipeline이다.
- Supabase RLS와 sync path는 baseline이며 실제 배포 smoke 전 점검이 필요하다.
- Admin problem authoring은 최소 형태다. 문제/자료/rubric 작성 workflow가 부족하다.
- 공개 풀이 댓글의 moderation, edit/delete, notification은 아직 없다.
- per-problem leaderboard는 local/basic 수준이다.
- 비용 추적은 provider usage가 주는 token 중심이며 provider별 단가 계산이 부족하다.
- uploaded xlsx/pdf/OCR 파싱은 MVP 밖으로 남아 있다.
- certification/anti-cheat/prompt similarity는 아직 구현 전이다.

## Execution Rules

새 작업을 시작할 때:

1. 이 문서에서 현재 상태와 next queue를 확인한다.
2. 구현 작업이면 `docs/technical/plan/`에 새 plan을 먼저 만든다.
3. 기존 plan의 후속 작업이면 해당 plan을 업데이트한다.
4. 구현 후 이 문서의 Current State, Current Gaps, Next Queue를 갱신한다.
5. 기술 선택이 고정되면 `docs/technical/000_decision_register.md`에 남긴다.

이 문서는 실행 큐를 잡는 부모 문서이고, 개별 plan 파일은 특정 작업의 상세 실행 계약이다.

## Next Queue

우선순위 1: live environment smoke

- `.env.local`에 사용 가능한 API key를 넣고 실제 provider 1개를 호출한다.
- 첫 후보는 ChatGPT-like 또는 Gemini-like 환경이다.
- 같은 문제, 같은 첫 프롬프트로 SKAI Practice와 live environment 응답을 비교한다.
- 환경별 latency, token usage, failure mode를 기록한다.
- 완료 조건: 적어도 하나의 live environment로 문제 풀이 1회가 end-to-end 성공한다.

우선순위 2: LLM judge smoke and calibration

- `SKAI_JUDGE_MODE=llm` 또는 `ensemble`으로 실제 judge provider를 켠다.
- 같은 attempt에 대해 heuristic report와 LLM judge report를 비교한다.
- malformed JSON, provider failure, judge disagreement를 기록한다.
- coach review와 strict rubric mode를 분리할 준비를 한다.
- 완료 조건: 최소 3개 sample attempt에서 LLM judge 결과를 founder가 정성 검토한다.

우선순위 3: admin authoring MVP

- 문제 statement, constraints, deliverables, materials, rubric을 작성/수정하는 UI를 만든다.
- 자료 업로드와 extracted text 입력을 지원한다.
- rubric public preview를 제공한다.
- 완료 조건: 코드 수정 없이 새 demo problem을 만들 수 있다.

우선순위 4: Supabase deployment hardening

- RLS 정책을 실제 사용자 flow 기준으로 점검한다.
- anonymous/local fallback과 authenticated sync의 경계를 정리한다.
- Vercel env var 체크리스트를 만든다.
- 완료 조건: 배포 환경에서 로그인, 풀이 저장, 공유 조회가 재현된다.

우선순위 5: cost and budget guardrails

- provider/model별 단가 설정 파일을 만든다.
- attempt별 예상 비용을 계산하고 UI에 노출한다.
- 월 20만원, 1회 10만원 founder budget 기준을 운영 지표로 연결한다.
- 완료 조건: live environment attempt마다 비용 추정치가 저장된다.

## Decision Gates

다음 결정은 구현 전에 명확히 해야 한다:

- 첫 live user environment를 ChatGPT-like와 Gemini-like 중 무엇으로 고정할지.
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
- `docs/technical/plan/006_interaction_environment_presets.md`: 사용자 기본 AI 선택을 raw provider/model에서 환경 preset으로 전환.
- `docs/technical/plan/007_pre_attempt_model_selection.md`: 풀이 시작 전 모델 환경 선택과 attempt 단위 모델 고정.
- `docs/technical/plan/008_minimal_interface_pass.md`: 홈/풀이 시작/풀이 화면을 명료한 미니멀 UI로 정리.
- `docs/technical/plan/009_judge_system_foundation.md`: heuristic/LLM/ensemble judge pipeline과 judge metadata 준비.
- `docs/technical/plan/010_shared_attempt_information_architecture.md`: 공유 풀이 화면의 workflow, prompt skeleton, bottleneck, raw transcript 정보 구조 강화.
- `docs/technical/plan/011_shared_attempt_discussion.md`: prompt skeleton 카드별 댓글과 답글 thread 구현.

다음 plan 후보:

- `012_live_environment_smoke.md`
- `013_llm_judge_calibration.md`
- `014_admin_authoring_mvp.md`
- `015_supabase_deployment_hardening.md`
- `016_cost_guardrails.md`
- `017_comment_moderation_and_privacy.md`

## Reading Map

철학:

- `docs/philosophy/000_project_seed.md`
- `docs/philosophy/002_initial_demo_answers.md`
- `docs/philosophy/005_materials_and_real_world_context.md`

기술:

- `docs/technical/000_decision_register.md`
- `docs/technical/005_mvp_implementation_baseline.md`
- `docs/technical/006_materials_and_attachments.md`

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
