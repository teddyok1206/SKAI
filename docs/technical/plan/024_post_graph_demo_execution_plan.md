# 024 Post-Graph Demo Execution Plan

Date: 2026-06-02

## Goal

설계, 기존 계획, SKAI 철학, 현재 진척도 분석을 합쳐 다음 개발 순서를 구체적으로 고정한다.

이 문서는 단일 기능 구현 계획이 아니라, 그래프/브랜치/카운터팩추얼까지 갖춘 현재 데모를 실제 smoke test 가능한 제품 루프로 끌고 가기 위한 실행 로드맵이다.

## Inputs

### 1. Design

현재 디자인 방향은 다음으로 정리된다.

- SKAI는 랜딩 페이지, 일반 챗봇, 프롬프트 갤러리, 모델 playground가 아니다.
- 첫 화면과 풀이 화면은 Apple식 미니멀함을 참고하되, 마케팅이 아니라 작업 표면이어야 한다.
- 모델 선택은 풀이 시작 전에 조용하고 명확하게 끝난다.
- 풀이 중 핵심 표면은 `Chat / Graph`이며, 그래프는 장식이 아니라 prompt-response-status causality를 보여주는 조작 가능한 도구다.
- 공유 화면은 원문 transcript보다 workflow, prompt skeleton, bottleneck, branch replay, coach report를 먼저 보여준다.

### 2. Plans

현재 완료된 plan 흐름은 대략 다음 단계까지 와 있다.

- MVP scaffold, auth, persistence baseline.
- materials and attachments.
- live provider adapter baseline.
- theme/font/provider surface.
- minimal interface pass.
- judge system foundation.
- shared attempt information architecture.
- comment thread.
- material drag/drop and SaaS guardrails.
- dual graph trace model.
- breakpoint branch replay.
- immutable trace context compiler.
- parent/child branch diff and counterfactual judge.
- strict cold-start live context.
- mode/model separation.
- problem prompt playbooks.
- operational graph tabs.
- compact node graph.
- directed graph affordance.

따라서 다음 계획은 새 추상화를 추가하는 단계가 아니라, 이미 만든 핵심 루프를 실제 사용자와 실제 모델로 검증하는 단계여야 한다.

### 3. Philosophy

SKAI의 중심 명제:

> AI를 잘 쓰는 능력은 단일 프롬프트 문장력이 아니라, 불명확한 현실 문제를 정의하고, 세분화하고, AI에게 task를 배분하고, 중간 결과를 해석하고, 검증하는 orchestration 능력이다.

이 계획이 지켜야 할 원칙:

- scoring은 상징적으로 필요하지만, 점수 따기가 제품 목적이 되어서는 안 된다.
- 모델 성능 평가와 인간 orchestration 평가는 분리되어야 한다.
- cold-start 비교 가능성을 깨뜨리면 안 된다.
- 원문 프롬프트보다 구조, 흐름, task 분배, 자료 활용이 먼저 보여야 한다.
- 실제 자료, 불명확성, 비용, 시간, context limit이 없는 문제는 SKAI의 핵심 문제라고 보기 어렵다.
- 첫 smoke test는 founder가 모든 log를 정성 분석할 수 있을 만큼 작아야 한다.

### 4. Current Progress Audit

#### Already Solid Enough For Smoke

- Next.js app runs locally.
- Problem list and problem solve route exist.
- In-app chat captures trace.
- Strict cold-start chat context is enforced.
- Markdown and LaTeX rendering works.
- Materials can be viewed, selected, dragged into the composer, and included in backend model context.
- Prompt textarea does not accept accidental material drops.
- Provider adapters exist for OpenAI-compatible, Groq, xAI, Gemini, OpenRouter, and mock.
- Solving mode and model choice are independent.
- Attempt submission and score report flow exist.
- Heuristic judge works without API keys.
- LLM judge and ensemble mode are structurally prepared.
- Shared attempt page shows strategy-first information architecture.
- Trace comments can anchor discussion to specific events.
- 3D dual graph exists in the solve UI.
- Graph nodes are compact and clickable.
- Directed prompt/status/response flow is visible.
- Breakpoint replay can create child attempts.
- Branch diff and counterfactual judge baseline exist.
- Supabase migrations exist for persistence, comments, branch metadata, and counterfactual reports.

#### Functional But Not Yet Proven

- Live model call path exists, but needs repeated smoke with real API keys.
- Gemini/Groq/xAI cost, latency, rate limit, and structured output reliability are not yet measured in SKAI traces.
- LLM judge mode is wired but not calibrated.
- Score report quality has not been compared against founder qualitative judgment across multiple attempts.
- Supabase auth and sync are implemented but need deployed-environment validation.
- Graph UI works for a single attempt, but branch tree exploration across attempts is still weak.
- Admin problem authoring exists only at a minimal route level and is not yet a full authoring workflow.
- Public sharing exists, but privacy boundary and moderation behavior are not production-grade.

#### Missing For Credible External Demo

- A repeatable smoke script that creates known sample attempts without hand-typing.
- At least 3 golden attempts per initial problem: weak, average, strong.
- LLM judge calibration notes that explain where heuristic and LLM judge agree/disagree.
- Provider/model cost estimation per attempt.
- Deployment checklist for Vercel + Supabase.
- Admin problem authoring workflow for problem statement, materials, rubric, and playbook.
- Branch lineage view for parent attempt plus multiple child branches.
- Basic privacy/publish controls that are obvious to non-technical users.
- Founder review dashboard for all logs in the first 10-person test.

## Execution Strategy

The next phase should not start by adding more impressive AI-agent features. The current demo already has enough unique structure. The right next step is to make the loop reliable, measurable, and reviewable:

```text
Live model attempt
  -> trace capture
  -> graph representation
  -> submit
  -> judge report
  -> branch replay
  -> branch diff/counterfactual
  -> share/review
  -> founder qualitative notes
```

Everything below is ordered by how directly it strengthens that loop.

## Phase 0: Freeze The Current Demo Contract

Priority: immediate

### Objective

Define exactly what the demo currently promises, so future work does not drift into generic chatbot/platform expansion.

### Tasks

1. Create a short `demo_contract` section in `docs/000_orchestration.md`.
2. State the first smoke path:
   - choose problem,
   - choose mode/model,
   - attach official materials when needed,
   - solve through chat,
   - inspect graph,
   - submit,
   - read coach report,
   - branch from one bottleneck,
   - compare branch,
   - publish/share.
3. Mark features outside the first smoke:
   - multi-AI solving,
   - certification anti-cheat,
   - full admin marketplace,
   - production moderation,
   - dense graph analytics.

### Done Criteria

- A new contributor can read one section and understand what must work in the next demo.
- Any feature request can be judged against this contract.

### Main Risk

If this is skipped, the project can drift toward a model playground because provider/model features are visually tempting.

## Phase 1: Live Environment Smoke

Priority: P0

### Objective

Prove that at least one real model can solve a SKAI problem through the strict cold-start path without hidden context.

### Provider Order

1. Gemini free/low-cost model for text and image-friendly smoke.
2. Groq for cheap/fast text-only comparison.
3. xAI Grok if cost and latency are acceptable.
4. OpenAI only if judge quality or compatibility requires it.

### Tasks

1. Verify `.env.local` provider variables are read by `/api/chat`.
2. Add a small provider smoke log template:
   - provider,
   - model,
   - problem,
   - prompt playbook step,
   - latency,
   - token usage if available,
   - failure mode,
   - fallback behavior.
3. Run each existing playbook once against Gemini.
4. Record whether image/data attachments reach the model in useful form.
5. Run one Groq text-only attempt on `ambiguous-research-brief`.
6. Confirm the model does not receive hidden SKAI background/system context.
7. Confirm markdown/LaTeX render cleanly in live responses.

### Done Criteria

- One live provider completes one problem end-to-end.
- One attempt is submitted and judged.
- The trace shows only user-visible context plus selected attachments.
- Failure/fallback behavior is documented.

### Affected Areas

- `app/api/chat/route.ts`
- `lib/providers/*`
- `lib/context-compiler.ts`
- `docs/problem_playbooks/*`
- `docs/000_orchestration.md`

### Risks

- Gemini/Groq response shape mismatch.
- Usage token data missing or inconsistent.
- Image attachments may not work uniformly across providers.
- Provider failure may silently fall back to mock and hide real integration issues.

## Phase 2: Golden Attempts And Judge Calibration

Priority: P0

### Objective

Make SKAI feedback credible by comparing judge output against founder qualitative judgment.

### Golden Attempt Set

For each initial problem, create at least:

- weak attempt: vague prompt, little decomposition, no verification.
- average attempt: reasonable task breakdown, weak final validation.
- strong attempt: clear framing, material use, constraints, verification, final synthesis.

### Tasks

1. Add UI or script support for inserting playbook prompts quickly.
2. Produce golden attempts for the three current problems.
3. Submit each attempt with heuristic judge.
4. Submit the same attempts with LLM judge.
5. Compare:
   - process score,
   - final output score,
   - bottleneck detection,
   - coach wording,
   - hallucination/drift detection,
   - material-use recognition.
6. Record judge disagreement instead of hiding it.
7. Decide first judge mode for smoke:
   - heuristic only,
   - LLM judge only,
   - ensemble.

### Done Criteria

- Minimum 9 judged attempts exist locally or in Supabase.
- Founder can point to at least 3 cases where SKAI feedback teaches the intended lesson.
- Judge failures and weak feedback cases are recorded as calibration issues.

### Affected Areas

- `lib/judge.ts`
- `app/api/judge/route.ts`
- `components/score-report-card.tsx`
- `docs/problem_playbooks/*`
- future `docs/technical/judge_calibration/*`

### Risks

- LLM judge may be verbose but not useful.
- Judge may over-credit polished final answers and under-credit process.
- Heuristic judge may miss semantic bottlenecks.

## Phase 3: Prompt Playbook Insertion And Smoke Operator UX

Priority: P1

### Objective

Reduce founder/operator typing friction so smoke tests can generate repeatable traces.

### Tasks

1. Add a developer/operator-only playbook panel or command in the problem solve UI.
2. Let the operator insert the next playbook prompt into the composer.
3. Show required attachments for that playbook step.
4. Mark inserted prompts as normal user prompts in trace, with optional metadata:
   - `source: "playbook"`
   - `playbookStepId`
5. Keep this invisible or disabled for normal users in the first demo if needed.

### Done Criteria

- A known attempt can be generated without copying from md manually.
- Playbook insertion does not violate cold-start because inserted text is visible in the composer before send.

### Risks

- If overexposed, users may treat playbooks as answer keys.
- Playbook metadata must not become hidden prompt context.

## Phase 4: Cost And Budget Guardrails

Priority: P1

### Objective

Make model usage financially safe under the founder budget:

- monthly cap: KRW 200,000,
- event cap: KRW 100,000,
- preference: cheap/free providers.

### Tasks

1. Add provider/model pricing config.
2. Store estimated cost per model run where token usage is available.
3. If token usage is missing, store `unknown` explicitly.
4. Show attempt-level estimated cost in expert/admin surfaces.
5. Add server-side soft guardrails:
   - max input chars,
   - max attachment bytes,
   - max trace turns,
   - provider/model allowlist.
6. Add founder-only budget review note in docs.

### Done Criteria

- Every live attempt has a cost estimate or explicit unknown marker.
- Cost is visible enough for founder review but not distracting for beginner mode.

### Risks

- Provider pricing changes; this must be documented as approximate.
- Image models and multimodal calls may have different billing units.

## Phase 5: Deployment And Supabase Hardening

Priority: P1

### Objective

Move from local demo to deployable 10-person smoke test.

### Tasks

1. Verify Supabase migrations in a fresh project.
2. Review RLS policies against real flows:
   - own attempts,
   - published attempts,
   - comments,
   - branch children,
   - score reports.
3. Create Vercel environment checklist.
4. Test Google login in deployed callback URL.
5. Confirm local fallback does not mask Supabase write failures in deployed mode.
6. Add simple error surfaces for failed save, failed judge, failed publish.

### Done Criteria

- Deployed app supports login, solve, submit, share, comment.
- Founder can identify whether data came from Supabase or local fallback.

### Risks

- Auth callback mismatch.
- RLS too strict causing silent save failures.
- RLS too loose exposing private traces.

## Phase 6: Admin Problem Authoring MVP

Priority: P2

### Objective

Enable new demo problems without code edits.

### MVP Fields

- problem title,
- scenario,
- user goal,
- constraints,
- deliverables,
- available materials,
- extracted material text,
- public rubric,
- hidden judge notes if needed,
- playbook steps.

### Tasks

1. Define problem authoring data shape.
2. Add admin UI for create/edit.
3. Add material upload or material text paste.
4. Add rubric preview.
5. Generate a playbook stub from the problem form.
6. Keep code-based seed problems as fallback.

### Done Criteria

- A new problem can be created and solved without editing `data/problems.ts`.
- The problem has a matching playbook.

### Risks

- Admin UI can consume too much time before smoke evidence exists.
- Material parsing can expand scope quickly; extracted text paste is enough for MVP.

## Phase 7: Branch Tree Explorer

Priority: P2

### Objective

Turn GDB-like breakpoint replay into an explorable learning object.

### Tasks

1. Show parent attempt and child branches in one lineage view.
2. Mark breakpoint event, replacement prompt, and score delta.
3. Allow comparing multiple child branches from the same parent.
4. Connect branch lineage to existing 3D dual graph without changing the graph's core model.

### Done Criteria

- One parent attempt with two child branches can be explored.
- User can answer: "Which prompt change fixed the bottleneck?"

### Risks

- Branch tree can become visually complex.
- It must remain a learning tool, not a debug visualization for its own sake.

## Phase 8: Founder Review Dashboard

Priority: P2

### Objective

Make the first 10-person smoke test analyzable.

### Tasks

1. Add admin/founder list of all attempts.
2. Filter by problem, model, mode, submitted/published, judge mode.
3. Show trace count, material use, branch count, score report status.
4. Add founder note field per attempt.
5. Export attempt summary JSON/CSV for offline analysis.

### Done Criteria

- Founder can review all smoke attempts without opening database tables manually.
- Qualitative observations are stored next to attempts.

### Risks

- This can turn into analytics dashboard scope creep.
- Keep it review-first, not metrics-heavy.

## Phase 9: Privacy, Sharing, And Community Baseline

Priority: P3

### Objective

Make sharing valuable but controlled.

### Tasks

1. Add publish options:
   - workflow only,
   - summarized prompts,
   - full raw transcript.
2. Add visible warning before publishing raw trace.
3. Add edit/delete comment behavior.
4. Add simple report/hide moderation stub.
5. Preserve the principle that sharing unlocks learning from other traces.

### Done Criteria

- A non-technical user can understand what will be visible before publishing.
- Prompt-level discussion remains possible.

### Risks

- Over-sharing can destroy trust.
- Too much privacy UI can slow down the demo.

## Phase 10: Multi-AI And Harness Mode Design Only

Priority: later

### Objective

Prepare the next horizon without implementing it too early.

### Tasks

1. Write a design doc for multi-AI solving mode.
2. Define how task assignment differs from single-model mode.
3. Decide whether each sub-task gets:
   - same model,
   - different model,
   - tool call,
   - human task.
4. Define how trace graph represents multiple model agents.
5. Do not expose this in the first smoke unless the single-model loop is proven.

### Done Criteria

- A future implementation path exists.
- Current demo remains simple.

### Risks

- Multi-AI mode is philosophically aligned but implementation-heavy.
- It can obscure the first lesson: problem structuring and verification matter even with one model.

## Immediate Next 12 Tasks

1. Update `docs/000_orchestration.md` with the new post-graph roadmap reference.
2. Add a small live provider smoke log document template.
3. Run Gemini live attempt on `ambiguous-research-brief`.
4. Run Gemini live attempt with materials on `club-budget-workflow`.
5. Run Groq text-only attempt on `ambiguous-research-brief`.
6. Submit all three attempts with heuristic judge.
7. Submit the same attempts with LLM judge if key/config is available.
8. Write calibration notes from founder judgment.
9. Add playbook prompt insertion to reduce smoke friction.
10. Add cost estimate config and attempt-level cost display for admin/expert surfaces.
11. Validate Supabase migrations/RLS in a clean project.
12. Prepare deployed Vercel/Supabase smoke checklist.

## Decision Gates

### Gate A: First Live User Model

Choose after smoke:

- Gemini as first default if multimodal/material handling is materially better.
- Groq as first default if latency/cost is overwhelmingly better for text-only beginner problems.
- xAI if Grok is cheap enough and quality is clearly better.

Do not decide based on brand preference. Decide from SKAI trace evidence.

### Gate B: First Judge Mode

Choose after golden attempts:

- heuristic if LLM judge is unstable or too expensive,
- LLM if it gives clearly better bottleneck/process feedback,
- ensemble if disagreement itself is useful and cost is acceptable.

### Gate C: First Smoke Problem

Best current candidate:

- `ambiguous-research-brief` for beginner-friendly problem framing.

Second candidate:

- `club-budget-workflow` because materials make SKAI's real-world context thesis visible.

### Gate D: Public Sharing Default

Until smoke evidence says otherwise:

- default to structured workflow plus summarized prompts,
- raw transcript expandable and publish-gated.

### Gate E: Admin Authoring Timing

Build after live/judge smoke, not before, unless the AX seminar needs custom problems immediately.

## Anti-Goals For The Next Phase

- Do not build a generic chat app with nicer scoring.
- Do not make model switching the main product.
- Do not turn the graph into a decorative visualization.
- Do not overfit the demo to university-student use cases.
- Do not create certification or HR-grade anti-cheat before learning-mode judge quality is proven.
- Do not hide judge uncertainty.
- Do not let local/mock success stand in for live-provider proof.

## Success Definition For The Next Milestone

The next milestone is complete when:

1. A real user can solve one problem with a live model.
2. SKAI captures the trace without hidden context.
3. The graph shows the user's orchestration flow.
4. The user submits and receives a useful coach report.
5. The user branches from one bottleneck and sees a meaningful comparison.
6. Founder can review the logs and say whether the framework is teaching the intended skill.

This is the first credible SKAI demo. Everything else is expansion.

## Verification Plan

For every implementation task derived from this roadmap:

- run `conda run -n SKAI npm run typecheck`,
- run `conda run -n SKAI npm run lint`,
- run `conda run -n SKAI npm run build` when route/component behavior changes,
- run at least one browser smoke path when UI changes,
- update `docs/000_orchestration.md` when state/gaps/queue change,
- perform the end-of-task philosophy check.

## Philosophy Check

This roadmap keeps the project pointed at SKAI's core claim. The next work is not adding flashier AI features; it is proving that a real user can solve an unclear problem, leave a structured trace, get process-aware feedback, branch from a bottleneck, and learn from the difference.

The main watchpoint is provider/model enthusiasm. SKAI should use providers as engines, not become a provider comparison site. The second watchpoint is judge overconfidence: if feedback is uncertain, the product should say so and use disagreement as a learning signal.
