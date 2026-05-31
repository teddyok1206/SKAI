import { SKAI_STORAGE_KEYS } from "@/lib/constants";
import type { Attempt, PublishedAttempt } from "@/lib/types";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getAttempts(): Attempt[] {
  return readJson<Attempt[]>(SKAI_STORAGE_KEYS.attempts, []);
}

export function saveAttempt(attempt: Attempt) {
  const attempts = getAttempts();
  const next = [attempt, ...attempts.filter((item) => item.id !== attempt.id)];
  writeJson(SKAI_STORAGE_KEYS.attempts, next);
}

export function getAttempt(attemptId: string): Attempt | undefined {
  return getAttempts().find((attempt) => attempt.id === attemptId);
}

export function getPublishedAttempts(): PublishedAttempt[] {
  return readJson<PublishedAttempt[]>(SKAI_STORAGE_KEYS.publishedAttempts, []);
}

export function savePublishedAttempt(attempt: PublishedAttempt) {
  const attempts = getPublishedAttempts();
  const next = [attempt, ...attempts.filter((item) => item.id !== attempt.id)];
  writeJson(SKAI_STORAGE_KEYS.publishedAttempts, next);
}

export function getPublishedAttempt(attemptId: string): PublishedAttempt | undefined {
  return getPublishedAttempts().find((attempt) => attempt.attemptId === attemptId || attempt.id === attemptId);
}

