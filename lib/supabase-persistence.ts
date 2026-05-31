"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase";
import type { Attempt, Problem, PublishedAttempt } from "@/lib/types";

async function getClientAndUser() {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) {
    return null;
  }

  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return null;
  }

  return { supabase, user: data.user };
}

export async function syncProblemToSupabase(problem: Problem) {
  const context = await getClientAndUser();
  if (!context) {
    return;
  }

  await context.supabase.from("problems").upsert({
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
}

export async function syncAttemptToSupabase(attempt: Attempt, problem: Problem) {
  const context = await getClientAndUser();
  if (!context) {
    return;
  }

  await syncProblemToSupabase(problem);

  await context.supabase.from("attempts").upsert({
    id: attempt.id,
    problem_id: attempt.problemId,
    user_id: context.user.id,
    status: attempt.status,
    title: attempt.title,
    provider: attempt.provider,
    model: attempt.model,
    final_answer: attempt.finalAnswer ?? null,
    published_at: attempt.publishedAt ?? null,
    updated_at: attempt.updatedAt,
  });

  if (attempt.trace.length > 0) {
    await context.supabase.from("trace_events").upsert(
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
        created_at: event.createdAt,
      })),
    );
  }

  if (attempt.scoreReport) {
    await context.supabase.from("score_reports").upsert({
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
      judge_provider: attempt.scoreReport.judgeProvider,
      judge_model: attempt.scoreReport.judgeModel,
      created_at: attempt.scoreReport.createdAt,
    });
  }
}

export async function syncPublishedAttemptToSupabase(published: PublishedAttempt) {
  const context = await getClientAndUser();
  if (!context) {
    return;
  }

  await context.supabase.from("published_attempts").upsert({
    id: published.id,
    attempt_id: published.attemptId,
    problem_id: published.problemId,
    title: published.title,
    workflow: published.workflow,
    snapshot: published,
    created_at: published.createdAt,
  });
}

export async function loadPublishedAttemptFromSupabase(attemptId: string): Promise<PublishedAttempt | null> {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("published_attempts")
    .select("snapshot")
    .or(`attempt_id.eq.${attemptId},id.eq.${attemptId}`)
    .maybeSingle();

  if (error || !data?.snapshot) {
    return null;
  }

  return data.snapshot as PublishedAttempt;
}

