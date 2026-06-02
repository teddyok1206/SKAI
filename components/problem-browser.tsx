"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BarChart3, Clock, FileText, Layers3, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import type { GeneratedProblemClassification } from "@/data/generated-problem-batch-001";
import type { Problem, ProblemCategory, ProblemGoalProfile, MaterialKind } from "@/lib/types";

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

const goalLabels: Record<ProblemGoalProfile, string> = {
  accuracy_first: "정확성",
  speed_first: "속도",
  cost_constrained: "비용",
  workflow_adoption: "정착",
  learning_oriented: "학습",
  exploration: "탐색",
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
  all: "전체",
  quick_start: "빠른 시작",
  material_heavy: "자료 중심",
  verification: "검증 연습",
  advanced_replay: "심화 replay",
  no_material_framing: "문제정의",
} as const;

type CurationId = keyof typeof curationLabels;

type FilterValue<T extends string> = "all" | T;

interface ProblemBrowserProps {
  problems: Problem[];
  classifications?: Record<string, GeneratedProblemClassification>;
}

function problemMaterialKinds(problem: Problem) {
  return [...new Set(problem.materials.map((material) => material.kind))];
}

function curationMatches(problem: Problem, classification: GeneratedProblemClassification | undefined, curation: CurationId) {
  if (curation === "all") {
    return true;
  }

  if (curation === "quick_start") {
    return problem.difficulty === "intro" || problem.estimatedMinutes <= 20;
  }

  if (curation === "material_heavy") {
    return problem.materials.length >= 3 || classification?.primarySkill === "material_grounding";
  }

  if (curation === "verification") {
    return problem.goalProfile === "accuracy_first" || classification?.primarySkill === "verification";
  }

  if (curation === "advanced_replay") {
    return problem.difficulty === "advanced" || Boolean(classification?.idealBottleneck);
  }

  return problem.materials.length === 0 || classification?.primarySkill === "problem_definition";
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

export function ProblemBrowser({ problems, classifications = {} }: ProblemBrowserProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FilterValue<ProblemCategory>>("all");
  const [difficulty, setDifficulty] = useState<FilterValue<Problem["difficulty"]>>("all");
  const [goal, setGoal] = useState<FilterValue<ProblemGoalProfile>>("all");
  const [materialKind, setMaterialKind] = useState<MaterialKind | "none" | "any">("any");
  const [curation, setCuration] = useState<CurationId>("all");

  const filteredProblems = useMemo(
    () =>
      problems.filter((problem) => {
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

        if (goal !== "all" && problem.goalProfile !== goal) {
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
    [category, classifications, curation, difficulty, goal, materialKind, problems, query],
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

  const hasActiveFilter =
    query.trim() || category !== "all" || difficulty !== "all" || goal !== "all" || materialKind !== "any" || curation !== "all";

  function resetFilters() {
    setQuery("");
    setCategory("all");
    setDifficulty("all");
    setGoal("all");
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
          <span>/ {problems.length}</span>
        </div>
      </div>

      <div className="problem-browser-tools">
        <label className="problem-search">
          <Search size={17} />
          <input
            aria-label="문제 검색"
            placeholder="문제, 자료, 역량 검색"
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
            <select className="select" value={difficulty} onChange={(event) => setDifficulty(event.target.value as FilterValue<Problem["difficulty"]>)}>
              <option value="all">전체 난이도</option>
              {(Object.keys(difficultyLabels) as Problem["difficulty"][]).map((item) => (
                <option key={item} value={item}>
                  {difficultyLabels[item]}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>목표</span>
            <select className="select" value={goal} onChange={(event) => setGoal(event.target.value as FilterValue<ProblemGoalProfile>)}>
              <option value="all">전체 목표</option>
              {(Object.keys(goalLabels) as ProblemGoalProfile[]).map((item) => (
                <option key={item} value={item}>
                  {goalLabels[item]}
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

        <div className="problem-browser-summary">
          <span>
            <SlidersHorizontal size={14} /> {topDomains.length > 0 ? topDomains.join(" · ") : "결과 없음"}
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
          {filteredProblems.map((problem) => {
            const classification = classifications[problem.id];
            return (
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
                    <span>{goalLabels[problem.goalProfile]}</span>
                    <span>{classification?.domain ?? categoryLabels[problem.category]}</span>
                    <span>{classification?.primarySkill?.replaceAll("_", " ") ?? "problem practice"}</span>
                  </div>
                </div>
                <Link className="button" href={`/problems/${problem.id}`}>
                  풀기 <ArrowRight size={16} />
                </Link>
              </article>
            );
          })}
        </section>
      )}
    </section>
  );
}
