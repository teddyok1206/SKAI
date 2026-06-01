import { buildConversationGraph } from "@/lib/conversation-graph";
import type { Attempt, AttemptBranch, TraceEvent, TraceRole } from "@/lib/types";

type IdFactory = () => string;

function defaultIdFactory() {
  return crypto.randomUUID();
}

function pairForBreakpoint(attempt: Attempt, traceEvent: TraceEvent) {
  const graph = buildConversationGraph(attempt.trace, attempt.scoreReport);

  if (traceEvent.role === "user") {
    return graph.index.pairByPromptTraceEventId[traceEvent.id];
  }

  if (traceEvent.role === "assistant") {
    return graph.index.pairByResponseTraceEventId[traceEvent.id];
  }

  return undefined;
}

export function createBreakpointReplayAttempt(input: {
  attempt: Attempt;
  traceIndex: number;
  createId?: IdFactory;
  now?: string;
}): Attempt {
  const { attempt, traceIndex } = input;
  const createId = input.createId ?? defaultIdFactory;
  const breakpoint = attempt.trace[traceIndex];

  if (!breakpoint) {
    throw new Error("Cannot create branch: breakpoint trace event does not exist.");
  }

  const now = input.now ?? new Date().toISOString();
  const childAttemptId = createId();
  const branchId = createId();
  const shouldStopBeforeBreakpoint = breakpoint.role === "user";
  const branch: AttemptBranch = {
    id: branchId,
    mode: "breakpoint_replay",
    parentAttemptId: attempt.id,
    parentTraceEventId: breakpoint.id,
    parentTraceIndex: traceIndex,
    parentPairId: pairForBreakpoint(attempt, breakpoint),
    label: `Replay from ${breakpoint.role} ${traceIndex + 1}`,
    createdAt: now,
  };

  const traceEnd = shouldStopBeforeBreakpoint ? traceIndex : traceIndex + 1;
  const trace = attempt.trace.slice(0, traceEnd).map((event) => ({
    ...event,
    id: createId(),
    attemptId: childAttemptId,
    sourceTraceEventId: event.id,
    branchId,
  }));

  return {
    ...attempt,
    id: childAttemptId,
    status: "draft",
    title: `${attempt.title} / ${branch.label}`,
    trace,
    finalAnswer: undefined,
    scoreReport: undefined,
    branch,
    publishedAt: undefined,
    createdAt: now,
    updatedAt: now,
  };
}

export function sourceTraceEventIdForNextBranchEvent(attempt: Attempt, role: TraceRole) {
  if (!attempt.branch || role !== "user") {
    return undefined;
  }

  const breakpointAlreadyRepresented = attempt.trace.some(
    (event) => event.sourceTraceEventId === attempt.branch?.parentTraceEventId,
  );

  return breakpointAlreadyRepresented ? undefined : attempt.branch.parentTraceEventId;
}
