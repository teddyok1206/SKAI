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
  };
}

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
