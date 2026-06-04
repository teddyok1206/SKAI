#!/usr/bin/env node

import { domains, locales, readRegistry, statuses } from "./i18n_common.mjs";

function increment(map, key) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

async function main() {
  const registry = await readRegistry();
  const byDomain = new Map();
  const byStatus = new Map();
  const protectedUsage = new Map();

  for (const entry of registry) {
    increment(byDomain, entry.domain);

    for (const locale of locales) {
      increment(byStatus, `${locale}:${entry.status?.[locale] ?? "unknown"}`);
    }

    for (const term of entry.protectedTerms ?? []) {
      increment(protectedUsage, term);
    }
  }

  console.log(`SKAI i18n inventory · ${registry.length} entries`);
  console.log("");
  console.log("Domains");
  for (const domain of domains) {
    console.log(`- ${domain}: ${byDomain.get(domain) ?? 0}`);
  }

  console.log("");
  console.log("Statuses");
  for (const locale of locales) {
    for (const status of statuses) {
      console.log(`- ${locale}:${status}: ${byStatus.get(`${locale}:${status}`) ?? 0}`);
    }
  }

  console.log("");
  console.log("Protected Terms");
  for (const [term, count] of [...protectedUsage.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) {
    console.log(`- ${term}: ${count}`);
  }
}

await main();

