import Link from "next/link";
import { ArrowRight, BarChart3, Clock, Layers3 } from "lucide-react";
import { problems } from "@/data/problems";

const categoryLabel = {
  workplace: "업무",
  research: "자료조사",
  creative: "창작",
  data_analysis: "데이터",
  coding: "코딩",
  strategy: "전략",
};

export default function HomePage() {
  return (
    <main className="container">
      <section className="home-hero">
        <p className="eyebrow">Social Knowledge of AI</p>
        <h1>AI를 잘 쓰는 법을 문제로 연습한다.</h1>
        <p className="lead">
          문제 정의, task 분배, 자료 활용, 검증 흐름을 하나의 풀이로 남긴다.
        </p>
        <div className="hero-actions">
          <Link className="button primary" href={`/problems/${problems[0].id}`}>
            첫 문제 풀기 <ArrowRight size={17} />
          </Link>
          <a className="button quiet" href="#problems">
            문제 보기
          </a>
        </div>
      </section>

      <section className="section-heading" id="problems">
        <p className="eyebrow">Problems</p>
        <h2>오늘 풀 수 있는 문제</h2>
      </section>

      <section className="grid problem-grid" aria-label="Problem list">
        {problems.map((problem) => (
          <article className="card problem-card" key={problem.id}>
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
            <Link className="button" href={`/problems/${problem.id}`}>
              풀기 <ArrowRight size={16} />
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
