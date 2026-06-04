import { defaultRubric } from "@/data/rubric";
import { generatedProblemBatch001Problems } from "@/data/generated-problem-batch-001";
import type { Problem } from "@/lib/types";

const seedProblems: Problem[] = [
  {
    id: "ambiguous-research-brief",
    locale: "ko",
    availableLocales: ["ko", "en"],
    localized: {
      en: {
        locale: "en",
        sourceLocale: "ko",
        translationStatus: "translated",
        title: "Turn a vague research request into an actionable research brief",
        subtitle: "Design the goal, verification criteria, and artifact structure before asking AI to summarize.",
        statement:
          "A friend only says, 'Can you look into how generative AI is affecting education these days? It is for a presentation.' Do not jump straight into searching or summarizing. Use AI conversation to design the research goal, scope, artifact structure, and verification strategy, then produce a draft research brief that could support presentation prep.",
        userGoal:
          "Structure an ambiguous request and delegate staged tasks to AI to produce a reliable presentation research brief.",
        constraints: [
          "Redefine the problem before asking for a final answer.",
          "Explicitly state at least one missing condition or working assumption.",
          "The final artifact must include research questions, candidate core claims, source types to verify, and a presentation structure.",
          "State the limits of the AI response or points that need additional verification.",
        ],
        starterContext: [
          "The audience, presentation length, grade/major, and need for current sources are still unclear.",
          "This problem evaluates problem definition and decomposition before factual accuracy.",
        ],
        deliverables: [
          "Refined problem definition",
          "List of subtasks delegated to AI",
          "Draft research brief for a presentation",
          "Verification plan",
        ],
        createdAt: "2026-06-05T00:00:00.000Z",
      },
    },
    title: "흐릿한 자료조사 요청을 실행 가능한 리서치 브리프로 바꾸기",
    subtitle: "AI가 헛소리하지 않도록 목표, 검증 기준, 산출물 구조를 먼저 설계한다.",
    category: "research",
    difficulty: "intro",
    goalProfile: "learning_oriented",
    estimatedMinutes: 20,
    statement:
      "지인이 '요즘 생성형 AI가 교육에 미치는 영향 좀 조사해줘. 발표에 쓸 거야.'라고만 말했다. 이 요청을 바로 검색/요약하지 말고, AI와 대화하면서 조사 목표, 범위, 산출물 구조, 검증 전략을 설계한 뒤 발표 준비에 쓸 수 있는 리서치 브리프 초안을 만들어라.",
    userGoal:
      "불명확한 요청을 구조화하고, AI에게 단계적으로 task를 배분하여 신뢰 가능한 발표용 리서치 브리프를 만든다.",
    constraints: [
      "처음부터 최종 답만 요구하지 말고 문제를 재정의해야 한다.",
      "최소 1번 이상 누락된 조건이나 가정을 명시해야 한다.",
      "최종 산출물에는 조사 질문, 핵심 주장 후보, 검증할 출처 유형, 발표 구조가 포함되어야 한다.",
      "AI 응답의 한계나 추가 검증 필요 지점을 명시해야 한다.",
    ],
    starterContext: [
      "발표 대상, 발표 시간, 학년/전공, 최신 자료 필요 여부는 아직 불명확하다.",
      "이 문제는 정확성보다 문제정의와 세분화를 우선 평가한다.",
    ],
    deliverables: [
      "정제된 문제정의",
      "AI에게 배분한 하위 task 목록",
      "발표용 리서치 브리프 초안",
      "검증 계획",
    ],
    materials: [],
    allowedProviders: ["mock", "groq", "xai", "openai", "openrouter", "gemini"],
    rubric: defaultRubric,
    createdAt: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "club-budget-workflow",
    locale: "ko",
    availableLocales: ["ko", "en"],
    localized: {
      en: {
        locale: "en",
        sourceLocale: "ko",
        translationStatus: "translated",
        title: "Turn club budget chaos into an AI-assisted workflow",
        subtitle: "Design which work belongs to people, documents, and AI.",
        statement:
          "A club treasurer cannot reconcile the budget because receipt photos, bank transfer records, and Google Form signup data are mixed together. Design an AI-assisted workflow that can process the reimbursement and settlement work reliably, then create an operating procedure that the actual treasurer can follow.",
        userGoal:
          "Separate a messy real-world task into AI tasks, human review points, and data structures, then turn it into a reusable workflow.",
        constraints: [
          "Separate judgments AI should not make from points a human must review.",
          "Include privacy and account-information handling precautions.",
          "Create a repeatable checklist or template.",
          "Include at least one failure scenario and response plan.",
        ],
        starterContext: [
          "The input materials are not fully organized.",
          "The treasurer is not a developer and must be able to follow the workflow without installing tools.",
        ],
        deliverables: [
          "Work breakdown",
          "AI task allocation plan",
          "Human review points",
          "Operating checklist",
          "Failure scenario response plan",
        ],
        createdAt: "2026-06-05T00:00:00.000Z",
      },
    },
    title: "동아리 예산 혼란을 AI 업무흐름으로 정리하기",
    subtitle: "사람, 문서, AI가 나눠 맡을 일을 설계한다.",
    category: "strategy",
    difficulty: "standard",
    goalProfile: "workflow_adoption",
    estimatedMinutes: 25,
    statement:
      "동아리 회계 담당자가 영수증 사진, 계좌이체 내역, 구글폼 신청 내역이 뒤섞여 예산 정산을 못 하고 있다. AI를 활용해 정산 업무를 안정적으로 처리하는 workflow를 설계하고, 실제 담당자가 따라 할 수 있는 운영 절차를 만들어라.",
    userGoal:
      "현실 업무의 혼란을 AI task, 사람 검토, 데이터 구조로 나누고 재사용 가능한 workflow로 만든다.",
    constraints: [
      "AI가 하면 안 되는 판단과 사람이 검토해야 할 지점을 분리해야 한다.",
      "개인정보나 계좌정보 처리 주의사항을 포함해야 한다.",
      "반복 운영 가능한 체크리스트 또는 템플릿을 만들어야 한다.",
      "최소 1개 이상의 실패 시나리오와 대응책을 포함해야 한다.",
    ],
    starterContext: [
      "입력 자료는 완전히 정리되어 있지 않다.",
      "담당자는 개발자가 아니며, 설치 없이 따라 할 수 있어야 한다.",
    ],
    deliverables: [
      "업무 분해도",
      "AI task 분배안",
      "사람 검토 지점",
      "운영 체크리스트",
      "실패 시나리오 대응책",
    ],
    materials: [
      {
        id: "receipt-001",
        sourceLocale: "ko",
        title: "영수증 사진: 문구점 소모품",
        description: "행사 준비용 네임펜, 테이프, A4 용지 구매 영수증. 이미지 자료를 보고 정산 항목을 추출해야 한다.",
        kind: "image",
        fileName: "receipt-001.png",
        mimeType: "image/png",
        href: "/materials/club-budget/receipt-001.png",
        extractedText:
          "영수증 추출 텍스트\n상호: 한빛문구\n일시: 2026-05-12 18:42\n품목: 네임펜 12색 1개 8,900원 / 투명테이프 3개 6,000원 / A4 용지 1권 5,500원\n합계: 20,400원\n결제: 체크카드\n메모: 동아리 발표회 준비 소모품으로 보임. 구매자 확인 필요.",
      },
      {
        id: "transfers-001",
        sourceLocale: "ko",
        title: "계좌이체 내역: 5월 행사",
        description: "입금/지출 내역 스프레드시트. 영수증과 대조하고 누락/중복 가능성을 확인해야 한다.",
        kind: "spreadsheet",
        fileName: "may-transfers.xlsx",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        href: "/materials/club-budget/may-transfers.xlsx",
        extractedText:
          "스프레드시트 추출 텍스트\n날짜,구분,내용,금액,메모\n2026-05-10,입금,참가비 김민지,15000,구글폼 12번\n2026-05-10,입금,참가비 이도윤,15000,구글폼 13번\n2026-05-12,지출,한빛문구,20400,영수증 receipt-001 대조 필요\n2026-05-13,지출,피자 주문,78000,영수증 없음\n2026-05-14,입금,참가비 박서연,15000,구글폼 누락 가능\n2026-05-15,지출,회의실 대관,50000,계약서 확인 필요",
      },
      {
        id: "signup-001",
        sourceLocale: "ko",
        title: "구글폼 신청 내역 CSV",
        description: "참가자 신청 기록. 계좌이체 입금자와 이름이 다를 수 있으므로 대조 기준이 필요하다.",
        kind: "csv",
        fileName: "signup-export.csv",
        mimeType: "text/csv",
        href: "/materials/club-budget/signup-export.csv",
        extractedText:
          "CSV 추출 텍스트\ntimestamp,name,student_id,paid_name\n2026-05-09 10:11,김민지,20231234,김민지\n2026-05-09 10:14,이도윤,20235555,이도윤\n2026-05-09 11:05,박서연,20230123,박서연\n2026-05-09 11:30,최현우,20239876,최현우\n주의: 최현우 입금 내역은 아직 발견되지 않음.",
      },
    ],
    allowedProviders: ["mock", "groq", "xai", "openai", "openrouter", "gemini"],
    rubric: defaultRubric,
    createdAt: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "counterfactual-product-review",
    locale: "ko",
    availableLocales: ["ko", "en"],
    localized: {
      en: {
        locale: "en",
        sourceLocale: "ko",
        translationStatus: "translated",
        title: "Correct a plausible but weak product-review analysis",
        subtitle: "Catch weak AI analysis and recover with stronger verification prompts.",
        statement:
          "You need AI to read 12 fictional app reviews and identify improvement priorities. However, the review set is small and may be biased. Design the analysis plan, limitations, verification questions, and final priorities so the AI does not jump to premature conclusions.",
        userGoal:
          "Constrain AI so it does not overgeneralize from small data, then build a verification-centered analysis.",
        constraints: [
          "State the limits of the data.",
          "Create analysis criteria before classifying the reviews.",
          "Review counterexamples or risks in the AI-generated priorities.",
          "Divide the final answer into execution priorities and additional data to collect.",
        ],
        starterContext: [
          "The review data is not guaranteed to be representative.",
          "This problem strongly evaluates verification and adaptation.",
        ],
        deliverables: [
          "Analysis criteria",
          "Review classification strategy",
          "Questions for verifying AI output",
          "Priorities and supporting rationale",
          "Additional data collection plan",
        ],
        createdAt: "2026-06-05T00:00:00.000Z",
      },
    },
    title: "그럴듯하지만 약한 제품 리뷰 분석 바로잡기",
    subtitle: "AI의 약한 분석을 잡아내고 더 강한 검증 프롬프트로 되돌린다.",
    category: "data_analysis",
    difficulty: "advanced",
    goalProfile: "accuracy_first",
    estimatedMinutes: 30,
    statement:
      "가상의 앱 리뷰 12개를 보고 AI에게 개선 우선순위를 뽑게 해야 한다. 단, 리뷰 수가 적고 편향되어 있을 수 있다. AI가 성급하게 결론내리지 않도록 분석 계획, 한계, 검증 질문, 최종 우선순위를 설계하라.",
    userGoal:
      "작은 데이터에서 AI가 과잉 일반화하지 않도록 제약을 걸고 검증 중심의 분석을 만든다.",
    constraints: [
      "데이터 한계를 명시해야 한다.",
      "분석 기준을 먼저 만들고 리뷰를 분류해야 한다.",
      "AI가 만든 우선순위에 대한 반례나 리스크를 검토해야 한다.",
      "최종 답은 실행 우선순위와 추가 수집 데이터로 나뉘어야 한다.",
    ],
    starterContext: [
      "리뷰 데이터는 대표성이 보장되지 않는다.",
      "이 문제는 검증력과 적응력을 강하게 평가한다.",
    ],
    deliverables: [
      "분석 기준",
      "리뷰 분류 전략",
      "AI 출력 검증 질문",
      "우선순위와 근거",
      "추가 데이터 수집 계획",
    ],
    materials: [],
    allowedProviders: ["mock", "groq", "xai", "openai", "openrouter", "gemini"],
    rubric: defaultRubric,
    createdAt: "2026-06-01T00:00:00.000Z",
  },
];

export const problems: Problem[] = [...seedProblems, ...generatedProblemBatch001Problems];

export function getProblem(problemId: string): Problem | undefined {
  return problems.find((problem) => problem.id === problemId);
}
