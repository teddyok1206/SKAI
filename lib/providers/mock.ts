import type { ModelProvider, ProviderRequest, ProviderResponse } from "@/lib/providers/types";
import { buildAttachmentContext } from "@/lib/attachment-context";

function includesAny(value: string, words: string[]) {
  const normalized = value.toLowerCase();
  return words.some((word) => normalized.includes(word.toLowerCase()));
}

function buildMockReply(request: ProviderRequest) {
  const lastUserMessage = [...request.messages].reverse().find((message) => message.role === "user");
  const last = lastUserMessage?.content ?? "";
  const attachmentContext = buildAttachmentContext(lastUserMessage?.attachments);
  const turn = request.messages.filter((message) => message.role === "user").length;

  if (attachmentContext) {
    return [
      "첨부된 자료를 확인했습니다. 이 자료는 모델 입력 context에 포함됩니다.",
      "",
      attachmentContext.slice(0, 1200),
      "",
      "이제 이 자료를 근거로 삼되, 파일에서 확인된 사실과 추정/가정을 분리해서 진행하는 것이 좋습니다.",
    ].join("\n");
  }

  if (turn <= 1) {
    const promptSummary = last.trim()
      ? last.trim().replace(/\s+/g, " ").slice(0, 220)
      : "아직 구체적인 요청이 없습니다.";

    return [
      "좋습니다. 현재 입력된 프롬프트만 기준으로 먼저 정리하겠습니다.",
      "",
      `1. 사용자가 명시한 요청: ${promptSummary}`,
      "2. 먼저 확인할 점: 대상자, 발표 시간, 평가 기준, 원하는 깊이, 사용할 자료 범위입니다.",
      "3. 진행 방식: 후보 분야를 넓게 뽑고, 발표 적합성 기준으로 좁힌 뒤, 최종 추천 이유를 비교표로 정리하는 흐름이 좋습니다.",
      "4. 다음 지시 제안: 후보 분야 5개와 각 분야의 장단점을 표로 정리해 달라고 요청해보세요.",
    ].join("\n");
  }

  if (includesAny(last, ["검증", "확인", "환각", "출처", "한계"])) {
    return [
      "검증 관점에서 보면 지금 산출물은 세 가지를 더 확인해야 합니다.",
      "",
      "- 사실 주장과 의견을 분리해야 합니다.",
      "- 출처가 필요한 문장에는 출처 유형이나 검증 방법을 붙여야 합니다.",
      "- 데이터가 부족한 부분은 결론이 아니라 가설로 표현해야 합니다.",
      "",
      "다음 단계로는 최종 산출물에 `검증 필요`, `가정`, `확정 가능` 라벨을 붙이는 방식이 좋습니다.",
    ].join("\n");
  }

  if (includesAny(last, ["최종", "정리", "제출", "브리프", "보고서"])) {
    return [
      "아래처럼 최종 산출물 구조를 잡을 수 있습니다.",
      "",
      "## 문제정의",
      "요청의 목적과 대상이 불명확하므로, 먼저 성공 기준과 산출물 형식을 명확히 한다.",
      "",
      "## Task 분배",
      "1. AI: 초안 구조화와 누락 조건 탐지",
      "2. 사용자: 도메인 맥락과 최종 판단",
      "3. AI: 검증 질문과 대안 생성",
      "",
      "## 검증 계획",
      "핵심 주장별 근거 필요 여부를 표시하고, 불확실한 결론은 가정으로 둔다.",
    ].join("\n");
  }

  return [
    "현재 방향은 문제를 바로 해결하기보다 구조를 먼저 만들고 있다는 점이 좋습니다.",
    "",
    "다음 프롬프트에서는 아래 세 가지를 명시하면 더 좋아집니다.",
    "",
    "- AI가 맡을 하위 task",
    "- 출력 형식",
    "- 검증 기준",
    "",
    "예: `위 문제를 해결하기 전에 누락된 조건을 5개 이하로 짚고, 그 조건이 최종 산출물에 미치는 영향을 표로 정리해줘.`",
  ].join("\n");
}

export const mockProvider: ModelProvider = {
  id: "mock",
  async complete(request: ProviderRequest): Promise<ProviderResponse> {
    const startedAt = Date.now();
    const message = buildMockReply(request);
    const usageInputTokens = Math.ceil(
      (
        (request.systemPrompt?.length ?? 0) +
        (request.contextMessage?.length ?? 0) +
        request.messages.reduce((sum, item) => sum + item.content.length + buildAttachmentContext(item.attachments).length, 0)
      ) / 4,
    );
    const usageOutputTokens = Math.ceil(message.length / 4);

    return {
      message,
      modelRun: {
        id: crypto.randomUUID(),
        provider: "mock",
        model: request.model || "mock-orchestrator",
        latencyMs: Date.now() - startedAt,
        usageInputTokens,
        usageOutputTokens,
        estimatedCostUsd: 0,
      },
    };
  },
};
