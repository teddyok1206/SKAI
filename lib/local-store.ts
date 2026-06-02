import { SKAI_STORAGE_KEYS } from "@/lib/constants";
import type {
  Attempt,
  FounderReviewNote,
  GeneratedProblemEditorialState,
  Problem,
  PromptComment,
  PublishedAttempt,
} from "@/lib/types";

const authoredProblemsChangedEvent = "skai:authored-problems-changed";
const attemptsChangedEvent = "skai:attempts-changed";
const founderReviewNotesChangedEvent = "skai:founder-review-notes-changed";
const generatedProblemEditorialChangedEvent = "skai:generated-problem-editorial-changed";

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

function notifyAuthoredProblemsChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(authoredProblemsChangedEvent));
}

function notifyAttemptsChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(attemptsChangedEvent));
}

function notifyFounderReviewNotesChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(founderReviewNotesChangedEvent));
}

function notifyGeneratedProblemEditorialChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(generatedProblemEditorialChangedEvent));
}

export function getAttempts(): Attempt[] {
  return readJson<Attempt[]>(SKAI_STORAGE_KEYS.attempts, []);
}

export function saveAttempt(attempt: Attempt) {
  const attempts = getAttempts();
  const next = [attempt, ...attempts.filter((item) => item.id !== attempt.id)];
  writeJson(SKAI_STORAGE_KEYS.attempts, next);
  notifyAttemptsChanged();
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

export function getPromptComments(attemptId: string): PromptComment[] {
  return readJson<PromptComment[]>(SKAI_STORAGE_KEYS.promptComments, [])
    .filter((comment) => comment.attemptId === attemptId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function savePromptComment(comment: PromptComment) {
  const comments = readJson<PromptComment[]>(SKAI_STORAGE_KEYS.promptComments, []);
  const next = [comment, ...comments.filter((item) => item.id !== comment.id)];
  writeJson(SKAI_STORAGE_KEYS.promptComments, next);
}

export function updatePromptComment(comment: PromptComment) {
  const comments = readJson<PromptComment[]>(SKAI_STORAGE_KEYS.promptComments, []);
  const next = comments.map((item) => (item.id === comment.id ? comment : item));
  writeJson(SKAI_STORAGE_KEYS.promptComments, next);
}

export function softDeletePromptComment(commentId: string) {
  const comments = readJson<PromptComment[]>(SKAI_STORAGE_KEYS.promptComments, []);
  const deletedAt = new Date().toISOString();
  const next = comments.map((item) =>
    item.id === commentId
      ? {
          ...item,
          body: "Comment deleted.",
          deletedAt,
          updatedAt: deletedAt,
        }
      : item,
  );
  writeJson(SKAI_STORAGE_KEYS.promptComments, next);
}

export function reportPromptComment(commentId: string) {
  const comments = readJson<PromptComment[]>(SKAI_STORAGE_KEYS.promptComments, []);
  const next = comments.map((item) =>
    item.id === commentId
      ? {
          ...item,
          reportCount: (item.reportCount ?? 0) + 1,
        }
      : item,
  );
  writeJson(SKAI_STORAGE_KEYS.promptComments, next);
}

export function savePromptComments(comments: PromptComment[]) {
  const stored = readJson<PromptComment[]>(SKAI_STORAGE_KEYS.promptComments, []);
  const incomingIds = new Set(comments.map((comment) => comment.id));
  writeJson(SKAI_STORAGE_KEYS.promptComments, [
    ...comments,
    ...stored.filter((comment) => !incomingIds.has(comment.id)),
  ]);
}

export function getAuthoredProblems(): Problem[] {
  return readJson<Problem[]>(SKAI_STORAGE_KEYS.authoredProblems, []);
}

export function saveAuthoredProblem(problem: Problem) {
  const problems = getAuthoredProblems();
  const next = [problem, ...problems.filter((item) => item.id !== problem.id)];
  writeJson(SKAI_STORAGE_KEYS.authoredProblems, next);
  notifyAuthoredProblemsChanged();
}

export function getAuthoredProblem(problemId: string): Problem | undefined {
  return getAuthoredProblems().find((problem) => problem.id === problemId);
}

export function subscribeAuthoredProblems(listener: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  function handleStorage(event: StorageEvent) {
    if (event.key === SKAI_STORAGE_KEYS.authoredProblems) {
      listener();
    }
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener(authoredProblemsChangedEvent, listener);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(authoredProblemsChangedEvent, listener);
  };
}

export function subscribeAttempts(listener: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  function handleStorage(event: StorageEvent) {
    if (event.key === SKAI_STORAGE_KEYS.attempts) {
      listener();
    }
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener(attemptsChangedEvent, listener);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(attemptsChangedEvent, listener);
  };
}

export function getFounderReviewNotes(): FounderReviewNote[] {
  return readJson<FounderReviewNote[]>(SKAI_STORAGE_KEYS.founderReviewNotes, []);
}

export function saveFounderReviewNote(note: FounderReviewNote) {
  const notes = getFounderReviewNotes();
  const next = [note, ...notes.filter((item) => item.attemptId !== note.attemptId)];
  writeJson(SKAI_STORAGE_KEYS.founderReviewNotes, next);
  notifyFounderReviewNotesChanged();
}

export function subscribeFounderReviewNotes(listener: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  function handleStorage(event: StorageEvent) {
    if (event.key === SKAI_STORAGE_KEYS.founderReviewNotes) {
      listener();
    }
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener(founderReviewNotesChangedEvent, listener);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(founderReviewNotesChangedEvent, listener);
  };
}

export function getGeneratedProblemEditorialStates(): GeneratedProblemEditorialState[] {
  return readJson<GeneratedProblemEditorialState[]>(SKAI_STORAGE_KEYS.generatedProblemEditorial, []);
}

export function saveGeneratedProblemEditorialState(state: GeneratedProblemEditorialState) {
  const states = getGeneratedProblemEditorialStates();
  const next = [state, ...states.filter((item) => item.problemId !== state.problemId)];
  writeJson(SKAI_STORAGE_KEYS.generatedProblemEditorial, next);
  notifyGeneratedProblemEditorialChanged();
}

export function subscribeGeneratedProblemEditorialStates(listener: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  function handleStorage(event: StorageEvent) {
    if (event.key === SKAI_STORAGE_KEYS.generatedProblemEditorial) {
      listener();
    }
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener(generatedProblemEditorialChangedEvent, listener);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(generatedProblemEditorialChangedEvent, listener);
  };
}
