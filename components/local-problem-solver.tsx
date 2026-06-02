"use client";

import Link from "next/link";
import { useAuthoredProblem } from "@/lib/use-authored-problems";
import { ProblemSolver } from "@/components/problem-solver";

export function LocalProblemSolver({ problemId }: { problemId: string }) {
  const problem = useAuthoredProblem(problemId);

  if (!problem) {
    return (
      <section className="panel">
        <div className="panel-header">
          <p className="eyebrow">Local Draft</p>
          <h2>문제 초안을 찾을 수 없습니다.</h2>
        </div>
        <div className="panel-body">
          <p className="muted">
            localStorage에 저장된 문제만 이 경로에서 열 수 있습니다. 다른 브라우저나 기기에서는 export/import가 필요합니다.
          </p>
          <Link className="button primary" href="/admin">
            Admin으로 이동
          </Link>
        </div>
      </section>
    );
  }

  return <ProblemSolver problem={problem} />;
}
