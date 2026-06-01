"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, LogOut } from "lucide-react";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";

export function AuthStatus() {
  const [email, setEmail] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"sign-in" | "sign-out" | null>(null);
  const [isConfigured] = useState(isSupabaseConfigured());
  const router = useRouter();
  const supabase = useMemo(() => (isConfigured ? createSupabaseBrowserClient() : null), [isConfigured]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let mounted = true;

    void supabase.auth
      .getUser()
      .then(({ data }) => {
        if (mounted) {
          setEmail(data.user?.email ?? null);
        }
      })
      .catch(() => {
        if (mounted) {
          setAuthError("세션 확인 실패");
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null);
      setPendingAction(null);
      router.refresh();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  if (!isConfigured || !supabase) {
    return (
      <>
        <button
          className="button"
          onClick={() => router.push("/?auth=not_configured")}
          title="Supabase URL과 anon key를 .env.local에 넣으면 Google 로그인이 활성화됩니다."
          type="button"
        >
          <LogIn size={16} /> Google 로그인
        </button>
        <span className="tag">Local demo</span>
      </>
    );
  }

  const signInWithGoogle = async () => {
    setAuthError(null);
    setPendingAction("sign-in");

    const callbackUrl = new URL("/auth/callback", window.location.origin);
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.delete("auth");
    currentUrl.searchParams.delete("message");
    callbackUrl.searchParams.set("next", `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });

    if (error) {
      setAuthError("로그인 실패");
      setPendingAction(null);
    }
  };

  const signOut = async () => {
    setAuthError(null);
    setPendingAction("sign-out");
    const { error } = await supabase.auth.signOut();

    if (error) {
      setAuthError("로그아웃 실패");
      setPendingAction(null);
      return;
    }

    setEmail(null);
    setPendingAction(null);
    router.refresh();
  };

  if (email) {
    return (
      <button
        className="button"
        disabled={pendingAction !== null}
        onClick={() => void signOut()}
        title={authError ?? `Signed in as ${email}`}
        type="button"
      >
        <LogOut size={16} /> {pendingAction === "sign-out" ? "Signing out" : email}
      </button>
    );
  }

  return (
    <button
      className="button"
      disabled={pendingAction !== null}
      onClick={() => void signInWithGoogle()}
      title={authError ?? "Sign in with Google"}
      type="button"
    >
      <LogIn size={16} /> {pendingAction === "sign-in" ? "Redirecting" : "Google 로그인"}
    </button>
  );
}
