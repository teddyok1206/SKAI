import type { Attempt, Problem, PublishedAttempt } from "@/lib/types";

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
