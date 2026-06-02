"use client";

import { useMemo, useRef, useState } from "react";
import type { DragEvent } from "react";
import Link from "next/link";
import {
  BookOpen,
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
import { getProblemPlaybook, type ProblemPlaybookTurn } from "@/data/problem-playbooks";
import { attachmentFromFile, attachmentFromMaterial } from "@/lib/attachment-context";
import { buildBranchTree } from "@/lib/branch-tree";
import { createBreakpointReplayAttempt, sourceTraceEventIdForNextBranchEvent } from "@/lib/branching";
import { buildConversationGraph } from "@/lib/conversation-graph";
import { budgetGuardrails, operationGuardrails } from "@/lib/constants";
import { getAttempt, getAttempts, saveAttempt, savePublishedAttempt } from "@/lib/local-store";
import { getModelOption, modelOptions, type ModelOption, type ModelOptionId } from "@/lib/model-options";
import { providerUiProfiles } from "@/lib/provider-ui";
import { getSolvingMode, solvingModes } from "@/lib/solving-modes";
import { syncAttemptToSupabase, syncPublishedAttemptToSupabase } from "@/lib/supabase-persistence";
import type {
  Attempt,
  AttemptAttachment,
  CounterfactualJudgeReport,
  ModelRun,
  Problem,
  ProviderId,
  ScoreReport,
  SolvingModeId,
  TraceEvent,
} from "@/lib/types";
import { ConversationGraphView } from "@/components/conversation-graph-view";
import { BranchTreeExplorer } from "@/components/branch-tree-explorer";
import { GraphStateTransitionView } from "@/components/graph-state-transition-view";
import { MarkdownContent } from "@/components/markdown-content";
import { ScoreReportCard } from "@/components/score-report-card";

const materialDragDataType = "application/x-skai-material-id";

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
  modelOption: ModelOption = getModelOption("skai-mock"),
  solvingModeId: SolvingModeId = "single_model",
): Attempt {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    problemId: problem.id,
    userId: "local-demo-user",
    status: "draft",
    title: `${problem.title} 풀이`,
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
  const defaultModelOption = getModelOption("skai-mock");
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [solvingModeId, setSolvingModeId] = useState<SolvingModeId>("single_model");
  const [modelOptionId, setModelOptionId] = useState<ModelOptionId>(defaultModelOption.id);
  const [provider, setProvider] = useState<ProviderId>(defaultModelOption.provider);
  const [model, setModel] = useState(defaultModelOption.model);
  const [input, setInput] = useState("");
  const [finalAnswer, setFinalAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [selectedAttachments, setSelectedAttachments] = useState<AttemptAttachment[]>([]);
  const [activeMaterialId, setActiveMaterialId] = useState(problem.materials[0]?.id ?? "");
  const [isDraggingAttachment, setIsDraggingAttachment] = useState(false);
  const [attachmentNotice, setAttachmentNotice] = useState("");
  const [workspaceTab, setWorkspaceTab] = useState<"chat" | "graph">("chat");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedSolvingMode = useMemo(() => getSolvingMode(solvingModeId), [solvingModeId]);
  const selectedModelOption = useMemo(() => getModelOption(modelOptionId), [modelOptionId]);
  const availableModelOptions = useMemo(
    () => modelOptions.filter((option) => problem.allowedProviders.includes(option.provider)),
    [problem.allowedProviders],
  );
  const providerProfile = providerUiProfiles[provider];
  const problemAttempts = getAttempts().filter((item) => item.problemId === problem.id);
  const branchTree = buildBranchTree(problemAttempts, problem.id);
  const leaderboard = problemAttempts
    .filter((item) => item.scoreReport)
    .sort((a, b) => (b.scoreReport?.totalScore ?? 0) - (a.scoreReport?.totalScore ?? 0))
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
  const playbook = useMemo(() => getProblemPlaybook(problem.id), [problem.id]);
  const conversationGraph = useMemo(
    () =>
      attempt
        ? buildConversationGraph(attempt.trace, attempt.scoreReport, attempt.branch, {
            problemMaterialCount: problem.materials.length,
          })
        : null,
    [attempt, problem.materials.length],
  );

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
        setAttachmentNotice(`첨부는 한 번에 최대 ${operationGuardrails.maxAttachmentsPerMessage}개까지 가능합니다.`);
        break;
      }

      next.push(attachment);
    }

    return next;
  }

  function updateAttempt(next: Attempt) {
    setAttempt(next);
    saveAttempt(next);
    void syncAttemptToSupabase(next, problem);
  }

  function handleModelOptionChange(nextModelOptionId: ModelOptionId) {
    const option = getModelOption(nextModelOptionId);
    setModelOptionId(option.id);
    setProvider(option.provider);
    setModel(option.model);
  }

  function startAttempt() {
    const next = newAttempt(problem, selectedModelOption, selectedSolvingMode.id);
    setAttempt(next);
    setFinalAnswer("");
    setInput("");
    setShareUrl("");
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
      setAttachmentNotice(error instanceof Error ? error.message : "파일을 첨부하지 못했습니다.");
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
    if (!attempt || !input.trim() || isLoading) {
      return;
    }

    if (attempt.trace.filter((event) => event.role === "user").length >= budgetGuardrails.maxTurnsPerAttempt) {
      setInput("turn 제한에 도달했습니다. 제출하거나 새 attempt를 시작하세요.");
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
      const assistantEvent = makeTraceEvent({
        attemptId: attempt.id,
        problemId: problem.id,
        role: "assistant",
        content: `모델 호출에 실패했습니다.\n\n${error instanceof Error ? error.message : "Unknown error"}`,
        provider: "mock",
        model: "error",
        branchId: attempt.branch?.id,
      });
      updateAttempt({
        ...nextAttempt,
        trace: [...nextTrace, assistantEvent],
        updatedAt: new Date().toISOString(),
      });
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

  function publishAttempt() {
    if (!attempt) {
      return;
    }

    if (!attempt.scoreReport) {
      return;
    }

    const publicTrace = attempt.trace.map((event) => {
      const publicEvent: TraceEvent & { contextDebug?: unknown } = { ...event };
      delete publicEvent.contextDebug;
      return publicEvent;
    });
    const published = {
      id: crypto.randomUUID(),
      attemptId: attempt.id,
      problemId: problem.id,
      title: attempt.title,
      workflow: attempt.scoreReport.workflow,
      trace: publicTrace,
      scoreReport: attempt.scoreReport,
      branch: attempt.branch,
      counterfactualReport: attempt.counterfactualReport,
      solvingMode: attempt.solvingMode,
      createdAt: new Date().toISOString(),
    };

    savePublishedAttempt(published);
    void syncPublishedAttemptToSupabase(published);
    updateAttempt({
      ...attempt,
      status: "published",
      publishedAt: published.createdAt,
      updatedAt: published.createdAt,
    });
    setShareUrl(`${window.location.origin}/share/${attempt.id}`);
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
    setFinalAnswer("");
    setInput("");
    setShareUrl("");
    setSelectedAttachments([]);
  }

  function loadLastAttempt() {
    if (!attempt) {
      return;
    }

    const saved = getAttempt(attempt.id);
    if (saved) {
      setAttempt(saved);
      setFinalAnswer(saved.finalAnswer ?? "");
    }
  }

  function openAttemptFromTree(attemptId: string) {
    const saved = getAttempt(attemptId);

    if (!saved) {
      setAttachmentNotice("선택한 attempt를 local storage에서 찾을 수 없습니다.");
      return;
    }

    setAttempt(saved);
    setFinalAnswer(saved.finalAnswer ?? "");
    setShareUrl(saved.publishedAt ? `${window.location.origin}/share/${saved.id}` : "");
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
      setAttachmentNotice("Parent attempt를 찾을 수 없어 counterfactual judge를 실행할 수 없습니다.");
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
      setAttachmentNotice(error instanceof Error ? error.message : "Counterfactual judge failed.");
    } finally {
      setIsLoading(false);
    }
  }

  if (!attempt) {
    return (
      <div className="pre-attempt-layout">
        <section className="panel pre-attempt-panel provider-shell" data-provider={provider}>
          <div className="panel-header">
            <p className="eyebrow">풀이 설정</p>
            <h2>{problem.title}</h2>
            <p className="muted">{problem.subtitle}</p>
          </div>
          <div className="panel-body pre-attempt-body">
            <div>
              <h3>풀이 모드 선택</h3>
              <p className="muted">
                모드는 이 attempt의 연습 목적입니다. 어떤 모델을 고르든 동일한 모드로 풀 수 있어야 합니다.
              </p>
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
                  <strong>{mode.surfaceLabel}</strong>
                  <small>{mode.description}</small>
                  <em>{mode.evaluationLens}</em>
                </button>
              ))}
            </div>
            <div>
              <h3>모델 선택</h3>
              <p className="muted">
                모델은 실행 엔진입니다. 자료 활용형 모드도 Gemini에 묶이지 않고, 일반 대화형 모드도 OpenAI에 묶이지 않습니다.
              </p>
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
                  <small>{option.description}</small>
                  <em>{option.capabilityNote} · {option.model}</em>
                </button>
              ))}
            </div>
            <div className="pre-attempt-selected">
              <div>
                <strong>
                  {selectedSolvingMode.shortLabel} · {selectedModelOption.shortLabel}
                </strong>
                <p className="muted">
                  선택한 모드는 평가 렌즈이고, 선택한 모델은 실행 엔진입니다. 이 attempt에서는 {providerUiProfiles[provider].label} · {model}로 고정됩니다.
                </p>
              </div>
              <button className="button primary" onClick={startAttempt} type="button">
                <Play size={16} /> 풀이 시작
              </button>
            </div>
          </div>
        </section>

        <aside className="panel">
          <div className="panel-header">
            <p className="eyebrow">{problem.category}</p>
            <h2>문제 확인</h2>
          </div>
          <div className="panel-body">
            <h3>문제</h3>
            <p className="muted">{problem.statement}</p>
            <h3>제약</h3>
            <ul className="constraint-list">
              {problem.constraints.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="panel-body">
            <h3>자료</h3>
            {problem.materials.length === 0 ? (
              <p className="muted">제공 자료가 없습니다.</p>
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
                    <span className="material-state">보기</span>
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
                    <summary>추출 텍스트 보기</summary>
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
          <h2>{problem.title}</h2>
          <p className="muted">{problem.subtitle}</p>
        </div>
        <div className="panel-body">
          <h3>문제</h3>
          <p className="muted">{problem.statement}</p>
          <h3>제약</h3>
          <ul className="constraint-list">
            {problem.constraints.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="panel-body">
          <h3>Deliverables</h3>
          <ul className="constraint-list">
            {problem.deliverables.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="panel-body">
          <h3>Budget</h3>
          <div className="budget-grid">
            <div>
              <span>Attempt estimate</span>
              <strong>{formatUsd(totalEstimatedCostUsd)}</strong>
              <small>{formatKrw(totalEstimatedCostKrw)} rough</small>
            </div>
            <div>
              <span>Tokens</span>
              <strong>{totalTokens}</strong>
              <small>{unknownCostEvents > 0 ? `${unknownCostEvents} unknown-cost events` : "priced when usage exists"}</small>
            </div>
            <div>
              <span>Event cap</span>
              <strong>{formatKrw(budgetGuardrails.eventCapKrw)}</strong>
              <small>founder guardrail</small>
            </div>
            <div>
              <span>Monthly cap</span>
              <strong>{formatKrw(budgetGuardrails.monthlyCapKrw)}</strong>
              <small>founder guardrail</small>
            </div>
          </div>
        </div>
        {problem.materials.length > 0 ? (
          <div className="panel-body">
            <h3>자료</h3>
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
                    <span className={isSelected ? "material-state selected" : "material-state"}>{isSelected ? "사용 중" : "보기"}</span>
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
                    {selectedAttachments.some((item) => item.materialId === activeMaterial.id) ? "해제" : "사용"}
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
                    <summary>추출 텍스트 보기</summary>
                    <pre className="material-text">{activeMaterial.extractedText}</pre>
                  </details>
                )}
                {activeMaterial.href ? (
                  <a className="button" href={activeMaterial.href} download>
                    원본 다운로드
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
          <h3>Local Leaderboard</h3>
          {leaderboard.length === 0 ? (
            <p className="muted">아직 이 문제의 채점 기록이 없습니다.</p>
          ) : (
            <ol className="constraint-list">
              {leaderboard.map((item) => (
                <li key={item.id}>
                  {item.scoreReport?.totalScore ?? 0}점 · {item.provider}/{item.model}
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
          <div className="workspace-tabs" role="tablist" aria-label="Attempt workspace">
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
            <span className="muted">{attempt.trace.length} events · ~{totalTokens} tokens</span>
            <span className="muted">
              {formatUsd(totalEstimatedCostUsd)} est{unknownCostEvents > 0 ? ` · ${unknownCostEvents} unknown` : ""}
            </span>
          </div>
          <div className="segmented locked-environment">
            <span className="lock-dot" aria-hidden="true" />
            <strong>{activeSolvingMode.shortLabel}</strong>
            <span className="environment-meta">
              {providerProfile.label} · {model}
            </span>
          </div>
          {attempt.branch ? (
            <div className="segmented branch-segment">
              <GitBranch size={16} />
              <strong>Breakpoint</strong>
              <span className="environment-meta">trace {attempt.branch.parentTraceIndex + 1}</span>
            </div>
          ) : null}
        </div>

        {workspaceTab === "chat" ? (
          <div className="chat-log" aria-live="polite">
            {attempt.trace.length === 0 ? (
              <div className="empty">
                <div>
                  <p>
                    첫 프롬프트에서 정답을 바로 요구하기보다 목표, 제약, 산출물, 검증 기준을 먼저 잡아보세요.
                  </p>
                  <p className="muted">Mock provider는 API key 없이 동작합니다.</p>
                </div>
              </div>
            ) : (
              attempt.trace.map((event, index) => (
                <article className={`message ${event.role}`} key={event.id}>
                  <strong>{event.role === "user" ? "You" : `${event.provider ?? providerProfile.label}`}</strong>
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
                    <button className="button" onClick={() => branchFrom(index)} title="이 지점에서 replay branch 생성">
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
          {playbook ? (
            <div className="playbook-strip" aria-label="Problem prompt playbook">
              <div className="playbook-strip-header">
                <div className="playbook-title">
                  <BookOpen size={16} />
                  <strong>Playbook</strong>
                  <span className="muted">{playbook.turns.length} turns</span>
                </div>
                {playbook.finalAnswerDraft ? (
                  <button className="button quiet" onClick={insertFinalAnswerDraft} type="button">
                    Final draft
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
                        <Paperclip size={12} /> {turn.attachmentMaterialIds.length} 자료
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
              <FilePlus2 size={16} /> 파일 추가
            </button>
            <span className="muted">
              자료 카드를 끌어오거나 파일을 드래그해 다음 프롬프트에 첨부합니다. 최대 {operationGuardrails.maxAttachmentsPerMessage}개 · 파일당{" "}
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
                  <button aria-label={`${attachment.name} 제거`} onClick={() => removeAttachment(attachment.id)} type="button">
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          ) : null}
          <textarea
            className="textarea"
            placeholder="AI에게 보낼 다음 지시를 작성하세요."
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
              <RotateCcw size={16} /> Reload
            </button>
            <button className="button" onClick={restart}>
              <Play size={16} /> New
            </button>
            <button className="button primary" disabled={isLoading || !input.trim()} onClick={() => void sendMessage()}>
              <Send size={16} /> Send
            </button>
          </div>
        </div>
      </section>

      <section className="panel" style={{ gridColumn: "1 / -1" }}>
        <div className="panel-header">
          <h2>Final Answer</h2>
          <p className="muted">최종 산출물, 검증 계획, 남은 가정을 분리해서 제출하세요.</p>
        </div>
        <div className="panel-body">
          <textarea
            className="textarea"
            value={finalAnswer}
            onChange={(event) => setFinalAnswer(event.target.value)}
            placeholder="최종 답안을 작성하세요."
          />
          <div className="actions" style={{ marginTop: 10 }}>
            <button className="button primary" disabled={isLoading || attempt.trace.length === 0} onClick={() => void submitAttempt()}>
              <Trophy size={16} /> Submit & Judge
            </button>
          </div>
        </div>
      </section>

      {attempt.scoreReport ? (
        <div style={{ gridColumn: "1 / -1" }}>
          <ScoreReportCard report={attempt.scoreReport} />
          <div className="actions" style={{ marginTop: 12 }}>
            <button className="button primary" onClick={publishAttempt}>
              <Share2 size={16} /> Publish
            </button>
            {shareUrl ? (
              <Link className="button" href={`/share/${attempt.id}`}>
                공유 보기
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      {attempt.branch ? (
        <section className="panel" style={{ gridColumn: "1 / -1" }}>
          <div className="panel-header">
            <h2>
              <GitBranch size={20} /> Branch Diff
            </h2>
            <p className="muted">parent attempt와 이 replay branch를 비교해 병목이 실제로 개선됐는지 봅니다.</p>
          </div>
          <div className="panel-body">
            {parentAttempt ? (
              <div className="branch-diff-grid">
                <div className="diff-stat">
                  <strong>Parent</strong>
                  <span>{parentAttempt.trace.length} events · {parentAttempt.scoreReport?.totalScore ?? "unjudged"} score</span>
                </div>
                <div className="diff-stat">
                  <strong>Child</strong>
                  <span>{attempt.trace.length} events · {attempt.scoreReport?.totalScore ?? "unjudged"} score</span>
                </div>
                <div className="diff-stat">
                  <strong>Breakpoint</strong>
                  <span>trace {attempt.branch.parentTraceIndex + 1}</span>
                </div>
              </div>
            ) : (
              <p className="muted">Parent attempt를 local storage에서 찾을 수 없습니다.</p>
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
              <div className="branch-diff-grid">
                <div className="diff-card">
                  <strong>Prompt before</strong>
                  <p>{attempt.counterfactualReport.branchDiff.promptChange?.before ?? "No parent prompt found."}</p>
                </div>
                <div className="diff-card">
                  <strong>Prompt after</strong>
                  <p>{attempt.counterfactualReport.branchDiff.promptChange?.after ?? "No child prompt found yet."}</p>
                </div>
              </div>
              <GraphStateTransitionView transition={attempt.counterfactualReport.branchDiff.graphTransition} />
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
