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
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
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

