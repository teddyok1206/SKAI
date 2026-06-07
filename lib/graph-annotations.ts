import type {
  Bottleneck,
  ConversationGraphAnnotation,
  ConversationGraphAnnotationKind,
  ConversationGraphAnnotationSeverity,
  ConversationGraphAnnotationSource,
  ConversationGraphBranch,
  ConversationGraphNode,
  ConversationGraphPair,
  JudgeDerivedSignal,
  JudgeEvidencePacket,
  ScoreAxis,
  ScoreReport,
  TraceEvent,
} from "@/lib/types";

export const conversationGraphSchemaVersion = "conversation-graph.v0.annotations";

const verificationWords = ["검증", "확인", "근거", "출처", "오류", "한계", "반례", "validate", "verify", "source"];
const adaptationWords = ["수정", "다시", "반영", "변경", "보완", "재작성", "아니", "방향", "adapt", "revise"];

type AnnotationInput = {
  attemptId: string;
  trace: TraceEvent[];
  promptNodes: ConversationGraphNode[];
  responseNodes: ConversationGraphNode[];
  statusNodes: ConversationGraphNode[];
  pairs: ConversationGraphPair[];
  scoreReport?: ScoreReport;
  branch?: ConversationGraphBranch;
  problemMaterialCount?: number;
  evidencePacket?: JudgeEvidencePacket;
};

type AnnotationDraft = Omit<ConversationGraphAnnotation, "id" | "attemptId" | "graphSchemaVersion" | "createdAt"> & {
  idSeed: string;
};

function includesAny(value: string, words: string[]) {
  const normalized = value.toLowerCase();
  return words.some((word) => normalized.includes(word.toLowerCase()));
}

function severityFromBottleneck(severity: Bottleneck["severity"]): ConversationGraphAnnotationSeverity {
  if (severity === "high") {
    return "critical";
  }

  if (severity === "medium") {
    return "watch";
  }

  return "info";
}

function judgeSource(scoreReport?: ScoreReport): ConversationGraphAnnotationSource {
  if (scoreReport?.judgeMode === "llm") {
    return "llm_judge";
  }

  return "heuristic_judge";
}

function pairByTraceEventId(pairs: ConversationGraphPair[]) {
  return pairs.reduce<Record<string, ConversationGraphPair>>((acc, pair) => {
    acc[pair.promptTraceEventId] = pair;

    if (pair.responseTraceEventId) {
      acc[pair.responseTraceEventId] = pair;
    }

    return acc;
  }, {});
}

function nodeByTraceEventId(nodes: ConversationGraphNode[]) {
  return nodes.reduce<Record<string, ConversationGraphNode>>((acc, node) => {
    if (node.traceEventId) {
      acc[node.traceEventId] = node;
    }

    return acc;
  }, {});
}

function annotation(
  input: AnnotationDraft,
  meta: { attemptId: string; createdAt: string },
): ConversationGraphAnnotation {
  return {
    id: `annotation:${input.kind}:${input.targetKind}:${input.targetId}:${input.idSeed}`,
    attemptId: meta.attemptId,
    graphSchemaVersion: conversationGraphSchemaVersion,
    targetKind: input.targetKind,
    targetId: input.targetId,
    kind: input.kind,
    severity: input.severity,
    axis: input.axis,
    scoreImpact: input.scoreImpact,
    confidence: input.confidence,
    title: input.title,
    explanation: input.explanation,
    evidenceTraceEventIds: input.evidenceTraceEventIds,
    source: input.source,
    createdAt: meta.createdAt,
  };
}

function pairAnnotation(input: {
  pair: ConversationGraphPair;
  kind: ConversationGraphAnnotationKind;
  severity: ConversationGraphAnnotationSeverity;
  title: string;
  explanation: string;
  evidenceTraceEventIds: string[];
  source: ConversationGraphAnnotationSource;
  confidence: number;
  axis?: ScoreAxis;
  scoreImpact?: number;
  idSeed: string;
}): AnnotationDraft {
  return {
    targetKind: "pair",
    targetId: input.pair.id,
    kind: input.kind,
    severity: input.severity,
    title: input.title,
    explanation: input.explanation,
    evidenceTraceEventIds: input.evidenceTraceEventIds,
    source: input.source,
    confidence: input.confidence,
    axis: input.axis,
    scoreImpact: input.scoreImpact,
    idSeed: input.idSeed,
  };
}

function firstPairForTraceIds(pairsByTraceEventId: Record<string, ConversationGraphPair>, traceEventIds: string[]) {
  for (const traceEventId of traceEventIds) {
    const pair = pairsByTraceEventId[traceEventId];

    if (pair) {
      return pair;
    }
  }

  return undefined;
}

function derivedSignalSeverity(signal: JudgeDerivedSignal): ConversationGraphAnnotationSeverity {
  if (signal.status === "strong") {
    return "positive";
  }

  if (signal.status === "partial") {
    return "info";
  }

  if (signal.status === "risky") {
    return "critical";
  }

  if (signal.status === "weak" || signal.status === "absent") {
    return "watch";
  }

  return "info";
}

function derivedSignalScoreImpact(signal: JudgeDerivedSignal, positive = 3) {
  if (signal.status === "strong") {
    return positive;
  }

  if (signal.status === "partial") {
    return Math.max(1, Math.round(positive / 2));
  }

  if (signal.status === "risky") {
    return -Math.max(6, positive * 2);
  }

  if (signal.status === "weak" || signal.status === "absent") {
    return -positive;
  }

  return 0;
}

function derivedSignalTitle(input: { strong: string; partial: string; weak: string; risky?: string }, signal: JudgeDerivedSignal) {
  if (signal.status === "strong") {
    return input.strong;
  }

  if (signal.status === "partial") {
    return input.partial;
  }

  if (signal.status === "risky") {
    return input.risky ?? input.weak;
  }

  return input.weak;
}

export function buildDeterministicGraphAnnotations(input: AnnotationInput): ConversationGraphAnnotation[] {
  const createdAt = input.scoreReport?.createdAt ?? input.trace.at(-1)?.createdAt ?? new Date(0).toISOString();
  const traceById = new Map(input.trace.map((event) => [event.id, event]));
  const pairForTraceEvent = pairByTraceEventId(input.pairs);
  const nodeForTraceEvent = nodeByTraceEventId([...input.promptNodes, ...input.responseNodes, ...input.statusNodes]);
  const drafts: AnnotationDraft[] = [];

  for (const bottleneck of input.scoreReport?.bottlenecks ?? []) {
    if (!bottleneck.traceEventId) {
      continue;
    }

    const pair = pairForTraceEvent[bottleneck.traceEventId];
    const evidenceTraceEventIds = [bottleneck.traceEventId];

    if (pair) {
      drafts.push(
        pairAnnotation({
          pair,
          kind: "bottleneck",
          severity: severityFromBottleneck(bottleneck.severity),
          title: bottleneck.label,
          explanation: bottleneck.explanation,
          evidenceTraceEventIds,
          source: judgeSource(input.scoreReport),
          confidence: 0.88,
          scoreImpact: bottleneck.severity === "high" ? -12 : bottleneck.severity === "medium" ? -7 : -3,
          idSeed: bottleneck.traceEventId,
        }),
      );
      continue;
    }

    const node = nodeForTraceEvent[bottleneck.traceEventId];
    if (node) {
      drafts.push({
        targetKind: "node",
        targetId: node.id,
        kind: "bottleneck",
        severity: severityFromBottleneck(bottleneck.severity),
        title: bottleneck.label,
        explanation: bottleneck.explanation,
        evidenceTraceEventIds,
        source: judgeSource(input.scoreReport),
        confidence: 0.82,
        scoreImpact: bottleneck.severity === "high" ? -12 : bottleneck.severity === "medium" ? -7 : -3,
        idSeed: bottleneck.traceEventId,
      });
    }
  }

  for (const pair of input.pairs) {
    const prompt = traceById.get(pair.promptTraceEventId);

    if (!prompt) {
      continue;
    }

    if ((prompt.attachments?.length ?? 0) > 0) {
      drafts.push(
        pairAnnotation({
          pair,
          kind: "material_grounding",
          severity: "positive",
          title: "Material used",
          explanation: "이 프롬프트는 문제 자료나 업로드 파일을 모델 입력에 포함했다.",
          evidenceTraceEventIds: [prompt.id],
          source: "deterministic",
          confidence: 0.96,
          axis: "verification",
          scoreImpact: 4,
          idSeed: `${prompt.id}:material`,
        }),
      );
    }

    if (pair.status === "verification" || includesAny(prompt.content, verificationWords)) {
      drafts.push(
        pairAnnotation({
          pair,
          kind: "verification",
          severity: "positive",
          title: "Verification move",
          explanation: "이 지점에서 사용자가 근거, 오류, 한계, 출처, 확인 같은 검증 신호를 넣었다.",
          evidenceTraceEventIds: [prompt.id],
          source: "deterministic",
          confidence: 0.82,
          axis: "verification",
          scoreImpact: 3,
          idSeed: `${prompt.id}:verification`,
        }),
      );
    }

    if (includesAny(prompt.content, adaptationWords)) {
      drafts.push(
        pairAnnotation({
          pair,
          kind: "adaptation",
          severity: "info",
          title: "Course correction",
          explanation: "이 프롬프트는 이전 흐름을 수정하거나 방향을 재조정하려는 신호를 가진다.",
          evidenceTraceEventIds: [prompt.id],
          source: "deterministic",
          confidence: 0.68,
          axis: "adaptation",
          scoreImpact: 1,
          idSeed: `${prompt.id}:adaptation`,
        }),
      );
    }

    if (pair.status === "pending") {
      drafts.push(
        pairAnnotation({
          pair,
          kind: "model_behavior",
          severity: "watch",
          title: "Pending response",
          explanation: "이 프롬프트에는 아직 모델 응답이 연결되지 않았다.",
          evidenceTraceEventIds: [prompt.id],
          source: "deterministic",
          confidence: 0.99,
          idSeed: `${prompt.id}:pending`,
        }),
      );
    }

    if (pair.isBreakpoint) {
      drafts.push(
        pairAnnotation({
          pair,
          kind: "recovery",
          severity: "info",
          title: "Replay breakpoint",
          explanation: "이 pair는 parent attempt에서 다시 시작한 breakpoint anchor다.",
          evidenceTraceEventIds: [prompt.id, pair.responseTraceEventId].filter((id): id is string => Boolean(id)),
          source: "deterministic",
          confidence: 0.95,
          axis: "adaptation",
          scoreImpact: 2,
          idSeed: `${pair.id}:breakpoint`,
        }),
      );
    }
  }

  const hasProblemMaterials = (input.problemMaterialCount ?? 0) > 0;
  const anyMaterialUsed = input.pairs.some((pair) => {
    const prompt = traceById.get(pair.promptTraceEventId);
    return (prompt?.attachments?.length ?? 0) > 0;
  });

  if (hasProblemMaterials && !anyMaterialUsed && input.pairs.length > 0) {
    const firstPair = input.pairs[0];
    drafts.push(
      pairAnnotation({
        pair: firstPair,
        kind: "material_grounding",
        severity: "watch",
        title: "Available materials not used",
        explanation: "이 문제에는 공식 자료가 있지만, 현재 trace에는 자료를 첨부해 모델에 전달한 프롬프트가 없다.",
        evidenceTraceEventIds: [firstPair.promptTraceEventId],
        source: "deterministic",
        confidence: 0.64,
        axis: "verification",
        scoreImpact: -4,
        idSeed: `${firstPair.id}:missing-material`,
      }),
    );
  }

  if (input.evidencePacket?.derivedSignals) {
    const derivedConfigs: Array<{
      signal: JudgeDerivedSignal;
      kind: ConversationGraphAnnotationKind;
      axis: ScoreAxis;
      title: Parameters<typeof derivedSignalTitle>[0];
      idSeed: string;
      positiveScoreImpact: number;
    }> = [
      {
        signal: input.evidencePacket.derivedSignals.materialCrossReference,
        kind: "material_grounding",
        axis: "verification",
        title: {
          strong: "Material cross-reference",
          partial: "Partial material cross-reference",
          weak: "Weak material cross-reference",
        },
        idSeed: "material-cross-reference",
        positiveScoreImpact: 3,
      },
      {
        signal: input.evidencePacket.derivedSignals.claimSourceLinkage,
        kind: "material_grounding",
        axis: "verification",
        title: {
          strong: "Claim-source linkage",
          partial: "Partial claim-source linkage",
          weak: "Weak claim-source linkage",
        },
        idSeed: "claim-source-linkage",
        positiveScoreImpact: 3,
      },
      {
        signal: input.evidencePacket.derivedSignals.contextBoundary,
        kind: "security_boundary",
        axis: "verification",
        title: {
          strong: "Context boundary set",
          partial: "Partial permission boundary",
          weak: "Weak context boundary",
          risky: "Risky context boundary",
        },
        idSeed: "context-boundary",
        positiveScoreImpact: 4,
      },
      {
        signal: input.evidencePacket.derivedSignals.harnessFit,
        kind: "harness_fit",
        axis: "efficiency",
        title: {
          strong: "Harness fits the problem",
          partial: "Partial harness fit",
          weak: "Harness fit needs review",
          risky: "Risky harness fit",
        },
        idSeed: "harness-fit",
        positiveScoreImpact: 3,
      },
      {
        signal: input.evidencePacket.derivedSignals.branchTopology,
        kind: "branch_topology",
        axis: "adaptation",
        title: {
          strong: "Branch topology anchored",
          partial: "Partial branch topology",
          weak: "No branch topology",
        },
        idSeed: "branch-topology",
        positiveScoreImpact: 2,
      },
    ];

    for (const config of derivedConfigs) {
      if (config.signal.status === "not_applicable") {
        continue;
      }

      const pairFromSignal = config.signal.pairIds?.map((pairId) => input.pairs.find((pair) => pair.id === pairId)).find(Boolean);
      const pair = pairFromSignal ?? firstPairForTraceIds(pairForTraceEvent, config.signal.traceEventIds) ?? input.pairs[0];

      if (!pair) {
        continue;
      }

      drafts.push(
        pairAnnotation({
          pair,
          kind: config.kind,
          severity: derivedSignalSeverity(config.signal),
          title: derivedSignalTitle(config.title, config.signal),
          explanation: config.signal.summary,
          evidenceTraceEventIds: config.signal.traceEventIds,
          source: "deterministic",
          confidence: config.signal.confidence,
          axis: config.axis,
          scoreImpact: derivedSignalScoreImpact(config.signal, config.positiveScoreImpact),
          idSeed: `${pair.id}:${config.idSeed}`,
        }),
      );
    }
  }

  const seen = new Set<string>();
  return drafts
    .map((draft) => annotation(draft, { attemptId: input.attemptId, createdAt }))
    .filter((item) => {
      if (seen.has(item.id)) {
        return false;
      }

      seen.add(item.id);
      return true;
    });
}
