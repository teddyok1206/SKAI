import { NextResponse } from "next/server";
import { z } from "zod";
import { getProblem } from "@/data/problems";
import { operationGuardrails } from "@/lib/constants";
import { judgeAttempt } from "@/lib/judge";

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
  provider: z.enum(["mock", "openai", "groq", "xai", "openrouter", "gemini"]).optional(),
  model: z.string().max(operationGuardrails.maxModelNameChars).optional(),
  createdAt: z.string(),
  latencyMs: z.number().optional(),
  usageInputTokens: z.number().optional(),
  usageOutputTokens: z.number().optional(),
  estimatedCostUsd: z.number().optional(),
  attachments: z.array(attachmentSchema).max(operationGuardrails.maxAttachmentsPerMessage).optional(),
});

const judgeSchema = z.object({
  attemptId: z.string().min(1).max(120),
  problemId: z.string().min(1).max(120),
  trace: z.array(traceEventSchema).max(operationGuardrails.maxTraceEventsPerJudge),
  finalAnswer: z.string().max(operationGuardrails.maxFinalAnswerChars).default(""),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = judgeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const problem = getProblem(parsed.data.problemId);

  if (!problem) {
    return NextResponse.json({ error: "Problem not found." }, { status: 404 });
  }

  const report = await judgeAttempt({
    attemptId: parsed.data.attemptId,
    problem,
    trace: parsed.data.trace,
    finalAnswer: parsed.data.finalAnswer,
  });

  return NextResponse.json(report);
}
