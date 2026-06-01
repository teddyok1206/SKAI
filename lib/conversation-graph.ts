import type {
  ConversationGraph,
  ConversationGraphEdge,
  ConversationGraphIndex,
  ConversationGraphNode,
  ConversationGraphPair,
  ConversationTaskStatus,
  ScoreReport,
  TraceEvent,
} from "@/lib/types";

function compact(value: string, limit = 120) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= limit) {
    return normalized;
  }

  return `${normalized.slice(0, limit - 1)}…`;
}

function includesAny(value: string, words: string[]) {
  const normalized = value.toLowerCase();
  return words.some((word) => normalized.includes(word.toLowerCase()));
}

function edgeId(prefix: string, pairId: string, suffix: string) {
  return `${prefix}:${pairId}:${suffix}`;
}

function ensureIncidence(index: ConversationGraphIndex, nodeId: string) {
  index.incidence[nodeId] ??= { incoming: [], outgoing: [] };
}

function addEdgeToIndex(index: ConversationGraphIndex, edge: ConversationGraphEdge) {
  index.adjacency[edge.sourceNodeId] ??= [];
  index.adjacency[edge.sourceNodeId].push(edge.targetNodeId);
  ensureIncidence(index, edge.sourceNodeId);
  ensureIncidence(index, edge.targetNodeId);
  index.incidence[edge.sourceNodeId].outgoing.push(edge.id);
  index.incidence[edge.targetNodeId].incoming.push(edge.id);
}

function inferTaskStatus(prompt: TraceEvent, response: TraceEvent | undefined, scoreReport: ScoreReport | undefined) {
  const reasons: string[] = [];
  const bottleneck = scoreReport?.bottlenecks.find((item) => item.traceEventId === prompt.id);

  if (bottleneck) {
    reasons.push(`bottleneck: ${bottleneck.label}`);
    return { status: "bottleneck" as const, reasons };
  }

  if (includesAny(prompt.content, ["검증", "확인", "근거", "출처", "오류", "한계", "반례"])) {
    reasons.push("verification prompt signal");
    return { status: "verification" as const, reasons };
  }

  if ((prompt.attachments?.length ?? 0) > 0) {
    reasons.push("material attached to prompt");
    return { status: "material_used" as const, reasons };
  }

  if (response) {
    reasons.push("model response received");
    return { status: "responded" as const, reasons };
  }

  reasons.push("waiting for model response");
  return { status: "pending" as const, reasons };
}

function node(
  input: Pick<ConversationGraphNode, "id" | "kind" | "label" | "summary" | "sequence"> &
    Partial<Pick<ConversationGraphNode, "traceEventId" | "pairId" | "synthetic">>,
): ConversationGraphNode {
  return input;
}

export function buildConversationGraph(trace: TraceEvent[], scoreReport?: ScoreReport): ConversationGraph {
  const attemptId = trace[0]?.attemptId ?? scoreReport?.attemptId ?? "unknown-attempt";
  const userEvents = trace.filter((event) => event.role === "user");
  const assistantEvents = trace.filter((event) => event.role === "assistant");
  const promptNodes: ConversationGraphNode[] = userEvents.map((event, index) =>
    node({
      id: `prompt:${event.id}`,
      kind: "prompt",
      traceEventId: event.id,
      label: `Prompt ${index + 1}`,
      summary: compact(event.content),
      sequence: index,
    }),
  );
  const responseNodes: ConversationGraphNode[] = assistantEvents.map((event, index) =>
    node({
      id: `response:${event.id}`,
      kind: "response",
      traceEventId: event.id,
      label: `Response ${index + 1}`,
      summary: compact(event.content),
      sequence: index,
    }),
  );

  const promptTerminalNode = node({
    id: `prompt-terminal:${attemptId}`,
    kind: "prompt",
    label: "Prompt terminal",
    summary: "No later user prompt in this branch.",
    sequence: promptNodes.length,
    synthetic: true,
  });
  const responseOriginNode = node({
    id: `response-origin:${attemptId}`,
    kind: "response",
    label: "Response origin",
    summary: "Conversation state before the first model response.",
    sequence: -1,
    synthetic: true,
  });

  const promptNodeByTraceId = new Map(promptNodes.map((item) => [item.traceEventId, item.id]));
  const responseNodeByTraceId = new Map(responseNodes.map((item) => [item.traceEventId, item.id]));
  const statusNodes: ConversationGraphNode[] = [];
  const promptEdges: ConversationGraphEdge[] = [];
  const responseEdges: ConversationGraphEdge[] = [];
  const statusEdges: ConversationGraphEdge[] = [];
  const pairs: ConversationGraphPair[] = [];

  userEvents.forEach((promptEvent, sequence) => {
    const promptTraceIndex = trace.findIndex((event) => event.id === promptEvent.id);
    const nextPromptTraceIndex = trace.findIndex((event, index) => index > promptTraceIndex && event.role === "user");
    const responseEvent = trace
      .slice(promptTraceIndex + 1, nextPromptTraceIndex === -1 ? undefined : nextPromptTraceIndex)
      .find((event) => event.role === "assistant");
    const promptNodeId = promptNodeByTraceId.get(promptEvent.id) as string;
    const responseNodeId = responseEvent ? responseNodeByTraceId.get(responseEvent.id) : undefined;
    const pairId = `pair:${promptEvent.id}:${responseEvent?.id ?? "pending"}`;
    const inferred = inferTaskStatus(promptEvent, responseEvent, scoreReport);
    const statusNodeId = `status:${pairId}`;
    const nextPrompt = userEvents[sequence + 1];
    const nextPromptNodeId = nextPrompt ? promptNodeByTraceId.get(nextPrompt.id) : promptTerminalNode.id;
    const previousResponse = [...assistantEvents].reverse().find((event) => {
      const responseTraceIndex = trace.findIndex((traceEvent) => traceEvent.id === event.id);
      return responseTraceIndex < promptTraceIndex;
    });
    const previousResponseNodeId = previousResponse ? responseNodeByTraceId.get(previousResponse.id) : responseOriginNode.id;

    statusNodes.push(
      node({
        id: statusNodeId,
        kind: "task_status",
        pairId,
        label: inferred.status,
        summary: inferred.reasons.join("; "),
        sequence,
      }),
    );

    pairs.push({
      id: pairId,
      sequence,
      promptNodeId,
      responseNodeId,
      statusNodeId,
      promptTraceEventId: promptEvent.id,
      responseTraceEventId: responseEvent?.id,
      status: inferred.status satisfies ConversationTaskStatus,
      statusReasons: inferred.reasons,
    });

    if (responseEvent && responseNodeId) {
      promptEdges.push({
        id: edgeId("prompt-edge", pairId, "llm-response"),
        projection: "prompt_graph",
        sourceNodeId: promptNodeId,
        targetNodeId: nextPromptNodeId as string,
        traceEventId: responseEvent.id,
        pairId,
        dualNodeId: responseNodeId,
        label: compact(responseEvent.content, 80),
        sequence,
      });
      responseEdges.push({
        id: edgeId("response-edge", pairId, "user-prompt"),
        projection: "response_graph",
        sourceNodeId: previousResponseNodeId as string,
        targetNodeId: responseNodeId,
        traceEventId: promptEvent.id,
        pairId,
        dualNodeId: promptNodeId,
        label: compact(promptEvent.content, 80),
        sequence,
      });
      statusEdges.push({
        id: edgeId("status-edge", pairId, "status-response"),
        projection: "status_layer",
        sourceNodeId: statusNodeId,
        targetNodeId: responseNodeId,
        traceEventId: responseEvent.id,
        pairId,
        dualNodeId: promptNodeId,
        label: "status -> response",
        sequence,
      });
    }

    statusEdges.push({
      id: edgeId("status-edge", pairId, "prompt-status"),
      projection: "status_layer",
      sourceNodeId: promptNodeId,
      targetNodeId: statusNodeId,
      traceEventId: promptEvent.id,
      pairId,
      dualNodeId: responseNodeId,
      label: "prompt -> status",
      sequence,
    });
  });

  const allPromptNodes = promptNodes.length > 0 ? [...promptNodes, promptTerminalNode] : promptNodes;
  const allResponseNodes = responseNodes.length > 0 ? [responseOriginNode, ...responseNodes] : responseNodes;
  const index: ConversationGraphIndex = {
    promptNodeByTraceEventId: Object.fromEntries(promptNodes.map((item) => [item.traceEventId as string, item.id])),
    responseNodeByTraceEventId: Object.fromEntries(responseNodes.map((item) => [item.traceEventId as string, item.id])),
    pairByPromptTraceEventId: Object.fromEntries(pairs.map((item) => [item.promptTraceEventId, item.id])),
    pairByResponseTraceEventId: Object.fromEntries(
      pairs.filter((item) => item.responseTraceEventId).map((item) => [item.responseTraceEventId as string, item.id]),
    ),
    adjacency: {},
    incidence: {},
  };

  [...allPromptNodes, ...allResponseNodes, ...statusNodes].forEach((item) => ensureIncidence(index, item.id));
  [...promptEdges, ...responseEdges, ...statusEdges].forEach((edge) => addEdgeToIndex(index, edge));

  return {
    attemptId,
    promptNodes: allPromptNodes,
    responseNodes: allResponseNodes,
    statusNodes,
    promptEdges,
    responseEdges,
    statusEdges,
    pairs,
    index,
  };
}
