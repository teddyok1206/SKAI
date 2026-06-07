# SKAI Bulk Problem Generation Prompt

Date: 2026-06-02

Use this prompt with ChatGPT Pro or another strong model to generate SKAI problem packages in batches.

```text
너는 SKAI(Social Knowledge of AI)의 문제 출제 엔진이다.

SKAI는 백준/LeetCode처럼 문제를 푸는 플랫폼이지만, 코딩 알고리즘이 아니라 AI 시대의 문제정의, 세분화, 자료 활용, task 배분, 검증, 적응 능력을 훈련하고 평가하는 플랫폼이다.

중요한 철학:
- 좋은 AI 활용 능력은 단일 프롬프트를 잘 쓰는 능력이 아니라, 불명확한 현실 문제를 구조화하고 AI와의 대화 흐름을 설계하는 능력이다.
- 문제는 prompt trick이 아니라 현실적인 task여야 한다.
- 사용자는 cold-start 모델과 대화한다고 가정한다. 즉, 모델은 문제의 숨은 배경을 모른다.
- 사용자가 선택한 자료/파일만 모델 context에 들어간다.
- 정답 하나를 맞히는 것보다 문제정의, 세분화, task 분배, 자료 활용, 검증 흐름이 중요하다.
- 문제는 3D dual graph로 분석될 수 있어야 한다: user prompt 흐름, model response 흐름, task status 변화.

너의 목표:
SKAI에 넣을 수 있는 문제 패키지를 가능한 한 많이 생성하라. 단, 품질이 무너지지 않도록 이번 배치에서는 30개를 생성한다. 내가 "다음 배치"라고 하면 이전과 겹치지 않게 30개를 더 생성한다.

현재 SKAI app schema는 다음 필드를 사용한다.

Problem:
- id: kebab-case 영어 고유 id
- title: 한국어 제목
- subtitle: 한국어 부제
- category: workplace | research | creative | data_analysis | coding | strategy
- difficulty: intro | standard | advanced
- goalProfile: accuracy_first | speed_first | cost_constrained | workflow_adoption | learning_oriented | exploration
- estimatedMinutes: number
- statement: 문제 설명
- userGoal: 사용자의 목표
- constraints: string[]
- starterContext: string[]
- deliverables: string[]
- materials: ProblemMaterial[]
- allowedProviders: ["mock", "groq", "xai", "openai", "openrouter", "gemini"]
- rubricKey: "defaultRubric"
- createdAt: ISO string

ProblemMaterial:
- id
- title
- description
- kind: image | spreadsheet | csv | text | pdf | other
- fileName
- mimeType
- href
- extractedText

각 문제에는 추가로 아래 확장 메타데이터도 포함하라. 이건 나중에 분류/검색/연구용으로 쓸 것이다.

classification:
- domain
- subdomain
- primarySkill: problem_definition | decomposition | material_grounding | verification | adaptation | cost_control | workflow_design | stakeholder_alignment
- secondarySkills: string[]
- materialProfile: string[]
- ambiguityLevel: low | medium | high
- externalKnowledgeNeed: none | low | medium | high
- expectedTurns: number
- primaryFailureMode: 사용자가 실패하기 쉬운 방식
- idealBottleneck: breakpoint/replay로 비교하면 좋은 지점
- graphPattern: 이 문제에서 기대되는 prompt-response-status 흐름 요약

playbook:
각 문제마다 SKAI 운영자가 smoke test에 쓸 수 있는 paste-ready prompt playbook을 작성하라.
반드시 포함:
- operatorSmokeMode
- operatorSmokeModel
- attachments
- Turn 1
- Turn 2
- Turn 3
- Turn 4
- Optional Final Answer Field Draft
- Smoke Notes
- Weak Trace Pattern
- Good Trace Pattern

문제 설계 조건:
1. 분야는 매우 다양해야 한다.
   예시: 교육, 업무 자동화, 회계/정산, 제품 기획, 데이터 분석, 리서치, 콘텐츠 제작, 회의록 정리, 행사 운영, 고객 VOC 분석, 채용, 시민 정책, 비영리단체, 개인 일정, 학습 계획, 코딩 디버깅, 문서 검토, 커뮤니티 운영, 위기 대응, 마케팅, UX 리서치 등.

2. 난이도도 다양해야 한다.
   - intro: 자료가 없거나 1개, 모호한 요청을 구조화하는 데 집중
   - standard: 자료 2~3개, 일부 충돌/누락/제약 존재
   - advanced: 자료 3~5개, 이해관계자 충돌, 비용/시간/검증 제약, counterfactual branch가 의미 있음

3. 각 문제는 AI와 최소 3~4턴 이상 대화할 이유가 있어야 한다.
   단번에 최종 답을 요구하면 약한 풀이가 되도록 설계하라.

4. 자료가 있는 문제는 실제 파일처럼 보이는 synthetic material을 포함하라.
   예:
   - 영수증 이미지 OCR
   - 회의록 txt
   - 고객 리뷰 csv
   - 정산 xlsx 추출 텍스트
   - 정책 PDF 발췌
   - 이메일 thread
   - 슬랙/카톡 스타일 로그
   - 버그 리포트
   - 설문 결과표

5. 개인정보는 절대 실제처럼 민감하게 만들지 말라.
   이름은 가명, 전화번호/주소/계좌번호/API key는 금지하거나 마스킹하라.

6. 법률/의료/금융 문제는 고위험 조언이 아니라 정보 구조화, 체크리스트, 전문가 상담 전 준비자료 수준으로 제한하라.

7. 각 문제는 SKAI의 평가축과 연결되어야 한다:
   - problem_definition
   - decomposition
   - instruction_clarity
   - adaptation
   - verification
   - efficiency
   - final_quality

8. 모델 선택과 풀이 모드는 독립적이어야 한다.
   특정 모델을 특정 문제 유형과 본질적으로 묶지 말라.

9. 문제는 한국어 사용자에게 자연스러워야 하지만, 글로벌 확장 가능한 구조여야 한다.

출력 형식:
JSON으로 출력하라. markdown code fence는 쓰지 말라.
최상위 구조는 다음과 같이 하라.

{
  "batchId": "skai-problem-batch-001",
  "createdAt": "2026-06-02T00:00:00.000Z",
  "coveragePlan": {
    "targetCount": 30,
    "categoryCoverage": {},
    "difficultyCoverage": {},
    "goalProfileCoverage": {}
  },
  "problems": [
    {
      "appProblem": {
        "id": "",
        "title": "",
        "subtitle": "",
        "category": "",
        "difficulty": "",
        "goalProfile": "",
        "estimatedMinutes": 0,
        "statement": "",
        "userGoal": "",
        "constraints": [],
        "starterContext": [],
        "deliverables": [],
        "materials": [],
        "allowedProviders": ["mock", "groq", "xai", "openai", "openrouter", "gemini"],
        "rubricKey": "defaultRubric",
        "createdAt": "2026-06-02T00:00:00.000Z"
      },
      "classification": {
        "domain": "",
        "subdomain": "",
        "primarySkill": "",
        "secondarySkills": [],
        "materialProfile": [],
        "ambiguityLevel": "",
        "externalKnowledgeNeed": "",
        "expectedTurns": 4,
        "primaryFailureMode": "",
        "idealBottleneck": "",
        "graphPattern": ""
      },
      "playbook": {
        "operatorSmokeMode": "",
        "operatorSmokeModel": "",
        "attachments": [],
        "turns": [
          {
            "turn": 1,
            "attachMaterialIds": [],
            "prompt": ""
          },
          {
            "turn": 2,
            "attachMaterialIds": [],
            "prompt": ""
          },
          {
            "turn": 3,
            "attachMaterialIds": [],
            "prompt": ""
          },
          {
            "turn": 4,
            "attachMaterialIds": [],
            "prompt": ""
          }
        ],
        "optionalFinalAnswerFieldDraft": "",
        "smokeNotes": [],
        "weakTracePattern": "",
        "goodTracePattern": ""
      }
    }
  ],
  "coverageSummary": {
    "categories": {},
    "difficulties": {},
    "goalProfiles": {},
    "materialKinds": {},
    "domains": []
  },
  "nextBatchStrategy": "다음 배치에서 중복을 피하기 위한 방향"
}

품질 기준:
- 각 문제의 statement는 현실적이어야 한다.
- materials.extractedText는 실제 파일을 파싱한 것처럼 충분히 구체적이어야 한다.
- playbook Turn 1은 cold-start 모델에게 필요한 상황을 사용자가 직접 설명하는 형태여야 한다.
- Turn 1에서 바로 최종 결과물을 요구하지 말고, 문제 정의/불확실성/자료 확인/작업 분해 중 하나를 먼저 하게 만들어라.
- Good Trace Pattern과 Weak Trace Pattern은 judge calibration에 쓸 수 있을 정도로 구체적으로 써라.
- 같은 도메인, 같은 실패 패턴, 같은 자료 구조가 반복되지 않게 하라.

이제 30개를 생성하라.
```

## Follow-Up Prompt

Use this after one batch is complete:

```text
다음 배치. 이전 batchId와 id/domain/material pattern 중복 피해서 30개 더.
```
