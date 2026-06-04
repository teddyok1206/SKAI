import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { serializeSkaiFileArtifact, skaiFileMimeType, skaiFileName } from "@/lib/skai-format";
import type { PublishedAttempt } from "@/lib/types";

export async function GET(_request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 404 });
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
    return NextResponse.json({ error: "Published attempt not found." }, { status: 404 });
  }

  const publishedAttempt = data.snapshot as PublishedAttempt;
  const artifact = publishedAttempt.skaiFile;

  if (!artifact) {
    return NextResponse.json({ error: ".skai snapshot is not available for this published attempt. Republish the attempt." }, { status: 404 });
  }

  const body = serializeSkaiFileArtifact(artifact);

  return new NextResponse(body, {
    headers: {
      "Content-Type": `${skaiFileMimeType}; charset=utf-8`,
      "Content-Disposition": `attachment; filename="${skaiFileName(publishedAttempt.title)}"`,
      "Cache-Control": "no-store",
    },
  });
}
