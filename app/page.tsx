import Link from "next/link";
import { ArrowRight, BarChart3, Clock, Layers3, Palette } from "lucide-react";
import { problems } from "@/data/problems";
import { themeOptions } from "@/lib/themes";

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
      <section className="page-header">
        <div>
          <p className="eyebrow">Social Knowledge of AI</p>
          <h1>AI와 함께 문제를 푸는 법을 연습한다.</h1>
          <p className="lead">
            문제를 정의하고, 세분화하고, AI에게 task를 배분하고, 중간 산출물을 검증하는 과정을 하나의
            풀이로 남긴다. 점수보다 중요한 것은 어떤 흐름으로 AI를 다뤘는지다.
          </p>
        </div>
        <Link className="button primary" href={`/problems/${problems[0].id}`}>
          첫 문제 풀기 <ArrowRight size={17} />
        </Link>
      </section>

      <section className="panel" style={{ marginBottom: 16 }}>
        <div className="panel-header">
          <p className="eyebrow">Design Concept</p>
          <h2>세 가지 컨셉 중 기본값은 Promethean Workbench다.</h2>
          <p className="muted">
            상단 선택기에서 바꿔볼 수 있다. 세 옵션 모두 SKAI의 문제해결, 자료, trace, 코칭이라는 핵심을 유지한다.
          </p>
        </div>
        <div className="panel-body grid">
          {themeOptions.map((option) => (
            <article className="workflow-step" key={option.id}>
              <span className="tag">
                <Palette size={13} /> Priority {option.priority}
              </span>
              <h3 style={{ marginTop: 12 }}>{option.name}</h3>
              <p className="muted">{option.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid" aria-label="Problem list">
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
              Solve <ArrowRight size={16} />
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
