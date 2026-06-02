import type { Attempt, FounderCohortSnapshot, Problem, PromptComment, PublishedAttempt } from "@/lib/types";

export async function syncAttemptToSupabase(attempt: Attempt, problem: Problem) {
  await fetch("/api/attempts/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ attempt, problem }),
  }).catch(() => undefined);
}

export async function syncPublishedAttemptToSupabase(published: PublishedAttempt) {
  await fetch("/api/published/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ published }),
  }).catch(() => undefined);
}

export async function loadPublishedAttemptFromSupabase(attemptId: string): Promise<PublishedAttempt | null> {
  const response = await fetch(`/api/published/${attemptId}`).catch(() => null);

  if (!response?.ok) {
    return null;
  }

  const data = (await response.json()) as { publishedAttempt?: PublishedAttempt | null };

  return data.publishedAttempt ?? null;
}

export async function loadPromptCommentsFromSupabase(attemptId: string): Promise<PromptComment[]> {
  const response = await fetch(`/api/comments?attemptId=${encodeURIComponent(attemptId)}`).catch(() => null);

  if (!response?.ok) {
    return [];
  }

  const data = (await response.json()) as { comments?: PromptComment[] };

  return data.comments ?? [];
}

export async function createPromptCommentInSupabase(comment: PromptComment): Promise<boolean> {
  const response = await fetch("/api/comments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ comment }),
  }).catch(() => null);

  if (!response?.ok) {
    return false;
  }

  const data = (await response.json()) as { synced?: boolean };

  return Boolean(data.synced);
}

export async function loadFounderCohortFromSupabase(): Promise<FounderCohortSnapshot | null> {
  const response = await fetch("/api/founder/cohort").catch(() => null);

  if (!response?.ok) {
    return null;
  }

  return (await response.json()) as FounderCohortSnapshot;
}
