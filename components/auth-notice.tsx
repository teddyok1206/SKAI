"use client";

import { useLanguagePreference } from "@/components/language-toggle";
import { getCopy } from "@/lib/i18n";

type AuthNoticeProps = {
  auth?: string;
  message?: string;
};

export function AuthNotice({ auth, message }: AuthNoticeProps) {
  const { locale } = useLanguagePreference();

  if (!auth) {
    return null;
  }

  if (auth === "missing_code") {
    return <p className="auth-notice">{getCopy("auth.notice.missingCode", locale)}</p>;
  }

  if (auth === "not_configured") {
    return <p className="auth-notice">{getCopy("auth.notice.notConfigured", locale)}</p>;
  }

  if (auth === "error") {
    const prefix = getCopy("auth.notice.errorPrefix", locale);
    return <p className="auth-notice">{message ? `${prefix}: ${message}` : getCopy("auth.notice.errorFallback", locale)}</p>;
  }

  return null;
}
