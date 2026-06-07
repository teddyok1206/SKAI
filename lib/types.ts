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

export type ReportLocale = "ko" | "en";
export type TranslationStatus = "source" | "translated" | "draft" | "stale";

export interface DerivedMaterialText {
  locale: ReportLocale;
  sourceLocale: ReportLocale;
  translationStatus: TranslationStatus;
  title?: string;
  description?: string;
  extractedText?: string;
  createdAt?: string;
}

export interface ProblemMaterial {
  id: string;
  title: string;
  description: string;
  kind: MaterialKind;
  fileName: string;
  mimeType: string;
  href?: string;
  extractedText: string;
  sourceLocale?: ReportLocale;
  derivedText?: DerivedMaterialText[];
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

export interface LocalizedProblemContent {
  locale: ReportLocale;
  sourceLocale: ReportLocale;
  translationStatus: TranslationStatus;
  title?: string;
  subtitle?: string;
  statement?: string;
  userGoal?: string;
  constraints?: string[];
  starterContext?: string[];
  deliverables?: string[];
  createdAt?: string;
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
  locale?: ReportLocale;
  availableLocales?: ReportLocale[];
  localized?: Partial<Record<ReportLocale, LocalizedProblemContent>>;
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
  requestStartedAt?: string;
  firstTokenAt?: string;
  completedAt?: string;
  timeToFirstTokenMs?: number;
  tokensPerSecond?: number;
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
  requestStartedAt?: string;
  firstTokenAt?: string;
  completedAt?: string;
  timeToFirstTokenMs?: number;
  tokensPerSecond?: number;
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
  calibrationLabel?: FounderCalibrationLabel;
  updatedAt: string;
}

export type FounderCalibrationVerdict = "judge_ok" | "too_harsh" | "too_generous" | "missed_bottleneck" | "needs_review";

export interface FounderCalibrationLabel {
  verdict: FounderCalibrationVerdict;
  expectedScore?: number;
  axisFocus?: ScoreAxis;
  note?: string;
  updatedAt: string;
}

export interface GeneratedProblemEditorialChecklist {
  antiOneShot: boolean;
  materialCrossReference: boolean;
  extractedTextUsable: boolean;
  domainAccessible: boolean;
}

export interface GeneratedProblemEditorialState {
  problemId: string;
  isPublished: boolean;
  checklist: GeneratedProblemEditorialChecklist;
  note?: string;
  updatedAt: string;
}

export interface FounderCohortAttempt {
  id: string;
  problemId: string;
  title: string;
  status: AttemptStatus;
  provider: ProviderId;
  model: string;
  solvingMode?: SolvingModeId;
  userId?: string;
  totalScore?: number;
  judgeMode?: JudgeMode;
  traceEventCount: number;
  userPromptCount: number;
  assistantResponseCount: number;
  totalEstimatedCostUsd: number;
  publishedAttemptId?: string;
  isBranch: boolean;
  branchParentTraceIndex?: number;
  createdAt: string;
  updatedAt: string;
}

export interface FounderCohortSnapshot {
  mode: "local" | "supabase_user" | "supabase_admin";
  reason?: string;
  attempts: FounderCohortAttempt[];
  summary: {
    attempts: number;
    judged: number;
    published: number;
    branches: number;
    totalEstimatedCostUsd: number;
  };
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
  confidence?: number;
  evidenceIds?: string[];
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

export type JudgeEvidenceSignalKind =
  | "explicit_goal"
  | "constraints"
  | "deliverable_contract"
  | "decomposition"
  | "material_instruction"
  | "material_cross_reference"
  | "claim_source_linkage"
  | "context_boundary"
  | "harness_fit"
  | "branch_topology"
  | "verification"
  | "assumption_separation"
  | "human_decision_boundary"
  | "adaptation_reference"
  | "branch_replay"
  | "final_answer_coverage"
  | "repeated_context_burden";

export type JudgeEvidenceItemKind = "positive" | "gap" | "risk" | "metric";
export type JudgeEvidenceTargetKind = "attempt" | "trace_event" | "pair" | "node" | "edge" | "material";

export interface JudgeMaterialCoverage {
  materialId: string;
  title: string;
  fileName: string;
  kind: MaterialKind;
  attachedTraceEventIds: string[];
  referencedTraceEventIds: string[];
  instructionTraceEventIds: string[];
  status: "unused" | "referenced" | "attached" | "instructed";
}

export interface JudgeGraphSignal {
  id: string;
  label: string;
  value: number | string;
  targetIds: string[];
}

export type JudgeDerivedSignalStatus = "strong" | "partial" | "weak" | "absent" | "not_applicable" | "risky";

export interface JudgeDerivedSignal {
  status: JudgeDerivedSignalStatus;
  materialIds?: string[];
  pairIds?: string[];
  traceEventIds: string[];
  confidence: number;
  summary: string;
}

export interface JudgeDerivedSignals {
  materialCrossReference: JudgeDerivedSignal;
  claimSourceLinkage: JudgeDerivedSignal;
  contextBoundary: JudgeDerivedSignal;
  harnessFit: JudgeDerivedSignal;
  branchTopology: JudgeDerivedSignal;
}

export interface JudgeEvidenceItem {
  id: string;
  kind: JudgeEvidenceItemKind;
  signal: JudgeEvidenceSignalKind;
  axis?: ScoreAxis;
  targetKind: JudgeEvidenceTargetKind;
  targetId: string;
  evidenceTraceEventIds: string[];
  confidence: number;
  summary: string;
}

export interface JudgeEvidencePacket {
  schemaVersion: "skai.judge.evidence.v1";
  attemptId: string;
  problemId: string;
  generatedAt: string;
  counts: {
    turnCount: number;
    userTurnCount: number;
    assistantTurnCount: number;
    promptPairCount: number;
    attachmentCount: number;
    requiredMaterialCount: number;
    attachedRequiredMaterialCount: number;
  };
  signals: {
    hasExplicitGoal: boolean;
    hasConstraints: boolean;
    hasDeliverableContract: boolean;
    hasDecomposition: boolean;
    hasMaterialInstruction: boolean;
    hasVerification: boolean;
    hasAssumptionSeparation: boolean;
    hasHumanDecisionBoundary: boolean;
    hasAdaptationReference: boolean;
    branchReplayUsed: boolean;
    finalAnswerCoverage: number;
    repeatedContextBurden: number;
  };
  derivedSignals?: JudgeDerivedSignals;
  materialCoverage: JudgeMaterialCoverage[];
  graphSignals: JudgeGraphSignal[];
  evidenceItems: JudgeEvidenceItem[];
  warnings: string[];
}

export type ConversationGraphAnnotationTargetKind = "node" | "edge" | "pair";

export type ConversationGraphAnnotationKind =
  | "framing"
  | "decomposition"
  | "delegation"
  | "material_grounding"
  | "security_boundary"
  | "harness_fit"
  | "branch_topology"
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

export type GraphOverlaySeverity = "neutral" | "positive" | "watch" | "critical";

export type GraphOverlayLayer =
  | "bottleneck"
  | "weakEdge"
  | "review"
  | "verification"
  | "materialGrounding"
  | "contextBoundary"
  | "harnessFit"
  | "branchTopology"
  | "recovery"
  | "modelBehavior"
  | "costEfficiency";

export type GraphOverlaySignal =
  | "bottleneck_node"
  | "weak_edge"
  | "human_review"
  | "recovery"
  | "verification"
  | "material_grounding"
  | "context_boundary"
  | "harness_fit"
  | "branch_topology"
  | "model_drift"
  | "cost_anomaly"
  | "neutral";

export interface GraphOverlayTarget {
  id: string;
  targetKind: ConversationGraphAnnotationTargetKind;
  targetId: string;
  layer: GraphOverlayLayer;
  pairId?: string;
  sequence?: number;
  edgeId?: string;
  severity: GraphOverlaySeverity;
  signal: GraphOverlaySignal;
  annotationIds: string[];
  source: ConversationGraphAnnotationSource;
  confidence: number;
  label: string;
  explanation: string;
}

export interface GraphOverlaySummary {
  severity: GraphOverlaySeverity;
  layers: GraphOverlayLayer[];
  signals: GraphOverlaySignal[];
  targetIds: string[];
  annotationIds: string[];
  label: string;
  confidence: number;
}

export interface GraphOverlayIndex {
  schemaVersion: string;
  targetsById: Record<string, GraphOverlayTarget>;
  targetIdsByGraphTargetId: Record<string, string[]>;
  targetIdsByPairId: Record<string, string[]>;
  targetIdsBySequence: Record<number, string[]>;
  targetIdsByLayer: Record<GraphOverlayLayer, string[]>;
  targetIdsByEdgeId: Record<string, string[]>;
  summaryByNodeId: Record<string, GraphOverlaySummary>;
  summaryByEdgeId: Record<string, GraphOverlaySummary>;
  summaryByPairId: Record<string, GraphOverlaySummary>;
}

export interface GraphOverlayControls {
  enabled: boolean;
  layers: Record<GraphOverlayLayer, boolean>;
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
  judgePromptVersion?: string;
  rubricVersion?: string;
  confidence?: number;
  needsHumanReview?: boolean;
  uncertaintyNotes?: string[];
  judgeRuns?: JudgeRunSummary[];
  judgeDisagreement?: string[];
  locale?: ReportLocale;
  sourceLocale?: ReportLocale;
  translationStatus?: TranslationStatus;
  createdAt: string;
}

export interface PublishedAttempt {
  id: string;
  attemptId: string;
  problemId: string;
  title: string;
  workflow: WorkflowStep[];
  trace: TraceEvent[];
  scoreReport?: ScoreReport;
  branch?: AttemptBranch;
  counterfactualReport?: CounterfactualJudgeReport;
  solvingMode?: SolvingModeId;
  skaiFile?: SkaiFileArtifact;
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
  updatedAt?: string;
  deletedAt?: string;
  reportCount?: number;
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

export type SkaiFileSchemaVersion = "skai.file.v1";
export type SkaiFileFormat = "SKAI";
export type SkaiFileExtension = ".skai";

export interface SkaiFilePrivacyPolicy {
  rawTrace: "included";
  contextDebug: "stripped";
  attachmentBinary: "omitted";
  attachmentText: "included_when_public";
}

export interface SkaiFileSource {
  platform: string;
  conversationId: string;
  exportedFrom: "skai-web";
  primaryProvider?: ProviderId;
  primaryModel?: string;
}

export interface SkaiFileManifest {
  artifactId: string;
  title: string;
  problemId: string;
  attemptId: string;
  parentAttemptId?: string;
  source: SkaiFileSource;
  createdAt: string;
  exportedBy: "skai";
  schemaVersion: SkaiFileSchemaVersion;
  locale?: ReportLocale;
  availableLocales?: ReportLocale[];
  sections: string[];
  privacy: SkaiFilePrivacyPolicy;
}

export interface SkaiFileProblemSnapshot {
  id: string;
  title: string;
  locale?: ReportLocale;
  sourceLocale?: ReportLocale;
  translationStatus?: TranslationStatus;
  availableLocales?: ReportLocale[];
  category: ProblemCategory;
  difficulty: Problem["difficulty"];
  goalProfile: ProblemGoalProfile;
  estimatedMinutes: number;
  constraints: string[];
  deliverables: string[];
  materials: Array<{
    id: string;
    title: string;
    kind: MaterialKind;
    fileName: string;
    mimeType: string;
    extractedTextHash: string;
    href?: string;
    sourceLocale?: ReportLocale;
  }>;
}

export interface SkaiFileAttemptSnapshot {
  id: string;
  attemptId: string;
  problemId: string;
  title: string;
  trace: TraceEvent[];
  branch?: AttemptBranch;
  solvingMode?: SolvingModeId;
  createdAt: string;
}

export interface SkaiFileGraphSnapshot {
  child: ConversationGraph;
  parent?: ConversationGraph;
}

export interface SkaiFileBranchSnapshot {
  parentAttemptId: string;
  childAttemptId: string;
  breakpointTraceEventId: string;
  breakpointTraceIndex: number;
  breakpointPairId?: string;
  parentTrace: TraceEvent[];
  childTrace: TraceEvent[];
}

export interface SkaiFilePayload {
  problem?: SkaiFileProblemSnapshot;
  attempt: SkaiFileAttemptSnapshot;
  graph: SkaiFileGraphSnapshot;
  branch?: SkaiFileBranchSnapshot;
}

export interface SkaiFileIntegrity {
  algorithm: "sha256";
  canonicalization: "stable-json-v1";
  sectionHashes: Record<string, string>;
  artifactHash: string;
}

export interface SkaiFileArtifact {
  format: SkaiFileFormat;
  schemaVersion: SkaiFileSchemaVersion;
  mimeType: "application/vnd.skai+json";
  extension: SkaiFileExtension;
  createdAt: string;
  manifest: SkaiFileManifest;
  payload: SkaiFilePayload;
  extensions?: Record<string, unknown>;
  integrity: SkaiFileIntegrity;
}

export type SkaiExtensionSchemaVersion = "skai.judge.v1" | "skai.coach.v1";
export type SkaiExtensionTargetKind = ConversationGraphAnnotationTargetKind | "trace_event" | "attempt";
export type SkaiExtensionGeneratorKind = "deterministic_fixture" | "heuristic" | "llm" | "human";

export interface SkaiExtensionTarget {
  targetKind: SkaiExtensionTargetKind;
  targetId: string;
  pairId?: string;
  traceEventIds?: string[];
}

export interface SkaiExtensionBase {
  schemaVersion: SkaiExtensionSchemaVersion;
  extensionVersion: string;
  artifactHash: string;
  inputGraphHash: string;
  locale?: ReportLocale;
  sourceLocale?: ReportLocale;
  translationStatus?: TranslationStatus;
  createdAt: string;
  generator: {
    kind: SkaiExtensionGeneratorKind;
    provider?: ProviderId;
    model?: string;
    promptVersion?: string;
  };
}

export interface SkaiJudgeFinding {
  id: string;
  target: SkaiExtensionTarget;
  kind?: "strength" | "bottleneck" | "risk" | "missed_opportunity";
  axis?: ScoreAxis;
  severity: ConversationGraphAnnotationSeverity;
  confidence: number;
  evidenceIds?: string[];
  title: string;
  explanation: string;
  suggestedAction?: string;
}

export interface SkaiJudgeExtensionV1 extends SkaiExtensionBase {
  schemaVersion: "skai.judge.v1";
  rubricVersion: string;
  totalScore?: number;
  axisScores: AxisScore[];
  findings: SkaiJudgeFinding[];
  needsHumanReview: boolean;
}

export interface SkaiCoachComment {
  id: string;
  target: SkaiExtensionTarget;
  tone: "mirror" | "correction" | "practice";
  title: string;
  body: string;
  nextAction?: string;
}

export interface SkaiCoachExtensionV1 extends SkaiExtensionBase {
  schemaVersion: "skai.coach.v1";
  coachingVersion: string;
  summary: string;
  comments: SkaiCoachComment[];
  nextPracticeTargets: string[];
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
