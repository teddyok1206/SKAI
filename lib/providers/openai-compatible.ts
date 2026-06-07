import type { ModelProvider, ProviderRequest, ProviderResponse, ProviderStreamEvent } from "@/lib/providers/types";
import type { ProviderId } from "@/lib/types";
import { buildAttachmentContext } from "@/lib/attachment-context";
import { estimateModelCost } from "@/lib/model-pricing";

interface OpenAICompatibleChoice {
  message?: {
    content?: string;
  };
}

interface OpenAICompatibleUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
}

interface OpenAICompatibleStreamChoice {
  delta?: {
    content?: string;
  };
}

interface OpenAICompatibleResponse {
  id?: string;
  choices?: OpenAICompatibleChoice[];
  usage?: OpenAICompatibleUsage;
}

interface OpenAICompatibleStreamChunk {
  id?: string;
  choices?: OpenAICompatibleStreamChoice[];
  usage?: OpenAICompatibleUsage | null;
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

function buildMessages(request: ProviderRequest): OpenAICompatibleMessage[] {
  return [
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
}

function headersForProvider(options: OpenAICompatibleProviderOptions) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${options.apiKey}`,
    ...(options.id === "openrouter"
      ? {
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "SKAI Demo",
        }
      : {}),
  };
}

function modelRun(input: {
  id?: string;
  provider: ProviderId;
  model: string;
  startedAtMs: number;
  requestStartedAt: string;
  firstTokenAt?: string;
  completedAt?: string;
  usage?: OpenAICompatibleUsage | null;
  outputText?: string;
}) {
  const completedAt = input.completedAt ?? new Date().toISOString();
  const latencyMs = Date.now() - input.startedAtMs;
  const responseModel = input.model;
  const costEstimate = estimateModelCost(
    input.usage?.prompt_tokens,
    input.usage?.completion_tokens,
    input.provider,
    responseModel,
  );
  const timeToFirstTokenMs = input.firstTokenAt
    ? new Date(input.firstTokenAt).getTime() - new Date(input.requestStartedAt).getTime()
    : undefined;
  const outputTokens = input.usage?.completion_tokens;
  const tokensPerSecond =
    typeof outputTokens === "number" && latencyMs > 0 ? Number((outputTokens / (latencyMs / 1000)).toFixed(2)) : undefined;

  return {
    id: input.id ?? crypto.randomUUID(),
    provider: input.provider,
    model: responseModel,
    latencyMs,
    usageInputTokens: input.usage?.prompt_tokens,
    usageOutputTokens: outputTokens,
    estimatedCostUsd: costEstimate.estimatedCostUsd,
    requestStartedAt: input.requestStartedAt,
    firstTokenAt: input.firstTokenAt,
    completedAt,
    timeToFirstTokenMs,
    tokensPerSecond,
  };
}

export function createOpenAICompatibleProvider(options: OpenAICompatibleProviderOptions): ModelProvider {
  return {
    id: options.id,
    async complete(request: ProviderRequest): Promise<ProviderResponse> {
      if (!options.apiKey) {
        throw new Error(`${options.id} API key is not configured.`);
      }

      const startedAt = Date.now();
      const requestStartedAt = new Date(startedAt).toISOString();
      const messages = buildMessages(request);

      const response = await fetch(`${options.baseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: headersForProvider(options),
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

      const responseModel = request.model || options.defaultModel;

      return {
        message,
        modelRun: modelRun({
          id: json.id,
          provider: options.id,
          model: responseModel,
          startedAtMs: startedAt,
          requestStartedAt,
          completedAt: new Date().toISOString(),
          usage: json.usage,
        }),
      };
    },
    async *stream(request: ProviderRequest): AsyncGenerator<ProviderStreamEvent> {
      if (!options.apiKey) {
        throw new Error(`${options.id} API key is not configured.`);
      }

      const startedAt = Date.now();
      const requestStartedAt = new Date(startedAt).toISOString();
      const responseModel = request.model || options.defaultModel;
      const streamId = `stream:${crypto.randomUUID()}`;
      const messages = buildMessages(request);

      const response = await fetch(`${options.baseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: headersForProvider(options),
        body: JSON.stringify({
          model: responseModel,
          temperature: request.temperature ?? 0.4,
          messages,
          stream: true,
          ...(options.id === "openai"
            ? {
                stream_options: {
                  include_usage: true,
                },
              }
            : {}),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${options.id} stream failed: ${response.status} ${errorText}`);
      }

      if (!response.body) {
        throw new Error(`${options.id} stream returned no response body.`);
      }

      yield {
        type: "ready",
        modelRun: modelRun({
          id: streamId,
          provider: options.id,
          model: responseModel,
          startedAtMs: startedAt,
          requestStartedAt,
        }),
      };

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullMessage = "";
      let responseId: string | undefined;
      let usage: OpenAICompatibleUsage | null | undefined;
      let firstTokenAt: string | undefined;

      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() ?? "";

        for (const rawLine of lines) {
          const line = rawLine.trim();

          if (!line.startsWith("data:")) {
            continue;
          }

          const data = line.slice(5).trim();

          if (!data || data === "[DONE]") {
            continue;
          }

          const chunk = JSON.parse(data) as OpenAICompatibleStreamChunk;
          responseId = chunk.id ?? responseId;
          usage = chunk.usage ?? usage;
          const delta = chunk.choices?.map((choice) => choice.delta?.content ?? "").join("") ?? "";

          if (!delta) {
            continue;
          }

          if (!firstTokenAt) {
            firstTokenAt = new Date().toISOString();
          }

          fullMessage += delta;
          yield {
            type: "delta",
            delta,
          };
        }
      }

      const tail = buffer.trim();
      if (tail.startsWith("data:") && !tail.includes("[DONE]")) {
        const data = tail.slice(5).trim();
        if (data) {
          const chunk = JSON.parse(data) as OpenAICompatibleStreamChunk;
          responseId = chunk.id ?? responseId;
          usage = chunk.usage ?? usage;
          const delta = chunk.choices?.map((choice) => choice.delta?.content ?? "").join("") ?? "";
          if (delta) {
            if (!firstTokenAt) {
              firstTokenAt = new Date().toISOString();
            }
            fullMessage += delta;
            yield {
              type: "delta",
              delta,
            };
          }
        }
      }

      const message = fullMessage.trim();

      if (!message) {
        throw new Error(`${options.id} returned an empty stream.`);
      }

      yield {
        type: "done",
        message,
        modelRun: modelRun({
          id: responseId ?? streamId,
          provider: options.id,
          model: responseModel,
          startedAtMs: startedAt,
          requestStartedAt,
          firstTokenAt,
          completedAt: new Date().toISOString(),
          usage,
          outputText: message,
        }),
      };
    },
  };
}
