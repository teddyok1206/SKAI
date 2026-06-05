import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { fallbackProfile, type MyPageProfile } from "@/lib/my-page";

const profileUpdateSchema = z.object({
  displayName: z.string().trim().min(1).max(60),
  bio: z.string().trim().max(240).optional(),
  preferredLocale: z.enum(["ko", "en"]),
  defaultAuthorLabel: z.string().trim().min(1).max(60),
});

type ProfileRow = {
  display_name: string;
  bio: string | null;
  preferred_locale: "ko" | "en";
  default_author_label: string;
  updated_at: string;
};

function rowToProfile(row: ProfileRow): MyPageProfile {
  return {
    displayName: row.display_name,
    bio: row.bio ?? undefined,
    preferredLocale: row.preferred_locale,
    defaultAuthorLabel: row.default_author_label,
    updatedAt: row.updated_at,
  };
}

export async function PATCH(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = profileUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const fallback = fallbackProfile({
    email: user.email,
    metadataName:
      typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : typeof user.user_metadata?.name === "string"
          ? user.user_metadata.name
          : undefined,
  });
  const updatedAt = new Date().toISOString();
  const payload = {
    user_id: user.id,
    display_name: parsed.data.displayName || fallback.displayName,
    bio: parsed.data.bio?.trim() || null,
    preferred_locale: parsed.data.preferredLocale,
    default_author_label: parsed.data.defaultAuthorLabel || fallback.defaultAuthorLabel,
    updated_at: updatedAt,
  };

  const result = await supabase
    .from("user_profiles")
    .upsert(payload)
    .select("display_name,bio,preferred_locale,default_author_label,updated_at")
    .single<ProfileRow>();

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: rowToProfile(result.data) });
}
