#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { listSkaiFiles, readJsonFile, verifySkaiArtifact } from "./skai_file_common.mjs";

function parseArgs(argv) {
  const args = {
    input: "fixtures/skai/derived",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    const next = argv[index + 1];

    if ((item === "--input" || item === "-i") && next) {
      args.input = next;
      index += 1;
    } else if (item === "--help") {
      printHelp();
      process.exit(0);
    } else if (!item.startsWith("-")) {
      args.input = item;
    }
  }

  return args;
}

function printHelp() {
  console.log(`SKAI viewer fixture smoke

Usage:
  npm run skai:viewer-smoke
  npm run skai:viewer-smoke -- fixtures/skai/derived/good-decomposition.judged.skai

Checks the fields consumed by SkaiFileViewer and SkaiExtensionRegistry:
  - valid .skai integrity;
  - child graph and trace exist;
  - derived judge/coaching extensions exist;
  - extension target ids resolve to graph/trace ids;
  - extension renderer-facing fields are present.
`);
}

function graphIdSet(artifact) {
  const graph = artifact.payload.graph.child;

  return new Set([
    artifact.payload.attempt.attemptId,
    ...artifact.payload.attempt.trace.map((event) => event.id),
    ...graph.pairs.map((pair) => pair.id),
    ...graph.promptNodes.map((node) => node.id),
    ...graph.responseNodes.map((node) => node.id),
    ...graph.statusNodes.map((node) => node.id),
    ...graph.promptEdges.map((edge) => edge.id),
    ...graph.responseEdges.map((edge) => edge.id),
    ...graph.statusEdges.map((edge) => edge.id),
  ]);
}

function validateTarget(ids, target, prefix) {
  const errors = [];

  if (!target || typeof target !== "object") {
    return [`${prefix} target is missing`];
  }

  if (!ids.has(target.targetId)) {
    errors.push(`${prefix} targetId not found: ${target.targetId}`);
  }

  if (target.pairId && !ids.has(target.pairId)) {
    errors.push(`${prefix} pairId not found: ${target.pairId}`);
  }

  for (const traceEventId of target.traceEventIds ?? []) {
    if (!ids.has(traceEventId)) {
      errors.push(`${prefix} traceEventId not found: ${traceEventId}`);
    }
  }

  return errors;
}

function validateJudgeExtension(artifact, ids) {
  const errors = [];
  const extension = artifact.extensions?.["skai.judge.v1"];

  if (!extension) {
    return ["missing skai.judge.v1"];
  }

  if (extension.schemaVersion !== "skai.judge.v1") errors.push("judge schemaVersion mismatch");
  if (!extension.rubricVersion) errors.push("judge rubricVersion missing");
  if (!extension.inputGraphHash) errors.push("judge inputGraphHash missing");
  if (!Array.isArray(extension.axisScores) || extension.axisScores.length === 0) errors.push("judge axisScores missing");
  if (!Array.isArray(extension.findings)) errors.push("judge findings missing");

  for (const [index, finding] of (extension.findings ?? []).entries()) {
    if (!finding.title) errors.push(`judge finding ${index} title missing`);
    if (!finding.explanation) errors.push(`judge finding ${index} explanation missing`);
    errors.push(...validateTarget(ids, finding.target, `judge finding ${index}`));
  }

  return errors;
}

function validateCoachExtension(artifact, ids) {
  const errors = [];
  const extension = artifact.extensions?.["skai.coach.v1"];

  if (!extension) {
    return ["missing skai.coach.v1"];
  }

  if (extension.schemaVersion !== "skai.coach.v1") errors.push("coach schemaVersion mismatch");
  if (!extension.coachingVersion) errors.push("coach coachingVersion missing");
  if (!extension.summary) errors.push("coach summary missing");
  if (!Array.isArray(extension.comments)) errors.push("coach comments missing");
  if (!Array.isArray(extension.nextPracticeTargets)) errors.push("coach nextPracticeTargets missing");

  for (const [index, comment] of (extension.comments ?? []).entries()) {
    if (!comment.title) errors.push(`coach comment ${index} title missing`);
    if (!comment.body) errors.push(`coach comment ${index} body missing`);
    errors.push(...validateTarget(ids, comment.target, `coach comment ${index}`));
  }

  return errors;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const files = await listSkaiFiles(args.input);

  if (files.length === 0) {
    throw new Error(`No .skai files found under ${args.input}`);
  }

  let failed = 0;

  for (const filePath of files) {
    const artifact = await readJsonFile(filePath);
    const verification = verifySkaiArtifact(artifact);
    const ids = graphIdSet(artifact);
    const errors = [
      ...(verification.ok ? [] : verification.errors),
      ...validateJudgeExtension(artifact, ids),
      ...validateCoachExtension(artifact, ids),
    ];
    const relativePath = path.relative(process.cwd(), filePath);

    if (errors.length > 0) {
      failed += 1;
      console.error(`fail ${relativePath}`);
      for (const error of errors) {
        console.error(`  - ${error}`);
      }
    } else {
      console.log(`ok ${relativePath} · extensions renderable`);
    }
  }

  if (failed > 0) {
    process.exitCode = 1;
  }
}

await main();

