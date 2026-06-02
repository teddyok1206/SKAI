import { NextResponse } from "next/server";
import { z } from "zod";
import { operationGuardrails } from "@/lib/constants";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const providerSchema = z.enum(["mock", "openai", "groq", "xai", "openrouter", "gemini"]);
const solvingModeSchema = z.enum(["single_model", "material_grounded", "verification_drill"]);

const attachmentSchema = z.object({
  id: z.string().min(1).max(120),
  name: z.string().min(1).max(180),
  mimeType: z.string().min(1).max(160),
  size: z.number().nonnegative().max(operationGuardrails.maxUploadBytes),
  source: z.enum(["problem_material", "upload"]),
  materialId: z.string().max(120).optional(),
  textContent: z.string().max(operationGuardrails.maxAttachmentTextChars + 128).optional(),
  dataUrl: z.string().max(operationGuardrails.maxAttachmentDataUrlChars).optional(),
  createdAt: z.string(),
});

const traceEventSchema = z.object({
  id: z.string().min(1).max(120),
  attemptId: z.string().min(1).max(120),
  problemId: z.string().min(1).max(120),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().max(operationGuardrails.maxMessageContentChars),
  summary: z.string().max(600).optional(),
  provider: providerSchema.optional(),
  model: z.string().max(operationGuardrails.maxModelNameChars).optional(),
  createdAt: z.string(),
  latencyMs: z.number().optional(),
  usageInputTokens: z.number().optional(),
  usageOutputTokens: z.number().optional(),
  estimatedCostUsd: z.number().optional(),
  attachments: z.array(attachmentSchema).max(operationGuardrails.maxAttachmentsPerMessage).optional(),
  sourceTraceEventId: z.string().min(1).max(120).optional(),
  branchId: z.string().min(1).max(120).optional(),
});

const branchSchema = z.object({
  id: z.string().min(1).max(120),
  mode: z.enum(["breakpoint_replay"]),
  parentAttemptId: z.string().min(1).max(120),
  parentTraceEventId: z.string().min(1).max(120),
  parentTraceIndex: z.number().int().nonnegative(),
  parentPairId: z.string().max(240).optional(),
  label: z.string().min(1).max(220),
  createdAt: z.string(),
});

const judgeRunSchema = z.object({
  id: z.string(),
  attemptId: z.string(),
  status: z.enum(["pending", "running", "succeeded", "failed", "cancelled"]),
  judgeProvider: providerSchema,
  judgeModel: z.string().max(operationGuardrails.maxModelNameChars),
  judgeKind: z.enum(["heuristic", "llm"]),
  rubricVersion: z.string(),
  latencyMs: z.number().optional(),
  totalScore: z.number().optional(),
  axisScores: z.array(z.unknown()).optional(),
  error: z.string().max(1000).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const scoreReportSchema = z.object({
  id: z.string(),
  attemptId: z.string(),
  problemId: z.string(),
  totalScore: z.number(),
  axisScores: z.array(z.unknown()).max(12),
  coachSummary: z.string().max(4000),
  strengths: z.array(z.string().max(1200)).max(8),
  improvements: z.array(z.string().max(1200)).max(8),
  bottlenecks: z.array(z.unknown()).max(12),
  workflow: z.array(z.unknown()).max(20),
  nextPracticeTargets: z.array(z.string().max(1200)).max(8),
  graphAnnotations: z.array(z.unknown()).max(160).optional(),
  judgeProvider: providerSchema,
  judgeModel: z.string().max(operationGuardrails.maxModelNameChars),
  judgeMode: z.enum(["heuristic", "llm", "ensemble"]).optional(),
  judgeRuns: z.array(judgeRunSchema).max(8).optional(),
  judgeDisagreement: z.array(z.string().max(1200)).max(8).optional(),
  createdAt: z.string(),
});

const problemSchema = z.object({
  id: z.string().min(1).max(120),
  title: z.string().min(1).max(220),
  subtitle: z.string().max(500),
  category: z.string(),
  difficulty: z.string(),
  goalProfile: z.string(),
  estimatedMinutes: z.number(),
  statement: z.string().max(8000),
  userGoal: z.string().max(4000),
  constraints: z.array(z.string().max(1200)).max(20),
  starterContext: z.array(z.string().max(1200)).max(20),
  deliverables: z.array(z.string().max(1200)).max(20),
  materials: z.array(z.unknown()).max(20),
  allowedProviders: z.array(providerSchema).max(8),
  rubric: z.array(z.unknown()).max(20),
  createdAt: z.string(),
});

const attemptSchema = z.object({
  id: z.string().min(1).max(120),
  problemId: z.string().min(1).max(120),
  userId: z.string().min(1).max(120),
  status: z.enum(["draft", "submitted", "judged", "published"]),
  title: z.string().min(1).max(220),
  provider: providerSchema,
  model: z.string().max(operationGuardrails.maxModelNameChars),
  solvingMode: solvingModeSchema.optional(),
  trace: z.array(traceEventSchema).max(operationGuardrails.maxTraceEventsPerJudge),
  finalAnswer: z.string().max(operationGuardrails.maxFinalAnswerChars).optional(),
  scoreReport: scoreReportSchema.optional(),
  branch: branchSchema.optional(),
  counterfactualReport: z.unknown().optional(),
  publishedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const syncSchema = z.object({
  problem: problemSchema,
  attempt: attemptSchema,
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = syncSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ mode: "local", synced: false, reason: "supabase_not_configured" });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ mode: "local", synced: false, reason: "not_authenticated" });
  }

  const { problem, attempt } = parsed.data;

  const problemResult = await supabase.from("problems").upsert({
    id: problem.id,
    title: problem.title,
    subtitle: problem.subtitle,
    category: problem.category,
    difficulty: problem.difficulty,
    goal_profile: problem.goalProfile,
    estimated_minutes: problem.estimatedMinutes,
    statement: problem.statement,
    user_goal: problem.userGoal,
    constraints: problem.constraints,
    starter_context: problem.starterContext,
    deliverables: problem.deliverables,
    materials: problem.materials,
    allowed_providers: problem.allowedProviders,
    rubric: problem.rubric,
    is_published: true,
    updated_at: new Date().toISOString(),
  });

  if (problemResult.error) {
    return NextResponse.json({ error: problemResult.error.message }, { status: 500 });
  }

  const attemptResult = await supabase.from("attempts").upsert({
    id: attempt.id,
    problem_id: attempt.problemId,
    user_id: user.id,
    status: attempt.status,
    title: attempt.title,
    provider: attempt.provider,
    model: attempt.model,
    final_answer: attempt.finalAnswer ?? null,
    branch_metadata: attempt.branch ?? null,
    counterfactual_report: attempt.counterfactualReport ?? null,
    published_at: attempt.publishedAt ?? null,
    created_at: attempt.createdAt,
    updated_at: attempt.updatedAt,
  });

  if (attemptResult.error) {
    return NextResponse.json({ error: attemptResult.error.message }, { status: 500 });
  }

  if (attempt.trace.length > 0) {
    const traceResult = await supabase.from("trace_events").upsert(
      attempt.trace.map((event) => ({
        id: event.id,
        attempt_id: attempt.id,
        problem_id: attempt.problemId,
        role: event.role,
        content: event.content,
        summary: event.summary ?? null,
        provider: event.provider ?? null,
        model: event.model ?? null,
        latency_ms: event.latencyMs ?? null,
        usage_input_tokens: event.usageInputTokens ?? null,
        usage_output_tokens: event.usageOutputTokens ?? null,
        estimated_cost_usd: event.estimatedCostUsd ?? null,
        attachments: event.attachments ?? [],
        source_trace_event_id: event.sourceTraceEventId ?? null,
        branch_id: event.branchId ?? null,
        created_at: event.createdAt,
      })),
    );

    if (traceResult.error) {
      return NextResponse.json({ error: traceResult.error.message }, { status: 500 });
    }
  }

  if (attempt.scoreReport) {
    const scoreReportPayload = {
      id: attempt.scoreReport.id,
      attempt_id: attempt.id,
      problem_id: attempt.problemId,
      total_score: attempt.scoreReport.totalScore,
      axis_scores: attempt.scoreReport.axisScores,
      coach_summary: attempt.scoreReport.coachSummary,
      strengths: attempt.scoreReport.strengths,
      improvements: attempt.scoreReport.improvements,
      bottlenecks: attempt.scoreReport.bottlenecks,
      workflow: attempt.scoreReport.workflow,
      next_practice_targets: attempt.scoreReport.nextPracticeTargets,
      graph_annotations: attempt.scoreReport.graphAnnotations ?? [],
      judge_provider: attempt.scoreReport.judgeProvider,
      judge_model: attempt.scoreReport.judgeModel,
      judge_mode: attempt.scoreReport.judgeMode ?? "heuristic",
      judge_runs: attempt.scoreReport.judgeRuns ?? [],
      judge_disagreement: attempt.scoreReport.judgeDisagreement ?? [],
      created_at: attempt.scoreReport.createdAt,
    };

    let scoreResult = await supabase.from("score_reports").upsert(scoreReportPayload);

    if (scoreResult.error && scoreResult.error.message.includes("graph_annotations")) {
      const { graph_annotations: graphAnnotations, ...fallbackScoreReportPayload } = scoreReportPayload;
      void graphAnnotations;
      scoreResult = await supabase.from("score_reports").upsert(fallbackScoreReportPayload);
    }

    if (scoreResult.error) {
      return NextResponse.json({ error: scoreResult.error.message }, { status: 500 });
    }

    if (attempt.scoreReport.judgeRuns && attempt.scoreReport.judgeRuns.length > 0) {
      const judgeRunResult = await supabase.from("judge_runs").upsert(
        attempt.scoreReport.judgeRuns.map((run) => ({
          id: run.id,
          attempt_id: attempt.id,
          status: run.status,
          judge_provider: run.judgeProvider,
          judge_model: run.judgeModel,
          rubric_version: run.rubricVersion,
          report: {
            judgeKind: run.judgeKind,
            latencyMs: run.latencyMs,
            totalScore: run.totalScore,
            axisScores: run.axisScores,
          },
          error: run.error ?? null,
          created_at: run.createdAt,
          updated_at: run.updatedAt,
        })),
      );

      if (judgeRunResult.error) {
        return NextResponse.json({ error: judgeRunResult.error.message }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ mode: "supabase", synced: true });
}
