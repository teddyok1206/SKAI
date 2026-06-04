"use client";

import { useLanguagePreference } from "@/components/language-toggle";
import { getCopy } from "@/lib/i18n";

export function AdminPageHeader() {
  const { locale } = useLanguagePreference();

  return (
    <section className="page-header">
      <div>
        <p className="eyebrow">{getCopy("admin.header.eyebrow", locale)}</p>
        <h1>{getCopy("admin.header.title", locale)}</h1>
        <p className="lead">{getCopy("admin.header.lead", locale)}</p>
      </div>
    </section>
  );
}
