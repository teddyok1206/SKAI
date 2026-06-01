import type { ProviderId } from "@/lib/types";

export type ModelOptionId = "skai-mock" | "openai-gpt-4-1-mini" | "gemini-flash-lite" | "groq-llama" | "xai-grok-fast";

export interface ModelOption {
  id: ModelOptionId;
  label: string;
  shortLabel: string;
  provider: ProviderId;
  model: string;
  description: string;
  capabilityNote: string;
}

export const modelOptions: ModelOption[] = [
  {
    id: "skai-mock",
    label: "SKAI Mock",
    shortLabel: "Mock",
    provider: "mock",
    model: "mock-orchestrator",
    description: "API key 없이 trace, branch, judge 흐름을 확인하는 데모 모델입니다.",
    capabilityNote: "비용 없음 · 실제 LLM 품질 평가용 아님",
  },
  {
    id: "gemini-flash-lite",
    label: "Gemini Flash-Lite",
    shortLabel: "Gemini",
    provider: "gemini",
    model: "gemini-2.5-flash-lite",
    description: "저비용 live smoke에 적합한 Gemini 계열 모델입니다.",
    capabilityNote: "저비용 · 이미지 입력 지원 가능",
  },
  {
    id: "groq-llama",
    label: "Groq Llama",
    shortLabel: "Groq",
    provider: "groq",
    model: "llama-3.3-70b-versatile",
    description: "반복 실험과 빠른 응답 확인에 적합한 Groq hosted 모델입니다.",
    capabilityNote: "빠른 응답 · 텍스트 중심",
  },
  {
    id: "xai-grok-fast",
    label: "xAI Grok Fast",
    shortLabel: "Grok",
    provider: "xai",
    model: "grok-4-fast",
    description: "Grok 계열 API smoke와 비교 실험을 위한 모델 옵션입니다.",
    capabilityNote: "저가 후보 · provider key 필요",
  },
  {
    id: "openai-gpt-4-1-mini",
    label: "OpenAI GPT-4.1 Mini",
    shortLabel: "OpenAI",
    provider: "openai",
    model: "gpt-4.1-mini",
    description: "OpenAI 계열의 안정적인 baseline 비교용 모델입니다.",
    capabilityNote: "비교 baseline · 비용 주의",
  },
];

export function getModelOption(id: ModelOptionId): ModelOption {
  return modelOptions.find((option) => option.id === id) ?? modelOptions[0];
}

export function getModelOptionByProviderModel(provider: ProviderId, model: string): ModelOption {
  return modelOptions.find((option) => option.provider === provider && option.model === model) ?? modelOptions[0];
}
