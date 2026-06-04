"use client";

import { useLanguagePreference } from "@/components/language-toggle";
import { getCopy } from "@/lib/i18n";

export function SkaiViewerPageHeader() {
  const { locale } = useLanguagePreference();

  return (
    <section className="page-header">
      <div>
        <p className="eyebrow">SKAI File</p>
        <h1>.skai Viewer</h1>
        <p className="lead">{getCopy("skaiViewer.page.lead", locale)}</p>
      </div>
    </section>
  );
}
