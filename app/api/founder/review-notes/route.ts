import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { FounderCalibrationLabel, FounderReviewNote } from "@/lib/types";

const uuidSchema = z.string().uuid();
const calibrationLabelSchema = z
  .object({
    verdict: z.enum(["judge_ok", "too_harsh", "too_generous", "missed_bottleneck", "needs_review"]),
    expectedScore: z.number().min(0).max(100).optional(),
    axisFocus: z
      .enum([
        "problem_definition",
        "decomposition",
        "instruction_clarity",
        "adaptation",
        "verification",
        "efficiency",
        "final_quality",
      ])
      .optional(),
    note: z.string().max(4000).optional(),
    updatedAt: z.string(),
  })
  .optional();

const reviewNoteSchema = z.object({
  attemptId: z.string().min(1).max(160),
  note: z.string().max(4000),
  calibrationLabel: calibrationLabelSchema,
  updatedAt: z.string(),
});

type FounderReviewNoteRow = {
  attempt_id: string;
  note: string;
  calibration_label: FounderCalibrationLabel | null;
  updated_at: string;
};

function isUuid(value: string) {
  return uuidSchema.safeParse(value).success;
}

function rowToNote(row: FounderReviewNoteRow): FounderReviewNote {
  return {
    attemptId: row.attempt_id,
    note: row.note,
    calibrationLabel: row.calibration_label ?? undefined,
    updatedAt: row.updated_at,
  };
}

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ mode: "local", notes: [] });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ mode: "local", notes: [], reason: "not_authenticated" });
  }

  const url = new URL(request.url);
  const attemptIds = (url.searchParams.get("attemptIds") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(isUuid)
    .slice(0, 100);

  let query = supabase
    .from("founder_review_notes")
    .select("attempt_id,note,calibration_label,updated_at")
    .eq("reviewer_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(300);

  if (attemptIds.length > 0) {
    query = query.in("attempt_id", attemptIds);
  }

  const { data, error } = await query.returns<FounderReviewNoteRow[]>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ mode: "supabase", notes: (data ?? []).map(rowToNote) });
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = reviewNoteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const note = parsed.data;

  if (!isUuid(note.attemptId)) {
    return NextResponse.json({ mode: "local", synced: false, reason: "local_attempt_id" });
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

  const { error } = await supabase.from("founder_review_notes").upsert(
    {
      attempt_id: note.attemptId,
      reviewer_id: user.id,
      note: note.note.trim(),
      calibration_label: note.calibrationLabel ?? null,
      updated_at: note.updatedAt,
    },
    { onConflict: "attempt_id,reviewer_id" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ mode: "supabase", synced: true });
}
