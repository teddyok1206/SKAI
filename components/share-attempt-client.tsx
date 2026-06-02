"use client";

import { FormEvent, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { AlertTriangle, Bot, CornerDownRight, Eye, GitBranch, MessageSquare, Paperclip, Route, Send, Workflow } from "lucide-react";
import { problems } from "@/data/problems";
import { getPromptComments, getPublishedAttempt, savePromptComment, savePromptComments } from "@/lib/local-store";
import { buildConversationGraph } from "@/lib/conversation-graph";
import {
  createPromptCommentInSupabase,
  loadPromptCommentsFromSupabase,
  loadPublishedAttemptFromSupabase,
} from "@/lib/supabase-persistence";
import type { PromptComment, PublishedAttempt, TraceEvent } from "@/lib/types";
import { MarkdownContent } from "@/components/markdown-content";
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

function mergeComments(comments: PromptComment[]) {
  return Array.from(new Map(comments.map((comment) => [comment.id, comment])).values()).sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
}

const taskStatusLabels = {
  pending: "Pending",
  responded: "Responded",
  material_used: "Material",
  verification: "Verification",
  bottleneck: "Bottleneck",
} as const;

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
  const loadedAttemptId = attempt?.attemptId;
  const [comments, setComments] = useState<PromptComment[]>([]);
  const [authorName, setAuthorName] = useState("SKAI learner");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);

  useEffect(() => {
    if (!loadedAttemptId) {
      return;
    }

    let cancelled = false;

    void Promise.resolve().then(async () => {
      const localComments = getPromptComments(loadedAttemptId);

      if (cancelled) {
        return;
      }

      setComments(localComments);
      const remoteComments = await loadPromptCommentsFromSupabase(loadedAttemptId);

      if (cancelled || remoteComments.length === 0) {
        return;
      }

      const merged = mergeComments([...localComments, ...remoteComments]);
      setComments(merged);
      savePromptComments(merged);
    });

    return () => {
      cancelled = true;
    };
  }, [loadedAttemptId]);

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

  const publishedAttempt = attempt;
  const userEvents = publishedAttempt.trace.filter((event) => event.role === "user");
  const assistantEvents = publishedAttempt.trace.filter((event) => event.role === "assistant");
  const attachmentCount = publishedAttempt.trace.reduce((sum, event) => sum + (event.attachments?.length ?? 0), 0);
  const relatedEventIds = new Set(publishedAttempt.scoreReport.bottlenecks.map((item) => item.traceEventId).filter(Boolean));
  const problem = problems.find((item) => item.id === publishedAttempt.problemId);
  const conversationGraph = buildConversationGraph(publishedAttempt.trace, publishedAttempt.scoreReport, publishedAttempt.branch, {
    problemMaterialCount: problem?.materials.length ?? 0,
  });
  const graphNodeById = new Map(
    [...conversationGraph.promptNodes, ...conversationGraph.responseNodes, ...conversationGraph.statusNodes].map((node) => [node.id, node]),
  );
  const graphStatusCounts = conversationGraph.pairs.reduce<Record<string, number>>((counts, pair) => {
    counts[pair.status] = (counts[pair.status] ?? 0) + 1;
    return counts;
  }, {});

  async function submitComment(input: { traceEventId: string; parentId?: string }, event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    const draftKey = input.parentId ?? input.traceEventId;
    const draft = input.parentId ? replyDrafts[draftKey] : commentDrafts[draftKey];
    const body = draft?.trim();

    if (!body) {
      return;
    }

    const comment: PromptComment = {
      id: crypto.randomUUID(),
      attemptId: publishedAttempt.attemptId,
      traceEventId: input.traceEventId,
      parentId: input.parentId,
      authorName: authorName.trim() || "SKAI learner",
      body: body.slice(0, 1200),
      createdAt: new Date().toISOString(),
    };

    const nextComments = mergeComments([...comments, comment]);
    setComments(nextComments);
    savePromptComment(comment);
    void createPromptCommentInSupabase(comment);

    if (input.parentId) {
      setReplyDrafts((current) => ({ ...current, [draftKey]: "" }));
      setActiveReplyId(null);
    } else {
      setCommentDrafts((current) => ({ ...current, [draftKey]: "" }));
    }
  }

  function commentsForTrace(traceEventId: string) {
    return comments.filter((comment) => comment.traceEventId === traceEventId);
  }

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

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panel-header">
          <h2>
            <GitBranch size={20} /> Dual Graph
          </h2>
          <p className="muted">Prompt nodes, response edges, response nodes, prompt edges, and task-status layer are derived from this trace.</p>
          {conversationGraph.branch ? (
            <p className="muted">
              Breakpoint replay from parent trace {conversationGraph.branch.parentTraceIndex + 1}
              {conversationGraph.branch.breakpointPairId ? ` · pair ${conversationGraph.branch.breakpointPairId.slice(0, 18)}` : ""}
            </p>
          ) : null}
        </div>
        <div className="panel-body graph-overview">
          <div className="graph-stat">
            <strong>{conversationGraph.promptNodes.filter((node) => !node.synthetic).length}</strong>
            <span>prompt nodes</span>
          </div>
          <div className="graph-stat">
            <strong>{conversationGraph.responseNodes.filter((node) => !node.synthetic).length}</strong>
            <span>response nodes</span>
          </div>
          <div className="graph-stat">
            <strong>{conversationGraph.promptEdges.length + conversationGraph.responseEdges.length}</strong>
            <span>dual edges</span>
          </div>
          <div className="graph-stat">
            <strong>{conversationGraph.statusNodes.length}</strong>
            <span>status layer</span>
          </div>
          {conversationGraph.branch ? (
            <div className="graph-stat">
              <strong>{conversationGraph.branch.breakpointPairId ? "1" : "0"}</strong>
              <span>breakpoint</span>
            </div>
          ) : null}
        </div>
        <div className="panel-body graph-pair-list">
          {conversationGraph.pairs.length === 0 ? (
            <p className="muted">아직 graph로 변환할 prompt-response pair가 없습니다.</p>
          ) : (
            conversationGraph.pairs.map((pair) => {
              const promptNode = graphNodeById.get(pair.promptNodeId);
              const responseNode = pair.responseNodeId ? graphNodeById.get(pair.responseNodeId) : undefined;

              return (
                <article className="graph-pair" key={pair.id}>
                  <div className="graph-pair-main">
                    <div className="graph-status-group">
                      <span className={`graph-status ${pair.status}`}>{taskStatusLabels[pair.status]}</span>
                      {pair.isBreakpoint ? <span className="graph-status breakpoint">Breakpoint</span> : null}
                    </div>
                    <div>
                      <strong>{promptNode?.label ?? "Prompt"}</strong>
                      <p>{promptNode?.summary}</p>
                    </div>
                    <span className="graph-arrow">→</span>
                    <div>
                      <strong>{responseNode?.label ?? "No response"}</strong>
                      <p>{responseNode?.summary ?? "이 prompt에는 아직 response node가 없습니다."}</p>
                    </div>
                  </div>
                  <p className="muted">
                    sparse incidence: {conversationGraph.index.incidence[pair.promptNodeId]?.outgoing.length ?? 0} outgoing prompt edges ·{" "}
                    {pair.responseNodeId ? (conversationGraph.index.incidence[pair.responseNodeId]?.incoming.length ?? 0) : 0} incoming response edges
                  </p>
                  {pair.statusReasons.length > 0 ? <p className="graph-reason">{pair.statusReasons.join(" / ")}</p> : null}
                </article>
              );
            })
          )}
        </div>
        {Object.keys(graphStatusCounts).length > 0 ? (
          <div className="panel-body signal-row">
            {Object.entries(graphStatusCounts).map(([status, count]) => (
              <span className="signal-chip" key={status}>
                {taskStatusLabels[status as keyof typeof taskStatusLabels] ?? status}: {count}
              </span>
            ))}
          </div>
        ) : null}
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
          <div className="discussion-identity">
            <label>
              <span>Comment name</span>
              <input
                className="input"
                maxLength={40}
                value={authorName}
                onChange={(event) => setAuthorName(event.target.value)}
              />
            </label>
            <p className="muted">각 프롬프트 지점에 질문, 해석, 대안 지시를 남길 수 있습니다.</p>
          </div>
          {userEvents.length === 0 ? (
            <p className="muted">공개된 사용자 프롬프트가 없습니다.</p>
          ) : (
            userEvents.map((event, userIndex) => {
              const traceIndex = attempt.trace.findIndex((item) => item.id === event.id);
              const response = findNextAssistant(attempt.trace, traceIndex);
              const signals = promptSignals(event);
              const traceComments = commentsForTrace(event.id);
              const rootComments = traceComments.filter((comment) => !comment.parentId);
              const repliesByParent = new Map<string, PromptComment[]>();
              traceComments
                .filter((comment) => comment.parentId)
                .forEach((comment) => {
                  repliesByParent.set(comment.parentId as string, [...(repliesByParent.get(comment.parentId as string) ?? []), comment]);
                });

              return (
                <article className="prompt-skeleton" id={`trace-${event.id}`} key={event.id}>
                  <div className="prompt-skeleton-index">{userIndex + 1}</div>
                  <div className="prompt-skeleton-body">
                    <div className="prompt-skeleton-heading">
                      <div>
                        <p className="eyebrow">Prompt {userIndex + 1}</p>
                        <h3>{promptIntent(event, userIndex)}</h3>
                      </div>
                      {attempt.branch?.parentTraceEventId === event.sourceTraceEventId ? (
                        <span className="trace-warning breakpoint">
                          <GitBranch size={14} /> breakpoint
                        </span>
                      ) : null}
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
                    <div className="comment-thread">
                      <div className="comment-thread-header">
                        <strong>
                          <MessageSquare size={15} /> {traceComments.length} comments
                        </strong>
                      </div>
                      {rootComments.length > 0 ? (
                        <div className="comment-list">
                          {rootComments.map((comment) => {
                            const replies = repliesByParent.get(comment.id) ?? [];

                            return (
                              <div className="comment-item" key={comment.id}>
                                <div className="comment-meta">
                                  <strong>{comment.authorName}</strong>
                                  <span>{new Date(comment.createdAt).toLocaleString()}</span>
                                </div>
                                <p>{comment.body}</p>
                                {replies.length > 0 ? (
                                  <div className="reply-list">
                                    {replies.map((reply) => (
                                      <div className="comment-item reply" key={reply.id}>
                                        <div className="comment-meta">
                                          <strong>{reply.authorName}</strong>
                                          <span>{new Date(reply.createdAt).toLocaleString()}</span>
                                        </div>
                                        <p>{reply.body}</p>
                                      </div>
                                    ))}
                                  </div>
                                ) : null}
                                {activeReplyId === comment.id ? (
                                  <form
                                    className="comment-form compact"
                                    onSubmit={(submitEvent) =>
                                      void submitComment({ traceEventId: event.id, parentId: comment.id }, submitEvent)
                                    }
                                  >
                                    <textarea
                                      className="textarea"
                                      maxLength={1200}
                                      placeholder="이 지점에 대한 답글"
                                      value={replyDrafts[comment.id] ?? ""}
                                      onChange={(changeEvent) =>
                                        setReplyDrafts((current) => ({ ...current, [comment.id]: changeEvent.target.value }))
                                      }
                                    />
                                    <div className="actions">
                                      <button className="button quiet" type="button" onClick={() => setActiveReplyId(null)}>
                                        취소
                                      </button>
                                      <button className="button" type="submit">
                                        <Send size={15} /> 답글
                                      </button>
                                    </div>
                                  </form>
                                ) : (
                                  <button className="comment-reply-button" type="button" onClick={() => setActiveReplyId(comment.id)}>
                                    <CornerDownRight size={14} /> reply
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                      <form className="comment-form" onSubmit={(submitEvent) => void submitComment({ traceEventId: event.id }, submitEvent)}>
                        <textarea
                          className="textarea"
                          maxLength={1200}
                          placeholder="이 프롬프트의 문제정의, 세분화, 검증 방식에 대해 남기기"
                          value={commentDrafts[event.id] ?? ""}
                          onChange={(changeEvent) =>
                            setCommentDrafts((current) => ({ ...current, [event.id]: changeEvent.target.value }))
                          }
                        />
                        <div className="actions">
                          <button className="button" type="submit">
                            <Send size={15} /> Comment
                          </button>
                        </div>
                      </form>
                    </div>
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

      {attempt.counterfactualReport ? (
        <section className="panel" style={{ marginTop: 16 }}>
          <div className="panel-header">
            <h2>
              <GitBranch size={20} /> Counterfactual Judge
            </h2>
            <p className="muted">이 branch가 parent attempt의 병목을 실제로 바꿨는지 비교한 결과입니다.</p>
          </div>
          <div className="panel-body counterfactual-report">
            <div className={`verdict-pill ${attempt.counterfactualReport.verdict}`}>
              {attempt.counterfactualReport.verdict} · {attempt.counterfactualReport.confidence}% confidence
            </div>
            <p>{attempt.counterfactualReport.summary}</p>
            <div className="branch-diff-grid">
              <div className="diff-card">
                <strong>Prompt before</strong>
                <p>{attempt.counterfactualReport.branchDiff.promptChange?.before ?? "No parent prompt found."}</p>
              </div>
              <div className="diff-card">
                <strong>Prompt after</strong>
                <p>{attempt.counterfactualReport.branchDiff.promptChange?.after ?? "No child prompt found."}</p>
              </div>
            </div>
            <div className="signal-row">
              {attempt.counterfactualReport.causalClaims.map((claim) => (
                <span className={`signal-chip claim-${claim.effect}`} key={`${claim.label}-${claim.effect}`}>
                  {claim.label}: {claim.effect}
                </span>
              ))}
            </div>
            <p className="muted">{attempt.counterfactualReport.nextReplaySuggestion}</p>
          </div>
        </section>
      ) : null}

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
              <div className="raw-content">
                <MarkdownContent content={event.content} />
              </div>
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
