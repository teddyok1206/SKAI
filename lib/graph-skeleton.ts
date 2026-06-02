import type {
  ConversationGraph,
  ConversationGraphAnnotation,
  ConversationGraphAnnotationKind,
  ConversationGraphPair,
  GraphSkeletonStep,
  GraphSkeletonStepRole,
  TraceEvent,
} from "@/lib/types";

const signalDefinitions = [
  { label: "목표", keywords: ["목표", "문제", "성공", "범위", "요구", "goal", "problem"] },
  { label: "제약", keywords: ["제약", "조건", "반드시", "금지", "constraint", "must"] },
  { label: "자료", keywords: ["자료", "파일", "첨부", "영수증", "xlsx", "csv", "이미지", "material"] },
  { label: "세분화", keywords: ["단계", "task", "태스크", "분해", "쪼개", "workflow", "순서"] },
  { label: "출력", keywords: ["출력", "형식", "표", "json", "목록", "양식", "format"] },
  { label: "검증", keywords: ["검증", "확인", "근거", "출처", "오류", "한계", "반례", "verify"] },
  { label: "수정", keywords: ["수정", "다시", "반영", "변경", "보완", "재작성", "revise"] },
  { label: "최종", keywords: ["최종", "정리", "제출", "마무리", "결론", "final"] },
] as const;

const roleLabels: Record<GraphSkeletonStepRole, string> = {
  problem_reframe: "목표와 제약 고정",
  clarifying_question: "누락 조건 확인",
  material_selection: "자료 기반 맥락 투입",
  task_decomposition: "하위 task 설계",
  draft_generation: "산출물 초안 위임",
  verification: "근거와 오류 검증",
  revision: "방향 재조정",
  finalization: "최종 산출물 정리",
  other: "흐름 진행",
};

function includesAny(value: string, words: readonly string[]) {
  const normalized = value.toLowerCase();
  return words.some((word) => normalized.includes(word.toLowerCase()));
}

function compact(value: string, limit = 120) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= limit) {
    return normalized;
  }

  return `${normalized.slice(0, limit - 1)}…`;
}

function promptSignals(event?: TraceEvent) {
  if (!event) {
    return [];
  }

  const haystack = `${event.content} ${event.attachments?.map((attachment) => attachment.name).join(" ") ?? ""}`;
  const signals = signalDefinitions
    .filter((signal) => signal.keywords.some((keyword) => haystack.toLowerCase().includes(keyword.toLowerCase())))
    .map((signal) => signal.label);

  return Array.from(new Set(signals));
}

function annotationsForPair(graph: ConversationGraph, pair: ConversationGraphPair) {
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

function hasAnnotation(annotations: ConversationGraphAnnotation[], kind: ConversationGraphAnnotationKind) {
  return annotations.some((annotation) => annotation.kind === kind);
}

function hasSignal(signals: string[], signal: string) {
  return signals.includes(signal);
}

function classifyStep(input: {
  pair: ConversationGraphPair;
  prompt?: TraceEvent;
  response?: TraceEvent;
  annotations: ConversationGraphAnnotation[];
  signals: string[];
}): GraphSkeletonStepRole {
  const { pair, prompt, response, annotations, signals } = input;

  if (pair.status === "verification" || hasAnnotation(annotations, "verification") || hasSignal(signals, "검증")) {
    return "verification";
  }

  if (pair.status === "material_used" || hasAnnotation(annotations, "material_grounding") || hasSignal(signals, "자료")) {
    return "material_selection";
  }

  if (hasAnnotation(annotations, "adaptation") || hasAnnotation(annotations, "recovery") || hasSignal(signals, "수정")) {
    return "revision";
  }

  if (hasSignal(signals, "세분화")) {
    return "task_decomposition";
  }

  if (hasSignal(signals, "최종")) {
    return "finalization";
  }

  if (pair.sequence === 0 || hasSignal(signals, "목표") || hasSignal(signals, "제약")) {
    return "problem_reframe";
  }

  if (prompt && (prompt.content.includes("?") || includesAny(prompt.content, ["질문", "확인해야", "불확실", "clarify"]))) {
    return "clarifying_question";
  }

  if (response && includesAny(prompt?.content ?? "", ["작성", "초안", "만들", "생성", "draft"])) {
    return "draft_generation";
  }

  return "other";
}

function summaryForRole(input: {
  role: GraphSkeletonStepRole;
  pair: ConversationGraphPair;
  prompt?: TraceEvent;
  response?: TraceEvent;
  annotations: ConversationGraphAnnotation[];
  signals: string[];
}) {
  const { role, pair, response, annotations, signals } = input;
  const signalText = signals.length > 0 ? ` 신호: ${signals.join(", ")}.` : "";
  const annotationText =
    annotations.length > 0 ? ` 근거: ${annotations.slice(0, 3).map((annotation) => annotation.title).join(", ")}.` : "";

  if (role === "problem_reframe") {
    return `사용자가 문제 상태를 잡고 모델이 따라갈 초기 방향을 만들었다.${signalText}${annotationText}`;
  }

  if (role === "clarifying_question") {
    return `해결 경로를 확정하기 전에 빠진 조건과 불확실성을 드러냈다.${signalText}${annotationText}`;
  }

  if (role === "material_selection") {
    return `문제 자료나 업로드 근거를 다음 모델 입력에 연결했다.${signalText}${annotationText}`;
  }

  if (role === "task_decomposition") {
    return `일을 하위 task나 실행 순서로 나누어 모델이 처리할 단위를 만들었다.${signalText}${annotationText}`;
  }

  if (role === "draft_generation") {
    return `충분한 맥락을 만든 뒤 산출물 초안 생성을 모델에 위임했다.${signalText}${annotationText}`;
  }

  if (role === "verification") {
    return `근거, 한계, 출처, 오류 가능성을 확인하는 검증 상태로 전환했다.${signalText}${annotationText}`;
  }

  if (role === "revision") {
    return `현재 산출물이나 새 정보에 반응해 방향, 조건, 요구사항을 조정했다.${signalText}${annotationText}`;
  }

  if (role === "finalization") {
    return `풀이를 최종 산출물이나 결론으로 수렴시켰다.${signalText}${annotationText}`;
  }

  return `사용자가 orchestration 상태를 ${pair.status} 단계로 진행시켰다.${response ? ` 모델 응답: ${compact(response.content, 90)}.` : ""}${signalText}`;
}

export function buildGraphSkeleton(graph: ConversationGraph, trace: TraceEvent[]): GraphSkeletonStep[] {
  const traceById = new Map(trace.map((event) => [event.id, event]));

  return graph.pairs.map((pair) => {
    const prompt = traceById.get(pair.promptTraceEventId);
    const response = pair.responseTraceEventId ? traceById.get(pair.responseTraceEventId) : undefined;
    const annotations = annotationsForPair(graph, pair);
    const signals = promptSignals(prompt);
    const role = classifyStep({ pair, prompt, response, annotations, signals });
    const annotationKinds = Array.from(new Set(annotations.map((annotation) => annotation.kind)));
    const evidenceLabels = Array.from(new Set([...pair.statusReasons, ...annotations.map((annotation) => annotation.title)])).slice(0, 5);

    return {
      id: `graph-skeleton:${pair.id}`,
      pairId: pair.id,
      sequence: pair.sequence,
      role,
      label: roleLabels[role],
      status: pair.status,
      summary: summaryForRole({ role, pair, prompt, response, annotations, signals }),
      annotationIds: annotations.map((annotation) => annotation.id),
      annotationKinds,
      signals,
      evidenceLabels,
      expandableTraceEventIds: [pair.promptTraceEventId, pair.responseTraceEventId].filter((id): id is string => Boolean(id)),
      promptTraceEventId: pair.promptTraceEventId,
      responseTraceEventId: pair.responseTraceEventId,
      isBreakpoint: pair.isBreakpoint,
    };
  });
}
