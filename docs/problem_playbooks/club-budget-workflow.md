# club-budget-workflow Prompt Playbook

Problem: 동아리 예산 혼란을 AI 업무흐름으로 정리하기

Recommended mode/model:

- Mode: Material Grounded
- Model: Gemini Flash-Lite for image/material smoke, SKAI Mock for no-key demo
- Attachments: use all three official materials during Turn 1

## Turn 1

Before sending, attach these materials from the side panel:

- `receipt-001`: 영수증 사진: 문구점 소모품
- `transfers-001`: 계좌이체 내역: 5월 행사
- `signup-001`: 구글폼 신청 내역 CSV

Paste into the prompt composer:

```text
상황을 설명할게. 동아리 회계 담당자가 5월 행사 정산을 해야 하는데, 영수증 사진, 계좌이체 내역, 구글폼 신청 내역이 뒤섞여 있다. 나는 AI를 써서 담당자가 반복적으로 따라 할 수 있는 정산 workflow를 만들고 싶다.

첨부한 자료 3개를 확인한 뒤, 바로 최종 정산표를 만들기보다 먼저 업무를 구조화해줘.

다음 형식으로 답해줘.

1. 첨부 자료별로 확인 가능한 사실
2. 아직 불확실하거나 사람이 확인해야 할 정보
3. 정산 업무를 하위 task로 나눈 목록
4. AI에게 맡길 수 있는 일과 사람이 직접 검토해야 하는 일
5. 지금 단계에서 만들면 좋은 데이터 구조

주의: 개인정보나 계좌정보처럼 민감할 수 있는 항목은 처리 주의사항을 따로 표시해줘.
```

## Turn 2

Paste after the model identifies facts and gaps:

```text
좋아. 이제 실제 담당자가 따라 할 수 있는 정산 workflow를 설계해줘.

조건은 다음과 같아.

- 담당자는 개발자가 아니다.
- 설치 없이 문서와 AI 대화만으로 따라 할 수 있어야 한다.
- 영수증, 계좌이체, 신청 내역의 대조 기준이 필요하다.
- 누락, 중복, 이름 불일치, 영수증 없음 같은 실패 시나리오를 다뤄야 한다.

아래 형식으로 정리해줘.

## 전체 workflow
## 단계별 입력 자료
## 단계별 AI task
## 단계별 사람 검토 지점
## 실패 시나리오와 대응책
## 반복 운영 체크리스트
```

## Turn 3

Paste to force a reusable operating template:

```text
이 workflow를 실제 운영 문서로 바꾸고 싶다.

다음 산출물을 만들어줘.

1. 정산 담당자가 매 행사마다 복사해서 쓸 수 있는 체크리스트
2. AI에게 붙여넣을 표준 프롬프트 템플릿
3. 자료 대조용 표 템플릿
4. 사람이 최종 승인하기 전에 확인해야 할 위험 항목

표 템플릿에는 최소한 날짜, 자료 출처, 거래/신청자명, 금액, 증빙 여부, 대조 상태, 사람 검토 메모가 들어가게 해줘.
```

## Turn 4

Paste for final synthesis:

```text
지금까지 만든 내용을 바탕으로 최종 제출용 답안을 정리해줘.

반드시 포함할 것:

- 업무 분해도
- AI task 분배안
- 사람 검토 지점
- 운영 체크리스트
- 실패 시나리오 대응책
- 첨부 자료에서 확인된 사실과 아직 확인이 필요한 가정의 구분

답변은 실제 동아리 담당자에게 전달할 수 있을 정도로 간결하지만 실행 가능하게 작성해줘.
```

## Optional Final Answer Field Draft

```text
이번 풀이에서는 영수증 사진, 계좌이체 내역, 구글폼 신청 내역을 각각 독립 자료로 보고, 먼저 확인 가능한 사실과 불확실한 정보를 분리했다. AI에게는 자료 요약, 대조 기준 설계, 체크리스트 초안, 실패 시나리오 정리를 맡기고, 사람에게는 구매자 확인, 영수증 없는 지출 승인, 개인정보 처리, 최종 지급/환불 판단을 남겼다.

정산 workflow는 자료 수집, 표준 필드 정리, 영수증-이체-신청 내역 대조, 예외 항목 표시, 사람 검토, 최종 보고서 작성 순서로 구성된다. 반복 운영을 위해 날짜, 자료 출처, 거래/신청자명, 금액, 증빙 여부, 대조 상태, 사람 검토 메모를 포함한 표 템플릿을 사용한다.

실패 시나리오는 영수증 없음, 입금자명 불일치, 신청했지만 입금 없음, 중복 지출 가능성, 계약서 확인 필요 항목으로 나누고 각각의 사람 검토 절차를 둔다. 최종 산출물은 AI 자동화가 아니라 AI 보조와 사람 승인 지점을 결합한 안정적 운영 절차이다.
```

## Smoke Notes

- Good trace: attaches all materials, separates evidence from assumptions, assigns human review.
- Weak trace: asks AI to finalize accounting without verification or privacy review.
