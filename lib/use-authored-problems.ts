"use client";

import { useMemo, useSyncExternalStore } from "react";
import { getAuthoredProblems, subscribeAuthoredProblems } from "@/lib/local-store";
import type { Problem } from "@/lib/types";

const emptySnapshot = "[]";

function getSnapshot() {
  return JSON.stringify(getAuthoredProblems());
}

export function useAuthoredProblems(): Problem[] {
  const snapshot = useSyncExternalStore(subscribeAuthoredProblems, getSnapshot, () => emptySnapshot);

  return useMemo(() => {
    try {
      return JSON.parse(snapshot) as Problem[];
    } catch {
      return [];
    }
  }, [snapshot]);
}

export function useAuthoredProblem(problemId: string): Problem | undefined {
  const problems = useAuthoredProblems();

  return useMemo(() => problems.find((problem) => problem.id === problemId), [problemId, problems]);
}
