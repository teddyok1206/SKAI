import { z } from "zod";
import { buildBranchDiff } from "@/lib/branch-diff";
import { getProvider } from "@/lib/providers";
import type {
  Attempt,
  BranchDiff,
  CounterfactualCausalClaim,
  CounterfactualJudgeReport,
  CounterfactualVerdict,
  Problem,
  ProviderId,
} from "@/lib/types";

const providerIds = ["mock", "openai", "groq", "xai", "openrouter", "gemini"] as const;

const llmCounterfactualSchema = z.object({
  verdict: z.enum(["improved", "regressed", "mixed", "inconclusive"]),
  confidence: z.coerce.number().min(0).max(100),
  summary: z.string().min(1),
  causalClaims: z.array(
    z.object({
      label: z.string().min(1),
      effect: z.enum(["positive", "negative", "neutral", "unknown"]),
      evidence: z.string().min(1),
    }),
  ),
  risks: z.array(z.string()).default([]),
  nextReplaySuggestion: z.string().min(1),
});

function isProviderId(value: string): value is ProviderId {
  return providerIds.includes(value as ProviderId);
}

function defaultJudgeModel(provider: ProviderId) {
  const models: Record<ProviderId, string> = {
    mock: "counterfactual-heuristic-v0",
    openai: process.env.OPENAI_MODEL ?? "gpt-4.1-nano",
    groq: process.env.GROQ_MODEL ?? "llama-3.1-8b-instant",
    xai: process.env.XAI_MODEL ?? "grok-4-fast",
    openrouter: process.env.OPENROUTER_MODEL ?? "openai/gpt-oss-20b",
    gemini: process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite",
  };

  return models[provider];
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function containsSignal(values: string[] | undefined, signal: string) {
  return values?.some((value) => value.includes(signal)) ?? false;
}

function containsGraphTransitionLabel(diff: BranchDiff, signal: string) {
  return diff.graphTransition?.transitionLabels.some((label) => label.includes(signal)) ?? false;
}

function totalEffectScore(diff: BranchDiff) {
  let score = 0;

  if (typeof diff.scoreDelta?.totalDelta === "number") {
    score += diff.scoreDelta.totalDelta * 2;
  }

  if (containsSignal(diff.promptChange?.semanticDelta, "added constraint")) {
    score += 14;
  }

  if (containsSignal(diff.promptChange?.semanticDelta, "added output")) {
    score += 10;
  }

  if (containsSignal(diff.promptChange?.semanticDelta, "added verification")) {
    score += 16;
  }

  if (containsSignal(diff.promptChange?.semanticDelta, "added material")) {
    score += 12;
  }

  if (containsSignal(diff.promptChange?.semanticDelta, "more specific")) {
    score += 10;
  }

  if (containsSignal(diff.responseChange?.observedChange, "more developed")) {
    score += 8;
  }

  if (diff.processDelta.verificationMovedEarlier) {
    score += 12;
  }

  if (diff.processDelta.childAttachmentCount > diff.processDelta.parentAttachmentCount) {
    score += 8;
  }

  if (containsGraphTransitionLabel(diff, "bottleneck signal reduced")) {
    score += 14;
  }

  if (containsGraphTransitionLabel(diff, "verification evidence introduced")) {
    score += 10;
  }

  if (containsGraphTransitionLabel(diff, "material grounding changed")) {
    score += 6;
  }

  if (containsGraphTransitionLabel(diff, "new bottleneck signal appeared")) {
    score -= 12;
  }

  if (diff.processDelta.tokenDelta > 2500 && (diff.scoreDelta?.totalDelta ?? 0) <= 0) {
    score -= 12;
  }

  if (!diff.promptChange?.after) {
    score -= 18;
  }

  if (!diff.responseChange?.after) {
    score -= 8;
  }

  return score;
}

function verdictFromScore(score: number): CounterfactualVerdict {
  if (score >= 24) {
    return "improved";
  }

  if (score <= -16) {
    return "regressed";
  }

  if (Math.abs(score) >= 8) {
    return "mixed";
  }

  return "inconclusive";
}

function buildClaims(diff: BranchDiff): CounterfactualCausalClaim[] {
  const claims: CounterfactualCausalClaim[] = [];
  const transition = diff.graphTransition;

  if (transition?.transitionLabels.length) {
    claims.push({
      label: "Graph state changed",
      effect:
        transition.transitionLabels.some((item) => item.includes("bottleneck signal reduced") || item.includes("verification"))
          ? "positive"
          : transition.transitionLabels.some((item) => item.includes("new bottleneck"))
            ? "negative"
            : "neutral",
      evidence: transition.transitionLabels.join("; "),
    });
  }

  if (transition && (transition.annotationDelta.added.length > 0 || transition.annotationDelta.removed.length > 0)) {
    claims.push({
      label: "Graph annotations changed",
      effect:
        transition.annotationDelta.added.some((item) => item.severity === "positive") ||
        transition.annotationDelta.removed.some((item) => item.kind === "bottleneck")
          ? "positive"
          : transition.annotationDelta.added.some((item) => item.kind === "bottleneck" || item.severity === "critical")
            ? "negative"
            : "neutral",
      evidence: [
        transition.annotationDelta.added.length > 0
          ? `added ${transition.annotationDelta.added.map((item) => item.title).join(", ")}`
          : "",
        transition.annotationDelta.removed.length > 0
          ? `removed ${transition.annotationDelta.removed.map((item) => item.title).join(", ")}`
          : "",
      ]
        .filter(Boolean)
        .join("; "),
    });
  }

  if (diff.promptChange?.semanticDelta.length) {
    claims.push({
      label: "Breakpoint prompt changed",
      effect:
        diff.promptChange.semanticDelta.some((item) => item.includes("added") || item.includes("more specific"))
          ? "positive"
          : "neutral",
      evidence: diff.promptChange.semanticDelta.join("; "),
    });
  }

  if (diff.responseChange?.observedChange.length) {
    claims.push({
      label: "Model response changed",
      effect: diff.responseChange.observedChange.some((item) => item.includes("more developed") || item.includes("new orchestration"))
        ? "positive"
        : "neutral",
      evidence: diff.responseChange.observedChange.join("; "),
    });
  }

  if (diff.processDelta.verificationMovedEarlier) {
    claims.push({
      label: "Verification moved earlier",
      effect: "positive",
      evidence: "The child branch contains a verification-oriented prompt no later than the parent trace.",
    });
  }

  if (diff.processDelta.materialUseChanged) {
    claims.push({
      label: "Material use changed",
      effect: diff.processDelta.childAttachmentCount > diff.processDelta.parentAttachmentCount ? "positive" : "neutral",
      evidence: `Parent attachments: ${diff.processDelta.parentAttachmentCount}; child attachments: ${diff.processDelta.childAttachmentCount}.`,
    });
  }

  if (typeof diff.scoreDelta?.totalDelta === "number") {
    claims.push({
      label: "Score changed",
      effect: diff.scoreDelta.totalDelta > 0 ? "positive" : diff.scoreDelta.totalDelta < 0 ? "negative" : "neutral",
      evidence: `Total score delta: ${diff.scoreDelta.totalDelta}.`,
    });
  }

  return claims.length > 0
    ? claims.slice(0, 6)
    : [
        {
          label: "Insufficient evidence",
          effect: "unknown",
          evidence: "The branch does not yet contain enough comparable prompt/response evidence.",
        },
      ];
}

function heuristicReport(parentAttempt: Attempt, childAttempt: Attempt, diff: BranchDiff): CounterfactualJudgeReport {
  const score = totalEffectScore(diff);
  const verdict = verdictFromScore(score);
  const confidence = clamp(48 + Math.abs(score) * 1.4 + (diff.scoreDelta ? 8 : 0));
  const risks: string[] = [];

  if (!diff.promptChange?.after) {
    risks.push("The child branch does not yet contain a replacement or follow-up user prompt at the breakpoint.");
  }

  if (!diff.responseChange?.after) {
    risks.push("The child branch does not yet contain a model response after the changed prompt.");
  }

  if (!parentAttempt.scoreReport || !childAttempt.scoreReport) {
    risks.push("At least one attempt is missing a score report, so score delta evidence is incomplete.");
  }

  const summaryByVerdict: Record<CounterfactualVerdict, string> = {
    improved:
      "The branch likely improved the orchestration. The changed prompt or follow-up path added stronger control signals and the available evidence points in a better direction.",
    regressed:
      "The branch likely regressed. The changed path added cost or removed useful control signals without enough evidence of better output.",
    mixed:
      "The branch had mixed effects. Some process signals improved, but the evidence is not consistently better across response, cost, or score.",
    inconclusive:
      "The branch is not yet conclusive. There is not enough comparable evidence to say the breakpoint change caused a meaningful improvement.",
  };

  return {
    id: crypto.randomUUID(),
    parentAttemptId: parentAttempt.id,
    childAttemptId: childAttempt.id,
    diffId: diff.id,
    verdict,
    confidence,
    judgeMode: "heuristic",
    judgeProvider: "mock",
    judgeModel: "counterfactual-heuristic-v0",
    summary: summaryByVerdict[verdict],
    causalClaims: buildClaims(diff),
    risks,
    nextReplaySuggestion:
      verdict === "improved"
        ? "Keep the changed prompt pattern and run one more branch that isolates only one additional variable, such as verification or material use."
        : "Create another branch from the same breakpoint and change exactly one thing: goal, constraint, output format, material use, or verification.",
    branchDiff: diff,
    createdAt: new Date().toISOString(),
  };
}

function extractJsonObject(value: string) {
  const withoutFence = value.replace(/```json|```/g, "").trim();
  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Counterfactual judge response did not contain a JSON object.");
  }

  return JSON.parse(withoutFence.slice(start, end + 1)) as unknown;
}

function llmConfig() {
  if (process.env.SKAI_COUNTERFACTUAL_JUDGE_MODE !== "llm") {
    return undefined;
  }

  const provider = process.env.SKAI_COUNTERFACTUAL_JUDGE_PROVIDER?.trim() ?? process.env.SKAI_JUDGE_PROVIDER?.trim() ?? "gemini";

  if (!isProviderId(provider) || provider === "mock") {
    return undefined;
  }

  return {
    provider,
    model:
      process.env.SKAI_COUNTERFACTUAL_JUDGE_MODEL?.trim() ||
      process.env.SKAI_JUDGE_MODEL?.trim() ||
      defaultJudgeModel(provider),
  };
}

async function tryLlmReport(input: {
  problem: Problem;
  parentAttempt: Attempt;
  childAttempt: Attempt;
  diff: BranchDiff;
  fallback: CounterfactualJudgeReport;
}) {
  const config = llmConfig();

  if (!config) {
    return input.fallback;
  }

  try {
    const provider = getProvider(config.provider);
    const response = await provider.complete({
      provider: config.provider,
      model: config.model,
      problem: input.problem,
      temperature: 0.1,
      systemPrompt: [
        "You are SKAI Counterfactual Judge.",
        "Evaluate whether a branch replay actually improved the human orchestration process.",
        "Compare process quality, not only final answer quality.",
        "Use only evidence from the supplied parent/child diff.",
        "Return only valid JSON without markdown fences.",
      ].join(" "),
      contextMessage: JSON.stringify(
        {
          problem: {
            id: input.problem.id,
            title: input.problem.title,
            goal: input.problem.userGoal,
            constraints: input.problem.constraints,
          },
          branchDiff: input.diff,
        },
        null,
        2,
      ),
      messages: [
        {
          role: "user",
          content: [
            "Return JSON with:",
            "verdict: improved | regressed | mixed | inconclusive",
            "confidence: number 0-100",
            "summary: string",
            "causalClaims: array of {label, effect, evidence}",
            "risks: string[]",
            "nextReplaySuggestion: string",
          ].join("\n"),
        },
      ],
    });
    const parsed = llmCounterfactualSchema.parse(extractJsonObject(response.message));

    return {
      ...input.fallback,
      verdict: parsed.verdict,
      confidence: clamp(parsed.confidence),
      judgeMode: "llm" as const,
      judgeProvider: config.provider,
      judgeModel: config.model,
      summary: parsed.summary,
      causalClaims: parsed.causalClaims.slice(0, 6),
      risks: parsed.risks.slice(0, 6),
      nextReplaySuggestion: parsed.nextReplaySuggestion,
    };
  } catch (error) {
    return {
      ...input.fallback,
      risks: [
        ...input.fallback.risks,
        `LLM counterfactual judge failed; heuristic report used. ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      ].slice(0, 6),
    };
  }
}

export async function judgeCounterfactual(input: {
  problem: Problem;
  parentAttempt: Attempt;
  childAttempt: Attempt;
}): Promise<CounterfactualJudgeReport> {
  const diff = buildBranchDiff(input.parentAttempt, input.childAttempt);
  const fallback = heuristicReport(input.parentAttempt, input.childAttempt, diff);

  return tryLlmReport({
    problem: input.problem,
    parentAttempt: input.parentAttempt,
    childAttempt: input.childAttempt,
    diff,
    fallback,
  });
}
