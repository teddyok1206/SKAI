import type {
  ConversationGraph,
  ConversationGraphAnnotation,
  ConversationGraphEdge,
  ConversationGraphPair,
  GraphOverlayControls,
  GraphOverlayIndex,
  GraphOverlayLayer,
  GraphOverlaySeverity,
  GraphOverlaySignal,
  GraphOverlaySummary,
  GraphOverlayTarget,
} from "@/lib/types";

export const graphOverlaySchemaVersion = "graph-overlay.v0.sparse-index";

export const graphOverlayLayerOrder: GraphOverlayLayer[] = [
  "bottleneck",
  "weakEdge",
  "recovery",
  "verification",
  "materialGrounding",
  "modelBehavior",
  "costEfficiency",
];

export const defaultGraphOverlayControls: GraphOverlayControls = {
  enabled: true,
  layers: {
    bottleneck: true,
    weakEdge: true,
    verification: false,
    materialGrounding: false,
    recovery: true,
    modelBehavior: false,
    costEfficiency: false,
  },
};

export const graphOverlayLayerLabels: Record<GraphOverlayLayer, string> = {
  bottleneck: "병목",
  weakEdge: "약한 연결",
  verification: "검증",
  materialGrounding: "자료 사용",
  recovery: "회복",
  modelBehavior: "모델 행동",
  costEfficiency: "비용",
};

const severityRank: Record<GraphOverlaySeverity, number> = {
  neutral: 0,
  positive: 1,
  watch: 2,
  critical: 3,
};

const sourceRank: Record<ConversationGraphAnnotation["source"], number> = {
  deterministic: 1,
  heuristic_judge: 2,
  llm_judge: 3,
  human: 4,
};

function emptyLayerIndex() {
  return graphOverlayLayerOrder.reduce<Record<GraphOverlayLayer, string[]>>((acc, layer) => {
    acc[layer] = [];
    return acc;
  }, {} as Record<GraphOverlayLayer, string[]>);
}

function pushIndex(index: Record<string, string[]>, key: string | undefined, targetId: string) {
  if (!key) {
    return;
  }

  index[key] ??= [];
  index[key].push(targetId);
}

function pushNumberIndex(index: Record<number, string[]>, key: number | undefined, targetId: string) {
  if (typeof key !== "number") {
    return;
  }

  index[key] ??= [];
  index[key].push(targetId);
}

function normalizeSeverity(annotation: ConversationGraphAnnotation): GraphOverlaySeverity {
  if (annotation.kind === "bottleneck" && annotation.severity === "info") {
    return "watch";
  }

  if (annotation.kind === "recovery" || annotation.kind === "verification") {
    return annotation.severity === "critical" || annotation.severity === "watch" ? annotation.severity : "positive";
  }

  if (annotation.severity === "info") {
    return "neutral";
  }

  return annotation.severity;
}

function firstOverlayMapping(annotation: ConversationGraphAnnotation): {
  layer: GraphOverlayLayer;
  signal: GraphOverlaySignal;
  severity: GraphOverlaySeverity;
} {
  const severity = normalizeSeverity(annotation);

  if (annotation.kind === "bottleneck") {
    return { layer: "bottleneck", signal: "bottleneck_node", severity };
  }

  if (annotation.kind === "context_drift") {
    return { layer: "weakEdge", signal: "weak_edge", severity: severity === "positive" ? "watch" : severity };
  }

  if (annotation.kind === "verification") {
    return { layer: "verification", signal: "verification", severity };
  }

  if (annotation.kind === "material_grounding") {
    return { layer: "materialGrounding", signal: "material_grounding", severity };
  }

  if (annotation.kind === "recovery" || annotation.kind === "adaptation") {
    return { layer: "recovery", signal: "recovery", severity };
  }

  if (annotation.kind === "model_behavior") {
    return { layer: "modelBehavior", signal: "model_drift", severity: severity === "positive" ? "watch" : severity };
  }

  if (annotation.kind === "cost_efficiency") {
    return { layer: "costEfficiency", signal: "cost_anomaly", severity };
  }

  return { layer: "weakEdge", signal: "neutral", severity: "neutral" };
}

function pairById(pairs: ConversationGraphPair[]) {
  return new Map(pairs.map((pair) => [pair.id, pair]));
}

function pairByNodeId(pairs: ConversationGraphPair[]) {
  const index = new Map<string, ConversationGraphPair>();

  for (const pair of pairs) {
    index.set(pair.promptNodeId, pair);
    index.set(pair.statusNodeId, pair);

    if (pair.responseNodeId) {
      index.set(pair.responseNodeId, pair);
    }
  }

  return index;
}

function pairByEdgeId(edges: ConversationGraphEdge[], pairsById: Map<string, ConversationGraphPair>) {
  const index = new Map<string, ConversationGraphPair>();

  for (const edge of edges) {
    const pair = edge.pairId ? pairsById.get(edge.pairId) : undefined;

    if (pair) {
      index.set(edge.id, pair);
    }
  }

  return index;
}

function pairForAnnotation(
  annotation: ConversationGraphAnnotation,
  graph: ConversationGraph,
  pairsById: Map<string, ConversationGraphPair>,
  pairsByNodeId: Map<string, ConversationGraphPair>,
  pairsByEdgeId: Map<string, ConversationGraphPair>,
) {
  if (annotation.targetKind === "pair") {
    return pairsById.get(annotation.targetId);
  }

  if (annotation.targetKind === "node") {
    return pairsByNodeId.get(annotation.targetId);
  }

  if (annotation.targetKind === "edge") {
    return pairsByEdgeId.get(annotation.targetId);
  }

  for (const traceEventId of annotation.evidenceTraceEventIds) {
    const pairId = graph.index.pairByPromptTraceEventId[traceEventId] ?? graph.index.pairByResponseTraceEventId[traceEventId];
    const pair = pairId ? pairsById.get(pairId) : undefined;

    if (pair) {
      return pair;
    }
  }

  return undefined;
}

function targetIdForAnnotation(annotation: ConversationGraphAnnotation, pair?: ConversationGraphPair) {
  if (annotation.targetKind === "pair" || annotation.targetKind === "node" || annotation.targetKind === "edge") {
    return annotation.targetId;
  }

  return pair?.id ?? annotation.targetId;
}

function targetLabel(annotation: ConversationGraphAnnotation, layer: GraphOverlayLayer) {
  if (annotation.title.trim()) {
    return annotation.title;
  }

  return graphOverlayLayerLabels[layer];
}

function bestTarget(targets: GraphOverlayTarget[]) {
  return [...targets].sort((a, b) => {
    const severityDelta = severityRank[b.severity] - severityRank[a.severity];

    if (severityDelta !== 0) {
      return severityDelta;
    }

    const sourceDelta = sourceRank[b.source] - sourceRank[a.source];

    if (sourceDelta !== 0) {
      return sourceDelta;
    }

    return b.confidence - a.confidence;
  })[0];
}

function aggregateTargets(targets: GraphOverlayTarget[]): GraphOverlaySummary | undefined {
  if (targets.length === 0) {
    return undefined;
  }

  const best = bestTarget(targets);
  const layers = Array.from(new Set(targets.map((target) => target.layer))).sort(
    (a, b) => graphOverlayLayerOrder.indexOf(a) - graphOverlayLayerOrder.indexOf(b),
  );
  const signals = Array.from(new Set(targets.map((target) => target.signal)));
  const annotationIds = Array.from(new Set(targets.flatMap((target) => target.annotationIds)));
  const targetIds = Array.from(new Set(targets.map((target) => target.id)));
  const confidence = targets.reduce((sum, target) => sum + target.confidence, 0) / targets.length;

  return {
    severity: best.severity,
    layers,
    signals,
    targetIds,
    annotationIds,
    label: best.label,
    confidence: Number(confidence.toFixed(2)),
  };
}

function targetsForIds(index: GraphOverlayIndex, targetIds: string[]) {
  return targetIds.map((targetId) => index.targetsById[targetId]).filter((target): target is GraphOverlayTarget => Boolean(target));
}

function activeLayerSet(controls: GraphOverlayControls) {
  if (!controls.enabled) {
    return new Set<GraphOverlayLayer>();
  }

  return new Set(graphOverlayLayerOrder.filter((layer) => controls.layers[layer]));
}

export function mergeGraphOverlayControls(input: GraphOverlayControls): GraphOverlayControls {
  return {
    enabled: input.enabled,
    layers: {
      ...defaultGraphOverlayControls.layers,
      ...input.layers,
    },
  };
}

export function buildGraphOverlayIndex(graph: ConversationGraph): GraphOverlayIndex {
  const pairsById = pairById(graph.pairs);
  const pairsByNodeId = pairByNodeId(graph.pairs);
  const pairsByEdgeId = pairByEdgeId([...graph.promptEdges, ...graph.responseEdges, ...graph.statusEdges], pairsById);
  const index: GraphOverlayIndex = {
    schemaVersion: graphOverlaySchemaVersion,
    targetsById: {},
    targetIdsByGraphTargetId: {},
    targetIdsByPairId: {},
    targetIdsBySequence: {},
    targetIdsByLayer: emptyLayerIndex(),
    targetIdsByEdgeId: {},
    summaryByNodeId: {},
    summaryByEdgeId: {},
    summaryByPairId: {},
  };

  for (const annotation of graph.annotations) {
    const pair = pairForAnnotation(annotation, graph, pairsById, pairsByNodeId, pairsByEdgeId);
    const mapping = firstOverlayMapping(annotation);

    if (mapping.severity === "neutral" && mapping.signal === "neutral") {
      continue;
    }

    const targetId = targetIdForAnnotation(annotation, pair);
    const edgeId = annotation.targetKind === "edge" ? annotation.targetId : undefined;
    const overlayTarget: GraphOverlayTarget = {
      id: `overlay:${mapping.layer}:${annotation.id}`,
      targetKind: annotation.targetKind,
      targetId,
      layer: mapping.layer,
      pairId: pair?.id,
      sequence: pair?.sequence,
      edgeId,
      severity: mapping.severity,
      signal: mapping.signal,
      annotationIds: [annotation.id],
      source: annotation.source,
      confidence: annotation.confidence,
      label: targetLabel(annotation, mapping.layer),
      explanation: annotation.explanation,
    };

    index.targetsById[overlayTarget.id] = overlayTarget;
    pushIndex(index.targetIdsByGraphTargetId, targetId, overlayTarget.id);
    pushIndex(index.targetIdsByPairId, pair?.id, overlayTarget.id);
    pushNumberIndex(index.targetIdsBySequence, pair?.sequence, overlayTarget.id);
    index.targetIdsByLayer[mapping.layer].push(overlayTarget.id);

    if (edgeId) {
      pushIndex(index.targetIdsByEdgeId, edgeId, overlayTarget.id);
    }
  }

  for (const pair of graph.pairs) {
    const pairTargetIds = index.targetIdsByPairId[pair.id] ?? [];
    const pairTargets = targetsForIds(index, pairTargetIds);
    const pairSummary = aggregateTargets(pairTargets);

    if (pairSummary) {
      index.summaryByPairId[pair.id] = pairSummary;
    }

    for (const nodeId of [pair.promptNodeId, pair.statusNodeId, pair.responseNodeId]) {
      if (!nodeId) {
        continue;
      }

      const nodeTargetIds = Array.from(new Set([...(index.targetIdsByGraphTargetId[nodeId] ?? []), ...pairTargetIds]));
      const nodeSummary = aggregateTargets(targetsForIds(index, nodeTargetIds));

      if (nodeSummary) {
        index.summaryByNodeId[nodeId] = nodeSummary;
      }
    }
  }

  for (const edge of [...graph.promptEdges, ...graph.responseEdges, ...graph.statusEdges]) {
    const pairTargetIds = edge.pairId ? (index.targetIdsByPairId[edge.pairId] ?? []) : [];
    const edgeTargetIds = Array.from(new Set([...(index.targetIdsByEdgeId[edge.id] ?? []), ...pairTargetIds]));
    const edgeSummary = aggregateTargets(targetsForIds(index, edgeTargetIds));

    if (edgeSummary) {
      index.summaryByEdgeId[edge.id] = edgeSummary;
    }
  }

  return index;
}

export function filterGraphOverlaySummary(
  index: GraphOverlayIndex,
  summary: GraphOverlaySummary | undefined,
  controls: GraphOverlayControls,
): GraphOverlaySummary | undefined {
  if (!summary || !controls.enabled) {
    return undefined;
  }

  const activeLayers = activeLayerSet(controls);
  const visibleTargets = targetsForIds(index, summary.targetIds).filter((target) => activeLayers.has(target.layer));

  return aggregateTargets(visibleTargets);
}

export function hasActiveGraphOverlay(summary: GraphOverlaySummary | undefined) {
  return Boolean(summary && summary.severity !== "neutral");
}
