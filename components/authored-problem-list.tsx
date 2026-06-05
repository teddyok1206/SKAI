"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, Clock, Layers3 } from "lucide-react";
import { useLanguagePreference } from "@/components/language-toggle";
import { getCopy } from "@/lib/i18n";
import { useAuthoredProblems } from "@/lib/use-authored-problems";
import type { Problem } from "@/lib/types";

const categoryCopyKeys: Record<Problem["category"], string> = {
  workplace: "problemBrowser.category.workplace",
  research: "problemBrowser.category.research",
  creative: "problemBrowser.category.creative",
  data_analysis: "problemBrowser.category.dataAnalysis",
  coding: "problemBrowser.category.coding",
  strategy: "problemBrowser.category.strategy",
};

const difficultyCopyKeys: Record<Problem["difficulty"], string> = {
  intro: "problemBrowser.difficulty.intro",
  standard: "problemBrowser.difficulty.standard",
  advanced: "problemBrowser.difficulty.advanced",
};

export function AuthoredProblemList() {
  const { locale } = useLanguagePreference();
  const problems = useAuthoredProblems();
  const t = (key: string) => getCopy(key, locale);

  if (problems.length === 0) {
    return null;
  }

  return (
    <>
      <section className="section-heading">
        <p className="eyebrow">{t("localDraft.list.eyebrow")}</p>
        <h2>{t("localDraft.list.title")}</h2>
      </section>
      <section className="grid problem-grid" aria-label={t("localDraft.list.aria")}>
        {problems.map((problem) => (
          <article className="card problem-card local-draft-card" key={problem.id}>
            <div>
              <div className="tag-row">
                <span className="tag">
                  <Layers3 size={13} /> {t(categoryCopyKeys[problem.category])}
                </span>
                <span className="tag">
                  <Clock size={13} />{" "}
                  {locale === "ko"
                    ? `${problem.estimatedMinutes}${t("localDraft.list.minutesSuffix")}`
                    : `${problem.estimatedMinutes} ${t("localDraft.list.minutesSuffix")}`}
                </span>
                <span className="tag">
                  <BarChart3 size={13} /> {t(difficultyCopyKeys[problem.difficulty])}
                </span>
              </div>
              <h2>{problem.title}</h2>
              <p className="muted">{problem.subtitle}</p>
            </div>
            <Link className="button" href={`/problems/local/${problem.id}`}>
              {t("localDraft.list.action.solve")} <ArrowRight size={16} />
            </Link>
          </article>
        ))}
      </section>
    </>
  );
}
