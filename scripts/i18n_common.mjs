import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const registryPath = path.join(process.cwd(), "lib/i18n/copy-registry.json");
export const locales = ["ko", "en"];
export const statuses = ["approved", "draft", "stale", "missing"];
export const domains = [
  "brand",
  "navigation",
  "auth",
  "problem_browser",
  "solve",
  "graph",
  "skai_viewer",
  "share",
  "judge",
  "coaching",
  "system",
];

export function sha256Hex(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function sourceChecksum(entry) {
  const sourceValue = entry.values?.[entry.sourceLocale] ?? "";
  return sha256Hex(`${entry.sourceLocale}\n${sourceValue}`);
}

export async function readRegistry() {
  return JSON.parse(await readFile(registryPath, "utf8"));
}

export async function writeRegistry(registry) {
  await writeFile(registryPath, `${JSON.stringify(registry, null, 2)}\n`);
}

export function otherLocale(locale) {
  return locale === "ko" ? "en" : "ko";
}

export function parseCommonArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    const next = argv[index + 1];

    if (item.startsWith("--")) {
      const key = item.slice(2);

      if (next && !next.startsWith("--")) {
        args[key] = next;
        index += 1;
      } else {
        args[key] = true;
      }
    }
  }

  return args;
}

export function requireLocale(value) {
  if (!locales.includes(value)) {
    throw new Error(`locale must be one of: ${locales.join(", ")}`);
  }

  return value;
}

export function requireStatus(value) {
  if (!statuses.includes(value)) {
    throw new Error(`status must be one of: ${statuses.join(", ")}`);
  }

  return value;
}

export function requireDomain(value) {
  if (!domains.includes(value)) {
    throw new Error(`domain must be one of: ${domains.join(", ")}`);
  }

  return value;
}

export function findEntry(registry, key) {
  return registry.find((entry) => entry.key === key);
}

export function nowIso() {
  return new Date().toISOString();
}

