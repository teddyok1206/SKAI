"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Cloud, GitBranch, MessageSquareText, Save, Share2, Trophy } from "lucide-react";
import { problems as seedProblems } from "@/data/problems";
import { saveFounderReviewNote } from "@/lib/local-store";
import { loadFounderCohortFromSupabase } from "@/lib/supabase-persistence";
import type { Attempt, FounderCalibrationVerdict, FounderCohortAttempt, FounderCohortSnapshot, FounderReviewNote, Problem } from "@/lib/types";
import { useAuthoredProblems } from "@/lib/use-authored-problems";
import { useFounderReviewNotes, useLocalAttempts } from "@/lib/use-local-review";

function formatUsd(value: number) {
  if (value === 0) {
    return "$0";
  }

  if (value < 0.01) {
    return `$${value.toFixed(4)}`;
  }

  return `$${value.toFixed(2)}`;
}

function attemptCost(attempt: Attempt) {
  return attempt.trace.reduce((sum, event) => sum + (event.estimatedCostUsd ?? 0), 0);
}

function problemTitle(problemId: string, problemMap: Map<string, Problem>) {
  return problemMap.get(problemId)?.title ?? problemId;
}

function modeLabel(mode: FounderCohortSnapshot["mode"]) {
  if (mode === "supabase_admin") {
    return "Supabase cohort";
  }

  if (mode === "supabase_user") {
    return "Supabase user scope";
  }

  return "Local fallback";
}

const calibrationVerdicts: FounderCalibrationVerdict[] = ["judge_ok", "too_harsh", "too_generous", "missed_bottleneck", "needs_review"];

const calibrationLabels: Record<FounderCalibrationVerdict, string> = {
  judge_ok: "Judge OK",
  too_harsh: "Too harsh",
  too_generous: "Too generous",
  missed_bottleneck: "Missed bottleneck",
  needs_review: "Needs review",
};

function reviewSignal(attempt: { totalScore?: number; judgeMode?: string }, graphAnnotationCount?: number) {
  const needsReview = typeof attempt.totalScore !== "number" || attempt.totalScore < 55 || graphAnnotationCount === 0;

  return needsReview ? "review" : "baseline";
}

function CalibrationControls({
  value,
  expectedScore,
  labels,
  onChange,
  onExpectedScoreChange,
}: {
  value: FounderCalibrationVerdict;
  expectedScore?: number;
  labels: {
    calibration: string;
    expectedScore: string;
    optional: string;
  };
  onChange: (value: FounderCalibrationVerdict) => void;
  onExpectedScoreChange: (value: number | undefined) => void;
}) {
  return (
    <div className="review-calibration-controls">
      <label>
        <span>{labels.calibration}</span>
        <select className="input" value={value} onChange={(event) => onChange(event.target.value as FounderCalibrationVerdict)}>
          {calibrationVerdicts.map((verdict) => (
            <option key={verdict} value={verdict}>
              {calibrationLabels[verdict]}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>{labels.expectedScore}</span>
        <input
          className="input"
          max={100}
          min={0}
          onChange={(event) => {
            const parsed = Number.parseInt(event.target.value, 10);
            onExpectedScoreChange(Number.isNaN(parsed) ? undefined : parsed);
          }}
          placeholder={labels.optional}
          type="number"
          value={typeof expectedScore === "number" ? expectedScore : ""}
        />
      </label>
    </div>
  );
}

function CohortReviewRow({
  attempt,
  note,
  problemName,
}: {
  attempt: FounderCohortAttempt;
  note?: FounderReviewNote;
  problemName: string;
}) {
  const [draft, setDraft] = useState(note?.note ?? "");
  const [verdict, setVerdict] = useState<FounderCalibrationVerdict>(note?.calibrationLabel?.verdict ?? "needs_review");
  const [expectedScore, setExpectedScore] = useState<number | undefined>(note?.calibrationLabel?.expectedScore);

  function saveNote() {
    saveFounderReviewNote({
      attemptId: attempt.id,
      note: draft.trim(),
      calibrationLabel: {
        verdict,
        expectedScore,
        note: draft.trim(),
        updatedAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <article className="review-row remote">
      <div className="review-row-main">
        <div>
          <strong>{problemName}</strong>
          <p className="muted">
            {attempt.provider}/{attempt.model} · {attempt.solvingMode ?? "unknown_mode"} · {attempt.traceEventCount} events
          </p>
        </div>
        <div className="review-metrics">
          <span>
            <Trophy size={13} /> {attempt.totalScore ?? "unjudged"}
          </span>
          <span>{formatUsd(attempt.totalEstimatedCostUsd)} est</span>
          <span>{attempt.judgeMode ?? "no judge"}</span>
          <span>{reviewSignal(attempt)}</span>
          {attempt.isBranch ? (
            <span>
              <GitBranch size={13} /> trace {(attempt.branchParentTraceIndex ?? 0) + 1}
            </span>
          ) : null}
          {attempt.publishedAttemptId ? (
            <Link className="review-link" href={`/share/${attempt.id}`}>
              <Share2 size={13} /> share
            </Link>
          ) : null}
        </div>
      </div>
      <div className="review-note">
        <CalibrationControls
          expectedScore={expectedScore}
          labels={{ calibration: "Calibration", expectedScore: "Expected score", optional: "optional" }}
          onChange={setVerdict}
          onExpectedScoreChange={setExpectedScore}
          value={verdict}
        />
        <textarea
          className="textarea"
          placeholder="Founder cohort note: smoke signal, friction, philosophy fit"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <button className="button" onClick={saveNote} type="button">
          <Save size={15} /> Save note
        </button>
      </div>
      {note?.updatedAt ? <small className="muted">Last note: {new Date(note.updatedAt).toLocaleString()}</small> : null}
    </article>
  );
}

function AttemptReviewRow({
  attempt,
  note,
  problemName,
}: {
  attempt: Attempt;
  note?: FounderReviewNote;
  problemName: string;
}) {
  const [draft, setDraft] = useState(note?.note ?? "");
  const [verdict, setVerdict] = useState<FounderCalibrationVerdict>(note?.calibrationLabel?.verdict ?? "judge_ok");
  const [expectedScore, setExpectedScore] = useState<number | undefined>(note?.calibrationLabel?.expectedScore);
  const score = attempt.scoreReport?.totalScore;
  const cost = attemptCost(attempt);
  const graphAnnotationCount = attempt.scoreReport?.graphAnnotations?.length ?? 0;

  function saveNote() {
    saveFounderReviewNote({
      attemptId: attempt.id,
      note: draft.trim(),
      calibrationLabel: {
        verdict,
        expectedScore,
        note: draft.trim(),
        updatedAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <article className="review-row">
      <div className="review-row-main">
        <div>
          <strong>{problemName}</strong>
          <p className="muted">
            {attempt.provider}/{attempt.model} · {attempt.solvingMode ?? "single_model"} · {attempt.trace.length} events
          </p>
        </div>
        <div className="review-metrics">
          <span>
            <Trophy size={13} /> {score ?? "unjudged"}
          </span>
          <span>{formatUsd(cost)} est</span>
          <span>{attempt.scoreReport?.judgeMode ?? "no judge"}</span>
          <span>{attempt.scoreReport?.needsHumanReview ? "human review" : reviewSignal({ totalScore: score, judgeMode: attempt.scoreReport?.judgeMode }, graphAnnotationCount)}</span>
          <span>{graphAnnotationCount} annotations</span>
          {attempt.branch ? (
            <span>
              <GitBranch size={13} /> trace {attempt.branch.parentTraceIndex + 1}
            </span>
          ) : null}
          {attempt.publishedAt ? (
            <Link className="review-link" href={`/share/${attempt.id}`}>
              <Share2 size={13} /> share
            </Link>
          ) : null}
        </div>
      </div>
      <div className="review-note">
        <CalibrationControls
          expectedScore={expectedScore}
          labels={{ calibration: "Calibration", expectedScore: "Expected score", optional: "optional" }}
          onChange={setVerdict}
          onExpectedScoreChange={setExpectedScore}
          value={verdict}
        />
        <textarea
          className="textarea"
          placeholder="Founder note: 방향성, 품질, 문제 설계 개선점"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <button className="button" onClick={saveNote} type="button">
          <Save size={15} /> Save note
        </button>
      </div>
      {note?.updatedAt ? <small className="muted">Last note: {new Date(note.updatedAt).toLocaleString()}</small> : null}
    </article>
  );
}

export function FounderReviewDashboard() {
  const attempts = useLocalAttempts();
  const notes = useFounderReviewNotes();
  const authoredProblems = useAuthoredProblems();
  const [remoteCohort, setRemoteCohort] = useState<FounderCohortSnapshot | null>(null);
  const [remoteStatus, setRemoteStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  const problemMap = useMemo(
    () => new Map([...seedProblems, ...authoredProblems].map((problem) => [problem.id, problem])),
    [authoredProblems],
  );
  const noteMap = useMemo(() => new Map(notes.map((note) => [note.attemptId, note])), [notes]);
  const judgedCount = attempts.filter((attempt) => attempt.scoreReport).length;
  const branchCount = attempts.filter((attempt) => attempt.branch).length;
  const totalCost = attempts.reduce((sum, attempt) => sum + attemptCost(attempt), 0);

  useEffect(() => {
    let cancelled = false;

    void loadFounderCohortFromSupabase().then((snapshot) => {
      if (cancelled) {
        return;
      }

      if (!snapshot) {
        setRemoteStatus("unavailable");
        return;
      }

      setRemoteCohort(snapshot);
      setRemoteStatus("ready");
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="panel founder-review">
      <div className="panel-header">
        <p className="eyebrow">Founder Review</p>
        <h2>Smoke attempts</h2>
        <p className="muted">Supabase cohort와 로컬 attempt를 훑고 정성 검증 메모를 남깁니다.</p>
      </div>
      <div className="panel-body">
        <div className="review-cohort-header">
          <strong>
            <Cloud size={15} /> {remoteCohort ? modeLabel(remoteCohort.mode) : "Supabase cohort"}
          </strong>
          <span>{remoteStatus}</span>
          {remoteCohort?.reason ? <span>{remoteCohort.reason}</span> : null}
        </div>
        {remoteCohort ? (
          <>
            <div className="review-summary">
              <span>
                <MessageSquareText size={14} /> {remoteCohort.summary.attempts} attempts
              </span>
              <span>
                <Trophy size={14} /> {remoteCohort.summary.judged} judged
              </span>
              <span>
                <Share2 size={14} /> {remoteCohort.summary.published} published
              </span>
              <span>
                <GitBranch size={14} /> {remoteCohort.summary.branches} branches
              </span>
              <span>{formatUsd(remoteCohort.summary.totalEstimatedCostUsd)} est</span>
            </div>
            <div className="review-list remote">
              {remoteCohort.attempts.length === 0 ? (
                <p className="muted">Supabase에서 리뷰할 attempt를 찾지 못했습니다.</p>
              ) : (
                remoteCohort.attempts.map((attempt) => (
                  <CohortReviewRow
                    attempt={attempt}
                    key={attempt.id}
                    note={noteMap.get(attempt.id)}
                    problemName={problemTitle(attempt.problemId, problemMap)}
                  />
                ))
              )}
            </div>
          </>
        ) : (
          <p className="muted">
            {remoteStatus === "loading"
              ? "Supabase cohort를 불러오는 중입니다."
              : "Supabase cohort를 사용할 수 없어 local review만 표시합니다."}
          </p>
        )}
      </div>
      <div className="panel-body">
        <div className="review-cohort-header">
          <strong>Local browser attempts</strong>
          <span>localStorage</span>
        </div>
        <div className="review-summary">
          <span>
            <MessageSquareText size={14} /> {attempts.length} attempts
          </span>
          <span>
            <Trophy size={14} /> {judgedCount} judged
          </span>
          <span>
            <GitBranch size={14} /> {branchCount} branches
          </span>
          <span>{formatUsd(totalCost)} est</span>
        </div>
      </div>
      <div className="panel-body review-list">
        {attempts.length === 0 ? (
          <p className="muted">아직 리뷰할 local attempt가 없습니다.</p>
        ) : (
          attempts.map((attempt) => (
            <AttemptReviewRow
              attempt={attempt}
              key={attempt.id}
              note={noteMap.get(attempt.id)}
              problemName={problemTitle(attempt.problemId, problemMap)}
            />
          ))
        )}
      </div>
    </section>
  );
}
