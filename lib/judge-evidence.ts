import type {
  ConversationGraph,
  ConversationTaskStatus,
  JudgeDerivedSignal,
  JudgeDerivedSignals,
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
  crossReference: ["대조", "교차", "상호", "비교", "불일치", "cross", "compare", "reconcile", "match", "mismatch"],
  verification: ["검증", "확인", "출처", "근거", "오류", "한계", "반례", "환각", "verify", "validate", "source", "evidence", "counterexample", "risk"],
  sourceLinkage: ["출처", "근거", "인용", "어느 자료", "파일명", "자료 id", "source", "citation", "cite", "evidence", "provenance"],
  assumption: ["가정", "사실", "불확실", "확정", "모르는", "누락", "unknown", "assumption", "uncertain", "known", "missing"],
  humanDecision: ["내가 판단", "사람", "사용자", "최종 결정", "승인", "검토자", "human", "i will decide", "approval", "reviewer"],
  contextBoundary: [
    "자료 안의 지시",
    "자료의 지시",
    "따르지 말",
    "데이터로만",
    "명령으로 취급하지",
    "untrusted",
    "data not instruction",
    "do not follow",
    "ignore instructions",
    "permission",
    "approval",
  ],
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

function signalStatus(input: Pick<JudgeDerivedSignal, "status" | "traceEventIds" | "confidence" | "summary"> & {
  materialIds?: string[];
  pairIds?: string[];
}): JudgeDerivedSignal {
  return {
    status: input.status,
    materialIds: input.materialIds,
    pairIds: input.pairIds,
    traceEventIds: unique(input.traceEventIds),
    confidence: input.confidence,
    summary: input.summary,
  };
}

function materialsUsedOrInstructed(materialCoverage: JudgeMaterialCoverage[]) {
  return materialCoverage.filter((material) => material.status === "attached" || material.status === "instructed");
}

function materialInstructionTraceIds(materialCoverage: JudgeMaterialCoverage[]) {
  return unique(materialCoverage.flatMap((material) => material.instructionTraceEventIds));
}

function usedMaterialTraceIds(materialCoverage: JudgeMaterialCoverage[]) {
  return unique(
    materialCoverage.flatMap((material) => [
      ...material.attachedTraceEventIds,
      ...material.referencedTraceEventIds,
      ...material.instructionTraceEventIds,
    ]),
  );
}

function materialCrossReferenceSignal(input: {
  problem: Problem;
  trace: TraceEvent[];
  materialCoverage: JudgeMaterialCoverage[];
}): JudgeDerivedSignal {
  if (input.problem.materials.length < 2) {
    return signalStatus({
      status: "not_applicable",
      traceEventIds: [],
      confidence: 0.9,
      summary: "Cross-reference is not applicable because the problem has fewer than two official materials.",
    });
  }

  const userText = contentOf(userEvents(input.trace));
  const used = materialsUsedOrInstructed(input.materialCoverage);
  const usedIds = used.map((material) => material.materialId);
  const traceEventIds = usedMaterialTraceIds(used);
  const hasCrossReferenceLanguage = includesAny(userText, keywordGroups.crossReference);

  if (used.length >= 2 && hasCrossReferenceLanguage) {
    return signalStatus({
      status: "strong",
      materialIds: usedIds,
      traceEventIds,
      confidence: 0.78,
      summary: "The trace uses multiple materials with comparison or reconciliation language.",
    });
  }

  if (used.length >= 2) {
    return signalStatus({
      status: "partial",
      materialIds: usedIds,
      traceEventIds,
      confidence: 0.68,
      summary: "The trace uses multiple materials, but cross-reference intent is not explicit.",
    });
  }

  if (used.length === 1) {
    return signalStatus({
      status: "weak",
      materialIds: usedIds,
      traceEventIds,
      confidence: 0.68,
      summary: "Only one official material appears to be used in a multi-material problem.",
    });
  }

  return signalStatus({
    status: "absent",
    traceEventIds: [],
    confidence: 0.72,
    summary: "The multi-material problem has no visible material cross-reference behavior.",
  });
}

function claimSourceLinkageSignal(input: {
  problem: Problem;
  trace: TraceEvent[];
  materialCoverage: JudgeMaterialCoverage[];
  finalAnswer: string;
}): JudgeDerivedSignal {
  if (input.problem.materials.length === 0) {
    return signalStatus({
      status: "not_applicable",
      traceEventIds: [],
      confidence: 0.9,
      summary: "Claim-source linkage is not applicable because the problem has no official materials.",
    });
  }

  const userText = contentOf(userEvents(input.trace));
  const answerText = input.finalAnswer;
  const linkedMaterials = input.materialCoverage.filter((material) => {
    const materialMentionedInFinal = [material.materialId, material.title, material.fileName].some((value) =>
      normalize(answerText).includes(normalize(value)),
    );

    return material.instructionTraceEventIds.length > 0 || materialMentionedInFinal;
  });
  const traceEventIds = unique([...materialInstructionTraceIds(input.materialCoverage), ...usedMaterialTraceIds(linkedMaterials)]);
  const hasSourceLanguage = includesAny(`${userText}\n${answerText}`, keywordGroups.sourceLinkage);

  if (linkedMaterials.length > 0 && hasSourceLanguage) {
    return signalStatus({
      status: "strong",
      materialIds: linkedMaterials.map((material) => material.materialId),
      traceEventIds,
      confidence: 0.7,
      summary: "The trace or final answer asks for source/evidence linkage while grounding work in materials.",
    });
  }

  if (linkedMaterials.length > 0) {
    return signalStatus({
      status: "partial",
      materialIds: linkedMaterials.map((material) => material.materialId),
      traceEventIds,
      confidence: 0.62,
      summary: "Material use is visible, but explicit claim-source linkage remains approximate.",
    });
  }

  if (materialsUsedOrInstructed(input.materialCoverage).length > 0) {
    return signalStatus({
      status: "weak",
      materialIds: materialsUsedOrInstructed(input.materialCoverage).map((material) => material.materialId),
      traceEventIds: usedMaterialTraceIds(input.materialCoverage),
      confidence: 0.58,
      summary: "Materials were used, but the trace does not clearly connect claims to source materials.",
    });
  }

  return signalStatus({
    status: "absent",
    traceEventIds: [],
    confidence: 0.68,
    summary: "No visible source linkage behavior appears in the trace.",
  });
}

function materialLooksInstructionLike(material: Problem["materials"][number]) {
  return includesAny(material.extractedText, [
    "ignore previous",
    "ignore all",
    "system prompt",
    "developer message",
    "follow this instruction",
    "do not tell",
    "이전 지시",
    "시스템 프롬프트",
    "이 지시를 따르",
    "말하지 마",
  ]);
}

function contextBoundarySignal(input: {
  problem: Problem;
  trace: TraceEvent[];
  materialCoverage: JudgeMaterialCoverage[];
}): JudgeDerivedSignal {
  if (input.problem.materials.length === 0 && !input.trace.some((event) => (event.attachments?.length ?? 0) > 0)) {
    return signalStatus({
      status: "not_applicable",
      traceEventIds: [],
      confidence: 0.88,
      summary: "Context boundary is not applicable because no external materials or uploads are present.",
    });
  }

  const userText = contentOf(userEvents(input.trace));
  const boundaryEvents = userEvents(input.trace).filter((event) => includesAny(event.content, keywordGroups.contextBoundary));
  const hasInstructionLikeMaterial = input.problem.materials.some(materialLooksInstructionLike);
  const anyMaterialUsed = materialsUsedOrInstructed(input.materialCoverage).length > 0;

  if (boundaryEvents.length > 0) {
    return signalStatus({
      status: "strong",
      traceEventIds: boundaryEvents.map((event) => event.id),
      confidence: 0.8,
      summary: "The user explicitly separates material data from executable instructions or permission boundaries.",
    });
  }

  if (hasInstructionLikeMaterial && anyMaterialUsed) {
    return signalStatus({
      status: "risky",
      materialIds: input.problem.materials.filter(materialLooksInstructionLike).map((material) => material.id),
      traceEventIds: usedMaterialTraceIds(input.materialCoverage),
      confidence: 0.72,
      summary: "Instruction-like material appears in context without an explicit data/instruction boundary.",
    });
  }

  if (includesAny(userText, keywordGroups.humanDecision)) {
    return signalStatus({
      status: "partial",
      traceEventIds: userEvents(input.trace)
        .filter((event) => includesAny(event.content, keywordGroups.humanDecision))
        .map((event) => event.id),
      confidence: 0.64,
      summary: "The user mentions human approval or decision boundaries, but does not clearly separate data from instructions.",
    });
  }

  return signalStatus({
    status: anyMaterialUsed ? "weak" : "absent",
    traceEventIds: usedMaterialTraceIds(input.materialCoverage),
    confidence: 0.58,
    summary: anyMaterialUsed
      ? "External material enters the model context without an explicit trust or permission boundary."
      : "No visible context boundary behavior appears in the trace.",
  });
}

function harnessFitSignal(input: {
  problem: Problem;
  trace: TraceEvent[];
  materialCoverage: JudgeMaterialCoverage[];
  signals: JudgeEvidencePacket["signals"];
  counts: JudgeEvidencePacket["counts"];
}): JudgeDerivedSignal {
  const users = userEvents(input.trace);
  const hasMaterials = input.problem.materials.length > 0;
  const hasUsedMaterial = materialsUsedOrInstructed(input.materialCoverage).length > 0;
  const oneShot = input.counts.userTurnCount <= 1;
  const hasWorkflow = input.signals.hasDecomposition || input.signals.hasVerification || input.signals.hasAdaptationReference;
  const tooMuchRepeat = input.signals.repeatedContextBurden >= 0.5;
  const allUserTraceIds = users.map((event) => event.id);

  if (hasMaterials && oneShot && !hasUsedMaterial) {
    return signalStatus({
      status: "weak",
      traceEventIds: allUserTraceIds,
      confidence: 0.76,
      summary: "The harness is too thin for a material-grounded problem: one-shot flow without visible material use.",
    });
  }

  if (tooMuchRepeat) {
    return signalStatus({
      status: "risky",
      traceEventIds: allUserTraceIds,
      confidence: 0.68,
      summary: "Repeated context burden suggests the harness is not preserving task state efficiently.",
    });
  }

  if (hasWorkflow && (!hasMaterials || hasUsedMaterial)) {
    return signalStatus({
      status: "strong",
      traceEventIds: allUserTraceIds,
      confidence: 0.66,
      summary: "The attempt shows a problem-appropriate harness: workflow signals align with the available context.",
    });
  }

  if (users.length > 0) {
    return signalStatus({
      status: "partial",
      traceEventIds: allUserTraceIds,
      confidence: 0.56,
      summary: "The harness is usable, but workflow, material use, or verification signals remain incomplete.",
    });
  }

  return signalStatus({
    status: "absent",
    traceEventIds: [],
    confidence: 0.7,
    summary: "No user orchestration trace is available to evaluate harness fit.",
  });
}

function branchTopologySignal(input: { trace: TraceEvent[]; graph: ConversationGraph }): JudgeDerivedSignal {
  const branchPairs = input.graph.pairs.filter((pair) => pair.isBreakpoint);
  const branchTraceEvents = input.trace.filter((event) => Boolean(event.branchId || event.sourceTraceEventId));

  if (branchPairs.length > 0) {
    return signalStatus({
      status: "strong",
      pairIds: branchPairs.map((pair) => pair.id),
      traceEventIds: unique(branchPairs.flatMap((pair) => [pair.promptTraceEventId, pair.responseTraceEventId].filter((id): id is string => Boolean(id)))),
      confidence: 0.88,
      summary: "The graph contains an explicit breakpoint replay topology anchored to prompt-response pairs.",
    });
  }

  if (branchTraceEvents.length > 0) {
    return signalStatus({
      status: "partial",
      traceEventIds: branchTraceEvents.map((event) => event.id),
      confidence: 0.72,
      summary: "Branch metadata appears in trace events, but no pair-level breakpoint topology is visible.",
    });
  }

  return signalStatus({
    status: "not_applicable",
    traceEventIds: [],
    confidence: 0.86,
    summary: "No branch/replay topology is present in this attempt.",
  });
}

function buildDerivedSignals(input: {
  problem: Problem;
  trace: TraceEvent[];
  materialCoverage: JudgeMaterialCoverage[];
  finalAnswer: string;
  graph: ConversationGraph;
  signals: JudgeEvidencePacket["signals"];
  counts: JudgeEvidencePacket["counts"];
}): JudgeDerivedSignals {
  return {
    materialCrossReference: materialCrossReferenceSignal(input),
    claimSourceLinkage: claimSourceLinkageSignal(input),
    contextBoundary: contextBoundarySignal(input),
    harnessFit: harnessFitSignal(input),
    branchTopology: branchTopologySignal(input),
  };
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
  derivedSignals: JudgeDerivedSignals;
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

  const derivedItems: Array<{
    key: keyof JudgeDerivedSignals;
    signal: JudgeEvidenceSignalKind;
    axis: ScoreAxis;
    targetKind: JudgeEvidenceItem["targetKind"];
    targetId: string;
    positiveSummary: string;
    gapSummary: string;
  }> = [
    {
      key: "materialCrossReference",
      signal: "material_cross_reference",
      axis: "verification",
      targetKind: input.derivedSignals.materialCrossReference.materialIds?.[0] ? "material" : "attempt",
      targetId: input.derivedSignals.materialCrossReference.materialIds?.[0] ?? input.attemptId,
      positiveSummary: "The trace shows material cross-reference behavior.",
      gapSummary: "The trace lacks material cross-reference behavior where it may matter.",
    },
    {
      key: "claimSourceLinkage",
      signal: "claim_source_linkage",
      axis: "verification",
      targetKind: input.derivedSignals.claimSourceLinkage.materialIds?.[0] ? "material" : "attempt",
      targetId: input.derivedSignals.claimSourceLinkage.materialIds?.[0] ?? input.attemptId,
      positiveSummary: "The trace links claims or final output expectations to source/evidence behavior.",
      gapSummary: "The trace does not clearly connect claims to source materials.",
    },
    {
      key: "contextBoundary",
      signal: "context_boundary",
      axis: "verification",
      targetKind: input.derivedSignals.contextBoundary.materialIds?.[0] ? "material" : "attempt",
      targetId: input.derivedSignals.contextBoundary.materialIds?.[0] ?? input.attemptId,
      positiveSummary: "The trace separates material data, instructions, and permission boundaries.",
      gapSummary: "The trace does not clearly separate external data from executable instructions.",
    },
    {
      key: "harnessFit",
      signal: "harness_fit",
      axis: "efficiency",
      targetKind: "attempt",
      targetId: input.attemptId,
      positiveSummary: "The orchestration harness appears proportionate to the problem context.",
      gapSummary: "The orchestration harness appears too thin, repetitive, or incomplete for the problem.",
    },
    {
      key: "branchTopology",
      signal: "branch_topology",
      axis: "adaptation",
      targetKind: input.derivedSignals.branchTopology.pairIds?.[0] ? "pair" : "attempt",
      targetId: input.derivedSignals.branchTopology.pairIds?.[0] ?? input.attemptId,
      positiveSummary: "The attempt has branch/replay topology anchored to the graph.",
      gapSummary: "No branch/replay topology is present in this attempt.",
    },
  ];

  for (const item of derivedItems) {
    const derived = input.derivedSignals[item.key];

    if (derived.status === "not_applicable") {
      continue;
    }

    items.push(
      evidenceItem({
        id: `evidence:${item.signal}`,
        kind:
          derived.status === "strong" || derived.status === "partial"
            ? "positive"
            : derived.status === "risky"
              ? "risk"
              : "gap",
        signal: item.signal,
        axis: item.axis,
        targetKind: item.targetKind,
        targetId: item.targetId,
        evidenceTraceEventIds: derived.traceEventIds,
        confidence: derived.confidence,
        summary:
          derived.status === "strong" || derived.status === "partial"
            ? `${item.positiveSummary} ${derived.summary}`
            : `${item.gapSummary} ${derived.summary}`,
      }),
    );
  }

  return items;
}

function warningList(input: {
  materialCoverage: JudgeMaterialCoverage[];
  signals: JudgeEvidencePacket["signals"];
  counts: JudgeEvidencePacket["counts"];
  derivedSignals: JudgeDerivedSignals;
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

  if (input.derivedSignals.contextBoundary.status === "risky") {
    warnings.push("context_boundary_risky");
  }

  if (input.derivedSignals.harnessFit.status === "risky" || input.derivedSignals.harnessFit.status === "weak") {
    warnings.push("harness_fit_needs_review");
  }

  if (input.derivedSignals.materialCrossReference.status === "absent" || input.derivedSignals.materialCrossReference.status === "weak") {
    warnings.push("material_cross_reference_weak");
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
  const derivedSignals = buildDerivedSignals({
    problem: input.problem,
    trace: input.trace,
    materialCoverage,
    finalAnswer: input.finalAnswer,
    graph: input.graph,
    signals,
    counts,
  });

  return {
    schemaVersion: "skai.judge.evidence.v1",
    attemptId: input.attemptId,
    problemId: input.problem.id,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    counts,
    signals,
    derivedSignals,
    materialCoverage,
    graphSignals: buildGraphSignals(input.graph),
    evidenceItems: buildEvidenceItems({
      attemptId: input.attemptId,
      trace: input.trace,
      materialCoverage,
      signals,
      derivedSignals,
    }),
    warnings: warningList({
      materialCoverage,
      signals,
      counts,
      derivedSignals,
    }),
  };
}

export function formatJudgeEvidenceForContext(packet: JudgeEvidencePacket) {
  const compactPacket = {
    schemaVersion: packet.schemaVersion,
    counts: packet.counts,
    signals: packet.signals,
    derivedSignals: packet.derivedSignals,
    materialCoverage: packet.materialCoverage.map((material) => ({
      materialId: material.materialId,
      title: material.title,
      status: material.status,
      attachedTraceEventIds: material.attachedTraceEventIds,
      referencedTraceEventIds: material.referencedTraceEventIds,
      instructionTraceEventIds: material.instructionTraceEventIds,
    })),
    graphSignals: packet.graphSignals,
    evidenceItems: packet.evidenceItems.slice(0, 18),
    warnings: packet.warnings,
  };

  return JSON.stringify(compactPacket, null, 2);
}
