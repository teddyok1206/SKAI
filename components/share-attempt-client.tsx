"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Bot,
  ClipboardCopy,
  CornerDownRight,
  Download,
  Eye,
  GitBranch,
  MessageSquare,
  Paperclip,
  Route,
  Send,
  Workflow,
} from "lucide-react";
import { problems } from "@/data/problems";
import { operationGuardrails } from "@/lib/constants";
import { moderateComment } from "@/lib/comment-moderation";
import {
  getPromptComments,
  getPublishedAttempt,
  reportPromptComment,
  savePublishedAttempt,
  savePromptComment,
  savePromptComments,
  softDeletePromptComment,
  updatePromptComment,
} from "@/lib/local-store";
import { buildConversationGraph } from "@/lib/conversation-graph";
import { buildGraphSkeleton } from "@/lib/graph-skeleton";
import {
  buildGraphTransitionLog,
  buildSkaiArtifact,
  buildUniversalAttemptSummary,
  skaiArtifactToSvg,
  skaiArtifactToText,
} from "@/lib/skai-artifact";
import {
  createPromptCommentInSupabase,
  deletePromptCommentInSupabase,
  loadPromptCommentsFromSupabase,
  loadMyPageSnapshot,
  loadPublishedAttemptFromSupabase,
  reportPromptCommentInSupabase,
  updatePromptCommentInSupabase,
} from "@/lib/supabase-persistence";
import type { GraphSkeletonStep, GraphSkeletonStepRole, PromptComment, PublishedAttempt, TraceEvent } from "@/lib/types";
import { GraphComparisonView } from "@/components/graph-comparison-view";
import { GraphStateTransitionView } from "@/components/graph-state-transition-view";
import { useLanguagePreference } from "@/components/language-toggle";
import { MarkdownContent } from "@/components/markdown-content";
import { ScoreReportCard } from "@/components/score-report-card";
import { SkaiFileViewer } from "@/components/skai-file-viewer";
import { getCopy, type Locale } from "@/lib/i18n";

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

function roleLabel(role: TraceEvent["role"], locale: Locale) {
  if (role === "user") {
    return getCopy("share.role.userPrompt", locale);
  }

  if (role === "assistant") {
    return getCopy("share.role.modelResponse", locale);
  }

  return getCopy("share.role.system", locale);
}

function promptSignals(event: TraceEvent) {
  const haystack = `${event.content} ${event.attachments?.map((attachment) => attachment.name).join(" ") ?? ""}`.toLowerCase();
  const matched = signalDefinitions
    .filter((signal) => signal.keywords.some((keyword) => haystack.includes(keyword.toLowerCase())))
    .map((signal) => signal.label);

  return matched.length > 0 ? matched : ["일반 요청"];
}

function promptIntent(event: TraceEvent, index: number, locale: Locale) {
  const signals = promptSignals(event);

  if (index === 0) {
    return getCopy("share.promptIntent.initial", locale);
  }

  if (signals.includes("수정")) {
    return getCopy("share.promptIntent.revision", locale);
  }

  if (signals.includes("검증")) {
    return getCopy("share.promptIntent.verification", locale);
  }

  if (signals.includes("세분화")) {
    return getCopy("share.promptIntent.decomposition", locale);
  }

  if (signals.includes("자료")) {
    return getCopy("share.promptIntent.material", locale);
  }

  if (signals.includes("출력")) {
    return getCopy("share.promptIntent.artifact", locale);
  }

  return getCopy("share.promptIntent.followup", locale);
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

const skeletonRoleLabels: Record<GraphSkeletonStepRole, string> = {
  problem_reframe: "문제 재정의",
  clarifying_question: "불확실성 확인",
  material_selection: "자료 선택",
  task_decomposition: "작업 분해",
  draft_generation: "초안 생성",
  verification: "검증",
  revision: "수정",
  finalization: "최종화",
  other: "진행",
};

function skeletonRoleLabel(role: GraphSkeletonStepRole, locale: Locale) {
  return getCopy(`share.skeletonRole.${role}`, locale) || skeletonRoleLabels[role];
}

function skeletonRoleClass(step: GraphSkeletonStep) {
  return `graph-skeleton-role ${step.role} ${step.isBreakpoint ? "breakpoint" : ""}`;
}

export function ShareAttemptClient({ attemptId }: { attemptId: string }) {
  const { locale } = useLanguagePreference();
  const t = (key: string) => getCopy(key, locale);
  const [attemptState, setAttemptState] = useState<{ attempt: PublishedAttempt | null; isLoading: boolean }>(() => {
    const localAttempt = getPublishedAttempt(attemptId) ?? null;
    return {
      attempt: localAttempt,
      isLoading: !localAttempt,
    };
  });
  const attempt = attemptState.attempt;
  const isLoadingAttempt = attemptState.isLoading;
  const loadedAttemptId = attempt?.attemptId;
  const [comments, setComments] = useState<PromptComment[]>([]);
  const [authorName, setAuthorName] = useState("SKAI learner");
  const authorNameTouchedRef = useRef(false);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editDrafts, setEditDrafts] = useState<Record<string, string>>({});
  const [commentNotice, setCommentNotice] = useState("");
  const [artifactNotice, setArtifactNotice] = useState("");

  useEffect(() => {
    let cancelled = false;

    void loadMyPageSnapshot().then((snapshot) => {
      if (cancelled || authorNameTouchedRef.current || !snapshot?.authenticated) {
        return;
      }

      const profileAuthorName = snapshot.profile?.defaultAuthorLabel || snapshot.profile?.displayName;

      if (profileAuthorName) {
        setAuthorName(profileAuthorName.slice(0, 40));
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    void Promise.resolve().then(async () => {
      const localAttempt = getPublishedAttempt(attemptId) ?? null;

      if (cancelled) {
        return;
      }

      setAttemptState({ attempt: localAttempt, isLoading: !localAttempt });

      const remoteAttempt = await loadPublishedAttemptFromSupabase(attemptId);

      if (cancelled) {
        return;
      }

      if (remoteAttempt) {
        savePublishedAttempt(remoteAttempt);
        setAttemptState({ attempt: remoteAttempt, isLoading: false });
        return;
      }

      setAttemptState((current) => ({ ...current, isLoading: false }));
    });

    return () => {
      cancelled = true;
    };
  }, [attemptId]);

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

  if (isLoadingAttempt) {
    return (
      <main className="container ui-mode-surface" data-ui-mode="human">
        <div className="empty">
          <div>
            <h1>{t("share.loading.title")}</h1>
            <p className="muted">{t("share.loading.description")}</p>
          </div>
        </div>
      </main>
    );
  }

  if (!attempt) {
    return (
      <main className="container ui-mode-surface" data-ui-mode="human">
        <div className="empty">
          <div>
            <h1>{t("share.notFound.title")}</h1>
            <p className="muted">{t("share.notFound.description")}</p>
            <Link className="button primary" href="/">
              {t("share.notFound.backToProblems")}
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
  const relatedEventIds = new Set(publishedAttempt.scoreReport?.bottlenecks.map((item) => item.traceEventId).filter(Boolean) ?? []);
  const problem = problems.find((item) => item.id === publishedAttempt.problemId);
  const skaiFile = publishedAttempt.skaiFile;
  const conversationGraph =
    skaiFile?.payload.graph.child ??
    buildConversationGraph(publishedAttempt.trace, publishedAttempt.scoreReport, publishedAttempt.branch, {
      problemMaterialCount: problem?.materials.length ?? 0,
    });
  const graphSkeleton = buildGraphSkeleton(conversationGraph, publishedAttempt.trace);
  const parentGraphSnapshot = skaiFile?.payload.graph.parent;
  const parentTraceSnapshot = skaiFile?.payload.branch?.parentTrace ?? [];
  const graphNodeById = new Map(
    [...conversationGraph.promptNodes, ...conversationGraph.responseNodes, ...conversationGraph.statusNodes].map((node) => [node.id, node]),
  );
  const graphStatusCounts = conversationGraph.pairs.reduce<Record<string, number>>((counts, pair) => {
    counts[pair.status] = (counts[pair.status] ?? 0) + 1;
    return counts;
  }, {});
  const skaiArtifact = buildSkaiArtifact({ attempt: publishedAttempt, graph: conversationGraph, skeleton: graphSkeleton });
  const universalSummary = buildUniversalAttemptSummary({
    attempt: publishedAttempt,
    graph: conversationGraph,
    skeleton: graphSkeleton,
  });
  const transitionLog = buildGraphTransitionLog(conversationGraph, publishedAttempt.trace);

  async function submitComment(input: { traceEventId: string; parentId?: string }, event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    const draftKey = input.parentId ?? input.traceEventId;
    const draft = input.parentId ? replyDrafts[draftKey] : commentDrafts[draftKey];
    const body = draft?.trim();

    if (!body) {
      return;
    }

    const moderation = moderateComment({
      body,
      authorName,
      maxBodyChars: operationGuardrails.maxCommentBodyChars,
    });

    if (!moderation.ok) {
      setCommentNotice(moderation.blockedReason ?? t("share.comment.blocked"));
      return;
    }

    setCommentNotice(
      moderation.warnings.length > 0
        ? `${t("share.comment.privacyGuardrail")}: ${moderation.warnings.join(" ")}`
        : t("share.comment.saved"),
    );

    const comment: PromptComment = {
      id: crypto.randomUUID(),
      attemptId: publishedAttempt.attemptId,
      traceEventId: input.traceEventId,
      parentId: input.parentId,
      authorName: moderation.authorName,
      body: moderation.body,
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

  function replaceComment(nextComment: PromptComment) {
    const nextComments = mergeComments(comments.map((comment) => (comment.id === nextComment.id ? nextComment : comment)));
    setComments(nextComments);
    updatePromptComment(nextComment);
  }

  function startEditComment(comment: PromptComment) {
    if (comment.deletedAt) {
      return;
    }

    setEditingCommentId(comment.id);
    setEditDrafts((current) => ({ ...current, [comment.id]: comment.body }));
  }

  function saveEditedComment(comment: PromptComment) {
    const draft = editDrafts[comment.id]?.trim();

    if (!draft) {
      setCommentNotice(t("share.comment.empty"));
      return;
    }

    const moderation = moderateComment({
      body: draft,
      authorName: comment.authorName,
      maxBodyChars: operationGuardrails.maxCommentBodyChars,
    });

    if (!moderation.ok) {
      setCommentNotice(moderation.blockedReason ?? t("share.comment.blocked"));
      return;
    }

    const updatedAt = new Date().toISOString();
    const nextComment: PromptComment = {
      ...comment,
      authorName: moderation.authorName,
      body: moderation.body,
      updatedAt,
      deletedAt: undefined,
    };

    replaceComment(nextComment);
    setEditingCommentId(null);
    setCommentNotice(
      moderation.warnings.length > 0
        ? `${t("share.comment.privacyGuardrail")}: ${moderation.warnings.join(" ")}`
        : t("share.comment.updated"),
    );
    void updatePromptCommentInSupabase({
      commentId: comment.id,
      attemptId: comment.attemptId,
      body: moderation.body,
      authorName: moderation.authorName,
    }).then((synced) => {
      if (!synced) {
        setCommentNotice(t("share.comment.updatedLocalOnly"));
      }
    });
  }

  function deleteComment(comment: PromptComment) {
    const deletedAt = new Date().toISOString();
    const nextComment: PromptComment = {
      ...comment,
      body: t("share.comment.deletedBody"),
      updatedAt: deletedAt,
      deletedAt,
    };

    replaceComment(nextComment);
    softDeletePromptComment(comment.id);
    setCommentNotice(t("share.comment.deletedLocal"));
    void deletePromptCommentInSupabase({
      commentId: comment.id,
      attemptId: comment.attemptId,
    }).then((synced) => {
      if (!synced) {
        setCommentNotice(t("share.comment.deletedLocalOnly"));
      }
    });
  }

  function reportComment(comment: PromptComment) {
    const nextComment: PromptComment = {
      ...comment,
      reportCount: (comment.reportCount ?? 0) + 1,
    };

    replaceComment(nextComment);
    reportPromptComment(comment.id);
    setCommentNotice(t("share.comment.reported"));
    void reportPromptCommentInSupabase({
      commentId: comment.id,
      attemptId: comment.attemptId,
      reason: "Reported from shared attempt UI.",
    });
  }

  async function copyArtifactSummary() {
    const text = skaiArtifactToText(skaiArtifact);

    if (!navigator.clipboard) {
      setArtifactNotice(t("share.artifact.clipboardUnavailable"));
      return;
    }

    await navigator.clipboard.writeText(text);
    setArtifactNotice(t("share.artifact.summaryCopied"));
  }

  function downloadArtifactSvg() {
    const svg = skaiArtifactToSvg(skaiArtifact);
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${publishedAttempt.title.replace(/[^a-z0-9가-힣_-]+/gi, "-").slice(0, 48) || "skai-artifact"}.svg`;
    anchor.click();
    URL.revokeObjectURL(url);
    setArtifactNotice(t("share.artifact.svgDownloaded"));
  }

  return (
    <main className="container ui-mode-surface" data-ui-mode="human">
      <section className="page-header">
        <div>
          <p className="eyebrow">{t("share.header.eyebrow")}</p>
          <h1>{attempt.title}</h1>
          <p className="lead">{t("share.header.lead")}</p>
        </div>
        <Link className="button" href={`/problems/${attempt.problemId}`}>
          {t("share.header.solveSameProblem")}
        </Link>
      </section>

      <section className="share-overview" aria-label={t("share.overview.aria")}>
        <div className="share-stat">
          <strong>{userEvents.length}</strong>
          <span>{t("share.overview.userPrompts")}</span>
        </div>
        <div className="share-stat">
          <strong>{assistantEvents.length}</strong>
          <span>{t("share.overview.modelTurns")}</span>
        </div>
        <div className="share-stat">
          <strong>{attachmentCount}</strong>
          <span>{t("share.overview.materialsUsed")}</span>
        </div>
        {attempt.scoreReport ? (
          <div className="share-stat score-meta">
            <strong>{attempt.scoreReport.totalScore}</strong>
            <span>{t("share.overview.symbolicScore")}</span>
          </div>
        ) : null}
      </section>

      <section className="skai-artifact-section" aria-label={t("share.artifact.aria")}>
        <article className="skai-artifact-card">
          <div className="skai-artifact-topline">
            <span>SKAI Artifact</span>
            <span>{skaiArtifact.signature}</span>
          </div>
          <div className="skai-artifact-header">
            <div>
              <h2>{skaiArtifact.headline}</h2>
              <p>{skaiArtifact.title}</p>
            </div>
            {typeof skaiArtifact.score === "number" ? <strong>{skaiArtifact.score}</strong> : <span className="artifact-unjudged">{t("share.artifact.unjudged")}</span>}
          </div>
          <div className="artifact-graph-mark" aria-hidden="true">
            <div className="artifact-node intent">
              <span>Intent</span>
            </div>
            <div className="artifact-node materials">
              <span>Materials</span>
            </div>
            <div className="artifact-flow top" />
            <div className="artifact-flow bottom" />
            <div className="artifact-node outcome">
              <span>Artifact</span>
            </div>
          </div>
          <div className="artifact-node-copy">
            {skaiArtifact.nodes.map((node) => (
              <div key={node.id}>
                <strong>{node.label}</strong>
                <p>{node.summary}</p>
              </div>
            ))}
          </div>
          <div className="artifact-timeline">
            {skaiArtifact.timeline.length === 0 ? (
              <p>{t("share.artifact.noTimeline")}</p>
            ) : (
              skaiArtifact.timeline.map((step) => (
                <span key={step.id}>
                  {step.sequence}. {step.label}
                </span>
              ))
            )}
          </div>
          <p className="artifact-mantra">{t("share.artifact.mantra")}</p>
        </article>
        <div className="artifact-actions">
          <button className="button" type="button" onClick={() => void copyArtifactSummary()}>
            <ClipboardCopy size={16} /> {t("share.artifact.copySummary")}
          </button>
          <button className="button" type="button" onClick={downloadArtifactSvg}>
            <Download size={16} /> {t("share.artifact.saveSvg")}
          </button>
          {skaiFile ? (
            <p className="attachment-notice neutral">
              {skaiFile.schemaVersion} · {skaiFile.integrity.artifactHash.slice(0, 16)}
            </p>
          ) : null}
          {artifactNotice ? <p className="attachment-notice neutral">{artifactNotice}</p> : null}
        </div>
      </section>

      {skaiFile ? (
        <div className="share-skai-viewer">
          <SkaiFileViewer artifact={skaiFile} key={skaiFile.integrity.artifactHash} title="Published .skai" variant="embedded" />
        </div>
      ) : (
        <section className="panel share-skai-viewer">
          <div className="panel-body">
            <p className="muted">
              {t("share.skai.oldSnapshot")}
            </p>
          </div>
        </section>
      )}

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panel-header">
          <h2>{t("share.universal.title")}</h2>
          <p className="muted">{t("share.universal.description")}</p>
        </div>
        <div className="panel-body universal-summary-grid">
          {universalSummary.map((item) => (
            <article className="universal-summary-card" key={item.id}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panel-header">
          <h2>
            <Workflow size={20} /> {t("share.graphSkeleton.title")}
          </h2>
          <p className="muted">{t("share.graphSkeleton.description")}</p>
        </div>
        <div className="panel-body graph-skeleton-list">
          {graphSkeleton.length === 0 ? (
            <p className="muted">{t("share.graphSkeleton.empty")}</p>
          ) : (
            graphSkeleton.map((step) => (
              <article className="graph-skeleton-step" key={step.id}>
                <div className="graph-skeleton-index">
                  <span>{step.sequence + 1}</span>
                  <small>{step.status}</small>
                </div>
                <div className="graph-skeleton-body">
                  <div className="graph-skeleton-heading">
                    <div>
                      <span className={skeletonRoleClass(step)}>{skeletonRoleLabel(step.role, locale)}</span>
                      <h3>{step.label}</h3>
                    </div>
                    {step.isBreakpoint ? (
                      <span className="trace-warning breakpoint">
                        <GitBranch size={14} /> breakpoint
                      </span>
                    ) : null}
                  </div>
                  <p>{step.summary}</p>
                  <div className="signal-row">
                    {step.signals.map((signal) => (
                      <span className="signal-chip" key={`${step.id}-${signal}`}>
                        {signal}
                      </span>
                    ))}
                    {step.annotationKinds.map((kind) => (
                      <span className="signal-chip graph-annotation-kind" key={`${step.id}-${kind}`}>
                        {kind}
                      </span>
                    ))}
                  </div>
                  {step.evidenceLabels.length > 0 ? (
                    <div className="graph-skeleton-evidence">
                      {step.evidenceLabels.map((label) => (
                        <span key={`${step.id}-${label}`}>{label}</span>
                      ))}
                    </div>
                  ) : null}
                  <div className="trace-link-row">
                    <a href={`#trace-${step.promptTraceEventId}`}>{t("share.traceLink.promptSkeleton")}</a>
                    {step.responseTraceEventId ? <a href={`#raw-${step.responseTraceEventId}`}>{t("share.traceLink.responseRaw")}</a> : null}
                    <a href={`#raw-${step.promptTraceEventId}`}>{t("share.traceLink.promptRaw")}</a>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panel-header">
          <h2>{t("share.transitionLog.title")}</h2>
          <p className="muted">{t("share.transitionLog.description")}</p>
        </div>
        <div className="panel-body transition-log-list">
          {transitionLog.length === 0 ? (
            <p className="muted">{t("share.transitionLog.empty")}</p>
          ) : (
            transitionLog.map((entry) => (
              <article className="transition-log-entry" key={entry.id}>
                <div>
                  <span>{entry.sequence}</span>
                  <strong>{entry.from}</strong>
                  <em>{entry.status}</em>
                </div>
                <p>{entry.via}</p>
                <small>{`-> ${entry.to}`}</small>
                <div className="signal-row">
                  {entry.evidence.map((item) => (
                    <span className="signal-chip" key={`${entry.id}-${item}`}>
                      {item}
                    </span>
                  ))}
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panel-header">
          <h2>
            <GitBranch size={20} /> Dual Graph
          </h2>
          <p className="muted">{t("share.dualGraph.description")}</p>
          {conversationGraph.branch ? (
            <p className="muted">
              {t("share.dualGraph.breakpointReplay")} {conversationGraph.branch.parentTraceIndex + 1}
              {conversationGraph.branch.breakpointPairId ? ` · pair ${conversationGraph.branch.breakpointPairId.slice(0, 18)}` : ""}
            </p>
          ) : null}
        </div>
        <div className="panel-body graph-overview">
          <div className="graph-stat">
            <strong>{conversationGraph.promptNodes.filter((node) => !node.synthetic).length}</strong>
            <span>{t("graph.stat.promptNodes")}</span>
          </div>
          <div className="graph-stat">
            <strong>{conversationGraph.responseNodes.filter((node) => !node.synthetic).length}</strong>
            <span>{t("graph.stat.responseNodes")}</span>
          </div>
          <div className="graph-stat">
            <strong>{conversationGraph.promptEdges.length + conversationGraph.responseEdges.length}</strong>
            <span>{t("share.dualGraph.dualEdges")}</span>
          </div>
          <div className="graph-stat">
            <strong>{conversationGraph.statusNodes.length}</strong>
            <span>{t("share.dualGraph.statusLayer")}</span>
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
            <p className="muted">{t("share.dualGraph.empty")}</p>
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
                      <strong>{responseNode?.label ?? t("share.dualGraph.noResponse")}</strong>
                      <p>{responseNode?.summary ?? t("share.dualGraph.noResponseNode")}</p>
                    </div>
                  </div>
                  <p className="muted">
                    sparse incidence: {conversationGraph.index.incidence[pair.promptNodeId]?.outgoing.length ?? 0} {t("share.dualGraph.outgoingPromptEdges")} ·{" "}
                    {pair.responseNodeId ? (conversationGraph.index.incidence[pair.responseNodeId]?.incoming.length ?? 0) : 0} {t("share.dualGraph.incomingResponseEdges")}
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
            <Workflow size={20} /> {t("share.workflow.title")}
          </h2>
        </div>
        <div className="panel-body share-timeline">
          {attempt.workflow.length === 0 ? (
            <p className="muted">{t("share.workflow.empty")}</p>
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
            <GitBranch size={20} /> {t("share.promptDetail.title")}
          </h2>
          <p className="muted">{t("share.promptDetail.description")}</p>
        </div>
        <div className="panel-body prompt-skeleton-list">
          <div className="discussion-identity">
            <label>
              <span>{t("share.comment.name")}</span>
              <input
                className="input"
                maxLength={40}
                value={authorName}
                onChange={(event) => {
                  authorNameTouchedRef.current = true;
                  setAuthorName(event.target.value);
                }}
              />
            </label>
            <p className="muted">{t("share.comment.description")}</p>
            <p className="muted">{t("share.comment.privacyDescription")}</p>
            {commentNotice ? <p className="attachment-notice neutral">{commentNotice}</p> : null}
          </div>
          {userEvents.length === 0 ? (
            <p className="muted">{t("share.promptDetail.empty")}</p>
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
                        <h3>{promptIntent(event, userIndex, locale)}</h3>
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
                                  <span>
                                    {new Date(comment.createdAt).toLocaleString()}
                                    {comment.updatedAt ? ` · ${t("share.comment.edited")}` : ""}
                                  </span>
                                </div>
                                {editingCommentId === comment.id ? (
                                  <div className="comment-form compact">
                                    <textarea
                                      className="textarea"
                                      maxLength={operationGuardrails.maxCommentBodyChars}
                                      value={editDrafts[comment.id] ?? comment.body}
                                      onChange={(changeEvent) =>
                                        setEditDrafts((current) => ({ ...current, [comment.id]: changeEvent.target.value }))
                                      }
                                    />
                                    <div className="actions">
                                      <button className="button quiet" type="button" onClick={() => setEditingCommentId(null)}>
                                        {t("share.action.cancel")}
                                      </button>
                                      <button className="button" type="button" onClick={() => saveEditedComment(comment)}>
                                        {t("share.action.save")}
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className={comment.deletedAt ? "comment-deleted" : ""}>{comment.body}</p>
                                )}
                                <div className="comment-actions">
                                  {!comment.deletedAt ? (
                                    <>
                                      <button type="button" onClick={() => startEditComment(comment)}>
                                        {t("share.action.edit")}
                                      </button>
                                      <button type="button" onClick={() => deleteComment(comment)}>
                                        {t("share.action.delete")}
                                      </button>
                                    </>
                                  ) : null}
                                  <button type="button" onClick={() => reportComment(comment)}>
                                    {t("share.action.report")}{comment.reportCount ? ` ${comment.reportCount}` : ""}
                                  </button>
                                </div>
                                {replies.length > 0 ? (
                                  <div className="reply-list">
                                    {replies.map((reply) => (
                                      <div className="comment-item reply" key={reply.id}>
                                        <div className="comment-meta">
                                          <strong>{reply.authorName}</strong>
                                          <span>
                                            {new Date(reply.createdAt).toLocaleString()}
                                            {reply.updatedAt ? ` · ${t("share.comment.edited")}` : ""}
                                          </span>
                                        </div>
                                        {editingCommentId === reply.id ? (
                                          <div className="comment-form compact">
                                            <textarea
                                              className="textarea"
                                              maxLength={operationGuardrails.maxCommentBodyChars}
                                              value={editDrafts[reply.id] ?? reply.body}
                                              onChange={(changeEvent) =>
                                                setEditDrafts((current) => ({ ...current, [reply.id]: changeEvent.target.value }))
                                              }
                                            />
                                            <div className="actions">
                                              <button className="button quiet" type="button" onClick={() => setEditingCommentId(null)}>
                                                {t("share.action.cancel")}
                                              </button>
                                              <button className="button" type="button" onClick={() => saveEditedComment(reply)}>
                                                {t("share.action.save")}
                                              </button>
                                            </div>
                                          </div>
                                        ) : (
                                          <p className={reply.deletedAt ? "comment-deleted" : ""}>{reply.body}</p>
                                        )}
                                        <div className="comment-actions">
                                          {!reply.deletedAt ? (
                                            <>
                                              <button type="button" onClick={() => startEditComment(reply)}>
                                                {t("share.action.edit")}
                                              </button>
                                              <button type="button" onClick={() => deleteComment(reply)}>
                                                {t("share.action.delete")}
                                              </button>
                                            </>
                                          ) : null}
                                          <button type="button" onClick={() => reportComment(reply)}>
                                            {t("share.action.report")}{reply.reportCount ? ` ${reply.reportCount}` : ""}
                                          </button>
                                        </div>
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
                                      maxLength={operationGuardrails.maxCommentBodyChars}
                                      placeholder={t("share.comment.replyPlaceholder")}
                                      value={replyDrafts[comment.id] ?? ""}
                                      onChange={(changeEvent) =>
                                        setReplyDrafts((current) => ({ ...current, [comment.id]: changeEvent.target.value }))
                                      }
                                    />
                                    <div className="actions">
                                      <button className="button quiet" type="button" onClick={() => setActiveReplyId(null)}>
                                        {t("share.action.cancel")}
                                      </button>
                                      <button className="button" type="submit">
                                        <Send size={15} /> {t("share.action.reply")}
                                      </button>
                                    </div>
                                  </form>
                                ) : (
                                  <button className="comment-reply-button" type="button" onClick={() => setActiveReplyId(comment.id)}>
                                    <CornerDownRight size={14} /> {t("share.action.reply")}
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
                          maxLength={operationGuardrails.maxCommentBodyChars}
                          placeholder={t("share.comment.placeholder")}
                          value={commentDrafts[event.id] ?? ""}
                          onChange={(changeEvent) =>
                            setCommentDrafts((current) => ({ ...current, [event.id]: changeEvent.target.value }))
                          }
                        />
                        <div className="actions">
                          <button className="button" type="submit">
                            <Send size={15} /> {t("share.action.comment")}
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

      {attempt.scoreReport ? (
        <section className="panel" style={{ marginTop: 16 }}>
          <div className="panel-header">
            <h2>
              <Route size={20} /> Bottleneck & Replay
            </h2>
          </div>
          <div className="panel-body bottleneck-grid">
            {attempt.scoreReport.bottlenecks.length === 0 ? (
              <p className="muted">{t("share.bottleneck.empty")}</p>
            ) : (
              attempt.scoreReport.bottlenecks.map((item) => (
                <article className={`bottleneck-card ${item.severity}`} key={`${item.label}-${item.traceEventId ?? "none"}`}>
                  <div className="bottleneck-card-header">
                    <strong>{item.label}</strong>
                    <span>{item.severity}</span>
                  </div>
                  <p className="muted">{item.explanation}</p>
                  <p>{item.replaySuggestion}</p>
                  {item.traceEventId ? <a href={`#trace-${item.traceEventId}`}>{t("share.bottleneck.viewRelatedPrompt")}</a> : null}
                </article>
              ))
            )}
          </div>
        </section>
      ) : null}

      {attempt.counterfactualReport ? (
        <section className="panel" style={{ marginTop: 16 }}>
          <div className="panel-header">
            <h2>
              <GitBranch size={20} /> Counterfactual Judge
            </h2>
            <p className="muted">{t("share.counterfactual.description")}</p>
          </div>
          <div className="panel-body counterfactual-report">
            <div className={`verdict-pill ${attempt.counterfactualReport.verdict}`}>
              {attempt.counterfactualReport.verdict} · {attempt.counterfactualReport.confidence}% confidence
            </div>
            <p>{attempt.counterfactualReport.summary}</p>
            {parentGraphSnapshot && parentTraceSnapshot.length > 0 ? (
              <GraphComparisonView
                childGraph={conversationGraph}
                childTrace={publishedAttempt.trace}
                parentGraph={parentGraphSnapshot}
                parentTrace={parentTraceSnapshot}
                transition={attempt.counterfactualReport.branchDiff.graphTransition}
              />
            ) : (
              <GraphStateTransitionView transition={attempt.counterfactualReport.branchDiff.graphTransition} />
            )}
            <div className="branch-diff-grid">
              <div className="diff-card">
                <strong>Prompt before</strong>
                <p>{attempt.counterfactualReport.branchDiff.promptChange?.before ?? t("solve.branch.noParentPrompt")}</p>
              </div>
              <div className="diff-card">
                <strong>Prompt after</strong>
                <p>{attempt.counterfactualReport.branchDiff.promptChange?.after ?? t("solve.branch.noChildPrompt")}</p>
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

      {attempt.scoreReport ? (
        <div style={{ marginTop: 16 }}>
          <ScoreReportCard report={attempt.scoreReport} showBottlenecks={false} />
        </div>
      ) : null}

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
                  {index + 1}. {roleLabel(event.role, locale)}
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
            <Eye size={16} /> {t("share.footer.snapshotNotice")}
          </p>
        </div>
      </section>
    </main>
  );
}
