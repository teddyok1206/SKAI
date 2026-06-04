import copyRegistryJson from "@/lib/i18n/copy-registry.json";
import type { CopyEntry, CopyLookupOptions, Locale } from "@/lib/i18n/types";

export const supportedLocales = ["ko", "en"] as const satisfies Locale[];
export const defaultLocale = "ko" satisfies Locale;
export const localeStorageKey = "skai.locale";

export const copyRegistry = copyRegistryJson as CopyEntry[];

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "ko" || value === "en";
}

export function normalizeLocale(value: string | null | undefined): Locale {
  return isLocale(value) ? value : defaultLocale;
}

export function getCopyEntry(key: string): CopyEntry | undefined {
  return copyRegistry.find((entry) => entry.key === key);
}

export function getCopy(key: string, locale: Locale = defaultLocale, options: CopyLookupOptions = {}) {
  const fallbackLocale = options.fallbackLocale ?? defaultLocale;
  const entry = getCopyEntry(key);

  if (!entry) {
    return key;
  }

  const status = entry.status[locale];
  const value = entry.values[locale];

  if (value && (options.allowDraft || status === "approved")) {
    return value;
  }

  const fallbackValue = entry.values[fallbackLocale];

  if (fallbackValue) {
    return fallbackValue;
  }

  return entry.values[entry.sourceLocale] ?? key;
}

export function copyEntriesByDomain() {
  return copyRegistry.reduce<Record<string, CopyEntry[]>>((acc, entry) => {
    acc[entry.domain] ??= [];
    acc[entry.domain].push(entry);
    return acc;
  }, {});
}

