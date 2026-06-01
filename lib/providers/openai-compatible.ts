import type { ModelProvider, ProviderRequest, ProviderResponse } from "@/lib/providers/types";
import type { ProviderId } from "@/lib/types";
import { buildAttachmentContext } from "@/lib/attachment-context";

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

type OpenAICompatibleMessage =
  | {
      role: "system" | "assistant" | "user";
      content: string;
    }
  | {
      role: "user";
      content: Array<
        | {
            type: "text";
            text: string;
          }
        | {
            type: "image_url";
            image_url: {
              url: string;
            };
          }
      >;
    };

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
      const messages: OpenAICompatibleMessage[] = [
        ...(request.systemPrompt
          ? [
              {
                role: "system" as const,
                content: request.systemPrompt,
              },
            ]
          : []),
        ...(request.contextMessage
          ? [
              {
                role: "user" as const,
                content: request.contextMessage,
              },
            ]
          : []),
        ...request.messages.map((message): OpenAICompatibleMessage => {
          const attachmentContext = buildAttachmentContext(message.attachments);
          const text = attachmentContext
            ? `${message.content}\n\nAttached file context:\n${attachmentContext}`
            : message.content;

          if (message.role === "assistant") {
            return {
              role: "assistant",
              content: message.content,
            };
          }

          const imageParts =
            message.attachments
              ?.filter((attachment) => attachment.dataUrl && attachment.mimeType.startsWith("image/"))
              .map((attachment) => ({
                type: "image_url" as const,
                image_url: {
                  url: attachment.dataUrl as string,
                },
              })) ?? [];

          if (imageParts.length > 0) {
            return {
              role: "user",
              content: [{ type: "text", text }, ...imageParts],
            };
          }

          return {
            role: "user",
            content: text,
          };
        }),
      ];

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
          temperature: request.temperature ?? 0.4,
          messages,
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
