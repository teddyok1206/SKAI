"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Database, Eye, FileDown, LogIn, Save, ShieldCheck, UserRound } from "lucide-react";
import { useLanguagePreference } from "@/components/language-toggle";
import { getCopy, type Locale } from "@/lib/i18n";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import { getAttempts, getAuthoredProblems, getPublishedAttempts } from "@/lib/local-store";
import { emptyMyPageSummary, type MyPageProfile, type MyPageSnapshot, type MyPageSummary } from "@/lib/my-page";

interface LocalBrowserSummary {
  attempts: number;
  published: number;
  authored: number;
}

type SaveState = "idle" | "saving" | "saved" | "failed";

const emptyLocalSummary: LocalBrowserSummary = {
  attempts: 0,
  published: 0,
  authored: 0,
};

function formatDate(value: string | undefined, locale: Locale) {
  if (!value) {
    return getCopy("myPage.identity.unknown", locale);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatCost(value: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 4,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(value);
}

function metricItems(summary: MyPageSummary, locale: Locale) {
  return [
    ["myPage.summary.attempts", summary.attempts],
    ["myPage.summary.judged", summary.judgedAttempts],
    ["myPage.summary.published", summary.publishedAttempts],
    ["myPage.summary.comments", summary.comments],
    ["myPage.summary.branches", summary.branches],
    ["myPage.summary.prompts", summary.userPrompts],
    ["myPage.summary.responses", summary.assistantResponses],
    ["myPage.summary.materials", summary.materialAttachments],
    ["myPage.summary.cost", formatCost(summary.totalEstimatedCostUsd)],
  ].map(([labelKey, value]) => ({
    label: getCopy(String(labelKey), locale),
    value,
  }));
}

function profileFormFrom(profile: MyPageProfile | undefined): MyPageProfile {
  return {
    displayName: profile?.displayName ?? "SKAI learner",
    bio: profile?.bio ?? "",
    preferredLocale: profile?.preferredLocale ?? "ko",
    defaultAuthorLabel: profile?.defaultAuthorLabel ?? profile?.displayName ?? "SKAI learner",
    updatedAt: profile?.updatedAt,
  };
}

export function MyPageClient() {
  const { locale, setLocale } = useLanguagePreference();
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<MyPageSnapshot | null>(null);
  const [localSummary, setLocalSummary] = useState<LocalBrowserSummary>(emptyLocalSummary);
  const [profileForm, setProfileForm] = useState<MyPageProfile>(profileFormFrom(undefined));
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [loadFailed, setLoadFailed] = useState(false);
  const isConfigured = isSupabaseConfigured();
  const supabase = useMemo(() => (isConfigured ? createSupabaseBrowserClient() : null), [isConfigured]);
  const t = (key: string) => getCopy(key, locale);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLocalSummary({
        attempts: getAttempts().length,
        published: getPublishedAttempts().length,
        authored: getAuthoredProblems().length,
      });
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    fetch("/api/me", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("request_failed"))))
      .then((data: MyPageSnapshot) => {
        if (!mounted) {
          return;
        }

        setSnapshot(data);
        setProfileForm(profileFormFrom(data.profile));
        setLoadFailed(false);
      })
      .catch(() => {
        if (!mounted) {
          return;
        }

        setSnapshot({
          mode: "local",
          authenticated: false,
          reason: "supabase_not_configured",
          summary: emptyMyPageSummary,
          recentAttempts: [],
        });
        setLoadFailed(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  async function signInWithGoogle() {
    if (!supabase) {
      router.push("/?auth=not_configured");
      return;
    }

    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", "/me");

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });
  }

  async function saveProfile() {
    setSaveState("saving");
    const response = await fetch("/api/me/profile", {
      body: JSON.stringify(profileForm),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    }).catch(() => null);

    if (!response?.ok) {
      setSaveState("failed");
      return;
    }

    const data = (await response.json()) as { profile: MyPageProfile };
    setSnapshot((current) => (current ? { ...current, profile: data.profile } : current));
    setProfileForm(profileFormFrom(data.profile));
    setLocale(data.profile.preferredLocale);
    setSaveState("saved");
  }

  const summary = snapshot?.summary ?? emptyMyPageSummary;
  const authenticated = Boolean(snapshot?.authenticated);

  if (!snapshot) {
    return (
      <section className="panel my-page-panel">
        <div className="panel-body">
          <p className="muted">{t("myPage.loading")}</p>
        </div>
      </section>
    );
  }

  return (
    <div className="my-page-layout">
      <section className="panel my-page-hero">
        <div className="panel-header">
          <p className="eyebrow">{t("myPage.hero.eyebrow")}</p>
          <h1>{t("myPage.hero.title")}</h1>
          <p className="muted">{t("myPage.hero.description")}</p>
        </div>
        <div className="panel-body my-page-metrics" aria-label={t("myPage.summary.title")}>
          {metricItems(summary, locale).map((item) => (
            <div className="my-page-metric" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </section>

      {!authenticated ? (
        <section className="panel my-page-panel">
          <div className="panel-header">
            <p className="eyebrow">
              {snapshot.reason === "supabase_not_configured" ? t("myPage.auth.localMode") : t("myPage.auth.authMode")}
            </p>
            <h2>{t("myPage.auth.title")}</h2>
            <p className="muted">{snapshot.reason === "supabase_not_configured" || loadFailed ? t("myPage.auth.notConfigured") : t("myPage.auth.description")}</p>
          </div>
          <div className="panel-body">
            <button className="button primary" onClick={() => void signInWithGoogle()} type="button">
              <LogIn size={16} /> {t("myPage.auth.signIn")}
            </button>
          </div>
        </section>
      ) : null}

      {snapshot.reason === "profile_unavailable" ? (
        <section className="panel my-page-panel">
          <div className="panel-body">
            <p className="muted">{t("myPage.reason.profileUnavailable")}</p>
          </div>
        </section>
      ) : null}

      {authenticated ? (
        <section className="my-page-grid">
          <article className="panel">
            <div className="panel-header">
              <p className="eyebrow">
                <UserRound size={14} /> {t("myPage.identity.title")}
              </p>
              <h2>{snapshot.profile?.displayName ?? t("myPage.identity.unknown")}</h2>
            </div>
            <div className="panel-body my-page-field-list">
              <div>
                <span>{t("myPage.identity.email")}</span>
                <strong>{snapshot.user?.email ?? t("myPage.identity.unknown")}</strong>
              </div>
              <div>
                <span>{t("myPage.identity.provider")}</span>
                <strong>{snapshot.user?.provider ?? t("myPage.identity.unknown")}</strong>
              </div>
              <div>
                <span>{t("myPage.identity.createdAt")}</span>
                <strong>{formatDate(snapshot.user?.createdAt, locale)}</strong>
              </div>
              <div>
                <span>{t("myPage.identity.lastSignInAt")}</span>
                <strong>{formatDate(snapshot.user?.lastSignInAt, locale)}</strong>
              </div>
            </div>
          </article>

          <article className="panel">
            <div className="panel-header">
              <p className="eyebrow">
                <Save size={14} /> {t("myPage.profile.title")}
              </p>
              <h2>{t("myPage.profile.description")}</h2>
              <p className="muted">{t("myPage.profile.usage")}</p>
            </div>
            <div className="panel-body my-page-profile-form">
              <label>
                <span>{t("myPage.profile.displayName")}</span>
                <input
                  className="input"
                  maxLength={60}
                  placeholder={t("myPage.profile.placeholder.displayName")}
                  value={profileForm.displayName}
                  onChange={(event) => setProfileForm((current) => ({ ...current, displayName: event.target.value }))}
                />
              </label>
              <label>
                <span>{t("myPage.profile.bio")}</span>
                <textarea
                  className="textarea"
                  maxLength={240}
                  placeholder={t("myPage.profile.placeholder.bio")}
                  value={profileForm.bio ?? ""}
                  onChange={(event) => setProfileForm((current) => ({ ...current, bio: event.target.value }))}
                />
              </label>
              <label>
                <span>{t("myPage.profile.preferredLocale")}</span>
                <select
                  className="select"
                  value={profileForm.preferredLocale}
                  onChange={(event) => setProfileForm((current) => ({ ...current, preferredLocale: event.target.value as Locale }))}
                >
                  <option value="ko">{t("myPage.profile.locale.ko")}</option>
                  <option value="en">{t("myPage.profile.locale.en")}</option>
                </select>
              </label>
              <label>
                <span>{t("myPage.profile.defaultAuthorLabel")}</span>
                <input
                  className="input"
                  maxLength={60}
                  placeholder={t("myPage.profile.placeholder.authorLabel")}
                  value={profileForm.defaultAuthorLabel}
                  onChange={(event) => setProfileForm((current) => ({ ...current, defaultAuthorLabel: event.target.value }))}
                />
              </label>
              <div className="my-page-actions">
                <button className="button primary" disabled={saveState === "saving"} onClick={() => void saveProfile()} type="button">
                  <Save size={16} /> {saveState === "saving" ? t("myPage.profile.saving") : t("myPage.profile.save")}
                </button>
                {saveState === "saved" ? <span className="material-state selected">{t("myPage.profile.saved")}</span> : null}
                {saveState === "failed" ? <span className="material-state">{t("myPage.profile.failed")}</span> : null}
              </div>
            </div>
          </article>
        </section>
      ) : null}

      <section className="my-page-grid">
        <article className="panel">
          <div className="panel-header">
            <p className="eyebrow">
              <ShieldCheck size={14} /> {t("myPage.data.title")}
            </p>
          </div>
          <div className="panel-body my-page-data-list">
            <p>{t("myPage.data.privateTrace")}</p>
            <p>{t("myPage.data.publicArtifact")}</p>
            <p>{t("myPage.data.localOnly")}</p>
            <span className="tag">
              <Database size={13} /> {t("myPage.data.synced")}: {summary.attempts}
            </span>
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <p className="eyebrow">{t("myPage.local.title")}</p>
            <p className="muted">{t("myPage.local.description")}</p>
          </div>
          <div className="panel-body my-page-local-grid">
            <div>
              <span>{t("myPage.local.attempts")}</span>
              <strong>{localSummary.attempts}</strong>
            </div>
            <div>
              <span>{t("myPage.local.published")}</span>
              <strong>{localSummary.published}</strong>
            </div>
            <div>
              <span>{t("myPage.local.authored")}</span>
              <strong>{localSummary.authored}</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel-header">
          <p className="eyebrow">
            <Eye size={14} /> {t("myPage.recent.title")}
          </p>
        </div>
        <div className="panel-body my-page-recent-list">
          {snapshot.recentAttempts.length === 0 ? (
            <p className="muted">{t("myPage.recent.empty")}</p>
          ) : (
            snapshot.recentAttempts.map((attempt) => (
              <article className="my-page-recent-row" key={attempt.id}>
                <div>
                  <div className="tag-row">
                    <span className="tag">{attempt.status}</span>
                    <span className="tag">{attempt.provider}</span>
                    <span className="tag">{attempt.model}</span>
                  </div>
                  <h3>{attempt.title}</h3>
                  <p className="muted">
                    {t("myPage.recent.updated")} {formatDate(attempt.updatedAt, locale)}
                  </p>
                </div>
                <div className="my-page-actions">
                  <Link className="button quiet" href={`/problems/${attempt.problemId}`}>
                    {t("myPage.recent.openProblem")} <ArrowRight size={16} />
                  </Link>
                  {attempt.publishedAttemptId ? (
                    <Link className="button" href={`/share/${attempt.id}`}>
                      {t("myPage.recent.openShare")} <ArrowRight size={16} />
                    </Link>
                  ) : null}
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <p className="eyebrow">
            <FileDown size={14} /> {t("myPage.privacy.title")}
          </p>
          <p className="muted">{t("myPage.privacy.description")}</p>
        </div>
        <div className="panel-body my-page-actions">
          <Link className="button" href="/skai/viewer">
            {t("myPage.privacy.viewer")} <ArrowRight size={16} />
          </Link>
          <p className="muted">{t("myPage.privacy.deleteNote")}</p>
        </div>
      </section>
    </div>
  );
}
