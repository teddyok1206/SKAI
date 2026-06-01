import { NextResponse } from "next/server";
import { z } from "zod";
import { getProblem } from "@/data/problems";
import { operationGuardrails } from "@/lib/constants";
import { compileProviderContext } from "@/lib/context-compiler";
import { completeWithFallback } from "@/lib/providers";

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

const chatSchema = z.object({
  problemId: z.string().min(1).max(120),
  provider: z.enum(["mock", "openai", "groq", "xai", "openrouter", "gemini"]).default("mock"),
  model: z.string().min(1).max(operationGuardrails.maxModelNameChars).default("mock-orchestrator"),
  branch: z.object({
    id: z.string().min(1).max(120),
    mode: z.enum(["breakpoint_replay"]),
    parentAttemptId: z.string().min(1).max(120),
    parentTraceEventId: z.string().min(1).max(120),
    parentTraceIndex: z.number().int().nonnegative(),
    parentPairId: z.string().max(240).optional(),
    label: z.string().min(1).max(220),
    createdAt: z.string(),
  }).optional(),
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().max(operationGuardrails.maxMessageContentChars),
      attachments: z.array(attachmentSchema).max(operationGuardrails.maxAttachmentsPerMessage).optional(),
      sourceTraceEventId: z.string().min(1).max(120).optional(),
      branchId: z.string().min(1).max(120).optional(),
    }),
  ).min(1).max(operationGuardrails.maxTraceEventsPerJudge),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = chatSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const problem = getProblem(parsed.data.problemId);

  if (!problem) {
    return NextResponse.json({ error: "Problem not found." }, { status: 404 });
  }

  if (!problem.allowedProviders.includes(parsed.data.provider)) {
    return NextResponse.json({ error: "Provider is not allowed for this problem." }, { status: 400 });
  }

  try {
    const compiledContext = compileProviderContext({
      problem,
      messages: parsed.data.messages,
      branch: parsed.data.branch,
    });
    const response = await completeWithFallback({
      provider: parsed.data.provider,
      model: parsed.data.model,
      problem,
      messages: compiledContext.messages,
      systemPrompt: compiledContext.systemPrompt,
      contextMessage: compiledContext.contextMessage,
    });

    return NextResponse.json({
      ...response,
      contextDebug: compiledContext.debugSnapshot,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Provider request failed." },
      { status: 502 },
    );
  }
}
