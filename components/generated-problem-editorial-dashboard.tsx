"use client";

import Link from "next/link";
import { CheckCircle2, EyeOff, FileText, Save, ShieldCheck, ToggleLeft, ToggleRight } from "lucide-react";
import {
  generatedProblemBatch001Classifications,
  generatedProblemBatch001Problems,
  generatedProblemBatch001ReviewNotes,
} from "@/data/generated-problem-batch-001";
import { saveGeneratedProblemEditorialState } from "@/lib/local-store";
import { useGeneratedProblemEditorialStates } from "@/lib/use-generated-problem-editorial";
import type { GeneratedProblemEditorialChecklist, GeneratedProblemEditorialState } from "@/lib/types";

const checklistLabels: Array<{
  key: keyof GeneratedProblemEditorialChecklist;
  label: string;
  description: string;
}> = [
  {
    key: "antiOneShot",
    label: "딸깍 방지",
    description: "한 줄 최종답 요청만으로 그럴듯한 답이 나오지 않는다.",
  },
  {
    key: "materialCrossReference",
    label: "자료 상호 참조",
    description: "자료 간 대조, 누락, 충돌 확인이 실제로 필요하다.",
  },
  {
    key: "extractedTextUsable",
    label: "추출 텍스트 품질",
    description: "이미지/표/PDF 맥락이 텍스트만으로도 불쾌하지 않게 읽힌다.",
  },
  {
    key: "domainAccessible",
    label: "도메인 장벽",
    description: "약대생/일반 지인이 오케스트레이션 전에 전문지식에서 막히지 않는다.",
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
        <p className="eyebrow">Generated Problem Gate</p>
        <h2>생성 문제 선별</h2>
        <p className="muted">
          첫 smoke에서는 seed 문제는 항상 노출하고, generated 문제는 checklist를 통과한 항목만 홈에 공개합니다.
        </p>
      </div>

      <div className="panel-body">
        <div className="review-summary">
          <span>
            <FileText size={14} /> {generatedProblemBatch001Problems.length} generated
          </span>
          <span>
            <ShieldCheck size={14} /> {reviewedCount} touched
          </span>
          <span>
            <CheckCircle2 size={14} /> {publishedCount} published
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
                    <span className="tag">{problem.materials.length} materials</span>
                    <span className={state.isPublished ? "material-state selected" : "material-state"}>
                      {state.isPublished ? "published" : "hidden"}
                    </span>
                  </div>
                  <h3>{problem.title}</h3>
                  <p className="muted">{problem.subtitle}</p>
                  <p className="generated-editorial-signal">
                    {classification.domain} · {classification.primarySkill.replaceAll("_", " ")} · {classification.ambiguityLevel} ambiguity
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
                    {state.isPublished ? "Hide" : "Publish"}
                  </button>
                  <Link className="button quiet" href={`/problems/${problem.id}`}>
                    Preview
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
                      <strong>{item.label}</strong>
                      <small>{item.description}</small>
                    </span>
                  </label>
                ))}
              </div>

              <details className="generated-editorial-details">
                <summary>
                  <EyeOff size={14} /> 실패 패턴과 bottleneck
                </summary>
                <div className="generated-editorial-evidence">
                  <div>
                    <strong>Primary failure</strong>
                    <p>{classification.primaryFailureMode}</p>
                  </div>
                  <div>
                    <strong>Ideal bottleneck</strong>
                    <p>{classification.idealBottleneck}</p>
                  </div>
                  <div>
                    <strong>Weak trace</strong>
                    <p>{reviewNotes?.weakTracePattern}</p>
                  </div>
                  <div>
                    <strong>Good trace</strong>
                    <p>{reviewNotes?.goodTracePattern}</p>
                  </div>
                </div>
              </details>

              <div className="generated-note-row">
                <textarea
                  className="textarea"
                  placeholder="Founder editorial note: 논리 구멍, 자료 품질, 데모 적합성"
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
