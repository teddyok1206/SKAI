import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { operationGuardrails } from "@/lib/constants";
import type { PromptComment } from "@/lib/types";

const commentSchema = z.object({
  id: z.string().min(1).max(120),
  attemptId: z.string().min(1).max(120),
  traceEventId: z.string().min(1).max(120),
  parentId: z.string().min(1).max(120).optional(),
  authorName: z.string().trim().min(1).max(40),
  body: z.string().trim().min(1).max(operationGuardrails.maxCommentBodyChars),
  createdAt: z.string(),
});
const commentRequestSchema = z.object({ comment: commentSchema });

function rowToComment(row: {
  id: string;
  attempt_id: string;
  trace_event_id: string;
  parent_id: string | null;
  author_label: string | null;
  body: string;
  created_at: string;
}): PromptComment {
  return {
    id: row.id,
    attemptId: row.attempt_id,
    traceEventId: row.trace_event_id,
    parentId: row.parent_id ?? undefined,
    authorName: row.author_label ?? "SKAI learner",
    body: row.body,
    createdAt: row.created_at,
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const attemptId = url.searchParams.get("attemptId");

  if (!attemptId) {
    return NextResponse.json({ error: "attemptId is required." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ mode: "local", comments: [] });
  }

  const { data: publishedAttempt, error: publishedError } = await supabase
    .from("published_attempts")
    .select("attempt_id")
    .eq("attempt_id", attemptId)
    .maybeSingle();

  if (publishedError) {
    return NextResponse.json({ error: publishedError.message }, { status: 500 });
  }

  if (!publishedAttempt) {
    return NextResponse.json({ mode: "supabase", comments: [] });
  }

  const { data, error } = await supabase
    .from("prompt_comments")
    .select("id,attempt_id,trace_event_id,parent_id,author_label,body,created_at")
    .eq("attempt_id", attemptId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ mode: "supabase", comments: data.map(rowToComment) });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = commentRequestSchema.safeParse(body);

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

  const { comment } = parsed.data;
  const { data: publishedAttempt, error: publishedError } = await supabase
    .from("published_attempts")
    .select("attempt_id")
    .eq("attempt_id", comment.attemptId)
    .maybeSingle();

  if (publishedError) {
    return NextResponse.json({ error: publishedError.message }, { status: 500 });
  }

  if (!publishedAttempt) {
    return NextResponse.json({ error: "Comments are only allowed on published attempts." }, { status: 403 });
  }

  const { data: traceEvent, error: traceError } = await supabase
    .from("trace_events")
    .select("id")
    .eq("id", comment.traceEventId)
    .eq("attempt_id", comment.attemptId)
    .maybeSingle();

  if (traceError) {
    return NextResponse.json({ error: traceError.message }, { status: 500 });
  }

  if (!traceEvent) {
    return NextResponse.json({ error: "Trace event does not belong to this attempt." }, { status: 400 });
  }

  if (comment.parentId) {
    const { data: parentComment, error: parentError } = await supabase
      .from("prompt_comments")
      .select("id")
      .eq("id", comment.parentId)
      .eq("attempt_id", comment.attemptId)
      .eq("trace_event_id", comment.traceEventId)
      .maybeSingle();

    if (parentError) {
      return NextResponse.json({ error: parentError.message }, { status: 500 });
    }

    if (!parentComment) {
      return NextResponse.json({ error: "Parent comment does not belong to this trace event." }, { status: 400 });
    }
  }

  const authorLabel = comment.authorName.trim() || user.email?.split("@")[0] || "SKAI learner";
  const { error } = await supabase.from("prompt_comments").insert({
    id: comment.id,
    attempt_id: comment.attemptId,
    trace_event_id: comment.traceEventId,
    parent_id: comment.parentId ?? null,
    user_id: user.id,
    author_label: authorLabel.slice(0, 40),
    body: comment.body.trim(),
    created_at: comment.createdAt,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ mode: "supabase", synced: true });
}
