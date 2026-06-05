"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, LogOut } from "lucide-react";
import { useLanguagePreference } from "@/components/language-toggle";
import { getCopy, localeStorageKey } from "@/lib/i18n";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import { loadMyPageSnapshot } from "@/lib/supabase-persistence";

export function AuthStatus() {
  const { locale, setLocale } = useLanguagePreference();
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

    async function applyProfileLocaleIfUnset() {
      if (typeof window === "undefined" || window.localStorage.getItem(localeStorageKey)) {
        return;
      }

      const snapshot = await loadMyPageSnapshot();

      if (mounted && snapshot?.authenticated && snapshot.profile?.preferredLocale) {
        setLocale(snapshot.profile.preferredLocale);
      }
    }

    void supabase.auth
      .getUser()
      .then(({ data }) => {
        if (mounted) {
          setEmail(data.user?.email ?? null);
        }

        if (data.user) {
          void applyProfileLocaleIfUnset();
        }
      })
      .catch(() => {
        if (mounted) {
          setAuthError(getCopy("auth.sessionCheckFailed", locale));
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null);
      setPendingAction(null);

      if (session?.user) {
        void applyProfileLocaleIfUnset();
      }

      router.refresh();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [locale, router, setLocale, supabase]);

  if (!isConfigured || !supabase) {
    return (
      <>
        <button
          className="button"
          onClick={() => router.push("/?auth=not_configured")}
          title={getCopy("auth.notConfiguredTitle", locale)}
          type="button"
        >
          <LogIn size={16} /> {getCopy("auth.googleSignIn", locale)}
        </button>
        <span className="tag">{getCopy("auth.localDemo", locale)}</span>
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
      setAuthError(getCopy("auth.signInFailed", locale));
      setPendingAction(null);
    }
  };

  const signOut = async () => {
    setAuthError(null);
    setPendingAction("sign-out");
    const { error } = await supabase.auth.signOut();

    if (error) {
      setAuthError(getCopy("auth.signOutFailed", locale));
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
        title={authError ?? `${getCopy("auth.signedInAsPrefix", locale)} ${email}`}
        type="button"
      >
        <LogOut size={16} /> {pendingAction === "sign-out" ? getCopy("auth.signingOut", locale) : email}
      </button>
    );
  }

  return (
    <button
    className="button"
    disabled={pendingAction !== null}
    onClick={() => void signInWithGoogle()}
    title={authError ?? getCopy("auth.googleSignIn", locale)}
    type="button"
  >
    <LogIn size={16} /> {pendingAction === "sign-in" ? getCopy("auth.redirecting", locale) : getCopy("auth.googleSignIn", locale)}
  </button>
  );
}
