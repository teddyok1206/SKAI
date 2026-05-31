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
    surfaceLabel: "Minimal reasoning surface",
    note: "조용하고 텍스트 중심인 표면입니다. 답변보다 추론 흐름과 지시 정확도에 집중합니다.",
  },
  gemini: {
    id: "gemini",
    label: "Gemini",
    surfaceLabel: "Exploration surface",
    note: "넓은 자료 탐색과 비교를 전제로 한 표면입니다. 근거와 가정 분리를 강조합니다.",
  },
  xai: {
    id: "xai",
    label: "xAI Grok",
    surfaceLabel: "Direct challenge surface",
    note: "높은 대비와 신호색으로 병목, 반례, 빠진 조건을 더 강하게 드러냅니다.",
  },
  groq: {
    id: "groq",
    label: "Groq",
    surfaceLabel: "Fast inference surface",
    note: "지연 시간과 반복 실험을 의식한 조밀한 표면입니다. 빠른 분기와 재시도를 돕습니다.",
  },
  openrouter: {
    id: "openrouter",
    label: "OpenRouter",
    surfaceLabel: "Routing surface",
    note: "여러 모델을 비교하는 라우팅 표면입니다. provider 전환과 결과 비교를 전제로 합니다.",
  },
};
