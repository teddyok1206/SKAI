"use client";

import { AlertTriangle, GraduationCap, Scale } from "lucide-react";
import {
  isSkaiCoachExtensionV1,
  isSkaiJudgeExtensionV1,
  skaiCoachExtensionV1,
  skaiExtensionLabels,
  skaiJudgeExtensionV1,
} from "@/lib/skai-extensions";
import type { AxisScore, SkaiCoachExtensionV1, SkaiFileArtifact, SkaiJudgeExtensionV1 } from "@/lib/types";

function targetLabel(target: { targetKind: string; targetId: string; pairId?: string }) {
  if (target.pairId) {
    return `${target.targetKind} · ${target.pairId}`;
  }

  return `${target.targetKind} · ${target.targetId}`;
}

function axisScoreRow(score: AxisScore) {
  return (
    <div className="skai-extension-axis" key={score.axis}>
      <span>{score.label}</span>
      <strong>{score.score}</strong>
    </div>
  );
}

function JudgeExtensionPanel({ extension }: { extension: SkaiJudgeExtensionV1 }) {
  return (
    <section className="skai-extension-panel" aria-label="SKAI judge extension">
      <div className="panel-header compact">
        <div>
          <p className="eyebrow">{skaiExtensionLabels[skaiJudgeExtensionV1]}</p>
          <h3>
            <Scale size={17} /> {extension.rubricVersion}
          </h3>
        </div>
        <span className={extension.needsHumanReview ? "signal-chip integrity-warn" : "signal-chip integrity-ok"}>
          {extension.needsHumanReview ? "human review" : "baseline ok"}
        </span>
      </div>

      <div className="skai-extension-grid">
        <div>
          <span>Total</span>
          <strong>{extension.totalScore ?? "n/a"}</strong>
        </div>
        <div>
          <span>Generator</span>
          <strong>{extension.generator.kind}</strong>
        </div>
        <div>
          <span>Graph Hash</span>
          <strong>{extension.inputGraphHash.slice(0, 12)}</strong>
        </div>
      </div>

      <div className="skai-extension-axis-grid">{extension.axisScores.map(axisScoreRow)}</div>

      <div className="skai-extension-list">
        {extension.findings.slice(0, 5).map((finding) => (
          <article className={`skai-extension-finding severity-${finding.severity}`} key={finding.id}>
            <div>
              <strong>{finding.title}</strong>
              <small>{targetLabel(finding.target)}</small>
            </div>
            <p>{finding.explanation}</p>
            {finding.suggestedAction ? <p className="muted">{finding.suggestedAction}</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}

function CoachExtensionPanel({ extension }: { extension: SkaiCoachExtensionV1 }) {
  return (
    <section className="skai-extension-panel" aria-label="SKAI coaching extension">
      <div className="panel-header compact">
        <div>
          <p className="eyebrow">{skaiExtensionLabels[skaiCoachExtensionV1]}</p>
          <h3>
            <GraduationCap size={17} /> {extension.coachingVersion}
          </h3>
        </div>
      </div>

      <p>{extension.summary}</p>

      <div className="skai-extension-list">
        {extension.comments.slice(0, 5).map((comment) => (
          <article className="skai-extension-finding" key={comment.id}>
            <div>
              <strong>{comment.title}</strong>
              <small>{targetLabel(comment.target)}</small>
            </div>
            <p>{comment.body}</p>
            {comment.nextAction ? <p className="muted">{comment.nextAction}</p> : null}
          </article>
        ))}
      </div>

      {extension.nextPracticeTargets.length > 0 ? (
        <div className="skai-extension-targets">
          {extension.nextPracticeTargets.map((target) => (
            <span className="signal-chip" key={target}>
              {target}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function SkaiExtensionRegistry({ artifact }: { artifact: SkaiFileArtifact }) {
  const extensions = artifact.extensions ?? {};
  const judgeExtension = extensions[skaiJudgeExtensionV1];
  const coachExtension = extensions[skaiCoachExtensionV1];
  const unknownKeys = Object.keys(extensions).filter((key) => key !== skaiJudgeExtensionV1 && key !== skaiCoachExtensionV1);

  if (!judgeExtension && !coachExtension && unknownKeys.length === 0) {
    return null;
  }

  return (
    <section className="skai-extension-registry" aria-label="SKAI file extensions">
      <div className="panel-header compact">
        <div>
          <p className="eyebrow">Optional Extensions</p>
          <h3>Derived Layers</h3>
        </div>
      </div>
      {isSkaiJudgeExtensionV1(judgeExtension) ? <JudgeExtensionPanel extension={judgeExtension} /> : null}
      {isSkaiCoachExtensionV1(coachExtension) ? <CoachExtensionPanel extension={coachExtension} /> : null}
      {unknownKeys.length > 0 ? (
        <div className="skai-extension-unknown">
          <AlertTriangle size={16} />
          <span>Unknown extension keys: {unknownKeys.join(", ")}</span>
        </div>
      ) : null}
    </section>
  );
}

