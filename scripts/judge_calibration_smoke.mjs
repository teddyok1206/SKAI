#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const problemIds = ["ambiguous-research-brief", "club-budget-workflow", "counterfactual-product-review"];
const levels = ["weak", "average", "strong"];

function parseArgs(argv) {
  const args = {
    baseUrl: "http://127.0.0.1:3000",
    problem: "all",
    level: "all",
    write: true,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    const next = argv[index + 1];

    if (item === "--base-url" && next) {
      args.baseUrl = next;
      index += 1;
    } else if (item === "--problem" && next) {
      args.problem = next;
      index += 1;
    } else if (item === "--level" && next) {
      args.level = next;
      index += 1;
    } else if (item === "--no-write") {
      args.write = false;
    } else if (item === "--help") {
      printHelp();
      process.exit(0);
    }
  }

  return args;
}

function printHelp() {
  console.log(`SKAI judge calibration smoke

Usage:
  npm run calibrate:judge
  npm run calibrate:judge -- --problem ambiguous-research-brief
  npm run calibrate:judge -- --level strong

Options:
  --base-url   Local SKAI server URL. Default: http://127.0.0.1:3000
  --problem    all | ambiguous-research-brief | club-budget-workflow | counterfactual-product-review
  --level      all | weak | average | strong
  --no-write   Print only, do not write report files
`);
}

function isoAt(offsetSeconds) {
  return new Date(Date.UTC(2026, 5, 2, 6, 0, offsetSeconds)).toISOString();
}

function event(input) {
  return {
    id: input.id,
    attemptId: input.attemptId,
    problemId: input.problemId,
    role: input.role,
    content: input.content,
    provider: input.provider ?? "mock",
    model: input.model ?? "golden-sample",
    createdAt: input.createdAt,
    attachments: input.attachments,
  };
}

function materialAttachment(id, name, textContent) {
  return {
    id,
    name,
    mimeType: name.endsWith(".csv")
      ? "text/csv"
      : name.endsWith(".xlsx")
        ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        : "text/plain",
    size: textContent.length,
    source: "problem_material",
    materialId: id,
    textContent,
    createdAt: isoAt(1),
  };
}

function makeAttempt(problemId, level, turns, finalAnswer) {
  const attemptId = `golden-${problemId}-${level}`;
  const trace = turns.flatMap((turn, index) => {
    const pairIndex = index * 2;
    return [
      event({
        id: `${attemptId}-u${index + 1}`,
        attemptId,
        problemId,
        role: "user",
        content: turn.user,
        attachments: turn.attachments,
        createdAt: isoAt(pairIndex + 1),
      }),
      event({
        id: `${attemptId}-a${index + 1}`,
        attemptId,
        problemId,
        role: "assistant",
        content: turn.assistant,
        createdAt: isoAt(pairIndex + 2),
      }),
    ];
  });

  return {
    id: attemptId,
    problemId,
    level,
    expectedRank: levels.indexOf(level),
    trace,
    finalAnswer,
  };
}

function researchSamples() {
  return [
    makeAttempt(
      "ambiguous-research-brief",
      "weak",
      [
        {
          user: "생성형 AI가 교육에 미치는 영향 조사해줘.",
          assistant: "생성형 AI는 교육에 좋고 나쁜 영향이 모두 있습니다. 장점과 단점을 정리할 수 있습니다.",
        },
      ],
      "생성형 AI는 교육에 도움이 되지만 부작용도 있으므로 조심해야 한다.",
    ),
    makeAttempt(
      "ambiguous-research-brief",
      "average",
      [
        {
          user: "발표 대상과 시간을 아직 모르니 먼저 불확실한 조건을 정리하고 발표 주제 후보를 비교해줘.",
          assistant: "대상, 발표 시간, 목적, 최신 자료 필요 여부가 불명확합니다. 후보로 AI 튜터, 과제 평가, 디지털 격차 등이 있습니다.",
        },
        {
          user: "대학생 일반 청중 7분 발표로 가정하고 주제를 하나 골라 조사 질문과 출처 유형을 정리해줘.",
          assistant: "AI 튜터와 자기주도학습을 주제로 삼을 수 있습니다. 조사 질문과 출처 유형을 나누겠습니다.",
        },
      ],
      "주제는 생성형 AI 튜터가 자기주도학습에 미치는 영향이다. 조사 질문, 발표 구조, 출처 유형을 나눴지만 검증 계획은 더 보완해야 한다.",
    ),
    makeAttempt(
      "ambiguous-research-brief",
      "strong",
      [
        {
          user: "이 요청의 목표, 청중, 시간, 검증 기준이 불명확하다. 먼저 누락 조건을 짚고 후보 분야 5개를 비교해줘. 비교 기준은 흥미도, 조사 가능성, 논쟁성, AI 역량 연결성, 검증 난이도야.",
          assistant: "누락 조건과 후보 분야를 표로 비교하겠습니다. 각 후보의 장단점과 조건 변화에 따른 추천 변화를 함께 제시합니다.",
        },
        {
          user: "청중은 대학생/직장인 일반, 발표는 7분, 메시지는 AI 활용 역량으로 가정하자. 가장 적합한 주제를 하나 고르고 문제정의, 조사 질문 3개, 피해야 할 성급한 주장, 출처 유형을 제시해줘.",
          assistant: "AI 튜터와 학습 자기조절을 추천합니다. 문제정의, 조사 질문, 과장 위험, 출처 유형을 분리해 제시합니다.",
        },
        {
          user: "이제 내가 판단할 일과 AI에게 배분할 task를 나눠줘. 각 task의 입력, 출력, 검증 기준, 약한 중간 결과를 수정할 프롬프트까지 포함해줘.",
          assistant: "사용자 판단과 AI task를 분리하고, 각 task의 입력/출력/검증 기준 및 수정 프롬프트를 설계하겠습니다.",
        },
        {
          user: "최종 브리프를 작성하되 확정된 사실과 검증 필요 가정을 분리하고, 출처 확인 계획과 한계를 반드시 포함해줘.",
          assistant: "정제된 문제정의, 조사 질문, 핵심 주장 후보, 발표 구조, AI task, 검증 출처 유형, 남은 가정과 한계를 분리해 정리합니다.",
        },
      ],
      "정제된 문제정의: 생성형 AI 튜터가 대학생/직장인 일반 학습자의 자기주도학습 전략에 어떤 영향을 주는가. AI task는 후보 비교, 출처 후보 수집, 주장 초안, 반론 탐색으로 나누고 사용자는 청중 적합성, 최종 주장, 출처 신뢰도를 판단한다. 검증은 최근 연구, 학교 정책 문서, 실제 수업 사례, 반대 근거를 분리해 확인한다. 한계는 발표 시간과 최신 사례 검증 부족이다.",
    ),
  ];
}

function budgetSamples() {
  const receipt = materialAttachment(
    "receipt-001",
    "receipt-001.txt",
    "한빛문구 2026-05-12 네임펜 8,900 / 테이프 6,000 / A4 용지 5,500 / 합계 20,400",
  );
  const transfers = materialAttachment(
    "transfers-001",
    "may-transfers.xlsx",
    "입금 김민지 15000, 이도윤 15000, 박서연 15000 / 지출 한빛문구 20400, 피자 주문 78000 영수증 없음, 회의실 대관 50000",
  );
  const signup = materialAttachment(
    "signup-001",
    "signup-export.csv",
    "김민지, 이도윤, 박서연, 최현우 신청. 최현우 입금 내역 미발견.",
  );

  return [
    makeAttempt(
      "club-budget-workflow",
      "weak",
      [
        {
          user: "동아리 예산 정산 방법 알려줘.",
          assistant: "영수증과 계좌 내역을 잘 모아서 엑셀에 정리하면 됩니다.",
        },
      ],
      "영수증을 모으고 엑셀로 정리한다.",
    ),
    makeAttempt(
      "club-budget-workflow",
      "average",
      [
        {
          user: "영수증, 계좌이체, 신청 내역을 대조해야 한다. AI가 할 일과 사람이 검토할 일을 나눠줘.",
          assistant: "AI는 항목 추출과 대조표 초안을 만들고, 사람은 누락/중복과 개인정보를 검토해야 합니다.",
        },
        {
          user: "반복 운영 가능한 체크리스트 형식으로 정리해줘.",
          assistant: "자료 수집, 항목 표준화, 대조, 예외 확인, 최종 보고 순서의 체크리스트를 제안합니다.",
        },
      ],
      "AI는 자료 추출과 대조표 초안을 맡고 사람은 누락, 중복, 개인정보, 최종 승인 여부를 검토한다. 체크리스트는 만들었지만 실제 자료 근거 연결은 부족하다.",
    ),
    makeAttempt(
      "club-budget-workflow",
      "strong",
      [
        {
          user: "아래 자료를 기반으로 정산 workflow를 설계해줘. AI가 할 task, 사람이 확인할 task, 데이터 구조를 분리해야 해.",
          attachments: [receipt, transfers, signup],
          assistant: "자료 기준으로 지출/입금/신청자 대조 구조를 만들고 AI task와 사람 검토 task를 분리하겠습니다.",
        },
        {
          user: "각 task의 입력, 출력, 검증 기준을 표로 만들고 개인정보/계좌정보 처리 주의사항을 포함해줘.",
          assistant: "입력/출력/검증 기준과 개인정보 주의사항을 분리한 운영 표를 제시합니다.",
        },
        {
          user: "피자 영수증 없음, 최현우 입금 미발견 같은 실패 시나리오를 넣고 대응책을 만들어줘.",
          assistant: "누락 영수증, 입금자 불일치, 구글폼 누락, 중복 지출 등의 시나리오와 대응책을 제시합니다.",
        },
        {
          user: "최종 운영 체크리스트와 담당자가 바로 쓸 템플릿까지 작성해줘. 검증할 항목은 별도로 표시해줘.",
          assistant: "담당자용 체크리스트, 대조 템플릿, 예외 처리 메모, 최종 승인 기준을 정리합니다.",
        },
      ],
      "정산 workflow는 자료 수집, AI 추출, 표준 대조표 생성, 사람 검토, 예외 처리, 최종 승인 순서다. AI는 영수증/이체/신청 내역을 표준 항목으로 추출하고 사람은 피자 영수증 없음, 최현우 입금 미발견, 개인정보 노출, 회의실 계약서 확인을 검토한다. 최종 템플릿은 항목, 금액, 자료 출처, 검증 상태, 담당자 메모를 포함한다.",
    ),
  ];
}

function reviewSamples() {
  return [
    makeAttempt(
      "counterfactual-product-review",
      "weak",
      [
        {
          user: "앱 리뷰 보고 개선 우선순위 뽑아줘.",
          assistant: "불만이 많은 기능부터 고치면 됩니다.",
        },
      ],
      "리뷰에서 많이 나온 문제를 고치면 된다.",
    ),
    makeAttempt(
      "counterfactual-product-review",
      "average",
      [
        {
          user: "리뷰 수가 적고 편향될 수 있으니 분석 기준을 먼저 만들어줘.",
          assistant: "빈도, 심각도, 실행 가능성, 사용자 영향도를 기준으로 분류할 수 있습니다.",
        },
        {
          user: "우선순위와 추가로 수집할 데이터를 나눠줘.",
          assistant: "우선순위 후보와 추가 수집 데이터 항목을 분리하겠습니다.",
        },
      ],
      "분석 기준은 빈도, 심각도, 실행 가능성, 사용자 영향도다. 우선순위와 추가 데이터 수집 항목을 나눴지만 반례 검토는 약하다.",
    ),
    makeAttempt(
      "counterfactual-product-review",
      "strong",
      [
        {
          user: "리뷰 12개는 대표성이 약하다는 점을 전제로 분석 기준부터 설계해줘. 빈도만 보지 말고 심각도, 재현 가능성, 사용자 유형, 반례 가능성을 포함해줘.",
          assistant: "작은 데이터의 한계를 전제로 분석 기준과 분류표를 설계합니다.",
        },
        {
          user: "AI가 성급하게 결론내리지 않도록 각 우선순위 후보마다 근거, 반례, 추가 확인 질문을 붙여줘.",
          assistant: "각 후보에 대해 근거, 반례, 추가 확인 질문을 함께 제시합니다.",
        },
        {
          user: "최종 답은 지금 실행할 수 있는 개선과 추가 데이터가 필요한 항목으로 나눠줘. 한계와 검증 계획을 먼저 써줘.",
          assistant: "실행 우선순위와 추가 데이터 수집 계획을 분리하고 한계와 검증 계획을 포함합니다.",
        },
      ],
      "작은 리뷰 데이터는 대표성이 약하므로 결론보다 분석 기준과 검증 질문이 우선이다. 실행 항목은 재현 가능한 오류, 결제 이탈, 반복 불만처럼 심각도와 실행 가능성이 높은 것부터 둔다. 추가 데이터가 필요한 항목은 사용자군별 빈도, 재현 로그, 이탈률, 최근 버전 여부다. 각 우선순위에는 반례와 확인 질문을 붙여 과잉 일반화를 줄인다.",
    ),
  ];
}

function samples() {
  return [...researchSamples(), ...budgetSamples(), ...reviewSamples()];
}

function filteredSamples(args) {
  return samples().filter((sample) => {
    const problemMatches = args.problem === "all" || sample.problemId === args.problem;
    const levelMatches = args.level === "all" || sample.level === args.level;
    return problemMatches && levelMatches;
  });
}

async function judgeSample(baseUrl, sample) {
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/judge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      attemptId: sample.id,
      problemId: sample.problemId,
      trace: sample.trace,
      finalAnswer: sample.finalAnswer,
    }),
  });
  const body = await response.text();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${body.slice(0, 1000)}`);
  }

  return JSON.parse(body);
}

function orderingChecks(results) {
  return problemIds
    .map((problemId) => {
      const entries = results
        .filter((result) => result.problemId === problemId)
        .sort((a, b) => levels.indexOf(a.level) - levels.indexOf(b.level));

      if (entries.length < 3) {
        return undefined;
      }

      const [weak, average, strong] = entries;
      const weakAverageGap = average.totalScore - weak.totalScore;
      const averageStrongGap = strong.totalScore - average.totalScore;
      return {
        problemId,
        passed: weak.totalScore <= average.totalScore && average.totalScore <= strong.totalScore,
        gapPassed: weakAverageGap >= 6 && averageStrongGap >= 8,
        annotationPassed: entries.every((entry) => entry.graphAnnotationCount > 0),
        scores: {
          weak: weak.totalScore,
          average: average.totalScore,
          strong: strong.totalScore,
        },
        gaps: {
          weakAverage: weakAverageGap,
          averageStrong: averageStrongGap,
        },
      };
    })
    .filter(Boolean);
}

function calibrationStatus(results, checks, errors) {
  if (errors.length > 0) {
    return "failed";
  }

  if (results.length === 0 || checks.some((check) => !check.passed || !check.annotationPassed)) {
    return "failed";
  }

  if (checks.some((check) => !check.gapPassed)) {
    return "needs_review";
  }

  return "passed";
}

function graphAnnotationSummary(annotation) {
  return {
    id: annotation.id,
    targetKind: annotation.targetKind,
    targetId: annotation.targetId,
    kind: annotation.kind,
    severity: annotation.severity,
    axis: annotation.axis,
    confidence: annotation.confidence,
    title: annotation.title,
    evidenceTraceEventIds: annotation.evidenceTraceEventIds ?? [],
    source: annotation.source,
  };
}

function judgeRunSummary(run) {
  return {
    judgeKind: run.judgeKind,
    status: run.status,
    judgeProvider: run.judgeProvider,
    judgeModel: run.judgeModel,
    latencyMs: run.latencyMs,
    totalScore: run.totalScore,
    error: run.error,
  };
}

function reportMarkdown(report) {
  return [
    `# Judge Calibration ${report.startedAt}`,
    "",
    `- status: ${report.status}`,
    `- baseUrl: ${report.baseUrl}`,
    `- sampleCount: ${report.results.length}`,
    `- judgeModes: ${[...new Set(report.results.map((result) => result.judgeMode))].join(", ") || "none"}`,
    "",
    "## Ordering Checks",
    "",
    ...report.orderingChecks.map((check) => {
      const marker = check.passed && check.annotationPassed ? (check.gapPassed ? "pass" : "gap-review") : "fail";
      return `- ${check.problemId}: ${marker} (weak ${check.scores.weak}, average ${check.scores.average}, strong ${check.scores.strong}; gaps ${check.gaps.weakAverage}/${check.gaps.averageStrong}; annotations ${check.annotationPassed ? "yes" : "no"})`;
    }),
    report.orderingChecks.length === 0 ? "- no complete problem triplet in this run" : "",
    "",
    "## Results",
    "",
    ...report.results.map((result) =>
      [
        `### ${result.problemId} / ${result.level}`,
        "",
        `- totalScore: ${result.totalScore}`,
        `- judgeMode: ${result.judgeMode}`,
        result.judgePromptVersion ? `- judgePromptVersion: ${result.judgePromptVersion}` : "",
        typeof result.confidence === "number" ? `- confidence: ${result.confidence}` : "",
        typeof result.needsHumanReview === "boolean" ? `- needsHumanReview: ${result.needsHumanReview}` : "",
        result.judgeRuns.length > 0
          ? `- judgeRuns: ${result.judgeRuns.map((run) => `${run.judgeKind}:${run.status}${run.error ? `(${run.error.slice(0, 120)})` : ""}`).join(" / ")}`
          : "",
        `- graphAnnotations: ${result.graphAnnotationCount}`,
        result.graphAnnotations.length > 0
          ? `- graphTargets: ${result.graphAnnotations
              .slice(0, 4)
              .map((annotation) => `${annotation.targetKind}:${annotation.targetId}:${annotation.kind}`)
              .join(" / ")}`
          : "",
        `- bottlenecks: ${result.bottlenecks.join(", ") || "none"}`,
        `- axisScores: ${result.axisScores.map((axis) => `${axis.axis} ${axis.score}`).join(" / ")}`,
        "",
      ].join("\n"),
    ),
    report.errors.length > 0 ? "## Errors" : "",
    "",
    ...report.errors.map((error) => `- ${error.sampleId}: ${error.error}`),
    "",
  ].join("\n");
}

async function writeReport(report) {
  const outputDir = path.join(process.cwd(), "docs/technical/judge_calibration");
  const safeStartedAt = report.startedAt.replace(/[:.]/g, "-");
  const baseName = `${safeStartedAt}_judge_calibration`;
  const jsonPath = path.join(outputDir, `${baseName}.json`);
  const mdPath = path.join(outputDir, `${baseName}.md`);

  await mkdir(outputDir, { recursive: true });
  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(mdPath, reportMarkdown(report));

  return {
    json: path.relative(process.cwd(), jsonPath),
    markdown: path.relative(process.cwd(), mdPath),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const startedAt = new Date().toISOString();
  const selectedSamples = filteredSamples(args);
  const results = [];
  const errors = [];

  for (const sample of selectedSamples) {
    try {
      const report = await judgeSample(args.baseUrl, sample);
      results.push({
        sampleId: sample.id,
        problemId: sample.problemId,
        level: sample.level,
        expectedRank: sample.expectedRank,
        totalScore: report.totalScore,
        judgeMode: report.judgeMode ?? "heuristic",
        judgeProvider: report.judgeProvider,
        judgeModel: report.judgeModel,
        judgePromptVersion: report.judgePromptVersion,
        rubricVersion: report.rubricVersion,
        confidence: report.confidence,
        needsHumanReview: report.needsHumanReview,
        uncertaintyNotes: report.uncertaintyNotes ?? [],
        judgeRuns: report.judgeRuns?.map(judgeRunSummary) ?? [],
        judgeDisagreement: report.judgeDisagreement ?? [],
        graphAnnotationCount: report.graphAnnotations?.length ?? 0,
        graphAnnotations: report.graphAnnotations?.slice(0, 8).map(graphAnnotationSummary) ?? [],
        bottlenecks: report.bottlenecks?.map((item) => item.label) ?? [],
        axisScores: report.axisScores?.map((item) => ({
          axis: item.axis,
          score: item.score,
          confidence: item.confidence,
          evidenceIds: item.evidenceIds ?? [],
        })) ?? [],
      });
    } catch (error) {
      errors.push({
        sampleId: sample.id,
        problemId: sample.problemId,
        level: sample.level,
        error: error instanceof Error ? error.message : "Unknown judge calibration error.",
      });
    }
  }

  const checks = orderingChecks(results);
  const report = {
    startedAt,
    baseUrl: args.baseUrl,
    status: calibrationStatus(results, checks, errors),
    results,
    orderingChecks: checks,
    errors,
  };

  if (args.write) {
    report.reportPaths = await writeReport(report);
  }

  console.log(JSON.stringify(report, null, 2));

  if (report.status === "failed") {
    process.exitCode = 1;
  }
}

await main();
