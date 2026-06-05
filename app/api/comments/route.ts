import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { operationGuardrails } from "@/lib/constants";
import { moderateComment } from "@/lib/comment-moderation";
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
const commentUpdateRequestSchema = z.object({
  commentId: z.string().min(1).max(120),
  attemptId: z.string().min(1).max(120),
  body: z.string().trim().min(1).max(operationGuardrails.maxCommentBodyChars),
  authorName: z.string().trim().min(1).max(40),
});
const commentDeleteRequestSchema = z.object({
  commentId: z.string().min(1).max(120),
  attemptId: z.string().min(1).max(120),
});

function isGenericAuthorLabel(value: string) {
  const normalized = value.trim().toLowerCase();
  return !normalized || normalized === "skai learner";
}

async function profileAuthorLabel(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  user: { id: string; email?: string | null },
) {
  const emailFallback = user.email?.split("@")[0]?.trim() || "SKAI learner";
  const result = await supabase
    .from("user_profiles")
    .select("default_author_label,display_name")
    .eq("user_id", user.id)
    .maybeSingle<{ default_author_label: string | null; display_name: string | null }>();

  if (result.error) {
    return emailFallback;
  }

  return result.data?.default_author_label?.trim() || result.data?.display_name?.trim() || emailFallback;
}

function rowToComment(row: {
  id: string;
  attempt_id: string;
  trace_event_id: string;
  parent_id: string | null;
  author_label: string | null;
  body: string;
  created_at: string;
  updated_at?: string | null;
  deleted_at?: string | null;
  report_count?: number | null;
}): PromptComment {
  return {
    id: row.id,
    attemptId: row.attempt_id,
    traceEventId: row.trace_event_id,
    parentId: row.parent_id ?? undefined,
    authorName: row.author_label ?? "SKAI learner",
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
    deletedAt: row.deleted_at ?? undefined,
    reportCount: row.report_count ?? 0,
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
    .select("id,attempt_id,trace_event_id,parent_id,author_label,body,created_at,updated_at,deleted_at,report_count")
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
  const fallbackAuthorName = await profileAuthorLabel(supabase, user);
  const authorName = isGenericAuthorLabel(comment.authorName) ? fallbackAuthorName : comment.authorName;
  const moderation = moderateComment({
    body: comment.body,
    authorName,
    maxBodyChars: operationGuardrails.maxCommentBodyChars,
  });

  if (!moderation.ok) {
    return NextResponse.json({ error: moderation.blockedReason ?? "Comment was blocked." }, { status: 400 });
  }

  const safeComment = {
    ...comment,
    authorName: moderation.authorName,
    body: moderation.body,
  };
  const { data: publishedAttempt, error: publishedError } = await supabase
    .from("published_attempts")
    .select("attempt_id")
    .eq("attempt_id", safeComment.attemptId)
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
    .eq("id", safeComment.traceEventId)
    .eq("attempt_id", safeComment.attemptId)
    .maybeSingle();

  if (traceError) {
    return NextResponse.json({ error: traceError.message }, { status: 500 });
  }

  if (!traceEvent) {
    return NextResponse.json({ error: "Trace event does not belong to this attempt." }, { status: 400 });
  }

  if (safeComment.parentId) {
    const { data: parentComment, error: parentError } = await supabase
      .from("prompt_comments")
      .select("id")
      .eq("id", safeComment.parentId)
      .eq("attempt_id", safeComment.attemptId)
      .eq("trace_event_id", safeComment.traceEventId)
      .maybeSingle();

    if (parentError) {
      return NextResponse.json({ error: parentError.message }, { status: 500 });
    }

    if (!parentComment) {
      return NextResponse.json({ error: "Parent comment does not belong to this trace event." }, { status: 400 });
    }
  }

  const authorLabel = safeComment.authorName.trim() || fallbackAuthorName;
  const { error } = await supabase.from("prompt_comments").insert({
    id: safeComment.id,
    attempt_id: safeComment.attemptId,
    trace_event_id: safeComment.traceEventId,
    parent_id: safeComment.parentId ?? null,
    user_id: user.id,
    author_label: authorLabel.slice(0, 40),
    body: safeComment.body.trim(),
    created_at: safeComment.createdAt,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ mode: "supabase", synced: true });
}

export async function PATCH(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = commentUpdateRequestSchema.safeParse(body);

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

  const moderation = moderateComment({
    body: parsed.data.body,
    authorName: parsed.data.authorName,
    maxBodyChars: operationGuardrails.maxCommentBodyChars,
  });

  if (!moderation.ok) {
    return NextResponse.json({ error: moderation.blockedReason ?? "Comment was blocked." }, { status: 400 });
  }

  const updatedAt = new Date().toISOString();
  const { error } = await supabase
    .from("prompt_comments")
    .update({
      body: moderation.body,
      author_label: moderation.authorName,
      updated_at: updatedAt,
      deleted_at: null,
    })
    .eq("id", parsed.data.commentId)
    .eq("attempt_id", parsed.data.attemptId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ mode: "supabase", synced: true, updatedAt });
}

export async function DELETE(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = commentDeleteRequestSchema.safeParse(body);

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

  const deletedAt = new Date().toISOString();
  const { error } = await supabase
    .from("prompt_comments")
    .update({
      body: "Comment deleted.",
      updated_at: deletedAt,
      deleted_at: deletedAt,
    })
    .eq("id", parsed.data.commentId)
    .eq("attempt_id", parsed.data.attemptId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ mode: "supabase", synced: true, deletedAt });
}
