import { mockProvider } from "@/lib/providers/mock";
import { createOpenAICompatibleProvider } from "@/lib/providers/openai-compatible";
import type { ModelProvider, ProviderRequest, ProviderResponse, ProviderStreamEvent } from "@/lib/providers/types";
import type { ProviderId } from "@/lib/types";

const geminiOpenAIBaseUrl = "https://generativelanguage.googleapis.com/v1beta/openai";

function allowJudgeGeminiKeyFallback() {
  return process.env.SKAI_ALLOW_JUDGE_GEMINI_KEY_FALLBACK === "true" && process.env.NODE_ENV !== "production";
}

const providers: Partial<Record<ProviderId, ModelProvider>> = {
  mock: mockProvider,
  openai: createOpenAICompatibleProvider({
    id: "openai",
    baseUrl: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
    apiKey: process.env.OPENAI_API_KEY,
    defaultModel: process.env.OPENAI_MODEL ?? "gpt-4.1-nano",
    streaming: {
      enabled: true,
      includeUsage: true,
    },
  }),
  groq: createOpenAICompatibleProvider({
    id: "groq",
    baseUrl: process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1",
    apiKey: process.env.GROQ_API_KEY,
    defaultModel: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
    streaming: {
      enabled: true,
      includeUsage: false,
    },
  }),
  xai: createOpenAICompatibleProvider({
    id: "xai",
    baseUrl: process.env.XAI_BASE_URL ?? "https://api.x.ai/v1",
    apiKey: process.env.XAI_API_KEY,
    defaultModel: process.env.XAI_MODEL ?? "grok-4-fast",
    streaming: {
      enabled: true,
      includeUsage: false,
    },
  }),
  gemini: createOpenAICompatibleProvider({
    id: "gemini",
    baseUrl: process.env.GEMINI_BASE_URL ?? geminiOpenAIBaseUrl,
    apiKey: process.env.GEMINI_API_KEY,
    defaultModel: process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite",
    streaming: {
      enabled: true,
      includeUsage: false,
    },
  }),
  openrouter: createOpenAICompatibleProvider({
    id: "openrouter",
    baseUrl: process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultModel: process.env.OPENROUTER_MODEL ?? "openai/gpt-oss-20b",
    streaming: {
      enabled: true,
      includeUsage: false,
    },
  }),
};

export function getProvider(providerId: ProviderId): ModelProvider {
  return providers[providerId] ?? mockProvider;
}

export function getJudgeProvider(providerId: ProviderId): ModelProvider {
  if (providerId !== "gemini") {
    return getProvider(providerId);
  }

  return createOpenAICompatibleProvider({
    id: "gemini",
    baseUrl: process.env.SKAI_JUDGE_GEMINI_BASE_URL ?? process.env.GEMINI_BASE_URL ?? geminiOpenAIBaseUrl,
    apiKey: process.env.SKAI_JUDGE_GEMINI_API_KEY ?? (allowJudgeGeminiKeyFallback() ? process.env.GEMINI_API_KEY : undefined),
    defaultModel:
      process.env.SKAI_JUDGE_GEMINI_MODEL ??
      process.env.SKAI_JUDGE_MODEL ??
      process.env.GEMINI_MODEL ??
      "gemini-2.5-flash-lite",
    streaming: {
      enabled: false,
    },
  });
}

export async function completeProviderRequest(request: ProviderRequest): Promise<ProviderResponse> {
  const provider = getProvider(request.provider);
  return provider.complete(request);
}

export async function* streamProviderRequest(request: ProviderRequest): AsyncGenerator<ProviderStreamEvent> {
  const provider = getProvider(request.provider);

  if (!provider.stream) {
    const response = await provider.complete(request);
    yield {
      type: "ready",
      modelRun: response.modelRun,
    };
    yield {
      type: "delta",
      delta: response.message,
    };
    yield {
      type: "done",
      message: response.message,
      modelRun: response.modelRun,
    };
    return;
  }

  yield* provider.stream(request);
}
