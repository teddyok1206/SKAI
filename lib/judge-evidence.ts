import type {
  ConversationGraph,
  ConversationTaskStatus,
  JudgeEvidenceItem,
  JudgeEvidencePacket,
  JudgeEvidenceSignalKind,
  JudgeGraphSignal,
  JudgeMaterialCoverage,
  Problem,
  ScoreAxis,
  TraceEvent,
} from "@/lib/types";

const keywordGroups = {
  goal: ["목표", "목적", "대상", "청중", "성공", "goal", "objective", "audience", "purpose", "success"],
  constraints: ["제약", "조건", "기준", "범위", "시간", "비용", "가정", "constraint", "criteria", "scope", "assumption"],
  deliverable: ["출력", "형식", "표", "json", "템플릿", "보고서", "브리프", "체크리스트", "deliverable", "format", "schema", "template"],
  decomposition: ["task", "태스크", "단계", "하위", "분해", "역할", "workflow", "순서", "입력", "출력", "pipeline", "subtask"],
  material: ["자료", "첨부", "파일", "영수증", "엑셀", "csv", "근거", "대조", "비교", "기반", "material", "attachment", "source", "evidence", "compare", "ground"],
  verification: ["검증", "확인", "출처", "근거", "오류", "한계", "반례", "환각", "verify", "validate", "source", "evidence", "counterexample", "risk"],
  assumption: ["가정", "사실", "불확실", "확정", "모르는", "누락", "unknown", "assumption", "uncertain", "known", "missing"],
  humanDecision: ["내가 판단", "사람", "사용자", "최종 결정", "승인", "검토자", "human", "i will decide", "approval", "reviewer"],
  adaptation: ["위", "앞서", "이전", "방금", "응답", "수정", "반영", "다시", "변경", "revise", "reflect", "based on", "previous", "instead"],
};

const commonTokens = new Set([
  "그리고",
  "하지만",
  "있는",
  "없는",
  "해야",
  "한다",
  "주세요",
  "please",
  "with",
  "that",
  "this",
  "from",
  "have",
  "should",
]);

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function includesAny(value: string, words: string[]) {
  const normalized = normalize(value);
  return words.some((word) => normalized.includes(word.toLowerCase()));
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function userEvents(trace: TraceEvent[]) {
  return trace.filter((event) => event.role === "user");
}

function assistantEvents(trace: TraceEvent[]) {
  return trace.filter((event) => event.role === "assistant");
}

function contentOf(events: TraceEvent[]) {
  return events.map((event) => event.content).join("\n");
}

function tokenize(value: string) {
  return unique(
    normalize(value)
      .replace(/[^\p{L}\p{N}\s._-]/gu, " ")
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 3 && !commonTokens.has(token)),
  );
}

function jaccard(a: string[], b: string[]) {
  if (a.length === 0 || b.length === 0) {
    return 0;
  }

  const aSet = new Set(a);
  const bSet = new Set(b);
  const intersection = [...aSet].filter((token) => bSet.has(token)).length;
  const union = new Set([...aSet, ...bSet]).size;

  return union === 0 ? 0 : intersection / union;
}

function repeatedContextBurden(events: TraceEvent[]) {
  const prompts = userEvents(events);
  if (prompts.length < 2) {
    return 0;
  }

  let repeated = 0;

  for (let index = 1; index < prompts.length; index += 1) {
    const previous = tokenize(prompts[index - 1].content);
    const current = tokenize(prompts[index].content);
    if (jaccard(previous, current) >= 0.62) {
      repeated += 1;
    }
  }

  return Math.min(1, repeated / Math.max(1, prompts.length - 1));
}

function materialAliases(material: Problem["materials"][number]) {
  return unique([material.id, material.title, material.fileName, material.description].flatMap((item) => tokenize(item)));
}

function traceMentionsMaterial(event: TraceEvent, material: Problem["materials"][number]) {
  const text = normalize(event.content);

  if (text.includes(normalize(material.id)) || text.includes(normalize(material.fileName)) || text.includes(normalize(material.title))) {
    return true;
  }

  return materialAliases(material).some((alias) => alias.length >= 4 && text.includes(alias));
}

function buildMaterialCoverage(problem: Problem, trace: TraceEvent[]): JudgeMaterialCoverage[] {
  return problem.materials.map((material) => {
    const attachedTraceEventIds = trace
      .filter((event) => event.attachments?.some((attachment) => attachment.source === "problem_material" && attachment.materialId === material.id))
      .map((event) => event.id);
    const referencedTraceEventIds = trace.filter((event) => traceMentionsMaterial(event, material)).map((event) => event.id);
    const instructionTraceEventIds = trace
      .filter((event) => event.role === "user" && (attachedTraceEventIds.includes(event.id) || traceMentionsMaterial(event, material)))
      .filter((event) => includesAny(event.content, keywordGroups.material) || includesAny(event.content, keywordGroups.verification))
      .map((event) => event.id);
    const status =
      instructionTraceEventIds.length > 0
        ? "instructed"
        : attachedTraceEventIds.length > 0
          ? "attached"
          : referencedTraceEventIds.length > 0
            ? "referenced"
            : "unused";

    return {
      materialId: material.id,
      title: material.title,
      fileName: material.fileName,
      kind: material.kind,
      attachedTraceEventIds,
      referencedTraceEventIds,
      instructionTraceEventIds,
      status,
    };
  });
}

function finalAnswerCoverage(problem: Problem, finalAnswer: string) {
  if (problem.deliverables.length === 0) {
    return finalAnswer.trim() ? 1 : 0;
  }

  const answer = normalize(finalAnswer);
  const covered = problem.deliverables.filter((deliverable) => {
    const tokens = tokenize(deliverable);
    if (tokens.length === 0) {
      return false;
    }

    return tokens.some((token) => answer.includes(token));
  });

  return Math.round((covered.length / problem.deliverables.length) * 100) / 100;
}

function pairStatusDistribution(graph: ConversationGraph) {
  return graph.pairs.reduce<Record<ConversationTaskStatus, number>>(
    (acc, pair) => {
      acc[pair.status] += 1;
      return acc;
    },
    {
      pending: 0,
      responded: 0,
      material_used: 0,
      verification: 0,
      bottleneck: 0,
    },
  );
}

function buildGraphSignals(graph: ConversationGraph): JudgeGraphSignal[] {
  const distribution = pairStatusDistribution(graph);
  const statusSignalIds = graph.pairs.map((pair) => pair.statusNodeId);

  return [
    {
      id: "graph.prompt_node_count",
      label: "Prompt node count",
      value: graph.promptNodes.filter((node) => !node.synthetic).length,
      targetIds: graph.promptNodes.filter((node) => !node.synthetic).map((node) => node.id),
    },
    {
      id: "graph.response_node_count",
      label: "Response node count",
      value: graph.responseNodes.filter((node) => !node.synthetic).length,
      targetIds: graph.responseNodes.filter((node) => !node.synthetic).map((node) => node.id),
    },
    {
      id: "graph.status_node_count",
      label: "Status node count",
      value: graph.statusNodes.length,
      targetIds: graph.statusNodes.map((node) => node.id),
    },
    {
      id: "graph.pair_count",
      label: "Prompt-response pair count",
      value: graph.pairs.length,
      targetIds: graph.pairs.map((pair) => pair.id),
    },
    {
      id: "graph.status_distribution",
      label: "Task status distribution",
      value: Object.entries(distribution)
        .map(([status, count]) => `${status}:${count}`)
        .join(", "),
      targetIds: statusSignalIds,
    },
    {
      id: "graph.annotation_count",
      label: "Graph annotation count",
      value: graph.annotations.length,
      targetIds: graph.annotations.map((annotation) => annotation.targetId),
    },
  ];
}

function firstMatchingTraceEvent(events: TraceEvent[], words: string[]) {
  return events.find((event) => includesAny(event.content, words));
}

function evidenceItem(input: {
  id: string;
  kind: JudgeEvidenceItem["kind"];
  signal: JudgeEvidenceSignalKind;
  axis?: ScoreAxis;
  targetKind: JudgeEvidenceItem["targetKind"];
  targetId: string;
  evidenceTraceEventIds?: string[];
  confidence: number;
  summary: string;
}): JudgeEvidenceItem {
  return {
    id: input.id,
    kind: input.kind,
    signal: input.signal,
    axis: input.axis,
    targetKind: input.targetKind,
    targetId: input.targetId,
    evidenceTraceEventIds: input.evidenceTraceEventIds ?? [],
    confidence: input.confidence,
    summary: input.summary,
  };
}

function signalItem(input: {
  attemptId: string;
  events: TraceEvent[];
  signal: JudgeEvidenceSignalKind;
  present: boolean;
  axis: ScoreAxis;
  words: string[];
  positiveSummary: string;
  gapSummary: string;
}) {
  const found = firstMatchingTraceEvent(input.events, input.words);

  return evidenceItem({
    id: `evidence:${input.signal}`,
    kind: input.present ? "positive" : "gap",
    signal: input.signal,
    axis: input.axis,
    targetKind: found ? "trace_event" : "attempt",
    targetId: found?.id ?? input.attemptId,
    evidenceTraceEventIds: found ? [found.id] : [],
    confidence: input.present ? 0.82 : 0.66,
    summary: input.present ? input.positiveSummary : input.gapSummary,
  });
}

function buildEvidenceItems(input: {
  attemptId: string;
  trace: TraceEvent[];
  materialCoverage: JudgeMaterialCoverage[];
  signals: JudgeEvidencePacket["signals"];
}): JudgeEvidenceItem[] {
  const users = userEvents(input.trace);
  const items = [
    signalItem({
      attemptId: input.attemptId,
      events: users,
      signal: "explicit_goal",
      present: input.signals.hasExplicitGoal,
      axis: "problem_definition",
      words: keywordGroups.goal,
      positiveSummary: "The trace contains an explicit goal, audience, or success criterion signal.",
      gapSummary: "The trace does not clearly state the goal, audience, or success criterion.",
    }),
    signalItem({
      attemptId: input.attemptId,
      events: users,
      signal: "constraints",
      present: input.signals.hasConstraints,
      axis: "problem_definition",
      words: keywordGroups.constraints,
      positiveSummary: "The user surfaced constraints, criteria, scope, or assumptions.",
      gapSummary: "The trace leaves constraints and assumptions underspecified.",
    }),
    signalItem({
      attemptId: input.attemptId,
      events: users,
      signal: "deliverable_contract",
      present: input.signals.hasDeliverableContract,
      axis: "instruction_clarity",
      words: keywordGroups.deliverable,
      positiveSummary: "The user defined output shape or deliverable contract.",
      gapSummary: "The output contract is weak or absent.",
    }),
    signalItem({
      attemptId: input.attemptId,
      events: users,
      signal: "decomposition",
      present: input.signals.hasDecomposition,
      axis: "decomposition",
      words: keywordGroups.decomposition,
      positiveSummary: "The user decomposed the problem into tasks, roles, steps, or workflow.",
      gapSummary: "The trace shows weak task decomposition.",
    }),
    signalItem({
      attemptId: input.attemptId,
      events: users,
      signal: "verification",
      present: input.signals.hasVerification,
      axis: "verification",
      words: keywordGroups.verification,
      positiveSummary: "The trace includes verification, source, limitation, or error-checking behavior.",
      gapSummary: "The trace lacks an explicit verification step.",
    }),
    signalItem({
      attemptId: input.attemptId,
      events: users,
      signal: "adaptation_reference",
      present: input.signals.hasAdaptationReference,
      axis: "adaptation",
      words: keywordGroups.adaptation,
      positiveSummary: "The user references previous output or adapts the next step.",
      gapSummary: "The trace has limited response-aware adaptation.",
    }),
  ];

  if (input.materialCoverage.length > 0) {
    const instructed = input.materialCoverage.filter((material) => material.status === "instructed");
    const unused = input.materialCoverage.filter((material) => material.status === "unused");

    items.push(
      evidenceItem({
        id: "evidence:material_instruction",
        kind: instructed.length > 0 ? "positive" : "gap",
        signal: "material_instruction",
        axis: "verification",
        targetKind: instructed[0] ? "material" : "attempt",
        targetId: instructed[0]?.materialId ?? input.attemptId,
        evidenceTraceEventIds: instructed.flatMap((material) => material.instructionTraceEventIds).slice(0, 6),
        confidence: instructed.length > 0 ? 0.84 : 0.72,
        summary:
          instructed.length > 0
            ? `${instructed.length} required material(s) were attached or referenced with usage instructions.`
            : "The problem has materials, but the trace does not clearly instruct the model how to use them.",
      }),
    );

    if (unused.length > 0) {
      items.push(
        evidenceItem({
          id: "evidence:material_unused",
          kind: "risk",
          signal: "material_instruction",
          axis: "verification",
          targetKind: "material",
          targetId: unused[0].materialId,
          evidenceTraceEventIds: [],
          confidence: 0.78,
          summary: `${unused.length} required material(s) appear unused in the trace.`,
        }),
      );
    }
  }

  items.push(
    evidenceItem({
      id: "evidence:final_answer_coverage",
      kind: "metric",
      signal: "final_answer_coverage",
      axis: "final_quality",
      targetKind: "attempt",
      targetId: input.attemptId,
      confidence: 0.58,
      summary: `Final answer deliverable keyword coverage is ${Math.round(input.signals.finalAnswerCoverage * 100)}%.`,
    }),
  );

  if (input.signals.repeatedContextBurden > 0) {
    items.push(
      evidenceItem({
        id: "evidence:repeated_context_burden",
        kind: "risk",
        signal: "repeated_context_burden",
        axis: "efficiency",
        targetKind: "attempt",
        targetId: input.attemptId,
        confidence: 0.62,
        summary: `Consecutive user prompts show repeated context burden at ${Math.round(input.signals.repeatedContextBurden * 100)}%.`,
      }),
    );
  }

  return items;
}

function warningList(input: {
  materialCoverage: JudgeMaterialCoverage[];
  signals: JudgeEvidencePacket["signals"];
  counts: JudgeEvidencePacket["counts"];
}) {
  const warnings: string[] = [];

  if (input.counts.requiredMaterialCount > 0 && input.counts.attachedRequiredMaterialCount === 0) {
    warnings.push("required_materials_not_attached");
  }

  if (!input.signals.hasVerification) {
    warnings.push("missing_verification_step");
  }

  if (!input.signals.hasDecomposition && input.counts.userTurnCount <= 1) {
    warnings.push("possible_one_shot_process");
  }

  if (input.signals.repeatedContextBurden >= 0.5) {
    warnings.push("high_repeated_context_burden");
  }

  if (input.materialCoverage.some((material) => material.status === "unused")) {
    warnings.push("some_problem_materials_unused");
  }

  return warnings;
}

export function buildJudgeEvidencePacket(input: {
  attemptId: string;
  problem: Problem;
  trace: TraceEvent[];
  finalAnswer: string;
  graph: ConversationGraph;
  generatedAt?: string;
}): JudgeEvidencePacket {
  const users = userEvents(input.trace);
  const assistants = assistantEvents(input.trace);
  const userText = contentOf(users);
  const materialCoverage = buildMaterialCoverage(input.problem, input.trace);
  const attachedRequiredMaterialIds = unique(
    input.trace.flatMap(
      (event) =>
        event.attachments
          ?.filter((attachment) => attachment.source === "problem_material" && attachment.materialId)
          .map((attachment) => attachment.materialId as string) ?? [],
    ),
  );
  const attachmentCount = input.trace.reduce((sum, event) => sum + (event.attachments?.length ?? 0), 0);
  const signals = {
    hasExplicitGoal: includesAny(userText, keywordGroups.goal),
    hasConstraints: includesAny(userText, keywordGroups.constraints),
    hasDeliverableContract: includesAny(userText, keywordGroups.deliverable),
    hasDecomposition: includesAny(userText, keywordGroups.decomposition),
    hasMaterialInstruction:
      materialCoverage.some((material) => material.status === "instructed") ||
      (attachmentCount > 0 && includesAny(userText, keywordGroups.material)),
    hasVerification: includesAny(userText, keywordGroups.verification),
    hasAssumptionSeparation: includesAny(userText, keywordGroups.assumption),
    hasHumanDecisionBoundary: includesAny(userText, keywordGroups.humanDecision),
    hasAdaptationReference: users.slice(1).some((event) => includesAny(event.content, keywordGroups.adaptation)),
    branchReplayUsed: Boolean(input.graph.branch) || input.trace.some((event) => Boolean(event.branchId || event.sourceTraceEventId)),
    finalAnswerCoverage: finalAnswerCoverage(input.problem, input.finalAnswer),
    repeatedContextBurden: repeatedContextBurden(input.trace),
  };
  const counts = {
    turnCount: input.trace.length,
    userTurnCount: users.length,
    assistantTurnCount: assistants.length,
    promptPairCount: input.graph.pairs.length,
    attachmentCount,
    requiredMaterialCount: input.problem.materials.length,
    attachedRequiredMaterialCount: attachedRequiredMaterialIds.length,
  };

  return {
    schemaVersion: "skai.judge.evidence.v1",
    attemptId: input.attemptId,
    problemId: input.problem.id,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    counts,
    signals,
    materialCoverage,
    graphSignals: buildGraphSignals(input.graph),
    evidenceItems: buildEvidenceItems({
      attemptId: input.attemptId,
      trace: input.trace,
      materialCoverage,
      signals,
    }),
    warnings: warningList({
      materialCoverage,
      signals,
      counts,
    }),
  };
}

export function formatJudgeEvidenceForContext(packet: JudgeEvidencePacket) {
  const compactPacket = {
    schemaVersion: packet.schemaVersion,
    counts: packet.counts,
    signals: packet.signals,
    materialCoverage: packet.materialCoverage.map((material) => ({
      materialId: material.materialId,
      title: material.title,
      status: material.status,
      attachedTraceEventIds: material.attachedTraceEventIds,
      referencedTraceEventIds: material.referencedTraceEventIds,
      instructionTraceEventIds: material.instructionTraceEventIds,
    })),
    graphSignals: packet.graphSignals,
    evidenceItems: packet.evidenceItems.slice(0, 12),
    warnings: packet.warnings,
  };

  return JSON.stringify(compactPacket, null, 2);
}
