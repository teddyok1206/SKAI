#!/usr/bin/env node

import { domains, locales, parseCommonArgs, readRegistry, sourceChecksum, statuses, writeRegistry } from "./i18n_common.mjs";

function printHelp() {
  console.log(`SKAI i18n check

Usage:
  npm run i18n:check
  node scripts/i18n_check.mjs --fix
  node scripts/i18n_check.mjs --strict-stale

Checks:
  - duplicate keys;
  - valid domain/sourceLocale/status;
  - missing approved values;
  - source checksum drift;
  - protected term preservation;
  - stale/draft status visibility.
`);
}

function includesTerm(value, term) {
  return value.toLowerCase().includes(term.toLowerCase());
}

function checkProtectedTerms(entry, locale, warnings) {
  const value = entry.values?.[locale];

  if (!value || entry.status?.[locale] === "missing") {
    return;
  }

  for (const term of entry.protectedTerms ?? []) {
    if (!includesTerm(value, term)) {
      warnings.push(`${entry.key}:${locale} does not contain protected term "${term}"`);
    }
  }
}

async function main() {
  const args = parseCommonArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  const shouldFix = Boolean(args.fix);
  const strictStale = Boolean(args["strict-stale"]);
  const registry = await readRegistry();
  const seen = new Set();
  const errors = [];
  const warnings = [];
  let changed = false;

  for (const entry of registry) {
    if (!entry.key) {
      errors.push("entry missing key");
      continue;
    }

    if (seen.has(entry.key)) {
      errors.push(`duplicate key: ${entry.key}`);
    }
    seen.add(entry.key);

    if (!domains.includes(entry.domain)) {
      errors.push(`${entry.key} has invalid domain: ${entry.domain}`);
    }

    if (!locales.includes(entry.sourceLocale)) {
      errors.push(`${entry.key} has invalid sourceLocale: ${entry.sourceLocale}`);
    }

    for (const locale of locales) {
      const status = entry.status?.[locale];
      const value = entry.values?.[locale];

      if (!statuses.includes(status)) {
        errors.push(`${entry.key}:${locale} has invalid status: ${status}`);
      }

      if (status === "approved" && !value) {
        errors.push(`${entry.key}:${locale} is approved but has no value`);
      }

      if (status === "missing" && value) {
        warnings.push(`${entry.key}:${locale} is marked missing but has a value`);
      }

      if (status === "stale" || status === "draft") {
        const message = `${entry.key}:${locale} is ${status}`;
        if (strictStale) {
          errors.push(message);
        } else {
          warnings.push(message);
        }
      }

      checkProtectedTerms(entry, locale, warnings);
    }

    const expectedChecksum = sourceChecksum(entry);

    if (entry.sourceChecksum !== expectedChecksum) {
      if (shouldFix) {
        entry.sourceChecksum = expectedChecksum;
        changed = true;
      } else {
        errors.push(`${entry.key} sourceChecksum mismatch`);
      }
    }
  }

  if (changed) {
    await writeRegistry(registry);
    console.log("updated source checksums");
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

  console.log(`ok ${registry.length} copy entries checked`);
}

await main();

