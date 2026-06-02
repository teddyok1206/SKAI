import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type {
  AttemptStatus,
  FounderCohortAttempt,
  FounderCohortSnapshot,
  JudgeMode,
  ProviderId,
  SolvingModeId,
} from "@/lib/types";

type AttemptRow = {
  id: string;
  problem_id: string;
  user_id?: string | null;
  status: string;
  title: string;
  provider: string;
  model: string;
  solving_mode?: string | null;
  branch_metadata?: { parentTraceIndex?: number } | null;
  created_at: string;
  updated_at: string;
};

type ScoreRow = {
  attempt_id: string;
  total_score: number;
  judge_mode?: string | null;
};

type TraceRow = {
  attempt_id: string;
  role: string;
  estimated_cost_usd?: number | string | null;
};

type PublishedRow = {
  id: string;
  attempt_id: string;
};

const providerIds = ["mock", "openai", "groq", "xai", "openrouter", "gemini"] as const;
const attemptStatuses = ["draft", "submitted", "judged", "published"] as const;
const solvingModes = ["single_model", "material_grounded", "verification_drill"] as const;
const judgeModes = ["heuristic", "llm", "ensemble"] as const;

function founderEmails() {
  return (process.env.SKAI_FOUNDER_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function isProviderId(value: string): value is ProviderId {
  return providerIds.includes(value as ProviderId);
}

function isAttemptStatus(value: string): value is AttemptStatus {
  return attemptStatuses.includes(value as AttemptStatus);
}

function isSolvingMode(value: string | null | undefined): value is SolvingModeId {
  return Boolean(value && solvingModes.includes(value as SolvingModeId));
}

function isJudgeMode(value: string | null | undefined): value is JudgeMode {
  return Boolean(value && judgeModes.includes(value as JudgeMode));
}

function usd(value: TraceRow["estimated_cost_usd"]) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return Number(value) || 0;
  }

  return 0;
}

function summarize(attempts: FounderCohortAttempt[]): FounderCohortSnapshot["summary"] {
  return {
    attempts: attempts.length,
    judged: attempts.filter((attempt) => typeof attempt.totalScore === "number").length,
    published: attempts.filter((attempt) => attempt.publishedAttemptId).length,
    branches: attempts.filter((attempt) => attempt.isBranch).length,
    totalEstimatedCostUsd: attempts.reduce((sum, attempt) => sum + attempt.totalEstimatedCostUsd, 0),
  };
}

async function buildSnapshot(input: {
  client: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;
  mode: FounderCohortSnapshot["mode"];
}): Promise<FounderCohortSnapshot> {
  const { client, mode } = input;
  const attemptsResult = await client
    .from("attempts")
    .select("id,problem_id,user_id,status,title,provider,model,solving_mode,branch_metadata,created_at,updated_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (attemptsResult.error) {
    return {
      mode,
      reason: attemptsResult.error.message,
      attempts: [],
      summary: summarize([]),
    };
  }

  const attempts = (attemptsResult.data ?? []) as AttemptRow[];
  const attemptIds = attempts.map((attempt) => attempt.id);

  if (attemptIds.length === 0) {
    return {
      mode,
      attempts: [],
      summary: summarize([]),
    };
  }

  const [scoreResult, traceResult, publishedResult] = await Promise.all([
    client.from("score_reports").select("attempt_id,total_score,judge_mode").in("attempt_id", attemptIds),
    client.from("trace_events").select("attempt_id,role,estimated_cost_usd").in("attempt_id", attemptIds),
    client.from("published_attempts").select("id,attempt_id").in("attempt_id", attemptIds),
  ]);

  const scores = new Map((scoreResult.data as ScoreRow[] | null)?.map((score) => [score.attempt_id, score]) ?? []);
  const published = new Map((publishedResult.data as PublishedRow[] | null)?.map((item) => [item.attempt_id, item]) ?? []);
  const traceRows = (traceResult.data as TraceRow[] | null) ?? [];
  const traceByAttempt = new Map<string, TraceRow[]>();

  for (const row of traceRows) {
    traceByAttempt.set(row.attempt_id, [...(traceByAttempt.get(row.attempt_id) ?? []), row]);
  }

  const cohortAttempts = attempts.map<FounderCohortAttempt>((attempt) => {
    const trace = traceByAttempt.get(attempt.id) ?? [];
    const score = scores.get(attempt.id);
    const provider = isProviderId(attempt.provider) ? attempt.provider : "mock";
    const status = isAttemptStatus(attempt.status) ? attempt.status : "draft";

    return {
      id: attempt.id,
      problemId: attempt.problem_id,
      title: attempt.title,
      status,
      provider,
      model: attempt.model,
      solvingMode: isSolvingMode(attempt.solving_mode) ? attempt.solving_mode : undefined,
      userId: attempt.user_id ?? undefined,
      totalScore: score?.total_score,
      judgeMode: isJudgeMode(score?.judge_mode) ? score?.judge_mode : undefined,
      traceEventCount: trace.length,
      userPromptCount: trace.filter((event) => event.role === "user").length,
      assistantResponseCount: trace.filter((event) => event.role === "assistant").length,
      totalEstimatedCostUsd: trace.reduce((sum, event) => sum + usd(event.estimated_cost_usd), 0),
      publishedAttemptId: published.get(attempt.id)?.id,
      isBranch: Boolean(attempt.branch_metadata),
      branchParentTraceIndex: attempt.branch_metadata?.parentTraceIndex,
      createdAt: attempt.created_at,
      updatedAt: attempt.updated_at,
    };
  });

  return {
    mode,
    attempts: cohortAttempts,
    summary: summarize(cohortAttempts),
  };
}

export async function GET() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({
      mode: "local",
      reason: "supabase_not_configured",
      attempts: [],
      summary: summarize([]),
    } satisfies FounderCohortSnapshot);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({
      mode: "local",
      reason: "not_authenticated",
      attempts: [],
      summary: summarize([]),
    } satisfies FounderCohortSnapshot);
  }

  const allowlisted = user.email ? founderEmails().includes(user.email.toLowerCase()) : false;
  const adminClient = allowlisted ? createSupabaseAdminClient() : null;

  if (adminClient) {
    const snapshot = await buildSnapshot({ client: adminClient, mode: "supabase_admin" });
    return NextResponse.json(snapshot);
  }

  const snapshot = await buildSnapshot({
    client: supabase,
    mode: "supabase_user",
  });

  return NextResponse.json({
    ...snapshot,
    reason: allowlisted ? "service_role_not_configured" : "founder_email_not_allowlisted",
  });
}
