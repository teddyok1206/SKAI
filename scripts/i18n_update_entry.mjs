#!/usr/bin/env node

import {
  findEntry,
  nowIso,
  otherLocale,
  parseCommonArgs,
  readRegistry,
  requireDomain,
  requireLocale,
  requireStatus,
  sourceChecksum,
  writeRegistry,
} from "./i18n_common.mjs";

function printHelp() {
  console.log(`SKAI i18n update

Usage:
  npm run i18n:update -- --key home.hero.line1 --locale ko --value "..."
  npm run i18n:update -- --key new.copy --domain brand --locale en --value "..." --status draft

Behavior:
  - updates one locale;
  - sets that locale as sourceLocale;
  - recomputes checksum;
  - marks the opposite locale stale if it has text;
  - marks the opposite locale missing if it has no text.
`);
}

async function main() {
  const args = parseCommonArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  if (!args.key || !args.locale || typeof args.value !== "string") {
    throw new Error("--key, --locale, and --value are required");
  }

  const locale = requireLocale(args.locale);
  const status = requireStatus(args.status ?? "approved");
  const registry = await readRegistry();
  let entry = findEntry(registry, args.key);

  if (!entry) {
    if (!args.domain) {
      throw new Error("--domain is required when creating a new key");
    }

    entry = {
      key: args.key,
      domain: requireDomain(args.domain),
      sourceLocale: locale,
      protectedTerms: args.protectedTerms ? String(args.protectedTerms).split(",").map((item) => item.trim()).filter(Boolean) : [],
      values: {},
      status: {
        ko: "missing",
        en: "missing",
      },
      sourceChecksum: "",
      updatedAt: nowIso(),
    };
    registry.push(entry);
  }

  const opposite = otherLocale(locale);

  entry.values[locale] = args.value;
  entry.status[locale] = status;
  entry.sourceLocale = locale;
  entry.status[opposite] = entry.values[opposite] ? "stale" : "missing";

  if (typeof args.notes === "string") {
    entry.notes = args.notes;
  }

  entry.updatedAt = nowIso();
  entry.sourceChecksum = sourceChecksum(entry);

  await writeRegistry(registry);
  console.log(`updated ${entry.key}:${locale}; ${opposite} is ${entry.status[opposite]}`);
}

await main();

