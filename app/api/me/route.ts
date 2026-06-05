import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { emptyMyPageSnapshot, fallbackProfile, type MyPageProfile, type MyPageRecentAttempt, type MyPageSnapshot } from "@/lib/my-page";
import type { AttemptStatus, ProviderId } from "@/lib/types";

type ProfileRow = {
  display_name: string;
  bio: string | null;
  preferred_locale: "ko" | "en";
  default_author_label: string;
  updated_at: string;
};

type AttemptRow = {
  id: string;
  problem_id: string;
  status: AttemptStatus;
  title: string;
  provider: ProviderId;
  model: string;
  solving_mode: string | null;
  branch_metadata: unknown;
  created_at: string;
  updated_at: string;
};

type PublishedAttemptRow = {
  id: string;
  attempt_id: string;
};

type TraceEventRow = {
  role: string;
  estimated_cost_usd: number | string | null;
  attachments: unknown;
};

function profileFromRow(row: ProfileRow): MyPageProfile {
  return {
    displayName: row.display_name,
    bio: row.bio ?? undefined,
    preferredLocale: row.preferred_locale,
    defaultAuthorLabel: row.default_author_label,
    updatedAt: row.updated_at,
  };
}

function attachmentCount(value: unknown) {
  return Array.isArray(value) ? value.length : 0;
}

function moneyValue(value: number | string | null) {
  if (value === null) {
    return 0;
  }

  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

export async function GET(): Promise<NextResponse<MyPageSnapshot>> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json(emptyMyPageSnapshot("supabase_not_configured"));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(emptyMyPageSnapshot("not_authenticated", "supabase"));
  }

  const metadataName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name
        : undefined;

  let profile = fallbackProfile({ email: user.email, metadataName });
  let reason: MyPageSnapshot["reason"];

  const profileResult = await supabase
    .from("user_profiles")
    .select("display_name,bio,preferred_locale,default_author_label,updated_at")
    .eq("user_id", user.id)
    .maybeSingle<ProfileRow>();

  if (profileResult.data) {
    profile = profileFromRow(profileResult.data);
  } else if (profileResult.error) {
    reason = "profile_unavailable";
  }

  const attemptsResult = await supabase
    .from("attempts")
    .select("id,problem_id,status,title,provider,model,solving_mode,branch_metadata,created_at,updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(200)
    .returns<AttemptRow[]>();

  const attempts = attemptsResult.data ?? [];
  const attemptIds = attempts.map((attempt) => attempt.id);
  const publishedByAttemptId = new Map<string, string>();

  if (attemptIds.length > 0) {
    const publishedResult = await supabase
      .from("published_attempts")
      .select("id,attempt_id")
      .in("attempt_id", attemptIds)
      .returns<PublishedAttemptRow[]>();

    for (const row of publishedResult.data ?? []) {
      publishedByAttemptId.set(row.attempt_id, row.id);
    }
  }

  let userPrompts = 0;
  let assistantResponses = 0;
  let materialAttachments = 0;
  let totalEstimatedCostUsd = 0;

  if (attemptIds.length > 0) {
    const traceResult = await supabase
      .from("trace_events")
      .select("role,estimated_cost_usd,attachments")
      .in("attempt_id", attemptIds)
      .limit(2000)
      .returns<TraceEventRow[]>();

    for (const event of traceResult.data ?? []) {
      if (event.role === "user") {
        userPrompts += 1;
        materialAttachments += attachmentCount(event.attachments);
      }

      if (event.role === "assistant") {
        assistantResponses += 1;
      }

      totalEstimatedCostUsd += moneyValue(event.estimated_cost_usd);
    }
  }

  let judgedAttempts = attempts.filter((attempt) => attempt.status === "judged" || attempt.status === "published").length;

  if (attemptIds.length > 0) {
    const scoreResult = await supabase
      .from("score_reports")
      .select("attempt_id")
      .in("attempt_id", attemptIds)
      .limit(500)
      .returns<Array<{ attempt_id: string }>>();
    const scoredAttemptIds = new Set((scoreResult.data ?? []).map((row) => row.attempt_id));

    if (scoredAttemptIds.size > judgedAttempts) {
      judgedAttempts = scoredAttemptIds.size;
    }
  }

  const commentsResult = await supabase
    .from("prompt_comments")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const recentAttempts = attempts.slice(0, 5).map<MyPageRecentAttempt>((attempt) => ({
    id: attempt.id,
    problemId: attempt.problem_id,
    title: attempt.title,
    status: attempt.status,
    provider: attempt.provider,
    model: attempt.model,
    solvingMode: attempt.solving_mode ?? undefined,
    publishedAttemptId: publishedByAttemptId.get(attempt.id),
    createdAt: attempt.created_at,
    updatedAt: attempt.updated_at,
  }));

  return NextResponse.json({
    mode: "supabase",
    authenticated: true,
    reason,
    user: {
      id: user.id,
      email: user.email ?? undefined,
      provider: typeof user.app_metadata?.provider === "string" ? user.app_metadata.provider : undefined,
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at ?? undefined,
    },
    profile,
    summary: {
      attempts: attempts.length,
      judgedAttempts,
      publishedAttempts: publishedByAttemptId.size,
      comments: commentsResult.count ?? 0,
      branches: attempts.filter((attempt) => Boolean(attempt.branch_metadata)).length,
      userPrompts,
      assistantResponses,
      materialAttachments,
      totalEstimatedCostUsd,
    },
    recentAttempts,
  });
}
