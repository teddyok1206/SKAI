"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { GitBranch, MessageSquareText, Save, Share2, Trophy } from "lucide-react";
import { problems as seedProblems } from "@/data/problems";
import { saveFounderReviewNote } from "@/lib/local-store";
import type { Attempt, FounderReviewNote, Problem } from "@/lib/types";
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
  const score = attempt.scoreReport?.totalScore;
  const cost = attemptCost(attempt);

  function saveNote() {
    saveFounderReviewNote({
      attemptId: attempt.id,
      note: draft.trim(),
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
  const problemMap = useMemo(
    () => new Map([...seedProblems, ...authoredProblems].map((problem) => [problem.id, problem])),
    [authoredProblems],
  );
  const noteMap = useMemo(() => new Map(notes.map((note) => [note.attemptId, note])), [notes]);
  const judgedCount = attempts.filter((attempt) => attempt.scoreReport).length;
  const branchCount = attempts.filter((attempt) => attempt.branch).length;
  const totalCost = attempts.reduce((sum, attempt) => sum + attemptCost(attempt), 0);

  return (
    <section className="panel founder-review">
      <div className="panel-header">
        <p className="eyebrow">Founder Review</p>
        <h2>Smoke attempts</h2>
        <p className="muted">로컬 attempt를 훑고 정성 검증 메모를 남깁니다.</p>
      </div>
      <div className="panel-body">
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
