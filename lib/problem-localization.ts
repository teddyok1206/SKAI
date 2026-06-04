import type { LocalizedProblemContent, Problem, ReportLocale, TranslationStatus } from "@/lib/types";

export interface LocalizedProblemView extends Problem {
  displayLocale: ReportLocale;
  sourceLocale: ReportLocale;
  translationStatus: TranslationStatus;
  localizedContent?: LocalizedProblemContent;
}

export function getProblemSourceLocale(problem: Problem): ReportLocale {
  return problem.locale ?? "ko";
}

export function getProblemAvailableLocales(problem: Problem): ReportLocale[] {
  const locales = new Set<ReportLocale>([getProblemSourceLocale(problem)]);

  for (const locale of problem.availableLocales ?? []) {
    locales.add(locale);
  }

  for (const locale of Object.keys(problem.localized ?? {}) as ReportLocale[]) {
    locales.add(locale);
  }

  return [...locales];
}

export function getLocalizedProblem(problem: Problem, locale: ReportLocale): LocalizedProblemView {
  const sourceLocale = getProblemSourceLocale(problem);
  const localizedContent = problem.localized?.[locale];
  const shouldUseLocalizedContent = Boolean(localizedContent && locale !== sourceLocale);

  if (!shouldUseLocalizedContent || !localizedContent) {
    return {
      ...problem,
      displayLocale: sourceLocale,
      sourceLocale,
      translationStatus: "source",
      localizedContent: undefined,
    };
  }

  return {
    ...problem,
    title: localizedContent.title ?? problem.title,
    subtitle: localizedContent.subtitle ?? problem.subtitle,
    statement: localizedContent.statement ?? problem.statement,
    userGoal: localizedContent.userGoal ?? problem.userGoal,
    constraints: localizedContent.constraints ?? problem.constraints,
    starterContext: localizedContent.starterContext ?? problem.starterContext,
    deliverables: localizedContent.deliverables ?? problem.deliverables,
    displayLocale: localizedContent.locale,
    sourceLocale: localizedContent.sourceLocale,
    translationStatus: localizedContent.translationStatus,
    localizedContent,
  };
}
