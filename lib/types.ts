export type ProviderId = "mock" | "openai" | "groq" | "xai" | "openrouter" | "gemini";

export type ProblemGoalProfile =
  | "accuracy_first"
  | "speed_first"
  | "cost_constrained"
  | "workflow_adoption"
  | "learning_oriented"
  | "exploration";

export type ProblemCategory =
  | "workplace"
  | "research"
  | "creative"
  | "data_analysis"
  | "coding"
  | "strategy";

export type ScoreAxis =
  | "problem_definition"
  | "decomposition"
  | "instruction_clarity"
  | "adaptation"
  | "verification"
  | "efficiency"
  | "final_quality";

export type TraceRole = "user" | "assistant" | "system";

export type AttemptStatus = "draft" | "submitted" | "judged" | "published";

export type JudgeRunStatus = "pending" | "running" | "succeeded" | "failed" | "cancelled";

export type MaterialKind = "image" | "spreadsheet" | "csv" | "text" | "pdf" | "other";

export type AttemptBranchMode = "breakpoint_replay";

export interface ProblemMaterial {
  id: string;
  title: string;
  description: string;
  kind: MaterialKind;
  fileName: string;
  mimeType: string;
  href?: string;
  extractedText: string;
}

export interface AttemptAttachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  source: "problem_material" | "upload";
  materialId?: string;
  textContent?: string;
  dataUrl?: string;
  createdAt: string;
}

export interface RubricItem {
  axis: ScoreAxis;
  label: string;
  description: string;
  weight: number;
}

export interface Problem {
  id: string;
  title: string;
  subtitle: string;
  category: ProblemCategory;
  difficulty: "intro" | "standard" | "advanced";
  goalProfile: ProblemGoalProfile;
  estimatedMinutes: number;
  statement: string;
  userGoal: string;
  constraints: string[];
  starterContext: string[];
  deliverables: string[];
  materials: ProblemMaterial[];
  allowedProviders: ProviderId[];
  rubric: RubricItem[];
  createdAt: string;
}

export interface TraceEvent {
  id: string;
  attemptId: string;
  problemId: string;
  role: TraceRole;
  content: string;
  summary?: string;
  provider?: ProviderId;
  model?: string;
  createdAt: string;
  latencyMs?: number;
  usageInputTokens?: number;
  usageOutputTokens?: number;
  estimatedCostUsd?: number;
  attachments?: AttemptAttachment[];
  sourceTraceEventId?: string;
  branchId?: string;
}

export interface ModelRun {
  id: string;
  provider: ProviderId;
  model: string;
  latencyMs: number;
  usageInputTokens?: number;
  usageOutputTokens?: number;
  estimatedCostUsd?: number;
}

export interface ChatMessage {
  role: TraceRole;
  content: string;
  attachments?: AttemptAttachment[];
  sourceTraceEventId?: string;
  branchId?: string;
}

export interface Attempt {
  id: string;
  problemId: string;
  userId: string;
  status: AttemptStatus;
  title: string;
  provider: ProviderId;
  model: string;
  trace: TraceEvent[];
  finalAnswer?: string;
  scoreReport?: ScoreReport;
  branch?: AttemptBranch;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttemptBranch {
  id: string;
  mode: AttemptBranchMode;
  parentAttemptId: string;
  parentTraceEventId: string;
  parentTraceIndex: number;
  parentPairId?: string;
  label: string;
  createdAt: string;
}

export interface AxisScore {
  axis: ScoreAxis;
  label: string;
  score: number;
  rationale: string;
}

export interface Bottleneck {
  traceEventId?: string;
  label: string;
  severity: "low" | "medium" | "high";
  explanation: string;
  replaySuggestion: string;
}

export interface WorkflowStep {
  title: string;
  summary: string;
  relatedTraceEventIds: string[];
}

export type JudgeMode = "heuristic" | "llm" | "ensemble";

export interface JudgeRunSummary {
  id: string;
  attemptId: string;
  status: JudgeRunStatus;
  judgeProvider: ProviderId;
  judgeModel: string;
  judgeKind: "heuristic" | "llm";
  rubricVersion: string;
  latencyMs?: number;
  totalScore?: number;
  axisScores?: AxisScore[];
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScoreReport {
  id: string;
  attemptId: string;
  problemId: string;
  totalScore: number;
  axisScores: AxisScore[];
  coachSummary: string;
  strengths: string[];
  improvements: string[];
  bottlenecks: Bottleneck[];
  workflow: WorkflowStep[];
  nextPracticeTargets: string[];
  judgeProvider: ProviderId;
  judgeModel: string;
  judgeMode?: JudgeMode;
  judgeRuns?: JudgeRunSummary[];
  judgeDisagreement?: string[];
  createdAt: string;
}

export interface PublishedAttempt {
  id: string;
  attemptId: string;
  problemId: string;
  title: string;
  workflow: WorkflowStep[];
  trace: TraceEvent[];
  scoreReport: ScoreReport;
  branch?: AttemptBranch;
  createdAt: string;
}

export interface PromptComment {
  id: string;
  attemptId: string;
  traceEventId: string;
  parentId?: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export type ConversationGraphNodeKind = "prompt" | "response" | "task_status";
export type ConversationGraphProjection = "prompt_graph" | "response_graph" | "status_layer";
export type ConversationTaskStatus = "pending" | "responded" | "material_used" | "verification" | "bottleneck";

export interface ConversationGraphNode {
  id: string;
  kind: ConversationGraphNodeKind;
  traceEventId?: string;
  sourceTraceEventId?: string;
  branchId?: string;
  pairId?: string;
  label: string;
  summary: string;
  sequence: number;
  synthetic?: boolean;
}

export interface ConversationGraphEdge {
  id: string;
  projection: ConversationGraphProjection;
  sourceNodeId: string;
  targetNodeId: string;
  traceEventId?: string;
  pairId?: string;
  dualNodeId?: string;
  label: string;
  sequence: number;
}

export interface ConversationGraphPair {
  id: string;
  sequence: number;
  promptNodeId: string;
  responseNodeId?: string;
  statusNodeId: string;
  promptTraceEventId: string;
  responseTraceEventId?: string;
  status: ConversationTaskStatus;
  statusReasons: string[];
  isBreakpoint?: boolean;
}

export interface ConversationGraphIndex {
  promptNodeByTraceEventId: Record<string, string>;
  responseNodeByTraceEventId: Record<string, string>;
  pairByPromptTraceEventId: Record<string, string>;
  pairByResponseTraceEventId: Record<string, string>;
  adjacency: Record<string, string[]>;
  incidence: Record<string, { incoming: string[]; outgoing: string[] }>;
}

export interface ConversationGraphBranch {
  id: string;
  mode: AttemptBranchMode;
  parentAttemptId: string;
  parentTraceEventId: string;
  parentTraceIndex: number;
  parentPairId?: string;
  label: string;
  createdAt: string;
  breakpointTraceEventId?: string;
  breakpointNodeId?: string;
  breakpointPairId?: string;
  clonedTraceEventIds: Record<string, string>;
}

export interface ConversationGraph {
  attemptId: string;
  promptNodes: ConversationGraphNode[];
  responseNodes: ConversationGraphNode[];
  statusNodes: ConversationGraphNode[];
  promptEdges: ConversationGraphEdge[];
  responseEdges: ConversationGraphEdge[];
  statusEdges: ConversationGraphEdge[];
  pairs: ConversationGraphPair[];
  index: ConversationGraphIndex;
  branch?: ConversationGraphBranch;
}

export interface LeaderboardEntry {
  attemptId: string;
  problemId: string;
  displayName: string;
  totalScore: number;
  model: string;
  provider: ProviderId;
  createdAt: string;
}
