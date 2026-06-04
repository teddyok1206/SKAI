"use client";

import { Palette } from "lucide-react";
import { themeOptions, type ThemeId } from "@/lib/themes";
import { useLanguagePreference } from "@/components/language-toggle";
import { useTheme } from "@/components/theme-provider";
import { getCopy } from "@/lib/i18n";

export function ThemeSelector() {
  const { themeId, setThemeId } = useTheme();
  const { locale } = useLanguagePreference();
  const designConceptLabel = getCopy("theme.designConcept", locale);

  return (
    <label className="theme-select" title={designConceptLabel}>
      <Palette size={16} aria-hidden="true" />
      <span className="sr-only">{getCopy("theme.label", locale)}</span>
      <select value={themeId} onChange={(event) => setThemeId(event.target.value as ThemeId)} aria-label={designConceptLabel}>
        {themeOptions.map((option) => (
          <option key={option.id} value={option.id}>
            {option.priority}. {option.shortName}
          </option>
        ))}
      </select>
    </label>
  );
}
