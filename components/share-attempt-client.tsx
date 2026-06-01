"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { AlertTriangle, Bot, Eye, GitBranch, MessageSquare, Paperclip, Route, Workflow } from "lucide-react";
import { getPublishedAttempt } from "@/lib/local-store";
import { loadPublishedAttemptFromSupabase } from "@/lib/supabase-persistence";
import type { PublishedAttempt, TraceEvent } from "@/lib/types";
import { ScoreReportCard } from "@/components/score-report-card";

const signalDefinitions = [
  { label: "목표", keywords: ["목표", "성공", "원하는", "해야", "해결"] },
  { label: "제약", keywords: ["제약", "조건", "단", "반드시", "하지마", "금지"] },
  { label: "자료", keywords: ["자료", "파일", "영수증", "xlsx", "csv", "이미지", "첨부"] },
  { label: "세분화", keywords: ["단계", "task", "태스크", "분해", "쪼개", "workflow", "순서"] },
  { label: "출력", keywords: ["출력", "형식", "표", "json", "목록", "양식"] },
  { label: "검증", keywords: ["검증", "확인", "근거", "출처", "오류", "한계"] },
  { label: "수정", keywords: ["수정", "다시", "반영", "변경", "보완", "재작성"] },
] as const;

function compactText(value: string, limit = 150) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= limit) {
    return normalized;
  }

  return `${normalized.slice(0, limit - 1)}…`;
}

function roleLabel(role: TraceEvent["role"]) {
  if (role === "user") {
    return "사용자 프롬프트";
  }

  if (role === "assistant") {
    return "모델 응답";
  }

  return "시스템";
}

function promptSignals(event: TraceEvent) {
  const haystack = `${event.content} ${event.attachments?.map((attachment) => attachment.name).join(" ") ?? ""}`.toLowerCase();
  const matched = signalDefinitions
    .filter((signal) => signal.keywords.some((keyword) => haystack.includes(keyword.toLowerCase())))
    .map((signal) => signal.label);

  return matched.length > 0 ? matched : ["일반 요청"];
}

function promptIntent(event: TraceEvent, index: number) {
  const signals = promptSignals(event);

  if (index === 0) {
    return "초기 문제 설정";
  }

  if (signals.includes("수정")) {
    return "중간 산출물 보정";
  }

  if (signals.includes("검증")) {
    return "검증 요청";
  }

  if (signals.includes("세분화")) {
    return "작업 분해";
  }

  if (signals.includes("자료")) {
    return "자료 기반 요청";
  }

  if (signals.includes("출력")) {
    return "산출물 형식화";
  }

  return "후속 지시";
}

function findNextAssistant(trace: TraceEvent[], userEventIndex: number) {
  return trace.slice(userEventIndex + 1).find((event) => event.role === "assistant");
}

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

  const userEvents = attempt.trace.filter((event) => event.role === "user");
  const assistantEvents = attempt.trace.filter((event) => event.role === "assistant");
  const attachmentCount = attempt.trace.reduce((sum, event) => sum + (event.attachments?.length ?? 0), 0);
  const relatedEventIds = new Set(attempt.scoreReport.bottlenecks.map((item) => item.traceEventId).filter(Boolean));

  return (
    <main className="container">
      <section className="page-header">
        <div>
          <p className="eyebrow">Published Attempt</p>
          <h1>{attempt.title}</h1>
          <p className="lead">문제 접근, 지시 흐름, 병목과 재시작 지점을 먼저 읽고 원문은 마지막에 확인합니다.</p>
        </div>
        <Link className="button" href={`/problems/${attempt.problemId}`}>
          같은 문제 풀기
        </Link>
      </section>

      <section className="share-overview" aria-label="Published attempt overview">
        <div className="share-stat">
          <strong>{userEvents.length}</strong>
          <span>user prompts</span>
        </div>
        <div className="share-stat">
          <strong>{assistantEvents.length}</strong>
          <span>model turns</span>
        </div>
        <div className="share-stat">
          <strong>{attachmentCount}</strong>
          <span>materials used</span>
        </div>
        <div className="share-stat">
          <strong>{attempt.scoreReport.totalScore}</strong>
          <span>coach score</span>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>
            <Workflow size={20} /> Workflow Map
          </h2>
        </div>
        <div className="panel-body share-timeline">
          {attempt.workflow.length === 0 ? (
            <p className="muted">공개된 workflow가 없습니다.</p>
          ) : (
            attempt.workflow.map((step, index) => (
              <article className="timeline-step" key={`${step.title}-${index}`}>
                <span className="timeline-index">{index + 1}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p className="muted">{step.summary}</p>
                  {step.relatedTraceEventIds.length > 0 ? (
                    <div className="trace-link-row">
                      {step.relatedTraceEventIds.map((eventId) => (
                        <a href={`#trace-${eventId}`} key={eventId}>
                          trace {eventId.slice(0, 6)}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panel-header">
          <h2>
            <GitBranch size={20} /> Prompt Skeleton
          </h2>
        </div>
        <div className="panel-body prompt-skeleton-list">
          {userEvents.length === 0 ? (
            <p className="muted">공개된 사용자 프롬프트가 없습니다.</p>
          ) : (
            userEvents.map((event, userIndex) => {
              const traceIndex = attempt.trace.findIndex((item) => item.id === event.id);
              const response = findNextAssistant(attempt.trace, traceIndex);
              const signals = promptSignals(event);

              return (
                <article className="prompt-skeleton" id={`trace-${event.id}`} key={event.id}>
                  <div className="prompt-skeleton-index">{userIndex + 1}</div>
                  <div className="prompt-skeleton-body">
                    <div className="prompt-skeleton-heading">
                      <div>
                        <p className="eyebrow">Prompt {userIndex + 1}</p>
                        <h3>{promptIntent(event, userIndex)}</h3>
                      </div>
                      {relatedEventIds.has(event.id) ? (
                        <span className="trace-warning">
                          <AlertTriangle size={14} /> bottleneck
                        </span>
                      ) : null}
                    </div>
                    <p className="prompt-summary">{compactText(event.content)}</p>
                    <div className="signal-row">
                      {signals.map((signal) => (
                        <span className="signal-chip" key={signal}>
                          {signal}
                        </span>
                      ))}
                    </div>
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
                    {response ? (
                      <p className="response-meta">
                        <Bot size={14} /> {response.provider ?? "unknown"} {response.model ? `· ${response.model}` : ""} ·{" "}
                        {compactText(response.content, 90)}
                      </p>
                    ) : null}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panel-header">
          <h2>
            <Route size={20} /> Bottleneck & Replay
          </h2>
        </div>
        <div className="panel-body bottleneck-grid">
          {attempt.scoreReport.bottlenecks.length === 0 ? (
            <p className="muted">명확한 병목은 아직 감지되지 않았습니다.</p>
          ) : (
            attempt.scoreReport.bottlenecks.map((item) => (
              <article className={`bottleneck-card ${item.severity}`} key={`${item.label}-${item.traceEventId ?? "none"}`}>
                <div className="bottleneck-card-header">
                  <strong>{item.label}</strong>
                  <span>{item.severity}</span>
                </div>
                <p className="muted">{item.explanation}</p>
                <p>{item.replaySuggestion}</p>
                {item.traceEventId ? <a href={`#trace-${item.traceEventId}`}>관련 prompt skeleton 보기</a> : null}
              </article>
            ))
          )}
        </div>
      </section>

      <div style={{ marginTop: 16 }}>
        <ScoreReportCard report={attempt.scoreReport} showBottlenecks={false} />
      </div>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panel-header">
          <h2>
            <MessageSquare size={20} /> Raw Transcript
          </h2>
        </div>
        <div className="panel-body raw-transcript">
          {attempt.trace.map((event, index) => (
            <details id={`raw-${event.id}`} key={event.id}>
              <summary>
                <span>
                  {index + 1}. {roleLabel(event.role)}
                </span>
                <small>
                  {event.provider ?? "unknown"} {event.model ? `· ${event.model}` : ""}
                </small>
              </summary>
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
              <p className="raw-content">{event.content}</p>
            </details>
          ))}
      </div>
      </section>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panel-body">
          <p className="muted">
            <Eye size={16} /> 공개 snapshot은 학습과 연구를 위한 자료입니다. certification 모드에서는 별도 유사도 검증이 필요합니다.
          </p>
        </div>
      </section>
    </main>
  );
}
