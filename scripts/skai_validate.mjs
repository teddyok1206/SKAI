#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { graphStats, listSkaiFiles, readJsonFile, verifySkaiArtifact } from "./skai_file_common.mjs";

function parseArgs(argv) {
  const args = {
    input: "fixtures/skai",
    strict: true,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    const next = argv[index + 1];

    if ((item === "--input" || item === "-i") && next) {
      args.input = next;
      index += 1;
    } else if (item === "--loose") {
      args.strict = false;
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
  console.log(`SKAI file validator

Usage:
  npm run skai:validate
  npm run skai:validate -- fixtures/skai/good-decomposition.skai
  npm run skai:validate -- --input fixtures/skai

Checks:
  - top-level .skai v1 identity
  - section hashes
  - artifact hash
  - graph node/edge/pair references
`);
}

function validateExtensions(artifact) {
  const errors = [];
  const extensions = artifact.extensions ?? {};
  const graphHash = artifact.integrity?.sectionHashes?.graph;

  for (const [key, extension] of Object.entries(extensions)) {
    if (!extension || typeof extension !== "object") {
      errors.push(`extension ${key} must be an object`);
      continue;
    }

    if (extension.schemaVersion !== key) {
      errors.push(`extension ${key} schemaVersion mismatch`);
    }

    if (extension.inputGraphHash !== graphHash) {
      errors.push(`extension ${key} inputGraphHash mismatch`);
    }

    if (!extension.createdAt) {
      errors.push(`extension ${key} missing createdAt`);
    }
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
    const extensionErrors = validateExtensions(artifact);
    const ok = verification.ok && extensionErrors.length === 0;
    const stats = graphStats(artifact.payload?.graph?.child);
    const relativePath = path.relative(process.cwd(), filePath);

    if (ok) {
      console.log(`ok ${relativePath} · ${stats.pairs} pairs · ${artifact.integrity.artifactHash.slice(0, 12)}`);
    } else {
      failed += 1;
      console.error(`fail ${relativePath}`);
      for (const error of [...verification.errors, ...extensionErrors]) {
        console.error(`  - ${error}`);
      }
    }
  }

  if (failed > 0 && args.strict) {
    process.exitCode = 1;
  }
}

await main();

