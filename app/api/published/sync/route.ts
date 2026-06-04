import { NextResponse } from "next/server";
import { z } from "zod";
import { operationGuardrails } from "@/lib/constants";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const publishedSchema = z.object({
  published: z.object({
    id: z.string().min(1).max(120),
    attemptId: z.string().min(1).max(120),
    problemId: z.string().min(1).max(120),
    title: z.string().min(1).max(220),
    workflow: z.array(z.unknown()).max(20),
    trace: z.array(z.unknown()).max(operationGuardrails.maxTraceEventsPerJudge),
    scoreReport: z.unknown(),
    branch: z.unknown().optional(),
    counterfactualReport: z.unknown().optional(),
    solvingMode: z.enum(["single_model", "material_grounded", "verification_drill"]).optional(),
    skaiFile: z.unknown().optional(),
    createdAt: z.string(),
  }),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = publishedSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ mode: "local", synced: false, reason: "supabase_not_configured" });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ mode: "local", synced: false, reason: "not_authenticated" });
  }

  const { published } = parsed.data;

  if (JSON.stringify(published).length > operationGuardrails.maxPublishedSnapshotChars) {
    return NextResponse.json({ error: "Published attempt snapshot is too large." }, { status: 413 });
  }

  const result = await supabase.from("published_attempts").upsert({
    id: published.id,
    attempt_id: published.attemptId,
    problem_id: published.problemId,
    title: published.title,
    workflow: published.workflow,
    snapshot: published,
    created_at: published.createdAt,
  });

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({ mode: "supabase", synced: true });
}
