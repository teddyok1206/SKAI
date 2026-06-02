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

export type SolvingModeId = "single_model" | "material_grounded" | "verification_drill";

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
  solvingMode?: SolvingModeId;
  trace: TraceEvent[];
  finalAnswer?: string;
  scoreReport?: ScoreReport;
  branch?: AttemptBranch;
  counterfactualReport?: CounterfactualJudgeReport;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FounderReviewNote {
  attemptId: string;
  note: string;
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

export type ConversationGraphAnnotationTargetKind = "node" | "edge" | "pair";

export type ConversationGraphAnnotationKind =
  | "framing"
  | "decomposition"
  | "delegation"
  | "material_grounding"
  | "verification"
  | "adaptation"
  | "context_drift"
  | "bottleneck"
  | "recovery"
  | "finalization"
  | "model_behavior"
  | "cost_efficiency";

export type ConversationGraphAnnotationSeverity = "info" | "positive" | "watch" | "critical";

export type ConversationGraphAnnotationSource = "deterministic" | "heuristic_judge" | "llm_judge" | "human";

export interface ConversationGraphAnnotation {
  id: string;
  attemptId: string;
  graphSchemaVersion: string;
  targetKind: ConversationGraphAnnotationTargetKind;
  targetId: string;
  kind: ConversationGraphAnnotationKind;
  severity: ConversationGraphAnnotationSeverity;
  axis?: ScoreAxis;
  scoreImpact?: number;
  confidence: number;
  title: string;
  explanation: string;
  evidenceTraceEventIds: string[];
  source: ConversationGraphAnnotationSource;
  createdAt: string;
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
  graphAnnotations?: ConversationGraphAnnotation[];
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
  counterfactualReport?: CounterfactualJudgeReport;
  solvingMode?: SolvingModeId;
  createdAt: string;
}

export type CounterfactualVerdict = "improved" | "regressed" | "mixed" | "inconclusive";
export type CounterfactualJudgeMode = "heuristic" | "llm";
export type CounterfactualClaimEffect = "positive" | "negative" | "neutral" | "unknown";

export interface BranchPromptChange {
  beforeTraceEventId?: string;
  afterTraceEventId?: string;
  before?: string;
  after?: string;
  semanticDelta: string[];
}

export interface BranchResponseChange {
  beforeTraceEventId?: string;
  afterTraceEventId?: string;
  before?: string;
  after?: string;
  observedChange: string[];
}

export interface BranchProcessDelta {
  parentUserTurns: number;
  childUserTurns: number;
  turnDelta: number;
  parentTokenEstimate: number;
  childTokenEstimate: number;
  tokenDelta: number;
  parentAttachmentCount: number;
  childAttachmentCount: number;
  materialUseChanged: boolean;
  verificationMovedEarlier: boolean;
}

export interface BranchAxisDelta {
  axis: ScoreAxis;
  label: string;
  parentScore?: number;
  childScore?: number;
  delta?: number;
}

export interface BranchScoreDelta {
  parentTotalScore?: number;
  childTotalScore?: number;
  totalDelta?: number;
  axisDeltas: BranchAxisDelta[];
}

export interface GraphStateSnapshotAnnotation {
  id: string;
  kind: ConversationGraphAnnotationKind;
  severity: ConversationGraphAnnotationSeverity;
  title: string;
  source: ConversationGraphAnnotationSource;
  scoreImpact?: number;
  confidence: number;
}

export interface GraphStateSnapshot {
  attemptId: string;
  pairId?: string;
  promptNodeId?: string;
  statusNodeId?: string;
  responseNodeId?: string;
  promptTraceEventId?: string;
  responseTraceEventId?: string;
  status?: ConversationTaskStatus;
  statusReasons: string[];
  directedDegree: {
    incoming: number;
    outgoing: number;
  };
  annotationIds: string[];
  annotationKinds: ConversationGraphAnnotationKind[];
  annotations: GraphStateSnapshotAnnotation[];
  summary: string;
  missing?: boolean;
}

export interface GraphAnnotationDelta {
  added: GraphStateSnapshotAnnotation[];
  removed: GraphStateSnapshotAnnotation[];
  persisted: GraphStateSnapshotAnnotation[];
}

export interface GraphStateTransition {
  id: string;
  parentAttemptId: string;
  childAttemptId: string;
  breakpointTraceEventId: string;
  parentPairId?: string;
  childPairId?: string;
  before: GraphStateSnapshot;
  after: GraphStateSnapshot;
  annotationDelta: GraphAnnotationDelta;
  transitionLabels: string[];
  createdAt: string;
}

export interface BranchDiff {
  id: string;
  parentAttemptId: string;
  childAttemptId: string;
  breakpointTraceEventId: string;
  breakpointRole?: TraceRole;
  parentPairId?: string;
  childPairId?: string;
  promptChange?: BranchPromptChange;
  responseChange?: BranchResponseChange;
  processDelta: BranchProcessDelta;
  scoreDelta?: BranchScoreDelta;
  graphTransition?: GraphStateTransition;
  createdAt: string;
}

export interface CounterfactualCausalClaim {
  label: string;
  effect: CounterfactualClaimEffect;
  evidence: string;
}

export interface CounterfactualJudgeReport {
  id: string;
  parentAttemptId: string;
  childAttemptId: string;
  diffId: string;
  verdict: CounterfactualVerdict;
  confidence: number;
  judgeMode: CounterfactualJudgeMode;
  judgeProvider: ProviderId;
  judgeModel: string;
  summary: string;
  causalClaims: CounterfactualCausalClaim[];
  risks: string[];
  nextReplaySuggestion: string;
  branchDiff: BranchDiff;
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
  annotationIdsByTargetId: Record<string, string[]>;
  annotationIdsByTraceEventId: Record<string, string[]>;
  annotationIdsByKind: Record<string, string[]>;
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
  annotations: ConversationGraphAnnotation[];
  index: ConversationGraphIndex;
  branch?: ConversationGraphBranch;
}

export type GraphSkeletonStepRole =
  | "problem_reframe"
  | "clarifying_question"
  | "material_selection"
  | "task_decomposition"
  | "draft_generation"
  | "verification"
  | "revision"
  | "finalization"
  | "other";

export interface GraphSkeletonStep {
  id: string;
  pairId: string;
  sequence: number;
  role: GraphSkeletonStepRole;
  label: string;
  status: ConversationTaskStatus;
  summary: string;
  annotationIds: string[];
  annotationKinds: ConversationGraphAnnotationKind[];
  signals: string[];
  evidenceLabels: string[];
  expandableTraceEventIds: string[];
  promptTraceEventId: string;
  responseTraceEventId?: string;
  isBreakpoint?: boolean;
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
