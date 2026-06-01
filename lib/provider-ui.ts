import type { ProviderId } from "@/lib/types";

export interface ProviderUiProfile {
  id: ProviderId;
  label: string;
  surfaceLabel: string;
  note: string;
}

export const providerUiProfiles: Record<ProviderId, ProviderUiProfile> = {
  mock: {
    id: "mock",
    label: "SKAI Mock",
    surfaceLabel: "Workbench surface",
    note: "SKAI 기본 실험대입니다. 문제 정의, 자료 활용, 검증 흐름을 또렷하게 보여줍니다.",
  },
  openai: {
    id: "openai",
    label: "OpenAI",
    surfaceLabel: "OpenAI surface",
    note: "OpenAI 계열 모델 실행 표면입니다. 풀이 모드는 별도로 선택합니다.",
  },
  gemini: {
    id: "gemini",
    label: "Gemini",
    surfaceLabel: "Gemini surface",
    note: "Gemini 계열 모델 실행 표면입니다. 자료 활용 여부는 사용자가 선택한 풀이 모드와 첨부 행동으로 결정됩니다.",
  },
  xai: {
    id: "xai",
    label: "xAI Grok",
    surfaceLabel: "Grok surface",
    note: "Grok 계열 모델 실행 표면입니다. 모델 특성과 풀이 목적을 분리해서 기록합니다.",
  },
  groq: {
    id: "groq",
    label: "Groq",
    surfaceLabel: "Groq surface",
    note: "Groq hosted 모델 실행 표면입니다. 지연 시간과 비용은 모델 메타데이터로 따로 관찰합니다.",
  },
  openrouter: {
    id: "openrouter",
    label: "OpenRouter",
    surfaceLabel: "OpenRouter surface",
    note: "OpenRouter 경유 모델 실행 표면입니다. 비교 실험은 별도 모드나 연구 화면에서 다룹니다.",
  },
};
