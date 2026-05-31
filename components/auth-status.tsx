"use client";

import { useEffect, useMemo, useState } from "react";
import { LogIn, LogOut } from "lucide-react";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";

export function AuthStatus() {
  const [email, setEmail] = useState<string | null>(null);
  const [isConfigured] = useState(isSupabaseConfigured());
  const supabase = useMemo(() => (isConfigured ? createSupabaseBrowserClient() : null), [isConfigured]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let mounted = true;

    void supabase.auth.getUser().then(({ data }) => {
      if (mounted) {
        setEmail(data.user?.email ?? null);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  if (!isConfigured || !supabase) {
    return <span className="tag">Local demo</span>;
  }

  if (email) {
    return (
      <button className="button" onClick={() => void supabase.auth.signOut()} type="button">
        <LogOut size={16} /> {email}
      </button>
    );
  }

  return (
    <button
      className="button"
      onClick={() =>
        void supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        })
      }
      type="button"
    >
      <LogIn size={16} /> Google
    </button>
  );
}
