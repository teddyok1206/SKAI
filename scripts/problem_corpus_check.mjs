#!/usr/bin/env node

import { access, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const rootDir = process.cwd();
const batchPath = path.join(rootDir, "docs/problem_generation/batches/001_30problems.json");
const problemSourcePath = path.join(rootDir, "data/problems.ts");
const generatedImporterPath = path.join(rootDir, "data/generated-problem-batch-001.ts");
const playbookDir = path.join(rootDir, "docs/problem_playbooks");

const seedProblemIds = ["ambiguous-research-brief", "club-budget-workflow", "counterfactual-product-review"];
const validCategories = new Set(["workplace", "research", "creative", "data_analysis", "coding", "strategy"]);
const validDifficulties = new Set(["intro", "standard", "advanced"]);
const validGoalProfiles = new Set([
  "accuracy_first",
  "speed_first",
  "cost_constrained",
  "workflow_adoption",
  "learning_oriented",
  "exploration",
]);
const validMaterialKinds = new Set(["image", "spreadsheet", "csv", "text", "pdf", "other"]);
const validPrimarySkills = new Set([
  "problem_definition",
  "decomposition",
  "material_grounding",
  "verification",
  "adaptation",
  "cost_control",
  "workflow_design",
  "stakeholder_alignment",
]);
const liveProviders = new Set(["groq", "xai", "openai", "openrouter", "gemini"]);

const errors = [];
const warnings = [];
const confirmedRows = [];

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

function isNonEmptyString(value, minLength = 1) {
  return typeof value === "string" && value.trim().length >= minLength;
}

function isIsoDate(value) {
  return isNonEmptyString(value) && !Number.isNaN(Date.parse(value));
}

function assertArray(value, label, minLength = 0) {
  if (!Array.isArray(value)) {
    fail(`${label} must be an array`);
    return [];
  }

  if (value.length < minLength) {
    fail(`${label} must contain at least ${minLength} item(s)`);
  }

  return value;
}

function normalizeId(value) {
  return String(value ?? "").trim();
}

async function requireReadable(filePath, label) {
  try {
    await access(filePath);
  } catch {
    fail(`${label} is missing: ${path.relative(rootDir, filePath)}`);
  }
}

function duplicateValues(values) {
  const seen = new Set();
  const duplicates = new Set();

  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    }
    seen.add(value);
  }

  return [...duplicates];
}

function validateProblemShape(problem, label) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(problem.id ?? "")) {
    fail(`${label}: id must be lowercase kebab-case`);
  }
  if (!isNonEmptyString(problem.title, 4)) fail(`${label}: title is missing or too short`);
  if (!isNonEmptyString(problem.subtitle, 8)) fail(`${label}: subtitle is missing or too short`);
  if (!validCategories.has(problem.category)) fail(`${label}: invalid category ${problem.category}`);
  if (!validDifficulties.has(problem.difficulty)) fail(`${label}: invalid difficulty ${problem.difficulty}`);
  if (!validGoalProfiles.has(problem.goalProfile)) fail(`${label}: invalid goalProfile ${problem.goalProfile}`);
  if (!Number.isInteger(problem.estimatedMinutes) || problem.estimatedMinutes < 10 || problem.estimatedMinutes > 90) {
    fail(`${label}: estimatedMinutes must be an integer between 10 and 90`);
  }
  if (!isNonEmptyString(problem.statement, 30)) fail(`${label}: statement is missing or too short`);
  if (!isNonEmptyString(problem.userGoal, 25)) fail(`${label}: userGoal is missing or too short`);
  assertArray(problem.constraints, `${label}: constraints`, 2);
  assertArray(problem.starterContext, `${label}: starterContext`, 1);
  assertArray(problem.deliverables, `${label}: deliverables`, 2);
  if (!Array.isArray(problem.allowedProviders) || !problem.allowedProviders.includes("mock")) {
    fail(`${label}: allowedProviders must include mock`);
  }
  if (!Array.isArray(problem.allowedProviders) || !problem.allowedProviders.some((provider) => liveProviders.has(provider))) {
    fail(`${label}: allowedProviders must include at least one live provider`);
  }
  if (problem.rubricKey !== "defaultRubric") fail(`${label}: rubricKey must be defaultRubric`);
  if (!isIsoDate(problem.createdAt)) fail(`${label}: createdAt must be ISO-like`);
}

function validateMaterials(problem, label) {
  const materials = assertArray(problem.materials, `${label}: materials`);
  const materialIds = materials.map((material) => normalizeId(material.id));

  for (const duplicate of duplicateValues(materialIds)) {
    fail(`${label}: duplicate material id ${duplicate}`);
  }

  for (const material of materials) {
    const materialLabel = `${label}: material ${material.id ?? "(missing id)"}`;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(material.id ?? "")) fail(`${materialLabel}: id must be lowercase kebab-case`);
    if (!isNonEmptyString(material.title, 4)) fail(`${materialLabel}: title is missing or too short`);
    if (!isNonEmptyString(material.description, 10)) fail(`${materialLabel}: description is missing or too short`);
    if (!validMaterialKinds.has(material.kind)) fail(`${materialLabel}: invalid kind ${material.kind}`);
    if (!isNonEmptyString(material.fileName, 3)) fail(`${materialLabel}: fileName is missing`);
    if (!isNonEmptyString(material.mimeType, 3)) fail(`${materialLabel}: mimeType is missing`);
    if (!isNonEmptyString(material.extractedText, 40)) fail(`${materialLabel}: extractedText must be available for demo solving`);
  }

  return new Set(materialIds);
}

function validateClassification(classification, label) {
  if (!classification || typeof classification !== "object") {
    fail(`${label}: classification is missing`);
    return;
  }
  if (!isNonEmptyString(classification.domain, 2)) fail(`${label}: classification.domain is missing`);
  if (!isNonEmptyString(classification.subdomain, 2)) fail(`${label}: classification.subdomain is missing`);
  if (!validPrimarySkills.has(classification.primarySkill)) fail(`${label}: invalid primarySkill ${classification.primarySkill}`);
  assertArray(classification.secondarySkills, `${label}: classification.secondarySkills`, 1);
  assertArray(classification.materialProfile, `${label}: classification.materialProfile`);
  if (!["low", "medium", "high"].includes(classification.ambiguityLevel)) fail(`${label}: invalid ambiguityLevel ${classification.ambiguityLevel}`);
  if (!["none", "low", "medium", "high"].includes(classification.externalKnowledgeNeed)) {
    fail(`${label}: invalid externalKnowledgeNeed ${classification.externalKnowledgeNeed}`);
  }
  if (!Number.isInteger(classification.expectedTurns) || classification.expectedTurns < 2) {
    fail(`${label}: classification.expectedTurns must be at least 2`);
  }
  if (!isNonEmptyString(classification.primaryFailureMode, 20)) fail(`${label}: primaryFailureMode is missing or too short`);
  if (!isNonEmptyString(classification.idealBottleneck, 20)) fail(`${label}: idealBottleneck is missing or too short`);
  if (!isNonEmptyString(classification.graphPattern, 40)) fail(`${label}: graphPattern is missing or too short`);
}

function validatePlaybook(playbook, problem, materialIds, label) {
  if (!playbook || typeof playbook !== "object") {
    fail(`${label}: playbook is missing`);
    return;
  }

  if (!isNonEmptyString(playbook.recommendedMode, 3)) fail(`${label}: playbook.recommendedMode is missing`);
  if (!isNonEmptyString(playbook.recommendedModel, 3)) fail(`${label}: playbook.recommendedModel is missing`);
  assertArray(playbook.smokeNotes, `${label}: playbook.smokeNotes`, 1);
  if (!isNonEmptyString(playbook.weakTracePattern, 20)) fail(`${label}: weakTracePattern is missing or too short`);
  if (!isNonEmptyString(playbook.goodTracePattern, 40)) fail(`${label}: goodTracePattern is missing or too short`);
  if (!isNonEmptyString(playbook.optionalFinalAnswerFieldDraft, 40)) {
    fail(`${label}: optionalFinalAnswerFieldDraft must be present for operator end-to-end runs`);
  }

  const attachments = assertArray(playbook.attachments, `${label}: playbook.attachments`);
  const turns = assertArray(playbook.turns, `${label}: playbook.turns`, 3);
  const attachedAcrossTurns = new Set();

  for (const attachmentId of attachments) {
    if (!materialIds.has(attachmentId)) {
      fail(`${label}: playbook attachment ${attachmentId} does not exist in materials`);
    }
  }

  for (const [index, turn] of turns.entries()) {
    const turnLabel = `${label}: turn ${index + 1}`;
    if (turn.turn !== index + 1) fail(`${turnLabel}: turn number must be sequential`);
    const minimumPromptLength = index === 0 ? 100 : 30;
    if (!isNonEmptyString(turn.prompt, minimumPromptLength)) {
      fail(
        `${turnLabel}: prompt must be ${index === 0 ? "cold-start self-contained" : "usable as a follow-up"} and at least ${minimumPromptLength} chars`,
      );
    }
    const attachMaterialIds = assertArray(turn.attachMaterialIds, `${turnLabel}: attachMaterialIds`);
    for (const materialId of attachMaterialIds) {
      attachedAcrossTurns.add(materialId);
      if (!materialIds.has(materialId)) {
        fail(`${turnLabel}: attachment ${materialId} does not exist in materials`);
      }
    }
  }

  if (problem.materials.length === 0 && (attachments.length > 0 || attachedAcrossTurns.size > 0)) {
    fail(`${label}: no-material problem should not reference attachments`);
  }
  if (problem.materials.length > 0 && attachedAcrossTurns.size === 0) {
    fail(`${label}: material problem must attach materials in at least one playbook turn`);
  }
  if (problem.materials.length >= 2 && attachedAcrossTurns.size < Math.min(2, problem.materials.length)) {
    fail(`${label}: multi-material problem must force cross-material handling in playbook turns`);
  }
}

async function validateSeedProblemPlaybooks(problemSource) {
  for (const problemId of seedProblemIds) {
    await requireReadable(path.join(playbookDir, `${problemId}.md`), `seed playbook for ${problemId}`);
    if (!problemSource.includes(`id: "${problemId}"`)) {
      fail(`seed problem ${problemId} is not present in data/problems.ts`);
    }
    if (!problemSource.includes(`problemId: "${problemId}"`)) {
      fail(`seed playbook ${problemId} is not present in data/problem-playbooks.ts`);
    }
  }
}

async function main() {
  const [batchRaw, problemSource, generatedImporterSource, playbookSource] = await Promise.all([
    readFile(batchPath, "utf8"),
    readFile(problemSourcePath, "utf8"),
    readFile(generatedImporterPath, "utf8"),
    readFile(path.join(rootDir, "data/problem-playbooks.ts"), "utf8"),
  ]);

  const batch = JSON.parse(batchRaw);
  const generatedProblems = assertArray(batch.problems, "batch.problems", 30);
  const generatedIds = generatedProblems.map((entry) => normalizeId(entry?.appProblem?.id));
  const allProblemIds = [...seedProblemIds, ...generatedIds];

  if (generatedProblems.length !== 30) fail(`batch 001 must contain exactly 30 generated problems, found ${generatedProblems.length}`);
  for (const duplicate of duplicateValues(allProblemIds)) {
    fail(`duplicate problem id across corpus: ${duplicate}`);
  }
  if (!generatedImporterSource.includes("normalizeMaterial") || !generatedImporterSource.includes("/synthetic/skai/")) {
    fail("generated importer must explicitly normalize synthetic material hrefs");
  }

  await validateSeedProblemPlaybooks(playbookSource + "\n" + problemSource);

  for (const [index, entry] of generatedProblems.entries()) {
    const problem = entry?.appProblem;
    const label = `generated ${String(index + 1).padStart(2, "0")} ${problem?.id ?? "(missing id)"}`;

    if (!problem || typeof problem !== "object") {
      fail(`${label}: appProblem is missing`);
      continue;
    }

    validateProblemShape(problem, label);
    const materialIds = validateMaterials(problem, label);
    validateClassification(entry.classification, label);
    validatePlaybook(entry.playbook, problem, materialIds, label);

    if (entry.classification?.expectedTurns !== entry.playbook?.turns?.length) {
      warn(`${label}: classification.expectedTurns ${entry.classification?.expectedTurns} differs from playbook turn count ${entry.playbook?.turns?.length}`);
    }

    confirmedRows.push({
      id: problem.id,
      category: problem.category,
      difficulty: problem.difficulty,
      materials: problem.materials.length,
      turns: entry.playbook?.turns?.length ?? 0,
      primarySkill: entry.classification?.primarySkill,
    });
  }

  console.log(`SKAI problem corpus check`);
  console.log(`- seed problems: ${seedProblemIds.length}`);
  console.log(`- generated batch 001 problems: ${generatedProblems.length}`);
  console.log(`- total corpus problems: ${allProblemIds.length}`);
  console.log(`- generated rows checked: ${confirmedRows.length}`);
  console.log("");
  console.table(confirmedRows);

  if (warnings.length > 0) {
    console.log("\nWarnings:");
    for (const message of warnings) console.log(`- ${message}`);
  }

  if (errors.length > 0) {
    console.error("\nErrors:");
    for (const message of errors) console.error(`- ${message}`);
    process.exit(1);
  }

  console.log("\nProblem corpus check passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
