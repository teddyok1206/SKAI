import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

function requestOrigin(request: Request, fallbackOrigin: string) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");

  if (!host) {
    return fallbackOrigin;
  }

  const forwardedProto = request.headers.get("x-forwarded-proto");
  const protocol = forwardedProto ?? new URL(fallbackOrigin).protocol.replace(":", "");

  return `${protocol}://${host}`;
}

function localRedirectPath(next: string | null, origin: string) {
  if (!next) {
    return "/";
  }

  try {
    const parsed = new URL(next, origin);

    if (parsed.origin !== origin) {
      return "/";
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/";
  }
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = requestOrigin(request, requestUrl.origin);
  const code = requestUrl.searchParams.get("code");
  const oauthError = requestUrl.searchParams.get("error");
  const oauthErrorDescription = requestUrl.searchParams.get("error_description");
  const next = localRedirectPath(requestUrl.searchParams.get("next"), origin);

  if (oauthError) {
    const message = oauthErrorDescription ?? oauthError;
    return NextResponse.redirect(
      new URL(`/?auth=error&message=${encodeURIComponent(message)}`, origin),
    );
  }

  if (!code) {
    return NextResponse.redirect(new URL("/?auth=missing_code", origin));
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.redirect(new URL("/?auth=not_configured", origin));
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL(`/?auth=error&message=${encodeURIComponent(error.message)}`, origin));
  }

  return NextResponse.redirect(new URL(next, origin));
}
