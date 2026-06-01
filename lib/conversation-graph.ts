import type {
  ConversationGraph,
  ConversationGraphEdge,
  ConversationGraphIndex,
  ConversationGraphNode,
  ConversationGraphPair,
  ConversationTaskStatus,
  Bottleneck,
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

function inferTaskStatus(
  prompt: TraceEvent,
  response: TraceEvent | undefined,
  bottleneckByTraceEventId: Map<string, Bottleneck>,
) {
  const reasons: string[] = [];
  const bottleneck = bottleneckByTraceEventId.get(prompt.id);

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
  const promptNodes: ConversationGraphNode[] = [];
  const responseNodes: ConversationGraphNode[] = [];
  const statusNodes: ConversationGraphNode[] = [];
  const promptEdges: ConversationGraphEdge[] = [];
  const responseEdges: ConversationGraphEdge[] = [];
  const statusEdges: ConversationGraphEdge[] = [];
  const pairs: ConversationGraphPair[] = [];
  const promptNodeByTraceEventId: Record<string, string> = {};
  const responseNodeByTraceEventId: Record<string, string> = {};
  const pairByPromptTraceEventId: Record<string, string> = {};
  const pairByResponseTraceEventId: Record<string, string> = {};
  const bottleneckByTraceEventId = new Map(
    scoreReport?.bottlenecks
      .filter((item): item is Bottleneck & { traceEventId: string } => Boolean(item.traceEventId))
      .map((item) => [item.traceEventId, item]) ?? [],
  );
  let promptSequence = 0;
  let responseSequence = 0;
  let lastResponseNodeId = `response-origin:${attemptId}`;
  let pendingPrompt:
    | {
        event: TraceEvent;
        nodeId: string;
        sequence: number;
        previousResponseNodeId: string;
        responseEvent?: TraceEvent;
        responseNodeId?: string;
      }
    | undefined;

  const responseOriginNode = node({
    id: lastResponseNodeId,
    kind: "response",
    label: "Response origin",
    summary: "Conversation state before the first model response.",
    sequence: -1,
    synthetic: true,
  });

  function finalizePrompt(input: {
    promptEvent: TraceEvent;
    promptNodeId: string;
    previousResponseNodeId: string;
    sequence: number;
    nextPromptNodeId: string;
    responseEvent?: TraceEvent;
    responseNodeId?: string;
  }) {
    const {
      promptEvent,
      promptNodeId,
      previousResponseNodeId,
      sequence,
      nextPromptNodeId,
      responseEvent,
      responseNodeId,
    } = input;
    const pairId = `pair:${promptEvent.id}:${responseEvent?.id ?? "pending"}`;
    const inferred = inferTaskStatus(promptEvent, responseEvent, bottleneckByTraceEventId);
    const statusNodeId = `status:${pairId}`;

    statusNodes.push(
      node({
        id: statusNodeId,
        kind: "task_status",
        pairId,
        label: inferred.status,
        summary: inferred.reasons.join("; "),
        sequence: input.sequence,
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
    pairByPromptTraceEventId[promptEvent.id] = pairId;
    if (responseEvent) {
      pairByResponseTraceEventId[responseEvent.id] = pairId;
    }

    if (responseEvent && responseNodeId) {
      promptEdges.push({
        id: edgeId("prompt-edge", pairId, "llm-response"),
        projection: "prompt_graph",
        sourceNodeId: promptNodeId,
        targetNodeId: nextPromptNodeId,
        traceEventId: responseEvent.id,
        pairId,
        dualNodeId: responseNodeId,
        label: compact(responseEvent.content, 80),
        sequence,
      });
      responseEdges.push({
        id: edgeId("response-edge", pairId, "user-prompt"),
        projection: "response_graph",
        sourceNodeId: previousResponseNodeId,
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
  }

  // Single-pass pairing: a prompt is finalized when the next prompt appears or the trace ends.
  for (const event of trace) {
    if (event.role === "user") {
      const promptNodeId = `prompt:${event.id}`;
      promptNodes.push(
        node({
          id: promptNodeId,
          kind: "prompt",
          traceEventId: event.id,
          label: `Prompt ${promptSequence + 1}`,
          summary: compact(event.content),
          sequence: promptSequence,
        }),
      );
      promptNodeByTraceEventId[event.id] = promptNodeId;

      if (pendingPrompt) {
        finalizePrompt({
          promptEvent: pendingPrompt.event,
          promptNodeId: pendingPrompt.nodeId,
          previousResponseNodeId: pendingPrompt.previousResponseNodeId,
          sequence: pendingPrompt.sequence,
          nextPromptNodeId: promptNodeId,
          responseEvent: pendingPrompt.responseEvent,
          responseNodeId: pendingPrompt.responseNodeId,
        });
      }

      pendingPrompt = {
        event,
        nodeId: promptNodeId,
        sequence: promptSequence,
        previousResponseNodeId: lastResponseNodeId,
      };
      promptSequence += 1;
    }

    if (event.role === "assistant") {
      const responseNodeId = `response:${event.id}`;
      responseNodes.push(
        node({
          id: responseNodeId,
          kind: "response",
          traceEventId: event.id,
          label: `Response ${responseSequence + 1}`,
          summary: compact(event.content),
          sequence: responseSequence,
        }),
      );
      responseNodeByTraceEventId[event.id] = responseNodeId;

      if (pendingPrompt && !pendingPrompt.responseEvent) {
        pendingPrompt = {
          ...pendingPrompt,
          responseEvent: event,
          responseNodeId,
        };
      }

      lastResponseNodeId = responseNodeId;
      responseSequence += 1;
    }
  }

  const promptTerminalNode = node({
    id: `prompt-terminal:${attemptId}`,
    kind: "prompt",
    label: "Prompt terminal",
    summary: "No later user prompt in this branch.",
    sequence: promptNodes.length,
    synthetic: true,
  });

  if (pendingPrompt) {
    finalizePrompt({
      promptEvent: pendingPrompt.event,
      promptNodeId: pendingPrompt.nodeId,
      previousResponseNodeId: pendingPrompt.previousResponseNodeId,
      sequence: pendingPrompt.sequence,
      nextPromptNodeId: promptTerminalNode.id,
      responseEvent: pendingPrompt.responseEvent,
      responseNodeId: pendingPrompt.responseNodeId,
    });
  }

  const allPromptNodes = promptNodes.length > 0 ? [...promptNodes, promptTerminalNode] : promptNodes;
  const allResponseNodes = responseNodes.length > 0 ? [responseOriginNode, ...responseNodes] : responseNodes;
  const index: ConversationGraphIndex = {
    promptNodeByTraceEventId,
    responseNodeByTraceEventId,
    pairByPromptTraceEventId,
    pairByResponseTraceEventId,
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
