import type { Attempt, FounderCohortSnapshot, Problem, PromptComment, PublishedAttempt } from "@/lib/types";

export async function syncAttemptToSupabase(attempt: Attempt, problem: Problem) {
  const response = await fetch("/api/attempts/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ attempt, problem }),
  }).catch(() => null);

  if (!response?.ok) {
    return { synced: false, reason: "request_failed" };
  }

  return (await response.json()) as { synced?: boolean; reason?: string; mode?: string };
}

export async function syncPublishedAttemptToSupabase(published: PublishedAttempt) {
  const response = await fetch("/api/published/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ published }),
  }).catch(() => null);

  if (!response?.ok) {
    return { synced: false, reason: "request_failed" };
  }

  return (await response.json()) as { synced?: boolean; reason?: string; mode?: string };
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

export async function updatePromptCommentInSupabase(input: {
  commentId: string;
  attemptId: string;
  body: string;
  authorName: string;
}): Promise<boolean> {
  const response = await fetch("/api/comments", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }).catch(() => null);

  if (!response?.ok) {
    return false;
  }

  const data = (await response.json()) as { synced?: boolean };

  return Boolean(data.synced);
}

export async function deletePromptCommentInSupabase(input: {
  commentId: string;
  attemptId: string;
}): Promise<boolean> {
  const response = await fetch("/api/comments", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }).catch(() => null);

  if (!response?.ok) {
    return false;
  }

  const data = (await response.json()) as { synced?: boolean };

  return Boolean(data.synced);
}

export async function reportPromptCommentInSupabase(input: {
  commentId: string;
  attemptId: string;
  reason: string;
}): Promise<boolean> {
  const response = await fetch("/api/comments/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }).catch(() => null);

  if (!response?.ok) {
    return false;
  }

  const data = (await response.json()) as { reported?: boolean };

  return Boolean(data.reported);
}

export async function loadFounderCohortFromSupabase(): Promise<FounderCohortSnapshot | null> {
  const response = await fetch("/api/founder/cohort").catch(() => null);

  if (!response?.ok) {
    return null;
  }

  return (await response.json()) as FounderCohortSnapshot;
}
