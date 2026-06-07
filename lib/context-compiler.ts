import { createHash } from "node:crypto";
import { operationGuardrails } from "@/lib/constants";
import type { AttemptBranch, ChatMessage } from "@/lib/types";

export interface CompiledContext {
  messages: ChatMessage[];
  metadata: {
    materializedAt: string;
    sourceMessageCount: number;
    providerMessageCount: number;
    omittedMessageCount: number;
    branchId?: string;
    parentAttemptId?: string;
    parentTraceEventId?: string;
    cacheKey?: string;
    cacheHit?: boolean;
  };
}

const contextCache = new Map<string, CompiledContext>();
const maxContextCacheEntries = 80;

function pruneMessages(messages: ChatMessage[]) {
  const maxMessages = operationGuardrails.maxMessagesPerRequest;

  if (messages.length <= maxMessages) {
    return {
      messages,
      omitted: 0,
    };
  }

  return {
    messages: messages.slice(messages.length - maxMessages),
    omitted: messages.length - maxMessages,
  };
}

export function compileProviderContext(input: {
  messages: ChatMessage[];
  branch?: AttemptBranch;
  now?: string;
}): CompiledContext {
  const pruned = pruneMessages(input.messages);

  return {
    messages: pruned.messages,
    metadata: {
      materializedAt: input.now ?? new Date().toISOString(),
      sourceMessageCount: input.messages.length,
      providerMessageCount: pruned.messages.length,
      omittedMessageCount: pruned.omitted,
      branchId: input.branch?.id,
      parentAttemptId: input.branch?.parentAttemptId,
      parentTraceEventId: input.branch?.parentTraceEventId,
    },
  };
}

function contextCacheKey(input: { messages: ChatMessage[]; branch?: AttemptBranch }) {
  const normalized = {
    branch: input.branch
      ? {
          id: input.branch.id,
          parentAttemptId: input.branch.parentAttemptId,
          parentTraceEventId: input.branch.parentTraceEventId,
          parentTraceIndex: input.branch.parentTraceIndex,
        }
      : null,
    messages: input.messages.map((message) => ({
      role: message.role,
      content: message.content,
      sourceTraceEventId: message.sourceTraceEventId,
      branchId: message.branchId,
      attachments: message.attachments?.map((attachment) => ({
        id: attachment.id,
        source: attachment.source,
        materialId: attachment.materialId,
        name: attachment.name,
        mimeType: attachment.mimeType,
        size: attachment.size,
        textLength: attachment.textContent?.length ?? 0,
        dataUrlLength: attachment.dataUrl?.length ?? 0,
      })),
    })),
  };

  return createHash("sha256").update(JSON.stringify(normalized)).digest("hex").slice(0, 16);
}

export function compileProviderContextCached(input: {
  messages: ChatMessage[];
  branch?: AttemptBranch;
  now?: string;
}): CompiledContext {
  const cacheKey = contextCacheKey(input);
  const cached = contextCache.get(cacheKey);

  if (cached) {
    return {
      messages: cached.messages,
      metadata: {
        ...cached.metadata,
        materializedAt: input.now ?? new Date().toISOString(),
        cacheKey,
        cacheHit: true,
      },
    };
  }

  const compiled = compileProviderContext(input);
  const value = {
    ...compiled,
    metadata: {
      ...compiled.metadata,
      cacheKey,
      cacheHit: false,
    },
  };

  contextCache.set(cacheKey, value);
  if (contextCache.size > maxContextCacheEntries) {
    const oldestKey = contextCache.keys().next().value;
    if (oldestKey) {
      contextCache.delete(oldestKey);
    }
  }

  return value;
}
