import { z } from "zod";
import { defaultRubric } from "@/data/rubric";
import { buildAttachmentContext } from "@/lib/attachment-context";
import { buildConversationGraph } from "@/lib/conversation-graph";
import { buildJudgeEvidencePacket, formatJudgeEvidenceForContext } from "@/lib/judge-evidence";
import { normalizeJudgeGraphAnnotations, type RawJudgeGraphAnnotation } from "@/lib/judge-graph-annotations";
import { getLocalizedProblem } from "@/lib/problem-localization";
import { getJudgeProvider } from "@/lib/providers";
import type {
  AxisScore,
  Bottleneck,
  JudgeEvidencePacket,
  JudgeMode,
  JudgeRunSummary,
  Problem,
  ProviderId,
  ReportLocale,
  ScoreReport,
  TraceEvent,
  WorkflowStep,
} from "@/lib/types";

const rubricVersion = "rubric.research-v1";
const judgePromptVersion = "judge-prompt.research-v2.001";

const providerIds = ["mock", "openai", "groq", "xai", "openrouter", "gemini"] as const;
const scoreAxisValues = [
  "problem_definition",
  "decomposition",
  "instruction_clarity",
  "adaptation",
  "verification",
  "efficiency",
  "final_quality",
] as const;
const graphAnnotationKindValues = [
  "framing",
  "decomposition",
  "delegation",
  "material_grounding",
  "verification",
  "adaptation",
  "context_drift",
  "bottleneck",
  "recovery",
  "finalization",
  "model_behavior",
  "cost_efficiency",
] as const;

const axisLabels: Record<ReportLocale, Record<AxisScore["axis"], string>> = {
  ko: {
    problem_definition: "문제정의",
    decomposition: "세분화",
    instruction_clarity: "지시명확성",
    adaptation: "적응력",
    verification: "검증력",
    efficiency: "효율성",
    final_quality: "최종품질",
  },
  en: {
    problem_definition: "Problem Definition",
    decomposition: "Decomposition",
    instruction_clarity: "Instruction Clarity",
    adaptation: "Adaptation",
    verification: "Verification",
    efficiency: "Efficiency",
    final_quality: "Final Quality",
  },
};

const llmJudgeSchema = z.object({
  rubricVersion: z.string().optional(),
  judgePromptVersion: z.string().optional(),
  totalScore: z.coerce.number().min(0).max(100).optional(),
  confidence: z.coerce.number().min(0).max(100).optional(),
  needsHumanReview: z.boolean().optional(),
  coachSummary: z.string().min(1),
  axisScores: z.array(
    z.object({
      axis: z.enum(scoreAxisValues),
      score: z.coerce.number().min(0).max(100),
      confidence: z.coerce.number().min(0).max(100).optional(),
      rationale: z.string().min(1),
      evidenceIds: z.array(z.string()).default([]),
    }),
  ),
  findings: z
    .array(
      z.object({
        id: z.string().optional(),
        kind: z.enum(["strength", "bottleneck", "risk", "missed_opportunity"]).default("bottleneck"),
        severity: z.enum(["info", "positive", "watch", "critical"]),
        axis: z.enum(scoreAxisValues),
        targetKind: z.enum(["attempt", "pair", "prompt_node", "response_node", "status_node", "edge", "trace_event"]),
        targetId: z.string().min(1),
        evidenceIds: z.array(z.string()).default([]),
        confidence: z.coerce.number().min(0).max(100).optional(),
        title: z.string().min(1).max(140),
        explanation: z.string().min(1).max(1000),
        replaySuggestion: z.string().max(600).optional(),
      }),
    )
    .default([]),
  strengths: z.array(z.string()).default([]),
  improvements: z.array(z.string()).default([]),
  bottlenecks: z
    .array(
      z.object({
        traceEventId: z.string().optional(),
        label: z.string(),
        severity: z.enum(["low", "medium", "high"]),
        explanation: z.string(),
        replaySuggestion: z.string(),
      }),
    )
    .default([]),
  workflow: z
    .array(
      z.object({
        title: z.string(),
        summary: z.string(),
        relatedTraceEventIds: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  nextPracticeTargets: z.array(z.string()).default([]),
  graphAnnotations: z
    .array(
      z.object({
        targetTraceEventId: z.string().optional(),
        targetKind: z.enum(["attempt", "pair", "node", "edge", "trace_event", "prompt_node", "response_node", "status_node"]).optional(),
        targetId: z.string().optional(),
        kind: z.enum(graphAnnotationKindValues),
        severity: z.enum(["info", "positive", "watch", "critical"]),
        axis: z.enum(scoreAxisValues).optional(),
        scoreImpact: z.coerce.number().min(-25).max(25).optional(),
        confidence: z.coerce.number().min(0).max(100).optional(),
        title: z.string().min(1).max(140),
        explanation: z.string().min(1).max(1000),
        evidenceTraceEventIds: z.array(z.string()).default([]),
      }),
    )
    .max(12)
    .default([]),
  uncertaintyNotes: z.array(z.string()).default([]),
});

interface JudgeInput {
  attemptId: string;
  problem: Problem;
  trace: TraceEvent[];
  finalAnswer: string;
  locale: ReportLocale;
}

interface JudgeConfig {
  provider: ProviderId;
  model: string;
}

interface JudgeRunInternal {
  summary: JudgeRunSummary;
  report?: ScoreReport;
}

function countMatches(text: string, keywords: string[]) {
  const normalized = text.toLowerCase();
  return keywords.reduce((count, keyword) => count + (normalized.includes(keyword.toLowerCase()) ? 1 : 0), 0);
}

function clampScore(score: number) {
  return Math.max(35, Math.min(96, Math.round(score)));
}

function weightedTotal(problem: Problem, axisScores: AxisScore[]) {
  const totalWeight = problem.rubric.reduce((sum, item) => sum + item.weight, 0);
  const weighted =
    axisScores.reduce((sum, score) => {
      const weight = problem.rubric.find((item) => item.axis === score.axis)?.weight ?? 1;
      return sum + score.score * weight;
    }, 0) / totalWeight;

  return Math.round(weighted);
}

function appendEvidenceRationale(score: AxisScore, evidence: JudgeEvidencePacket | undefined, locale: ReportLocale): AxisScore {
  if (!evidence) {
    return score;
  }

  const notes: string[] = [];

  if (score.axis === "problem_definition") {
    if (evidence.signals.hasExplicitGoal) {
      notes.push(locale === "ko" ? "목표 신호 있음" : "goal signal present");
    }
    if (evidence.signals.hasConstraints) {
      notes.push(locale === "ko" ? "제약/가정 신호 있음" : "constraints/assumptions present");
    }
  }

  if (score.axis === "decomposition" && evidence.signals.hasDecomposition) {
    notes.push(locale === "ko" ? "task 분해 신호 있음" : "decomposition signal present");
  }

  if (score.axis === "instruction_clarity") {
    if (evidence.signals.hasDeliverableContract) {
      notes.push(locale === "ko" ? "산출물 계약 신호 있음" : "deliverable contract present");
    }
    if (evidence.signals.hasMaterialInstruction) {
      notes.push(locale === "ko" ? "자료 사용 지시 신호 있음" : "material-use instruction present");
    }
  }

  if (score.axis === "adaptation" && evidence.signals.hasAdaptationReference) {
    notes.push(locale === "ko" ? "이전 응답 반영 신호 있음" : "response-aware adaptation present");
  }

  if (score.axis === "verification") {
    if (evidence.signals.hasVerification) {
      notes.push(locale === "ko" ? "검증 신호 있음" : "verification signal present");
    }
    if (evidence.signals.hasAssumptionSeparation) {
      notes.push(locale === "ko" ? "가정/사실 분리 신호 있음" : "assumption/fact separation present");
    }
  }

  if (score.axis === "efficiency" && evidence.signals.repeatedContextBurden > 0) {
    notes.push(
      locale === "ko"
        ? `반복 context burden ${Math.round(evidence.signals.repeatedContextBurden * 100)}%`
        : `repeated context burden ${Math.round(evidence.signals.repeatedContextBurden * 100)}%`,
    );
  }

  if (score.axis === "final_quality") {
    notes.push(
      locale === "ko"
        ? `최종 산출물 coverage ${Math.round(evidence.signals.finalAnswerCoverage * 100)}%`
        : `final artifact coverage ${Math.round(evidence.signals.finalAnswerCoverage * 100)}%`,
    );
  }

  if (notes.length === 0) {
    return score;
  }

  return {
    ...score,
    rationale: `${score.rationale} ${locale === "ko" ? "Evidence packet:" : "Evidence packet:"} ${notes.join(", ")}.`,
  };
}

function adjustAxisScoreWithEvidence(score: AxisScore, evidence: JudgeEvidencePacket | undefined, locale: ReportLocale): AxisScore {
  if (!evidence) {
    return score;
  }

  let delta = 0;

  if (score.axis === "problem_definition") {
    delta += evidence.signals.hasExplicitGoal ? 6 : -4;
    delta += evidence.signals.hasConstraints ? 4 : 0;
    delta += evidence.signals.hasAssumptionSeparation ? 3 : 0;
  }

  if (score.axis === "decomposition") {
    delta += evidence.signals.hasDecomposition ? 10 : -5;
    delta += evidence.counts.promptPairCount >= 3 ? 3 : 0;
  }

  if (score.axis === "instruction_clarity") {
    delta += evidence.signals.hasDeliverableContract ? 7 : -3;
    delta += evidence.signals.hasMaterialInstruction ? 4 : 0;
  }

  if (score.axis === "adaptation") {
    delta += evidence.signals.hasAdaptationReference ? 9 : 0;
    delta += evidence.signals.branchReplayUsed ? 6 : 0;
  }

  if (score.axis === "verification") {
    delta += evidence.signals.hasVerification ? 10 : -6;
    delta += evidence.signals.hasHumanDecisionBoundary ? 4 : 0;
    delta -= evidence.warnings.includes("some_problem_materials_unused") ? 4 : 0;
  }

  if (score.axis === "efficiency") {
    delta -= Math.round(evidence.signals.repeatedContextBurden * 12);
    delta += evidence.counts.userTurnCount > 0 && evidence.counts.userTurnCount <= 4 ? 3 : 0;
  }

  if (score.axis === "final_quality") {
    delta += Math.round(evidence.signals.finalAnswerCoverage * 10);
    delta += evidence.signals.hasDeliverableContract ? 3 : 0;
  }

  return appendEvidenceRationale(
    {
      ...score,
      score: clampScore(score.score + delta),
    },
    evidence,
    locale,
  );
}

function axisScore(axis: AxisScore["axis"], traceText: string, finalAnswer: string, turnCount: number, locale: ReportLocale): AxisScore {
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
  const label = axisLabels[locale][axis];

  return {
    axis,
    label,
    score,
    rationale:
      matches > 3
        ? locale === "ko"
          ? `${label} 관련 신호가 충분히 드러났습니다. 다음 단계는 근거와 우선순위를 더 압축하는 것입니다.`
          : `${label} signals are visible enough. Next, compress evidence and priorities more clearly.`
        : locale === "ko"
          ? `${label} 관련 실행 증거가 아직 약합니다. 모델에게 결과를 맡기기 전에 기준, 역할, 검증 책임을 더 선명하게 설계해보세요.`
          : `${label} evidence is still weak. Clarify criteria, roles, and verification responsibility before handing the result to the model.`,
  };
}

function findBottlenecks(trace: TraceEvent[], locale: ReportLocale): Bottleneck[] {
  const userEvents = trace.filter((event) => event.role === "user");
  const bottlenecks: Bottleneck[] = [];

  const broadEvent = userEvents.find((event) => event.content.length < 35);
  if (broadEvent) {
    bottlenecks.push({
      traceEventId: broadEvent.id,
      label: locale === "ko" ? "너무 넓은 지시" : "Overly Broad Instruction",
      severity: "medium",
      explanation:
        locale === "ko"
          ? "짧고 추상적인 요청은 목표, 범위, 출력 형식의 설계를 모델의 추측에 넘깁니다."
          : "A short abstract request leaves the goal, scope, and output format to model guesswork.",
      replaySuggestion:
        locale === "ko"
          ? "이 지점부터 목표, 제약, 원하는 산출물 형식을 한 번에 명시해 다시 진행해보세요."
          : "Replay from this point with the goal, constraints, and desired artifact format stated together.",
    });
  }

  const noVerification = !userEvents.some((event) => countMatches(event.content, ["검증", "확인", "출처", "오류", "한계"]) > 0);
  if (noVerification) {
    bottlenecks.push({
      label: locale === "ko" ? "검증 프롬프트 부재" : "Missing Verification Prompt",
      severity: "high",
      explanation:
        locale === "ko"
          ? "검증 단계가 없으면 AI의 그럴듯한 산출물을 사용자가 다시 판단하지 않고 통과시키게 됩니다."
          : "Without a verification step, plausible AI output can pass without human judgment.",
      replaySuggestion:
        locale === "ko"
          ? "최종 답 직전부터 `이 답의 약점과 검증할 지점을 찾아줘`라고 요청해보세요."
          : "Before finalizing, ask the model to identify weaknesses and verification points.",
    });
  }

  return bottlenecks.slice(0, 3);
}

function buildWorkflow(trace: TraceEvent[], locale: ReportLocale): WorkflowStep[] {
  const userEvents = trace.filter((event) => event.role === "user");
  const assistantEvents = trace.filter((event) => event.role === "assistant");

  return [
    {
      title: locale === "ko" ? "문제 접근" : "Problem Approach",
      summary:
        userEvents.length > 0
          ? locale === "ko"
            ? "사용자가 문제를 읽고 AI에게 첫 접근 방향을 요청했습니다."
            : "The user read the problem and asked the AI for an initial approach."
          : locale === "ko"
            ? "아직 사용자의 문제 접근 프롬프트가 없습니다."
            : "There is no user prompt for approaching the problem yet.",
      relatedTraceEventIds: userEvents[0] ? [userEvents[0].id] : [],
    },
    {
      title: locale === "ko" ? "AI 응답 활용" : "AI Response Use",
      summary:
        assistantEvents.length > 0
          ? locale === "ko"
            ? "AI의 중간 산출물을 바탕으로 다음 지시를 이어갈 수 있는 상태입니다."
            : "The user can continue from the AI's intermediate artifact."
          : locale === "ko"
            ? "아직 AI 응답이 없습니다."
            : "There is no AI response yet.",
      relatedTraceEventIds: assistantEvents[0] ? [assistantEvents[0].id] : [],
    },
    {
      title: locale === "ko" ? "최종 정리" : "Final Organization",
      summary:
        locale === "ko"
          ? "최종 산출물과 검증 계획을 분리해 제출하는 것이 이 문제의 핵심입니다."
          : "The key is to separate the final artifact from the verification plan.",
      relatedTraceEventIds: trace.slice(-2).map((event) => event.id),
    },
  ];
}

function buildHeuristicReport(input: JudgeInput, evidence?: JudgeEvidencePacket): ScoreReport {
  const userTurnCount = input.trace.filter((event) => event.role === "user").length;
  const traceText = input.trace
    .map((event) => `${event.role}: ${event.content}\n${buildAttachmentContext(event.attachments)}`)
    .join("\n");
  const axisScores = defaultRubric.map((item) =>
    adjustAxisScoreWithEvidence(axisScore(item.axis, traceText, input.finalAnswer, userTurnCount, input.locale), evidence, input.locale),
  );
  const bottlenecks = findBottlenecks(input.trace, input.locale);
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
    totalScore: weightedTotal(input.problem, axisScores),
    axisScores,
    coachSummary:
      input.locale === "ko"
        ? "이번 시도는 AI에게 정답을 맡긴 기록이 아니라, 사용자가 문제 구조와 검증 책임을 어떻게 설계했는지에 대한 기록입니다. 점수보다 아래 mirror와 축별 피드백을 보고 다음 시도에서 한 지점을 바꾸는 것이 중요합니다."
        : "This attempt is not a record of handing the answer to AI. It is a record of how the user designed problem structure and verification responsibility. Use the mirror and axis feedback to change one point in the next attempt.",
    strengths:
      strengths.length > 0
        ? strengths
        : [
            input.locale === "ko"
              ? "문제 해결 과정을 trace로 남겼기 때문에 개선 가능한 지점이 명확해졌습니다."
              : "Because the problem-solving process was preserved as a trace, improvement points are visible.",
          ],
    improvements:
      improvements.length > 0
        ? improvements
        : [
            input.locale === "ko"
              ? "다음 시도에서는 병목 프롬프트 하나를 골라 같은 지점부터 다른 방식으로 재출발해보세요."
              : "In the next attempt, choose one bottleneck prompt and restart from that point in a different way.",
          ],
    bottlenecks,
    workflow: buildWorkflow(input.trace, input.locale),
    nextPracticeTargets: [
      input.locale === "ko" ? "첫 프롬프트에서 성공 기준과 출력 형식을 더 선명하게 쓰기" : "State success criteria and output format more clearly in the first prompt.",
      input.locale === "ko" ? "중간 산출물 뒤에 검증 프롬프트를 한 번 추가하기" : "Add one verification prompt after the intermediate artifact.",
      input.locale === "ko" ? "최종 답과 검증 계획을 분리해서 제출하기" : "Submit the final answer and verification plan separately.",
    ],
    judgeProvider: "mock",
    judgeModel: "heuristic-coach-v0",
    judgeMode: "heuristic",
    judgePromptVersion: "heuristic-evidence-v1",
    rubricVersion,
    confidence: evidence ? 0.66 : 0.55,
    needsHumanReview:
      !evidence ||
      evidence.warnings.includes("possible_one_shot_process") ||
      evidence.warnings.includes("required_materials_not_attached") ||
      evidence.warnings.includes("missing_verification_step"),
    uncertaintyNotes: evidence?.warnings ?? [],
    locale: input.locale,
    sourceLocale: input.locale,
    translationStatus: "source",
    createdAt: new Date().toISOString(),
  };
}

function isProviderId(value: string): value is ProviderId {
  return providerIds.includes(value as ProviderId);
}

function getJudgeMode(): JudgeMode {
  const value = process.env.SKAI_JUDGE_MODE;
  return value === "llm" || value === "ensemble" ? value : "heuristic";
}

function defaultJudgeModel(provider: ProviderId) {
  const models: Record<ProviderId, string> = {
    mock: "mock-orchestrator",
    openai: process.env.OPENAI_MODEL ?? "gpt-4.1-nano",
    groq: process.env.GROQ_MODEL ?? "llama-3.1-8b-instant",
    xai: process.env.XAI_MODEL ?? "grok-4-fast",
    openrouter: process.env.OPENROUTER_MODEL ?? "openai/gpt-oss-20b",
    gemini: process.env.SKAI_JUDGE_GEMINI_MODEL ?? process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite",
  };

  return models[provider];
}

function parseJudgeConfig(value: string): JudgeConfig | null {
  const [providerValue, modelValue] = value.split(":");
  const provider = providerValue?.trim();

  if (!provider || !isProviderId(provider) || provider === "mock") {
    return null;
  }

  return {
    provider,
    model: modelValue?.trim() || defaultJudgeModel(provider),
  };
}

function getLlmJudgeConfigs(mode: JudgeMode): JudgeConfig[] {
  if (mode === "ensemble") {
    const configs =
      process.env.SKAI_JUDGE_ENSEMBLE?.split(",")
        .map((item) => parseJudgeConfig(item.trim()))
        .filter((item): item is JudgeConfig => Boolean(item)) ?? [];

    if (configs.length > 0) {
      return configs;
    }
  }

  const provider = process.env.SKAI_JUDGE_PROVIDER?.trim() ?? "gemini";
  if (!isProviderId(provider) || provider === "mock") {
    return [];
  }

  return [
    {
      provider,
      model: process.env.SKAI_JUDGE_MODEL?.trim() || defaultJudgeModel(provider),
    },
  ];
}

function buildGraphTargetGuide(input: JudgeInput) {
  const graph = buildConversationGraph(input.trace, undefined, undefined, {
    problemMaterialCount: input.problem.materials.length,
  });
  const pairs = graph.pairs
    .map((pair) =>
      [
        `sequence ${pair.sequence}`,
        `pairId=${pair.id}`,
        `promptNodeId=${pair.promptNodeId}`,
        `responseNodeId=${pair.responseNodeId ?? "none"}`,
        `statusNodeId=${pair.statusNodeId}`,
        `promptTraceEventId=${pair.promptTraceEventId}`,
        `responseTraceEventId=${pair.responseTraceEventId ?? "none"}`,
        `status=${pair.status}`,
      ].join(" | "),
    )
    .join("\n");
  const edges = [...graph.promptEdges, ...graph.responseEdges, ...graph.statusEdges]
    .map((edge) => `edgeId=${edge.id} | projection=${edge.projection} | pairId=${edge.pairId ?? "none"} | traceEventId=${edge.traceEventId ?? "none"}`)
    .join("\n");

  return [
    "Graph target guide:",
    "Use these stable ids for findings.targetId whenever possible.",
    "",
    "Pairs:",
    pairs || "No pairs.",
    "",
    "Edges:",
    edges || "No edges.",
  ].join("\n");
}

function buildJudgeContext(input: JudgeInput, evidence: JudgeEvidencePacket) {
  const problem = getLocalizedProblem(input.problem, input.locale);
  const trace = input.trace
    .map((event, index) => {
      const attachmentContext = buildAttachmentContext(event.attachments);
      return [
        `Trace event ${index + 1}`,
        `id: ${event.id}`,
        `role: ${event.role}`,
        `provider/model: ${event.provider ?? "unknown"}/${event.model ?? "unknown"}`,
        "content:",
        event.content,
        attachmentContext ? `attachments:\n${attachmentContext}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n---\n\n");

  return [
    "SKAI Judge Context",
    "",
    `Problem ID: ${problem.id}`,
    `Title: ${problem.title}`,
    `Problem display locale: ${problem.displayLocale}`,
    `Problem source locale: ${problem.sourceLocale}`,
    `Problem translation status: ${problem.translationStatus}`,
    `Goal profile: ${problem.goalProfile}`,
    `Requested judge prose locale: ${input.locale === "ko" ? "Korean" : "English"}`,
    "",
    "Problem statement:",
    problem.statement,
    "",
    "User goal:",
    problem.userGoal,
    "",
    "Constraints:",
    problem.constraints.map((item) => `- ${item}`).join("\n"),
    "",
    "Deliverables:",
    problem.deliverables.map((item) => `- ${item}`).join("\n"),
    "",
    "Rubric:",
    problem.rubric.map((item) => `- ${item.axis} (${item.weight}): ${item.description}`).join("\n"),
    "",
    "Deterministic evidence packet:",
    formatJudgeEvidenceForContext(evidence),
    "",
    buildGraphTargetGuide(input),
    "",
    "Trace:",
    trace || "No trace events.",
    "",
    "Final answer:",
    input.finalAnswer || "(empty)",
  ].join("\n");
}

function extractJsonObject(value: string) {
  const withoutFence = value.replace(/```json|```/g, "").trim();
  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Judge response did not contain a JSON object.");
  }

  return JSON.parse(withoutFence.slice(start, end + 1)) as unknown;
}

function clampConfidence(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0.72;
  }

  const normalized = value > 1 ? value / 100 : value;
  return Math.max(0, Math.min(1, normalized));
}

function findingSeverityToBottleneckSeverity(severity: "info" | "positive" | "watch" | "critical"): Bottleneck["severity"] {
  if (severity === "critical") {
    return "high";
  }

  if (severity === "watch") {
    return "medium";
  }

  return "low";
}

function targetKindToGraphAnnotationKind(kind: string): RawJudgeGraphAnnotation["targetKind"] {
  if (kind === "prompt_node" || kind === "response_node" || kind === "status_node") {
    return kind;
  }

  if (kind === "pair" || kind === "edge" || kind === "trace_event" || kind === "attempt") {
    return kind;
  }

  return "pair";
}

function findingKindToAnnotationKind(kind: "strength" | "bottleneck" | "risk" | "missed_opportunity", axis: AxisScore["axis"]) {
  if (kind === "strength" && axis === "adaptation") {
    return "recovery" as const;
  }

  if (kind === "strength" && axis === "verification") {
    return "verification" as const;
  }

  if (axis === "verification") {
    return "verification" as const;
  }

  if (axis === "efficiency") {
    return "cost_efficiency" as const;
  }

  if (axis === "adaptation") {
    return "adaptation" as const;
  }

  if (axis === "decomposition") {
    return "decomposition" as const;
  }

  if (axis === "instruction_clarity") {
    return "delegation" as const;
  }

  if (kind === "risk") {
    return "bottleneck" as const;
  }

  return kind === "missed_opportunity" ? "context_drift" : "bottleneck";
}

function traceEventIdsFromEvidenceIds(input: {
  traceEventIds: Set<string>;
  evidenceIds: string[];
  fallbackTargetKind: string;
  fallbackTargetId: string;
}) {
  const fromEvidence = input.evidenceIds.filter((id) => input.traceEventIds.has(id));

  if (fromEvidence.length > 0) {
    return fromEvidence.slice(0, 6);
  }

  if (input.fallbackTargetKind === "trace_event" && input.traceEventIds.has(input.fallbackTargetId)) {
    return [input.fallbackTargetId];
  }

  return [];
}

function findingsToRawAnnotations(input: {
  findings: z.infer<typeof llmJudgeSchema>["findings"];
  trace: TraceEvent[];
}): RawJudgeGraphAnnotation[] {
  const traceEventIds = new Set(input.trace.map((event) => event.id));

  return input.findings
    .filter((finding) => finding.severity !== "info")
    .map((finding): RawJudgeGraphAnnotation => {
      const evidenceTraceEventIds = traceEventIdsFromEvidenceIds({
        traceEventIds,
        evidenceIds: finding.evidenceIds,
        fallbackTargetKind: finding.targetKind,
        fallbackTargetId: finding.targetId,
      });
      const targetTraceEventId =
        finding.targetKind === "trace_event" && traceEventIds.has(finding.targetId)
          ? finding.targetId
          : evidenceTraceEventIds[0];

      return {
        targetTraceEventId,
        targetKind: targetKindToGraphAnnotationKind(finding.targetKind),
        targetId: finding.targetKind === "trace_event" || finding.targetKind === "attempt" ? undefined : finding.targetId,
        kind: findingKindToAnnotationKind(finding.kind, finding.axis),
        severity: finding.severity,
        axis: finding.axis,
        scoreImpact: finding.severity === "critical" ? -12 : finding.severity === "watch" ? -6 : finding.severity === "positive" ? 6 : 0,
        confidence: clampConfidence(finding.confidence) * 100,
        title: finding.title,
        explanation: finding.explanation,
        evidenceTraceEventIds,
      };
    });
}

function normalizeLlmReport(input: JudgeInput, config: JudgeConfig, raw: z.infer<typeof llmJudgeSchema>): ScoreReport {
  const reportConfidence = clampConfidence(raw.confidence);
  const axisScores = defaultRubric.map((item) => {
    const found = raw.axisScores.find((score) => score.axis === item.axis);

    return {
      axis: item.axis,
      label: axisLabels[input.locale][item.axis],
      score: clampScore(found?.score ?? 50),
      confidence: clampConfidence(found?.confidence),
      evidenceIds: found?.evidenceIds?.slice(0, 8) ?? [],
      rationale:
        found?.rationale ??
        (input.locale === "ko"
          ? `${axisLabels[input.locale][item.axis]} 축에 대한 judge 근거가 누락되었습니다.`
          : `Judge rationale for ${axisLabels[input.locale][item.axis]} is missing.`),
    };
  });

  const report: ScoreReport = {
    id: crypto.randomUUID(),
    attemptId: input.attemptId,
    problemId: input.problem.id,
    totalScore: typeof raw.totalScore === "number" ? clampScore(raw.totalScore) : weightedTotal(input.problem, axisScores),
    axisScores,
    coachSummary: raw.coachSummary,
    strengths: [
      ...raw.findings.filter((finding) => finding.kind === "strength").map((finding) => `${finding.title}: ${finding.explanation}`),
      ...raw.strengths,
    ].slice(0, 4),
    improvements: [
      ...raw.findings
        .filter((finding) => finding.kind !== "strength")
        .map((finding) => `${finding.title}: ${finding.explanation}`),
      ...raw.improvements,
    ].slice(0, 4),
    bottlenecks: [
      ...raw.findings
        .filter((finding) => finding.kind === "bottleneck" || finding.kind === "risk" || finding.severity === "critical")
        .map((finding) => ({
          traceEventId: finding.targetKind === "trace_event" ? finding.targetId : undefined,
          label: finding.title,
          severity: findingSeverityToBottleneckSeverity(finding.severity),
          explanation: finding.explanation,
          replaySuggestion: finding.replaySuggestion ?? finding.explanation,
        })),
      ...raw.bottlenecks,
    ].slice(0, 4),
    workflow: raw.workflow.length > 0 ? raw.workflow.slice(0, 6) : buildWorkflow(input.trace, input.locale),
    nextPracticeTargets: raw.nextPracticeTargets.slice(0, 4),
    judgeProvider: config.provider,
    judgeModel: config.model,
    judgeMode: "llm",
    judgePromptVersion: raw.judgePromptVersion ?? judgePromptVersion,
    rubricVersion: raw.rubricVersion ?? rubricVersion,
    confidence: reportConfidence,
    needsHumanReview:
      raw.needsHumanReview ??
      (reportConfidence < 0.65 ||
        raw.uncertaintyNotes.length > 0 ||
        raw.findings.some((finding) => finding.targetKind === "attempt" && finding.severity !== "positive")),
    uncertaintyNotes: raw.uncertaintyNotes.slice(0, 5),
    locale: input.locale,
    sourceLocale: input.locale,
    translationStatus: "source",
    createdAt: new Date().toISOString(),
  };

  return {
    ...report,
    graphAnnotations: normalizeJudgeGraphAnnotations({
      attemptId: input.attemptId,
      trace: input.trace,
      scoreReport: report,
      rawAnnotations: [...findingsToRawAnnotations({ findings: raw.findings, trace: input.trace }), ...raw.graphAnnotations],
      problemMaterialCount: input.problem.materials.length,
    }),
  };
}

function runSummary(input: {
  attemptId: string;
  status: JudgeRunSummary["status"];
  judgeProvider: ProviderId;
  judgeModel: string;
  judgeKind: JudgeRunSummary["judgeKind"];
  startedAt: number;
  totalScore?: number;
  axisScores?: AxisScore[];
  error?: string;
}): JudgeRunSummary {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    attemptId: input.attemptId,
    status: input.status,
    judgeProvider: input.judgeProvider,
    judgeModel: input.judgeModel,
    judgeKind: input.judgeKind,
    rubricVersion,
    latencyMs: Date.now() - input.startedAt,
    totalScore: input.totalScore,
    axisScores: input.axisScores,
    error: input.error,
    createdAt: now,
    updatedAt: now,
  };
}

function runHeuristicJudge(input: JudgeInput, evidence?: JudgeEvidencePacket): JudgeRunInternal {
  const startedAt = Date.now();
  const report = buildHeuristicReport(input, evidence);

  return {
    report,
    summary: runSummary({
      attemptId: input.attemptId,
      status: "succeeded",
      judgeProvider: "mock",
      judgeModel: "heuristic-coach-v0",
      judgeKind: "heuristic",
      startedAt,
      totalScore: report.totalScore,
      axisScores: report.axisScores,
    }),
  };
}

async function runLlmJudge(input: JudgeInput, config: JudgeConfig, evidence: JudgeEvidencePacket): Promise<JudgeRunInternal> {
  const startedAt = Date.now();

  try {
    const provider = getJudgeProvider(config.provider);
    const response = await provider.complete({
      provider: config.provider,
      model: config.model,
      problem: input.problem,
      temperature: 0.1,
      systemPrompt: [
        "You are SKAI Judge, an evaluator for AI orchestration skill.",
        "Evaluate the human user's process, not the model's raw intelligence.",
        `Rubric version: ${rubricVersion}. Judge prompt version: ${judgePromptVersion}.`,
        "Focus on problem framing, decomposition/workflow, instruction/output control, material/context grounding, adaptation, verification/uncertainty control, efficiency/context economy, and final artifact quality.",
        "Use the deterministic evidence packet as structured evidence, but do not treat keyword signals as final truth.",
        "Prefer graph-targeted findings. Anchor each finding to a real pair/node/edge/trace_event id from the Graph target guide.",
        "For graphAnnotations, target trace event ids from the supplied trace. Do not invent trace ids.",
        "Use pair targets for prompt-response orchestration states unless a specific prompt or response node is the issue.",
        "Do not reward fake precision. Explain bottlenecks concretely.",
        `Write every human-facing field in ${input.locale === "ko" ? "Korean" : "English"}. Keep SKAI technical tokens such as Prompt, Response, Trace, Branch, Replay, Judge, and Coaching when useful.`,
        "Return only valid JSON. Do not include markdown fences.",
      ].join(" "),
      contextMessage: buildJudgeContext(input, evidence),
      messages: [
        {
          role: "user",
          content: [
            "Return a JSON object with these keys:",
            `rubricVersion: \"${rubricVersion}\"`,
            `judgePromptVersion: \"${judgePromptVersion}\"`,
            "totalScore: number",
            "confidence: number from 0 to 100",
            "needsHumanReview: boolean",
            "coachSummary: string",
            "axisScores: array of {axis, score, confidence, rationale, evidenceIds}",
            "findings: array of {id?, kind, severity, axis, targetKind, targetId, evidenceIds, confidence, title, explanation, replaySuggestion?}",
            "strengths: string[]",
            "improvements: string[]",
            "bottlenecks: array of {traceEventId?, label, severity, explanation, replaySuggestion}",
            "workflow: array of {title, summary, relatedTraceEventIds}",
            "nextPracticeTargets: string[]",
            "graphAnnotations: array of {targetTraceEventId?, targetKind?, kind, severity, axis?, scoreImpact?, confidence?, title, explanation, evidenceTraceEventIds}",
            "uncertaintyNotes: string[]",
            `Allowed axes: ${scoreAxisValues.join(", ")}`,
            "Allowed finding kinds: strength, bottleneck, risk, missed_opportunity",
            "Allowed finding severities: info, positive, watch, critical",
            "Allowed finding targetKind values: attempt, pair, prompt_node, response_node, status_node, edge, trace_event",
            `Allowed graph annotation kinds: ${graphAnnotationKindValues.join(", ")}`,
            "Allowed graph annotation severities: info, positive, watch, critical",
            "For confidence, use 0-1 or 0-100. The server will normalize it.",
          ].join("\n"),
        },
      ],
    });
    const parsed = llmJudgeSchema.parse(extractJsonObject(response.message));
    const report = normalizeLlmReport(input, config, parsed);

    return {
      report,
      summary: runSummary({
        attemptId: input.attemptId,
        status: "succeeded",
        judgeProvider: config.provider,
        judgeModel: config.model,
        judgeKind: "llm",
        startedAt,
        totalScore: report.totalScore,
        axisScores: report.axisScores,
      }),
    };
  } catch (error) {
    return {
      summary: runSummary({
        attemptId: input.attemptId,
        status: "failed",
        judgeProvider: config.provider,
        judgeModel: config.model,
        judgeKind: "llm",
        startedAt,
        error: error instanceof Error ? error.message : "Unknown judge error",
      }),
    };
  }
}

function uniqueStrings(values: string[], limit: number) {
  return Array.from(new Set(values.filter(Boolean))).slice(0, limit);
}

function detectDisagreement(reports: ScoreReport[], locale: ReportLocale) {
  const notes: string[] = [];

  if (reports.length < 2) {
    return notes;
  }

  const totals = reports.map((report) => report.totalScore);
  if (Math.max(...totals) - Math.min(...totals) >= 12) {
      notes.push(
        locale === "ko"
          ? `총점 차이가 ${Math.max(...totals) - Math.min(...totals)}점입니다. judge calibration이 필요합니다.`
          : `Total scores differ by ${Math.max(...totals) - Math.min(...totals)} points. Judge calibration is needed.`,
      );
  }

  for (const axis of scoreAxisValues) {
    const scores = reports
      .map((report) => report.axisScores.find((score) => score.axis === axis)?.score)
      .filter((score): score is number => typeof score === "number");

    if (scores.length >= 2 && Math.max(...scores) - Math.min(...scores) >= 15) {
      notes.push(
        locale === "ko"
          ? `${axisLabels[locale][axis]} 축에서 judge 간 점수 차이가 큽니다.`
          : `Judge scores differ significantly on ${axisLabels[locale][axis]}.`,
      );
    }
  }

  return notes.slice(0, 5);
}

function aggregateReports(input: JudgeInput, reports: ScoreReport[]): ScoreReport {
  const primary = reports.find((report) => report.judgeMode === "llm") ?? reports[0];
  const axisScores = defaultRubric.map((rubric) => {
    const values = reports
      .map((report) => report.axisScores.find((score) => score.axis === rubric.axis))
      .filter((score): score is AxisScore => Boolean(score));
    const average = values.reduce((sum, score) => sum + score.score, 0) / values.length;
    const primaryScore = primary.axisScores.find((score) => score.axis === rubric.axis);

    return {
      axis: rubric.axis,
      label: axisLabels[input.locale][rubric.axis],
      score: clampScore(average),
      rationale: primaryScore
        ? `${primaryScore.rationale} (ensemble average: ${Math.round(average)})`
        : input.locale === "ko"
          ? "앙상블 judge 평균으로 산출한 점수입니다."
          : "Score calculated from the ensemble judge average.",
    };
  });

  return {
    id: crypto.randomUUID(),
    attemptId: input.attemptId,
    problemId: input.problem.id,
    totalScore: weightedTotal(input.problem, axisScores),
    axisScores,
    coachSummary: primary.coachSummary,
    strengths: uniqueStrings(reports.flatMap((report) => report.strengths), 4),
    improvements: uniqueStrings(reports.flatMap((report) => report.improvements), 4),
    bottlenecks: primary.bottlenecks,
    workflow: primary.workflow,
    nextPracticeTargets: uniqueStrings(reports.flatMap((report) => report.nextPracticeTargets), 4),
    graphAnnotations: primary.graphAnnotations,
    judgeProvider: primary.judgeProvider,
    judgeModel: `ensemble(${reports.map((report) => report.judgeModel).join(",")})`,
    judgeMode: "ensemble",
    judgePromptVersion: primary.judgePromptVersion ?? judgePromptVersion,
    rubricVersion,
    confidence: reports.reduce((sum, report) => sum + (report.confidence ?? 0.65), 0) / reports.length,
    needsHumanReview: reports.some((report) => report.needsHumanReview) || detectDisagreement(reports, input.locale).length > 0,
    uncertaintyNotes: uniqueStrings(reports.flatMap((report) => report.uncertaintyNotes ?? []), 5),
    locale: input.locale,
    sourceLocale: input.locale,
    translationStatus: "source",
    createdAt: new Date().toISOString(),
  };
}

function withJudgeRuns(report: ScoreReport, mode: JudgeMode, runs: JudgeRunInternal[], disagreement: string[]) {
  return {
    ...report,
    judgeMode: mode,
    judgeRuns: runs.map((run) => run.summary),
    judgeDisagreement: disagreement,
  };
}

function withGraphAnnotations(input: JudgeInput, report: ScoreReport): ScoreReport {
  const graph = buildConversationGraph(input.trace, report, undefined, {
    problemMaterialCount: input.problem.materials.length,
  });

  return {
    ...report,
    graphAnnotations: graph.annotations,
  };
}

export async function judgeAttempt(input: JudgeInput): Promise<ScoreReport> {
  const evidenceGraph = buildConversationGraph(input.trace, undefined, undefined, {
    problemMaterialCount: input.problem.materials.length,
  });
  const evidence = buildJudgeEvidencePacket({
    attemptId: input.attemptId,
    problem: input.problem,
    trace: input.trace,
    finalAnswer: input.finalAnswer,
    graph: evidenceGraph,
  });
  const heuristicRun = runHeuristicJudge(input, evidence);
  const mode = getJudgeMode();

  if (mode === "heuristic") {
    return withGraphAnnotations(input, withJudgeRuns(heuristicRun.report as ScoreReport, "heuristic", [heuristicRun], []));
  }

  const llmRuns = await Promise.all(getLlmJudgeConfigs(mode).map((config) => runLlmJudge(input, config, evidence)));
  const allRuns = [heuristicRun, ...llmRuns];
  const successfulReports = allRuns.map((run) => run.report).filter((report): report is ScoreReport => Boolean(report));
  const successfulLlmReports = llmRuns.map((run) => run.report).filter((report): report is ScoreReport => Boolean(report));

  if (successfulLlmReports.length === 0) {
    return withGraphAnnotations(
      input,
      withJudgeRuns(heuristicRun.report as ScoreReport, "heuristic", allRuns, [
        input.locale === "ko"
          ? "LLM judge가 실패해 heuristic judge 결과를 사용했습니다."
          : "LLM judge failed, so the heuristic judge result was used.",
      ]),
    );
  }

  const report =
    mode === "ensemble" ? aggregateReports(input, successfulReports) : successfulLlmReports[0];
  const disagreement = detectDisagreement(successfulReports, input.locale);

  return withGraphAnnotations(input, withJudgeRuns(report, mode, allRuns, disagreement));
}
