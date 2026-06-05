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
- Gemini branding/philosophy transcript는 `docs/philosophy/Gemini/001.md`로 보존했고, 핵심 원칙은 `docs/philosophy/007_intelligence_and_brand_manifesto.md`에 반영했다.
- Gemini에게 현재 프로젝트 상태를 설명하기 위한 최신 briefing은 `docs/philosophy/Gemini/003.md`에 있다.
- Gemini의 smoke-test 리스크 답변은 `docs/philosophy/Gemini/004.md`로 보존했고, generated problem editorial gate에 반영했다.
- Gemini의 dynamic flame/logo 답변은 `docs/philosophy/Gemini/005.md`로 보존했고, literal flame 대신 activity-aware graph packet-flow로 반영했다.
- Gemini의 graph overlay / counterfactual parallel / multi-model graph 답변은 `docs/philosophy/Gemini/006.md`로 보존했고, graph를 평가 overlay와 병렬 비교 surface로 끌어올리는 후속 계획에 반영했다.
- Topbar primary mark는 flame icon이 아니라 3-node directed dual graph mark다.
- Reusable SKAI logo lockup은 3-node mark, SKAI wordmark, Social Knowledge of AI full name을 함께 보여준다.
- Engine Mode의 topbar mark는 풀이 상태에 따라 ready/primed/busy/structured packet-flow intensity가 바뀐다. 이는 flame shape가 아니라 graph 내부 에너지 표현이다.
- Browser/OAuth icon assets는 `public/favicon.svg`, `public/skai-mark.svg`, `public/skai-mark-512.png`, `public/skai-mark-192.png`, `public/apple-touch-icon.png`로 준비됐고, Next metadata에 연결됐다.
- External WAN smoke의 1순위 경로는 Vercel-hosted Next.js + Supabase Auth/Postgres이며, 초보자용 단계별 배포 가이드는 `docs/technical/014_vercel_first_deployment_guide.md`에 있다.
- 배포 후 개발 흐름은 local edit -> verification -> commit -> optional push -> Vercel automatic deployment이며, `AGENT.md`는 final report에 local/Git/Vercel reflection status를 명시하도록 갱신됐다.
- 문제 목록, 문제 풀이 화면, in-app AI 대화, trace capture, 제출, judge report, 공유 화면이 있다.
- ChatGPT Pro로 생성한 30문제 batch 001을 원본 archive와 앱용 normalized data로 분리해 반영했다.
- 생성 batch는 category/difficulty/goalProfile/classification/playbook/material extracted text를 보존하며, synthetic href는 앱에서 제거해 404 자료 링크를 만들지 않는다.
- 생성 문제는 기본적으로 홈에서 숨기고, Admin editorial checklist를 통과해 publish된 항목만 smoke 후보로 노출한다.
- 홈 문제 목록은 keyword search, scenario lane, collapsed advanced filter로 탐색할 수 있다.
- Admin page에는 generated problem별 anti-one-shot, material cross-reference, extracted text usability, domain accessibility checklist와 publish/hide toggle이 있다.
- Admin page에서 local authored problem draft를 만들고, 홈에서 확인하고, `/problems/local/...`에서 기존 solver로 풀 수 있다.
- Admin page에는 local smoke attempts를 문제/모델/모드/점수/비용/branch 상태로 훑고 founder note를 저장하는 review dashboard가 있다.
- Admin founder review dashboard는 Supabase remote cohort snapshot도 함께 표시한다. Service-role 전체 cohort 조회는 `SKAI_FOUNDER_EMAILS` allowlist가 있을 때만 사용하고, 아니면 현재 사용자 RLS 범위로 내려간다.
- Mock provider는 API key 없이 동작한다.
- OpenAI-compatible provider adapter가 있다.
- 내부적으로 OpenAI, Groq, xAI, Gemini, OpenRouter provider adapter를 지원한다.
- 모델 선택에는 visible default가 없다. 사용자는 풀이 시작 전 정확히 하나의 모델을 명시적으로 선택해야 하며, Gemini Flash-Lite와 OpenAI cheap baseline `gpt-4.1-nano`는 병렬적인 선택 가능한 provider option이다. OpenAI option/pricing/provider fallback은 nano 기준이다.
- `npm run smoke:live`로 local `/api/chat` live provider smoke를 반복 실행할 수 있다.
- 2026-06-02 smoke에서 `gemini-2.5-flash-lite`가 `ambiguous-research-brief` Turn 1을 live route로 성공 처리했다.
- `npm run calibrate:judge`로 3개 seed problem의 weak/average/strong golden attempts 9개를 `/api/judge`에 반복 채점할 수 있다.
- 2026-06-02 heuristic judge calibration에서 세 문제 모두 weak < average < strong ordering을 통과했다.
- demo model pricing registry가 있고, token usage가 있는 live `ModelRun`은 가능한 경우 `estimatedCostUsd`를 저장한다.
- 풀이 화면은 attempt-level token, estimated USD cost, rough KRW estimate, founder budget guardrail을 보여준다.
- 사용자 기본 UI는 풀이 시작 전 `풀이 모드`와 `모델`을 독립적으로 고르게 한다.
- 다음 UX 기준은 모델들을 병렬 실행 엔진처럼 보여주는 것이다. 어떤 모델도 default/recommended처럼 보이면 안 된다.
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
- Human Mode / Engine Mode typography principle이 문서화됐고, route-level `data-ui-mode` tokens로 구현됐다.
- Topbar mark는 client-side `html[data-ui-mode]` sync로 route mode를 안정적으로 따른다.
- Home/admin/share는 Human Mode, problem setup/solve/local solve는 Engine Mode로 표시된다.
- Engine Mode에서는 control/metadata/graph/prompt/material/judge evidence가 더 강한 JetBrains Mono와 hairline treatment를 사용하고, brand mark node는 hex treatment로 전환된다.
- provider별 chat surface mood가 적용됐다.
- 홈과 풀이 시작 화면은 내부 설명을 줄이고 현재 행동 중심의 미니멀 UI로 정리됐다.
- Judge pipeline은 heuristic baseline, opt-in LLM judge, opt-in ensemble mode를 지원한다.
- Score report에는 judge run summary와 judge disagreement metadata를 저장할 수 있다.
- 공유 화면은 overview, workflow map, prompt skeleton, bottleneck/replay, coach report, raw transcript 순서로 풀이를 보여준다.
- 공유 화면은 graph skeleton을 첫 구조 학습 표면으로 보여주고, prompt detail/raw transcript는 근거 확인용으로 둔다.
- 공유 화면에는 점수표가 아니라 사용자의 directed orchestration timeline을 보여주는 SKAI Artifact 카드와 SVG export가 있다.
- `.skai` file format v1은 `application/vnd.skai+json` 단일 JSON artifact로 구현됐다. 공개 share는 `.skai`를 다운로드할 수 있고, 새 publish snapshot은 child graph, optional parent graph, structural branch snapshot, section hash를 `PublishedAttempt.skaiFile`에 저장한다. Score report, skeleton, overlay, counterfactual judge는 core가 아니라 future analysis extension 후보로 분리한다.
- 통합 `.skai` viewer는 `components/skai-file-viewer.tsx` 하나로 구현됐다. 공개 share는 같은 viewer를 embed하고, `/skai/viewer`는 같은 viewer로 drag-and-drop import를 처리하며, `.skai` 저장/공유/PDF 출력도 이 viewer surface에서만 수행한다.
- judge/coaching 개발 체계는 `.skai fixture -> derived extension -> unified viewer overlay -> regression` 루프로 고정했다. `fixtures/skai/`의 golden artifacts, `npm run skai:validate`, `npm run judge:fixture`, `npm run judge:regression`이 core contract와 extension 구조를 빠르게 검증한다.
- `npm run skai:viewer-smoke`는 derived `.judged.skai`가 unified viewer/extension registry에서 읽을 수 있는 필드를 갖췄는지 확인하고, `npm run verify:skai`는 `.skai` validate, viewer smoke, judge regression, typecheck, lint를 한 번에 실행한다.
- `.skai` optional extension으로 `skai.judge.v1`, `skai.coach.v1` 타입과 viewer registry slot을 추가했다. 이 extension들은 core graph를 수정하지 않고 `pairId`/`traceEventId`/`attemptId` 같은 stable id를 참조한다.
- bilingual language system은 별도 track으로 잡았다. `docs/technical/plan/075_language_system_track.md`는 단순 `ko.ts/en.ts` 이중 관리가 아니라, source locale, status, checksum, protected terms를 가진 copy registry 방식으로 운영하는 계획을 정의한다.
- language system 076-086이 완료됐다. `docs/design/004_copy_inventory.md`는 copy posture를 분류하고, `lib/i18n/copy-registry.json`은 first-impression UI, solve flow, graph/viewer, public share chrome, score report chrome, admin/operator chrome, local draft chrome, My SKAI account surface 중심의 499개 entry를 가진다. `npm run i18n:inventory`, `npm run i18n:check`, `npm run i18n:update`, `npm run i18n:draft`, `npm run verify:i18n`이 있다.
- i18n registry는 한 locale이 먼저 수정되면 반대 locale을 `stale` 또는 `missing`으로 표시하는 운영을 전제로 한다. `LanguageToggle`과 localStorage 기반 explicit locale preference hook은 topbar에 붙었고, home hero/topbar/problem browser/auth notice/solve flow/3D Dual Graph/`.skai` viewer/public share chrome/score report chrome은 registry에서 렌더링된다. judge/coaching report는 locale metadata를 저장하고, heuristic/LLM judge는 요청 locale을 반영한다. 문제 본문은 UI copy와 분리된 `Problem.localized` layer로 들어갔고, 3개 seed problem은 영어 problem view와 영어 playbook variant를 가진다. 자료 원문은 source material로 보존하고 번역본은 future derived material로 분리한다. `verify:i18n`은 registry 무결성, source key usage, 공식 hero copy, raw JSX text baseline regression을 함께 검사한다.
- Admin page header, Admin authoring client, Generated Problem Gate, local draft surfaces, `.skai` viewer page title 경로는 registry/fallback copy로 이전했고, raw JSX/attribute source baseline은 149개에서 72개 entry로 줄었다.
- 공유 화면에는 초보자도 graph 용어 없이 읽을 수 있는 problem/material/process/checking universal layer가 있다.
- Publish/share flow는 local snapshot 저장, remote attempt sync, remote published snapshot sync 순서를 보장하며, share page는 Supabase/local fallback을 확인하는 동안 loading state를 보여준다.
- Score report는 Intelligence Mirror로 시작하며 intent, control, verification, artifact 형성 정도를 먼저 보여준다.
- 공유 화면의 prompt skeleton 카드에는 trace event별 댓글과 답글을 남길 수 있다.
- 공개 댓글은 email/phone/API-key-like text를 저장 전 redaction하고, script-like content와 excessive links를 차단하는 1차 privacy guardrail을 지난다.
- 공개 댓글은 local/Supabase edit, soft-delete, report action을 가진다. Supabase edit/delete는 작성자 RLS로 제한되고 report는 별도 report table과 count trigger를 사용한다.
- 공유 화면은 flat trace에서 파생한 prompt-response dual graph와 task-status layer를 표시한다.
- conversation graph builder는 single trace pass와 sparse indexes로 생성된다.
- 풀이 화면에는 `Chat / Graph` 탭이 있고, Graph 탭의 사용자-facing surface는 단일 3D Dual Graph다.
- 3D Dual view는 row-lane table이 아니라 Prompt spine과 Response spine 사이의 ladder geometry로 표현한다. Status graph 자체는 별도 projection으로 유지하되, 3D Dual에서는 오른쪽 connector endpoint가 아니라 각 prompt-response local cell의 중심 상태 marker로 표시한다.
- 3D Dual view에서 `R_i`는 `P_i`와 같은 높이의 chat bubble이 아니라 `P_i -> P_{i+1}` prompt transition edge의 dual node다. 따라서 `R_i`는 `P_i`와 `P_{i+1}`의 중점 높이에 놓인다. Dual relation은 사선 node-to-node shortcut이 아니라 horizontal ladder rung으로 표현한다: `P_i` node는 `R_{i-1}->R_i` response edge midpoint와 연결되고, `R_i` node는 `P_i->P_{i+1}` prompt edge midpoint로 왼쪽 방향 연결을 가진다. Status marker는 이 두 rung이 만드는 local rectangle의 중심에 놓이며, 직접 connector edge 없이 clockwise swirl로 P/R cell에서 업데이트된 상태임을 표시한다.
- 3D Dual view의 active state는 same-index local set을 따른다. `P_i`, `R_i`, `S_i` 중 하나를 선택하면 같은 번호의 세 노드와 해당 local ladder rung만 활성화한다. 첫 row는 이전 response edge가 없으므로 `R_1` 위에 짧은 visual origin stub을 두고 `P_1` rung이 그 stub 시작점에 닿게 한다.
- 3D Dual ladder는 backend 자료구조와 정합한다. `promptEdges`는 `P_i -> P_{i+1}`이며 `dualNodeId = R_i`를 갖고, `responseEdges`는 `R_{i-1} -> R_i`이며 `dualNodeId = P_i`를 갖는다. `pairs`는 `P_i/R_i/S_i`를 sequence와 id로 묶고, `statusEdges`는 별도 `S_i -> S_{i+1}` progression graph로 유지된다.
- Graph 탭의 사용자-facing surface는 3D Dual view 하나로 통합한다. Prompt/Response/Status projection과 sparse index는 backend/research/debug 구조로 유지하지만, smoke-test 사용자의 기본 UI에서는 별도 탭으로 노출하지 않는다.
- Prompt/Response/Status projection 구조는 backend/research/debug layer에 유지한다. 필요 시 중복 edge card 목록이 아니라 long-exact-sequence처럼 이어지는 directed sequence path로 표현하고, Status projection은 Prompt/Response 노드를 반복하지 않고 `S1 -> S2 -> S3` status progression만 보여준다.
- Graph 탭의 trace node에서 바로 breakpoint replay branch를 만들 수 있다.
- 풀이 화면 sidebar에는 local attempts의 parent/child breakpoint lineage를 보는 Branch Tree explorer가 있다.
- 3D dual graph는 judge annotation, branch graph diff, sharing skeleton, habit report, model analysis, research snapshot의 시스템 백본으로 확장하는 방향이 확정됐다.
- Conversation graph는 deterministic graph annotations와 sparse annotation indexes를 포함한다.
- Graph tab detail panel은 선택한 graph node/pair의 annotation과 evidence trace를 보여준다.
- Score report는 judge 결과에서 파생된 graph annotations를 포함한다.
- LLM judge는 trace event id를 기준으로 graph annotation 후보를 낼 수 있고, 서버가 이를 graph pair/node target으로 검증 매핑한다.
- 다음 graph UX 축은 평가 결과를 graph 위에 직접 씌우는 Evaluation Overlay다. 병목 노드, 약한 엣지, 회복 지점, 검증/자료 grounding을 색/두께/움직임으로 표시하고, detail panel은 그 근거를 펼치는 역할로 둔다. 단, overlay는 기본 graph 구조와 분리된 lens여야 하므로 사용자가 전체/개별 layer를 켜고 끌 수 있어야 한다.
- backend overlay 정보는 새 canonical 데이터가 아니라 `ConversationGraph.annotations`에서 파생한 sparse `GraphOverlayIndex`로 관리한다. target/pair/sequence/layer별 dictionary lookup을 사용해 빠르게 렌더링하되, 모든 overlay는 annotation id와 evidence trace로 역추적 가능해야 한다.
- `lib/graph-overlay.ts`는 `ConversationGraph.annotations`에서 `GraphOverlayIndex`를 파생하고, Graph 탭은 전체 overlay on/off와 layer별 toggle을 제공한다. Toggle은 graph/trace/judge output을 바꾸지 않고 visual lens만 필터링한다.
- `buildConversationGraph`는 score report annotations와 deterministic annotations를 중복 제거해 sparse index에 올린다.
- `/api/chat`은 provider thread memory가 아니라 immutable trace에서 매번 materialized context를 컴파일해 호출한다.
- parent/child branch diff와 counterfactual judge baseline이 있다.
- Branch diff는 parent/child graph-state transition을 포함한다.
- Counterfactual judge는 prompt text delta뿐 아니라 graph-state status/annotation delta를 증거로 사용한다.
- counterfactual/replay의 장기 UI는 parent graph와 child graph를 병렬로 놓고, breakpoint 및 annotation delta를 연결해 "문장이 아니라 orchestration state가 어떻게 바뀌었는지"를 보이게 하는 방향이다.
- solve 화면의 branch/counterfactual report는 parent attempt가 local에 있을 때 parent/child 3D Dual Graph를 병렬 렌더링하고, prompt diff보다 graph comparison을 먼저 보여준다.
- shared attempt의 counterfactual section은 parent full graph가 없을 수 있으므로 저장된 `GraphStateTransition`을 prompt diff보다 먼저 보여주는 fallback을 사용한다.
- Graph skeleton generator는 graph pair/status/annotation에서 공유용 구조 요약을 파생한다.
- multi-AI/harness solving mode는 아직 데모 밖이지만, 장기 구조는 모델별 graph lane을 병렬 배치하고 model boundary를 넘는 inter-model edge를 기록하는 방식으로 확장한다. 단, primary learner UX가 model leaderboard로 흐르지 않도록 human orchestration 중심을 유지한다.
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
- visible solving setup은 unselected model state로 시작하고, 사용자가 명시적으로 하나의 모델을 고르기 전에는 attempt를 시작할 수 없다.
- raw provider/model selector는 expert/admin tooling으로 분리해야 한다.
- assistant response마다 전체 답변을 복사하는 message-level copy button이 필요하다.
- 일부 AI 답변의 Markdown emphasis, 특히 `**bold**`, 가 raw syntax로 보이는 렌더링 경로가 남아 있다.
- 3D Dual Graph는 ladder geometry와 단일 surface로 정리됐으므로, 다음 평가는 실제 브라우저 smoke에서 node density, selected-set readability, branch anchor visibility를 관찰하는 쪽으로 넘긴다.
- Evaluation Overlay는 1차 구현됐지만, edge-native weak-edge annotation은 아직 제한적이다. 현재는 pair-level annotation fallback이 local node/rung/cell styling을 만든다.
- 공개 share의 parent/child full graph 병렬 비교는 `.skai` snapshot이 있는 새 publish에서 복원 가능하다. 오래된 snapshot이나 parent graph가 없는 branch는 여전히 `GraphStateTransition` fallback을 사용한다.
- 미래에는 여러 AI를 동시에 굴리는 multi-AI/harness solving mode가 필요하다.
- multi-AI/harness graph는 아직 데이터 모델과 UI 모두 설계 단계다. 기존 single-attempt/single-model trace를 깨지 않고 model lane과 inter-model edge를 추가하는 방식으로 계획해야 한다.
- Judge는 기본값이 아직 heuristic이다. Golden calibration runner는 있으나, `SKAI_JUDGE_MODE=llm` 재시작 후 LLM judge 품질을 별도로 검토해야 한다.
- Queue worker는 아직 없다. 현재 judge는 synchronous pipeline이다.
- Supabase RLS, sync path, deployed Google OAuth settings는 checklist와 health route가 생겼지만 실제 원격 프로젝트 적용/배포 smoke는 아직 필요하다.
- Admin problem authoring은 local draft MVP다. Supabase-backed create/edit/publish, multi-material upload, rubric editor는 아직 없다.
- Generated problem editorial gate는 localStorage 기준이다. Supabase-backed publish state, reviewer assignment, multi-user editorial workflow는 아직 없다.
- Problem browser는 local app data 기준이다. Supabase-backed problem discovery, user-level recommendation, saved curation은 아직 없다.
- 공개 풀이 댓글은 1차 privacy/misuse guardrail과 edit/soft-delete/report baseline이 있다. notification, founder moderation queue, ML moderation은 아직 없다.
- Founder review dashboard는 localStorage와 Supabase cohort snapshot을 함께 본다. Remote founder notes, export, advanced filtering은 아직 없다.
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
- i18n source regression gate는 생겼고 baseline도 크게 줄였지만, `scripts/i18n_source_baseline.json`에 남아 있는 raw JSX/attribute text는 계속 줄여야 한다.
- 3-node mark는 topbar에 1차 적용됐고, Human/Engine mode tokenization과 reusable logo lockup도 1차 구현됐다.
- Engine Mode mark에는 intent/material packet이 artifact node로 흐르는 sparse packet-flow animation이 있다.
- Problem solving 중 mark activity는 root `data-skai-activity`로 동기화되며, 모델 처리 중에는 packet density/speed가 올라가고 trace가 쌓이면 artifact node가 pulse한다.
- 장시간 로컬 운영은 아직 terminal-run 방식이며, launchd/터널/Vercel 선택은 smoke 이후 결정해야 한다.
- Vercel guide는 준비됐지만 실제 Vercel production deployment, Supabase redirect update, deployed health check, deployed smoke flow는 아직 수행 전이다.
- Vercel production env는 로컬 파일 변경만으로 자동 반영되지 않는다. `.env.vercel.import`의 OpenAI 값은 Vercel Environment Variables에 import/update하고 redeploy해야 public URL에 반영된다. `SKAI_DEFAULT_PROVIDER`와 `SKAI_DEFAULT_MODEL`은 solving UI에서 더 이상 쓰지 않는다.

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
- SKAI Artifact card와 universal reading layer를 만들어 공유 화면에서 score/transcript보다 먼저 구조를 읽게 한다. (완료)
- 완료 조건: judge/replay/sharing 중 하나 이상이 graph annotation을 1차 입력으로 사용한다. (완료)

우선순위 1.6: graph evaluation overlay and parallel comparison

- judge/deterministic annotations를 3D Dual Graph의 node/edge overlay로 표현한다.
- bottleneck node, weak edge, recovery/material/verification signal을 색/두께/pulse로 구분하되, 초보자에게 graph theory 용어를 과노출하지 않는다.
- overlay는 구조 graph 위에 씌우는 lens이므로 전체 on/off와 개별 layer toggles를 제공한다.
- parent/child branch는 텍스트 diff보다 두 graph를 나란히 놓고 annotation delta를 읽는 comparison surface로 확장한다.
- multi-model/harness graph는 당장 구현하지 않고, single-model attempt 구조를 깨지 않는 `model lane` / `inter-model edge` 설계 hook을 먼저 문서화한다.
- 완료 조건: 사용자가 detail panel을 읽기 전에도 graph 위에서 병목과 회복 지점을 대략 볼 수 있고, branch가 무엇을 고쳤는지 병렬 graph로 설명할 수 있다.

우선순위 1.7: shared branch graph snapshot persistence

- 공개 share 화면에서도 parent/child 3D Dual Graph comparison을 local parent attempt 없이 재현할 수 있어야 한다. (신규 `.skai` publish는 완료)
- publish 시점에 parent/child `ConversationGraph`의 structural subset과 branch payload를 `.skai` schema version과 함께 저장한다. (완료)
- `GraphStateTransition` fallback은 유지하되, 공개 branch replay의 primary comparison은 parent/child graph surface가 되어야 한다. (신규 `.skai` snapshot은 완료)
- 완료 조건: `/share/[attemptId]`에 직접 진입해도 parent/child full graph comparison, breakpoint focus, overlay signal이 동일하게 재현된다. (신규 publish 기준 완료, 구 snapshot은 fallback)
- 후속: old snapshot migration, signed artifact, binary material bundle, native file association은 별도 slice로 남긴다.

우선순위 2: golden attempts and LLM judge calibration

- 각 seed problem마다 weak/average/strong attempt를 만든다. (완료)
- `.skai` fixture 기반 judge/coaching 개발 루프를 만든다. (완료)
- `skai.judge.v1` / `skai.coach.v1` deterministic baseline extension을 fixture에서 생성한다. (완료)
- unified `.skai` viewer는 extension registry를 통해 judge/coaching layer를 렌더링할 수 있다. (완료)
- `.skai` export helper에는 optional extension hook이 있고, `verify:skai` 통합 검증 명령이 있다. (완료)
- `SKAI_JUDGE_MODE=llm` 또는 `ensemble`으로 실제 judge provider를 켠다.
- heuristic report와 LLM judge report를 비교한다. (heuristic baseline 완료, LLM 비교 후속)
- malformed JSON, provider failure, judge disagreement를 기록한다.
- coach review와 strict rubric mode를 분리할 준비를 한다.
- 완료 조건: 최소 9개 sample attempt에서 judge 결과를 founder가 정성 검토한다. (runner 완료, founder/LLM review 후속)

우선순위 2.5: bilingual language system

- 번역 전 SKAI technical concept glossary와 protected terms를 고정한다. (계획 완료)
- UI copy를 inventory하고 source-locale 기반 copy registry로 이전한다. (1차 완료)
- 한 언어에서 먼저 수정된 copy는 반대 언어를 자동으로 stale/missing 상태로 표시한다. (tooling 완료)
- 한국어 모드에서도 `Orchestration`, `Trace`, `Artifact`, `3D Dual Graph` 같은 핵심 개념어는 필요 시 영어로 유지한다.
- philosophy/brand copy는 직역하지 않고 ko/en 공식본을 별도로 승인한다.
- 문제 content localization은 source problem과 derived translation을 분리하는 백본을 만들고 seed problem 영어 view를 추가했다. (1차 완료)
- `verify:i18n`은 registry check와 source regression check를 함께 수행한다. (완료)
- seed problem playbook locale variant와 raw JSX baseline reduction slices를 처리했다. Admin authoring, Generated Problem Gate, local draft surfaces까지 registry 경로로 이전했고 baseline은 72개 entry다. (완료)
- 다음 구현: raw JSX baseline reduction을 계속 진행하거나 Markdown playbook과 typed app playbook source-of-truth를 통합한다.
- 완료 조건: `verify:i18n`이 missing/stale/protected-term drift, source key drift, raw JSX text 증가를 검출하고, 주요 route의 copy가 locale registry에서 렌더링된다. (first-impression/solve/viewer/share/judge/problem content/regression backbone 완료)

우선순위 2.6: user identity and My SKAI surface

- Google login 이후 사용자가 자신의 계정, display identity, privacy/data control, orchestration summary를 확인할 수 있는 `/me` 마이페이지를 만든다. (완료: `docs/technical/plan/092_user_mypage_identity_surface.md`)
- 백엔드는 얇은 `user_profiles` 테이블과 user-scoped summary API로 시작한다. (완료: `supabase/migrations/011_user_profiles.sql`, `/api/me`, `/api/me/profile`)
- 마이페이지는 점수 경쟁판이 아니라 개인 `Trace`/`Artifact`/공개 상태/데이터 소유권 제어실이어야 한다.
- 이 slice는 홈페이지 redesign을 다루지 않는다.
- 완료 조건: 로그인 사용자가 `/me`에서 계정/profile/orchestration summary/recent artifact를 보고, 비로그인 사용자는 sign-in CTA와 local demo 안내를 본다. (완료)

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
- Supabase remote cohort snapshot을 admin dashboard에 표시한다. (완료: allowlisted service-role 또는 user RLS fallback)
- 완료 조건: DB table을 직접 열지 않아도 smoke test 정성 분석이 가능하다. (부분 완료: local + remote snapshot)
- 후속: remote founder notes, filters, export, automatic insight extraction.

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
- `docs/technical/plan/040_comment_moderation_and_privacy.md`: 공개 댓글의 민감정보 redaction과 1차 misuse guardrail.
- `docs/technical/plan/041_gemini_manifesto_brand_mark.md`: Gemini 철학 대화 반영, 3-node directed graph brand mark 1차 적용.
- `docs/technical/plan/042_human_engine_mode_ui_split.md`: Human Mode / Engine Mode route tokens와 Gemini 최신 briefing.
- `docs/technical/plan/043_route_mode_logo_sync_bugfix.md`: topbar mark route mode sync 안정화.
- `docs/technical/plan/044_gemini001_artifact_mirror_universalization.md`: SKAI Artifact, Intelligence Mirror, universal reading layer, packet-flow, graph transition log.
- `docs/technical/plan/045_supabase_cohort_review_dashboard.md`: Supabase remote cohort snapshot을 founder dashboard에 표시.
- `docs/technical/plan/046_comment_edit_delete_and_reports.md`: 공개 댓글 edit, soft-delete, report baseline.
- `docs/technical/plan/047_brand_mark_logo_lockup.md`: 3-node mark와 wordmark/full name을 묶은 reusable lockup.
- `docs/technical/plan/048_bulk_problem_batch_ingestion.md`: 생성 문제 batch 001 검토, 원본 archive, 앱용 normalization/import.
- `docs/technical/plan/049_problem_browser_search_filter_curation.md`: 홈 문제 검색, 필터, curation lane.
- `docs/technical/plan/050_generated_problem_editorial_gate.md`: Gemini 004 반영, 생성 문제 smoke publish gate와 Admin editorial dashboard.
- `docs/technical/plan/051_activity_aware_graph_mark.md`: Gemini 005 반영, literal flame 대신 activity-aware graph packet-flow.
- `docs/technical/plan/052_home_hero_lockup_and_copy.md`: 홈 hero 중복 lockup 제거와 SKAI 철학 기반 headline 후보 정리.
- `docs/technical/plan/053_home_hero_line_integrity.md`: Prometheus headline이 문장 내부에서 줄바꿈되지 않도록 line integrity 보정.
- `docs/technical/plan/054_browser_oauth_logo_assets.md`: Chrome favicon과 Supabase/OAuth branding용 graph mark asset 생성.
- `docs/technical/plan/055_deployment_reporting_and_share_open_fix.md`: 배포 반영 보고 규칙과 publish/share open race 보강.
- `docs/technical/plan/056_openai_nano_provider_baseline.md`: OpenAI API key와 `gpt-4.1-nano` 저가 baseline 연결.
- `docs/technical/plan/057_gemini_default_openai_optional.md`: Gemini를 전체 기본값으로 복구하고 OpenAI nano는 선택 옵션으로 유지했으나, 이후 `058`과 TDR-087이 visible default 정책을 supersede했다.
- `docs/technical/plan/058_explicit_model_choice_message_copy_and_graph_visual_fix.md`: visible model default 제거, message copy, Markdown rendering, directed graph/3D graph 시각화 보정.
- `docs/technical/plan/059_dual_graph_spine_sequence_layout.md`: 3D Dual two-spine/status bridge와 projection sequence path로 graph 시각화를 원래 철학에 맞게 재정렬.
- `docs/technical/plan/060_three_spine_dual_graph_pair_status.md`: P/R/S 3-spine 구조, prompt-response direct pair, status pair-binding layer, selected node border emphasis.
- `docs/technical/plan/061_status_right_spine_and_dedup_status_graph.md`: Status를 항상 오른쪽 spine으로 유지하고, Status graph를 P/R 반복 없이 status-to-status progression으로 정정.
- `docs/technical/plan/062_dual_graph_closed_pair_frame.md`: 3D Dual의 prompt-response pair frame을 닫힌 binding container로 보정하고 Status 연결선/Response offset을 정렬.
- `docs/technical/plan/063_dual_graph_diagonal_response_geometry.md`: `R_i`를 `P_i/P_{i+1}` 중점 높이에 배치하고, P->R 사선 edge와 평행사변형형 binding frame으로 3D Dual geometry를 보정.
- `docs/technical/plan/064_dual_graph_precise_pair_parallelogram.md`: P/R 노드를 관통하지 않고 실제로 감싸는 평행사변형 좌표계로 3D Dual frame을 정밀 보정.
- `docs/technical/plan/065_dual_graph_frame_slope_match.md`: P/R 연결 vector와 frame 위아래 변의 기울기를 더 명확히 맞추도록 3D Dual frame 좌표를 재보정.
- `docs/technical/plan/066_dual_graph_ladder_geometry.md`: 063-065의 사선/평행사변형 표현을 supersede하고, dual graph를 P/R vertical spines와 horizontal ladder rungs로 재표현.
- `docs/technical/plan/067_ladder_edge_presence_and_status_swirl.md`: ladder rung 존재 조건, R->P-edge leftward flow, centered status marker, 초기 status swirl을 반영.
- `docs/technical/plan/068_ladder_same_index_activation_and_origin_stub.md`: same-index P/R/S activation, clockwise status swirl, first-row R-origin visual stub을 반영.
- `docs/technical/plan/069_graph_surface_ladder_alignment_and_tab_simplification.md`: 3D Dual ladder와 backend graph/index 정합성을 확인하고, 사용자-facing projection/index tabs를 제거.
- `docs/technical/plan/070_graph_evaluation_overlay_and_parallel_comparison.md`: Gemini 006 반영, graph evaluation overlay와 parent/child 병렬 비교 UI, multi-model graph 설계 hook 계획.

다음 plan 후보:

- 다음 slice는 `070`의 Slice 1인 Evaluation Overlay를 우선 구현하고, 실제 브라우저 smoke 후 node density, selected-set readability, branch anchor visibility를 재평가한다.

## Reading Map

철학:

- `docs/philosophy/000_project_seed.md`
- `docs/philosophy/002_initial_demo_answers.md`
- `docs/philosophy/005_materials_and_real_world_context.md`
- `docs/philosophy/006_3d_dual_graph_system_backbone.md`
- `docs/philosophy/007_intelligence_and_brand_manifesto.md`
- `docs/philosophy/Gemini/002.md`
- `docs/philosophy/Gemini/006.md`

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
- `docs/technical/013_supabase_deployment_checklist.md`
- `docs/technical/014_vercel_first_deployment_guide.md`

디자인:

- `docs/design/000_design_principles.md`
- `docs/design/001_theme_recommendation.md`
- `docs/design/002_font_and_provider_surfaces.md`
- `docs/design/004_logo_asset_usage.md`

## Update Trigger

이 문서는 다음 경우 반드시 갱신한다:

- 새 plan이 추가될 때.
- 구현 완료로 current state가 바뀔 때.
- 어떤 gap이 해결되거나 새 gap이 발견될 때.
- smoke test 결과로 우선순위가 바뀔 때.
- 중요한 기술/제품 결정이 decision register에 추가될 때.
