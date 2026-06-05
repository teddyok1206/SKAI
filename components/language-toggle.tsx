"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { getCopy, localeStorageKey, normalizeLocale, supportedLocales, type Locale } from "@/lib/i18n";

type LanguageChangeEvent = CustomEvent<{ locale: Locale }>;

function readStoredLocale(): Locale {
  if (typeof window === "undefined") {
    return "ko";
  }

  return normalizeLocale(window.localStorage.getItem(localeStorageKey));
}

function subscribeToLocale(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  function handleStorage(event: StorageEvent) {
    if (event.key === localeStorageKey) {
      callback();
    }
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener("skai:locale-change", callback);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("skai:locale-change", callback);
  };
}

export function useLanguagePreference(): { locale: Locale; setLocale: (nextLocale: Locale) => void } {
  const locale = useSyncExternalStore<Locale>(subscribeToLocale, readStoredLocale, () => "ko");

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((nextLocale: Locale) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(localeStorageKey, nextLocale);
      const event: LanguageChangeEvent = new CustomEvent("skai:locale-change", { detail: { locale: nextLocale } });
      window.dispatchEvent(event);
    }
  }, []);

  return { locale, setLocale };
}

export function LanguageToggle() {
  const { locale, setLocale } = useLanguagePreference();

  return (
    <div className="language-toggle" aria-label={getCopy("language.toggle.aria", locale)}>
      {supportedLocales.map((item) => (
        <button
          aria-pressed={locale === item}
          className={locale === item ? "active" : ""}
          key={item}
          onClick={() => setLocale(item)}
          type="button"
        >
          {getCopy(`language.toggle.${item}`, item)}
        </button>
      ))}
    </div>
  );
}
