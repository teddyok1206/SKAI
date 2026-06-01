import { NextResponse } from "next/server";
import { z } from "zod";
import { getProblem } from "@/data/problems";
import { judgeAttempt } from "@/lib/judge";

const traceEventSchema = z.object({
  id: z.string(),
  attemptId: z.string(),
  problemId: z.string(),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  summary: z.string().optional(),
  provider: z.enum(["mock", "openai", "groq", "xai", "openrouter", "gemini"]).optional(),
  model: z.string().optional(),
  createdAt: z.string(),
  latencyMs: z.number().optional(),
  usageInputTokens: z.number().optional(),
  usageOutputTokens: z.number().optional(),
  estimatedCostUsd: z.number().optional(),
  attachments: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        mimeType: z.string(),
        size: z.number(),
        source: z.enum(["problem_material", "upload"]),
        materialId: z.string().optional(),
        textContent: z.string().optional(),
        dataUrl: z.string().optional(),
        createdAt: z.string(),
      }),
    )
    .optional(),
});

const judgeSchema = z.object({
  attemptId: z.string(),
  problemId: z.string(),
  trace: z.array(traceEventSchema),
  finalAnswer: z.string().default(""),
});

export async function POST(request: Request) {
  const parsed = judgeSchema.safeParse(await request.json());

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
