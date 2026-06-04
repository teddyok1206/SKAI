import type {
  Attempt,
  AttemptAttachment,
  ConversationGraph,
  ConversationGraphIndex,
  ConversationGraphNode,
  ConversationGraphPair,
  ConversationTaskStatus,
  Problem,
  PublishedAttempt,
  ReportLocale,
  SkaiFileArtifact,
  SkaiFileAttemptSnapshot,
  SkaiFileBranchSnapshot,
  SkaiFileIntegrity,
  SkaiFileManifest,
  SkaiFilePayload,
  SkaiFileProblemSnapshot,
  TraceEvent,
} from "@/lib/types";

export const skaiFileSchemaVersion = "skai.file.v1" as const;
export const skaiFileMimeType = "application/vnd.skai+json" as const;
export const skaiFileExtension = ".skai" as const;

type JsonLike = null | boolean | number | string | JsonLike[] | { [key: string]: JsonLike };

function canonicalize(value: unknown): JsonLike | undefined {
  if (value === undefined || typeof value === "function" || typeof value === "symbol") {
    return undefined;
  }

  if (value === null || typeof value === "boolean" || typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (Array.isArray(value)) {
    return value.map((item) => canonicalize(item) ?? null);
  }

  if (typeof value === "object") {
    const input = value as Record<string, unknown>;
    const output: Record<string, JsonLike> = {};

    for (const key of Object.keys(input).sort()) {
      const nextValue = canonicalize(input[key]);

      if (nextValue !== undefined) {
        output[key] = nextValue;
      }
    }

    return output;
  }

  return String(value);
}

export function stableStringify(value: unknown, space?: number) {
  return JSON.stringify(canonicalize(value), null, space);
}

export async function sha256Hex(value: string) {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function sanitizeFileName(value: string, fallback = "skai-artifact") {
  const normalized = value
    .normalize("NFKC")
    .replace(/[^a-z0-9가-힣_-]+/gi, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);

  return normalized || fallback;
}

function sanitizeAttachment(attachment: AttemptAttachment): AttemptAttachment {
  const rest = { ...attachment };
  delete rest.dataUrl;

  return rest;
}

function sanitizeTraceEvent(event: TraceEvent): TraceEvent {
  const rest = { ...(event as TraceEvent & { contextDebug?: unknown }) };
  delete rest.contextDebug;

  return {
    ...rest,
    attachments: rest.attachments?.map(sanitizeAttachment),
  };
}

function sanitizeTrace(trace: TraceEvent[]) {
  return trace.map(sanitizeTraceEvent);
}

function sanitizePublishedAttempt(attempt: PublishedAttempt): SkaiFileAttemptSnapshot {
  return {
    id: attempt.id,
    attemptId: attempt.attemptId,
    problemId: attempt.problemId,
    title: attempt.title,
    trace: sanitizeTrace(attempt.trace),
    branch: attempt.branch,
    solvingMode: attempt.solvingMode,
    createdAt: attempt.createdAt,
  };
}

function parentAttemptTrace(parent: Attempt) {
  return {
    trace: sanitizeTrace(parent.trace),
  };
}

function primaryModelSource(trace: TraceEvent[]) {
  const assistantEvent = trace.find((event) => event.role === "assistant" && event.provider && event.model);
  const anyModelEvent = trace.find((event) => event.provider && event.model);
  const sourceEvent = assistantEvent ?? anyModelEvent;

  return {
    primaryProvider: sourceEvent?.provider,
    primaryModel: sourceEvent?.model,
  };
}

function manifestLocale(input: PublishedAttempt): ReportLocale {
  return input.scoreReport.locale ?? input.scoreReport.sourceLocale ?? "ko";
}

function includesAny(value: string, words: readonly string[]) {
  const normalized = value.toLowerCase();
  return words.some((word) => normalized.includes(word.toLowerCase()));
}

function structuralStatusForPair(pair: ConversationGraphPair, traceById: Map<string, TraceEvent>) {
  const prompt = traceById.get(pair.promptTraceEventId);
  const response = pair.responseTraceEventId ? traceById.get(pair.responseTraceEventId) : undefined;
  const reasons: string[] = [];

  if (prompt && includesAny(prompt.content, ["검증", "확인", "근거", "출처", "오류", "한계", "반례"])) {
    reasons.push("verification prompt signal");
    return { status: "verification" as const, reasons };
  }

  if ((prompt?.attachments?.length ?? 0) > 0) {
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

function sanitizeStatusNode(
  node: ConversationGraphNode,
  statusByPairId: Map<string, { status: ConversationTaskStatus; reasons: string[] }>,
): ConversationGraphNode {
  if (node.kind !== "task_status" || !node.pairId) {
    return node;
  }

  const structuralStatus = statusByPairId.get(node.pairId);

  if (!structuralStatus) {
    return node;
  }

  return {
    ...node,
    label: structuralStatus.status,
    summary: structuralStatus.reasons.join("; "),
  };
}

function stripAnnotationIndexes(index: ConversationGraphIndex): ConversationGraphIndex {
  return {
    ...index,
    annotationIdsByTargetId: {},
    annotationIdsByTraceEventId: {},
    annotationIdsByKind: {},
  };
}

function structuralGraphFromReceivedGraph(graph: ConversationGraph, trace: TraceEvent[]): ConversationGraph {
  const traceById = new Map(trace.map((event) => [event.id, event]));
  const statusByPairId = new Map(
    graph.pairs.map((pair) => {
      const structuralStatus = structuralStatusForPair(pair, traceById);
      return [pair.id, structuralStatus] as const;
    }),
  );

  return {
    attemptId: graph.attemptId,
    promptNodes: graph.promptNodes.map((node) => sanitizeStatusNode(node, statusByPairId)),
    responseNodes: graph.responseNodes.map((node) => sanitizeStatusNode(node, statusByPairId)),
    statusNodes: graph.statusNodes.map((node) => sanitizeStatusNode(node, statusByPairId)),
    promptEdges: graph.promptEdges,
    responseEdges: graph.responseEdges,
    statusEdges: graph.statusEdges,
    pairs: graph.pairs.map((pair) => {
      const structuralStatus = statusByPairId.get(pair.id);

      return structuralStatus
        ? {
            ...pair,
            status: structuralStatus.status,
            statusReasons: pair.isBreakpoint ? [...structuralStatus.reasons, "breakpoint replay anchor"] : structuralStatus.reasons,
          }
        : pair;
    }),
    annotations: [],
    index: stripAnnotationIndexes(graph.index),
    branch: graph.branch,
  };
}

async function buildProblemSnapshot(problem?: Problem): Promise<SkaiFileProblemSnapshot | undefined> {
  if (!problem) {
    return undefined;
  }

  const materials = await Promise.all(
    problem.materials.map(async (material) => ({
      id: material.id,
      title: material.title,
      kind: material.kind,
      fileName: material.fileName,
      mimeType: material.mimeType,
      href: material.href,
      extractedTextHash: await sha256Hex(material.extractedText),
    })),
  );

  return {
    id: problem.id,
    title: problem.title,
    category: problem.category,
    difficulty: problem.difficulty,
    goalProfile: problem.goalProfile,
    estimatedMinutes: problem.estimatedMinutes,
    constraints: problem.constraints,
    deliverables: problem.deliverables,
    materials,
  };
}

async function hashSections(sections: Record<string, unknown>) {
  const sectionHashes: Record<string, string> = {};

  for (const [key, value] of Object.entries(sections)) {
    if (value === undefined) {
      continue;
    }

    sectionHashes[key] = await sha256Hex(stableStringify(value));
  }

  return sectionHashes;
}

async function buildIntegrity(input: Omit<SkaiFileArtifact, "integrity">, sections: Record<string, unknown>): Promise<SkaiFileIntegrity> {
  const sectionHashes = await hashSections(sections);
  const artifactHash = await sha256Hex(stableStringify({ ...input, sectionHashes }));

  return {
    algorithm: "sha256",
    canonicalization: "stable-json-v1",
    sectionHashes,
    artifactHash,
  };
}

function buildBranchSnapshot(input: {
  publishedAttempt: PublishedAttempt;
  childAttemptSnapshot: SkaiFileAttemptSnapshot;
  parentAttempt?: Attempt;
}): SkaiFileBranchSnapshot | undefined {
  const { publishedAttempt, childAttemptSnapshot, parentAttempt } = input;
  const branch = publishedAttempt.branch;

  if (!branch) {
    return undefined;
  }

  const parentTrace = parentAttempt ? parentAttemptTrace(parentAttempt).trace : [];

  return {
    parentAttemptId: branch.parentAttemptId,
    childAttemptId: publishedAttempt.attemptId,
    breakpointTraceEventId: branch.parentTraceEventId,
    breakpointTraceIndex: branch.parentTraceIndex,
    breakpointPairId: branch.parentPairId,
    parentTrace,
    childTrace: childAttemptSnapshot.trace,
  };
}

export function skaiFileName(title: string) {
  return `${sanitizeFileName(title)}${skaiFileExtension}`;
}

export async function buildSkaiFileArtifact(input: {
  publishedAttempt: PublishedAttempt;
  problem?: Problem;
  parentAttempt?: Attempt;
  childGraph: ConversationGraph;
  parentGraph?: ConversationGraph;
  extensions?: Record<string, unknown>;
}): Promise<SkaiFileArtifact> {
  const createdAt = new Date().toISOString();
  const childAttempt = sanitizePublishedAttempt(input.publishedAttempt);
  const parentTrace = input.parentAttempt ? sanitizeTrace(input.parentAttempt.trace) : [];
  const childGraph = structuralGraphFromReceivedGraph(input.childGraph, childAttempt.trace);
  const parentGraph =
    input.parentGraph && parentTrace.length > 0 ? structuralGraphFromReceivedGraph(input.parentGraph, parentTrace) : undefined;
  const branch = buildBranchSnapshot({
    publishedAttempt: input.publishedAttempt,
    childAttemptSnapshot: childAttempt,
    parentAttempt: input.parentAttempt,
  });
  const problemSnapshot = await buildProblemSnapshot(input.problem);
  const payload: SkaiFilePayload = {
    problem: problemSnapshot,
    attempt: childAttempt,
    graph: {
      child: childGraph,
      parent: parentGraph,
    },
    branch,
  };
  const manifest: SkaiFileManifest = {
    artifactId: `skai:${childAttempt.attemptId}:${createdAt}`,
    title: childAttempt.title,
    problemId: childAttempt.problemId,
    attemptId: childAttempt.attemptId,
    parentAttemptId: input.publishedAttempt.branch?.parentAttemptId,
    source: {
      platform: "skai",
      conversationId: childAttempt.attemptId,
      exportedFrom: "skai-web",
      ...primaryModelSource(childAttempt.trace),
    },
    createdAt,
    exportedBy: "skai",
    schemaVersion: skaiFileSchemaVersion,
    locale: manifestLocale(input.publishedAttempt),
    availableLocales: [manifestLocale(input.publishedAttempt)],
    sections: Object.entries(payload)
      .filter(([, value]) => value !== undefined)
      .map(([key]) => key),
    privacy: {
      rawTrace: "included",
      contextDebug: "stripped",
      attachmentBinary: "omitted",
      attachmentText: "included_when_public",
    },
  };
  const artifactWithoutIntegrity = {
    format: "SKAI" as const,
    schemaVersion: skaiFileSchemaVersion,
    mimeType: skaiFileMimeType,
    extension: skaiFileExtension,
    createdAt,
    manifest,
    payload,
  };
  const integrity = await buildIntegrity(artifactWithoutIntegrity, {
    manifest,
    problem: payload.problem,
    attempt: payload.attempt,
    graph: payload.graph,
    branch: payload.branch,
  });

  const coreArtifact = {
    ...artifactWithoutIntegrity,
    integrity,
  };

  if (input.extensions && Object.keys(input.extensions).length > 0) {
    return attachSkaiFileExtensions(coreArtifact, input.extensions);
  }

  return coreArtifact;
}

export async function attachSkaiFileExtensions(
  artifact: SkaiFileArtifact,
  extensions: Record<string, unknown>,
): Promise<SkaiFileArtifact> {
  const artifactWithoutIntegrity: Omit<SkaiFileArtifact, "integrity"> & Partial<Pick<SkaiFileArtifact, "integrity">> = {
    ...artifact,
    extensions: {
      ...(artifact.extensions ?? {}),
      ...extensions,
    },
  };
  delete artifactWithoutIntegrity.integrity;
  const integrity = await buildIntegrity(artifactWithoutIntegrity, {
    manifest: artifactWithoutIntegrity.manifest,
    problem: artifactWithoutIntegrity.payload.problem,
    attempt: artifactWithoutIntegrity.payload.attempt,
    graph: artifactWithoutIntegrity.payload.graph,
    branch: artifactWithoutIntegrity.payload.branch,
  });

  return {
    ...artifactWithoutIntegrity,
    integrity,
  };
}

export function serializeSkaiFileArtifact(artifact: SkaiFileArtifact, pretty = true) {
  return stableStringify(artifact, pretty ? 2 : undefined);
}

export async function verifySkaiFileArtifact(artifact: SkaiFileArtifact) {
  const artifactWithoutIntegrity: Omit<SkaiFileArtifact, "integrity"> & Partial<Pick<SkaiFileArtifact, "integrity">> = {
    ...artifact,
  };
  delete artifactWithoutIntegrity.integrity;
  const expectedSectionHashes = await hashSections({
    manifest: artifact.manifest,
    problem: artifact.payload.problem,
    attempt: artifact.payload.attempt,
    graph: artifact.payload.graph,
    branch: artifact.payload.branch,
  });
  const expectedArtifactHash = await sha256Hex(stableStringify({ ...artifactWithoutIntegrity, sectionHashes: expectedSectionHashes }));
  const sectionChecks = Object.fromEntries(
    Object.entries(expectedSectionHashes).map(([key, hash]) => [key, artifact.integrity.sectionHashes[key] === hash]),
  );

  return {
    ok:
      artifact.format === "SKAI" &&
      artifact.schemaVersion === skaiFileSchemaVersion &&
      artifact.integrity.algorithm === "sha256" &&
      artifact.integrity.artifactHash === expectedArtifactHash &&
      Object.values(sectionChecks).every(Boolean),
    expectedArtifactHash,
    actualArtifactHash: artifact.integrity.artifactHash,
    sectionChecks,
  };
}
