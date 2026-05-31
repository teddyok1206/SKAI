"use client";

import { Palette } from "lucide-react";
import { themeOptions, type ThemeId } from "@/lib/themes";
import { useTheme } from "@/components/theme-provider";

export function ThemeSelector() {
  const { themeId, setThemeId } = useTheme();

  return (
    <label className="theme-select" title="Design concept">
      <Palette size={16} aria-hidden="true" />
      <span className="sr-only">Theme</span>
      <select value={themeId} onChange={(event) => setThemeId(event.target.value as ThemeId)} aria-label="Design concept">
        {themeOptions.map((option) => (
          <option key={option.id} value={option.id}>
            {option.priority}. {option.shortName}
          </option>
        ))}
      </select>
    </label>
  );
}

