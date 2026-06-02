import rawBatch from "@/docs/problem_generation/batches/001_30problems.json";
import { defaultRubric } from "@/data/rubric";
import type { ProblemPlaybook } from "@/data/problem-playbooks";
import type { Problem, ProblemMaterial } from "@/lib/types";

type PrimarySkill =
  | "problem_definition"
  | "decomposition"
  | "material_grounding"
  | "verification"
  | "adaptation"
  | "cost_control"
  | "workflow_design"
  | "stakeholder_alignment";

export interface GeneratedProblemClassification {
  domain: string;
  subdomain: string;
  primarySkill: PrimarySkill;
  secondarySkills: string[];
  materialProfile: string[];
  ambiguityLevel: "low" | "medium" | "high";
  externalKnowledgeNeed: "none" | "low" | "medium" | "high";
  expectedTurns: number;
  primaryFailureMode: string;
  idealBottleneck: string;
  graphPattern: string;
}

interface RawAppProblem extends Omit<Problem, "rubric"> {
  rubricKey: "defaultRubric";
}

interface RawPlaybookTurn {
  turn: number;
  attachMaterialIds: string[];
  prompt: string;
}

interface RawPlaybook {
  recommendedMode: string;
  recommendedModel: string;
  attachments: string[];
  turns: RawPlaybookTurn[];
  optionalFinalAnswerFieldDraft: string;
  smokeNotes: string[];
  weakTracePattern: string;
  goodTracePattern: string;
}

interface RawBatchProblem {
  appProblem: RawAppProblem;
  classification: GeneratedProblemClassification;
  playbook: RawPlaybook;
}

const rawProblems = rawBatch.problems as RawBatchProblem[];

const generatedModeLabels: Record<string, string> = {
  "evidence-grounded": "Material Grounded",
  "multi-step-replay": "Verification Drill",
  "guided-collaboration": "Single Model",
};

const turnTitleByIndex = [
  "문제정의와 계획",
  "자료 연결과 초안",
  "검증과 보정",
  "최종 제출 정리",
  "추가 검증",
];

function normalizeMaterial(material: ProblemMaterial): ProblemMaterial {
  if (!material.href?.startsWith("/synthetic/skai/")) {
    return material;
  }

  return {
    id: material.id,
    title: material.title,
    description: material.description,
    kind: material.kind,
    fileName: material.fileName,
    mimeType: material.mimeType,
    extractedText: material.extractedText,
  };
}

function normalizeProblem(appProblem: RawAppProblem): Problem {
  const { rubricKey, ...problem } = appProblem;

  if (rubricKey !== "defaultRubric") {
    throw new Error(`Unsupported generated rubric key: ${rubricKey}`);
  }

  return {
    ...problem,
    materials: problem.materials.map(normalizeMaterial),
    rubric: defaultRubric,
  };
}

function normalizeModeLabel(mode: string) {
  return generatedModeLabels[mode] ?? "Single Model";
}

function normalizePlaybook(problemId: string, playbook: RawPlaybook): ProblemPlaybook {
  return {
    problemId,
    recommendedMode: normalizeModeLabel(playbook.recommendedMode),
    recommendedModel: "Gemini Flash-Lite or OpenAI cheap baseline for live smoke, SKAI Mock for no-key demo",
    turns: playbook.turns.map((turn, index) => ({
      id: `turn-${turn.turn}`,
      label: `Turn ${turn.turn}`,
      title: turnTitleByIndex[index] ?? `Turn ${turn.turn}`,
      prompt: turn.prompt,
      attachmentMaterialIds: turn.attachMaterialIds.length > 0 ? turn.attachMaterialIds : undefined,
    })),
    finalAnswerDraft: playbook.optionalFinalAnswerFieldDraft,
  };
}

export const generatedProblemBatch001Metadata = {
  batchId: rawBatch.batchId,
  createdAt: rawBatch.createdAt,
  coveragePlan: rawBatch.coveragePlan,
  coverageSummary: rawBatch.coverageSummary,
  nextBatchStrategy: rawBatch.nextBatchStrategy,
};

export const generatedProblemBatch001Problems: Problem[] = rawProblems.map(({ appProblem }) =>
  normalizeProblem(appProblem),
);

export const generatedProblemBatch001Playbooks: ProblemPlaybook[] = rawProblems.map(({ appProblem, playbook }) =>
  normalizePlaybook(appProblem.id, playbook),
);

export const generatedProblemBatch001Classifications: Record<string, GeneratedProblemClassification> =
  Object.fromEntries(rawProblems.map(({ appProblem, classification }) => [appProblem.id, classification]));

export const generatedProblemBatch001ReviewNotes = Object.fromEntries(
  rawProblems.map(({ appProblem, playbook }) => [
    appProblem.id,
    {
      smokeNotes: playbook.smokeNotes,
      weakTracePattern: playbook.weakTracePattern,
      goodTracePattern: playbook.goodTracePattern,
      originalRecommendedMode: playbook.recommendedMode,
      originalRecommendedModel: playbook.recommendedModel,
      batchAttachments: playbook.attachments,
    },
  ]),
);
