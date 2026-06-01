"use client";

import type { ContextDebugSnapshot } from "@/lib/types";

interface ContextDebugPanelProps {
  snapshot?: ContextDebugSnapshot;
}

function roleLabel(role: string) {
  if (role === "system") {
    return "system";
  }

  if (role === "assistant") {
    return "assistant";
  }

  return "user";
}

export function ContextDebugPanel({ snapshot }: ContextDebugPanelProps) {
  if (!snapshot) {
    return null;
  }

  return (
    <details className="context-debug">
      <summary>
        <span>Context sent to provider</span>
        <small>
          {snapshot.providerMessageCount} messages · {snapshot.omittedMessageCount} omitted
        </small>
      </summary>
      <p className="context-debug-note">{snapshot.providerAdapterNote}</p>
      <div className="context-debug-list">
        {snapshot.messages.map((message) => (
          <section className={`context-debug-message ${message.activeInstruction ? "active" : ""}`} key={message.order}>
            <div className="context-debug-meta">
              <strong>
                {message.order}. {message.label}
              </strong>
              <span>{roleLabel(message.role)}</span>
              {message.activeInstruction ? <em>active instruction</em> : null}
            </div>
            {message.attachmentNames && message.attachmentNames.length > 0 ? (
              <p className="context-debug-attachments">attachments: {message.attachmentNames.join(", ")}</p>
            ) : null}
            <pre>{message.content}</pre>
          </section>
        ))}
      </div>
    </details>
  );
}
