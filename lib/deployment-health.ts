import type { ProviderId } from "@/lib/types";

export type DeploymentHealthStatus = "pass" | "warn" | "fail";

export interface DeploymentHealthCheck {
  id: string;
  label: string;
  status: DeploymentHealthStatus;
  detail: string;
}

export interface DeploymentHealthReport {
  status: DeploymentHealthStatus;
  generatedAt: string;
  checks: DeploymentHealthCheck[];
}

const providerKeyEnv: Partial<Record<ProviderId, string>> = {
  openai: "OPENAI_API_KEY",
  groq: "GROQ_API_KEY",
  xai: "XAI_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
  gemini: "GEMINI_API_KEY",
};

function hasEnv(name: string) {
  return Boolean(process.env[name]?.trim());
}

function allowJudgeGeminiKeyFallback() {
  return process.env.SKAI_ALLOW_JUDGE_GEMINI_KEY_FALLBACK === "true" && process.env.NODE_ENV !== "production";
}

function safeUrl(value: string | undefined) {
  if (!value?.trim()) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.hostname === "localhost" || url.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

function check(id: string, label: string, status: DeploymentHealthStatus, detail: string): DeploymentHealthCheck {
  return {
    id,
    label,
    status,
    detail,
  };
}

function configuredLiveProviders() {
  return Object.entries(providerKeyEnv)
    .filter(([, envName]) => envName && hasEnv(envName))
    .map(([provider]) => provider);
}

function judgeProviderConfigured(provider: string | undefined) {
  if (!provider || provider === "mock") {
    return true;
  }

  if (provider === "gemini") {
    return hasEnv("SKAI_JUDGE_GEMINI_API_KEY") || (allowJudgeGeminiKeyFallback() && hasEnv("GEMINI_API_KEY"));
  }

  const envName = providerKeyEnv[provider as ProviderId];
  return envName ? hasEnv(envName) : false;
}

function judgeProviderDetail(provider: string | undefined) {
  if (!provider || provider === "mock") {
    return "Judge provider is mock; no API key is required.";
  }

  if (provider === "gemini") {
    if (hasEnv("SKAI_JUDGE_GEMINI_API_KEY")) {
      return "Judge mode uses Gemini with the dedicated SKAI_JUDGE_GEMINI_API_KEY.";
    }

    if (hasEnv("GEMINI_API_KEY")) {
      return allowJudgeGeminiKeyFallback()
        ? "Judge mode uses Gemini through explicit local GEMINI_API_KEY fallback. Configure SKAI_JUDGE_GEMINI_API_KEY for isolated judge traffic."
        : "Judge mode uses Gemini, but SKAI_JUDGE_GEMINI_API_KEY is missing. GEMINI_API_KEY is reserved for user solving traffic unless SKAI_ALLOW_JUDGE_GEMINI_KEY_FALLBACK=true in non-production.";
    }

    return "Judge mode uses Gemini, but SKAI_JUDGE_GEMINI_API_KEY is missing.";
  }

  return judgeProviderConfigured(provider)
    ? `Judge mode uses ${provider}; the matching API key is configured.`
    : `Judge mode uses ${provider}, but the matching API key is missing.`;
}

function aggregateStatus(checks: DeploymentHealthCheck[]): DeploymentHealthStatus {
  if (checks.some((item) => item.status === "fail")) {
    return "fail";
  }

  if (checks.some((item) => item.status === "warn")) {
    return "warn";
  }

  return "pass";
}

export function getDeploymentHealth(): DeploymentHealthReport {
  const checks: DeploymentHealthCheck[] = [];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKeyConfigured = hasEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const liveProviders = configuredLiveProviders();
  const judgeMode = process.env.SKAI_JUDGE_MODE ?? "heuristic";
  const judgeProvider = process.env.SKAI_JUDGE_PROVIDER ?? "gemini";
  const counterfactualJudgeMode = process.env.SKAI_COUNTERFACTUAL_JUDGE_MODE ?? "heuristic";
  const counterfactualJudgeProvider =
    process.env.SKAI_COUNTERFACTUAL_JUDGE_PROVIDER ?? process.env.SKAI_JUDGE_PROVIDER ?? "gemini";

  checks.push(
    check(
      "supabase-url",
      "Supabase URL",
      safeUrl(supabaseUrl) ? "pass" : "warn",
      safeUrl(supabaseUrl)
        ? "Supabase URL is present and URL-shaped."
        : "Supabase URL is missing or malformed. Auth and remote persistence will fall back to local mode.",
    ),
  );

  checks.push(
    check(
      "supabase-anon-key",
      "Supabase anon key",
      supabaseAnonKeyConfigured ? "pass" : "warn",
      supabaseAnonKeyConfigured
        ? "Supabase anon key is present."
        : "Supabase anon key is missing. Google login and remote persistence are disabled.",
    ),
  );

  checks.push(
    check(
      "live-provider-key",
      "Live provider key",
      liveProviders.length > 0 ? "pass" : "warn",
      liveProviders.length > 0
        ? `Configured live providers: ${liveProviders.join(", ")}.`
        : "No live provider API key is configured. Mock mode still works.",
    ),
  );

  checks.push(
    check(
      "judge-provider-key",
      "LLM judge provider key",
      judgeMode === "heuristic" || judgeProviderConfigured(judgeProvider) ? "pass" : "fail",
      judgeMode === "heuristic"
        ? "Judge mode is heuristic; no LLM judge key is required."
        : judgeProviderDetail(judgeProvider),
    ),
  );

  checks.push(
    check(
      "counterfactual-provider-key",
      "Counterfactual judge provider key",
      counterfactualJudgeMode !== "llm" || judgeProviderConfigured(counterfactualJudgeProvider) ? "pass" : "fail",
      counterfactualJudgeMode !== "llm"
        ? "Counterfactual judge LLM mode is off."
        : judgeProviderDetail(counterfactualJudgeProvider).replace("Judge mode", "Counterfactual judge"),
    ),
  );

  checks.push(
    check(
      "problem-sync-policy",
      "Problem sync policy",
      process.env.NODE_ENV === "production" && process.env.SKAI_ALLOW_AUTHENTICATED_PROBLEM_SYNC === "true" ? "warn" : "pass",
      process.env.NODE_ENV === "production" && process.env.SKAI_ALLOW_AUTHENTICATED_PROBLEM_SYNC === "true"
        ? "Production allows authenticated problem seeding. Disable after applying the seeded-problem migration."
        : "Production will not blindly update problem definitions from client-submitted sync payloads.",
    ),
  );

  checks.push(
    check(
      "krw-usd-estimate",
      "KRW/USD estimate",
      hasEnv("NEXT_PUBLIC_SKAI_KRW_PER_USD_ESTIMATE") ? "pass" : "warn",
      hasEnv("NEXT_PUBLIC_SKAI_KRW_PER_USD_ESTIMATE")
        ? "KRW/USD rough estimate is explicitly configured."
        : "Using the default rough KRW/USD estimate for UI budget display.",
    ),
  );

  return {
    status: aggregateStatus(checks),
    generatedAt: new Date().toISOString(),
    checks,
  };
}
