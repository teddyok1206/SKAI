"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { defaultThemeId, isThemeId, type ThemeId } from "@/lib/themes";

const storageKey = "skai:theme";

interface ThemeContextValue {
  themeId: ThemeId;
  setThemeId: (themeId: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeIdState] = useState<ThemeId>(() => {
    if (typeof window === "undefined") {
      return defaultThemeId;
    }

    const stored = window.localStorage.getItem(storageKey);
    return isThemeId(stored) ? stored : defaultThemeId;
  });

  useEffect(() => {
    document.documentElement.dataset.theme = themeId;
    window.localStorage.setItem(storageKey, themeId);
  }, [themeId]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeId,
      setThemeId: setThemeIdState,
    }),
    [themeId],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider.");
  }

  return context;
}
