import type { ModelProvider, ProviderRequest, ProviderResponse } from "@/lib/providers/types";
import type { ProviderId } from "@/lib/types";

interface OpenAICompatibleChoice {
  message?: {
    content?: string;
  };
}

interface OpenAICompatibleUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
}

interface OpenAICompatibleResponse {
  id?: string;
  choices?: OpenAICompatibleChoice[];
  usage?: OpenAICompatibleUsage;
}

interface OpenAICompatibleProviderOptions {
  id: ProviderId;
  baseUrl: string;
  apiKey?: string;
  defaultModel: string;
}

export function createOpenAICompatibleProvider(options: OpenAICompatibleProviderOptions): ModelProvider {
  return {
    id: options.id,
    async complete(request: ProviderRequest): Promise<ProviderResponse> {
      if (!options.apiKey) {
        throw new Error(`${options.id} API key is not configured.`);
      }

      const startedAt = Date.now();
      const response = await fetch(`${options.baseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${options.apiKey}`,
          ...(options.id === "openrouter"
            ? {
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "SKAI Demo",
              }
            : {}),
        },
        body: JSON.stringify({
          model: request.model || options.defaultModel,
          temperature: 0.4,
          messages: [
            {
              role: "system",
              content:
                "You are the in-app assistant for SKAI, a platform for practicing AI orchestration. Help the user define, decompose, delegate, verify, and produce the requested artifact. Be concrete and structured.",
            },
            {
              role: "user",
              content: `Problem:\n${request.problem.statement}\n\nConstraints:\n${request.problem.constraints.join("\n")}`,
            },
            ...request.messages.map((message) => ({
              role: message.role === "assistant" ? "assistant" : "user",
              content: message.content,
            })),
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${options.id} request failed: ${response.status} ${errorText}`);
      }

      const json = (await response.json()) as OpenAICompatibleResponse;
      const message = json.choices?.[0]?.message?.content?.trim();

      if (!message) {
        throw new Error(`${options.id} returned an empty message.`);
      }

      return {
        message,
        modelRun: {
          id: json.id ?? crypto.randomUUID(),
          provider: options.id,
          model: request.model || options.defaultModel,
          latencyMs: Date.now() - startedAt,
          usageInputTokens: json.usage?.prompt_tokens,
          usageOutputTokens: json.usage?.completion_tokens,
        },
      };
    },
  };
}

