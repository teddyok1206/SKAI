import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const publishedSchema = z.object({
  published: z.object({
    id: z.string(),
    attemptId: z.string(),
    problemId: z.string(),
    title: z.string(),
    workflow: z.array(z.unknown()),
    trace: z.array(z.unknown()),
    scoreReport: z.unknown(),
    createdAt: z.string(),
  }),
});

export async function POST(request: Request) {
  const parsed = publishedSchema.safeParse(await request.json());

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

