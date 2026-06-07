"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DragEvent } from "react";
import Link from "next/link";
import {
  BookOpen,
  Check,
  Copy,
  FilePlus2,
  GitBranch,
  MessageSquare,
  Network,
  Paperclip,
  Play,
  RotateCcw,
  Send,
  Share2,
  Trophy,
  X,
} from "lucide-react";
import { getLocalizedProblemPlaybook, type ProblemPlaybookTurn } from "@/data/problem-playbooks";
import { attachmentFromFile, attachmentFromMaterial } from "@/lib/attachment-context";
import { buildBranchTree } from "@/lib/branch-tree";
import { createBreakpointReplayAttempt, sourceTraceEventIdForNextBranchEvent } from "@/lib/branching";
import { buildConversationGraph } from "@/lib/conversation-graph";
import { budgetGuardrails, operationGuardrails } from "@/lib/constants";
import { getAttempt, getAttempts, saveAttempt, savePublishedAttempt } from "@/lib/local-store";
import { getModelOption, getModelOptionByProviderModel, modelOptions, type ModelOption, type ModelOptionId } from "@/lib/model-options";
import { getLocalizedProblem } from "@/lib/problem-localization";
import { providerUiProfiles } from "@/lib/provider-ui";
import { buildSkaiFileArtifact } from "@/lib/skai-format";
import { getSolvingMode, solvingModes } from "@/lib/solving-modes";
import { syncAttemptToSupabase, syncPublishedAttemptToSupabase } from "@/lib/supabase-persistence";
import type {
  Attempt,
  AttemptAttachment,
  CounterfactualJudgeReport,
  ModelRun,
  Problem,
  PublishedAttempt,
  ProviderId,
  ScoreReport,
  SolvingModeId,
  TraceEvent,
} from "@/lib/types";
import { ConversationGraphView } from "@/components/conversation-graph-view";
import { BranchTreeExplorer } from "@/components/branch-tree-explorer";
import { GraphComparisonView } from "@/components/graph-comparison-view";
import { GraphStateTransitionView } from "@/components/graph-state-transition-view";
import { useLanguagePreference } from "@/components/language-toggle";
import { MarkdownContent } from "@/components/markdown-content";
import { ScoreReportCard } from "@/components/score-report-card";
import { getCopy } from "@/lib/i18n";

const materialDragDataType = "application/x-skai-material-id";
type SkaiActivity = "ready" | "primed" | "busy" | "structured";

function formatUsd(value: number) {
  if (value === 0) {
    return "$0";
  }

  if (value < 0.01) {
    return `$${value.toFixed(4)}`;
  }

  return `$${value.toFixed(2)}`;
}

function formatKrw(value: number) {
  return `₩${new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 }).format(Math.round(value))}`;
}

function newAttempt(
  problem: Problem,
  modelOption: ModelOption,
  solvingModeId: SolvingModeId = "single_model",
  title?: string,
): Attempt {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    problemId: problem.id,
    userId: "local-demo-user",
    status: "draft",
    title: title ?? `${problem.title} 풀이`,
    provider: modelOption.provider,
    model: modelOption.model,
    solvingMode: solvingModeId,
    trace: [],
    createdAt: now,
    updatedAt: now,
  };
}

function makeTraceEvent(input: {
  attemptId: string;
  problemId: string;
  role: "user" | "assistant";
  content: string;
  provider?: ProviderId;
  model?: string;
  modelRun?: ModelRun;
  attachments?: AttemptAttachment[];
  sourceTraceEventId?: string;
  branchId?: string;
}): TraceEvent {
  return {
    id: crypto.randomUUID(),
    attemptId: input.attemptId,
    problemId: input.problemId,
    role: input.role,
    content: input.content,
    provider: input.provider,
    model: input.model,
    createdAt: new Date().toISOString(),
    latencyMs: input.modelRun?.latencyMs,
    usageInputTokens: input.modelRun?.usageInputTokens,
    usageOutputTokens: input.modelRun?.usageOutputTokens,
    estimatedCostUsd: input.modelRun?.estimatedCostUsd,
    attachments: input.attachments,
    sourceTraceEventId: input.sourceTraceEventId,
    branchId: input.branchId,
  };
}

export function ProblemSolver({ problem }: { problem: Problem }) {
  const { locale } = useLanguagePreference();
  const t = (key: string) => getCopy(key, locale);
  const localizedProblem = useMemo(() => getLocalizedProblem(problem, locale), [locale, problem]);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [solvingModeId, setSolvingModeId] = useState<SolvingModeId>("single_model");
  const [modelOptionId, setModelOptionId] = useState<ModelOptionId | null>(null);
  const [provider, setProvider] = useState<ProviderId | null>(null);
  const [model, setModel] = useState("");
  const [input, setInput] = useState("");
  const [finalAnswer, setFinalAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [shareNotice, setShareNotice] = useState("");
  const [selectedAttachments, setSelectedAttachments] = useState<AttemptAttachment[]>([]);
  const [activeMaterialId, setActiveMaterialId] = useState(problem.materials[0]?.id ?? "");
  const [isDraggingAttachment, setIsDraggingAttachment] = useState(false);
  const [attachmentNotice, setAttachmentNotice] = useState("");
  const [copiedTraceEventId, setCopiedTraceEventId] = useState("");
  const [workspaceTab, setWorkspaceTab] = useState<"chat" | "graph">("chat");
  const [showOperatorPlaybook, setShowOperatorPlaybook] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedSolvingMode = useMemo(() => getSolvingMode(solvingModeId), [solvingModeId]);
  const selectedModelOption = useMemo(() => (modelOptionId ? getModelOption(modelOptionId) : null), [modelOptionId]);
  const availableModelOptions = useMemo(
    () => modelOptions.filter((option) => problem.allowedProviders.includes(option.provider)),
    [problem.allowedProviders],
  );
  const providerProfile = provider ? providerUiProfiles[provider] : null;
  const problemAttempts = getAttempts().filter((item) => item.problemId === problem.id);
  const branchTree = buildBranchTree(problemAttempts, problem.id);
  const attemptHistory = problemAttempts
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5);

  const totalTokens = attempt?.trace.reduce(
    (sum, event) => sum + (event.usageInputTokens ?? 0) + (event.usageOutputTokens ?? 0),
    0,
  ) ?? 0;
  const totalEstimatedCostUsd = attempt?.trace.reduce((sum, event) => sum + (event.estimatedCostUsd ?? 0), 0) ?? 0;
  const totalEstimatedCostKrw = totalEstimatedCostUsd * budgetGuardrails.krwPerUsdEstimate;
  const unknownCostEvents =
    attempt?.trace.filter(
      (event) =>
        event.role === "assistant" &&
        typeof event.estimatedCostUsd !== "number" &&
        ((event.usageInputTokens ?? 0) > 0 || (event.usageOutputTokens ?? 0) > 0),
    ).length ?? 0;
  const activeMaterial = problem.materials.find((material) => material.id === activeMaterialId);
  const parentAttempt = attempt?.branch ? getAttempt(attempt.branch.parentAttemptId) : undefined;
  const activeSolvingMode = attempt?.solvingMode ? getSolvingMode(attempt.solvingMode) : selectedSolvingMode;
  const playbook = useMemo(() => getLocalizedProblemPlaybook(problem.id, locale), [locale, problem.id]);
  const conversationGraph = useMemo(
    () =>
      attempt
        ? buildConversationGraph(attempt.trace, attempt.scoreReport, attempt.branch, {
            problemMaterialCount: problem.materials.length,
          })
        : null,
    [attempt, problem.materials.length],
  );
  const parentConversationGraph = useMemo(
    () =>
      parentAttempt
        ? buildConversationGraph(parentAttempt.trace, parentAttempt.scoreReport, parentAttempt.branch, {
            problemMaterialCount: problem.materials.length,
          })
        : null,
    [parentAttempt, problem.materials.length],
  );
  const skaiActivity = useMemo<SkaiActivity>(() => {
    if (isLoading) {
      return "busy";
    }

    if (selectedAttachments.length > 0 || input.trim()) {
      return "primed";
    }

    if ((attempt?.trace.length ?? 0) > 0 || (conversationGraph?.pairs.length ?? 0) > 0) {
      return "structured";
    }

    return "ready";
  }, [attempt?.trace.length, conversationGraph?.pairs.length, input, isLoading, selectedAttachments.length]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      setShowOperatorPlaybook(params.get("operator") === "1" || params.get("playbook") === "1");
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.skaiActivity = skaiActivity;

    return () => {
      if (document.documentElement.dataset.skaiActivity === skaiActivity) {
        delete document.documentElement.dataset.skaiActivity;
      }
    };
  }, [skaiActivity]);

  function mergeAttachments(current: AttemptAttachment[], incoming: AttemptAttachment[]) {
    const next = [...current];

    for (const attachment of incoming) {
      const alreadySelected =
        attachment.source === "problem_material" && attachment.materialId
          ? next.some((item) => item.source === "problem_material" && item.materialId === attachment.materialId)
          : next.some((item) => item.id === attachment.id);

      if (alreadySelected) {
        continue;
      }

      if (next.length >= operationGuardrails.maxAttachmentsPerMessage) {
        setAttachmentNotice(`${t("solve.notice.attachmentLimitPrefix")} ${operationGuardrails.maxAttachmentsPerMessage}${t("solve.notice.attachmentLimitSuffix")}`);
        break;
      }

      next.push(attachment);
    }

    return next;
  }

  function updateAttempt(next: Attempt) {
    setAttempt(next);
    setProvider(next.provider);
    setModel(next.model);
    saveAttempt(next);
    void syncAttemptToSupabase(next, problem);
  }

  function restoreAttemptRuntime(next: Attempt) {
    const option = getModelOptionByProviderModel(next.provider, next.model);
    setProvider(next.provider);
    setModel(next.model);
    setModelOptionId(option?.id ?? null);
  }

  function handleModelOptionChange(nextModelOptionId: ModelOptionId) {
    const option = getModelOption(nextModelOptionId);
    if (!option) {
      return;
    }

    setModelOptionId(option.id);
    setProvider(option.provider);
    setModel(option.model);
  }

  function startAttempt() {
    if (!selectedModelOption) {
      setAttachmentNotice(t("solve.notice.modelRequired"));
      return;
    }

    const attemptTitle = locale === "ko" ? `${localizedProblem.title} 풀이` : `${localizedProblem.title} attempt`;
    const next = newAttempt(problem, selectedModelOption, selectedSolvingMode.id, attemptTitle);
    setProvider(selectedModelOption.provider);
    setModel(selectedModelOption.model);
    setAttempt(next);
    setFinalAnswer("");
    setInput("");
    setShareUrl("");
    setShareNotice("");
    setSelectedAttachments([]);
    saveAttempt(next);
  }

  function toggleMaterialAttachment(materialId: string) {
    const material = problem.materials.find((item) => item.id === materialId);
    if (!material) {
      return;
    }

    setSelectedAttachments((current) => {
      const exists = current.some((item) => item.materialId === material.id);
      if (exists) {
        return current.filter((item) => item.materialId !== material.id);
      }

      setAttachmentNotice("");
      return mergeAttachments(current, [attachmentFromMaterial(material)]);
    });
  }

  function addMaterialAttachment(materialId: string) {
    const material = problem.materials.find((item) => item.id === materialId);
    if (!material) {
      return;
    }

    setAttachmentNotice("");
    setSelectedAttachments((current) => mergeAttachments(current, [attachmentFromMaterial(material)]));
  }

  function addMaterialAttachments(materialIds: string[]) {
    const attachments = materialIds
      .map((materialId) => problem.materials.find((item) => item.id === materialId))
      .filter((material): material is NonNullable<typeof material> => Boolean(material))
      .map((material) => attachmentFromMaterial(material));

    if (attachments.length === 0) {
      return;
    }

    setAttachmentNotice("");
    setSelectedAttachments((current) => mergeAttachments(current, attachments));
  }

  function appendPromptDraft(prompt: string) {
    setInput((current) => {
      if (!current.trim()) {
        return prompt;
      }

      return `${current.trimEnd()}\n\n${prompt}`;
    });
  }

  function insertPlaybookTurn(turn: ProblemPlaybookTurn) {
    appendPromptDraft(turn.prompt);
    if (turn.attachmentMaterialIds?.length) {
      addMaterialAttachments(turn.attachmentMaterialIds);
    }
    setWorkspaceTab("chat");
  }

  function insertFinalAnswerDraft() {
    if (!playbook?.finalAnswerDraft) {
      return;
    }

    setFinalAnswer((current) => {
      if (!current.trim()) {
        return playbook.finalAnswerDraft ?? "";
      }

      return `${current.trimEnd()}\n\n${playbook.finalAnswerDraft}`;
    });
  }

  async function copyTraceEventContent(event: TraceEvent) {
    if (!navigator.clipboard) {
      setAttachmentNotice(t("solve.notice.clipboardUnavailable"));
      return;
    }

    try {
      await navigator.clipboard.writeText(event.content);
      setCopiedTraceEventId(event.id);
      window.setTimeout(() => {
        setCopiedTraceEventId((current) => (current === event.id ? "" : current));
      }, 1600);
    } catch {
      setAttachmentNotice(t("solve.notice.copyFailed"));
    }
  }

  async function addFiles(files: FileList | File[]) {
    const incomingFiles = Array.from(files);

    if (incomingFiles.length === 0) {
      return;
    }

    try {
      setAttachmentNotice("");
      const next = await Promise.all(incomingFiles.map((file) => attachmentFromFile(file)));
      setSelectedAttachments((current) => mergeAttachments(current, next));
    } catch (error) {
      setAttachmentNotice(error instanceof Error ? error.message : t("solve.notice.fileAttachFailed"));
    }
  }

  function removeAttachment(attachmentId: string) {
    setSelectedAttachments((current) => current.filter((item) => item.id !== attachmentId));
  }

  function dragMaterial(event: DragEvent, materialId: string) {
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData(materialDragDataType, materialId);
    event.dataTransfer.setData("text/plain", materialId);
  }

  function handleAttachmentDrop(event: DragEvent) {
    event.preventDefault();
    setIsDraggingAttachment(false);

    const materialId = event.dataTransfer.getData(materialDragDataType);
    if (materialId) {
      addMaterialAttachment(materialId);
      return;
    }

    void addFiles(event.dataTransfer.files);
  }

  function blockPromptTextDrop(event: DragEvent<HTMLTextAreaElement>) {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "none";
    setIsDraggingAttachment(false);
  }

  async function sendMessage() {
    if (!attempt || !provider || !model || !input.trim() || isLoading) {
      return;
    }

    if (attempt.trace.filter((event) => event.role === "user").length >= budgetGuardrails.maxTurnsPerAttempt) {
      setInput(t("solve.notice.turnLimitReached"));
      return;
    }

    const clippedInput = input.slice(0, budgetGuardrails.maxInputCharsPerTurn);
    const sourceTraceEventId = sourceTraceEventIdForNextBranchEvent(attempt, "user");
    const userEvent = makeTraceEvent({
      attemptId: attempt.id,
      problemId: problem.id,
      role: "user",
      content: clippedInput,
      provider,
      model,
      attachments: selectedAttachments,
      sourceTraceEventId,
      branchId: attempt.branch?.id,
    });
    const nextTrace = [...attempt.trace, userEvent];
    const nextAttempt = {
      ...attempt,
      provider,
      model,
      trace: nextTrace,
      counterfactualReport: undefined,
      updatedAt: new Date().toISOString(),
    };
    updateAttempt(nextAttempt);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId: problem.id,
          provider,
          model,
          branch: attempt.branch,
          messages: nextTrace.map((event) => ({
            role: event.role,
            content: event.content,
            attachments: event.attachments,
            sourceTraceEventId: event.sourceTraceEventId,
            branchId: event.branchId,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = (await response.json()) as { message: string; modelRun: ModelRun };
      const assistantEvent = makeTraceEvent({
        attemptId: attempt.id,
        problemId: problem.id,
        role: "assistant",
        content: data.message,
        provider: data.modelRun.provider,
        model: data.modelRun.model,
        modelRun: data.modelRun,
        branchId: attempt.branch?.id,
      });

      updateAttempt({
        ...nextAttempt,
        trace: [...nextTrace, assistantEvent],
        updatedAt: new Date().toISOString(),
      });
      setSelectedAttachments([]);
    } catch (error) {
      setAttachmentNotice(`${t("solve.notice.modelCallFailed")} ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  }

  async function submitAttempt() {
    if (!attempt) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId: attempt.id,
          problemId: problem.id,
          trace: attempt.trace,
          finalAnswer,
          locale,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const scoreReport = (await response.json()) as ScoreReport;
      updateAttempt({
        ...attempt,
        status: "judged",
        finalAnswer,
        scoreReport,
        counterfactualReport: undefined,
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function publishAttempt() {
    if (!attempt) {
      return;
    }

    if (!conversationGraph) {
      return;
    }

    setIsPublishing(true);
    setShareNotice("");

    const publicTrace = attempt.trace.map((event) => {
      const publicEvent: TraceEvent & { contextDebug?: unknown } = { ...event };
      delete publicEvent.contextDebug;
      return publicEvent;
    });
    let published: PublishedAttempt = {
      id: crypto.randomUUID(),
      attemptId: attempt.id,
      problemId: problem.id,
      title: attempt.title,
      workflow: attempt.scoreReport?.workflow ?? [],
      trace: publicTrace,
      scoreReport: attempt.scoreReport,
      branch: attempt.branch,
      counterfactualReport: attempt.counterfactualReport,
      solvingMode: attempt.solvingMode,
      createdAt: new Date().toISOString(),
    };
    published = {
      ...published,
      skaiFile: await buildSkaiFileArtifact({
        publishedAttempt: published,
        problem: localizedProblem,
        parentAttempt,
        childGraph: conversationGraph,
        parentGraph: parentConversationGraph ?? undefined,
      }),
    };
    const publishedAttemptState: Attempt = {
      ...attempt,
      status: "published",
      publishedAt: published.createdAt,
      updatedAt: published.createdAt,
    };

    try {
      savePublishedAttempt(published);
      setAttempt(publishedAttemptState);
      saveAttempt(publishedAttemptState);

      const attemptSync = await syncAttemptToSupabase(publishedAttemptState, problem);
      const publishedSync = await syncPublishedAttemptToSupabase(published);
      const nextShareUrl = `${window.location.origin}/share/${attempt.id}`;

      setShareUrl(nextShareUrl);

      if (attemptSync.synced && publishedSync.synced) {
        setShareNotice(t("solve.notice.shareRemoteComplete"));
      } else {
        setShareNotice(t("solve.notice.shareLocalOnly"));
      }
    } finally {
      setIsPublishing(false);
    }
  }

  function branchFrom(index: number) {
    if (!attempt) {
      return;
    }

    const nextAttempt = createBreakpointReplayAttempt({ attempt, traceIndex: index });
    updateAttempt(nextAttempt);
    setFinalAnswer("");
    setInput("");
    setShareUrl("");
    setShareNotice("");
    setSelectedAttachments([]);
    setAttachmentNotice("");
    setWorkspaceTab("chat");
  }

  function branchFromTraceEvent(traceEventId: string) {
    if (!attempt) {
      return;
    }

    const traceIndex = attempt.trace.findIndex((event) => event.id === traceEventId);
    if (traceIndex >= 0) {
      branchFrom(traceIndex);
    }
  }

  function restart() {
    setAttempt(null);
    setProvider(null);
    setModel("");
    setModelOptionId(null);
    setFinalAnswer("");
    setInput("");
    setShareUrl("");
    setShareNotice("");
    setSelectedAttachments([]);
  }

  function loadLastAttempt() {
    if (!attempt) {
      return;
    }

    const saved = getAttempt(attempt.id);
    if (saved) {
      restoreAttemptRuntime(saved);
      setAttempt(saved);
      setFinalAnswer(saved.finalAnswer ?? "");
    }
  }

  function openAttemptFromTree(attemptId: string) {
    const saved = getAttempt(attemptId);

    if (!saved) {
      setAttachmentNotice(t("solve.notice.attemptNotFound"));
      return;
    }

    restoreAttemptRuntime(saved);
    setAttempt(saved);
    setFinalAnswer(saved.finalAnswer ?? "");
    setShareUrl(saved.publishedAt ? `${window.location.origin}/share/${saved.id}` : "");
    setShareNotice("");
    setSelectedAttachments([]);
    setAttachmentNotice("");
    setWorkspaceTab("chat");
  }

  async function runCounterfactualJudge() {
    if (!attempt?.branch) {
      return;
    }

    const parent = getAttempt(attempt.branch.parentAttemptId);

    if (!parent) {
      setAttachmentNotice(t("solve.notice.parentAttemptNotFound"));
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/counterfactual-judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId: problem.id,
          parentAttempt: parent,
          childAttempt: attempt,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const report = (await response.json()) as CounterfactualJudgeReport;
      updateAttempt({
        ...attempt,
        counterfactualReport: report,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      setAttachmentNotice(error instanceof Error ? error.message : t("solve.notice.counterfactualFailed"));
    } finally {
      setIsLoading(false);
    }
  }

  if (!attempt) {
    return (
      <div className="pre-attempt-layout">
        <section className="panel pre-attempt-panel provider-shell" data-provider={provider ?? "unselected"}>
          <div className="panel-header">
            <p className="eyebrow">{t("solve.preAttempt.eyebrow")}</p>
            <h2>{localizedProblem.title}</h2>
            <p className="muted">{localizedProblem.subtitle}</p>
          </div>
          <div className="panel-body pre-attempt-body">
            <div>
              <h3>{t("solve.modeSelection.title")}</h3>
              <p className="muted">{t("solve.modeSelection.description")}</p>
            </div>
            <div className="environment-grid">
              {solvingModes.map((mode) => (
                <button
                  className={`environment-card ${mode.id === solvingModeId ? "active" : ""}`}
                  aria-pressed={mode.id === solvingModeId}
                  key={mode.id}
                  onClick={() => setSolvingModeId(mode.id)}
                  type="button"
                >
                  <span>{mode.label}</span>
                  <strong>{t(`solve.mode.${mode.id}.surfaceLabel`)}</strong>
                  <small>{t(`solve.mode.${mode.id}.description`)}</small>
                  <em>{t(`solve.mode.${mode.id}.evaluationLens`)}</em>
                </button>
              ))}
            </div>
            <div>
              <h3>{t("solve.modelSelection.title")}</h3>
              <p className="muted">{t("solve.modelSelection.description")}</p>
            </div>
            <div className="environment-grid">
              {availableModelOptions.map((option) => (
                <button
                  className={`environment-card ${option.id === modelOptionId ? "active" : ""}`}
                  data-provider={option.provider}
                  aria-pressed={option.id === modelOptionId}
                  key={option.id}
                  onClick={() => handleModelOptionChange(option.id)}
                  type="button"
                >
                  <span>{option.label}</span>
                  <strong>{providerUiProfiles[option.provider].label}</strong>
                  <small>{t(`solve.model.${option.id}.description`)}</small>
                  <em>{t(`solve.model.${option.id}.capabilityNote`)} · {option.model}</em>
                </button>
              ))}
            </div>
            <div className="pre-attempt-selected">
              <div>
                <strong>
                  {t(`solve.mode.${selectedSolvingMode.id}.shortLabel`)} · {selectedModelOption ? selectedModelOption.shortLabel : t("solve.modelSelection.requiredShort")}
                </strong>
                <p className="muted">
                  {selectedModelOption
                    ? `${t("solve.modelSelection.lockedPrefix")} ${providerUiProfiles[selectedModelOption.provider].label} · ${selectedModelOption.model}${t("solve.modelSelection.lockedSuffix")}`
                    : t("solve.modelSelection.requiredDescription")}
                </p>
              </div>
              <button className="button primary" disabled={!selectedModelOption} onClick={startAttempt} type="button">
                <Play size={16} /> {t("solve.action.start")}
              </button>
            </div>
          </div>
        </section>

        <aside className="panel">
          <div className="panel-header">
            <p className="eyebrow">{problem.category}</p>
            <h2>{t("solve.problemPreview.title")}</h2>
          </div>
          <div className="panel-body">
            <h3>{t("solve.problem.statement")}</h3>
            <p className="muted">{localizedProblem.statement}</p>
            <h3>{t("solve.problem.constraints")}</h3>
            <ul className="constraint-list">
              {localizedProblem.constraints.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="panel-body">
            <h3>{t("solve.materials.title")}</h3>
            {problem.materials.length === 0 ? (
              <p className="muted">{t("solve.materials.empty")}</p>
            ) : (
              <div className="material-list">
                {problem.materials.map((material) => (
                  <button
                    className={`material-button ${activeMaterialId === material.id ? "active" : ""}`}
                    key={material.id}
                    onClick={() => setActiveMaterialId(material.id)}
                    type="button"
                  >
                    <span>
                      <strong>{material.title}</strong>
                      <small>{material.fileName}</small>
                    </span>
                    <span className="material-state">{t("solve.materials.view")}</span>
                  </button>
                ))}
              </div>
            )}
            {activeMaterial ? (
              <div className="material-viewer">
                <div>
                  <strong>{activeMaterial.title}</strong>
                  <p className="muted">{activeMaterial.description}</p>
                </div>
                {activeMaterial.kind === "image" && activeMaterial.href ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt={activeMaterial.title} className="material-image" src={activeMaterial.href} />
                ) : null}
                {activeMaterial.kind !== "image" ? (
                  <pre className="material-text">{activeMaterial.extractedText}</pre>
                ) : (
                  <details>
                    <summary>{t("solve.materials.extractedText")}</summary>
                    <pre className="material-text">{activeMaterial.extractedText}</pre>
                  </details>
                )}
              </div>
            ) : null}
          </div>
          <div className="panel-body">
            <Link className="button" href="/">
              Problems
            </Link>
          </div>
        </aside>
      </div>
    );
  }

  return (
    <div className="solve-layout">
      <aside className="panel">
        <div className="panel-header">
          <p className="eyebrow">{problem.category}</p>
          <h2>{localizedProblem.title}</h2>
          <p className="muted">{localizedProblem.subtitle}</p>
        </div>
        <div className="panel-body">
          <h3>{t("solve.problem.statement")}</h3>
          <p className="muted">{localizedProblem.statement}</p>
          <h3>{t("solve.problem.constraints")}</h3>
          <ul className="constraint-list">
            {localizedProblem.constraints.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="panel-body">
          <h3>Deliverables</h3>
          <ul className="constraint-list">
            {localizedProblem.deliverables.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="panel-body">
          <h3>Budget</h3>
          <div className="budget-grid">
            <div>
              <span>{t("solve.budget.attemptEstimate")}</span>
              <strong>{formatUsd(totalEstimatedCostUsd)}</strong>
              <small>{formatKrw(totalEstimatedCostKrw)} {t("solve.budget.rough")}</small>
            </div>
            <div>
              <span>Tokens</span>
              <strong>{totalTokens}</strong>
              <small>{unknownCostEvents > 0 ? `${unknownCostEvents} ${t("solve.budget.unknownCostEvents")}` : t("solve.budget.pricedWhenUsageExists")}</small>
            </div>
            <div>
              <span>{t("solve.budget.eventCap")}</span>
              <strong>{formatKrw(budgetGuardrails.eventCapKrw)}</strong>
              <small>{t("solve.budget.founderGuardrail")}</small>
            </div>
            <div>
              <span>{t("solve.budget.monthlyCap")}</span>
              <strong>{formatKrw(budgetGuardrails.monthlyCapKrw)}</strong>
              <small>{t("solve.budget.founderGuardrail")}</small>
            </div>
          </div>
        </div>
        {problem.materials.length > 0 ? (
          <div className="panel-body">
            <h3>{t("solve.materials.title")}</h3>
            <div className="material-list">
              {problem.materials.map((material) => {
                const isSelected = selectedAttachments.some((item) => item.materialId === material.id);
                return (
                  <button
                    className={`material-button ${activeMaterialId === material.id ? "active" : ""}`}
                    draggable
                    key={material.id}
                    onClick={() => setActiveMaterialId(material.id)}
                    onDragEnd={() => setIsDraggingAttachment(false)}
                    onDragStart={(event) => dragMaterial(event, material.id)}
                    type="button"
                  >
                    <span>
                      <strong>{material.title}</strong>
                      <small>{material.fileName}</small>
                    </span>
                    <span className={isSelected ? "material-state selected" : "material-state"}>
                      {isSelected ? t("solve.materials.inUse") : t("solve.materials.view")}
                    </span>
                  </button>
                );
              })}
            </div>
            {activeMaterial ? (
              <div className="material-viewer">
                <div className="material-viewer-header">
                  <div>
                    <strong>{activeMaterial.title}</strong>
                    <p className="muted">{activeMaterial.description}</p>
                  </div>
                  <button className="button" onClick={() => toggleMaterialAttachment(activeMaterial.id)} type="button">
                    <Paperclip size={15} />{" "}
                    {selectedAttachments.some((item) => item.materialId === activeMaterial.id) ? t("solve.materials.detach") : t("solve.materials.use")}
                  </button>
                </div>
                {activeMaterial.kind === "image" && activeMaterial.href ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt={activeMaterial.title} className="material-image" src={activeMaterial.href} />
                ) : null}
                {activeMaterial.kind !== "image" ? (
                  <pre className="material-text">{activeMaterial.extractedText}</pre>
                ) : (
                  <details>
                    <summary>{t("solve.materials.extractedText")}</summary>
                    <pre className="material-text">{activeMaterial.extractedText}</pre>
                  </details>
                )}
                {activeMaterial.href ? (
                  <a className="button" href={activeMaterial.href} download>
                    {t("solve.materials.downloadOriginal")}
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="panel-body">
          <Link className="button" href="/">
            Problems
          </Link>
        </div>
        <div className="panel-body">
          <h3>{t("solve.history.title")}</h3>
          {attemptHistory.length === 0 ? (
            <p className="muted">{t("solve.history.empty")}</p>
          ) : (
            <ol className="constraint-list">
              {attemptHistory.map((item) => (
                <li key={item.id}>
                  {new Date(item.updatedAt).toLocaleString(locale === "ko" ? "ko-KR" : "en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  · {t(`solve.history.${item.status}`)} · {item.trace.length} {t("solve.workspace.events")}
                  {item.branch ? ` · ${t("solve.history.branch")}` : ""}
                </li>
              ))}
            </ol>
          )}
        </div>
        <div className="panel-body">
          <h3>Branch Tree</h3>
          <BranchTreeExplorer tree={branchTree} currentAttemptId={attempt.id} onOpenAttempt={openAttemptFromTree} />
        </div>
      </aside>

      <section className="panel chat-panel provider-shell" data-provider={provider}>
        <div className="toolbar">
          <div className="workspace-tabs" role="tablist" aria-label={t("solve.workspace.aria")}>
            <button
              aria-selected={workspaceTab === "chat"}
              className={workspaceTab === "chat" ? "active" : ""}
              onClick={() => setWorkspaceTab("chat")}
              role="tab"
              type="button"
            >
              <MessageSquare size={16} /> Chat
            </button>
            <button
              aria-selected={workspaceTab === "graph"}
              className={workspaceTab === "graph" ? "active" : ""}
              onClick={() => setWorkspaceTab("graph")}
              role="tab"
              type="button"
            >
              <Network size={16} /> Graph
            </button>
            <span className="muted">{attempt.trace.length} {t("solve.workspace.events")} · ~{totalTokens} tokens</span>
            <span className="muted">
              {formatUsd(totalEstimatedCostUsd)} {t("solve.workspace.estimateShort")}
              {unknownCostEvents > 0 ? ` · ${unknownCostEvents} ${t("solve.workspace.unknownShort")}` : ""}
            </span>
          </div>
          <div className="segmented locked-environment">
            <span className="lock-dot" aria-hidden="true" />
            <strong>{activeSolvingMode.shortLabel}</strong>
            <span className="environment-meta">
              {providerProfile?.label ?? attempt.provider} · {model}
            </span>
          </div>
          {attempt.branch ? (
            <div className="segmented branch-segment">
              <GitBranch size={16} />
              <strong>Breakpoint</strong>
              <span className="environment-meta">Trace {attempt.branch.parentTraceIndex + 1}</span>
            </div>
          ) : null}
        </div>

        {workspaceTab === "chat" ? (
          <div className="chat-log" aria-live="polite">
            {attempt.trace.length === 0 ? (
              <div className="empty">
                <div>
                  <p>
                    {t("solve.chat.empty.primary")}
                  </p>
                  <p className="muted">{t("solve.chat.empty.secondary")}</p>
                </div>
              </div>
            ) : (
              attempt.trace.map((event, index) => (
                <article className={`message ${event.role}`} key={event.id}>
                  <strong>{event.role === "user" ? "You" : `${event.provider ?? providerProfile?.label ?? "Model"}`}</strong>
                  {attempt.branch?.parentTraceEventId === event.sourceTraceEventId ? (
                    <span className="trace-warning breakpoint">
                      <GitBranch size={14} /> breakpoint
                    </span>
                  ) : null}
                  <MarkdownContent content={event.content} />
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
                  <div className="actions">
                    {event.role === "assistant" ? (
                      <button
                        className="button quiet message-copy-button"
                        onClick={() => void copyTraceEventContent(event)}
                        title={t("solve.chat.copyAnswerTitle")}
                        type="button"
                      >
                        {copiedTraceEventId === event.id ? <Check size={15} /> : <Copy size={15} />}
                        {copiedTraceEventId === event.id ? t("solve.action.copied") : t("solve.action.copyAnswer")}
                      </button>
                    ) : null}
                    <button className="button" onClick={() => branchFrom(index)} title={t("solve.branch.createFromHereTitle")}>
                      <GitBranch size={15} /> Branch
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        ) : (
          <div className="graph-tab-panel">
            {conversationGraph ? (
              <ConversationGraphView graph={conversationGraph} trace={attempt.trace} onBranchTraceEvent={branchFromTraceEvent} />
            ) : null}
          </div>
        )}

        <div className="composer">
          {showOperatorPlaybook && playbook ? (
            <div className="playbook-strip" aria-label={t("solve.playbook.aria")}>
              <div className="playbook-strip-header">
                <div className="playbook-title">
                  <BookOpen size={16} />
                  <strong>Playbook</strong>
                  <span className="muted">{playbook.turns.length} {t("solve.playbook.turns")}</span>
                </div>
                {playbook.finalAnswerDraft ? (
                  <button className="button quiet" onClick={insertFinalAnswerDraft} type="button">
                    {t("solve.playbook.finalDraft")}
                  </button>
                ) : null}
              </div>
              <div className="playbook-turns">
                {playbook.turns.map((turn) => (
                  <button className="playbook-turn" key={turn.id} onClick={() => insertPlaybookTurn(turn)} type="button">
                    <span>{turn.label}</span>
                    <strong>{turn.title}</strong>
                    {turn.attachmentMaterialIds?.length ? (
                      <small>
                        <Paperclip size={12} /> {turn.attachmentMaterialIds.length}{t("solve.playbook.materialSuffix")}
                      </small>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <div
            className={`dropzone ${isDraggingAttachment ? "active" : ""}`}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDraggingAttachment(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "copy";
              setIsDraggingAttachment(true);
            }}
            onDragLeave={() => setIsDraggingAttachment(false)}
            onDrop={handleAttachmentDrop}
          >
            <button className="button" type="button" onClick={() => fileInputRef.current?.click()}>
              <FilePlus2 size={16} /> {t("solve.attachment.addFile")}
            </button>
            <span className="muted">
              {t("solve.attachment.dropzonePrefix")} {operationGuardrails.maxAttachmentsPerMessage}{t("solve.attachment.dropzoneMiddle")}{" "}
              {Math.round(operationGuardrails.maxUploadBytes / 1_000_000)}MB
            </span>
            <input
              ref={fileInputRef}
              multiple
              hidden
              type="file"
              onChange={(event) => {
                if (event.target.files) {
                  void addFiles(event.target.files);
                  event.target.value = "";
                }
              }}
            />
          </div>
          {attachmentNotice ? <p className="attachment-notice">{attachmentNotice}</p> : null}
          {selectedAttachments.length > 0 ? (
            <div className="attachment-row">
              {selectedAttachments.map((attachment) => (
                <span className="attachment-chip" key={attachment.id}>
                  <Paperclip size={14} />
                  {attachment.name}
                  <button aria-label={`${attachment.name} ${t("solve.attachment.remove")}`} onClick={() => removeAttachment(attachment.id)} type="button">
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          ) : null}
          <textarea
            className="textarea"
            placeholder={t("solve.composer.placeholder")}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onDragEnter={blockPromptTextDrop}
            onDragOver={blockPromptTextDrop}
            onDrop={blockPromptTextDrop}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                void sendMessage();
              }
            }}
          />
          <div className="actions">
            <button className="button" onClick={loadLastAttempt}>
              <RotateCcw size={16} /> {t("solve.action.reload")}
            </button>
            <button className="button" onClick={restart}>
              <Play size={16} /> {t("solve.action.new")}
            </button>
            <button className="button primary" disabled={isLoading || !input.trim()} onClick={() => void sendMessage()}>
              <Send size={16} /> {t("solve.action.send")}
            </button>
          </div>
        </div>
      </section>

      <section className="panel" style={{ gridColumn: "1 / -1" }}>
        <div className="panel-header">
          <h2>Final Answer</h2>
          <p className="muted">{t("solve.finalAnswer.description")}</p>
        </div>
        <div className="panel-body">
          <textarea
            className="textarea"
            value={finalAnswer}
            onChange={(event) => setFinalAnswer(event.target.value)}
            placeholder={t("solve.finalAnswer.placeholder")}
          />
          <div className="actions" style={{ marginTop: 10 }}>
            <button className="button primary" disabled={isLoading || attempt.trace.length === 0} onClick={() => void submitAttempt()}>
              <Trophy size={16} /> Submit & Judge
            </button>
          </div>
        </div>
      </section>

      <div style={{ gridColumn: "1 / -1" }}>
        {attempt.scoreReport ? <ScoreReportCard report={attempt.scoreReport} /> : null}
        <div className="actions" style={{ marginTop: 12 }}>
          <button className="button primary" disabled={isPublishing || attempt.trace.length === 0} onClick={() => void publishAttempt()}>
            <Share2 size={16} /> {isPublishing ? t("solve.publish.publishing") : t("solve.publish.publish")}
          </button>
          {shareUrl ? (
            <a className="button" href={shareUrl}>
              {t("solve.publish.viewShare")}
            </a>
          ) : null}
        </div>
        {shareNotice ? <p className="attachment-notice">{shareNotice}</p> : null}
      </div>

      {attempt.branch ? (
        <section className="panel" style={{ gridColumn: "1 / -1" }}>
          <div className="panel-header">
            <h2>
              <GitBranch size={20} /> Branch Diff
            </h2>
            <p className="muted">{t("solve.branch.description")}</p>
          </div>
          <div className="panel-body">
            {parentAttempt ? (
              <div className="branch-diff-grid">
                <div className="diff-stat">
                  <strong>Parent</strong>
                  <span>{parentAttempt.trace.length} {t("solve.workspace.events")} · {parentAttempt.scoreReport?.totalScore ?? t("solve.branch.unjudged")} score</span>
                </div>
                <div className="diff-stat">
                  <strong>Child</strong>
                  <span>{attempt.trace.length} {t("solve.workspace.events")} · {attempt.scoreReport?.totalScore ?? t("solve.branch.unjudged")} score</span>
                </div>
                <div className="diff-stat">
                  <strong>Breakpoint</strong>
                  <span>Trace {attempt.branch.parentTraceIndex + 1}</span>
                </div>
              </div>
            ) : (
              <p className="muted">{t("solve.branch.parentMissing")}</p>
            )}
            <div className="actions" style={{ marginTop: 12 }}>
              <button className="button primary" disabled={isLoading || !parentAttempt} onClick={() => void runCounterfactualJudge()}>
                <GitBranch size={16} /> Run Counterfactual Judge
              </button>
            </div>
          </div>
          {attempt.counterfactualReport ? (
            <div className="panel-body counterfactual-report">
              <div className={`verdict-pill ${attempt.counterfactualReport.verdict}`}>
                {attempt.counterfactualReport.verdict} · {attempt.counterfactualReport.confidence}% confidence
              </div>
              <p>{attempt.counterfactualReport.summary}</p>
              {parentConversationGraph && conversationGraph ? (
                <GraphComparisonView
                  childGraph={conversationGraph}
                  childTrace={attempt.trace}
                  parentGraph={parentConversationGraph}
                  parentTrace={parentAttempt?.trace ?? []}
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
              {parentConversationGraph && conversationGraph ? (
                <GraphStateTransitionView transition={attempt.counterfactualReport.branchDiff.graphTransition} />
              ) : null}
              <div className="signal-row">
                {attempt.counterfactualReport.causalClaims.map((claim) => (
                  <span className={`signal-chip claim-${claim.effect}`} key={`${claim.label}-${claim.effect}`}>
                    {claim.label}: {claim.effect}
                  </span>
                ))}
              </div>
              <p className="muted">{attempt.counterfactualReport.nextReplaySuggestion}</p>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
