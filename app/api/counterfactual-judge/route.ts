import { NextResponse } from "next/server";
import { z } from "zod";
import { getProblem } from "@/data/problems";
import { operationGuardrails } from "@/lib/constants";
import { judgeCounterfactual } from "@/lib/counterfactual-judge";
import type { Attempt } from "@/lib/types";

const providerSchema = z.enum(["mock", "openai", "groq", "xai", "openrouter", "gemini"]);

const attachmentSchema = z.object({
  id: z.string().min(1).max(120),
  name: z.string().min(1).max(180),
  mimeType: z.string().min(1).max(160),
  size: z.number().nonnegative().max(operationGuardrails.maxUploadBytes),
  source: z.enum(["problem_material", "upload"]),
  materialId: z.string().max(120).optional(),
  textContent: z.string().max(operationGuardrails.maxAttachmentTextChars + 128).optional(),
  dataUrl: z.string().max(operationGuardrails.maxAttachmentDataUrlChars).optional(),
  createdAt: z.string(),
});

const traceEventSchema = z.object({
  id: z.string().min(1).max(120),
  attemptId: z.string().min(1).max(120),
  problemId: z.string().min(1).max(120),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().max(operationGuardrails.maxMessageContentChars),
  summary: z.string().max(600).optional(),
  provider: providerSchema.optional(),
  model: z.string().max(operationGuardrails.maxModelNameChars).optional(),
  createdAt: z.string(),
  latencyMs: z.number().optional(),
  usageInputTokens: z.number().optional(),
  usageOutputTokens: z.number().optional(),
  estimatedCostUsd: z.number().optional(),
  attachments: z.array(attachmentSchema).max(operationGuardrails.maxAttachmentsPerMessage).optional(),
  sourceTraceEventId: z.string().min(1).max(120).optional(),
  branchId: z.string().min(1).max(120).optional(),
});

const branchSchema = z.object({
  id: z.string().min(1).max(120),
  mode: z.enum(["breakpoint_replay"]),
  parentAttemptId: z.string().min(1).max(120),
  parentTraceEventId: z.string().min(1).max(120),
  parentTraceIndex: z.number().int().nonnegative(),
  parentPairId: z.string().max(240).optional(),
  label: z.string().min(1).max(220),
  createdAt: z.string(),
});

const attemptSchema = z
  .object({
    id: z.string().min(1).max(120),
    problemId: z.string().min(1).max(120),
    userId: z.string().min(1).max(120),
    status: z.enum(["draft", "submitted", "judged", "published"]),
    title: z.string().min(1).max(220),
    provider: providerSchema,
    model: z.string().max(operationGuardrails.maxModelNameChars),
    trace: z.array(traceEventSchema).max(operationGuardrails.maxTraceEventsPerJudge),
    finalAnswer: z.string().max(operationGuardrails.maxFinalAnswerChars).optional(),
    scoreReport: z.unknown().optional(),
    branch: branchSchema.optional(),
    counterfactualReport: z.unknown().optional(),
    publishedAt: z.string().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .passthrough();

const requestSchema = z.object({
  problemId: z.string().min(1).max(120),
  parentAttempt: attemptSchema,
  childAttempt: attemptSchema,
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const problem = getProblem(parsed.data.problemId);

  if (!problem) {
    return NextResponse.json({ error: "Problem not found." }, { status: 404 });
  }

  if (parsed.data.parentAttempt.problemId !== problem.id || parsed.data.childAttempt.problemId !== problem.id) {
    return NextResponse.json({ error: "Parent and child attempts must belong to the requested problem." }, { status: 400 });
  }

  if (parsed.data.childAttempt.branch?.parentAttemptId !== parsed.data.parentAttempt.id) {
    return NextResponse.json({ error: "Child attempt does not branch from the supplied parent attempt." }, { status: 400 });
  }

  try {
    const report = await judgeCounterfactual({
      problem,
      parentAttempt: parsed.data.parentAttempt as Attempt,
      childAttempt: parsed.data.childAttempt as Attempt,
    });

    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Counterfactual judge failed." },
      { status: 400 },
    );
  }
}
