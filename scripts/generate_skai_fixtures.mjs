#!/usr/bin/env node

import path from "node:path";
import { attachIntegrity, sha256Hex, writeJsonFile } from "./skai_file_common.mjs";

const outputDir = path.join(process.cwd(), "fixtures/skai");
const createdAt = "2026-06-04T00:00:00.000Z";

function compact(value, limit = 120) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length <= limit ? normalized : `${normalized.slice(0, limit - 1)}…`;
}

function event(input) {
  return {
    id: input.id,
    attemptId: input.attemptId,
    problemId: input.problemId,
    role: input.role,
    content: input.content,
    provider: input.provider ?? "mock",
    model: input.model ?? "fixture-model",
    createdAt: input.createdAt,
    attachments: input.attachments,
    sourceTraceEventId: input.sourceTraceEventId,
    branchId: input.branchId,
  };
}

function materialAttachment(id, name, textContent) {
  return {
    id,
    name,
    mimeType: name.endsWith(".csv") ? "text/csv" : "text/plain",
    size: textContent.length,
    source: "problem_material",
    materialId: id,
    textContent,
    createdAt,
  };
}

function traceFromTurns(attemptId, problemId, turns, branchId) {
  return turns.flatMap((turn, index) => [
    event({
      id: `${attemptId}-u${index + 1}`,
      attemptId,
      problemId,
      role: "user",
      content: turn.user,
      attachments: turn.attachments,
      createdAt: new Date(Date.UTC(2026, 5, 4, 0, index * 2, 0)).toISOString(),
      sourceTraceEventId: turn.userSourceTraceEventId,
      branchId,
    }),
    event({
      id: `${attemptId}-a${index + 1}`,
      attemptId,
      problemId,
      role: "assistant",
      content: turn.assistant,
      createdAt: new Date(Date.UTC(2026, 5, 4, 0, index * 2 + 1, 0)).toISOString(),
      sourceTraceEventId: turn.assistantSourceTraceEventId,
      branchId,
    }),
  ]);
}

function includesAny(value, words) {
  const normalized = value.toLowerCase();
  return words.some((word) => normalized.includes(word.toLowerCase()));
}

function edgeId(prefix, pairId, suffix) {
  return `${prefix}:${pairId}:${suffix}`;
}

function ensureIncidence(index, nodeId) {
  index.incidence[nodeId] ??= { incoming: [], outgoing: [] };
}

function addEdgeToIndex(index, edge) {
  index.adjacency[edge.sourceNodeId] ??= [];
  index.adjacency[edge.sourceNodeId].push(edge.targetNodeId);
  ensureIncidence(index, edge.sourceNodeId);
  ensureIncidence(index, edge.targetNodeId);
  index.incidence[edge.sourceNodeId].outgoing.push(edge.id);
  index.incidence[edge.targetNodeId].incoming.push(edge.id);
}

function inferStatus(prompt, response) {
  const reasons = [];

  if (includesAny(prompt.content, ["검증", "확인", "근거", "출처", "오류", "한계", "반례"])) {
    reasons.push("verification prompt signal");
    return { status: "verification", reasons };
  }

  if ((prompt.attachments?.length ?? 0) > 0) {
    reasons.push("material attached to prompt");
    return { status: "material_used", reasons };
  }

  if (response) {
    reasons.push("model response received");
    return { status: "responded", reasons };
  }

  reasons.push("waiting for model response");
  return { status: "pending", reasons };
}

function buildGraph(trace, branch) {
  const attemptId = trace[0]?.attemptId ?? "fixture-attempt";
  const promptNodes = [];
  const responseNodes = [];
  const statusNodes = [];
  const promptEdges = [];
  const responseEdges = [];
  const statusEdges = [];
  const pairs = [];
  const promptNodeByTraceEventId = {};
  const responseNodeByTraceEventId = {};
  const pairByPromptTraceEventId = {};
  const pairByResponseTraceEventId = {};
  let promptSequence = 0;
  let responseSequence = 0;
  let lastResponseNodeId = `response-origin:${attemptId}`;
  let lastStatusNodeId = "";
  let pendingPrompt;

  const responseOriginNode = {
    id: lastResponseNodeId,
    kind: "response",
    label: "Response origin",
    summary: "Conversation state before the first model response.",
    sequence: -1,
    synthetic: true,
  };

  function isBranchBreakpoint(promptEvent, responseEvent) {
    if (!branch) {
      return false;
    }

    return (
      promptEvent.sourceTraceEventId === branch.parentTraceEventId ||
      responseEvent?.sourceTraceEventId === branch.parentTraceEventId ||
      promptEvent.id === branch.parentTraceEventId ||
      responseEvent?.id === branch.parentTraceEventId
    );
  }

  function finalizePrompt(input) {
    const pairId = `pair:${input.promptEvent.id}:${input.responseEvent?.id ?? "pending"}`;
    const inferred = inferStatus(input.promptEvent, input.responseEvent);
    const isBreakpoint = isBranchBreakpoint(input.promptEvent, input.responseEvent);
    const statusNodeId = `status:${pairId}`;
    const statusReasons = isBreakpoint ? [...inferred.reasons, "breakpoint replay anchor"] : inferred.reasons;

    statusNodes.push({
      id: statusNodeId,
      kind: "task_status",
      pairId,
      label: inferred.status,
      summary: statusReasons.join("; "),
      sequence: input.sequence,
    });
    pairs.push({
      id: pairId,
      sequence: input.sequence,
      promptNodeId: input.promptNodeId,
      responseNodeId: input.responseNodeId,
      statusNodeId,
      promptTraceEventId: input.promptEvent.id,
      responseTraceEventId: input.responseEvent?.id,
      status: inferred.status,
      statusReasons,
      isBreakpoint,
    });
    pairByPromptTraceEventId[input.promptEvent.id] = pairId;
    if (input.responseEvent) {
      pairByResponseTraceEventId[input.responseEvent.id] = pairId;
    }

    if (input.responseEvent && input.responseNodeId) {
      promptEdges.push({
        id: edgeId("prompt-edge", pairId, "llm-response"),
        projection: "prompt_graph",
        sourceNodeId: input.promptNodeId,
        targetNodeId: input.nextPromptNodeId,
        traceEventId: input.responseEvent.id,
        pairId,
        dualNodeId: input.responseNodeId,
        label: compact(input.responseEvent.content, 80),
        sequence: input.sequence,
      });
      responseEdges.push({
        id: edgeId("response-edge", pairId, "user-prompt"),
        projection: "response_graph",
        sourceNodeId: input.previousResponseNodeId,
        targetNodeId: input.responseNodeId,
        traceEventId: input.promptEvent.id,
        pairId,
        dualNodeId: input.promptNodeId,
        label: compact(input.promptEvent.content, 80),
        sequence: input.sequence,
      });
    }

    if (lastStatusNodeId) {
      statusEdges.push({
        id: edgeId("status-edge", pairId, "status-progression"),
        projection: "status_layer",
        sourceNodeId: lastStatusNodeId,
        targetNodeId: statusNodeId,
        traceEventId: input.promptEvent.id,
        pairId,
        dualNodeId: input.promptNodeId,
        label: "status progression",
        sequence: input.sequence,
      });
    }

    lastStatusNodeId = statusNodeId;
  }

  for (const item of trace) {
    if (item.role === "user") {
      const promptNodeId = `prompt:${item.id}`;
      promptNodes.push({
        id: promptNodeId,
        kind: "prompt",
        traceEventId: item.id,
        sourceTraceEventId: item.sourceTraceEventId,
        branchId: item.branchId,
        label: `Prompt ${promptSequence + 1}`,
        summary: compact(item.content),
        sequence: promptSequence,
      });
      promptNodeByTraceEventId[item.id] = promptNodeId;

      if (pendingPrompt) {
        finalizePrompt({
          promptEvent: pendingPrompt.event,
          promptNodeId: pendingPrompt.nodeId,
          previousResponseNodeId: pendingPrompt.previousResponseNodeId,
          sequence: pendingPrompt.sequence,
          nextPromptNodeId: promptNodeId,
          responseEvent: pendingPrompt.responseEvent,
          responseNodeId: pendingPrompt.responseNodeId,
        });
      }

      pendingPrompt = {
        event: item,
        nodeId: promptNodeId,
        sequence: promptSequence,
        previousResponseNodeId: lastResponseNodeId,
      };
      promptSequence += 1;
    }

    if (item.role === "assistant") {
      const responseNodeId = `response:${item.id}`;
      responseNodes.push({
        id: responseNodeId,
        kind: "response",
        traceEventId: item.id,
        sourceTraceEventId: item.sourceTraceEventId,
        branchId: item.branchId,
        label: `Response ${responseSequence + 1}`,
        summary: compact(item.content),
        sequence: responseSequence,
      });
      responseNodeByTraceEventId[item.id] = responseNodeId;

      if (pendingPrompt && !pendingPrompt.responseEvent) {
        pendingPrompt = {
          ...pendingPrompt,
          responseEvent: item,
          responseNodeId,
        };
      }

      lastResponseNodeId = responseNodeId;
      responseSequence += 1;
    }
  }

  const promptTerminalNode = {
    id: `prompt-terminal:${attemptId}`,
    kind: "prompt",
    label: "Prompt terminal",
    summary: "No later user prompt in this branch.",
    sequence: promptNodes.length,
    synthetic: true,
  };

  if (pendingPrompt) {
    finalizePrompt({
      promptEvent: pendingPrompt.event,
      promptNodeId: pendingPrompt.nodeId,
      previousResponseNodeId: pendingPrompt.previousResponseNodeId,
      sequence: pendingPrompt.sequence,
      nextPromptNodeId: promptTerminalNode.id,
      responseEvent: pendingPrompt.responseEvent,
      responseNodeId: pendingPrompt.responseNodeId,
    });
  }

  const allPromptNodes = promptNodes.length > 0 ? [...promptNodes, promptTerminalNode] : promptNodes;
  const allResponseNodes = responseNodes.length > 0 ? [responseOriginNode, ...responseNodes] : responseNodes;
  const index = {
    promptNodeByTraceEventId,
    responseNodeByTraceEventId,
    pairByPromptTraceEventId,
    pairByResponseTraceEventId,
    adjacency: {},
    incidence: {},
    annotationIdsByTargetId: {},
    annotationIdsByTraceEventId: {},
    annotationIdsByKind: {},
  };

  [...allPromptNodes, ...allResponseNodes, ...statusNodes].forEach((node) => ensureIncidence(index, node.id));
  [...promptEdges, ...responseEdges, ...statusEdges].forEach((edge) => addEdgeToIndex(index, edge));

  let branchGraph;

  if (branch) {
    const clonedTraceEventIds = trace.reduce((acc, item) => {
      if (item.sourceTraceEventId) {
        acc[item.id] = item.sourceTraceEventId;
      }
      return acc;
    }, {});
    const breakpointEvent = trace.find(
      (item) => item.sourceTraceEventId === branch.parentTraceEventId || item.id === branch.parentTraceEventId,
    );
    const breakpointTraceEventId = breakpointEvent?.id;
    const breakpointNodeId = breakpointTraceEventId
      ? promptNodeByTraceEventId[breakpointTraceEventId] ?? responseNodeByTraceEventId[breakpointTraceEventId]
      : undefined;
    const breakpointPairId = breakpointTraceEventId
      ? pairByPromptTraceEventId[breakpointTraceEventId] ?? pairByResponseTraceEventId[breakpointTraceEventId]
      : undefined;

    branchGraph = {
      ...branch,
      breakpointTraceEventId,
      breakpointNodeId,
      breakpointPairId,
      clonedTraceEventIds,
    };
  }

  return {
    attemptId,
    promptNodes: allPromptNodes,
    responseNodes: allResponseNodes,
    statusNodes,
    promptEdges,
    responseEdges,
    statusEdges,
    pairs,
    annotations: [],
    index,
    branch: branchGraph,
  };
}

function primarySource(trace) {
  const sourceEvent = trace.find((item) => item.role === "assistant" && item.provider && item.model) ?? trace.find((item) => item.provider && item.model);

  return {
    primaryProvider: sourceEvent?.provider,
    primaryModel: sourceEvent?.model,
  };
}

async function materialSnapshot(material) {
  return {
    id: material.id,
    title: material.title,
    kind: material.kind,
    fileName: material.fileName,
    mimeType: material.mimeType,
    extractedTextHash: sha256Hex(material.extractedText),
  };
}

async function problemSnapshot(problem) {
  return {
    id: problem.id,
    title: problem.title,
    category: problem.category,
    difficulty: problem.difficulty,
    goalProfile: problem.goalProfile,
    estimatedMinutes: problem.estimatedMinutes,
    constraints: problem.constraints,
    deliverables: problem.deliverables,
    materials: await Promise.all((problem.materials ?? []).map(materialSnapshot)),
  };
}

async function buildArtifact(input) {
  const childGraph = buildGraph(input.trace, input.branch);
  const parentGraph = input.parentTrace ? buildGraph(input.parentTrace) : undefined;
  const payload = {
    problem: await problemSnapshot(input.problem),
    attempt: {
      id: input.attemptId,
      attemptId: input.attemptId,
      problemId: input.problem.id,
      title: input.title,
      trace: input.trace,
      branch: input.branch,
      solvingMode: "single_model",
      createdAt,
    },
    graph: {
      child: childGraph,
      parent: parentGraph,
    },
    branch:
      input.branch && input.parentTrace
        ? {
            parentAttemptId: input.branch.parentAttemptId,
            childAttemptId: input.attemptId,
            breakpointTraceEventId: input.branch.parentTraceEventId,
            breakpointTraceIndex: input.branch.parentTraceIndex,
            breakpointPairId: input.branch.parentPairId,
            parentTrace: input.parentTrace,
            childTrace: input.trace,
          }
        : undefined,
  };
  const artifactWithoutIntegrity = {
    format: "SKAI",
    schemaVersion: "skai.file.v1",
    mimeType: "application/vnd.skai+json",
    extension: ".skai",
    createdAt,
    manifest: {
      artifactId: `skai:${input.attemptId}:${createdAt}`,
      title: input.title,
      problemId: input.problem.id,
      attemptId: input.attemptId,
      parentAttemptId: input.branch?.parentAttemptId,
      source: {
        platform: "skai",
        conversationId: input.attemptId,
        exportedFrom: "skai-web",
        ...primarySource(input.trace),
      },
      createdAt,
      exportedBy: "skai",
      schemaVersion: "skai.file.v1",
      sections: Object.entries(payload)
        .filter(([, value]) => value !== undefined)
        .map(([key]) => key),
      privacy: {
        rawTrace: "included",
        contextDebug: "stripped",
        attachmentBinary: "omitted",
        attachmentText: "included_when_public",
      },
    },
    payload,
  };

  return attachIntegrity(artifactWithoutIntegrity);
}

function problem(input) {
  return {
    id: input.id,
    title: input.title,
    category: input.category ?? "research",
    difficulty: input.difficulty ?? "standard",
    goalProfile: input.goalProfile ?? "learning_oriented",
    estimatedMinutes: input.estimatedMinutes ?? 15,
    constraints: input.constraints ?? ["불명확한 목표를 먼저 구조화할 것", "최종 산출물과 검증 기준을 분리할 것"],
    deliverables: input.deliverables ?? ["문제정의", "task 분배", "검증 계획", "최종 산출물"],
    materials: input.materials ?? [],
  };
}

function fixtureDefinitions() {
  const researchProblem = problem({
    id: "ambiguous-research-brief",
    title: "교육 발표 주제 선정",
  });
  const budgetMaterial = {
    id: "receipt-summary",
    title: "정산 자료 묶음",
    kind: "spreadsheet",
    fileName: "club-budget.csv",
    mimeType: "text/csv",
    extractedText: "신청자: 김민지, 이도윤, 박서연, 최현우 / 입금 누락: 최현우 / 영수증 누락: 피자 주문 78000원",
  };
  const budgetProblem = problem({
    id: "club-budget-workflow",
    title: "동아리 정산 workflow",
    category: "workplace",
    materials: [budgetMaterial],
  });
  const receiptAttachment = materialAttachment("receipt-summary", "club-budget.csv", budgetMaterial.extractedText);

  const parentAttemptId = "fixture-branch-parent";
  const branchId = "fixture-branch-001";
  const parentTrace = traceFromTurns(parentAttemptId, "counterfactual-product-review", [
    {
      user: "앱 리뷰를 보고 개선 우선순위를 뽑아줘.",
      assistant: "리뷰를 요약하면 성능, 가격, UI 개선이 중요해 보입니다.",
    },
    {
      user: "그냥 최종 우선순위 3개로 정리해줘.",
      assistant: "1. 성능 개선 2. 가격 정책 3. UI 개선입니다.",
    },
  ]);

  return [
    {
      fileName: "good-decomposition.skai",
      attemptId: "fixture-good-decomposition",
      problem: researchProblem,
      title: "Fixture: Strong Decomposition",
      trace: traceFromTurns("fixture-good-decomposition", researchProblem.id, [
        {
          user: "생성형 AI가 교육에 미치는 영향을 발표해야 한다. 바로 답하지 말고 목표, 청중, 시간, 검증 기준의 불확실성을 먼저 분해해줘.",
          assistant: "목표, 청중, 발표 시간, 검증 기준이 불명확합니다. 후보 주제와 판단 기준을 분리하겠습니다.",
        },
        {
          user: "청중은 대학생/직장인 일반, 발표는 7분으로 가정한다. 후보 5개를 흥미도, 조사 가능성, 논쟁성, AI 역량 연결성으로 비교해줘.",
          assistant: "AI 튜터, 평가 자동화, 디지털 격차, 교사 업무 자동화, 표절 탐지를 비교할 수 있습니다.",
        },
        {
          user: "가장 적합한 주제를 하나 고르고 AI에게 맡길 task와 내가 판단할 task를 분리해줘.",
          assistant: "AI 튜터와 자기주도학습을 추천합니다. AI는 후보 근거 수집과 반론 탐색을 맡고 사용자는 메시지와 출처 신뢰도를 판단합니다.",
        },
        {
          user: "최종 브리프를 만들되 확정 사실, 검증 필요 가정, 출처 확인 계획, 한계를 분리해줘.",
          assistant: "문제정의, 조사 질문, 핵심 주장 후보, 검증 계획, 한계가 분리된 발표 브리프를 제시합니다.",
        },
      ]),
    },
    {
      fileName: "one-shot-failure.skai",
      attemptId: "fixture-one-shot-failure",
      problem: researchProblem,
      title: "Fixture: One Shot Failure",
      trace: traceFromTurns("fixture-one-shot-failure", researchProblem.id, [
        {
          user: "생성형 AI가 교육에 미치는 영향 발표 자료 만들어줘.",
          assistant: "생성형 AI는 교육에 장점과 단점이 있습니다. 장점은 개인화 학습이고 단점은 표절과 의존성입니다.",
        },
      ]),
    },
    {
      fileName: "material-ignored.skai",
      attemptId: "fixture-material-ignored",
      problem: budgetProblem,
      title: "Fixture: Material Ignored",
      trace: traceFromTurns("fixture-material-ignored", budgetProblem.id, [
        {
          user: "동아리 정산 workflow 만들어줘.",
          assistant: "영수증을 모으고 계좌 내역을 엑셀로 정리한 뒤 검토하면 됩니다.",
        },
        {
          user: "체크리스트로 바꿔줘.",
          assistant: "자료 수집, 항목 정리, 검토, 보고 순서로 체크리스트를 만들 수 있습니다.",
        },
      ]),
    },
    {
      fileName: "strong-verification.skai",
      attemptId: "fixture-strong-verification",
      problem: budgetProblem,
      title: "Fixture: Strong Verification",
      trace: traceFromTurns("fixture-strong-verification", budgetProblem.id, [
        {
          user: "첨부 자료를 기준으로 정산 workflow를 설계해줘. AI task와 사람이 검증할 task를 분리해.",
          attachments: [receiptAttachment],
          assistant: "자료에서 신청자, 입금 누락, 영수증 누락을 추출하고 AI task와 사람 검증 task를 나누겠습니다.",
        },
        {
          user: "최현우 입금 누락과 피자 영수증 누락을 예외 시나리오로 표시하고 대응책을 넣어줘.",
          assistant: "두 예외를 분리하고 담당자 확인, 추가 증빙 요청, 최종 승인 보류 기준을 제시합니다.",
        },
        {
          user: "이 workflow의 오류 가능성과 검증해야 할 근거를 다시 확인해줘.",
          assistant: "입금자명 불일치, 영수증 누락, 개인정보 노출, 자료 최신성 문제가 검증 대상입니다.",
        },
      ]),
    },
    {
      fileName: "branch-replay.skai",
      attemptId: "fixture-branch-replay",
      problem: problem({
        id: "counterfactual-product-review",
        title: "리뷰 분석 branch replay",
        category: "strategy",
      }),
      title: "Fixture: Branch Replay",
      parentTrace,
      branch: {
        id: branchId,
        mode: "breakpoint_replay",
        parentAttemptId,
        parentTraceEventId: `${parentAttemptId}-u2`,
        parentTraceIndex: 2,
        label: "우선순위 요청을 검증 중심으로 재시작",
        createdAt,
      },
      trace: traceFromTurns(
        "fixture-branch-replay",
        "counterfactual-product-review",
        [
          {
            user: "앱 리뷰를 보고 개선 우선순위를 뽑아줘.",
            assistant: "리뷰를 요약하면 성능, 가격, UI 개선이 중요해 보입니다.",
            userSourceTraceEventId: `${parentAttemptId}-u1`,
            assistantSourceTraceEventId: `${parentAttemptId}-a1`,
          },
          {
            user: "여기서 다시 시작하자. 우선순위를 내기 전에 리뷰 근거, 불확실성, 확인해야 할 데이터를 분리해줘.",
            assistant: "리뷰 근거, 불확실성, 확인 필요 데이터를 분리하고 우선순위 판단 기준을 제시합니다.",
            userSourceTraceEventId: `${parentAttemptId}-u2`,
          },
          {
            user: "그 기준으로 최종 우선순위를 만들고 왜 이전 답보다 나은지 설명해줘.",
            assistant: "근거와 불확실성을 반영한 우선순위와 branch 개선 이유를 설명합니다.",
          },
        ],
        branchId,
      ),
    },
  ];
}

async function main() {
  const fixtures = fixtureDefinitions();

  for (const fixture of fixtures) {
    const artifact = await buildArtifact(fixture);
    const filePath = path.join(outputDir, fixture.fileName);
    await writeJsonFile(filePath, artifact);
    console.log(`wrote ${path.relative(process.cwd(), filePath)} · ${artifact.integrity.artifactHash.slice(0, 12)}`);
  }
}

await main();
