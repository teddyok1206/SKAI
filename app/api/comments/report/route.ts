import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const reportSchema = z.object({
  commentId: z.string().min(1).max(120),
  attemptId: z.string().min(1).max(120),
  reason: z.string().trim().min(1).max(500),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = reportSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ mode: "local", reported: false, reason: "supabase_not_configured" });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ mode: "local", reported: false, reason: "not_authenticated" });
  }

  const { data: comment, error: commentError } = await supabase
    .from("prompt_comments")
    .select("id,attempt_id")
    .eq("id", parsed.data.commentId)
    .eq("attempt_id", parsed.data.attemptId)
    .maybeSingle();

  if (commentError) {
    return NextResponse.json({ error: commentError.message }, { status: 500 });
  }

  if (!comment) {
    return NextResponse.json({ error: "Comment not found." }, { status: 404 });
  }

  const { error } = await supabase.from("prompt_comment_reports").insert({
    comment_id: parsed.data.commentId,
    attempt_id: parsed.data.attemptId,
    user_id: user.id,
    reason: parsed.data.reason,
  });

  if (error) {
    if (error.message.toLowerCase().includes("duplicate")) {
      return NextResponse.json({ mode: "supabase", reported: true, duplicate: true });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ mode: "supabase", reported: true });
}
