"use client";

import Link from "next/link";
import { AuthStatus } from "@/components/auth-status";
import { LanguageToggle, useLanguagePreference } from "@/components/language-toggle";
import { ThemeSelector } from "@/components/theme-selector";
import { getCopy } from "@/lib/i18n";

export function TopbarNav() {
  const { locale } = useLanguagePreference();

  return (
    <nav className="nav" aria-label={getCopy("nav.aria.primary", locale)}>
      <Link href="/">{getCopy("nav.problems", locale)}</Link>
      <Link href="/admin">{getCopy("nav.admin", locale)}</Link>
      <LanguageToggle />
      <ThemeSelector />
      <AuthStatus />
    </nav>
  );
}
