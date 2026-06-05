#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { parseCommonArgs, readRegistry } from "./i18n_common.mjs";

const sourceRoots = ["app", "components", "lib"];
const hardcodedRoots = ["app", "components"];
const sourceExtensions = new Set([".ts", ".tsx"]);
const baselinePath = path.join(process.cwd(), "scripts/i18n_source_baseline.json");
const allowlistPath = path.join(process.cwd(), "scripts/i18n_usage_allowlist.json");
const userFacingAttributeNames = ["aria-label", "title", "placeholder", "alt"];

function printHelp() {
  console.log(`SKAI i18n source check

Usage:
  node scripts/i18n_source_check.mjs
  node scripts/i18n_source_check.mjs --update-baseline

Checks:
  - static getCopy/t keys exist in the registry;
  - registry keys are referenced by static keys, dynamic key templates, or the allowlist;
  - selected TSX files do not add new raw JSX text/attributes beyond the current baseline.
`);
}

async function listSourceFiles(root) {
  const { readdir } = await import("node:fs/promises");
  const entries = await readdir(root, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);

    if (entry.isDirectory()) {
      if ([".next", "node_modules"].includes(entry.name)) {
        continue;
      }
      files.push(...(await listSourceFiles(fullPath)));
      continue;
    }

    if (entry.isFile() && sourceExtensions.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

async function sourceFiles(roots) {
  const files = [];

  for (const root of roots) {
    if (existsSync(root)) {
      files.push(...(await listSourceFiles(root)));
    }
  }

  return files.sort();
}

function stripLineComments(value) {
  return value
    .split("\n")
    .map((line) => line.replace(/\/\/.*$/, ""))
    .join("\n");
}

function normalizeText(value) {
  return value.replace(/\s+/g, " ").trim();
}

function hasHumanText(value) {
  return /[가-힣]/.test(value) || /[A-Za-z]{3,}/.test(value);
}

function shouldIgnoreLiteral(value) {
  const text = normalizeText(value);

  if (!text || !hasHumanText(text)) {
    return true;
  }

  if (/^[A-Z0-9_./:-]+$/.test(text)) {
    return true;
  }

  if (/^(true|false|null|undefined)$/i.test(text)) {
    return true;
  }

  if (text.includes(";") || /\b(const|function|return|useMemo|useState)\b/.test(text)) {
    return true;
  }

  return false;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function templateToRegex(template) {
  const parts = template.split(/(\$\{[^}]+\})/g).filter(Boolean);
  const pattern = parts
    .map((part) => {
      if (part.startsWith("${")) {
        return "[^.]+";
      }
      return escapeRegExp(part);
    })
    .join("");

  return new RegExp(`^${pattern}$`);
}

function extractCopyCalls(content) {
  const staticKeys = new Set();
  const dynamicTemplates = [];
  const unknownCalls = [];
  const directCallPattern = /\b(?:getCopy|t)\(\s*(["'`])([^"'`]*?)\1/g;
  let match;

  while ((match = directCallPattern.exec(content))) {
    const quote = match[1];
    const value = match[2];

    if (quote === "`" && value.includes("${")) {
      dynamicTemplates.push(value);
      continue;
    }

    if (value.includes("${")) {
      unknownCalls.push(value);
      continue;
    }

    staticKeys.add(value);
  }

  return { staticKeys, dynamicTemplates, unknownCalls };
}

function registryKeyLiteralsInSource(content, registryKeys) {
  const found = new Set();

  for (const key of registryKeys) {
    if (content.includes(`"${key}"`) || content.includes(`'${key}'`) || content.includes(`\`${key}\``)) {
      found.add(key);
    }
  }

  return found;
}

function extractHardcodedText(file, content) {
  if (!file.endsWith(".tsx")) {
    return [];
  }

  const stripped = stripLineComments(content);
  const findings = [];
  const jsxTextPattern = />\s*([^<>{}\n][^<>{}]*)\s*</g;
  let match;

  while ((match = jsxTextPattern.exec(stripped))) {
    const text = normalizeText(match[1]);

    if (!shouldIgnoreLiteral(text)) {
      findings.push({ file, text });
    }
  }

  const attributePattern = new RegExp(`\\b(${userFacingAttributeNames.join("|")})=["']([^"']+)["']`, "g");

  while ((match = attributePattern.exec(stripped))) {
    const text = normalizeText(match[2]);

    if (!shouldIgnoreLiteral(text)) {
      findings.push({ file, text, attribute: match[1] });
    }
  }

  return findings;
}

function countFindings(findings) {
  const counts = new Map();

  for (const finding of findings) {
    const key = `${finding.file}\u0000${finding.attribute ?? "text"}\u0000${finding.text}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([key, count]) => {
      const [file, attribute, text] = key.split("\u0000");
      return { file, attribute, text, count };
    })
    .sort((a, b) => a.file.localeCompare(b.file) || a.attribute.localeCompare(b.attribute) || a.text.localeCompare(b.text));
}

async function readJsonIfExists(filePath, fallback) {
  if (!existsSync(filePath)) {
    return fallback;
  }

  return JSON.parse(await readFile(filePath, "utf8"));
}

function hardcodedBaselineErrors(current, baseline) {
  const allowed = new Map((baseline.hardcodedText ?? []).map((item) => [`${item.file}\u0000${item.attribute}\u0000${item.text}`, item.count]));
  const errors = [];

  for (const item of current) {
    const key = `${item.file}\u0000${item.attribute}\u0000${item.text}`;
    const allowedCount = allowed.get(key) ?? 0;

    if (item.count > allowedCount) {
      errors.push(`${item.file}: raw ${item.attribute} "${item.text}" count ${item.count} exceeds baseline ${allowedCount}`);
    }
  }

  return errors;
}

function checkBrandOfficialCopy(registry) {
  const official = {
    "home.hero.line1": {
      ko: "불꽃은 주어졌습니다.",
      en: "The fire has been given.",
    },
    "home.hero.line2": {
      ko: "이제 당신의 장작을 넣을 차례입니다.",
      en: "Now bring your own fuel.",
    },
  };
  const errors = [];

  for (const [key, expected] of Object.entries(official)) {
    const entry = registry.find((item) => item.key === key);

    if (!entry) {
      errors.push(`${key} official brand copy is missing`);
      continue;
    }

    for (const [locale, value] of Object.entries(expected)) {
      if (entry.values?.[locale] !== value) {
        errors.push(`${key}:${locale} official brand copy changed`);
      }
    }
  }

  return errors;
}

async function main() {
  const args = parseCommonArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  const registry = await readRegistry();
  const registryKeys = registry.map((entry) => entry.key);
  const registryKeySet = new Set(registryKeys);
  const files = await sourceFiles(sourceRoots);
  const hardcodedFiles = new Set(await sourceFiles(hardcodedRoots));
  const staticUsedKeys = new Set();
  const literalUsedKeys = new Set();
  const dynamicRegexes = [];
  const errors = [];
  const warnings = [];
  const hardcodedFindings = [];
  const allowlist = await readJsonIfExists(allowlistPath, { reservedKeys: [], dynamicKeyTemplates: [] });

  for (const template of allowlist.dynamicKeyTemplates ?? []) {
    dynamicRegexes.push(templateToRegex(template));
  }

  for (const file of files) {
    const content = await readFile(file, "utf8");
    const { staticKeys, dynamicTemplates, unknownCalls } = extractCopyCalls(content);

    for (const key of staticKeys) {
      staticUsedKeys.add(key);
      if (!registryKeySet.has(key)) {
        errors.push(`${file}: copy key "${key}" is not in the registry`);
      }
    }

    for (const template of dynamicTemplates) {
      dynamicRegexes.push(templateToRegex(template));
    }

    for (const call of unknownCalls) {
      warnings.push(`${file}: could not classify dynamic copy call "${call}"`);
    }

    for (const key of registryKeyLiteralsInSource(content, registryKeys)) {
      literalUsedKeys.add(key);
    }

    if (hardcodedFiles.has(file)) {
      hardcodedFindings.push(...extractHardcodedText(file, content));
    }
  }

  const usedKeys = new Set([...staticUsedKeys, ...literalUsedKeys]);
  const reservedKeys = new Set(allowlist.reservedKeys ?? []);
  const unusedKeys = registryKeys.filter((key) => {
    if (usedKeys.has(key) || reservedKeys.has(key)) {
      return false;
    }

    return !dynamicRegexes.some((regex) => regex.test(key));
  });

  if (unusedKeys.length > 0) {
    for (const key of unusedKeys) {
      errors.push(`registry key "${key}" is not referenced by source or allowlist`);
    }
  }

  errors.push(...checkBrandOfficialCopy(registry));

  const hardcodedText = countFindings(hardcodedFindings);

  if (args["update-baseline"]) {
    await writeFile(
      baselinePath,
      `${JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          note: "Current raw JSX text/attribute baseline. New raw user-facing text should go through lib/i18n/copy-registry.json instead of increasing this baseline.",
          hardcodedText,
        },
        null,
        2,
      )}\n`,
    );
    console.log(`updated ${path.relative(process.cwd(), baselinePath)} with ${hardcodedText.length} hardcoded text entries`);
  } else {
    const baseline = await readJsonIfExists(baselinePath, null);

    if (!baseline) {
      errors.push(`${path.relative(process.cwd(), baselinePath)} is missing; run node scripts/i18n_source_check.mjs --update-baseline`);
    } else {
      errors.push(...hardcodedBaselineErrors(hardcodedText, baseline));
    }
  }

  for (const warning of warnings) {
    console.warn(`warn ${warning}`);
  }

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`error ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`ok source i18n checks passed · ${registry.length} registry keys · ${files.length} source files`);
}

await main();
