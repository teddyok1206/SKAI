"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, Clock, Layers3 } from "lucide-react";
import { useAuthoredProblems } from "@/lib/use-authored-problems";
import type { Problem } from "@/lib/types";

const categoryLabel: Record<Problem["category"], string> = {
  workplace: "업무",
  research: "자료조사",
  creative: "창작",
  data_analysis: "데이터",
  coding: "코딩",
  strategy: "전략",
};

export function AuthoredProblemList() {
  const problems = useAuthoredProblems();

  if (problems.length === 0) {
    return null;
  }

  return (
    <>
      <section className="section-heading">
        <p className="eyebrow">Local Drafts</p>
        <h2>직접 만든 문제</h2>
      </section>
      <section className="grid problem-grid" aria-label="Authored problem list">
        {problems.map((problem) => (
          <article className="card problem-card local-draft-card" key={problem.id}>
            <div>
              <div className="tag-row">
                <span className="tag">
                  <Layers3 size={13} /> {categoryLabel[problem.category]}
                </span>
                <span className="tag">
                  <Clock size={13} /> {problem.estimatedMinutes}분
                </span>
                <span className="tag">
                  <BarChart3 size={13} /> {problem.difficulty}
                </span>
              </div>
              <h2>{problem.title}</h2>
              <p className="muted">{problem.subtitle}</p>
            </div>
            <Link className="button" href={`/problems/local/${problem.id}`}>
              초안 풀기 <ArrowRight size={16} />
            </Link>
          </article>
        ))}
      </section>
    </>
  );
}
