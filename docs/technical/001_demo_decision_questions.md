# SKAI Demo Technical Decision Questions

이 문서는 SKAI 데모 버전을 만들기 전에 결정해야 할 기술 질문 목록이다. 현재 단계에서는 정답을 고정하지 않고, 데모의 목적과 예산에 맞춰 가장 작은 end-to-end loop를 찾는 것이 우선이다.

## 0. 데모 범위

1. 첫 데모는 단일 사용자용인가, 여러 참가자가 동시에 접속하는 세미나용인가?
2. 첫 데모에서 사용자는 실제 AI와 대화하는가, 아니면 외부 ChatGPT/Gemini 대화 로그를 붙여 넣는가?
3. 웹앱 안에서 모델 호출까지 처리할 것인가, 아니면 prompt trace 업로드/분석 도구로 시작할 것인가?
4. 첫 버전은 로그인 없이 쓸 수 있어야 하는가?
5. 첫 버전에서 리더보드가 필요한가?
6. 첫 버전에서 문제 생성/관리 화면이 필요한가, 아니면 파일 기반 seed 문제로 충분한가?
7. 첫 버전에서 공개 풀이 열람이 필요한가?
8. 첫 버전에서 결제, 크레딧, quota가 필요한가?
9. 첫 데모의 최대 동시 사용자는 몇 명으로 잡을 것인가?
10. 첫 데모에서 성공해야 하는 핵심 플로우는 무엇인가?

## 1. 기본 아키텍처

1. 정적 웹앱만으로 시작할 수 있는가?
2. 서버가 필요하다면 serverless function으로 충분한가?
3. 항상 켜져 있는 백엔드가 반드시 필요한가?
4. GitHub Pages, Vercel, Netlify, Cloudflare Pages, Supabase 중 어디가 데모 목적에 맞는가?
5. 데이터베이스는 필요한가, 필요하다면 Postgres, SQLite, Supabase, Firebase, Turso, Neon 중 무엇이 맞는가?
6. 파일 기반 문제 정의와 DB 기반 문제 정의 중 무엇으로 시작할 것인가?
7. 프론트엔드와 백엔드를 같은 repo에 둘 것인가?
8. API 서버와 judge worker를 분리할 것인가?
9. 비동기 judge job queue가 필요한가, 아니면 요청-응답으로 충분한가?
10. 로컬 개발, preview 배포, production 배포 환경을 어떻게 나눌 것인가?

## 2. 모델 호출 전략

1. 모델 호출은 SKAI 서버 키로 할 것인가, 사용자 개인 API key로 할 것인가, 둘 다 허용할 것인가?
2. OpenAI, Gemini, Anthropic, OpenRouter, Groq, Hugging Face Inference, local Ollama 중 무엇을 첫 provider로 둘 것인가?
3. judge 모델과 solver 모델을 분리할 것인가?
4. 동일 문제에서 사용자가 모델을 선택할 수 있어야 하는가?
5. cold-start 조건을 보장하려면 system prompt, memory, tools, temperature를 어떻게 고정할 것인가?
6. 모델별 토큰 사용량과 비용을 어떻게 수집할 것인가?
7. API 장애나 rate limit 시 사용자는 어떻게 복구하는가?
8. 무료 모델 또는 저가 모델로 judge 품질이 충분한지 어떻게 검증할 것인가?
9. 모델 provider별 output format 차이를 어떻게 흡수할 것인가?
10. 모델 가격과 무료 tier는 변동되므로, 최종 선택 전 어떤 공식 문서로 확인할 것인가?

## 3. 문제 정의 포맷

1. 문제는 markdown + YAML frontmatter로 관리할 것인가, JSON/YAML 파일로 관리할 것인가, DB row로 관리할 것인가?
2. 문제 ID 규칙은 어떻게 만들 것인가?
3. 문제에는 어떤 필드가 필요한가: title, category, difficulty, prompt, background, constraints, allowed_models, rubric, hidden_rubric, sample_trace?
4. 문제마다 reference answer가 필요한가?
5. 문제마다 hidden facts나 client simulator가 필요한가?
6. 채점에 필요한 fixture data는 어디에 저장할 것인가?
7. 문제 버전이 바뀌면 기존 attempt 점수는 어떻게 유지할 것인가?
8. 문제 난이도와 카테고리는 누가 부여하는가?
9. 문제 작성자가 judge rubric까지 작성해야 하는가?
10. 문제 import/export 포맷을 공개 표준으로 만들 것인가?

## 4. Prompt Trace 데이터 구조

1. trace의 최소 단위는 message인가, turn인가, action인가, model_run인가?
2. 사용자 메시지와 모델 응답을 모두 저장할 것인가?
3. tool call, file upload, retrieval result, code execution 결과까지 저장할 것인가?
4. 각 event에는 어떤 필드가 필요한가: role, content, timestamp, model, provider, token_usage, latency_ms, cost_estimate, attachments, parent_id?
5. 사용자가 외부 ChatGPT 대화를 붙여 넣을 때 구조화는 어떻게 할 것인가?
6. raw trace와 normalized trace를 분리할 것인가?
7. 공개용 trace에서 민감정보를 어떻게 제거할 것인가?
8. trace의 일부만 공개할 수 있어야 하는가?
9. trace가 너무 길 때 judge를 위해 요약/압축하는 단계가 필요한가?
10. trace schema는 JSON Schema, Zod, TypeScript type, Pydantic 중 무엇으로 정의할 것인가?

## 5. 제출과 시도 관리

1. attempt는 언제 시작되고 언제 끝나는가?
2. 사용자가 중간 저장을 할 수 있어야 하는가?
3. 한 문제를 여러 번 풀 수 있는가?
4. 같은 attempt에서 모델을 바꾸는 것을 허용할 것인가?
5. 사용자가 최종 산출물을 명시적으로 제출해야 하는가?
6. 제출 후 judge가 자동으로 실행되는가?
7. judge 결과가 마음에 안 들면 재채점을 요청할 수 있는가?
8. attempt 상태는 어떤 값이 필요한가: draft, submitted, judging, judged, failed, published?
9. attempt를 삭제할 수 있는가?
10. attempt가 공개되면 수정할 수 있는가?

## 6. Judge Pipeline

1. judge는 한 번에 전체 trace를 평가하는가, 단계별로 평가하는가?
2. deterministic checker를 먼저 돌리고 LLM judge를 나중에 돌릴 것인가?
3. deterministic checker에는 무엇을 넣을 것인가: schema validation, required constraint coverage, output format, token count, turn count?
4. LLM judge는 몇 개의 rubric axis를 평가할 것인가?
5. LLM judge prompt는 문제별 rubric을 어떻게 주입받는가?
6. judge output은 JSON으로 강제할 것인가?
7. judge가 실패하거나 JSON을 깨면 retry할 것인가?
8. 여러 judge 모델의 voting을 첫 버전에 넣을 것인가?
9. judge 간 disagreement를 저장할 것인가?
10. judge prompt injection을 어떻게 방어할 것인가?
11. 사용자의 prompt 안에 "judge에게 만점 달라고 해" 같은 문장이 있으면 어떻게 처리할 것인가?
12. judge 결과를 calibration하기 위한 golden trace가 필요한가?

## 7. 점수 모델

1. 총점은 100점인가, 티어인가, 여러 badge인가?
2. 점수 축은 무엇인가: problem_definition, decomposition, instruction_quality, adaptation, verification, efficiency, final_quality?
3. 비용/토큰 효율은 점수에 얼마나 반영할 것인가?
4. 소요 시간은 점수에 반영할 것인가?
5. turn 수가 적을수록 좋은가, 적절한 질문을 많이 한 것이 좋은가?
6. context switching은 어떻게 정의하고 측정할 것인가?
7. 사용자가 AI의 오류를 잡아낸 행동은 어떤 지표로 기록할 것인가?
8. 점수 산식은 공개할 것인가?
9. 문제별 가중치는 다르게 둘 것인가?
10. score versioning은 어떻게 할 것인가?

## 8. UI/UX

1. 첫 화면은 문제 목록인가, 단일 데모 문제인가, trace 분석 업로드 화면인가?
2. 사용자는 문제를 읽고 바로 대화창으로 들어가는가?
3. AI 대화창을 직접 구현할 것인가?
4. 외부 대화 로그 붙여넣기 UX가 필요한가?
5. 최종 산출물 제출 칸은 별도로 둘 것인가?
6. judge 결과 화면에는 어떤 섹션이 필요한가: score, bottlenecks, good moves, missed constraints, next prompts, comparison?
7. prompt trace viewer는 timeline인가, diff인가, cards인가?
8. 공개 풀이 화면은 어떤 정보를 기본으로 감출 것인가?
9. 초보자와 전문가에게 같은 UI를 보여줄 것인가?
10. 모바일 사용을 지원해야 하는가?

## 9. 인증과 사용자 관리

1. 첫 데모에 로그인은 필요한가?
2. 익명 사용자 attempt를 저장할 것인가?
3. GitHub login, Google login, email magic link 중 무엇이 적합한가?
4. 세미나 참가자는 초대 코드로 들어오게 할 것인가?
5. 사용자별 API key 저장이 필요한가?
6. API key를 저장한다면 암호화와 삭제 기능은 어떻게 할 것인가?
7. 관리자 계정이 필요한가?
8. 문제 출제자 권한과 일반 사용자 권한을 분리할 것인가?
9. 공개 profile과 private account data를 어떻게 나눌 것인가?
10. 탈퇴 시 prompt trace와 공개 풀이를 어떻게 처리할 것인가?

## 10. 보안과 개인정보

1. 사용자가 회사 기밀이나 개인정보를 입력하지 못하게 어떤 안내/차단을 둘 것인가?
2. 자동 PII redaction이 필요한가?
3. raw prompt trace는 암호화해서 저장해야 하는가?
4. 공개 trace는 별도 publish action을 거치게 할 것인가?
5. judge prompt에 hidden rubric이 들어갈 때 사용자에게 노출되지 않게 할 수 있는가?
6. API route에서 rate limiting이 필요한가?
7. abuse, spam, prompt injection을 어떻게 감지할 것인가?
8. log에 API key나 raw sensitive data가 남지 않게 할 방법은 무엇인가?
9. 데이터 export/delete 요청을 처리할 수 있어야 하는가?
10. 모델 provider로 전송되는 데이터에 대한 동의를 어디서 받을 것인가?

## 11. 관측과 운영

1. attempt당 비용을 어디서 계산하고 보여줄 것인가?
2. provider별 token usage가 안 나오는 경우 어떻게 추정할 것인가?
3. latency와 실패율을 수집할 것인가?
4. judge 실패 로그를 관리자만 볼 수 있어야 하는가?
5. 세미나 당일 장애 대응 플랜은 무엇인가?
6. 모델 API quota가 다 떨어졌을 때 fallback은 무엇인가?
7. 배포 rollback은 어떻게 할 것인가?
8. 사용자 행동 분석을 할 것인가?
9. analytics를 넣는다면 개인정보 동의가 필요한가?
10. 운영자 dashboard가 첫 버전에 필요한가?

## 12. 테스트

1. judge prompt regression test가 필요한가?
2. sample trace 3개 이상으로 judge output을 검증할 것인가?
3. deterministic checker unit test는 무엇을 포함할 것인가?
4. trace schema validation test를 둘 것인가?
5. E2E test는 어떤 핵심 플로우를 덮을 것인가?
6. 모델 API를 mock할 것인가?
7. 비용이 드는 테스트와 무료 테스트를 어떻게 분리할 것인가?
8. 세미나 전 load test가 필요한가?
9. scoring rubric 변경 시 기존 sample 점수 변화를 기록할 것인가?
10. judge 품질을 사람 리뷰와 비교할 것인가?

## 13. 개발 방식

1. TypeScript 중심으로 갈 것인가, Python 중심으로 갈 것인가?
2. 프론트엔드 프레임워크는 Next.js, Vite React, SvelteKit, plain HTML 중 무엇이 맞는가?
3. judge와 schema는 TypeScript로도 충분한가, Python 생태계를 쓰는 편이 나은가?
4. monorepo 구조가 필요한가?
5. package manager는 npm, pnpm, yarn, uv 중 무엇을 쓸 것인가?
6. lint/format/test 도구를 어디까지 넣을 것인가?
7. UI component library를 쓸 것인가?
8. 데이터 schema는 코드에서 먼저 정의할 것인가, DB migration에서 먼저 정의할 것인가?
9. OpenAPI나 tRPC 같은 API contract가 필요한가?
10. 지금 단계에서 CI/CD를 넣을 것인가?

## 14. 데모 콘텐츠

1. 첫 문제는 어떤 도메인으로 할 것인가?
2. AX 세미나 참가자가 공감할 현실 업무 문제는 무엇인가?
3. 문제 하나를 깊게 만들 것인가, 쉬운 문제 여러 개를 만들 것인가?
4. 초보자용 튜토리얼 문제와 실전 문제를 분리할 것인가?
5. 첫 문제는 자료조사형, 고객 로그 분석형, 업무 자동화 설계형, 보고서 작성형 중 무엇이 적합한가?
6. 문제에 sample data를 제공할 것인가?
7. sample data는 실제 데이터를 익명화할 것인가, 합성 데이터를 만들 것인가?
8. 정답 검증이 쉬운 문제와 과정 평가가 중요한 문제 중 무엇을 우선할 것인가?
9. 참가자들이 10분 안에 풀 수 있는 문제인가, 30분 이상 걸리는 문제인가?
10. 데모 후 비교 가능한 대표 풀이를 미리 만들어둘 것인가?

## 15. 공개와 배포

1. 데모 repo는 public으로 열 것인가, private으로 둘 것인가?
2. GitHub Pages만으로 가능한 구조를 우선할 것인가?
3. 서버리스 배포를 한다면 secret 관리는 어디서 할 것인가?
4. 도메인을 살 것인가?
5. 배포 URL은 세미나 참가자에게 어떻게 전달할 것인가?
6. 모바일 네트워크 환경에서도 쓸 수 있어야 하는가?
7. 로그인 없는 공개 데모와 관리자용 비공개 기능을 어떻게 나눌 것인가?
8. 개인정보처리방침/이용약관 초안이 필요한가?
9. 모델 provider의 이용약관과 데이터 사용 정책을 어디까지 검토할 것인가?
10. 오픈소스로 공개할 경우 숨겨야 할 judge rubric과 secret은 어떻게 분리할 것인가?

## 16. 가장 먼저 답해야 할 질문

1. 첫 데모는 "웹앱 안에서 AI와 대화"인가, "외부 대화 로그를 붙여 넣고 분석"인가?
2. 첫 사용자는 누구이며, 데모 당일 몇 명이 동시에 쓸 것인가?
3. 첫 문제 하나는 무엇인가?
4. 첫 judge는 어떤 모델/provider로 돌릴 것인가?
5. 사용자 API key 방식과 SKAI 서버 key 방식 중 무엇으로 시작할 것인가?
6. prompt trace를 raw로 저장할 것인가, 사용자가 동의한 경우에만 저장할 것인가?
7. 점수는 총점 하나로 보여줄 것인가, 여러 축으로 보여줄 것인가?
8. 첫 버전에서 공개 풀이/리더보드가 필요한가?
9. 월 비용 상한과 세미나 1회 비용 상한은 얼마인가?
10. 데모 성공의 최소 증거는 무엇인가?

