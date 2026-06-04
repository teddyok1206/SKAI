import type {
  AxisScore,
  ConversationGraph,
  GraphSkeletonStep,
  PublishedAttempt,
  ScoreAxis,
  ScoreReport,
  TraceEvent,
} from "@/lib/types";

export interface IntelligenceMirrorSection {
  id: string;
  label: string;
  score?: number;
  summary: string;
}

export interface UniversalAttemptStep {
  id: string;
  label: string;
  value: string;
  detail: string;
}

export interface SkaiArtifactNode {
  id: "intent" | "materials" | "artifact";
  label: string;
  summary: string;
}

export interface SkaiArtifactTimelineStep {
  id: string;
  sequence: number;
  label: string;
  status: string;
}

export interface SkaiArtifact {
  id: string;
  title: string;
  headline: string;
  score: number;
  nodes: SkaiArtifactNode[];
  timeline: SkaiArtifactTimelineStep[];
  metrics: {
    prompts: number;
    responses: number;
    materials: number;
    bottlenecks: number;
    verifications: number;
  };
  signature: string;
}

export interface GraphTransitionLogEntry {
  id: string;
  sequence: number;
  promptTraceEventId: string;
  responseTraceEventId?: string;
  from: string;
  via: string;
  to: string;
  status: string;
  evidence: string[];
}

function compact(value: string | undefined, limit = 96) {
  const normalized = (value ?? "").replace(/\s+/g, " ").trim();

  if (!normalized) {
    return "";
  }

  if (normalized.length <= limit) {
    return normalized;
  }

  return `${normalized.slice(0, limit - 1)}…`;
}

function axisScore(report: ScoreReport, axis: ScoreAxis) {
  return report.axisScores.find((item) => item.axis === axis);
}

function averageScore(scores: Array<AxisScore | undefined>) {
  const validScores = scores.filter((score): score is AxisScore => Boolean(score));

  if (validScores.length === 0) {
    return undefined;
  }

  return Math.round(validScores.reduce((sum, score) => sum + score.score, 0) / validScores.length);
}

function firstUserEvent(trace: TraceEvent[]) {
  return trace.find((event) => event.role === "user");
}

function finalAssistantEvent(trace: TraceEvent[]) {
  return [...trace].reverse().find((event) => event.role === "assistant");
}

function attachmentCount(trace: TraceEvent[]) {
  return trace.reduce((sum, event) => sum + (event.attachments?.length ?? 0), 0);
}

function roleCount(skeleton: GraphSkeletonStep[], role: GraphSkeletonStep["role"]) {
  return skeleton.filter((step) => step.role === role).length;
}

function xmlEscape(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function buildIntelligenceMirror(report: ScoreReport): IntelligenceMirrorSection[] {
  const locale = report.locale ?? "ko";
  const intentScore = averageScore([axisScore(report, "problem_definition"), axisScore(report, "decomposition")]);
  const controlScore = averageScore([
    axisScore(report, "instruction_clarity"),
    axisScore(report, "adaptation"),
    axisScore(report, "efficiency"),
  ]);
  const verificationScore = axisScore(report, "verification")?.score;
  const artifactScore = axisScore(report, "final_quality")?.score;

  return [
    {
      id: "intent",
      label: "Intent",
      score: intentScore,
      summary:
        locale === "ko"
          ? "무엇을 해결할지 정하고, 문제를 모델이 다룰 수 있는 구조로 바꾼 정도입니다."
          : "How clearly the user chose what to solve and reshaped the problem into a model-usable structure.",
    },
    {
      id: "control",
      label: "Control",
      score: controlScore,
      summary:
        locale === "ko"
          ? "모델에게 일을 넘긴 뒤에도 방향, 조건, 비용, 중간 산출물을 붙잡은 정도입니다."
          : "How well the user kept control of direction, conditions, cost, and intermediate artifacts after involving the model.",
    },
    {
      id: "verification",
      label: "Verification",
      score: verificationScore,
      summary:
        locale === "ko"
          ? "AI의 그럴듯한 답을 그대로 받지 않고 근거, 한계, 오류 가능성을 점검한 정도입니다."
          : "How well the user checked evidence, limits, and possible errors instead of accepting plausible AI output.",
    },
    {
      id: "artifact",
      label: "Artifact",
      score: artifactScore,
      summary:
        locale === "ko"
          ? "의도와 자료가 최종 산출물로 얼마나 명료하게 수렴했는지 보여줍니다."
          : "How clearly intent and materials converged into the final artifact.",
    },
  ];
}

export function buildUniversalAttemptSummary(input: {
  attempt: PublishedAttempt;
  graph: ConversationGraph;
  skeleton: GraphSkeletonStep[];
}): UniversalAttemptStep[] {
  const { attempt, graph, skeleton } = input;
  const firstPrompt = firstUserEvent(attempt.trace);
  const finalResponse = finalAssistantEvent(attempt.trace);
  const materials = attachmentCount(attempt.trace);
  const verification = roleCount(skeleton, "verification");
  const bottleneck = graph.pairs.filter((pair) => pair.status === "bottleneck").length;

  return [
    {
      id: "problem",
      label: "문제",
      value: compact(firstPrompt?.content, 64) || "아직 문제를 잡은 프롬프트가 없습니다.",
      detail: "사용자가 처음 어떤 방향으로 문제를 붙잡았는지 봅니다.",
    },
    {
      id: "materials",
      label: "자료",
      value: materials > 0 ? `${materials}개 자료를 풀이에 연결` : "자료 첨부 없음",
      detail: "현실의 파일, 이미지, 로그, 표가 AI 입력에 실제로 들어갔는지 봅니다.",
    },
    {
      id: "process",
      label: "진행",
      value: `${graph.pairs.length}개 prompt-response pair`,
      detail: bottleneck > 0 ? `${bottleneck}개 병목이 흐름 안에서 감지되었습니다.` : "흐름이 큰 병목 없이 이어졌습니다.",
    },
    {
      id: "check",
      label: "확인",
      value: verification > 0 ? `${verification}번 검증 상태로 전환` : "검증 전환이 약함",
      detail: finalResponse ? `마지막 모델 응답: ${compact(finalResponse.content, 82)}` : "아직 모델 응답이 없습니다.",
    },
  ];
}

export function buildSkaiArtifact(input: {
  attempt: PublishedAttempt;
  graph: ConversationGraph;
  skeleton: GraphSkeletonStep[];
}): SkaiArtifact {
  const { attempt, graph, skeleton } = input;
  const firstPrompt = firstUserEvent(attempt.trace);
  const finalResponse = finalAssistantEvent(attempt.trace);
  const prompts = attempt.trace.filter((event) => event.role === "user").length;
  const responses = attempt.trace.filter((event) => event.role === "assistant").length;
  const materials = attachmentCount(attempt.trace);
  const bottlenecks = attempt.scoreReport.bottlenecks.length;
  const verifications = roleCount(skeleton, "verification");

  return {
    id: `artifact:${attempt.id}`,
    title: attempt.title,
    headline: "구조가 드러났습니다.",
    score: attempt.scoreReport.totalScore,
    nodes: [
      {
        id: "intent",
        label: "Intent",
        summary: compact(firstPrompt?.content, 92) || "사용자의 최초 문제 정의",
      },
      {
        id: "materials",
        label: "Materials",
        summary: materials > 0 ? `${materials}개 자료가 AI 입력에 연결됨` : "자료 없이 대화 trace만으로 진행",
      },
      {
        id: "artifact",
        label: "Artifact",
        summary: compact(finalResponse?.content, 92) || "최종 산출물은 아직 모델 응답에서 확인되지 않음",
      },
    ],
    timeline: skeleton.slice(0, 6).map((step) => ({
      id: step.id,
      sequence: step.sequence + 1,
      label: step.label,
      status: step.status,
    })),
    metrics: {
      prompts,
      responses,
      materials,
      bottlenecks,
      verifications,
    },
    signature: `${graph.promptNodes.filter((node) => !node.synthetic).length}P/${graph.responseNodes.filter((node) => !node.synthetic).length}R/${graph.statusNodes.length}S`,
  };
}

export function buildGraphTransitionLog(graph: ConversationGraph, trace: TraceEvent[]): GraphTransitionLogEntry[] {
  const traceById = new Map(trace.map((event) => [event.id, event]));
  const nodeById = new Map(
    [...graph.promptNodes, ...graph.responseNodes, ...graph.statusNodes].map((node) => [node.id, node]),
  );

  return graph.pairs.map((pair) => {
    const prompt = traceById.get(pair.promptTraceEventId);
    const response = pair.responseTraceEventId ? traceById.get(pair.responseTraceEventId) : undefined;
    const promptNode = nodeById.get(pair.promptNodeId);
    const responseNode = pair.responseNodeId ? nodeById.get(pair.responseNodeId) : undefined;

    return {
      id: `transition:${pair.id}`,
      sequence: pair.sequence + 1,
      promptTraceEventId: pair.promptTraceEventId,
      responseTraceEventId: pair.responseTraceEventId,
      from: promptNode?.label ?? `Prompt ${pair.sequence + 1}`,
      via: compact(prompt?.content, 72) || "user prompt",
      to: responseNode?.label ?? "Pending response",
      status: pair.status,
      evidence: [
        ...pair.statusReasons,
        response ? `response: ${compact(response.content, 72)}` : "no response node",
      ].slice(0, 4),
    };
  });
}

export function skaiArtifactToText(artifact: SkaiArtifact) {
  const nodeLines = artifact.nodes.map((node) => `${node.label}: ${node.summary}`).join("\n");
  const timelineLines = artifact.timeline
    .map((step) => `${step.sequence}. ${step.label} (${step.status})`)
    .join("\n");

  return [
    `SKAI Artifact: ${artifact.title}`,
    artifact.headline,
    `Score: ${artifact.score}`,
    `Graph signature: ${artifact.signature}`,
    nodeLines,
    timelineLines,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function skaiArtifactToSvg(artifact: SkaiArtifact) {
  const topSteps = artifact.timeline.slice(0, 4);
  const timelineText = topSteps
    .map(
      (step, index) =>
        `<text x="72" y="${338 + index * 24}" fill="#6e6e73" font-size="13">${xmlEscape(
          `${step.sequence}. ${step.label} / ${step.status}`,
        )}</text>`,
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
  <rect width="960" height="540" rx="28" fill="#f5f5f7"/>
  <rect x="40" y="40" width="880" height="460" rx="18" fill="#ffffff" stroke="#e5e5ea"/>
  <text x="72" y="92" fill="#087c7c" font-family="Inter, system-ui, sans-serif" font-size="14" font-weight="800">SKAI ARTIFACT</text>
  <text x="72" y="134" fill="#1d1d1f" font-family="Inter, system-ui, sans-serif" font-size="34" font-weight="900">${xmlEscape(
    artifact.headline,
  )}</text>
  <text x="72" y="166" fill="#6e6e73" font-family="Inter, system-ui, sans-serif" font-size="15">${xmlEscape(
    compact(artifact.title, 84),
  )}</text>
  <line x1="184" y1="235" x2="508" y2="270" stroke="#087c7c" stroke-width="3"/>
  <line x1="184" y1="305" x2="508" y2="270" stroke="#087c7c" stroke-width="3"/>
  <path d="M492 257L518 270L492 283" fill="none" stroke="#087c7c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="152" cy="235" r="34" fill="#e2f4f1" stroke="#087c7c" stroke-width="3"/>
  <circle cx="152" cy="305" r="34" fill="#e2f4f1" stroke="#087c7c" stroke-width="3"/>
  <circle cx="552" cy="270" r="42" fill="#1d1d1f" stroke="#087c7c" stroke-width="3"/>
  <text x="152" y="240" text-anchor="middle" fill="#075e63" font-size="13" font-weight="900">INTENT</text>
  <text x="152" y="310" text-anchor="middle" fill="#075e63" font-size="12" font-weight="900">MATERIAL</text>
  <text x="552" y="276" text-anchor="middle" fill="#ffffff" font-size="13" font-weight="900">ARTIFACT</text>
  <text x="640" y="238" fill="#1d1d1f" font-size="46" font-weight="900">${artifact.score}</text>
  <text x="640" y="266" fill="#6e6e73" font-size="13" font-weight="800">symbolic coach score</text>
  <text x="640" y="304" fill="#087c7c" font-size="18" font-weight="900">${xmlEscape(artifact.signature)}</text>
  <text x="640" y="330" fill="#6e6e73" font-size="13">prompts ${artifact.metrics.prompts} · responses ${artifact.metrics.responses} · materials ${artifact.metrics.materials}</text>
  <text x="72" y="306" fill="#1d1d1f" font-size="16" font-weight="900">Directed timeline</text>
  ${timelineText}
  <text x="72" y="468" fill="#6e6e73" font-size="12">Do not memorize prompts. Design the structure of work.</text>
</svg>`;
}
