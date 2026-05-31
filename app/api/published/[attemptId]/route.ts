import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(_request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ mode: "local", publishedAttempt: null }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("published_attempts")
    .select("snapshot")
    .or(`attempt_id.eq.${attemptId},id.eq.${attemptId}`)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data?.snapshot) {
    return NextResponse.json({ publishedAttempt: null }, { status: 404 });
  }

  return NextResponse.json({ mode: "supabase", publishedAttempt: data.snapshot });
}

