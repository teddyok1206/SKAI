"use client";

import { useLanguagePreference } from "@/components/language-toggle";
import { getCopy } from "@/lib/i18n";
import { buildIntelligenceMirror } from "@/lib/skai-artifact";
import type { ScoreReport } from "@/lib/types";

export function ScoreReportCard({ report, showBottlenecks = true }: { report: ScoreReport; showBottlenecks?: boolean }) {
  const { locale } = useLanguagePreference();
  const t = (key: string) => getCopy(key, locale);
  const mirror = buildIntelligenceMirror(report);

  return (
    <section className="panel" aria-label={t("scoreReport.aria")}>
      <div className="panel-header">
        <p className="eyebrow">Intelligence Mirror</p>
        <h2>{t("scoreReport.title")}</h2>
        <p className="muted">{report.coachSummary}</p>
        {report.locale ? <p className="muted">{t("scoreReport.locale")} {report.locale}</p> : null}
      </div>
      <div className="panel-body mirror-grid">
        {mirror.map((item) => (
          <article className="mirror-card" key={item.id}>
            <span>{item.label}</span>
            <strong>{item.score ?? "N/A"}</strong>
            <p>{item.summary}</p>
          </article>
        ))}
      </div>
      <div className="panel-body report-grid">
        <div className="score-meta-card">
          <span>{t("scoreReport.symbolicScore")}</span>
          <strong>{report.totalScore}</strong>
          <p>{t("scoreReport.scoreNote")}</p>
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
        <h3>{t("scoreReport.strengths")}</h3>
        <ul className="compact-list">
          {report.strengths.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div className="panel-body">
        <h3>{t("scoreReport.improvements")}</h3>
        <ul className="compact-list">
          {report.improvements.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      {showBottlenecks ? (
        <div className="panel-body">
          <h3>Bottleneck</h3>
          <div className="workflow">
            {report.bottlenecks.length === 0 ? (
              <p className="muted">{t("share.bottleneck.empty")}</p>
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
      ) : null}
    </section>
  );
}
