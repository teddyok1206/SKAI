import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export function getSupabaseEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

export function isSupabaseServerConfigured() {
  const env = getSupabaseEnv();
  return Boolean(env.url && env.anonKey);
}

export async function createSupabaseServerClient() {
  const env = getSupabaseEnv();

  if (!env.url || !env.anonKey) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot always mutate cookies. Route Handlers can.
        }
      },
    },
  });
}

