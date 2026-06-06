#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { listSkaiFiles, readJsonFile, verifySkaiArtifact } from "./skai_file_common.mjs";

const keywordGroups = {
  goal: ["목표", "목적", "대상", "청중", "성공", "goal", "objective", "audience", "purpose", "success"],
  decomposition: ["task", "태스크", "단계", "하위", "분해", "역할", "workflow", "순서", "입력", "출력", "pipeline", "subtask"],
  material: ["자료", "첨부", "파일", "영수증", "엑셀", "csv", "근거", "대조", "비교", "기반", "material", "attachment", "source", "evidence", "compare", "ground"],
  verification: ["검증", "확인", "출처", "근거", "오류", "한계", "반례", "환각", "verify", "validate", "source", "evidence", "counterexample", "risk"],
};

function includesAny(value, words) {
  const normalized = value.toLowerCase();
  return words.some((word) => normalized.includes(word.toLowerCase()));
}

function parseArgs(argv) {
  const args = {
    input: "fixtures/skai",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    const next = argv[index + 1];

    if ((item === "--input" || item === "-i") && next) {
      args.input = next;
      index += 1;
    } else if (item === "--help") {
      console.log(`SKAI judge evidence smoke

Usage:
  npm run judge:evidence
  npm run judge:evidence -- --input fixtures/skai

Checks core .skai fixtures for the trace/graph/material shape required by the deterministic evidence packet builder.
`);
      process.exit(0);
    }
  }

  return args;
}

function fixtureSignals(artifact) {
  const trace = artifact.payload.attempt.trace ?? [];
  const userText = trace
    .filter((event) => event.role === "user")
    .map((event) => event.content)
    .join("\n");
  const attachments = trace.flatMap((event) => event.attachments ?? []);
  const materialIds = new Set(artifact.payload.problem.materials.map((material) => material.id));
  const attachedRequiredMaterialIds = new Set(
    attachments
      .filter((attachment) => attachment.source === "problem_material" && attachment.materialId && materialIds.has(attachment.materialId))
      .map((attachment) => attachment.materialId),
  );

  return {
    hasGoal: includesAny(userText, keywordGroups.goal),
    hasDecomposition: includesAny(userText, keywordGroups.decomposition),
    hasMaterialSignal: includesAny(userText, keywordGroups.material) || attachedRequiredMaterialIds.size > 0,
    hasVerification: includesAny(userText, keywordGroups.verification),
    attachedRequiredMaterialCount: attachedRequiredMaterialIds.size,
  };
}

function validateFixtureShape(artifact) {
  const errors = [];
  const trace = artifact.payload.attempt.trace ?? [];
  const graph = artifact.payload.graph.child;
  const userEvents = trace.filter((event) => event.role === "user");
  const assistantEvents = trace.filter((event) => event.role === "assistant");

  if (trace.length === 0) {
    errors.push("trace is empty");
  }

  if (!graph || !Array.isArray(graph.pairs)) {
    errors.push("child graph pairs missing");
  }

  if ((graph?.pairs?.length ?? 0) !== userEvents.length) {
    errors.push(`pair count ${graph?.pairs?.length ?? 0} does not match user turns ${userEvents.length}`);
  }

  if ((graph?.promptNodes?.filter((node) => !node.synthetic).length ?? 0) !== userEvents.length) {
    errors.push("prompt node count does not match user turns");
  }

  if ((graph?.responseNodes?.filter((node) => !node.synthetic).length ?? 0) !== assistantEvents.length) {
    errors.push("response node count does not match assistant turns");
  }

  for (const pair of graph?.pairs ?? []) {
    if (!pair.promptTraceEventId || !pair.promptNodeId || !pair.statusNodeId) {
      errors.push(`pair ${pair.id} is missing prompt/status anchors`);
    }

    if (pair.responseTraceEventId && !pair.responseNodeId) {
      errors.push(`pair ${pair.id} has response trace without response node`);
    }
  }

  return errors;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const allFiles = await listSkaiFiles(args.input);
  const inputFiles = allFiles.filter((filePath) => !filePath.includes(`${path.sep}derived${path.sep}`) && !filePath.endsWith(".judged.skai"));

  if (inputFiles.length === 0) {
    throw new Error(`No core .skai fixture files found under ${args.input}`);
  }

  let failed = 0;

  for (const filePath of inputFiles) {
    const artifact = await readJsonFile(filePath);
    const relativePath = path.relative(process.cwd(), filePath);
    const verification = verifySkaiArtifact(artifact);
    const shapeErrors = validateFixtureShape(artifact);

    if (!verification.ok || shapeErrors.length > 0) {
      failed += 1;
      console.error(`fail ${relativePath}`);
      for (const error of [...verification.errors, ...shapeErrors]) {
        console.error(`  - ${error}`);
      }
      continue;
    }

    const signals = fixtureSignals(artifact);
    console.log(
      [
        `ok ${relativePath}`,
        `pairs ${artifact.payload.graph.child.pairs.length}`,
        `goal ${signals.hasGoal ? "yes" : "no"}`,
        `decomp ${signals.hasDecomposition ? "yes" : "no"}`,
        `material ${signals.hasMaterialSignal ? "yes" : "no"}`,
        `verify ${signals.hasVerification ? "yes" : "no"}`,
        `attachedMaterials ${signals.attachedRequiredMaterialCount}`,
      ].join(" · "),
    );
  }

  if (failed > 0) {
    process.exitCode = 1;
  }
}

await main();
