"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Eye, MessageSquare, Paperclip, Workflow } from "lucide-react";
import { getPublishedAttempt } from "@/lib/local-store";
import { loadPublishedAttemptFromSupabase } from "@/lib/supabase-persistence";
import type { PublishedAttempt } from "@/lib/types";
import { ScoreReportCard } from "@/components/score-report-card";

export function ShareAttemptClient({ attemptId }: { attemptId: string }) {
  const attempt = useSyncExternalStore<PublishedAttempt | null>(
    (onStoreChange) => {
      void loadPublishedAttemptFromSupabase(attemptId).then((remoteAttempt) => {
        if (remoteAttempt) {
          window.localStorage.setItem("skai:publishedAttempts", JSON.stringify([remoteAttempt]));
          onStoreChange();
        }
      });
      return () => undefined;
    },
    () => getPublishedAttempt(attemptId) ?? null,
    () => null,
  );

  if (!attempt) {
    return (
      <main className="container">
        <div className="empty">
          <div>
            <h1>공개 풀이를 찾을 수 없습니다.</h1>
            <p className="muted">현재 데모는 local storage 기반이라 같은 브라우저에서 publish한 풀이만 보입니다.</p>
            <Link className="button primary" href="/">
              문제 목록으로
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container">
      <section className="page-header">
        <div>
          <p className="eyebrow">Published Attempt</p>
          <h1>{attempt.title}</h1>
          <p className="lead">먼저 workflow와 prompt 흐름을 보고, 필요한 경우 원문 프롬프트와 모델 응답을 펼쳐봅니다.</p>
        </div>
        <Link className="button" href={`/problems/${attempt.problemId}`}>
          같은 문제 풀기
        </Link>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>
            <Workflow size={20} /> Workflow
          </h2>
        </div>
        <div className="panel-body workflow">
          {attempt.workflow.map((step) => (
            <article className="workflow-step" key={step.title}>
              <h3>{step.title}</h3>
              <p className="muted">{step.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panel-header">
          <h2>
            <MessageSquare size={20} /> Prompt Flow
          </h2>
        </div>
        <div className="panel-body workflow">
          {attempt.trace.map((event, index) => (
            <details key={event.id}>
              <summary>
                {index + 1}. {event.role === "user" ? "사용자 프롬프트" : "모델 응답"}
              </summary>
              <p className="muted">
                {event.provider ?? "unknown"} {event.model ? `· ${event.model}` : ""}
              </p>
              {event.attachments && event.attachments.length > 0 ? (
                <div className="attachment-row">
                  {event.attachments.map((attachment) => (
                    <span className="attachment-chip" key={attachment.id}>
                      <Paperclip size={14} />
                      {attachment.name}
                    </span>
                  ))}
                </div>
              ) : null}
              <p style={{ whiteSpace: "pre-wrap" }}>{event.content}</p>
            </details>
          ))}
        </div>
      </section>

      <div style={{ marginTop: 16 }}>
        <ScoreReportCard report={attempt.scoreReport} />
      </div>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panel-body">
          <p className="muted">
            <Eye size={16} /> 공개된 원문은 학습과 연구를 위한 자료입니다. certification 모드에서는 별도 유사도 검증이 필요합니다.
          </p>
        </div>
      </section>
    </main>
  );
}
