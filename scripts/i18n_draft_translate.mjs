#!/usr/bin/env node

import {
  findEntry,
  nowIso,
  otherLocale,
  parseCommonArgs,
  readRegistry,
  requireLocale,
  writeRegistry,
} from "./i18n_common.mjs";

function printHelp() {
  console.log(`SKAI i18n draft

Usage:
  npm run i18n:draft -- --key home.hero.line1 --target en --value "The fire has been given."
  npm run i18n:draft -- --key home.hero.line1 --target en

Behavior:
  - writes a draft translation for one target locale;
  - never marks it approved;
  - does not change sourceLocale or sourceChecksum.
`);
}

function defaultDraft(entry, targetLocale) {
  const sourceLocale = entry.sourceLocale ?? otherLocale(targetLocale);
  const sourceValue = entry.values?.[sourceLocale] ?? "";
  return `[draft from ${sourceLocale}] ${sourceValue}`;
}

async function main() {
  const args = parseCommonArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  if (!args.key || !args.target) {
    throw new Error("--key and --target are required");
  }

  const targetLocale = requireLocale(args.target);
  const registry = await readRegistry();
  const entry = findEntry(registry, args.key);

  if (!entry) {
    throw new Error(`copy key not found: ${args.key}`);
  }

  entry.values[targetLocale] = typeof args.value === "string" ? args.value : defaultDraft(entry, targetLocale);
  entry.status[targetLocale] = "draft";
  entry.updatedAt = nowIso();

  await writeRegistry(registry);
  console.log(`drafted ${entry.key}:${targetLocale}; approval still required`);
}

await main();

