# ambiguous-research-brief Prompt Playbook

Problem: 흐릿한 자료조사 요청을 실행 가능한 리서치 브리프로 바꾸기

Recommended mode/model:

- Mode: Single Model or Verification Drill
- Model: Gemini Flash-Lite for live smoke, SKAI Mock for no-key demo
- Attachments: none

## Turn 1

Paste into the prompt composer:

```text
상황을 먼저 설명할게.

지인이 "요즘 생성형 AI가 교육에 미치는 영향 좀 조사해줘. 발표에 쓸 거야."라고만 부탁했다. 나는 이걸 바로 검색/요약하는 게 아니라, 발표용 리서치 브리프를 만들기 전에 문제를 먼저 잘 정의하고 싶다.

우선 수많은 교육 분야 중에서 이 발표에 적합한 세부 분야를 추천해줘. 단, 바로 하나만 고르지 말고 다음 순서로 답해줘.

1. 먼저 이 요청에서 아직 불명확한 조건을 짚어줘.
2. 발표 주제로 삼을 만한 세부 분야 후보를 5개 제안해줘.
3. 각 후보를 "발표 흥미도", "자료 조사 가능성", "논쟁성", "AI 시대 역량과의 연결성", "검증 난이도" 기준으로 비교해줘.
4. 지금 정보만으로 가장 좋은 후보 1~2개를 추천하되, 어떤 조건이 바뀌면 추천이 달라지는지도 말해줘.

답변은 표와 짧은 해설로 정리해줘.
```

## Turn 2

Paste after reading the model response:

```text
좋아. 발표 대상은 대학생 또는 직장인 일반 청중이고, 발표 시간은 7분 정도라고 가정하자. 너무 교육학 이론만 깊게 들어가기보다는 "AI를 어떻게 써야 하는가"라는 실용적 메시지가 있어야 한다.

방금 후보 중에서 발표 주제로 가장 적합한 방향을 하나 고르고, 그 주제를 리서치 가능한 문제정의로 다시 써줘.

반드시 포함해줘.

- 최종 발표 주제 문장
- 이 주제가 좋은 이유
- 너무 넓거나 모호한 부분
- 조사 질문 3개
- 발표에서 피해야 할 성급한 주장
- 이 주제를 검증하기 위해 찾아야 할 출처 유형
```

## Turn 3

Paste after the model narrows the topic:

```text
이제 이 주제를 발표용 리서치 브리프로 만들기 위한 AI 작업 흐름을 설계해줘.

내가 직접 판단해야 하는 일과 AI에게 맡길 일을 분리하고 싶다. 아래 형식으로 정리해줘.

1. 내가 먼저 확정해야 할 조건
2. AI에게 줄 하위 task 목록
3. 각 task의 입력, 출력, 검증 기준
4. 중간 결과가 약할 때 수정 프롬프트 예시
5. 최종 브리프 구조

중요한 점: AI가 그럴듯하지만 근거 없는 말을 할 수 있으니, 검증 계획을 반드시 포함해줘.
```

## Turn 4

Paste for final synthesis:

```text
좋아. 지금까지 정리한 내용을 바탕으로 발표 준비에 쓸 수 있는 리서치 브리프 초안을 만들어줘.

형식은 다음과 같이 해줘.

## 정제된 문제정의
## 조사 질문
## 핵심 주장 후보
## 발표 구조
## AI에게 배분할 하위 task
## 검증할 출처 유형
## 남은 가정과 한계
## 다음에 내가 해야 할 일

단, 확정된 사실과 아직 검증이 필요한 가정을 명확히 구분해줘.
```

## Optional Final Answer Field Draft

Use this as a starting point for the SKAI final answer field after the conversation:

```text
이번 풀이에서는 "생성형 AI가 교육에 미치는 영향"이라는 넓은 요청을 바로 요약하지 않고, 발표 대상과 시간, 실용적 메시지 여부를 기준으로 세부 주제를 좁혔다. 먼저 불명확한 조건을 확인하고, 후보 분야를 비교한 뒤, 최종 발표 주제를 리서치 가능한 문제정의와 조사 질문으로 재구성했다.

AI에게는 후보 비교, 문제정의 재작성, 하위 task 설계, 브리프 초안 생성을 맡겼고, 사용자는 발표 목적과 청중 적합성, 최종 주장 채택, 검증 기준을 판단하는 역할로 분리했다.

최종 산출물은 정제된 문제정의, 조사 질문, 핵심 주장 후보, 발표 구조, 검증할 출처 유형, 남은 가정과 한계로 구성된다. 특히 확정된 사실과 검증 필요 가정을 분리하고, 최신 사례나 연구를 확인해야 하는 지점을 남겨 AI 환각 위험을 줄였다.
```

## Smoke Notes

- Good trace: asks for ambiguity, narrows topic, designs tasks, includes verification.
- Weak trace: asks for a final report immediately without defining audience, scope, or source types.
