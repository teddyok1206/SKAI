"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { FilePlus2, GitBranch, MessageSquare, Paperclip, Play, RotateCcw, Send, Share2, Trophy, X } from "lucide-react";
import { attachmentFromFile, attachmentFromMaterial } from "@/lib/attachment-context";
import { budgetGuardrails } from "@/lib/constants";
import { getAttempt, getAttempts, saveAttempt, savePublishedAttempt } from "@/lib/local-store";
import { syncAttemptToSupabase, syncPublishedAttemptToSupabase } from "@/lib/supabase-persistence";
import type { Attempt, AttemptAttachment, ModelRun, Problem, ProviderId, ScoreReport, TraceEvent } from "@/lib/types";
import { ScoreReportCard } from "@/components/score-report-card";

const providerOptions: Array<{ id: ProviderId; label: string; model: string }> = [
  { id: "mock", label: "Mock", model: "mock-orchestrator" },
  { id: "groq", label: "Groq", model: "llama-3.3-70b-versatile" },
  { id: "xai", label: "xAI Grok", model: "grok-4-fast" },
  { id: "openai", label: "OpenAI", model: "gpt-4.1-mini" },
  { id: "openrouter", label: "OpenRouter", model: "openai/gpt-oss-20b" },
];

function newAttempt(problem: Problem): Attempt {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    problemId: problem.id,
    userId: "local-demo-user",
    status: "draft",
    title: `${problem.title} 풀이`,
    provider: "mock",
    model: "mock-orchestrator",
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
  };
}

export function ProblemSolver({ problem }: { problem: Problem }) {
  const [attempt, setAttempt] = useState<Attempt>(() => newAttempt(problem));
  const [provider, setProvider] = useState<ProviderId>("mock");
  const [model, setModel] = useState("mock-orchestrator");
  const [input, setInput] = useState("");
  const [finalAnswer, setFinalAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [selectedAttachments, setSelectedAttachments] = useState<AttemptAttachment[]>([]);
  const [activeMaterialId, setActiveMaterialId] = useState(problem.materials[0]?.id ?? "");
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedProvider = useMemo(
    () => providerOptions.find((item) => item.id === provider) ?? providerOptions[0],
    [provider],
  );
  const leaderboard = getAttempts()
    .filter((item) => item.problemId === problem.id && item.scoreReport)
    .sort((a, b) => (b.scoreReport?.totalScore ?? 0) - (a.scoreReport?.totalScore ?? 0))
    .slice(0, 5);

  const totalTokens = attempt.trace.reduce(
    (sum, event) => sum + (event.usageInputTokens ?? 0) + (event.usageOutputTokens ?? 0),
    0,
  );
  const activeMaterial = problem.materials.find((material) => material.id === activeMaterialId);

  function updateAttempt(next: Attempt) {
    setAttempt(next);
    saveAttempt(next);
    void syncAttemptToSupabase(next, problem);
  }

  function handleProviderChange(nextProvider: ProviderId) {
    const option = providerOptions.find((item) => item.id === nextProvider) ?? providerOptions[0];
    setProvider(option.id);
    setModel(option.model);
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

      return [...current, attachmentFromMaterial(material)];
    });
  }

  async function addFiles(files: FileList | File[]) {
    const next = await Promise.all(Array.from(files).map((file) => attachmentFromFile(file)));
    setSelectedAttachments((current) => [...current, ...next]);
  }

  function removeAttachment(attachmentId: string) {
    setSelectedAttachments((current) => current.filter((item) => item.id !== attachmentId));
  }

  async function sendMessage() {
    if (!input.trim() || isLoading) {
      return;
    }

    if (attempt.trace.filter((event) => event.role === "user").length >= budgetGuardrails.maxTurnsPerAttempt) {
      setInput("turn 제한에 도달했습니다. 제출하거나 새 attempt를 시작하세요.");
      return;
    }

    const clippedInput = input.slice(0, budgetGuardrails.maxInputCharsPerTurn);
    const userEvent = makeTraceEvent({
      attemptId: attempt.id,
      problemId: problem.id,
      role: "user",
      content: clippedInput,
      provider,
      model,
      attachments: selectedAttachments,
    });
    const nextTrace = [...attempt.trace, userEvent];
    const nextAttempt = {
      ...attempt,
      provider,
      model,
      trace: nextTrace,
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
          messages: nextTrace.map((event) => ({
            role: event.role,
            content: event.content,
            attachments: event.attachments,
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
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  }

  function publishAttempt() {
    if (!attempt.scoreReport) {
      return;
    }

    const published = {
      id: crypto.randomUUID(),
      attemptId: attempt.id,
      problemId: problem.id,
      title: attempt.title,
      workflow: attempt.scoreReport.workflow,
      trace: attempt.trace,
      scoreReport: attempt.scoreReport,
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
    const nextTrace = attempt.trace.slice(0, index + 1);
    updateAttempt({
      ...attempt,
      status: "draft",
      trace: nextTrace,
      scoreReport: undefined,
      finalAnswer: undefined,
      updatedAt: new Date().toISOString(),
    });
    setFinalAnswer("");
    setShareUrl("");
  }

  function restart() {
    const next = newAttempt(problem);
    setAttempt(next);
    setFinalAnswer("");
    setInput("");
    setShareUrl("");
    setSelectedAttachments([]);
    saveAttempt(next);
  }

  function loadLastAttempt() {
    const saved = getAttempt(attempt.id);
    if (saved) {
      setAttempt(saved);
      setFinalAnswer(saved.finalAnswer ?? "");
    }
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
        {problem.materials.length > 0 ? (
          <div className="panel-body">
            <h3>자료</h3>
            <div className="material-list">
              {problem.materials.map((material) => {
                const isSelected = selectedAttachments.some((item) => item.materialId === material.id);
                return (
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
      </aside>

      <section className="panel chat-panel">
        <div className="toolbar">
          <div className="segmented">
            <MessageSquare size={17} />
            <strong>Attempt</strong>
            <span className="muted">{attempt.trace.length} events · ~{totalTokens} tokens</span>
          </div>
          <div className="segmented">
            <select
              className="select"
              aria-label="Model provider"
              value={provider}
              onChange={(event) => handleProviderChange(event.target.value as ProviderId)}
            >
              {providerOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <input className="input" value={model} onChange={(event) => setModel(event.target.value)} />
          </div>
        </div>

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
                <strong>{event.role === "user" ? "You" : `${event.provider ?? selectedProvider.label}`}</strong>
                <p>{event.content}</p>
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
                  <button className="button" onClick={() => branchFrom(index)} title="이 지점부터 다시 시작">
                    <GitBranch size={15} /> Branch
                  </button>
                </div>
              </article>
            ))
          )}
        </div>

        <div className="composer">
          <div
            className={`dropzone ${isDraggingFile ? "active" : ""}`}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDraggingFile(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDraggingFile(true);
            }}
            onDragLeave={() => setIsDraggingFile(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDraggingFile(false);
              void addFiles(event.dataTransfer.files);
            }}
          >
            <button className="button" type="button" onClick={() => fileInputRef.current?.click()}>
              <FilePlus2 size={16} /> 파일 추가
            </button>
            <span className="muted">문제 자료를 선택하거나 파일을 드래그해 다음 프롬프트에 첨부합니다.</span>
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
    </div>
  );
}
