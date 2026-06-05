"use client";

import Link from "next/link";
import { CheckCircle2, EyeOff, FileText, Save, ShieldCheck, ToggleLeft, ToggleRight } from "lucide-react";
import {
  generatedProblemBatch001Classifications,
  generatedProblemBatch001Problems,
  generatedProblemBatch001ReviewNotes,
} from "@/data/generated-problem-batch-001";
import { useLanguagePreference } from "@/components/language-toggle";
import { getCopy } from "@/lib/i18n";
import { saveGeneratedProblemEditorialState } from "@/lib/local-store";
import { useGeneratedProblemEditorialStates } from "@/lib/use-generated-problem-editorial";
import type { GeneratedProblemEditorialChecklist, GeneratedProblemEditorialState } from "@/lib/types";

const checklistLabels: Array<{
  key: keyof GeneratedProblemEditorialChecklist;
  labelKey: string;
  descriptionKey: string;
}> = [
  {
    key: "antiOneShot",
    labelKey: "admin.generatedGate.checklist.antiOneShot.label",
    descriptionKey: "admin.generatedGate.checklist.antiOneShot.description",
  },
  {
    key: "materialCrossReference",
    labelKey: "admin.generatedGate.checklist.materialCrossReference.label",
    descriptionKey: "admin.generatedGate.checklist.materialCrossReference.description",
  },
  {
    key: "extractedTextUsable",
    labelKey: "admin.generatedGate.checklist.extractedTextUsable.label",
    descriptionKey: "admin.generatedGate.checklist.extractedTextUsable.description",
  },
  {
    key: "domainAccessible",
    labelKey: "admin.generatedGate.checklist.domainAccessible.label",
    descriptionKey: "admin.generatedGate.checklist.domainAccessible.description",
  },
];

const emptyChecklist: GeneratedProblemEditorialChecklist = {
  antiOneShot: false,
  materialCrossReference: false,
  extractedTextUsable: false,
  domainAccessible: false,
};

function passedCount(checklist: GeneratedProblemEditorialChecklist) {
  return checklistLabels.filter((item) => checklist[item.key]).length;
}

function hasPassed(checklist: GeneratedProblemEditorialChecklist) {
  return passedCount(checklist) === checklistLabels.length;
}

function fallbackState(problemId: string): GeneratedProblemEditorialState {
  return {
    problemId,
    isPublished: false,
    checklist: emptyChecklist,
    updatedAt: new Date().toISOString(),
  };
}

export function GeneratedProblemEditorialDashboard() {
  const { locale } = useLanguagePreference();
  const t = (key: string) => getCopy(key, locale);
  const editorialStates = useGeneratedProblemEditorialStates();
  const stateMap = new Map(editorialStates.map((state) => [state.problemId, state]));
  const publishedCount = generatedProblemBatch001Problems.filter((problem) => stateMap.get(problem.id)?.isPublished).length;
  const reviewedCount = generatedProblemBatch001Problems.filter((problem) => {
    const state = stateMap.get(problem.id);
    return state ? passedCount(state.checklist) > 0 || Boolean(state.note?.trim()) : false;
  }).length;

  function updateProblemState(problemId: string, updater: (state: GeneratedProblemEditorialState) => GeneratedProblemEditorialState) {
    const current = stateMap.get(problemId) ?? fallbackState(problemId);
    saveGeneratedProblemEditorialState({
      ...updater(current),
      updatedAt: new Date().toISOString(),
    });
  }

  function updateChecklist(problemId: string, key: keyof GeneratedProblemEditorialChecklist, value: boolean) {
    updateProblemState(problemId, (state) => ({
      ...state,
      isPublished: value ? state.isPublished : false,
      checklist: {
        ...state.checklist,
        [key]: value,
      },
    }));
  }

  function updateNote(problemId: string, note: string) {
    updateProblemState(problemId, (state) => ({
      ...state,
      note,
    }));
  }

  function setPublished(problemId: string, isPublished: boolean) {
    updateProblemState(problemId, (state) => ({
      ...state,
      isPublished: isPublished && hasPassed(state.checklist),
    }));
  }

  return (
    <section className="panel generated-editorial">
      <div className="panel-header">
        <p className="eyebrow">{t("admin.generatedGate.eyebrow")}</p>
        <h2>{t("admin.generatedGate.title")}</h2>
        <p className="muted">{t("admin.generatedGate.description")}</p>
      </div>

      <div className="panel-body">
        <div className="review-summary">
          <span>
            <FileText size={14} /> {generatedProblemBatch001Problems.length} {t("admin.generatedGate.summary.generated")}
          </span>
          <span>
            <ShieldCheck size={14} /> {reviewedCount} {t("admin.generatedGate.summary.touched")}
          </span>
          <span>
            <CheckCircle2 size={14} /> {publishedCount} {t("admin.generatedGate.summary.published")}
          </span>
        </div>
      </div>

      <div className="panel-body generated-editorial-list">
        {generatedProblemBatch001Problems.map((problem) => {
          const state = stateMap.get(problem.id) ?? fallbackState(problem.id);
          const classification = generatedProblemBatch001Classifications[problem.id];
          const reviewNotes = generatedProblemBatch001ReviewNotes[problem.id];
          const canPublish = hasPassed(state.checklist);

          return (
            <article className="generated-editorial-row" key={problem.id}>
              <div className="generated-editorial-main">
                <div>
                  <div className="tag-row">
                    <span className="tag">{problem.category}</span>
                    <span className="tag">{problem.difficulty}</span>
                    <span className="tag">
                      {problem.materials.length} {t("admin.generatedGate.materialsSuffix")}
                    </span>
                    <span className={state.isPublished ? "material-state selected" : "material-state"}>
                      {state.isPublished ? t("admin.generatedGate.state.published") : t("admin.generatedGate.state.hidden")}
                    </span>
                  </div>
                  <h3>{problem.title}</h3>
                  <p className="muted">{problem.subtitle}</p>
                  <p className="generated-editorial-signal">
                    {classification.domain} · {classification.primarySkill.replaceAll("_", " ")} · {classification.ambiguityLevel}{" "}
                    {t("admin.generatedGate.signal.ambiguitySuffix")}
                  </p>
                </div>
                <div className="generated-editorial-actions">
                  <button
                    className={`button ${state.isPublished ? "" : "primary"}`}
                    disabled={!canPublish && !state.isPublished}
                    onClick={() => setPublished(problem.id, !state.isPublished)}
                    type="button"
                  >
                    {state.isPublished ? <ToggleLeft size={16} /> : <ToggleRight size={16} />}
                    {state.isPublished ? t("admin.generatedGate.action.hide") : t("admin.generatedGate.action.publish")}
                  </button>
                  <Link className="button quiet" href={`/problems/${problem.id}`}>
                    {t("admin.generatedGate.action.preview")}
                  </Link>
                </div>
              </div>

              <div className="generated-checklist">
                {checklistLabels.map((item) => (
                  <label className="generated-check-item" key={item.key}>
                    <input
                      checked={state.checklist[item.key]}
                      type="checkbox"
                      onChange={(event) => updateChecklist(problem.id, item.key, event.target.checked)}
                    />
                    <span>
                      <strong>{t(item.labelKey)}</strong>
                      <small>{t(item.descriptionKey)}</small>
                    </span>
                  </label>
                ))}
              </div>

              <details className="generated-editorial-details">
                <summary>
                  <EyeOff size={14} /> {t("admin.generatedGate.details.summary")}
                </summary>
                <div className="generated-editorial-evidence">
                  <div>
                    <strong>{t("admin.generatedGate.details.primaryFailure")}</strong>
                    <p>{classification.primaryFailureMode}</p>
                  </div>
                  <div>
                    <strong>{t("admin.generatedGate.details.idealBottleneck")}</strong>
                    <p>{classification.idealBottleneck}</p>
                  </div>
                  <div>
                    <strong>{t("admin.generatedGate.details.weakTrace")}</strong>
                    <p>{reviewNotes?.weakTracePattern}</p>
                  </div>
                  <div>
                    <strong>{t("admin.generatedGate.details.goodTrace")}</strong>
                    <p>{reviewNotes?.goodTracePattern}</p>
                  </div>
                </div>
              </details>

              <div className="generated-note-row">
                <textarea
                  className="textarea"
                  placeholder={t("admin.generatedGate.note.placeholder")}
                  value={state.note ?? ""}
                  onChange={(event) => updateNote(problem.id, event.target.value)}
                />
                <span className="material-state">
                  <Save size={12} /> {passedCount(state.checklist)}/{checklistLabels.length}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
