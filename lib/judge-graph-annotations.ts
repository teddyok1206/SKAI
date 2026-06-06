import { buildConversationGraph } from "@/lib/conversation-graph";
import { conversationGraphSchemaVersion } from "@/lib/graph-annotations";
import type {
  ConversationGraph,
  ConversationGraphAnnotation,
  ConversationGraphAnnotationKind,
  ConversationGraphAnnotationSeverity,
  ConversationGraphAnnotationTargetKind,
  ScoreAxis,
  ScoreReport,
  TraceEvent,
} from "@/lib/types";

export interface RawJudgeGraphAnnotation {
  targetTraceEventId?: string;
  targetKind?: "attempt" | "pair" | "node" | "edge" | "trace_event" | "prompt_node" | "response_node" | "status_node";
  targetId?: string;
  kind: ConversationGraphAnnotationKind;
  severity: ConversationGraphAnnotationSeverity;
  axis?: ScoreAxis;
  scoreImpact?: number;
  confidence?: number;
  title: string;
  explanation: string;
  evidenceTraceEventIds: string[];
}

function clampConfidence(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0.72;
  }

  const normalized = value > 1 ? value / 100 : value;
  return Math.max(0, Math.min(1, normalized));
}

function compact(value: string, limit: number) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= limit) {
    return normalized;
  }

  return `${normalized.slice(0, limit - 1)}…`;
}

function targetForTraceEvent(input: {
  graph: ConversationGraph;
  traceEventId: string;
  preferredTargetKind: "pair" | "node";
}): { targetKind: ConversationGraphAnnotationTargetKind; targetId: string } | undefined {
  const pairId =
    input.graph.index.pairByPromptTraceEventId[input.traceEventId] ??
    input.graph.index.pairByResponseTraceEventId[input.traceEventId];
  const nodeId =
    input.graph.index.promptNodeByTraceEventId[input.traceEventId] ??
    input.graph.index.responseNodeByTraceEventId[input.traceEventId];

  if (input.preferredTargetKind === "node" && nodeId) {
    return {
      targetKind: "node",
      targetId: nodeId,
    };
  }

  if (pairId) {
    return {
      targetKind: "pair",
      targetId: pairId,
    };
  }

  if (nodeId) {
    return {
      targetKind: "node",
      targetId: nodeId,
    };
  }

  return undefined;
}

function isKnownGraphTarget(graph: ConversationGraph, targetKind: string | undefined, targetId: string | undefined) {
  if (!targetKind || !targetId) {
    return false;
  }

  if (targetKind === "pair") {
    return graph.pairs.some((pair) => pair.id === targetId);
  }

  if (targetKind === "edge") {
    return [...graph.promptEdges, ...graph.responseEdges, ...graph.statusEdges].some((edge) => edge.id === targetId);
  }

  if (targetKind === "node" || targetKind === "prompt_node" || targetKind === "response_node" || targetKind === "status_node") {
    return [...graph.promptNodes, ...graph.responseNodes, ...graph.statusNodes].some((node) => node.id === targetId);
  }

  return false;
}

function normalizeDirectTarget(input: {
  graph: ConversationGraph;
  targetKind: RawJudgeGraphAnnotation["targetKind"];
  targetId?: string;
}): { targetKind: ConversationGraphAnnotationTargetKind; targetId: string } | undefined {
  if (!input.targetKind || !input.targetId || !isKnownGraphTarget(input.graph, input.targetKind, input.targetId)) {
    return undefined;
  }

  if (input.targetKind === "pair") {
    return {
      targetKind: "pair",
      targetId: input.targetId,
    };
  }

  if (input.targetKind === "edge") {
    return {
      targetKind: "edge",
      targetId: input.targetId,
    };
  }

  if (input.targetKind === "node" || input.targetKind === "prompt_node" || input.targetKind === "response_node" || input.targetKind === "status_node") {
    return {
      targetKind: "node",
      targetId: input.targetId,
    };
  }

  return undefined;
}

export function normalizeJudgeGraphAnnotations(input: {
  attemptId: string;
  trace: TraceEvent[];
  scoreReport: ScoreReport;
  rawAnnotations: RawJudgeGraphAnnotation[];
  problemMaterialCount?: number;
}): ConversationGraphAnnotation[] {
  if (input.rawAnnotations.length === 0) {
    return [];
  }

  const traceEventIds = new Set(input.trace.map((event) => event.id));
  const graph = buildConversationGraph(input.trace, input.scoreReport, undefined, {
    problemMaterialCount: input.problemMaterialCount,
  });
  const normalized: ConversationGraphAnnotation[] = [];

  for (const [index, raw] of input.rawAnnotations.slice(0, 12).entries()) {
    const evidenceTraceEventIds = raw.evidenceTraceEventIds.filter((traceEventId) => traceEventIds.has(traceEventId)).slice(0, 6);
    const targetTraceEventId =
      raw.targetTraceEventId && traceEventIds.has(raw.targetTraceEventId)
        ? raw.targetTraceEventId
        : evidenceTraceEventIds[0];
    const directTarget = normalizeDirectTarget({
      graph,
      targetKind: raw.targetKind,
      targetId: raw.targetId,
    });
    const target = directTarget ?? (targetTraceEventId
      ? targetForTraceEvent({
          graph,
          traceEventId: targetTraceEventId,
          preferredTargetKind: raw.targetKind === "node" ? "node" : "pair",
        })
      : undefined);

    if (!target) {
      continue;
    }

    normalized.push({
      id: `annotation:${raw.kind}:${target.targetKind}:${target.targetId}:llm:${targetTraceEventId ?? "direct"}:${index}`,
      attemptId: input.attemptId,
      graphSchemaVersion: conversationGraphSchemaVersion,
      targetKind: target.targetKind,
      targetId: target.targetId,
      kind: raw.kind,
      severity: raw.severity,
      axis: raw.axis,
      scoreImpact: raw.scoreImpact,
      confidence: clampConfidence(raw.confidence),
      title: compact(raw.title, 120),
      explanation: compact(raw.explanation, 900),
      evidenceTraceEventIds: evidenceTraceEventIds.length > 0 ? evidenceTraceEventIds : targetTraceEventId ? [targetTraceEventId] : [],
      source: "llm_judge",
      createdAt: input.scoreReport.createdAt,
    });
  }

  return normalized;
}
