import type { AttemptStatus, ProviderId, ReportLocale } from "@/lib/types";

export type MyPageMode = "supabase" | "local";

export interface MyPageUserIdentity {
  id: string;
  email?: string;
  provider?: string;
  createdAt?: string;
  lastSignInAt?: string;
}

export interface MyPageProfile {
  displayName: string;
  bio?: string;
  preferredLocale: ReportLocale;
  defaultAuthorLabel: string;
  updatedAt?: string;
}

export interface MyPageSummary {
  attempts: number;
  judgedAttempts: number;
  publishedAttempts: number;
  comments: number;
  branches: number;
  userPrompts: number;
  assistantResponses: number;
  materialAttachments: number;
  totalEstimatedCostUsd: number;
}

export interface MyPageRecentAttempt {
  id: string;
  problemId: string;
  title: string;
  status: AttemptStatus;
  provider: ProviderId;
  model: string;
  solvingMode?: string;
  publishedAttemptId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MyPageSnapshot {
  mode: MyPageMode;
  authenticated: boolean;
  reason?: "supabase_not_configured" | "not_authenticated" | "profile_unavailable";
  user?: MyPageUserIdentity;
  profile?: MyPageProfile;
  summary: MyPageSummary;
  recentAttempts: MyPageRecentAttempt[];
}

export const emptyMyPageSummary: MyPageSummary = {
  attempts: 0,
  judgedAttempts: 0,
  publishedAttempts: 0,
  comments: 0,
  branches: 0,
  userPrompts: 0,
  assistantResponses: 0,
  materialAttachments: 0,
  totalEstimatedCostUsd: 0,
};

export function fallbackProfile(input: { email?: string | null; metadataName?: string | null }): MyPageProfile {
  const emailPrefix = input.email?.split("@")[0]?.trim();
  const displayName = input.metadataName?.trim() || emailPrefix || "SKAI learner";

  return {
    displayName: displayName.slice(0, 60),
    preferredLocale: "ko",
    defaultAuthorLabel: displayName.slice(0, 60),
  };
}

export function emptyMyPageSnapshot(reason: MyPageSnapshot["reason"], mode: MyPageMode = "local"): MyPageSnapshot {
  return {
    mode,
    authenticated: false,
    reason,
    summary: emptyMyPageSummary,
    recentAttempts: [],
  };
}
