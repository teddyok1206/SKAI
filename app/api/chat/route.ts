import { NextResponse } from "next/server";
import { z } from "zod";
import { getProblem } from "@/data/problems";
import { completeWithFallback } from "@/lib/providers";

const chatSchema = z.object({
  problemId: z.string(),
  provider: z.enum(["mock", "openai", "groq", "xai", "openrouter", "gemini"]).default("mock"),
  model: z.string().default("mock-orchestrator"),
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string(),
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
    }),
  ),
});

export async function POST(request: Request) {
  const parsed = chatSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const problem = getProblem(parsed.data.problemId);

  if (!problem) {
    return NextResponse.json({ error: "Problem not found." }, { status: 404 });
  }

  const response = await completeWithFallback({
    provider: parsed.data.provider,
    model: parsed.data.model,
    problem,
    messages: parsed.data.messages,
  });

  return NextResponse.json(response);
}
