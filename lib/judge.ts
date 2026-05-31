import { defaultRubric } from "@/data/rubric";
import { buildAttachmentContext } from "@/lib/attachment-context";
import type { AxisScore, Bottleneck, Problem, ScoreReport, TraceEvent, WorkflowStep } from "@/lib/types";

const axisLabels: Record<AxisScore["axis"], string> = {
  problem_definition: "문제정의",
  decomposition: "세분화",
  instruction_clarity: "지시명확성",
  adaptation: "적응력",
  verification: "검증력",
  efficiency: "효율성",
  final_quality: "최종품질",
};

function countMatches(text: string, keywords: string[]) {
  const normalized = text.toLowerCase();
  return keywords.reduce((count, keyword) => count + (normalized.includes(keyword.toLowerCase()) ? 1 : 0), 0);
}

function clampScore(score: number) {
  return Math.max(35, Math.min(96, Math.round(score)));
}

function axisScore(axis: AxisScore["axis"], traceText: string, finalAnswer: string, turnCount: number): AxisScore {
  const combined = `${traceText}\n${finalAnswer}`;
  const keywordSets: Record<AxisScore["axis"], string[]> = {
    problem_definition: ["목표", "문제", "제약", "성공", "기준", "가정", "불확실"],
    decomposition: ["task", "단계", "하위", "분해", "역할", "workflow", "순서"],
    instruction_clarity: ["출력", "형식", "표", "json", "구조", "구체", "조건"],
    adaptation: ["수정", "다시", "반영", "중간", "대안", "변경", "새 정보"],
    verification: ["검증", "확인", "출처", "한계", "환각", "반례", "오류"],
    efficiency: ["비용", "토큰", "시간", "간결", "우선순위", "최소"],
    final_quality: ["최종", "결론", "브리프", "계획", "체크리스트", "산출물"],
  };

  const matches = countMatches(combined, keywordSets[axis]);
  const turnBonus = axis === "efficiency" ? Math.max(0, 12 - turnCount) : Math.min(10, turnCount * 2);
  const finalBonus = finalAnswer.length > 200 ? 10 : finalAnswer.length > 80 ? 5 : 0;
  const score = clampScore(48 + matches * 7 + turnBonus + finalBonus);

  return {
    axis,
    label: axisLabels[axis],
    score,
    rationale:
      matches > 3
        ? `${axisLabels[axis]} 관련 신호가 충분히 드러났습니다. 다음 단계는 근거와 우선순위를 더 압축하는 것입니다.`
        : `${axisLabels[axis]} 관련 표현과 실행 증거가 아직 약합니다. 프롬프트에 기준, 역할, 검증 방법을 더 명시해보세요.`,
  };
}

function findBottlenecks(trace: TraceEvent[]): Bottleneck[] {
  const userEvents = trace.filter((event) => event.role === "user");
  const bottlenecks: Bottleneck[] = [];

  const broadEvent = userEvents.find((event) => event.content.length < 35);
  if (broadEvent) {
    bottlenecks.push({
      traceEventId: broadEvent.id,
      label: "너무 넓은 지시",
      severity: "medium",
      explanation: "짧고 추상적인 요청은 AI가 목표, 범위, 출력 형식을 추측하게 만듭니다.",
      replaySuggestion: "이 지점부터 목표, 제약, 원하는 산출물 형식을 한 번에 명시해 다시 진행해보세요.",
    });
  }

  const noVerification = !userEvents.some((event) => countMatches(event.content, ["검증", "확인", "출처", "오류", "한계"]) > 0);
  if (noVerification) {
    bottlenecks.push({
      label: "검증 프롬프트 부재",
      severity: "high",
      explanation: "AI의 중간 산출물을 확인하는 단계가 약하면 그럴듯한 오류가 최종 답에 남을 수 있습니다.",
      replaySuggestion: "최종 답 직전부터 `이 답의 약점과 검증할 지점을 찾아줘`라고 요청해보세요.",
    });
  }

  return bottlenecks.slice(0, 3);
}

function buildWorkflow(trace: TraceEvent[]): WorkflowStep[] {
  const userEvents = trace.filter((event) => event.role === "user");
  const assistantEvents = trace.filter((event) => event.role === "assistant");

  return [
    {
      title: "문제 접근",
      summary:
        userEvents.length > 0
          ? "사용자가 문제를 읽고 AI에게 첫 접근 방향을 요청했습니다."
          : "아직 사용자의 문제 접근 프롬프트가 없습니다.",
      relatedTraceEventIds: userEvents[0] ? [userEvents[0].id] : [],
    },
    {
      title: "AI 응답 활용",
      summary:
        assistantEvents.length > 0
          ? "AI의 중간 산출물을 바탕으로 다음 지시를 이어갈 수 있는 상태입니다."
          : "아직 AI 응답이 없습니다.",
      relatedTraceEventIds: assistantEvents[0] ? [assistantEvents[0].id] : [],
    },
    {
      title: "최종 정리",
      summary: "최종 산출물과 검증 계획을 분리해 제출하는 것이 이 문제의 핵심입니다.",
      relatedTraceEventIds: trace.slice(-2).map((event) => event.id),
    },
  ];
}

export function judgeAttempt(input: {
  attemptId: string;
  problem: Problem;
  trace: TraceEvent[];
  finalAnswer: string;
}): ScoreReport {
  const userTurnCount = input.trace.filter((event) => event.role === "user").length;
  const traceText = input.trace
    .map((event) => `${event.role}: ${event.content}\n${buildAttachmentContext(event.attachments)}`)
    .join("\n");
  const axisScores = defaultRubric.map((item) => axisScore(item.axis, traceText, input.finalAnswer, userTurnCount));
  const weightedTotal =
    axisScores.reduce((sum, score) => {
      const weight = input.problem.rubric.find((item) => item.axis === score.axis)?.weight ?? 1;
      return sum + score.score * weight;
    }, 0) / input.problem.rubric.reduce((sum, item) => sum + item.weight, 0);
  const bottlenecks = findBottlenecks(input.trace);
  const strengths = axisScores
    .filter((score) => score.score >= 76)
    .slice(0, 3)
    .map((score) => `${score.label}: ${score.rationale}`);
  const improvements = axisScores
    .filter((score) => score.score < 72)
    .slice(0, 3)
    .map((score) => `${score.label}: ${score.rationale}`);

  return {
    id: crypto.randomUUID(),
    attemptId: input.attemptId,
    problemId: input.problem.id,
    totalScore: Math.round(weightedTotal),
    axisScores,
    coachSummary:
      "이번 시도는 AI에게 바로 정답을 맡기는 대신 문제 구조와 검증 기준을 얼마나 세웠는지가 핵심입니다. 점수보다 아래 축별 피드백을 보고 다음 시도에서 한 지점을 바꾸는 것이 중요합니다.",
    strengths: strengths.length > 0 ? strengths : ["문제 해결 과정을 trace로 남겼기 때문에 개선 가능한 지점이 명확해졌습니다."],
    improvements:
      improvements.length > 0
        ? improvements
        : ["다음 시도에서는 병목 프롬프트 하나를 골라 같은 지점부터 다른 방식으로 재출발해보세요."],
    bottlenecks,
    workflow: buildWorkflow(input.trace),
    nextPracticeTargets: [
      "첫 프롬프트에서 성공 기준과 출력 형식을 더 선명하게 쓰기",
      "중간 산출물 뒤에 검증 프롬프트를 한 번 추가하기",
      "최종 답과 검증 계획을 분리해서 제출하기",
    ],
    judgeProvider: "mock",
    judgeModel: "heuristic-coach-v0",
    createdAt: new Date().toISOString(),
  };
}
