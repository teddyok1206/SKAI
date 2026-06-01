import { buildConversationGraph } from "@/lib/conversation-graph";
import type {
  Attempt,
  BranchDiff,
  BranchProcessDelta,
  BranchPromptChange,
  BranchResponseChange,
  BranchScoreDelta,
  ScoreAxis,
  TraceEvent,
} from "@/lib/types";

const signalDefinitions = [
  { label: "goal", keywords: ["목표", "성공", "원하는", "해야", "해결", "goal"] },
  { label: "constraint", keywords: ["제약", "조건", "반드시", "하지마", "금지", "constraint"] },
  { label: "material", keywords: ["자료", "파일", "영수증", "xlsx", "csv", "이미지", "첨부", "material"] },
  { label: "decomposition", keywords: ["단계", "task", "태스크", "분해", "쪼개", "workflow", "순서"] },
  { label: "output", keywords: ["출력", "형식", "표", "json", "목록", "양식", "format"] },
  { label: "verification", keywords: ["검증", "확인", "근거", "출처", "오류", "한계", "반례"] },
  { label: "efficiency", keywords: ["비용", "토큰", "시간", "간결", "우선순위", "효율"] },
] as const;

function compact(value = "", limit = 320) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= limit) {
    return normalized;
  }

  return `${normalized.slice(0, limit - 3)}...`;
}

function eventTokens(trace: TraceEvent[]) {
  const explicit = trace.reduce((sum, event) => sum + (event.usageInputTokens ?? 0) + (event.usageOutputTokens ?? 0), 0);

  if (explicit > 0) {
    return explicit;
  }

  return Math.ceil(trace.reduce((sum, event) => sum + event.content.length, 0) / 4);
}

function attachmentCount(trace: TraceEvent[]) {
  return trace.reduce((sum, event) => sum + (event.attachments?.length ?? 0), 0);
}

function userTurns(trace: TraceEvent[]) {
  return trace.filter((event) => event.role === "user").length;
}

function signals(value = "") {
  const normalized = value.toLowerCase();
  return signalDefinitions
    .filter((signal) => signal.keywords.some((keyword) => normalized.includes(keyword.toLowerCase())))
    .map((signal) => signal.label);
}

function firstVerificationIndex(trace: TraceEvent[]) {
  return trace.findIndex((event) => event.role === "user" && signals(event.content).includes("verification"));
}

function firstAfter(trace: TraceEvent[], startIndex: number, role: TraceEvent["role"]) {
  return trace.slice(startIndex + 1).find((event) => event.role === role);
}

function firstAssistantReply(trace: TraceEvent[], prompt?: TraceEvent) {
  const promptIndex = indexOfEvent(trace, prompt);

  if (promptIndex < 0) {
    return undefined;
  }

  for (const event of trace.slice(promptIndex + 1)) {
    if (event.role === "user") {
      return undefined;
    }

    if (event.role === "assistant") {
      return event;
    }
  }

  return undefined;
}

function indexOfEvent(trace: TraceEvent[], event?: TraceEvent) {
  if (!event) {
    return -1;
  }

  return trace.findIndex((item) => item.id === event.id);
}

function semanticDelta(before?: string, after?: string) {
  const beforeSignals = new Set(signals(before));
  const afterSignals = new Set(signals(after));
  const added = [...afterSignals].filter((signal) => !beforeSignals.has(signal));
  const removed = [...beforeSignals].filter((signal) => !afterSignals.has(signal));
  const notes: string[] = [];

  notes.push(...added.map((signal) => `added ${signal} signal`));
  notes.push(...removed.map((signal) => `removed ${signal} signal`));

  if ((after?.length ?? 0) > (before?.length ?? 0) * 1.25 + 40) {
    notes.push("replacement prompt is materially more specific");
  }

  if ((after?.length ?? 0) + 40 < (before?.length ?? 0) * 0.75) {
    notes.push("replacement prompt is materially shorter");
  }

  return notes.length > 0 ? notes : ["no strong deterministic prompt signal change"];
}

function observedResponseChange(before?: string, after?: string) {
  const notes: string[] = [];
  const beforeSignals = new Set(signals(before));
  const afterSignals = new Set(signals(after));

  if ([...afterSignals].some((signal) => !beforeSignals.has(signal))) {
    notes.push("child response introduced new orchestration signals");
  }

  if ((after?.length ?? 0) > (before?.length ?? 0) * 1.2 + 80) {
    notes.push("child response is more developed");
  }

  if ((after?.length ?? 0) + 80 < (before?.length ?? 0) * 0.8) {
    notes.push("child response is more concise");
  }

  return notes.length > 0 ? notes : ["no strong deterministic response signal change"];
}

function buildProcessDelta(parentAttempt: Attempt, childAttempt: Attempt): BranchProcessDelta {
  const parentVerificationIndex = firstVerificationIndex(parentAttempt.trace);
  const childVerificationIndex = firstVerificationIndex(childAttempt.trace);
  const parentAttachmentCount = attachmentCount(parentAttempt.trace);
  const childAttachmentCount = attachmentCount(childAttempt.trace);
  const parentTokenEstimate = eventTokens(parentAttempt.trace);
  const childTokenEstimate = eventTokens(childAttempt.trace);
  const parentUserTurns = userTurns(parentAttempt.trace);
  const childUserTurns = userTurns(childAttempt.trace);

  return {
    parentUserTurns,
    childUserTurns,
    turnDelta: childUserTurns - parentUserTurns,
    parentTokenEstimate,
    childTokenEstimate,
    tokenDelta: childTokenEstimate - parentTokenEstimate,
    parentAttachmentCount,
    childAttachmentCount,
    materialUseChanged: parentAttachmentCount !== childAttachmentCount,
    verificationMovedEarlier:
      childVerificationIndex >= 0 && (parentVerificationIndex < 0 || childVerificationIndex <= parentVerificationIndex),
  };
}

function buildScoreDelta(parentAttempt: Attempt, childAttempt: Attempt): BranchScoreDelta | undefined {
  if (!parentAttempt.scoreReport && !childAttempt.scoreReport) {
    return undefined;
  }

  const axes = new Map<ScoreAxis, { label: string; parentScore?: number; childScore?: number }>();

  for (const score of parentAttempt.scoreReport?.axisScores ?? []) {
    axes.set(score.axis, { label: score.label, parentScore: score.score });
  }

  for (const score of childAttempt.scoreReport?.axisScores ?? []) {
    const existing = axes.get(score.axis);
    axes.set(score.axis, {
      label: existing?.label ?? score.label,
      parentScore: existing?.parentScore,
      childScore: score.score,
    });
  }

  return {
    parentTotalScore: parentAttempt.scoreReport?.totalScore,
    childTotalScore: childAttempt.scoreReport?.totalScore,
    totalDelta:
      parentAttempt.scoreReport && childAttempt.scoreReport
        ? childAttempt.scoreReport.totalScore - parentAttempt.scoreReport.totalScore
        : undefined,
    axisDeltas: [...axes.entries()].map(([axis, value]) => ({
      axis,
      label: value.label,
      parentScore: value.parentScore,
      childScore: value.childScore,
      delta:
        typeof value.parentScore === "number" && typeof value.childScore === "number"
          ? value.childScore - value.parentScore
          : undefined,
    })),
  };
}

function tracePair(parentAttempt: Attempt, childAttempt: Attempt) {
  const branch = childAttempt.branch;

  if (!branch) {
    throw new Error("Child attempt does not contain branch metadata.");
  }

  const parentBreakpointIndex = parentAttempt.trace.findIndex((event) => event.id === branch.parentTraceEventId);
  const parentBreakpoint = parentAttempt.trace[parentBreakpointIndex];

  if (!parentBreakpoint) {
    throw new Error("Parent breakpoint trace event was not found.");
  }

  if (parentBreakpoint.role === "user") {
    const childReplacement = childAttempt.trace.find((event) => event.sourceTraceEventId === parentBreakpoint.id);
    const parentResponse = firstAssistantReply(parentAttempt.trace, parentBreakpoint);
    const childResponse = firstAssistantReply(childAttempt.trace, childReplacement);

    return {
      parentBreakpoint,
      parentPrompt: parentBreakpoint,
      childPrompt: childReplacement,
      parentResponse,
      childResponse,
    };
  }

  const parentNextPrompt = firstAfter(parentAttempt.trace, parentBreakpointIndex, "user");
  const copiedBreakpoint = childAttempt.trace.find((event) => event.sourceTraceEventId === parentBreakpoint.id);
  const childNextPrompt = copiedBreakpoint
    ? firstAfter(childAttempt.trace, indexOfEvent(childAttempt.trace, copiedBreakpoint), "user")
    : undefined;
  const parentResponse = firstAssistantReply(parentAttempt.trace, parentNextPrompt);
  const childResponse = firstAssistantReply(childAttempt.trace, childNextPrompt);

  return {
    parentBreakpoint,
    parentPrompt: parentNextPrompt,
    childPrompt: childNextPrompt,
    parentResponse,
    childResponse,
  };
}

function buildPromptChange(parentPrompt?: TraceEvent, childPrompt?: TraceEvent): BranchPromptChange | undefined {
  if (!parentPrompt && !childPrompt) {
    return undefined;
  }

  return {
    beforeTraceEventId: parentPrompt?.id,
    afterTraceEventId: childPrompt?.id,
    before: compact(parentPrompt?.content),
    after: compact(childPrompt?.content),
    semanticDelta: semanticDelta(parentPrompt?.content, childPrompt?.content),
  };
}

function buildResponseChange(parentResponse?: TraceEvent, childResponse?: TraceEvent): BranchResponseChange | undefined {
  if (!parentResponse && !childResponse) {
    return undefined;
  }

  return {
    beforeTraceEventId: parentResponse?.id,
    afterTraceEventId: childResponse?.id,
    before: compact(parentResponse?.content),
    after: compact(childResponse?.content),
    observedChange: observedResponseChange(parentResponse?.content, childResponse?.content),
  };
}

export function buildBranchDiff(parentAttempt: Attempt, childAttempt: Attempt): BranchDiff {
  const branch = childAttempt.branch;

  if (!branch) {
    throw new Error("Child attempt does not contain branch metadata.");
  }

  const pair = tracePair(parentAttempt, childAttempt);
  const childGraph = buildConversationGraph(childAttempt.trace, childAttempt.scoreReport, childAttempt.branch);

  return {
    id: crypto.randomUUID(),
    parentAttemptId: parentAttempt.id,
    childAttemptId: childAttempt.id,
    breakpointTraceEventId: branch.parentTraceEventId,
    breakpointRole: pair.parentBreakpoint.role,
    parentPairId: branch.parentPairId,
    childPairId: childGraph.branch?.breakpointPairId,
    promptChange: buildPromptChange(pair.parentPrompt, pair.childPrompt),
    responseChange: buildResponseChange(pair.parentResponse, pair.childResponse),
    processDelta: buildProcessDelta(parentAttempt, childAttempt),
    scoreDelta: buildScoreDelta(parentAttempt, childAttempt),
    createdAt: new Date().toISOString(),
  };
}
