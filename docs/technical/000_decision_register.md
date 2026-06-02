# SKAI Technical Decision Register

이 문서는 기술 선택이 실제 구현 방향을 고정하기 시작할 때 기록하는 곳이다. 아직 결정되지 않은 항목은 `Undecided`로 둔다.

| ID | Area | Decision | Status | Reason | Date |
| --- | --- | --- | --- | --- | --- |
| TDR-001 | Demo mode | In-app AI conversation flow | Accepted | 첫 데모는 SKAI 안에서 문제를 풀며 AI와 대화하는 경험이어야 함 | 2026-06-01 |
| TDR-002 | Hosting | Vercel for MVP web app and API routes | Accepted | Next.js MVP와 가장 직접적으로 맞고 24시간 서버 운영 부담이 낮음 | 2026-06-01 |
| TDR-003 | Database | Supabase Postgres for MVP storage | Accepted | 로그인, 전체 trace 저장, 공개 풀이, 댓글, 리더보드, 관리자 분석에 적합 | 2026-06-01 |
| TDR-004 | Judge/provider | Use low-cost founder-funded provider first, with stronger judge fallback; exact first provider after spike | Accepted | 전략은 확정하되 실제 API 키/요금/품질 테스트 후 첫 provider를 고정 | 2026-06-01 |
| TDR-005 | Trace schema | Full prompt trace must be stored | Accepted | 공유/피드백/평가의 핵심 artifact가 전체 대화 과정임 | 2026-06-01 |
| TDR-006 | Scoring model | Total score plus multi-axis scores | Accepted | 직관적인 총점과 학습 가능한 세부 피드백을 둘 다 제공해야 함 | 2026-06-01 |
| TDR-007 | Auth | Supabase Auth with Google login first; later email/password, GitHub, account linking | Accepted | 데모에서 사용자별 attempt 저장과 공개 풀이 관리가 필요하고 초기 진입장벽이 낮음 | 2026-06-01 |
| TDR-008 | Privacy model | Store raw full traces; public sharing via structured default view plus expandable raw details | Accepted | 통제된 문제에는 개인정보가 불필요하지만 publish/privacy boundary는 필요 | 2026-06-01 |
| TDR-009 | First users | University students, not university-specific | Accepted | 초기 접근성은 대학생 기준이지만 제품 문제는 범용 AI orchestration이어야 함 | 2026-06-01 |
| TDR-010 | Demo scale | Fewer than 10 users, personal laptops, no strict time limit | Accepted | 첫 smoke/demo 검증 규모 | 2026-06-01 |
| TDR-011 | Codex backend | Research spike only; do not assume live Codex session can be product backend | Proposed | API-based agent loop와 현재 Codex 세션 의존은 다른 문제임 | 2026-06-01 |
| TDR-012 | Product type | Community plus education platform | Accepted | 반복 훈련과 공유를 결합한 백준형 방향 | 2026-06-01 |
| TDR-013 | Evaluation scope | Evaluate prompt, trace, artifact, strategy, and orchestration process | Accepted | 사용자는 "싹다" 평가받아야 하며 단일 프롬프트 평가로 축소하면 안 됨 | 2026-06-01 |
| TDR-014 | Core score axes | Framing axis plus operation axis | Accepted | 문제정의/세분화/지시문 작성과 모델선택/검증/비용관리를 구분 | 2026-06-01 |
| TDR-015 | Goal-aware scoring | Problem/user goals should affect evaluation weights | Accepted | 좋은 AI orchestration의 기준은 정확성/속도/비용/정착 등 목표에 따라 달라짐 | 2026-06-01 |
| TDR-016 | Structure-first credit | Reward problem structuring before asking AI for answers | Accepted | SKAI의 핵심 철학과 직접 연결됨 | 2026-06-01 |
| TDR-017 | Process vs outcome | Evaluate process quality and final output quality separately | Accepted | 과정이 좋은 경우와 결과가 좋은 경우를 같은 점수로 뭉개면 안 됨 | 2026-06-01 |
| TDR-018 | Problem answer model | Support both clear-answer and multi-solution problems | Accepted | 문제 유형은 사용자가 고를 수 있어야 함 | 2026-06-01 |
| TDR-019 | Problem ambiguity | Allow variable ambiguity and intentionally missing constraints | Accepted | 현실 문제의 unclear함을 훈련해야 함 | 2026-06-01 |
| TDR-020 | Clarifying questions | Score useful clarifying questions as uncertainty management, not question count | Accepted | 실제 불확실성을 줄이는 질문은 보상하고 실행을 미루는 질문은 보상하지 않음 | 2026-06-01 |
| TDR-021 | Model answers | Avoid canonical model answers as the main feedback mechanism | Accepted | 개별 코칭이 목표이며 정답 풀이 끼워맞추기가 아님 | 2026-06-01 |
| TDR-022 | Rubric visibility | Make rubrics public | Accepted | 사용자가 무엇을 연습하는지 알아야 함 | 2026-06-01 |
| TDR-023 | Total score | Include symbolic 100-point score, but emphasize detailed axes | Accepted | 점수는 필요하지만 점수 따기가 제품 목적이 되어선 안 됨 | 2026-06-01 |
| TDR-024 | Default score axes | Use problem definition, decomposition, instruction clarity, adaptation, verification, efficiency, final quality | Accepted | 첫 버전은 예시축으로 시작하고 이후 보정 | 2026-06-01 |
| TDR-025 | Metrics visibility | Token/time/turn/context metrics vary by mode | Accepted | 입문자에게는 과도한 지표 노출이 오히려 방해됨 | 2026-06-01 |
| TDR-026 | Feedback style | Coach review by default; strict rubric for verification/certification modes | Accepted | 학습과 검증은 같은 UI 톤을 쓰면 안 됨 | 2026-06-01 |
| TDR-027 | Judge dispute | Allow users to dispute judge feedback | Accepted | LLM judge도 틀릴 수 있으므로 이의제기 경로 필요 | 2026-06-01 |
| TDR-028 | Branch replay | Allow restart from a specific trace position | Accepted | bottleneck과 alternative prompting을 사용자가 직접 체감하게 함 | 2026-06-01 |
| TDR-029 | Multi-judge | Include LLM judge voting as a product direction | Accepted | 평가 신뢰도와 judge disagreement 분석에 필요 | 2026-06-01 |
| TDR-030 | Shared attempt UX | Show workflow and prompt summaries first; raw prompts/responses expandable | Accepted | 학습 가치는 원문보다 구조와 흐름에서 먼저 나옴 | 2026-06-01 |
| TDR-031 | Sharing incentive | Published prompt traces unlock access to other published traces | Accepted | 공유자에게 명확한 이익을 제공 | 2026-06-01 |
| TDR-032 | Certification similarity | Use DB-backed prompt similarity checks in high-stakes modes | Accepted | 수료/채용/인증에서는 본인 풀이 여부가 중요함 | 2026-06-01 |
| TDR-033 | Community comments | Support Slack-like threads on specific prompts/trace events | Accepted | 커뮤니티 학습과 연구를 위해 프롬프트 단위 토론 필요 | 2026-06-01 |
| TDR-034 | Community orientation | Learning, research, and portfolio first; competition secondary | Accepted | 경쟁은 자연발생시키되 제품이 과도하게 유도하지 않음 | 2026-06-01 |
| TDR-035 | App stack | Next.js full-stack app | Accepted | 사용자가 yes로 답했고 MVP 범위에 적합 | 2026-06-01 |
| TDR-036 | DB/Auth stack | Supabase for MVP | Accepted | Postgres, Google login, dashboard, Next.js integration을 한 번에 해결 | 2026-06-01 |
| TDR-037 | Initial auth | Start with Google login; later add email/password, GitHub, account linking | Accepted | 초기 진입장벽을 낮추고 장기 계정 모델로 확장 | 2026-06-01 |
| TDR-038 | Provider strategy | Multi-provider adapter architecture | Accepted | OpenAI, Gemini, xAI Grok, Groq, OpenRouter, Hugging Face 등을 지원해야 함 | 2026-06-01 |
| TDR-039 | Model selection | Support model selection internally and in expert/admin modes | Accepted | 모델 선택은 중요하지만 기본 사용자 풀이 화면이 API playground처럼 보이면 안 됨 | 2026-06-01 |
| TDR-040 | Judge separation | Separate conversation model and judge model | Accepted | 사용자 경험 모델과 평가 모델의 요구조건이 다름 | 2026-06-01 |
| TDR-041 | Judge execution | Synchronous first, queue-ready data model | Accepted | 초기 UX는 즉시 채점이 좋고, 느려지면 queue로 전환 | 2026-06-01 |
| TDR-042 | Leaderboard | Per-problem leaderboard required | Accepted | 백준형 구조와 문제별 비교에 필요 | 2026-06-01 |
| TDR-043 | Admin authoring | Admin problem authoring UI required | Accepted | 기업/HR/교육 고객은 문제 출제가 필요함 | 2026-06-01 |
| TDR-044 | Budget | Monthly cap KRW 200,000; event cap KRW 100,000 | Accepted | 저가 provider 우선, 비싼 GPT API 사용 지양 | 2026-06-01 |
| TDR-045 | Demo success signal | User realizes AI quality depends heavily on their usage method | Accepted | 실제 사용자 피드백에서 이 인식 변화가 발견되어야 함 | 2026-06-01 |
| TDR-046 | Demo report | Provide detailed, friendly AI-use habit and prompt-history coaching report | Accepted | 코치 코멘트가 핵심 가치를 전달함 | 2026-06-01 |
| TDR-047 | Founder analysis | Preserve all logs for initial founder review | Accepted | 첫 smoke에서는 정성 분석이 핵심 | 2026-06-01 |
| TDR-048 | Problem materials | Treat official materials and user-uploaded files as first-class problem context | Accepted | 현실 문제에서는 영수증, 스프레드시트, 로그, 이미지 같은 자료 활용 능력이 핵심임 | 2026-06-01 |
| TDR-049 | Material viewer | Provide a side material list and tab-like viewer in the solving UI | Accepted | 사용자가 자료를 보고 선택하는 과정 자체가 평가 대상임 | 2026-06-01 |
| TDR-050 | Attachment-to-model path | Selected materials/uploads must be included in backend model context | Accepted | 파일 선택 행위가 실제 모델 입력에 반영되어야 함 | 2026-06-01 |
| TDR-051 | Material extraction MVP | Use extracted text sidecars for official files; pass text uploads directly and images as data URLs where supported | Accepted | OCR/임의 XLSX/PDF 파싱은 후속 과제로 두되 데모에서 모델이 자료를 볼 수 있어야 함 | 2026-06-01 |
| TDR-052 | Supabase sync | Use server API routes for Supabase persistence with local fallback | Accepted | 클라이언트 직접 DB 쓰기보다 auth/cookie/RLS 흐름에 맞고 mock/local 모드도 유지됨 | 2026-06-01 |
| TDR-053 | OAuth callback | Use `/auth/callback` for Supabase Google OAuth exchange | Accepted | Supabase session cookies를 Next.js route handler에서 안정적으로 설정해야 함 | 2026-06-01 |
| TDR-054 | User-facing AI choice | Choose one interaction environment before attempt start; no raw provider/model switching inside demo solve | Superseded | TDR-067 separates solving mode from model choice because provider brand must not define workflow | 2026-06-01 |
| TDR-055 | Solving modes | Demo supports single-model attempts; future versions should support multi-AI and harness modes | Accepted | SKAI의 장기 방향은 여러 AI를 task별로 배분하는 오케스트레이션 훈련까지 포함해야 함 | 2026-06-01 |
| TDR-056 | Judge architecture | Build a repeatable judge pipeline before any Codex-backed agent judge | Accepted | 채점은 반복 가능성, 구조화 출력, judge run 기록, disagreement 추적이 우선이며 Codex judge는 local research spike로 분리해야 함 | 2026-06-01 |
| TDR-057 | Shared attempt IA | Show workflow, prompt skeleton, and bottlenecks before raw transcript | Accepted | SKAI 공유 화면은 프롬프트 원문보다 문제 구조화와 task 배분 흐름을 먼저 학습시키는 공간이어야 함 | 2026-06-01 |
| TDR-058 | Prompt discussion anchor | Attach comments to trace events, not only whole attempts | Accepted | 학습 커뮤니티의 핵심 질문은 특정 프롬프트 지점의 문제정의, 세분화, 검증, 수정 판단에 달려 있음 | 2026-06-01 |
| TDR-059 | Material drag attachment | Official materials can be dragged into the composer as prompt attachments | Accepted | 자료를 선택하는 행위 자체가 현실 문제 풀이와 평가 trace의 일부이므로 AI workspace처럼 자연스러워야 함 | 2026-06-01 |
| TDR-060 | MVP API guardrails | Reject oversized or invalid request shapes before model/provider/database paths | Accepted | SaaS 운영 관점에서 데모라도 payload, attachment, provider, comment target 검증은 초기에 넣어야 함 | 2026-06-01 |
| TDR-061 | Controlled attachment drop | Only the composer dropzone accepts material/file drop; prompt textarea drop is blocked | Accepted | 첨부 행위는 traceable UI action이어야 하며 textarea에 material id나 파일명이 우발적으로 삽입되면 평가 trace가 흐려짐 | 2026-06-01 |
| TDR-062 | Dual graph trace model | Derive prompt graph, response graph, and task-status layer from flat traces | Accepted | SKAI의 핵심 학습 대상은 단일 프롬프트가 아니라 사용자의 directed orchestration flow이므로 graph 표현이 연구와 시각화에 적합함 | 2026-06-01 |
| TDR-063 | Graph builder complexity | Build derived conversation graphs with a single trace pass and sparse indexes | Accepted | graph 모델은 의미론뿐 아니라 backend lookup/build 비용을 낮춰야 하므로 `O(n + b + e)` build와 `O(V + E)` storage를 목표로 함 | 2026-06-02 |
| TDR-064 | Breakpoint replay branch | Branch from a trace event by creating a child attempt with source trace lineage, and mark the breakpoint on the existing prompt-response pair | Accepted | GDB-like replay는 bottleneck을 체감하게 하지만 3D dual graph를 4번째 차원으로 흔들면 안 되므로 branch는 inter-attempt metadata와 pair anchor로 다룸 | 2026-06-02 |
| TDR-065 | Context compiler | Treat provider context as a compiled runtime artifact from immutable trace, not as provider-thread storage | Accepted | branch/replay/비교/채점/공유를 안정적으로 하려면 삭제/복원이 아니라 현재 attempt path에서 context를 매번 재구성해야 함 | 2026-06-02 |
| TDR-066 | Counterfactual judge | Store parent/child branch diff and counterfactual judge report separately from the original score report | Accepted | replay의 학습 가치는 기존 점수를 덮는 것이 아니라 병목 변경의 인과 효과를 별도 평가하는 데 있음 | 2026-06-02 |
| TDR-067 | Mode/model separation | Select solving mode and model independently before attempt start | Accepted | 모델은 실행 엔진이고 모드는 사용자의 연습/평가 렌즈이므로 Gemini=자료탐색형, OpenAI=일반대화형처럼 묶으면 사용자 오케스트레이션 선택권이 흐려짐 | 2026-06-02 |
| TDR-068 | Problem prompt playbooks | Every problem must have a paste-ready prompt playbook | Accepted | strict cold-start live chat에서는 모델이 숨은 문제 맥락을 모르므로 출제자는 실제로 어떤 프롬프트 trace가 가능한지 검증해야 함 | 2026-06-02 |
| TDR-069 | Graph workspace | Show the derived 3D dual graph as an operational solving tab | Accepted | SKAI의 핵심 artifact는 flat chat이 아니라 prompt graph, response graph, task-status layer이므로 사용자가 풀이 중 구조를 보고 branch를 만들 수 있어야 함 | 2026-06-02 |
| TDR-070 | Local runtime | Use `next dev` for active development and `next start` production mode for stable Mac/LAN demos | Accepted | 맥북 상시 구동은 가능하지만 장시간 데모는 dev server보다 build 후 production server가 안정적이며, 외부 공개는 포트포워딩이 아니라 배포/터널 전략으로 분리해야 함 | 2026-06-02 |

## Decision Template

```md
## TDR-000: Title

- Area:
- Status: Proposed | Accepted | Rejected | Superseded
- Date:
- Decision:
- Context:
- Alternatives:
- Reason:
- Consequences:
- Revisit when:
```
