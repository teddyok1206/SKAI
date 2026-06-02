import type { ProviderId } from "@/lib/types";

export type PricingStatus = "known" | "unknown_pricing" | "missing_tokens";

export interface ModelPricing {
  provider: ProviderId;
  model: string;
  inputUsdPerMillionTokens: number;
  outputUsdPerMillionTokens: number;
  sourceLabel: string;
  sourceUrl: string;
  effectiveDate: string;
  note: string;
}

export interface CostEstimate {
  status: PricingStatus;
  estimatedCostUsd?: number;
  pricing?: ModelPricing;
}

const millionTokens = 1_000_000;

export const modelPricingTable: ModelPricing[] = [
  {
    provider: "mock",
    model: "mock-orchestrator",
    inputUsdPerMillionTokens: 0,
    outputUsdPerMillionTokens: 0,
    sourceLabel: "SKAI local mock",
    sourceUrl: "local",
    effectiveDate: "2026-06-02",
    note: "Local deterministic demo provider.",
  },
  {
    provider: "gemini",
    model: "gemini-2.5-flash-lite",
    inputUsdPerMillionTokens: 0.1,
    outputUsdPerMillionTokens: 0.4,
    sourceLabel: "Google AI Gemini API pricing",
    sourceUrl: "https://ai.google.dev/pricing",
    effectiveDate: "2026-06-02",
    note: "Standard paid-tier text/image/video input and output token pricing. Free tier, batch, caching, tools, audio, and grounding are not modeled.",
  },
  {
    provider: "groq",
    model: "llama-3.3-70b-versatile",
    inputUsdPerMillionTokens: 0.59,
    outputUsdPerMillionTokens: 0.79,
    sourceLabel: "Groq on-demand pricing",
    sourceUrl: "https://groq.com/pricing",
    effectiveDate: "2026-06-02",
    note: "On-demand text token pricing. Prompt caching, enterprise terms, and compound tool pass-through pricing are not modeled.",
  },
  {
    provider: "xai",
    model: "grok-4-fast",
    inputUsdPerMillionTokens: 1.25,
    outputUsdPerMillionTokens: 2.5,
    sourceLabel: "xAI model docs",
    sourceUrl: "https://docs.x.ai/docs/models/grok-4-fast",
    effectiveDate: "2026-06-02",
    note: "Official docs currently show this rate for the Grok Fast page. xAI model aliases and fast-tier pricing have changed often, so verify before paid demos.",
  },
  {
    provider: "openai",
    model: "gpt-4.1-nano",
    inputUsdPerMillionTokens: 0.1,
    outputUsdPerMillionTokens: 0.4,
    sourceLabel: "OpenAI GPT-4.1 nano model docs",
    sourceUrl: "https://platform.openai.com/docs/models/gpt-4.1-nano",
    effectiveDate: "2026-06-03",
    note: "Standard text token pricing. Cached input, batch mode, image token details, and tool calls are not modeled.",
  },
];

export function getModelPricing(provider: ProviderId, model: string) {
  const normalizedModel = model.trim().toLowerCase();

  return modelPricingTable.find(
    (pricing) => pricing.provider === provider && pricing.model.toLowerCase() === normalizedModel,
  );
}

export function estimateModelCost(inputTokens: number | undefined, outputTokens: number | undefined, provider: ProviderId, model: string): CostEstimate {
  if (typeof inputTokens !== "number" || typeof outputTokens !== "number") {
    return {
      status: "missing_tokens",
    };
  }

  const pricing = getModelPricing(provider, model);
  if (!pricing) {
    return {
      status: "unknown_pricing",
    };
  }

  const estimatedCostUsd =
    (inputTokens / millionTokens) * pricing.inputUsdPerMillionTokens +
    (outputTokens / millionTokens) * pricing.outputUsdPerMillionTokens;

  return {
    status: "known",
    estimatedCostUsd,
    pricing,
  };
}
