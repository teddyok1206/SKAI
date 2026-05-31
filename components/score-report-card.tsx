"use client";

import type { ScoreReport } from "@/lib/types";

export function ScoreReportCard({ report }: { report: ScoreReport }) {
  return (
    <section className="panel" aria-label="Score report">
      <div className="panel-header">
        <h2>Coach Report</h2>
        <p className="muted">{report.coachSummary}</p>
      </div>
      <div className="panel-body report-grid">
        <div>
          <div className="score-circle">{report.totalScore}</div>
          <p className="muted" style={{ marginTop: 10 }}>
            상징 점수. 실제 개선은 축별 피드백에서 본다.
          </p>
        </div>
        <div className="axis-list">
          {report.axisScores.map((axis) => (
            <div className="axis-row" key={axis.axis}>
              <strong>{axis.label}</strong>
              <div className="bar" aria-label={`${axis.label} ${axis.score}`}>
                <span style={{ width: `${axis.score}%` }} />
              </div>
              <strong>{axis.score}</strong>
            </div>
          ))}
        </div>
      </div>
      <div className="panel-body">
        <h3>강점</h3>
        <ul className="compact-list">
          {report.strengths.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div className="panel-body">
        <h3>개선 포인트</h3>
        <ul className="compact-list">
          {report.improvements.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div className="panel-body">
        <h3>Bottleneck</h3>
        <div className="workflow">
          {report.bottlenecks.length === 0 ? (
            <p className="muted">명확한 병목은 아직 감지되지 않았습니다.</p>
          ) : (
            report.bottlenecks.map((item) => (
              <div className="workflow-step" key={`${item.label}-${item.traceEventId ?? "none"}`}>
                <strong>{item.label}</strong>
                <p className="muted">{item.explanation}</p>
                <p>{item.replaySuggestion}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

