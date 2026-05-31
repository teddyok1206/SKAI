import type { ChatMessage, ModelRun, Problem, ProviderId } from "@/lib/types";

export interface ProviderRequest {
  provider: ProviderId;
  model: string;
  problem: Problem;
  messages: ChatMessage[];
}

export interface ProviderResponse {
  message: string;
  modelRun: ModelRun;
}

export interface ModelProvider {
  id: ProviderId;
  complete(request: ProviderRequest): Promise<ProviderResponse>;
}

