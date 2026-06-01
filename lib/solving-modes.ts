import type { SolvingModeId } from "@/lib/types";

export interface SolvingMode {
  id: SolvingModeId;
  label: string;
  shortLabel: string;
  surfaceLabel: string;
  description: string;
  evaluationLens: string;
}

export const solvingModes: SolvingMode[] = [
  {
    id: "single_model",
    label: "Single Model",
    shortLabel: "단일 모델",
    surfaceLabel: "기본 대화 풀이",
    description: "한 모델과의 cold-start 대화만으로 문제를 구조화하고 해결합니다.",
    evaluationLens: "문제 정의, 세분화, 지시 명료도, 최종 산출물을 균형 있게 봅니다.",
  },
  {
    id: "material_grounded",
    label: "Material Grounded",
    shortLabel: "자료 활용",
    surfaceLabel: "자료 기반 풀이",
    description: "자료를 언제 보고, 무엇을 첨부하고, 어떤 근거로 쓰는지에 집중합니다.",
    evaluationLens: "파일 근거, 가정 분리, 자료 선택 타이밍, 사람 검토 지점을 더 주의 깊게 봅니다.",
  },
  {
    id: "verification_drill",
    label: "Verification Drill",
    shortLabel: "검증 중심",
    surfaceLabel: "검증 중심 풀이",
    description: "AI 응답의 한계, 반례, 확인 질문, 출처 검증 전략을 중심으로 풉니다.",
    evaluationLens: "성급한 결론 방지, 검증 질문, 불확실성 관리, 수정 프롬프트를 더 주의 깊게 봅니다.",
  },
];

export function getSolvingMode(id: SolvingModeId): SolvingMode {
  return solvingModes.find((mode) => mode.id === id) ?? solvingModes[0];
}
