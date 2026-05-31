export type ThemeId = "promethean" | "research" | "civic";

export interface ThemeOption {
  id: ThemeId;
  priority: number;
  name: string;
  shortName: string;
  description: string;
}

export const themeOptions: ThemeOption[] = [
  {
    id: "promethean",
    priority: 1,
    name: "Promethean Workbench",
    shortName: "Workbench",
    description: "AI라는 불에 장작을 넣는 문제해결 작업대. SKAI의 기본 추천.",
  },
  {
    id: "research",
    priority: 2,
    name: "Research Bench",
    shortName: "Research",
    description: "증거, 자료, 실험 기록을 더 차분하게 드러내는 연구노트형.",
  },
  {
    id: "civic",
    priority: 3,
    name: "Civic AI Lab",
    shortName: "Civic Lab",
    description: "모두의 AI 교육과 공공성에 맞춘 신뢰 중심 실험실.",
  },
];

export const defaultThemeId: ThemeId = "promethean";

export function isThemeId(value: string | null): value is ThemeId {
  return value === "promethean" || value === "research" || value === "civic";
}

