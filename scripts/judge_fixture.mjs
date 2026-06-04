#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import {
  inputGraphHash,
  listSkaiFiles,
  readJsonFile,
  recalculateIntegrity,
  stableStringify,
  verifySkaiArtifact,
  writeJsonFile,
} from "./skai_file_common.mjs";

const createdAt = "2026-06-04T00:00:00.000Z";
const axisLabels = {
  problem_definition: "문제정의",
  decomposition: "세분화",
  instruction_clarity: "지시명확성",
  adaptation: "적응력",
  verification: "검증력",
  efficiency: "효율성",
  final_quality: "최종품질",
};

function parseArgs(argv) {
  const args = {
    input: "fixtures/skai",
    write: false,
    outputDir: "fixtures/skai/derived",
    regression: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    const next = argv[index + 1];

    if ((item === "--input" || item === "-i" || item === "--file") && next) {
      args.input = next;
      index += 1;
    } else if (item === "--output-dir" && next) {
      args.outputDir = next;
      index += 1;
    } else if (item === "--write") {
      args.write = true;
    } else if (item === "--regression") {
      args.regression = true;
    } else if (item === "--help") {
      printHelp();
      process.exit(0);
    }
  }

  return args;
}

function printHelp() {
  console.log(`SKAI fixture judge

Usage:
  npm run judge:fixture
  npm run judge:fixture -- --file fixtures/skai/good-decomposition.skai
  npm run judge:regression

Behavior:
  - reads .skai fixtures;
  - derives deterministic skai.judge.v1 and skai.coach.v1 extensions;
  - with --write, writes fixtures/skai/derived/*.judged.skai;
  - regression mode validates extension shape and graph references without live LLM calls.
`);
}

function userEvents(artifact) {
  return artifact.payload.attempt.trace.filter((event) => event.role === "user");
}

function combinedText(artifact) {
  return artifact.payload.attempt.trace.map((event) => event.content).join("\n").toLowerCase();
}

function includesAny(text, words) {
  return words.some((word) => text.includes(word.toLowerCase()));
}

function firstPair(artifact) {
  return artifact.payload.graph.child.pairs[0];
}

function pairTarget(pair) {
  return {
    targetKind: "pair",
    targetId: pair.id,
    pairId: pair.id,
    traceEventIds: [pair.promptTraceEventId, pair.responseTraceEventId].filter(Boolean),
  };
}

function attemptTarget(artifact) {
  return {
    targetKind: "attempt",
    targetId: artifact.payload.attempt.attemptId,
    traceEventIds: artifact.payload.attempt.trace.map((event) => event.id),
  };
}

function scoreAxis(axis, score, rationale) {
  return {
    axis,
    label: axisLabels[axis],
    score,
    rationale,
  };
}

function deriveSignals(artifact) {
  const text = combinedText(artifact);
  const users = userEvents(artifact);
  const graph = artifact.payload.graph.child;
  const hasMaterials = (artifact.payload.problem?.materials?.length ?? 0) > 0;
  const attachedMaterialCount = users.reduce((sum, event) => sum + (event.attachments?.length ?? 0), 0);

  return {
    pairCount: graph.pairs.length,
    hasMaterials,
    attachedMaterialCount,
    hasVerification: includesAny(text, ["검증", "확인", "근거", "출처", "오류", "한계", "반례"]),
    hasDecomposition: includesAny(text, ["task", "분리", "분해", "단계", "workflow", "역할", "기준"]),
    hasAdaptation: includesAny(text, ["다시", "반영", "수정", "이전", "여기서", "branch"]),
    hasFinal: includesAny(text, ["최종", "브리프", "템플릿", "산출물", "우선순위"]),
    isBranch: Boolean(artifact.payload.branch),
  };
}

function deriveAxisScores(signals) {
  return [
    scoreAxis(
      "problem_definition",
      signals.pairCount > 1 ? 78 : 52,
      signals.pairCount > 1 ? "첫 요청 이후 문제 조건을 재정의할 여지가 드러났습니다." : "첫 요청이 너무 넓어 문제정의 책임이 모델 쪽으로 넘어갔습니다.",
    ),
    scoreAxis(
      "decomposition",
      signals.hasDecomposition ? 84 : 48,
      signals.hasDecomposition ? "task, 역할, 단계 분리가 trace에 나타납니다." : "하위 task 분해 신호가 약합니다.",
    ),
    scoreAxis(
      "instruction_clarity",
      signals.hasFinal ? 76 : 58,
      signals.hasFinal ? "산출물 형식과 최종 정리 요구가 드러납니다." : "출력 형식과 성공 기준이 충분히 고정되지 않았습니다.",
    ),
    scoreAxis(
      "adaptation",
      signals.hasAdaptation || signals.isBranch ? 82 : 54,
      signals.hasAdaptation || signals.isBranch ? "중간 흐름을 재조정한 신호가 있습니다." : "새 정보나 중간 결과에 대한 반응이 제한적입니다.",
    ),
    scoreAxis(
      "verification",
      signals.hasVerification ? 88 : 44,
      signals.hasVerification ? "근거와 한계를 확인하려는 검증 프롬프트가 있습니다." : "검증 책임이 명시적으로 회수되지 않았습니다.",
    ),
    scoreAxis(
      "efficiency",
      signals.pairCount <= 4 ? 78 : 68,
      "fixture baseline은 비용/시간 수치 대신 turn 수와 구조 밀도를 기준으로 봅니다.",
    ),
    scoreAxis(
      "final_quality",
      signals.hasFinal ? 80 : 58,
      signals.hasFinal ? "최종 산출물로 수렴하는 요청이 있습니다." : "최종 산출물의 품질 기준이 약합니다.",
    ),
  ];
}

function averageScore(axisScores) {
  return Math.round(axisScores.reduce((sum, score) => sum + score.score, 0) / axisScores.length);
}

function buildFinding(id, target, axis, severity, confidence, title, explanation, suggestedAction) {
  return {
    id,
    target,
    axis,
    severity,
    confidence,
    title,
    explanation,
    suggestedAction,
  };
}

function deriveFindings(artifact, signals) {
  const findings = [];
  const first = firstPair(artifact);
  const target = first ? pairTarget(first) : attemptTarget(artifact);

  if (signals.pairCount <= 1) {
    findings.push(
      buildFinding(
        "finding-one-shot",
        target,
        "decomposition",
        "critical",
        0.92,
        "One-shot 의존",
        "단일 요청으로 최종 답을 맡기면 문제정의, 자료 통제, 검증 책임이 모두 모델 내부로 사라집니다.",
        "첫 프롬프트를 목표/제약/산출물/검증 기준을 분리하는 요청으로 바꿔 fixture를 다시 돌려보세요.",
      ),
    );
  }

  if (signals.hasMaterials && signals.attachedMaterialCount === 0) {
    findings.push(
      buildFinding(
        "finding-material-ignored",
        target,
        "verification",
        "watch",
        0.88,
        "공식 자료 미사용",
        "문제에 자료가 있지만 trace에서 첨부 또는 자료 근거를 활용한 흔적이 없습니다.",
        "자료를 먼저 첨부하고 AI task의 입력으로 명시한 뒤 결과를 비교하세요.",
      ),
    );
  }

  if (!signals.hasVerification) {
    findings.push(
      buildFinding(
        "finding-no-verification",
        target,
        "verification",
        "watch",
        0.86,
        "검증 단계 부재",
        "AI 응답을 받은 뒤 근거, 오류 가능성, 한계를 다시 확인하는 turn이 없습니다.",
        "최종 산출물 직전에 `이 답의 약점과 검증할 근거를 찾아줘`를 추가하세요.",
      ),
    );
  }

  if (signals.hasDecomposition && signals.pairCount >= 3) {
    findings.push(
      buildFinding(
        "finding-strong-decomposition",
        attemptTarget(artifact),
        "decomposition",
        "positive",
        0.84,
        "구조적 task 분배",
        "사용자가 목표, 기준, task, 검증을 분리하면서 모델의 역할을 좁혀 갔습니다.",
        "다음 fixture에서는 이 구조를 더 짧은 turn 수로 유지할 수 있는지 확인하세요.",
      ),
    );
  }

  if (signals.isBranch) {
    findings.push(
      buildFinding(
        "finding-branch-recovery",
        attemptTarget(artifact),
        "adaptation",
        "positive",
        0.82,
        "Breakpoint recovery",
        "같은 지점에서 다시 시작해 이전 흐름의 병목을 검증 중심으로 바꾼 흔적이 있습니다.",
        "parent/child diff에서 어떤 조건 추가가 결과를 바꿨는지 coach layer로 설명하세요.",
      ),
    );
  }

  return findings;
}

function buildJudgeExtension(artifact) {
  const graphHash = inputGraphHash(artifact);
  const signals = deriveSignals(artifact);
  const axisScores = deriveAxisScores(signals);
  const findings = deriveFindings(artifact, signals);
  const totalScore = averageScore(axisScores);

  return {
    schemaVersion: "skai.judge.v1",
    extensionVersion: "judge-fixture-baseline.001",
    artifactHash: artifact.integrity.artifactHash,
    inputGraphHash: graphHash,
    createdAt,
    generator: {
      kind: "deterministic_fixture",
      promptVersion: "fixture-heuristic.001",
    },
    rubricVersion: "rubric.fixture.001",
    totalScore,
    axisScores,
    findings,
    needsHumanReview: totalScore < 65 || findings.some((finding) => finding.severity === "critical"),
  };
}

function buildCoachExtension(artifact, judgeExtension) {
  const critical = judgeExtension.findings.find((finding) => finding.severity === "critical");
  const watch = judgeExtension.findings.find((finding) => finding.severity === "watch");
  const positive = judgeExtension.findings.find((finding) => finding.severity === "positive");
  const anchor = critical ?? watch ?? positive;

  return {
    schemaVersion: "skai.coach.v1",
    extensionVersion: "coach-fixture-baseline.001",
    artifactHash: artifact.integrity.artifactHash,
    inputGraphHash: inputGraphHash(artifact),
    createdAt,
    generator: {
      kind: "deterministic_fixture",
      promptVersion: "fixture-coach.001",
    },
    coachingVersion: "coach.fixture.001",
    summary:
      anchor?.severity === "positive"
        ? "이 fixture는 사용자가 AI에게 답을 맡기기보다 문제 구조를 좁혀 간 좋은 기준 사례입니다."
        : "이 fixture는 다음 개발 단계에서 coach가 사용자의 orchestration 병목을 어떻게 설명해야 하는지 보여주는 기준 사례입니다.",
    comments: judgeExtension.findings.slice(0, 4).map((finding, index) => ({
      id: `coach-${index + 1}-${finding.id}`,
      target: finding.target,
      tone: finding.severity === "positive" ? "mirror" : "correction",
      title: finding.title,
      body: finding.explanation,
      nextAction: finding.suggestedAction,
    })),
    nextPracticeTargets: judgeExtension.findings
      .filter((finding) => finding.severity !== "positive")
      .map((finding) => finding.title)
      .slice(0, 3),
  };
}

function validateExtensionTargets(artifact, extension) {
  const graph = artifact.payload.graph.child;
  const ids = new Set([
    artifact.payload.attempt.attemptId,
    ...artifact.payload.attempt.trace.map((event) => event.id),
    ...graph.pairs.map((pair) => pair.id),
    ...graph.promptNodes.map((node) => node.id),
    ...graph.responseNodes.map((node) => node.id),
    ...graph.statusNodes.map((node) => node.id),
    ...graph.promptEdges.map((edge) => edge.id),
    ...graph.responseEdges.map((edge) => edge.id),
    ...graph.statusEdges.map((edge) => edge.id),
  ]);
  const errors = [];
  const targets = [
    ...(extension.findings ?? []).map((finding) => finding.target),
    ...(extension.comments ?? []).map((comment) => comment.target),
  ];

  for (const target of targets) {
    if (!ids.has(target.targetId)) {
      errors.push(`unknown target id: ${target.targetId}`);
    }

    if (target.pairId && !ids.has(target.pairId)) {
      errors.push(`unknown pair id: ${target.pairId}`);
    }
  }

  return errors;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const allFiles = await listSkaiFiles(args.input);
  const inputFiles = allFiles.filter((filePath) => !filePath.includes(`${path.sep}derived${path.sep}`) && !filePath.endsWith(".judged.skai"));

  if (inputFiles.length === 0) {
    throw new Error(`No core .skai fixture files found under ${args.input}`);
  }

  let failed = 0;

  for (const filePath of inputFiles) {
    const artifact = await readJsonFile(filePath);
    const verification = verifySkaiArtifact(artifact);

    if (!verification.ok) {
      failed += 1;
      console.error(`fail ${path.relative(process.cwd(), filePath)} before judge: ${verification.errors.join("; ")}`);
      continue;
    }

    const judgeExtension = buildJudgeExtension(artifact);
    const coachExtension = buildCoachExtension(artifact, judgeExtension);
    const targetErrors = [
      ...validateExtensionTargets(artifact, judgeExtension),
      ...validateExtensionTargets(artifact, coachExtension),
    ];

    if (targetErrors.length > 0) {
      failed += 1;
      console.error(`fail ${path.relative(process.cwd(), filePath)} target validation`);
      for (const error of targetErrors) {
        console.error(`  - ${error}`);
      }
      continue;
    }

    const judgedArtifact = recalculateIntegrity({
      ...artifact,
      extensions: {
        ...(artifact.extensions ?? {}),
        "skai.judge.v1": judgeExtension,
        "skai.coach.v1": coachExtension,
      },
    });
    const judgedVerification = verifySkaiArtifact(judgedArtifact);

    if (!judgedVerification.ok) {
      failed += 1;
      console.error(`fail ${path.relative(process.cwd(), filePath)} after extension: ${judgedVerification.errors.join("; ")}`);
      continue;
    }

    const relativePath = path.relative(process.cwd(), filePath);
    console.log(
      `ok ${relativePath} · score ${judgeExtension.totalScore} · findings ${judgeExtension.findings.length} · ${judgedArtifact.integrity.artifactHash.slice(0, 12)}`,
    );

    if (args.write) {
      const baseName = path.basename(filePath, ".skai");
      const outputPath = path.join(process.cwd(), args.outputDir, `${baseName}.judged.skai`);
      await writeJsonFile(outputPath, judgedArtifact);
      console.log(`  wrote ${path.relative(process.cwd(), outputPath)}`);
    }

    if (args.regression) {
      const serialized = stableStringify({
        judge: judgedArtifact.extensions["skai.judge.v1"],
        coach: judgedArtifact.extensions["skai.coach.v1"],
      });

      if (!serialized.includes("inputGraphHash") || !serialized.includes("targetId")) {
        failed += 1;
        console.error(`fail ${relativePath}: extension regression shape missing graph references`);
      }
    }
  }

  if (failed > 0) {
    process.exitCode = 1;
  }
}

await main();

