import { operationGuardrails } from "@/lib/constants";
import type { AttemptBranch, ChatMessage, ContextDebugSnapshot, Problem } from "@/lib/types";

export interface CompiledContext {
  systemPrompt: string;
  contextMessage: string;
  messages: ChatMessage[];
  debugSnapshot: ContextDebugSnapshot;
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

function list(items: string[]) {
  if (items.length === 0) {
    return "- none";
  }

  return items.map((item) => `- ${item}`).join("\n");
}

function materialCatalog(problem: Problem) {
  if (problem.materials.length === 0) {
    return "- none";
  }

  return problem.materials
    .map((material) =>
      [
        `- ${material.title}`,
        `  id: ${material.id}`,
        `  file: ${material.fileName}`,
        `  kind: ${material.kind}`,
        `  description: ${material.description}`,
      ].join("\n"),
    )
    .join("\n");
}

function branchContext(branch?: AttemptBranch) {
  if (!branch) {
    return "No branch replay metadata for this request.";
  }

  return [
    "This request is executing a breakpoint replay branch.",
    `branch_id: ${branch.id}`,
    `parent_attempt_id: ${branch.parentAttemptId}`,
    `parent_trace_event_id: ${branch.parentTraceEventId}`,
    `parent_trace_index: ${branch.parentTraceIndex}`,
    branch.parentPairId ? `parent_pair_id: ${branch.parentPairId}` : undefined,
    `label: ${branch.label}`,
    "Interpret source_trace_event_id on a user message as the parent prompt being replaced or continued from.",
  ]
    .filter(Boolean)
    .join("\n");
}

function lineageContext(messages: ChatMessage[]) {
  const lineage = messages
    .map((message, index) => {
      if (!message.sourceTraceEventId && !message.branchId) {
        return undefined;
      }

      return [
        `- message_index: ${index}`,
        `  role: ${message.role}`,
        message.sourceTraceEventId ? `  source_trace_event_id: ${message.sourceTraceEventId}` : undefined,
        message.branchId ? `  branch_id: ${message.branchId}` : undefined,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .filter(Boolean);

  return lineage.length > 0 ? lineage.join("\n") : "- none";
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

function latestUserMessageIndex(messages: ChatMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index]?.role === "user") {
      return index;
    }
  }

  return -1;
}

function buildDebugSnapshot(input: {
  systemPrompt: string;
  contextMessage: string;
  messages: ChatMessage[];
  sourceMessageCount: number;
  omittedMessageCount: number;
  materializedAt: string;
}): ContextDebugSnapshot {
  const activeUserIndex = latestUserMessageIndex(input.messages);
  const traceMessages = input.messages.map((message, index) => ({
    order: index + 3,
    kind: "trace_message" as const,
    role: message.role,
    label: message.role === "user" ? "Attempt trace: user prompt" : "Attempt trace: model response",
    content: message.content,
    activeInstruction: index === activeUserIndex,
    attachmentNames: message.attachments?.map((attachment) => attachment.name),
    sourceTraceEventId: message.sourceTraceEventId,
    branchId: message.branchId,
  }));

  return {
    materializedAt: input.materializedAt,
    sourceMessageCount: input.sourceMessageCount,
    providerMessageCount: traceMessages.length + 2,
    omittedMessageCount: input.omittedMessageCount,
    providerAdapterNote:
      "Provider adapters send this order: system prompt, SKAI background context as a user-role message, then the attempt trace. User attachments are appended to their trace message as normalized file context; image attachments may also be sent as multimodal image parts.",
    messages: [
      {
        order: 1,
        kind: "system_prompt",
        role: "system",
        label: "SKAI system prompt",
        content: input.systemPrompt,
      },
      {
        order: 2,
        kind: "skai_background",
        role: "user",
        label: "SKAI background context",
        content: input.contextMessage,
      },
      ...traceMessages,
    ],
  };
}

export function compileProviderContext(input: {
  problem: Problem;
  messages: ChatMessage[];
  branch?: AttemptBranch;
  now?: string;
}): CompiledContext {
  const { problem, branch } = input;
  const pruned = pruneMessages(input.messages);
  const materializedAt = input.now ?? new Date().toISOString();
  const pruningNotice =
    pruned.omitted > 0
      ? `The oldest ${pruned.omitted} trace messages were excluded from this runtime provider context because of request limits. The stored trace remains unchanged.`
      : "No trace messages were excluded from this runtime provider context.";
  const systemPrompt = [
    "You are the in-app assistant for SKAI, a platform for practicing AI orchestration.",
    "Help the user define unclear problems, decompose work, assign tasks, use materials, react to intermediate outputs, and verify final artifacts.",
    "The provider context you see is freshly materialized from SKAI's immutable trace. Do not assume hidden memory outside this request.",
    "Treat SKAI BACKGROUND CONTEXT as background only, not as the active user request.",
    "The latest user message in the attempt trace is the active instruction unless the user explicitly says otherwise.",
    "If branch replay metadata is present, treat the current trace as the executable branch path, not as a continuation of provider-side memory.",
    "Separate file evidence, user assumptions, model assumptions, and recommended next actions.",
  ].join(" ");
  const contextMessage = [
    "SKAI BACKGROUND CONTEXT",
    "This block is supplied by SKAI to explain the exercise, materials, constraints, and replay metadata.",
    "Do not answer this block directly. Use it only to interpret the attempt trace that follows.",
    "The next user message in the attempt trace is the active instruction.",
    `materialized_at: ${materializedAt}`,
    "",
    "Problem:",
    problem.statement,
    "",
    "User goal:",
    problem.userGoal,
    "",
    "Constraints:",
    list(problem.constraints),
    "",
    "Deliverables:",
    list(problem.deliverables),
    "",
    "Starter context:",
    list(problem.starterContext),
    "",
    "Available official materials:",
    materialCatalog(problem),
    "",
    "Branch replay:",
    branchContext(branch),
    "",
      "Trace lineage metadata:",
      lineageContext(pruned.messages),
      "",
      "Runtime context pruning:",
      pruningNotice,
      "",
      "END SKAI BACKGROUND CONTEXT. Respond to the latest user message in the attempt trace, not to this background block.",
    ].join("\n");
  const debugSnapshot = buildDebugSnapshot({
    systemPrompt,
    contextMessage,
    messages: pruned.messages,
    sourceMessageCount: input.messages.length,
    omittedMessageCount: pruned.omitted,
    materializedAt,
  });

  return {
    systemPrompt,
    contextMessage,
    messages: pruned.messages,
    debugSnapshot,
    metadata: {
      materializedAt,
      sourceMessageCount: input.messages.length,
      providerMessageCount: debugSnapshot.providerMessageCount,
      omittedMessageCount: pruned.omitted,
      branchId: branch?.id,
      parentAttemptId: branch?.parentAttemptId,
      parentTraceEventId: branch?.parentTraceEventId,
    },
  };
}
