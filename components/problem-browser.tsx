"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BarChart3, Clock, FileText, Layers3, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import type { GeneratedProblemClassification } from "@/data/generated-problem-batch-001";
import { useGeneratedProblemEditorialMap } from "@/lib/use-generated-problem-editorial";
import type { Problem, ProblemCategory, MaterialKind } from "@/lib/types";

const categoryLabels: Record<ProblemCategory, string> = {
  workplace: "업무",
  research: "자료조사",
  creative: "창작",
  data_analysis: "데이터",
  coding: "코딩",
  strategy: "전략",
};

const difficultyLabels: Record<Problem["difficulty"], string> = {
  intro: "입문",
  standard: "표준",
  advanced: "심화",
};

const materialLabels: Record<MaterialKind | "none" | "any", string> = {
  any: "전체 자료",
  none: "자료 없음",
  image: "이미지",
  spreadsheet: "스프레드시트",
  csv: "CSV",
  text: "텍스트",
  pdf: "PDF",
  other: "기타",
};

const curationLabels = {
  all: "Smoke 후보",
  first_run: "처음 체감",
  material_control: "자료 다루기",
  verification_replay: "검증/되돌리기",
} as const;

type CurationId = keyof typeof curationLabels;

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

function materialCountLabel(problem: Problem) {
  if (problem.materials.length === 0) {
    return "자료 없음";
  }

  return `${problem.materials.length}개 자료`;
}

export function ProblemBrowser({ problems, classifications = {}, generatedProblemIds = [] }: ProblemBrowserProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FilterValue<ProblemCategory>>("all");
  const [difficulty, setDifficulty] = useState<FilterValue<Problem["difficulty"]>>("all");
  const [materialKind, setMaterialKind] = useState<MaterialKind | "none" | "any">("any");
  const [curation, setCuration] = useState<CurationId>("all");
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
  }, [classifications, filteredProblems]);

  const hasActiveFilter = query.trim() || category !== "all" || difficulty !== "all" || materialKind !== "any" || curation !== "all";

  function resetFilters() {
    setQuery("");
    setCategory("all");
    setDifficulty("all");
    setMaterialKind("any");
    setCuration("all");
  }

  return (
    <section className="problem-browser" id="problems" aria-label="Problem browser">
      <div className="section-heading problem-browser-heading">
        <div>
          <p className="eyebrow">Problems</p>
          <h2>오늘 풀 수 있는 문제</h2>
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
            aria-label="문제 검색"
            placeholder="문제나 자료 검색"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <div className="curation-strip" aria-label="추천 경로">
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
            <SlidersHorizontal size={14} /> 세부 필터
          </summary>
          <div className="problem-filter-grid">
            <label>
              <span>분야</span>
              <select className="select" value={category} onChange={(event) => setCategory(event.target.value as FilterValue<ProblemCategory>)}>
                <option value="all">전체 분야</option>
                {(Object.keys(categoryLabels) as ProblemCategory[]).map((item) => (
                  <option key={item} value={item}>
                    {categoryLabels[item]}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>난이도</span>
              <select
                className="select"
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value as FilterValue<Problem["difficulty"]>)}
              >
                <option value="all">전체 난이도</option>
                {(Object.keys(difficultyLabels) as Problem["difficulty"][]).map((item) => (
                  <option key={item} value={item}>
                    {difficultyLabels[item]}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>자료</span>
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
            <SlidersHorizontal size={14} /> {topDomains.length > 0 ? topDomains.join(" · ") : "결과 없음"}
            {hiddenGeneratedCount > 0 ? ` · ${hiddenGeneratedCount}개 생성 문제 검토 대기` : ""}
          </span>
          {hasActiveFilter ? (
            <button className="button quiet" onClick={resetFilters} type="button">
              <RotateCcw size={14} /> 초기화
            </button>
          ) : null}
        </div>
      </div>

      {filteredProblems.length === 0 ? (
        <div className="empty-state">
          <h3>조건에 맞는 문제가 없습니다.</h3>
          <p className="muted">검색어나 필터를 줄이면 다시 볼 수 있습니다.</p>
          <button className="button" onClick={resetFilters} type="button">
            <RotateCcw size={15} /> 전체 보기
          </button>
        </div>
      ) : (
        <section className="grid problem-grid" aria-label="Problem list">
          {filteredProblems.map((problem) => (
            <article className="card problem-card" key={problem.id}>
              <div>
                <div className="tag-row">
                  <span className="tag">
                    <Layers3 size={13} /> {categoryLabels[problem.category]}
                  </span>
                  <span className="tag">
                    <Clock size={13} /> {problem.estimatedMinutes}분
                  </span>
                  <span className="tag">
                    <BarChart3 size={13} /> {difficultyLabels[problem.difficulty]}
                  </span>
                  <span className="tag">
                    <FileText size={13} /> {materialCountLabel(problem)}
                  </span>
                </div>
                <h2>{problem.title}</h2>
                <p className="muted">{problem.subtitle}</p>
                <div className="problem-card-meta">
                  <span>{problem.constraints[0] ?? problem.userGoal}</span>
                </div>
              </div>
              <Link className="button" href={`/problems/${problem.id}`}>
                풀기 <ArrowRight size={16} />
              </Link>
            </article>
          ))}
        </section>
      )}
    </section>
  );
}
