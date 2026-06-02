"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  getAttempts,
  getFounderReviewNotes,
  subscribeAttempts,
  subscribeFounderReviewNotes,
} from "@/lib/local-store";
import type { Attempt, FounderReviewNote } from "@/lib/types";

const emptySnapshot = "[]";

function parseSnapshot<T>(snapshot: string): T[] {
  try {
    return JSON.parse(snapshot) as T[];
  } catch {
    return [];
  }
}

export function useLocalAttempts(): Attempt[] {
  const snapshot = useSyncExternalStore(
    subscribeAttempts,
    () => JSON.stringify(getAttempts()),
    () => emptySnapshot,
  );

  return useMemo(() => parseSnapshot<Attempt>(snapshot), [snapshot]);
}

export function useFounderReviewNotes(): FounderReviewNote[] {
  const snapshot = useSyncExternalStore(
    subscribeFounderReviewNotes,
    () => JSON.stringify(getFounderReviewNotes()),
    () => emptySnapshot,
  );

  return useMemo(() => parseSnapshot<FounderReviewNote>(snapshot), [snapshot]);
}
