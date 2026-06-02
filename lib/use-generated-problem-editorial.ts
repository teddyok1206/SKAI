"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  getGeneratedProblemEditorialStates,
  subscribeGeneratedProblemEditorialStates,
} from "@/lib/local-store";
import type { GeneratedProblemEditorialState } from "@/lib/types";

const emptySnapshot = "[]";

function getSnapshot() {
  return JSON.stringify(getGeneratedProblemEditorialStates());
}

export function useGeneratedProblemEditorialStates(): GeneratedProblemEditorialState[] {
  const snapshot = useSyncExternalStore(subscribeGeneratedProblemEditorialStates, getSnapshot, () => emptySnapshot);

  return useMemo(() => {
    try {
      return JSON.parse(snapshot) as GeneratedProblemEditorialState[];
    } catch {
      return [];
    }
  }, [snapshot]);
}

export function useGeneratedProblemEditorialMap() {
  const states = useGeneratedProblemEditorialStates();

  return useMemo(() => new Map(states.map((state) => [state.problemId, state])), [states]);
}
