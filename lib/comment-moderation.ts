export interface CommentModerationResult {
  ok: boolean;
  body: string;
  authorName: string;
  warnings: string[];
  blockedReason?: string;
}

const maxLinks = 2;
const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const phonePattern = /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{4}/g;
const longNumberPattern = /\b(?:\d[ -]?){12,19}\b/g;
const apiKeyPattern =
  /\b(?:sk-[A-Za-z0-9_-]{20,}|xai-[A-Za-z0-9_-]{20,}|gsk_[A-Za-z0-9_-]{20,}|AIza[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,})\b/g;
const scriptPattern = /<\s*\/?\s*(script|iframe|object|embed|style|link|meta)\b/i;
const urlPattern = /https?:\/\/\S+/gi;

function redact(value: string, pattern: RegExp, replacement: string) {
  let redacted = false;
  const next = value.replace(pattern, () => {
    redacted = true;
    return replacement;
  });

  return {
    value: next,
    redacted,
  };
}

function sanitizeBody(body: string) {
  const warnings: string[] = [];
  let next = body.trim().replace(/\s{3,}/g, " ");

  const secretRedaction = redact(next, apiKeyPattern, "[redacted secret]");
  next = secretRedaction.value;
  if (secretRedaction.redacted) {
    warnings.push("API-key-like text was redacted.");
  }

  const emailRedaction = redact(next, emailPattern, "[redacted email]");
  next = emailRedaction.value;
  if (emailRedaction.redacted) {
    warnings.push("Email-like text was redacted.");
  }

  const phoneRedaction = redact(next, phonePattern, "[redacted phone]");
  next = phoneRedaction.value;
  if (phoneRedaction.redacted) {
    warnings.push("Phone-like text was redacted.");
  }

  const numberRedaction = redact(next, longNumberPattern, "[redacted number]");
  next = numberRedaction.value;
  if (numberRedaction.redacted) {
    warnings.push("Long number-like text was redacted.");
  }

  return {
    body: next,
    warnings,
  };
}

function sanitizeAuthorName(authorName: string) {
  const trimmed = authorName.trim();
  if (!trimmed) {
    return "SKAI learner";
  }

  emailPattern.lastIndex = 0;
  if (emailPattern.test(trimmed)) {
    emailPattern.lastIndex = 0;
    return trimmed.replace(emailPattern, (email) => email.split("@")[0]).slice(0, 40) || "SKAI learner";
  }

  emailPattern.lastIndex = 0;
  return trimmed.slice(0, 40);
}

export function moderateComment(input: { body: string; authorName: string; maxBodyChars: number }): CommentModerationResult {
  const body = input.body.trim();

  if (!body) {
    return {
      ok: false,
      body: "",
      authorName: sanitizeAuthorName(input.authorName),
      warnings: [],
      blockedReason: "Comment is empty.",
    };
  }

  if (scriptPattern.test(body)) {
    return {
      ok: false,
      body: "",
      authorName: sanitizeAuthorName(input.authorName),
      warnings: [],
      blockedReason: "Comment contains blocked HTML/script-like content.",
    };
  }

  const links = body.match(urlPattern) ?? [];
  if (links.length > maxLinks) {
    return {
      ok: false,
      body: "",
      authorName: sanitizeAuthorName(input.authorName),
      warnings: [],
      blockedReason: `Comment contains too many links. Maximum allowed: ${maxLinks}.`,
    };
  }

  const sanitized = sanitizeBody(body.slice(0, input.maxBodyChars));

  if (!sanitized.body.trim()) {
    return {
      ok: false,
      body: "",
      authorName: sanitizeAuthorName(input.authorName),
      warnings: sanitized.warnings,
      blockedReason: "Comment is empty after privacy redaction.",
    };
  }

  return {
    ok: true,
    body: sanitized.body,
    authorName: sanitizeAuthorName(input.authorName),
    warnings: sanitized.warnings,
  };
}
