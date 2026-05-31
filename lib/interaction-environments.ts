import type { ProviderId } from "@/lib/types";

export type InteractionEnvironmentId = "skai-practice" | "chatgpt-like" | "gemini-like";

export interface InteractionEnvironment {
  id: InteractionEnvironmentId;
  label: string;
  shortLabel: string;
  provider: ProviderId;
  model: string;
  surfaceLabel: string;
  description: string;
  materialBehavior: string;
}

export const interactionEnvironments: InteractionEnvironment[] = [
  {
    id: "skai-practice",
    label: "SKAI Practice",
    shortLabel: "SKAI",
    provider: "mock",
    model: "mock-orchestrator",
    surfaceLabel: "연습장 환경",
    description: "API key 없이 SKAI의 문제 정의, task 분배, 검증 흐름을 연습합니다.",
    materialBehavior: "자료는 추출 텍스트와 요약 중심으로 전달됩니다.",
  },
  {
    id: "chatgpt-like",
    label: "ChatGPT-like",
    shortLabel: "ChatGPT형",
    provider: "openai",
    model: "gpt-4.1-mini",
    surfaceLabel: "일반 대화형 AI 환경",
    description: "대부분의 사용자가 떠올리는 텍스트 중심 AI 대화 경험을 모사합니다.",
    materialBehavior: "파일은 SKAI가 정규화한 텍스트 context 중심으로 전달됩니다.",
  },
  {
    id: "gemini-like",
    label: "Gemini-like",
    shortLabel: "Gemini형",
    provider: "gemini",
    model: "gemini-2.5-flash-lite",
    surfaceLabel: "자료 탐색형 AI 환경",
    description: "이미지와 자료를 함께 다루는 실제 업무형 AI 사용 상황을 모사합니다.",
    materialBehavior: "이미지는 가능한 경우 multimodal 입력으로, 나머지 파일은 추출 context로 전달됩니다.",
  },
];

export function getInteractionEnvironment(id: InteractionEnvironmentId): InteractionEnvironment {
  return interactionEnvironments.find((environment) => environment.id === id) ?? interactionEnvironments[0];
}
