import type { RubricItem } from "@/lib/types";

export const defaultRubric: RubricItem[] = [
  {
    axis: "problem_definition",
    label: "문제정의",
    description: "목표, 제약, 성공 기준, 모르는 정보를 얼마나 명확히 잡았는가.",
    weight: 16,
  },
  {
    axis: "decomposition",
    label: "세분화",
    description: "복잡한 문제를 실행 가능한 하위 작업과 순서로 나누었는가.",
    weight: 16,
  },
  {
    axis: "instruction_clarity",
    label: "지시명확성",
    description: "AI가 수행할 수 있게 역할, 출력 형식, 기준, 범위를 구체화했는가.",
    weight: 14,
  },
  {
    axis: "adaptation",
    label: "적응력",
    description: "중간 산출물과 새 정보를 보고 계획과 프롬프트를 조정했는가.",
    weight: 14,
  },
  {
    axis: "verification",
    label: "검증력",
    description: "AI 출력의 오류, 누락, 환각, 약한 추론을 확인하고 보정했는가.",
    weight: 16,
  },
  {
    axis: "efficiency",
    label: "효율성",
    description: "불필요한 반복, context reload, 비용/시간 낭비를 줄였는가.",
    weight: 10,
  },
  {
    axis: "final_quality",
    label: "최종품질",
    description: "최종 산출물이 문제 목표와 제약을 충족하는가.",
    weight: 14,
  },
];

