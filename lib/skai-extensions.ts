import type { SkaiCoachExtensionV1, SkaiExtensionSchemaVersion, SkaiJudgeExtensionV1 } from "@/lib/types";

export const skaiJudgeExtensionV1 = "skai.judge.v1" satisfies SkaiExtensionSchemaVersion;
export const skaiCoachExtensionV1 = "skai.coach.v1" satisfies SkaiExtensionSchemaVersion;

export const knownSkaiExtensionOrder = [skaiJudgeExtensionV1, skaiCoachExtensionV1] as const;

export const skaiExtensionLabels: Record<(typeof knownSkaiExtensionOrder)[number], string> = {
  [skaiJudgeExtensionV1]: "Judge Layer",
  [skaiCoachExtensionV1]: "Coaching Layer",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasBaseExtensionShape(value: Record<string, unknown>, schemaVersion: SkaiExtensionSchemaVersion) {
  return (
    value.schemaVersion === schemaVersion &&
    typeof value.extensionVersion === "string" &&
    typeof value.artifactHash === "string" &&
    typeof value.inputGraphHash === "string" &&
    typeof value.createdAt === "string" &&
    isRecord(value.generator)
  );
}

export function isSkaiJudgeExtensionV1(value: unknown): value is SkaiJudgeExtensionV1 {
  if (!isRecord(value) || !hasBaseExtensionShape(value, skaiJudgeExtensionV1)) {
    return false;
  }

  return (
    typeof value.rubricVersion === "string" &&
    Array.isArray(value.axisScores) &&
    Array.isArray(value.findings) &&
    typeof value.needsHumanReview === "boolean"
  );
}

export function isSkaiCoachExtensionV1(value: unknown): value is SkaiCoachExtensionV1 {
  if (!isRecord(value) || !hasBaseExtensionShape(value, skaiCoachExtensionV1)) {
    return false;
  }

  return (
    typeof value.coachingVersion === "string" &&
    typeof value.summary === "string" &&
    Array.isArray(value.comments) &&
    Array.isArray(value.nextPracticeTargets)
  );
}

