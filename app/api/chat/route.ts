import { NextResponse } from "next/server";
import { z } from "zod";
import { getProblem } from "@/data/problems";
import { operationGuardrails } from "@/lib/constants";
import { compileProviderContextCached } from "@/lib/context-compiler";
import { completeProviderRequest, streamProviderRequest } from "@/lib/providers";

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
  provider: z.enum(["mock", "openai", "groq", "xai", "openrouter", "gemini"]),
  model: z.string().min(1).max(operationGuardrails.maxModelNameChars),
  stream: z.boolean().optional(),
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
    const compiledContext = compileProviderContextCached({
      messages: parsed.data.messages,
      branch: parsed.data.branch,
    });

    if (parsed.data.stream) {
      const encoder = new TextEncoder();

      const stream = new ReadableStream({
        async start(controller) {
          function send(payload: unknown) {
            controller.enqueue(encoder.encode(`${JSON.stringify(payload)}\n`));
          }

          try {
            send({
              type: "context",
              compiledContext: compiledContext.metadata,
            });

            for await (const event of streamProviderRequest({
              provider: parsed.data.provider,
              model: parsed.data.model,
              problem,
              messages: compiledContext.messages,
            })) {
              if (event.type === "ready" || event.type === "done") {
                send({
                  ...event,
                  compiledContext: compiledContext.metadata,
                });
                continue;
              }

              send(event);
            }
          } catch (error) {
            send({
              type: "error",
              error: error instanceof Error ? error.message : "Provider stream failed.",
            });
          } finally {
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "application/x-ndjson; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          "X-Accel-Buffering": "no",
        },
      });
    }

    const response = await completeProviderRequest({
      provider: parsed.data.provider,
      model: parsed.data.model,
      problem,
      messages: compiledContext.messages,
    });

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Provider request failed." },
      { status: 502 },
    );
  }
}
