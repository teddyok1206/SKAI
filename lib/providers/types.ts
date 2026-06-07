import type { ChatMessage, ModelRun, Problem, ProviderId } from "@/lib/types";

export interface ProviderRequest {
  provider: ProviderId;
  model: string;
  problem: Problem;
  messages: ChatMessage[];
  systemPrompt?: string;
  contextMessage?: string;
  temperature?: number;
}

export interface ProviderResponse {
  message: string;
  modelRun: ModelRun;
}

export type ProviderStreamEvent =
  | {
      type: "ready";
      modelRun: ModelRun;
    }
  | {
      type: "delta";
      delta: string;
    }
  | {
      type: "done";
      message: string;
      modelRun: ModelRun;
    };

export interface ModelProvider {
  id: ProviderId;
  complete(request: ProviderRequest): Promise<ProviderResponse>;
  stream?(request: ProviderRequest): AsyncGenerator<ProviderStreamEvent>;
}
