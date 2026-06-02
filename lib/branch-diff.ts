import { buildConversationGraph } from "@/lib/conversation-graph";
import type {
  Attempt,
  BranchDiff,
  BranchProcessDelta,
  BranchPromptChange,
  BranchResponseChange,
  BranchScoreDelta,
  ConversationGraph,
  ConversationGraphAnnotation,
  GraphAnnotationDelta,
  GraphStateSnapshot,
  GraphStateSnapshotAnnotation,
  GraphStateTransition,
  ScoreAxis,
  TraceEvent,
} from "@/lib/types";

const signalDefinitions = [
  { label: "goal", keywords: ["목표", "성공", "원하는", "해야", "해결", "goal"] },
  { label: "constraint", keywords: ["제약", "조건", "반드시", "하지마", "금지", "constraint"] },
  { label: "material", keywords: ["자료", "파일", "영수증", "xlsx", "csv", "이미지", "첨부", "material"] },
  { label: "decomposition", keywords: ["단계", "task", "태스크", "분해", "쪼개", "workflow", "순서"] },
  { label: "output", keywords: ["출력", "형식", "표", "json", "목록", "양식", "format"] },
  { label: "verification", keywords: ["검증", "확인", "근거", "출처", "오류", "한계", "반례"] },
  { label: "efficiency", keywords: ["비용", "토큰", "시간", "간결", "우선순위", "효율"] },
] as const;

function compact(value = "", limit = 320) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= limit) {
    return normalized;
  }

  return `${normalized.slice(0, limit - 3)}...`;
}

function eventTokens(trace: TraceEvent[]) {
  const explicit = trace.reduce((sum, event) => sum + (event.usageInputTokens ?? 0) + (event.usageOutputTokens ?? 0), 0);

  if (explicit > 0) {
    return explicit;
  }

  return Math.ceil(trace.reduce((sum, event) => sum + event.content.length, 0) / 4);
}

function attachmentCount(trace: TraceEvent[]) {
  return trace.reduce((sum, event) => sum + (event.attachments?.length ?? 0), 0);
}

function userTurns(trace: TraceEvent[]) {
  return trace.filter((event) => event.role === "user").length;
}

function signals(value = "") {
  const normalized = value.toLowerCase();
  return signalDefinitions
    .filter((signal) => signal.keywords.some((keyword) => normalized.includes(keyword.toLowerCase())))
    .map((signal) => signal.label);
}

function firstVerificationIndex(trace: TraceEvent[]) {
  return trace.findIndex((event) => event.role === "user" && signals(event.content).includes("verification"));
}

function firstAfter(trace: TraceEvent[], startIndex: number, role: TraceEvent["role"]) {
  return trace.slice(startIndex + 1).find((event) => event.role === role);
}

function firstAssistantReply(trace: TraceEvent[], prompt?: TraceEvent) {
  const promptIndex = indexOfEvent(trace, prompt);

  if (promptIndex < 0) {
    return undefined;
  }

  for (const event of trace.slice(promptIndex + 1)) {
    if (event.role === "user") {
      return undefined;
    }

    if (event.role === "assistant") {
      return event;
    }
  }

  return undefined;
}

function indexOfEvent(trace: TraceEvent[], event?: TraceEvent) {
  if (!event) {
    return -1;
  }

  return trace.findIndex((item) => item.id === event.id);
}

function semanticDelta(before?: string, after?: string) {
  const beforeSignals = new Set(signals(before));
  const afterSignals = new Set(signals(after));
  const added = [...afterSignals].filter((signal) => !beforeSignals.has(signal));
  const removed = [...beforeSignals].filter((signal) => !afterSignals.has(signal));
  const notes: string[] = [];

  notes.push(...added.map((signal) => `added ${signal} signal`));
  notes.push(...removed.map((signal) => `removed ${signal} signal`));

  if ((after?.length ?? 0) > (before?.length ?? 0) * 1.25 + 40) {
    notes.push("replacement prompt is materially more specific");
  }

  if ((after?.length ?? 0) + 40 < (before?.length ?? 0) * 0.75) {
    notes.push("replacement prompt is materially shorter");
  }

  return notes.length > 0 ? notes : ["no strong deterministic prompt signal change"];
}

function observedResponseChange(before?: string, after?: string) {
  const notes: string[] = [];
  const beforeSignals = new Set(signals(before));
  const afterSignals = new Set(signals(after));

  if ([...afterSignals].some((signal) => !beforeSignals.has(signal))) {
    notes.push("child response introduced new orchestration signals");
  }

  if ((after?.length ?? 0) > (before?.length ?? 0) * 1.2 + 80) {
    notes.push("child response is more developed");
  }

  if ((after?.length ?? 0) + 80 < (before?.length ?? 0) * 0.8) {
    notes.push("child response is more concise");
  }

  return notes.length > 0 ? notes : ["no strong deterministic response signal change"];
}

function buildProcessDelta(parentAttempt: Attempt, childAttempt: Attempt): BranchProcessDelta {
  const parentVerificationIndex = firstVerificationIndex(parentAttempt.trace);
  const childVerificationIndex = firstVerificationIndex(childAttempt.trace);
  const parentAttachmentCount = attachmentCount(parentAttempt.trace);
  const childAttachmentCount = attachmentCount(childAttempt.trace);
  const parentTokenEstimate = eventTokens(parentAttempt.trace);
  const childTokenEstimate = eventTokens(childAttempt.trace);
  const parentUserTurns = userTurns(parentAttempt.trace);
  const childUserTurns = userTurns(childAttempt.trace);

  return {
    parentUserTurns,
    childUserTurns,
    turnDelta: childUserTurns - parentUserTurns,
    parentTokenEstimate,
    childTokenEstimate,
    tokenDelta: childTokenEstimate - parentTokenEstimate,
    parentAttachmentCount,
    childAttachmentCount,
    materialUseChanged: parentAttachmentCount !== childAttachmentCount,
    verificationMovedEarlier:
      childVerificationIndex >= 0 && (parentVerificationIndex < 0 || childVerificationIndex <= parentVerificationIndex),
  };
}

function buildScoreDelta(parentAttempt: Attempt, childAttempt: Attempt): BranchScoreDelta | undefined {
  if (!parentAttempt.scoreReport && !childAttempt.scoreReport) {
    return undefined;
  }

  const axes = new Map<ScoreAxis, { label: string; parentScore?: number; childScore?: number }>();

  for (const score of parentAttempt.scoreReport?.axisScores ?? []) {
    axes.set(score.axis, { label: score.label, parentScore: score.score });
  }

  for (const score of childAttempt.scoreReport?.axisScores ?? []) {
    const existing = axes.get(score.axis);
    axes.set(score.axis, {
      label: existing?.label ?? score.label,
      parentScore: existing?.parentScore,
      childScore: score.score,
    });
  }

  return {
    parentTotalScore: parentAttempt.scoreReport?.totalScore,
    childTotalScore: childAttempt.scoreReport?.totalScore,
    totalDelta:
      parentAttempt.scoreReport && childAttempt.scoreReport
        ? childAttempt.scoreReport.totalScore - parentAttempt.scoreReport.totalScore
        : undefined,
    axisDeltas: [...axes.entries()].map(([axis, value]) => ({
      axis,
      label: value.label,
      parentScore: value.parentScore,
      childScore: value.childScore,
      delta:
        typeof value.parentScore === "number" && typeof value.childScore === "number"
          ? value.childScore - value.parentScore
          : undefined,
    })),
  };
}

function graphPairIdForTraceEvent(graph: ConversationGraph, traceEventId?: string) {
  if (!traceEventId) {
    return undefined;
  }

  return graph.index.pairByPromptTraceEventId[traceEventId] ?? graph.index.pairByResponseTraceEventId[traceEventId];
}

function graphAnnotationKey(annotation: GraphStateSnapshotAnnotation) {
  return `${annotation.kind}:${annotation.severity}:${annotation.title}`;
}

function graphAnnotationSnapshot(annotation: ConversationGraphAnnotation): GraphStateSnapshotAnnotation {
  return {
    id: annotation.id,
    kind: annotation.kind,
    severity: annotation.severity,
    title: annotation.title,
    source: annotation.source,
    scoreImpact: annotation.scoreImpact,
    confidence: annotation.confidence,
  };
}

function graphAnnotationsForPair(graph: ConversationGraph, pairId?: string) {
  const pair = pairId ? graph.pairs.find((item) => item.id === pairId) : undefined;

  if (!pair) {
    return [];
  }

  const annotationById = new Map(graph.annotations.map((annotation) => [annotation.id, annotation]));
  const annotationIds = new Set<string>();

  for (const targetId of [pair.id, pair.promptNodeId, pair.statusNodeId, pair.responseNodeId]) {
    if (!targetId) {
      continue;
    }

    for (const annotationId of graph.index.annotationIdsByTargetId[targetId] ?? []) {
      annotationIds.add(annotationId);
    }
  }

  for (const traceEventId of [pair.promptTraceEventId, pair.responseTraceEventId]) {
    if (!traceEventId) {
      continue;
    }

    for (const annotationId of graph.index.annotationIdsByTraceEventId[traceEventId] ?? []) {
      annotationIds.add(annotationId);
    }
  }

  return [...annotationIds]
    .map((annotationId) => annotationById.get(annotationId))
    .filter((annotation): annotation is ConversationGraphAnnotation => Boolean(annotation));
}

function directedDegreeForPair(graph: ConversationGraph, pairId?: string) {
  const pair = pairId ? graph.pairs.find((item) => item.id === pairId) : undefined;
  const incoming = new Set<string>();
  const outgoing = new Set<string>();

  if (!pair) {
    return { incoming: 0, outgoing: 0 };
  }

  for (const nodeId of [pair.promptNodeId, pair.statusNodeId, pair.responseNodeId]) {
    if (!nodeId) {
      continue;
    }

    const incidence = graph.index.incidence[nodeId];
    incidence?.incoming.forEach((edgeId) => incoming.add(edgeId));
    incidence?.outgoing.forEach((edgeId) => outgoing.add(edgeId));
  }

  return {
    incoming: incoming.size,
    outgoing: outgoing.size,
  };
}

function uniqueAnnotationKinds(annotations: GraphStateSnapshotAnnotation[]) {
  return Array.from(new Set(annotations.map((annotation) => annotation.kind)));
}

function buildGraphStateSnapshot(graph: ConversationGraph, pairId?: string): GraphStateSnapshot {
  const pair = pairId ? graph.pairs.find((item) => item.id === pairId) : undefined;

  if (!pair) {
    return {
      attemptId: graph.attemptId,
      statusReasons: [],
      directedDegree: { incoming: 0, outgoing: 0 },
      annotationIds: [],
      annotationKinds: [],
      annotations: [],
      summary: "No comparable graph pair found at this replay point.",
      missing: true,
    };
  }

  const annotations = graphAnnotationsForPair(graph, pair.id).map(graphAnnotationSnapshot);

  return {
    attemptId: graph.attemptId,
    pairId: pair.id,
    promptNodeId: pair.promptNodeId,
    statusNodeId: pair.statusNodeId,
    responseNodeId: pair.responseNodeId,
    promptTraceEventId: pair.promptTraceEventId,
    responseTraceEventId: pair.responseTraceEventId,
    status: pair.status,
    statusReasons: pair.statusReasons,
    directedDegree: directedDegreeForPair(graph, pair.id),
    annotationIds: annotations.map((annotation) => annotation.id),
    annotationKinds: uniqueAnnotationKinds(annotations),
    annotations,
    summary: `Pair ${pair.sequence + 1}: ${pair.status}${pair.isBreakpoint ? " / replay breakpoint" : ""}`,
  };
}

function buildGraphAnnotationDelta(before: GraphStateSnapshot, after: GraphStateSnapshot): GraphAnnotationDelta {
  const beforeByKey = new Map(before.annotations.map((annotation) => [graphAnnotationKey(annotation), annotation]));
  const afterByKey = new Map(after.annotations.map((annotation) => [graphAnnotationKey(annotation), annotation]));

  return {
    added: after.annotations.filter((annotation) => !beforeByKey.has(graphAnnotationKey(annotation))),
    removed: before.annotations.filter((annotation) => !afterByKey.has(graphAnnotationKey(annotation))),
    persisted: after.annotations.filter((annotation) => beforeByKey.has(graphAnnotationKey(annotation))),
  };
}

function annotationListLabel(annotations: GraphStateSnapshotAnnotation[], prefix: string) {
  if (annotations.length === 0) {
    return undefined;
  }

  return `${prefix}: ${annotations
    .slice(0, 3)
    .map((annotation) => annotation.title)
    .join(", ")}`;
}

function hasKind(annotations: GraphStateSnapshotAnnotation[], kind: GraphStateSnapshotAnnotation["kind"]) {
  return annotations.some((annotation) => annotation.kind === kind);
}

function buildGraphTransitionLabels(input: {
  before: GraphStateSnapshot;
  after: GraphStateSnapshot;
  annotationDelta: GraphAnnotationDelta;
  processDelta: BranchProcessDelta;
  scoreDelta?: BranchScoreDelta;
}) {
  const labels: string[] = [];
  const { before, after, annotationDelta, processDelta, scoreDelta } = input;

  if (before.status !== after.status) {
    labels.push(`status: ${before.status ?? "missing"} -> ${after.status ?? "missing"}`);
  }

  if (hasKind(annotationDelta.added, "verification")) {
    labels.push("verification evidence introduced");
  }

  if (hasKind(annotationDelta.added, "material_grounding")) {
    labels.push("material grounding changed");
  }

  if (hasKind(annotationDelta.removed, "bottleneck") || (hasKind(before.annotations, "bottleneck") && !hasKind(after.annotations, "bottleneck"))) {
    labels.push("bottleneck signal reduced");
  }

  if (hasKind(annotationDelta.added, "bottleneck")) {
    labels.push("new bottleneck signal appeared");
  }

  if (processDelta.verificationMovedEarlier) {
    labels.push("verification moved earlier in the branch");
  }

  if (processDelta.materialUseChanged) {
    labels.push(`attachments: ${processDelta.parentAttachmentCount} -> ${processDelta.childAttachmentCount}`);
  }

  if (typeof scoreDelta?.totalDelta === "number") {
    labels.push(`score delta: ${scoreDelta.totalDelta > 0 ? "+" : ""}${scoreDelta.totalDelta}`);
  }

  const addedLabel = annotationListLabel(annotationDelta.added, "added annotations");
  const removedLabel = annotationListLabel(annotationDelta.removed, "removed annotations");

  if (addedLabel) {
    labels.push(addedLabel);
  }

  if (removedLabel) {
    labels.push(removedLabel);
  }

  return Array.from(new Set(labels)).slice(0, 8);
}

function buildGraphStateTransition(input: {
  parentAttempt: Attempt;
  childAttempt: Attempt;
  processDelta: BranchProcessDelta;
  scoreDelta?: BranchScoreDelta;
}): GraphStateTransition {
  const { parentAttempt, childAttempt, processDelta, scoreDelta } = input;
  const branch = childAttempt.branch;

  if (!branch) {
    throw new Error("Child attempt does not contain branch metadata.");
  }

  const parentGraph = buildConversationGraph(parentAttempt.trace, parentAttempt.scoreReport, parentAttempt.branch);
  const childGraph = buildConversationGraph(childAttempt.trace, childAttempt.scoreReport, childAttempt.branch);
  const childBreakpointEvent = childAttempt.trace.find((event) => event.sourceTraceEventId === branch.parentTraceEventId);
  const parentPairId = branch.parentPairId ?? graphPairIdForTraceEvent(parentGraph, branch.parentTraceEventId);
  const childPairId = childGraph.branch?.breakpointPairId ?? graphPairIdForTraceEvent(childGraph, childBreakpointEvent?.id);
  const before = buildGraphStateSnapshot(parentGraph, parentPairId);
  const after = buildGraphStateSnapshot(childGraph, childPairId);
  const annotationDelta = buildGraphAnnotationDelta(before, after);

  return {
    id: `graph-transition:${parentAttempt.id}:${childAttempt.id}:${branch.parentTraceEventId}`,
    parentAttemptId: parentAttempt.id,
    childAttemptId: childAttempt.id,
    breakpointTraceEventId: branch.parentTraceEventId,
    parentPairId,
    childPairId,
    before,
    after,
    annotationDelta,
    transitionLabels: buildGraphTransitionLabels({
      before,
      after,
      annotationDelta,
      processDelta,
      scoreDelta,
    }),
    createdAt: new Date().toISOString(),
  };
}

function tracePair(parentAttempt: Attempt, childAttempt: Attempt) {
  const branch = childAttempt.branch;

  if (!branch) {
    throw new Error("Child attempt does not contain branch metadata.");
  }

  const parentBreakpointIndex = parentAttempt.trace.findIndex((event) => event.id === branch.parentTraceEventId);
  const parentBreakpoint = parentAttempt.trace[parentBreakpointIndex];

  if (!parentBreakpoint) {
    throw new Error("Parent breakpoint trace event was not found.");
  }

  if (parentBreakpoint.role === "user") {
    const childReplacement = childAttempt.trace.find((event) => event.sourceTraceEventId === parentBreakpoint.id);
    const parentResponse = firstAssistantReply(parentAttempt.trace, parentBreakpoint);
    const childResponse = firstAssistantReply(childAttempt.trace, childReplacement);

    return {
      parentBreakpoint,
      parentPrompt: parentBreakpoint,
      childPrompt: childReplacement,
      parentResponse,
      childResponse,
    };
  }

  const parentNextPrompt = firstAfter(parentAttempt.trace, parentBreakpointIndex, "user");
  const copiedBreakpoint = childAttempt.trace.find((event) => event.sourceTraceEventId === parentBreakpoint.id);
  const childNextPrompt = copiedBreakpoint
    ? firstAfter(childAttempt.trace, indexOfEvent(childAttempt.trace, copiedBreakpoint), "user")
    : undefined;
  const parentResponse = firstAssistantReply(parentAttempt.trace, parentNextPrompt);
  const childResponse = firstAssistantReply(childAttempt.trace, childNextPrompt);

  return {
    parentBreakpoint,
    parentPrompt: parentNextPrompt,
    childPrompt: childNextPrompt,
    parentResponse,
    childResponse,
  };
}

function buildPromptChange(parentPrompt?: TraceEvent, childPrompt?: TraceEvent): BranchPromptChange | undefined {
  if (!parentPrompt && !childPrompt) {
    return undefined;
  }

  return {
    beforeTraceEventId: parentPrompt?.id,
    afterTraceEventId: childPrompt?.id,
    before: compact(parentPrompt?.content),
    after: compact(childPrompt?.content),
    semanticDelta: semanticDelta(parentPrompt?.content, childPrompt?.content),
  };
}

function buildResponseChange(parentResponse?: TraceEvent, childResponse?: TraceEvent): BranchResponseChange | undefined {
  if (!parentResponse && !childResponse) {
    return undefined;
  }

  return {
    beforeTraceEventId: parentResponse?.id,
    afterTraceEventId: childResponse?.id,
    before: compact(parentResponse?.content),
    after: compact(childResponse?.content),
    observedChange: observedResponseChange(parentResponse?.content, childResponse?.content),
  };
}

export function buildBranchDiff(parentAttempt: Attempt, childAttempt: Attempt): BranchDiff {
  const branch = childAttempt.branch;

  if (!branch) {
    throw new Error("Child attempt does not contain branch metadata.");
  }

  const pair = tracePair(parentAttempt, childAttempt);
  const processDelta = buildProcessDelta(parentAttempt, childAttempt);
  const scoreDelta = buildScoreDelta(parentAttempt, childAttempt);
  const graphTransition = buildGraphStateTransition({
    parentAttempt,
    childAttempt,
    processDelta,
    scoreDelta,
  });

  return {
    id: crypto.randomUUID(),
    parentAttemptId: parentAttempt.id,
    childAttemptId: childAttempt.id,
    breakpointTraceEventId: branch.parentTraceEventId,
    breakpointRole: pair.parentBreakpoint.role,
    parentPairId: branch.parentPairId,
    childPairId: graphTransition.childPairId,
    promptChange: buildPromptChange(pair.parentPrompt, pair.childPrompt),
    responseChange: buildResponseChange(pair.parentResponse, pair.childResponse),
    processDelta,
    scoreDelta,
    graphTransition,
    createdAt: new Date().toISOString(),
  };
}
