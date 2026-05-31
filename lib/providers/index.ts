import { mockProvider } from "@/lib/providers/mock";
import { createOpenAICompatibleProvider } from "@/lib/providers/openai-compatible";
import type { ModelProvider, ProviderRequest, ProviderResponse } from "@/lib/providers/types";
import type { ProviderId } from "@/lib/types";

const providers: Partial<Record<ProviderId, ModelProvider>> = {
  mock: mockProvider,
  openai: createOpenAICompatibleProvider({
    id: "openai",
    baseUrl: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
    apiKey: process.env.OPENAI_API_KEY,
    defaultModel: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
  }),
  groq: createOpenAICompatibleProvider({
    id: "groq",
    baseUrl: process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1",
    apiKey: process.env.GROQ_API_KEY,
    defaultModel: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
  }),
  xai: createOpenAICompatibleProvider({
    id: "xai",
    baseUrl: process.env.XAI_BASE_URL ?? "https://api.x.ai/v1",
    apiKey: process.env.XAI_API_KEY,
    defaultModel: process.env.XAI_MODEL ?? "grok-4-fast",
  }),
  openrouter: createOpenAICompatibleProvider({
    id: "openrouter",
    baseUrl: process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultModel: process.env.OPENROUTER_MODEL ?? "openai/gpt-oss-20b",
  }),
};

export function getProvider(providerId: ProviderId): ModelProvider {
  return providers[providerId] ?? mockProvider;
}

export async function completeWithFallback(request: ProviderRequest): Promise<ProviderResponse> {
  const provider = getProvider(request.provider);

  try {
    return await provider.complete(request);
  } catch (error) {
    if (request.provider === "mock") {
      throw error;
    }

    const fallback = await mockProvider.complete({
      ...request,
      provider: "mock",
      model: "mock-orchestrator",
    });

    return {
      ...fallback,
      message: [
        `선택한 provider(${request.provider}) 호출에 실패해 mock mode로 전환했습니다.`,
        "",
        fallback.message,
      ].join("\n"),
    };
  }
}

