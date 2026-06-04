import { buildGraphOverlayIndex } from "@/lib/graph-overlay";
import { buildGraphSkeleton } from "@/lib/graph-skeleton";
import {
  buildSkaiArtifact,
  buildUniversalAttemptSummary,
  type SkaiArtifact,
  type UniversalAttemptStep,
} from "@/lib/skai-artifact";
import type {
  Attempt,
  AttemptAttachment,
  ConversationGraph,
  Problem,
  PublishedAttempt,
  SkaiFileArtifact,
  SkaiFileBranchComparisonSnapshot,
  SkaiFileIntegrity,
  SkaiFileManifest,
  SkaiFilePayload,
  SkaiFileProblemSnapshot,
  SkaiFilePublishedAttemptSnapshot,
  TraceEvent,
} from "@/lib/types";
import { buildConversationGraph } from "@/lib/conversation-graph";

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

function compactVisualArtifact(artifact: SkaiArtifact) {
  return {
    id: artifact.id,
    title: artifact.title,
    headline: artifact.headline,
    score: artifact.score,
    signature: artifact.signature,
    metrics: artifact.metrics,
  };
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

function sanitizePublishedAttempt(attempt: PublishedAttempt): SkaiFilePublishedAttemptSnapshot {
  const rest = { ...attempt };
  delete rest.skaiFile;

  return {
    ...rest,
    trace: sanitizeTrace(rest.trace),
  };
}

function publishedAttemptFromParent(parent: Attempt): SkaiFilePublishedAttemptSnapshot {
  const scoreReport = parent.scoreReport;

  if (!scoreReport) {
    throw new Error("Cannot include parent attempt in .skai without a score report.");
  }

  return {
    id: `parent-snapshot:${parent.id}`,
    attemptId: parent.id,
    problemId: parent.problemId,
    title: parent.title,
    workflow: scoreReport.workflow,
    trace: sanitizeTrace(parent.trace),
    scoreReport,
    branch: parent.branch,
    counterfactualReport: parent.counterfactualReport,
    solvingMode: parent.solvingMode,
    createdAt: parent.publishedAt ?? parent.updatedAt ?? parent.createdAt,
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

function buildBranchComparisonSnapshot(input: {
  publishedAttempt: PublishedAttempt;
  childAttemptSnapshot: SkaiFilePublishedAttemptSnapshot;
  parentAttempt?: Attempt;
}): SkaiFileBranchComparisonSnapshot | undefined {
  const { publishedAttempt, childAttemptSnapshot, parentAttempt } = input;
  const parentAttemptId = publishedAttempt.branch?.parentAttemptId;

  if (!publishedAttempt.counterfactualReport || !parentAttemptId) {
    return undefined;
  }

  const parentTrace = parentAttempt ? sanitizeTrace(parentAttempt.trace) : [];

  return {
    parentAttemptId,
    childAttemptId: publishedAttempt.attemptId,
    breakpointTraceEventId: publishedAttempt.counterfactualReport.branchDiff.breakpointTraceEventId,
    breakpointPairId: publishedAttempt.counterfactualReport.branchDiff.parentPairId,
    parentTrace,
    childTrace: childAttemptSnapshot.trace,
    graphTransition: publishedAttempt.counterfactualReport.branchDiff.graphTransition,
    counterfactualReport: publishedAttempt.counterfactualReport,
  };
}

export function skaiFileName(title: string) {
  return `${sanitizeFileName(title)}${skaiFileExtension}`;
}

export async function buildSkaiFileArtifact(input: {
  publishedAttempt: PublishedAttempt;
  problem?: Problem;
  parentAttempt?: Attempt;
  childGraph?: ConversationGraph;
}): Promise<SkaiFileArtifact> {
  const createdAt = new Date().toISOString();
  const childAttempt = sanitizePublishedAttempt(input.publishedAttempt);
  const parentAttemptSnapshot = input.parentAttempt?.scoreReport ? publishedAttemptFromParent(input.parentAttempt) : undefined;
  const childGraph =
    input.childGraph ??
    buildConversationGraph(childAttempt.trace, childAttempt.scoreReport, childAttempt.branch, {
      problemMaterialCount: input.problem?.materials.length ?? 0,
    });
  const childSkeleton = buildGraphSkeleton(childGraph, childAttempt.trace);
  const visualArtifact = buildSkaiArtifact({
    attempt: childAttempt,
    graph: childGraph,
    skeleton: childSkeleton,
  });
  const universalSummary = buildUniversalAttemptSummary({
    attempt: childAttempt,
    graph: childGraph,
    skeleton: childSkeleton,
  });
  const parentGraph =
    parentAttemptSnapshot && input.parentAttempt
      ? buildConversationGraph(parentAttemptSnapshot.trace, parentAttemptSnapshot.scoreReport, parentAttemptSnapshot.branch, {
          problemMaterialCount: input.problem?.materials.length ?? 0,
        })
      : undefined;
  const parentSkeleton = parentGraph && parentAttemptSnapshot ? buildGraphSkeleton(parentGraph, parentAttemptSnapshot.trace) : undefined;
  const branchComparison = buildBranchComparisonSnapshot({
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
      childSkeleton,
      parentSkeleton,
      childOverlay: buildGraphOverlayIndex(childGraph),
      parentOverlay: parentGraph ? buildGraphOverlayIndex(parentGraph) : undefined,
    },
    report: {
      scoreReport: childAttempt.scoreReport,
      visualArtifact: compactVisualArtifact(visualArtifact),
      universalSummary: universalSummary satisfies UniversalAttemptStep[],
    },
    branchComparison,
  };
  const manifest: SkaiFileManifest = {
    artifactId: `skai:${childAttempt.attemptId}:${createdAt}`,
    title: childAttempt.title,
    problemId: childAttempt.problemId,
    attemptId: childAttempt.attemptId,
    parentAttemptId: input.publishedAttempt.branch?.parentAttemptId,
    createdAt,
    exportedBy: "skai",
    schemaVersion: skaiFileSchemaVersion,
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
    report: payload.report,
    branchComparison: payload.branchComparison,
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
    report: artifact.payload.report,
    branchComparison: artifact.payload.branchComparison,
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
