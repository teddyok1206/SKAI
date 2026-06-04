"use client";

import Link from "next/link";
import { useLanguagePreference } from "@/components/language-toggle";
import { getCopy } from "@/lib/i18n";
import { useAuthoredProblem } from "@/lib/use-authored-problems";
import { ProblemSolver } from "@/components/problem-solver";

export function LocalProblemSolver({ problemId }: { problemId: string }) {
  const { locale } = useLanguagePreference();
  const problem = useAuthoredProblem(problemId);
  const t = (key: string) => getCopy(key, locale);

  if (!problem) {
    return (
      <section className="panel">
        <div className="panel-header">
          <p className="eyebrow">Local Draft</p>
          <h2>{t("solve.localDraft.notFoundTitle")}</h2>
        </div>
        <div className="panel-body">
          <p className="muted">{t("solve.localDraft.notFoundDescription")}</p>
          <Link className="button primary" href="/admin">
            {t("solve.localDraft.goAdmin")}
          </Link>
        </div>
      </section>
    );
  }

  return <ProblemSolver problem={problem} />;
}
