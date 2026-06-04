export type Locale = "ko" | "en";

export type CopyStatus = "approved" | "draft" | "stale" | "missing";

export type CopyDomain =
  | "brand"
  | "navigation"
  | "auth"
  | "problem_browser"
  | "solve"
  | "graph"
  | "skai_viewer"
  | "share"
  | "judge"
  | "coaching"
  | "system";

export interface LocalizedCopyValues {
  ko?: string;
  en?: string;
}

export interface LocalizedCopyStatus {
  ko: CopyStatus;
  en: CopyStatus;
}

export interface CopyEntry {
  key: string;
  domain: CopyDomain;
  sourceLocale: Locale;
  protectedTerms: string[];
  values: LocalizedCopyValues;
  status: LocalizedCopyStatus;
  sourceChecksum: string;
  updatedAt: string;
  notes?: string;
}

export interface CopyLookupOptions {
  fallbackLocale?: Locale;
  allowDraft?: boolean;
}

