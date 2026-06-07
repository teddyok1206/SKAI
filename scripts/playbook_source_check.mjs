#!/usr/bin/env node

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const rootDir = process.cwd();
const playbookDir = path.join(rootDir, "docs/problem_playbooks");
const typedPlaybookPath = path.join(rootDir, "data/problem-playbooks.ts");
const seedProblemIds = ["ambiguous-research-brief", "club-budget-workflow", "counterfactual-product-review"];

const errors = [];

function fail(message) {
  errors.push(message);
}

function countMarkdownTurns(markdown) {
  return (markdown.match(/^## Turn \d+/gm) ?? []).length;
}

function extractFirstPrompt(markdown) {
  const firstCodeBlock = markdown.match(/```text\n([\s\S]*?)\n```/);
  return firstCodeBlock?.[1]?.trim() ?? "";
}

function topLevelTypedBlock(source, problemId) {
  const start = source.indexOf(`problemId: "${problemId}"`);
  if (start < 0) {
    return "";
  }

  const next = source.indexOf("\n  {\n    problemId:", start + 1);
  return source.slice(start, next < 0 ? source.length : next);
}

function countTopLevelTypedTurns(block) {
  const turnsStart = block.lastIndexOf("turns: [");
  if (turnsStart < 0) {
    return 0;
  }

  const finalAnswerStart = block.indexOf("finalAnswerDraft:", turnsStart);
  const turnsBlock = block.slice(turnsStart, finalAnswerStart < 0 ? block.length : finalAnswerStart);
  return (turnsBlock.match(/id: "turn-\d+"/g) ?? []).length;
}

function firstTypedTurnBlock(block) {
  const turnsStart = block.lastIndexOf("turns: [");
  if (turnsStart < 0) {
    return "";
  }

  const firstTurnStart = block.indexOf('id: "turn-1"', turnsStart);
  const secondTurnStart = block.indexOf('id: "turn-2"', firstTurnStart + 1);
  return block.slice(firstTurnStart, secondTurnStart < 0 ? block.length : secondTurnStart);
}

async function main() {
  const [typedSource, playbookFiles] = await Promise.all([readFile(typedPlaybookPath, "utf8"), readdir(playbookDir)]);

  for (const problemId of seedProblemIds) {
    const fileName = `${problemId}.md`;
    if (!playbookFiles.includes(fileName)) {
      fail(`${problemId}: missing docs/problem_playbooks/${fileName}`);
      continue;
    }

    const markdown = await readFile(path.join(playbookDir, fileName), "utf8");
    const typedBlock = topLevelTypedBlock(typedSource, problemId);

    if (!typedBlock) {
      fail(`${problemId}: missing typed playbook in data/problem-playbooks.ts`);
      continue;
    }

    const markdownTurns = countMarkdownTurns(markdown);
    const typedTurns = countTopLevelTypedTurns(typedBlock);
    const firstPrompt = extractFirstPrompt(markdown);

    if (markdownTurns === 0) {
      fail(`${problemId}: markdown playbook has no Turn sections`);
    }

    if (markdownTurns !== typedTurns) {
      fail(`${problemId}: markdown turn count ${markdownTurns} differs from typed turn count ${typedTurns}`);
    }

    if (firstPrompt.length < 100) {
      fail(`${problemId}: Turn 1 prompt must be cold-start self-contained and at least 100 chars`);
    }

    if (/SKAI Assistant|system prompt|hidden context/i.test(firstPrompt)) {
      fail(`${problemId}: Turn 1 prompt must not depend on hidden SKAI/system context`);
    }

    const markdownRequiresAttachments = markdown.includes("Before sending, attach") || markdown.includes("첨부한 자료");
    const typedFirstTurn = firstTypedTurnBlock(typedBlock);

    if (markdownRequiresAttachments && !typedFirstTurn.includes("attachmentMaterialIds")) {
      fail(`${problemId}: markdown asks for attachments but typed Turn 1 has no attachmentMaterialIds`);
    }

    if (!markdown.includes("## Optional Final Answer Field Draft")) {
      fail(`${problemId}: markdown playbook must include Optional Final Answer Field Draft`);
    }
  }

  if (errors.length > 0) {
    console.error("SKAI playbook source check failed.");
    for (const message of errors) {
      console.error(`- ${message}`);
    }
    process.exit(1);
  }

  console.log("SKAI playbook source check passed.");
  console.log(`- seed playbooks checked: ${seedProblemIds.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
