"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BarChart3, Clock, FileText, Layers3, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import type { GeneratedProblemClassification } from "@/data/generated-problem-batch-001";
import { useLanguagePreference } from "@/components/language-toggle";
import { getCopy } from "@/lib/i18n";
import { useGeneratedProblemEditorialMap } from "@/lib/use-generated-problem-editorial";
import type { Problem, ProblemCategory, MaterialKind } from "@/lib/types";

const categoryCopyKeys: Record<ProblemCategory, string> = {
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

const materialCopyKeys: Record<MaterialKind | "none" | "any", string> = {
  any: "problemBrowser.material.any",
  none: "problemBrowser.material.none",
  image: "problemBrowser.material.image",
  spreadsheet: "problemBrowser.material.spreadsheet",
  csv: "problemBrowser.material.csv",
  text: "problemBrowser.material.text",
  pdf: "problemBrowser.material.pdf",
  other: "problemBrowser.material.other",
};

const curationCopyKeys = {
  all: "problemBrowser.curation.all",
  first_run: "problemBrowser.curation.firstRun",
  material_control: "problemBrowser.curation.materialControl",
  verification_replay: "problemBrowser.curation.verificationReplay",
} as const;

type CurationId = keyof typeof curationCopyKeys;

type FilterValue<T extends string> = "all" | T;

interface ProblemBrowserProps {
  problems: Problem[];
  classifications?: Record<string, GeneratedProblemClassification>;
  generatedProblemIds?: string[];
}

function problemMaterialKinds(problem: Problem) {
  return [...new Set(problem.materials.map((material) => material.kind))];
}

function curationMatches(problem: Problem, classification: GeneratedProblemClassification | undefined, curation: CurationId) {
  if (curation === "all") {
    return true;
  }

  if (curation === "first_run") {
    return problem.difficulty === "intro" || problem.estimatedMinutes <= 20;
  }

  if (curation === "material_control") {
    return problem.materials.length >= 2 || classification?.primarySkill === "material_grounding";
  }

  return problem.goalProfile === "accuracy_first" || problem.difficulty === "advanced" || classification?.primarySkill === "verification";
}

function buildSearchText(problem: Problem, classification: GeneratedProblemClassification | undefined) {
  return [
    problem.id,
    problem.title,
    problem.subtitle,
    problem.category,
    problem.difficulty,
    problem.goalProfile,
    problem.statement,
    problem.userGoal,
    ...problem.constraints,
    ...problem.starterContext,
    ...problem.deliverables,
    ...problem.materials.flatMap((material) => [
      material.title,
      material.description,
      material.kind,
      material.fileName,
      material.extractedText,
    ]),
    classification?.domain,
    classification?.subdomain,
    classification?.primarySkill,
    ...(classification?.secondarySkills ?? []),
    ...(classification?.materialProfile ?? []),
    classification?.primaryFailureMode,
    classification?.idealBottleneck,
    classification?.graphPattern,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function matchesQuery(problem: Problem, classification: GeneratedProblemClassification | undefined, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  const terms = normalizedQuery.split(/\s+/).filter(Boolean);
  const haystack = buildSearchText(problem, classification);
  return terms.every((term) => haystack.includes(term));
}

function materialCountLabel(problem: Problem, locale: "ko" | "en") {
  if (problem.materials.length === 0) {
    return getCopy("problemBrowser.material.none", locale);
  }

  const suffix = getCopy("problemBrowser.material.countSuffix", locale);
  return locale === "ko" ? `${problem.materials.length}${suffix}` : `${problem.materials.length} ${suffix}`;
}

export function ProblemBrowser({ problems, classifications = {}, generatedProblemIds = [] }: ProblemBrowserProps) {
  const { locale } = useLanguagePreference();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FilterValue<ProblemCategory>>("all");
  const [difficulty, setDifficulty] = useState<FilterValue<Problem["difficulty"]>>("all");
  const [materialKind, setMaterialKind] = useState<MaterialKind | "none" | "any">("any");
  const [curation, setCuration] = useState<CurationId>("all");
  const categoryLabels = useMemo(
    () =>
      Object.fromEntries(
        (Object.keys(categoryCopyKeys) as ProblemCategory[]).map((item) => [item, getCopy(categoryCopyKeys[item], locale)]),
      ) as Record<ProblemCategory, string>,
    [locale],
  );
  const difficultyLabels = useMemo(
    () =>
      Object.fromEntries(
        (Object.keys(difficultyCopyKeys) as Problem["difficulty"][]).map((item) => [item, getCopy(difficultyCopyKeys[item], locale)]),
      ) as Record<Problem["difficulty"], string>,
    [locale],
  );
  const materialLabels = useMemo(
    () =>
      Object.fromEntries(
        (Object.keys(materialCopyKeys) as Array<MaterialKind | "none" | "any">).map((item) => [item, getCopy(materialCopyKeys[item], locale)]),
      ) as Record<MaterialKind | "none" | "any", string>,
    [locale],
  );
  const curationLabels = useMemo(
    () =>
      Object.fromEntries((Object.keys(curationCopyKeys) as CurationId[]).map((item) => [item, getCopy(curationCopyKeys[item], locale)])) as Record<
        CurationId,
        string
      >,
    [locale],
  );
  const editorialMap = useGeneratedProblemEditorialMap();
  const generatedProblemIdSet = useMemo(() => new Set(generatedProblemIds), [generatedProblemIds]);
  const visibleProblems = useMemo(
    () =>
      problems.filter((problem) => {
        if (!generatedProblemIdSet.has(problem.id)) {
          return true;
        }

        return editorialMap.get(problem.id)?.isPublished ?? false;
      }),
    [editorialMap, generatedProblemIdSet, problems],
  );
  const hiddenGeneratedCount = problems.length - visibleProblems.length;

  const filteredProblems = useMemo(
    () =>
      visibleProblems.filter((problem) => {
        const classification = classifications[problem.id];
        const materialKinds = problemMaterialKinds(problem);

        if (!matchesQuery(problem, classification, query)) {
          return false;
        }

        if (category !== "all" && problem.category !== category) {
          return false;
        }

        if (difficulty !== "all" && problem.difficulty !== difficulty) {
          return false;
        }

        if (materialKind === "none" && problem.materials.length > 0) {
          return false;
        }

        if (materialKind !== "any" && materialKind !== "none" && !materialKinds.includes(materialKind)) {
          return false;
        }

        return curationMatches(problem, classification, curation);
      }),
    [category, classifications, curation, difficulty, materialKind, query, visibleProblems],
  );

  const topDomains = useMemo(() => {
    const domainCounts = new Map<string, number>();
    for (const problem of filteredProblems) {
      const domain = classifications[problem.id]?.domain ?? categoryLabels[problem.category];
      domainCounts.set(domain, (domainCounts.get(domain) ?? 0) + 1);
    }

    return [...domainCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([domain, count]) => `${domain} ${count}`);
  }, [categoryLabels, classifications, filteredProblems]);

  const hasActiveFilter = query.trim() || category !== "all" || difficulty !== "all" || materialKind !== "any" || curation !== "all";

  function resetFilters() {
    setQuery("");
    setCategory("all");
    setDifficulty("all");
    setMaterialKind("any");
    setCuration("all");
  }

  return (
    <section className="problem-browser" id="problems" aria-label={getCopy("problemBrowser.aria.browser", locale)}>
      <div className="section-heading problem-browser-heading">
        <div>
          <p className="eyebrow">{getCopy("problemBrowser.eyebrow", locale)}</p>
          <h2>{getCopy("problemBrowser.title", locale)}</h2>
        </div>
        <div className="problem-browser-count">
          <strong>{filteredProblems.length}</strong>
          <span>/ {visibleProblems.length}</span>
        </div>
      </div>

      <div className="problem-browser-tools">
        <label className="problem-search">
          <Search size={17} />
          <input
            aria-label={getCopy("problemBrowser.aria.search", locale)}
            placeholder={getCopy("problemBrowser.search.placeholder", locale)}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <div className="curation-strip" aria-label={getCopy("problemBrowser.aria.curation", locale)}>
          {(Object.keys(curationLabels) as CurationId[]).map((item) => (
            <button
              className={`curation-chip ${curation === item ? "active" : ""}`}
              key={item}
              onClick={() => setCuration(item)}
              type="button"
            >
              {curationLabels[item]}
            </button>
          ))}
        </div>

        <details className="advanced-problem-filters">
          <summary>
            <SlidersHorizontal size={14} /> {getCopy("problemBrowser.filter.details", locale)}
          </summary>
          <div className="problem-filter-grid">
            <label>
              <span>{getCopy("problemBrowser.filter.category", locale)}</span>
              <select className="select" value={category} onChange={(event) => setCategory(event.target.value as FilterValue<ProblemCategory>)}>
                <option value="all">{getCopy("problemBrowser.filter.allCategories", locale)}</option>
                {(Object.keys(categoryLabels) as ProblemCategory[]).map((item) => (
                  <option key={item} value={item}>
                    {categoryLabels[item]}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>{getCopy("problemBrowser.filter.difficulty", locale)}</span>
              <select
                className="select"
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value as FilterValue<Problem["difficulty"]>)}
              >
                <option value="all">{getCopy("problemBrowser.filter.allDifficulties", locale)}</option>
                {(Object.keys(difficultyLabels) as Problem["difficulty"][]).map((item) => (
                  <option key={item} value={item}>
                    {difficultyLabels[item]}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>{getCopy("problemBrowser.filter.material", locale)}</span>
              <select className="select" value={materialKind} onChange={(event) => setMaterialKind(event.target.value as MaterialKind | "none" | "any")}>
                {(Object.keys(materialLabels) as Array<MaterialKind | "none" | "any">).map((item) => (
                  <option key={item} value={item}>
                    {materialLabels[item]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </details>

        <div className="problem-browser-summary">
          <span>
            <SlidersHorizontal size={14} /> {topDomains.length > 0 ? topDomains.join(" · ") : getCopy("problemBrowser.summary.noResults", locale)}
            {hiddenGeneratedCount > 0
              ? ` · ${locale === "ko" ? `${hiddenGeneratedCount}${getCopy("problemBrowser.summary.hiddenGenerated", locale)}` : `${hiddenGeneratedCount} ${getCopy("problemBrowser.summary.hiddenGenerated", locale)}`}`
              : ""}
          </span>
          {hasActiveFilter ? (
            <button className="button quiet" onClick={resetFilters} type="button">
              <RotateCcw size={14} /> {getCopy("problemBrowser.action.reset", locale)}
            </button>
          ) : null}
        </div>
      </div>

      {filteredProblems.length === 0 ? (
        <div className="empty-state">
          <h3>{getCopy("problemBrowser.empty.title", locale)}</h3>
          <p className="muted">{getCopy("problemBrowser.empty.description", locale)}</p>
          <button className="button" onClick={resetFilters} type="button">
            <RotateCcw size={15} /> {getCopy("problemBrowser.empty.reset", locale)}
          </button>
        </div>
      ) : (
        <section className="grid problem-grid" aria-label={getCopy("problemBrowser.aria.list", locale)}>
          {filteredProblems.map((problem) => (
            <article className="card problem-card" key={problem.id}>
              <div>
                <div className="tag-row">
                  <span className="tag">
                    <Layers3 size={13} /> {categoryLabels[problem.category]}
                  </span>
                  <span className="tag">
                    <Clock size={13} />{" "}
                    {locale === "ko"
                      ? `${problem.estimatedMinutes}${getCopy("problemBrowser.time.minutesShort", locale)}`
                      : `${problem.estimatedMinutes} ${getCopy("problemBrowser.time.minutesShort", locale)}`}
                  </span>
                  <span className="tag">
                    <BarChart3 size={13} /> {difficultyLabels[problem.difficulty]}
                  </span>
                  <span className="tag">
                    <FileText size={13} /> {materialCountLabel(problem, locale)}
                  </span>
                </div>
                <h2>{problem.title}</h2>
                <p className="muted">{problem.subtitle}</p>
                <div className="problem-card-meta">
                  <span>{problem.constraints[0] ?? problem.userGoal}</span>
                </div>
              </div>
              <Link className="button" href={`/problems/${problem.id}`}>
                {getCopy("problemBrowser.action.solve", locale)} <ArrowRight size={16} />
              </Link>
            </article>
          ))}
        </section>
      )}
    </section>
  );
}
