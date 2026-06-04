"use client";

import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Download, FileJson, Printer, Share2, ShieldCheck, ShieldX, Upload } from "lucide-react";
import { ConversationGraphView } from "@/components/conversation-graph-view";
import { GraphComparisonView } from "@/components/graph-comparison-view";
import { useLanguagePreference } from "@/components/language-toggle";
import { MarkdownContent } from "@/components/markdown-content";
import { SkaiExtensionRegistry } from "@/components/skai-extension-registry";
import { getCopy, type Locale } from "@/lib/i18n";
import {
  serializeSkaiFileArtifact,
  skaiFileMimeType,
  skaiFileName,
  verifySkaiFileArtifact,
} from "@/lib/skai-format";
import type { SkaiFileArtifact, TraceEvent } from "@/lib/types";

function compactText(value: string, limit = 180) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= limit) {
    return normalized;
  }

  return `${normalized.slice(0, limit - 1)}…`;
}

function isSkaiFileArtifact(value: unknown): value is SkaiFileArtifact {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<SkaiFileArtifact>;

  return (
    candidate.format === "SKAI" &&
    candidate.schemaVersion === "skai.file.v1" &&
    candidate.extension === ".skai" &&
    Boolean(candidate.manifest) &&
    Boolean(candidate.payload) &&
    Boolean(candidate.integrity)
  );
}

function traceRoleLabel(role: TraceEvent["role"], locale: Locale) {
  if (role === "user") {
    return "Prompt";
  }

  if (role === "assistant") {
    return "Response";
  }

  return getCopy("skaiViewer.traceRole.system", locale);
}

export function SkaiFileViewer({
  artifact,
  allowImport = false,
  shareUrl,
  title = ".skai Viewer",
  variant = "standalone",
}: {
  artifact?: SkaiFileArtifact;
  allowImport?: boolean;
  shareUrl?: string;
  title?: string;
  variant?: "standalone" | "embedded";
}) {
  const { locale } = useLanguagePreference();
  const t = (key: string) => getCopy(key, locale);
  const [currentArtifact, setCurrentArtifact] = useState<SkaiFileArtifact | undefined>(artifact);
  const [notice, setNotice] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [verification, setVerification] = useState<{
    artifactHash: string;
    ok: boolean;
    actualArtifactHash: string;
    expectedArtifactHash: string;
    sectionChecks: Record<string, boolean>;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!currentArtifact) {
      return;
    }

    const artifactHash = currentArtifact.integrity.artifactHash;

    void verifySkaiFileArtifact(currentArtifact)
      .then((result) => {
        if (!cancelled) {
          setVerification({ ...result, artifactHash });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setVerification(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentArtifact]);

  const activeVerification =
    verification && currentArtifact && verification.artifactHash === currentArtifact.integrity.artifactHash ? verification : null;
  const trace = currentArtifact?.payload.attempt.trace ?? [];
  const graph = currentArtifact?.payload.graph.child;
  const parentGraph = currentArtifact?.payload.graph.parent;
  const parentTrace = currentArtifact?.payload.branch?.parentTrace ?? [];
  const graphStats = useMemo(() => {
    if (!graph) {
      return null;
    }

    return {
      prompts: graph.promptNodes.filter((node) => !node.synthetic).length,
      responses: graph.responseNodes.filter((node) => !node.synthetic).length,
      edges: graph.promptEdges.length + graph.responseEdges.length + graph.statusEdges.length,
      pairs: graph.pairs.length,
    };
  }, [graph]);

  async function loadFile(file: File) {
    setNotice("");

    if (!file.name.endsWith(".skai")) {
      setNotice(t("skaiViewer.notice.selectSkai"));
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;

      if (!isSkaiFileArtifact(parsed)) {
        setNotice(t("skaiViewer.notice.invalidArtifact"));
        return;
      }

      setCurrentArtifact(parsed);
      setNotice(`${file.name} ${t("skaiViewer.notice.loaded")}`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t("skaiViewer.notice.readFailed"));
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (file) {
      void loadFile(file);
      event.target.value = "";
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files[0];

    if (file) {
      void loadFile(file);
    }
  }

  function saveSkaiFile() {
    if (!currentArtifact) {
      return;
    }

    const blob = new Blob([serializeSkaiFileArtifact(currentArtifact)], { type: `${skaiFileMimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = skaiFileName(currentArtifact.manifest.title);
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice(`${t("skaiViewer.notice.saved")} · ${currentArtifact.integrity.artifactHash.slice(0, 12)}`);
  }

  async function shareArtifact() {
    const url = shareUrl ?? (typeof window !== "undefined" ? window.location.href : "");

    if (!url) {
      return;
    }

    if (navigator.share) {
      await navigator.share({
        title: currentArtifact?.manifest.title ?? "SKAI artifact",
        text: "SKAI orchestration artifact",
        url,
      });
      return;
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setNotice(t("skaiViewer.notice.shareCopied"));
    }
  }

  function printPdf() {
    window.print();
  }

  return (
    <section className={`panel skai-file-viewer ${variant === "embedded" ? "embedded" : ""}`} aria-label={t("skaiViewer.aria.viewer")}>
      <div className="panel-header skai-file-viewer-header">
        <div>
          <p className="eyebrow">{title}</p>
          <h2>{currentArtifact?.manifest.title ?? t("skaiViewer.openTitle")}</h2>
          {variant === "standalone" ? (
            <p className="muted">{t("skaiViewer.standaloneDescription")}</p>
          ) : (
            <p className="muted">{t("skaiViewer.embeddedDescription")}</p>
          )}
        </div>
        <div className="skai-viewer-actions">
          <button className="button" disabled={!currentArtifact} onClick={saveSkaiFile} type="button">
            <Download size={16} /> {t("skaiViewer.action.save")}
          </button>
          <button className="button" disabled={!currentArtifact} onClick={() => void shareArtifact()} type="button">
            <Share2 size={16} /> {t("skaiViewer.action.share")}
          </button>
          <button className="button primary" disabled={!currentArtifact} onClick={printPdf} type="button">
            <Printer size={16} /> PDF
          </button>
        </div>
      </div>

      {allowImport ? (
        <div
          className={`skai-file-import ${isDragging ? "active" : ""}`}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <FileJson size={20} />
          <div>
            <strong>{t("skaiViewer.import.title")}</strong>
            <p className="muted">{t("skaiViewer.import.description")}</p>
          </div>
          <button className="button" onClick={() => fileInputRef.current?.click()} type="button">
            <Upload size={16} /> {t("skaiViewer.import.chooseFile")}
          </button>
          <input ref={fileInputRef} hidden accept=".skai,application/json,application/vnd.skai+json" type="file" onChange={handleFileChange} />
        </div>
      ) : null}

      {notice ? <p className="attachment-notice neutral">{notice}</p> : null}

      {!currentArtifact || !graph ? (
        <div className="panel-body empty skai-file-empty">
          <p className="muted">{t("skaiViewer.empty")}</p>
        </div>
      ) : (
        <div className="skai-file-viewer-body">
          <div className="skai-file-manifest-grid">
            <div>
              <span>Schema</span>
              <strong>{currentArtifact.schemaVersion}</strong>
              <small>{currentArtifact.mimeType}</small>
            </div>
            <div>
              <span>Source</span>
              <strong>{currentArtifact.manifest.source.platform}</strong>
              <small>{currentArtifact.manifest.source.primaryModel ?? currentArtifact.manifest.source.conversationId}</small>
            </div>
            <div>
              <span>Integrity</span>
              <strong className={activeVerification?.ok ? "integrity-ok" : "integrity-warn"}>
                {activeVerification?.ok ? <CheckCircle2 size={15} /> : activeVerification ? <ShieldX size={15} /> : <ShieldCheck size={15} />}
                {activeVerification ? (activeVerification.ok ? t("skaiViewer.integrity.verified") : t("skaiViewer.integrity.mismatch")) : t("skaiViewer.integrity.checking")}
              </strong>
              <small>{currentArtifact.integrity.artifactHash.slice(0, 18)}</small>
            </div>
            <div>
              <span>Graph</span>
              <strong>{graphStats?.pairs ?? 0} {t("skaiViewer.graph.pairs")}</strong>
              <small>{graphStats?.prompts ?? 0}P / {graphStats?.responses ?? 0}R / {graphStats?.edges ?? 0}E</small>
            </div>
          </div>

          {activeVerification ? (
            <div className="skai-integrity-row">
              {Object.entries(activeVerification.sectionChecks).map(([section, ok]) => (
                <span className={ok ? "signal-chip integrity-ok" : "signal-chip integrity-warn"} key={section}>
                  {section}: {ok ? t("skaiViewer.integrity.ok") : t("skaiViewer.integrity.changed")}
                </span>
              ))}
            </div>
          ) : null}

          {parentGraph && parentTrace.length > 0 ? (
            <GraphComparisonView childGraph={graph} childTrace={trace} parentGraph={parentGraph} parentTrace={parentTrace} />
          ) : (
            <ConversationGraphView graph={graph} trace={trace} title="3D Dual Graph" />
          )}

          <SkaiExtensionRegistry artifact={currentArtifact} />

          <section className="skai-file-trace" aria-label={t("skaiViewer.traceEvidence")}>
            <div className="panel-header compact">
              <h3>{t("skaiViewer.traceEvidence")}</h3>
              <p className="muted">{t("skaiViewer.traceDescription")}</p>
            </div>
            <div className="raw-transcript">
              {trace.map((event, index) => (
                <details id={`skai-file-trace-${event.id}`} key={event.id}>
                  <summary>
                    <span>
                      {index + 1}. {traceRoleLabel(event.role, locale)}
                    </span>
                    <small>
                      {event.provider ?? "unknown"} {event.model ? `· ${event.model}` : ""}
                    </small>
                  </summary>
                  {event.attachments && event.attachments.length > 0 ? (
                    <div className="attachment-row">
                      {event.attachments.map((attachment) => (
                        <span className="attachment-chip" key={attachment.id}>
                          {attachment.name}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <p className="muted">{compactText(event.content, 220)}</p>
                  <div className="raw-content">
                    <MarkdownContent content={event.content} />
                  </div>
                </details>
              ))}
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
