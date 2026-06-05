# 096 Independent Gemini Judge Provider

## 목적

Judge/coaching 강화를 시작하기 전에 LLM judge 실행 경로를 사용자 풀이용 모델 선택과 완전히 분리한다.

사용자 풀이 모델은 사용자가 문제 시작 전에 고르는 실행 엔진이고, judge 모델은 SKAI가 trace와 `.skai` graph를 평가하기 위해 서버에서 독립적으로 호출하는 평가 엔진이다. 둘은 UI, env key, model config, 실패 처리에서 섞이면 안 된다.

## 범위

- Judge 전용 Gemini API key env를 추가한다.
- `SKAI_JUDGE_PROVIDER=gemini`일 때 judge는 `SKAI_JUDGE_GEMINI_API_KEY`를 우선 사용한다.
- 사용자 풀이용 Gemini key인 `GEMINI_API_KEY`는 `/api/chat` 경로에 그대로 남긴다.
- 기존 `SKAI_JUDGE_PROVIDER` / `SKAI_JUDGE_MODEL` / `SKAI_JUDGE_MODE` 구조는 유지한다.
- 배포 health와 deployment docs에 judge 전용 key를 반영한다.
- Judge prompt/result 품질 자체는 다음 slice에서 강화한다.

## 비범위

- 33개 문제 self-play runner 구현.
- 실패 패턴 fixture 대량 생성.
- LLM judge rubric prompt 전면 재작성.
- Vercel 환경변수 실제 설정.

## 설계

환경변수:

```bash
# 사용자 풀이용 Gemini
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash-lite

# judge 전용 Gemini
SKAI_JUDGE_MODE=llm
SKAI_JUDGE_PROVIDER=gemini
SKAI_JUDGE_MODEL=gemini-2.5-flash-lite
SKAI_JUDGE_GEMINI_API_KEY=
```

Key precedence:

```text
judge gemini key = SKAI_JUDGE_GEMINI_API_KEY
optional local-only fallback = GEMINI_API_KEY only when SKAI_ALLOW_JUDGE_GEMINI_KEY_FALLBACK=true and NODE_ENV is not production
chat gemini key = GEMINI_API_KEY
```

운영 원칙:

- Production에서는 `SKAI_JUDGE_GEMINI_API_KEY`를 넣어 judge billing/rate limit을 풀이용 key와 분리한다.
- Local development에서만 `SKAI_ALLOW_JUDGE_GEMINI_KEY_FALLBACK=true`를 명시하면 기존 `.env.local`의 `GEMINI_API_KEY`로 judge를 임시 테스트할 수 있다.
- Health check는 fallback 사용 여부를 명시하되 secret value는 절대 노출하지 않는다.

## 영향 파일

- `lib/providers/index.ts`
- `lib/judge.ts`
- `lib/deployment-health.ts`
- `docs/technical/013_supabase_deployment_checklist.md`
- `docs/technical/014_vercel_first_deployment_guide.md`
- `docs/000_orchestration.md`
- `docs/technical/000_decision_register.md`

## 검증

- `npm run verify:i18n`
- `conda run -n SKAI npm run typecheck`
- `conda run -n SKAI npm run lint`
- `conda run -n SKAI npm run build`
- `npm run verify:skai`

## 상태

- 구현 완료.

## 구현 결과

- 사용자 풀이용 Gemini provider는 기존대로 `GEMINI_API_KEY` / `GEMINI_MODEL`을 사용한다.
- LLM judge와 counterfactual judge는 `getJudgeProvider()`를 통해 judge 전용 provider를 사용한다.
- `SKAI_JUDGE_PROVIDER=gemini`일 때 judge 호출은 기본적으로 `SKAI_JUDGE_GEMINI_API_KEY`를 요구한다.
- `GEMINI_API_KEY` fallback은 `SKAI_ALLOW_JUDGE_GEMINI_KEY_FALLBACK=true`이고 `NODE_ENV !== "production"`인 경우에만 작동한다.
- Deployment health는 `GEMINI_API_KEY`가 있어도 judge 전용 key가 없으면 production judge 설정을 실패로 본다.
- Vercel/Supabase deployment 문서와 orchestration 문서에 key 분리 원칙을 반영했다.

## 다음 Slice

- `.skai fixture -> derived extension -> unified viewer overlay -> regression` 루프에 맞춰 LLM judge prompt/rubric 자체를 강화한다.
- 첫 강화 대상은 구조적 decomposition, material grounding, verification behavior, final artifact quality를 안정적으로 분리 평가하는 judge output schema와 prompt다.
