"use client";

import { useEffect, useState } from "react";
import { getCopy, localeStorageKey, normalizeLocale, supportedLocales, type Locale } from "@/lib/i18n";

type LanguageChangeEvent = CustomEvent<{ locale: Locale }>;

function readStoredLocale(): Locale {
  if (typeof window === "undefined") {
    return "ko";
  }

  return normalizeLocale(window.localStorage.getItem(localeStorageKey));
}

export function useLanguagePreference() {
  const [locale, setLocaleState] = useState<Locale>(() => readStoredLocale());

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key === localeStorageKey) {
        setLocaleState(normalizeLocale(event.newValue));
      }
    }

    function handleLanguageChange(event: Event) {
      setLocaleState((event as LanguageChangeEvent).detail.locale);
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener("skai:locale-change", handleLanguageChange);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("skai:locale-change", handleLanguageChange);
    };
  }, []);

  function setLocale(nextLocale: Locale) {
    setLocaleState(nextLocale);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(localeStorageKey, nextLocale);
      window.dispatchEvent(new CustomEvent("skai:locale-change", { detail: { locale: nextLocale } }));
    }
  }

  return { locale, setLocale };
}

export function LanguageToggle() {
  const { locale, setLocale } = useLanguagePreference();

  return (
    <div className="language-toggle" aria-label="Language">
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
