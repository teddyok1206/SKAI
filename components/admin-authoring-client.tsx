"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, FilePlus2, Save } from "lucide-react";
import { defaultRubric } from "@/data/rubric";
import { saveAuthoredProblem } from "@/lib/local-store";
import type { MaterialKind, Problem, ProblemCategory, ProblemGoalProfile, ProviderId } from "@/lib/types";
import { useAuthoredProblems } from "@/lib/use-authored-problems";

const categories: ProblemCategory[] = ["workplace", "research", "creative", "data_analysis", "coding", "strategy"];
const difficulties: Problem["difficulty"][] = ["intro", "standard", "advanced"];
const goalProfiles: ProblemGoalProfile[] = [
  "learning_oriented",
  "accuracy_first",
  "speed_first",
  "cost_constrained",
  "workflow_adoption",
  "exploration",
];
const materialKinds: MaterialKind[] = ["text", "image", "spreadsheet", "csv", "pdf", "other"];
const allowedProviders: ProviderId[] = ["mock", "groq", "xai", "openai", "openrouter", "gemini"];

const initialForm = {
  title: "",
  subtitle: "",
  category: "strategy" as ProblemCategory,
  difficulty: "intro" as Problem["difficulty"],
  goalProfile: "learning_oriented" as ProblemGoalProfile,
  estimatedMinutes: "20",
  statement: "",
  userGoal: "",
  constraints: "",
  starterContext: "",
  deliverables: "",
  materialTitle: "",
  materialDescription: "",
  materialKind: "text" as MaterialKind,
  materialFileName: "",
  materialText: "",
};

function lines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function localProblemId(title: string) {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42);

  return `local-${slug || crypto.randomUUID().slice(0, 8)}`;
}

function mimeTypeFor(kind: MaterialKind) {
  if (kind === "csv") {
    return "text/csv";
  }

  if (kind === "image") {
    return "image/png";
  }

  if (kind === "spreadsheet") {
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }

  if (kind === "pdf") {
    return "application/pdf";
  }

  return "text/plain";
}

export function AdminAuthoringClient() {
  const [form, setForm] = useState(initialForm);
  const drafts = useAuthoredProblems();
  const [exportJson, setExportJson] = useState("");
  const [savedProblemId, setSavedProblemId] = useState("");

  const previewProblem = useMemo<Problem>(() => {
    const now = new Date().toISOString();
    const id = localProblemId(form.title || "untitled");
    const material =
      form.materialTitle.trim() && form.materialText.trim()
        ? [
            {
              id: `${id}-material-1`,
              title: form.materialTitle.trim(),
              description: form.materialDescription.trim() || "Author-provided local material.",
              kind: form.materialKind,
              fileName: form.materialFileName.trim() || `${id}-material.txt`,
              mimeType: mimeTypeFor(form.materialKind),
              extractedText: form.materialText.trim(),
            },
          ]
        : [];

    return {
      id,
      title: form.title.trim() || "Untitled SKAI problem",
      subtitle: form.subtitle.trim() || "Local authoring draft",
      category: form.category,
      difficulty: form.difficulty,
      goalProfile: form.goalProfile,
      estimatedMinutes: Number(form.estimatedMinutes) || 20,
      statement: form.statement.trim() || "문제 상황을 작성하세요.",
      userGoal: form.userGoal.trim() || "사용자가 AI와 함께 달성해야 할 목표를 작성하세요.",
      constraints: lines(form.constraints),
      starterContext: lines(form.starterContext),
      deliverables: lines(form.deliverables),
      materials: material,
      allowedProviders,
      rubric: defaultRubric,
      createdAt: now,
    };
  }, [form]);

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function saveDraft() {
    saveAuthoredProblem(previewProblem);
    setExportJson(JSON.stringify(previewProblem, null, 2));
    setSavedProblemId(previewProblem.id);
  }

  return (
    <div className="authoring-layout">
      <section className="panel">
        <div className="panel-header">
          <p className="eyebrow">Authoring</p>
          <h2>문제 초안 만들기</h2>
          <p className="muted">로컬 저장 초안입니다. 저장 후 바로 풀이 화면에서 smoke할 수 있습니다.</p>
        </div>
        <div className="panel-body authoring-form">
          <label>
            <span>Title</span>
            <input className="input" value={form.title} onChange={(event) => updateField("title", event.target.value)} />
          </label>
          <label>
            <span>Subtitle</span>
            <input className="input" value={form.subtitle} onChange={(event) => updateField("subtitle", event.target.value)} />
          </label>
          <div className="authoring-row">
            <label>
              <span>Category</span>
              <select className="select" value={form.category} onChange={(event) => updateField("category", event.target.value as ProblemCategory)}>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Difficulty</span>
              <select
                className="select"
                value={form.difficulty}
                onChange={(event) => updateField("difficulty", event.target.value as Problem["difficulty"])}
              >
                {difficulties.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="authoring-row">
            <label>
              <span>Goal profile</span>
              <select
                className="select"
                value={form.goalProfile}
                onChange={(event) => updateField("goalProfile", event.target.value as ProblemGoalProfile)}
              >
                {goalProfiles.map((profile) => (
                  <option key={profile} value={profile}>
                    {profile}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Minutes</span>
              <input
                className="input"
                min={5}
                type="number"
                value={form.estimatedMinutes}
                onChange={(event) => updateField("estimatedMinutes", event.target.value)}
              />
            </label>
          </div>
          <label>
            <span>Problem statement</span>
            <textarea className="textarea" value={form.statement} onChange={(event) => updateField("statement", event.target.value)} />
          </label>
          <label>
            <span>User goal</span>
            <textarea className="textarea" value={form.userGoal} onChange={(event) => updateField("userGoal", event.target.value)} />
          </label>
          <label>
            <span>Constraints, one per line</span>
            <textarea className="textarea" value={form.constraints} onChange={(event) => updateField("constraints", event.target.value)} />
          </label>
          <label>
            <span>Starter context, one per line</span>
            <textarea className="textarea" value={form.starterContext} onChange={(event) => updateField("starterContext", event.target.value)} />
          </label>
          <label>
            <span>Deliverables, one per line</span>
            <textarea className="textarea" value={form.deliverables} onChange={(event) => updateField("deliverables", event.target.value)} />
          </label>
          <div className="authoring-material">
            <div>
              <p className="eyebrow">Optional Material</p>
              <p className="muted">초기 MVP는 하나의 text/extracted material만 저장합니다.</p>
            </div>
            <input
              className="input"
              placeholder="Material title"
              value={form.materialTitle}
              onChange={(event) => updateField("materialTitle", event.target.value)}
            />
            <input
              className="input"
              placeholder="Description"
              value={form.materialDescription}
              onChange={(event) => updateField("materialDescription", event.target.value)}
            />
            <div className="authoring-row">
              <select
                className="select"
                value={form.materialKind}
                onChange={(event) => updateField("materialKind", event.target.value as MaterialKind)}
              >
                {materialKinds.map((kind) => (
                  <option key={kind} value={kind}>
                    {kind}
                  </option>
                ))}
              </select>
              <input
                className="input"
                placeholder="File name"
                value={form.materialFileName}
                onChange={(event) => updateField("materialFileName", event.target.value)}
              />
            </div>
            <textarea
              className="textarea"
              placeholder="Extracted text or source material"
              value={form.materialText}
              onChange={(event) => updateField("materialText", event.target.value)}
            />
          </div>
          <div className="actions">
            <button className="button primary" onClick={saveDraft} type="button">
              <Save size={16} /> Save local draft
            </button>
            {savedProblemId ? (
              <Link className="button" href={`/problems/local/${savedProblemId}`}>
                Solve draft <ArrowRight size={16} />
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <aside className="panel">
        <div className="panel-header">
          <p className="eyebrow">Local Drafts</p>
          <h2>저장된 문제</h2>
        </div>
        <div className="panel-body">
          {drafts.length === 0 ? (
            <p className="muted">아직 로컬 문제 초안이 없습니다.</p>
          ) : (
            <div className="material-list">
              {drafts.map((problem) => (
                <Link className="material-button" href={`/problems/local/${problem.id}`} key={problem.id}>
                  <span>
                    <strong>{problem.title}</strong>
                    <small>
                      {problem.category} · {problem.difficulty} · {problem.estimatedMinutes}분
                    </small>
                  </span>
                  <span className="material-state">풀기</span>
                </Link>
              ))}
            </div>
          )}
        </div>
        <div className="panel-body">
          <h3>Export JSON</h3>
          {exportJson ? (
            <pre className="material-text authoring-export">{exportJson}</pre>
          ) : (
            <p className="muted">저장하면 migration이나 seed file로 옮길 JSON이 여기에 표시됩니다.</p>
          )}
        </div>
        <div className="panel-body">
          <div className="compact-empty">
            <FilePlus2 size={18} />
            <p>다음 slice에서 Supabase-backed publish/edit flow로 확장할 수 있습니다.</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
