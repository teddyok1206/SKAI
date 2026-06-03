"use client";

import { useMemo, useState } from "react";
import { GitBranch, Info, Network, Workflow } from "lucide-react";
import type {
  ConversationGraph,
  ConversationGraphAnnotation,
  ConversationGraphNode,
  ConversationGraphPair,
  TraceEvent,
} from "@/lib/types";

function nodeKindLabel(kind: ConversationGraphNode["kind"]) {
  if (kind === "prompt") {
    return "Prompt node";
  }

  if (kind === "response") {
    return "Response node";
  }

  return "Task status";
}

function statusClass(pair?: ConversationGraphPair) {
  return pair ? `graph-status ${pair.status} ${pair.isBreakpoint ? "breakpoint" : ""}` : "graph-status";
}

function annotationKindLabel(kind: ConversationGraphAnnotation["kind"]) {
  const labels: Record<ConversationGraphAnnotation["kind"], string> = {
    framing: "Framing",
    decomposition: "Decomposition",
    delegation: "Delegation",
    material_grounding: "Material",
    verification: "Verification",
    adaptation: "Adaptation",
    context_drift: "Drift",
    bottleneck: "Bottleneck",
    recovery: "Recovery",
    finalization: "Finalization",
    model_behavior: "Model",
    cost_efficiency: "Cost",
  };

  return labels[kind];
}

function annotationSourceLabel(source: ConversationGraphAnnotation["source"]) {
  if (source === "heuristic_judge") {
    return "heuristic judge";
  }

  if (source === "llm_judge") {
    return "LLM judge";
  }

  return source;
}

function compactText(value: string, limit = 120) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= limit) {
    return normalized;
  }

  return `${normalized.slice(0, limit - 1)}…`;
}

function nodeToken(node: ConversationGraphNode) {
  if (node.synthetic) {
    return node.kind === "prompt" ? "PT" : "RO";
  }

  if (node.kind === "prompt") {
    return `P${node.sequence + 1}`;
  }

  if (node.kind === "response") {
    return `R${node.sequence + 1}`;
  }

  return `S${node.sequence + 1}`;
}

function fixedNodeCaption(node: ConversationGraphNode, pair?: ConversationGraphPair) {
  if (node.kind === "task_status" && pair) {
    return pair.status.replace("_", " ");
  }

  if (node.synthetic) {
    return "synthetic";
  }

  return nodeKindLabel(node.kind).replace(" node", "");
}

function GraphNodeButton({
  node,
  selected,
  pair,
  annotationCount = 0,
  onSelect,
}: {
  node?: ConversationGraphNode;
  selected: boolean;
  pair?: ConversationGraphPair;
  annotationCount?: number;
  onSelect: (nodeId: string) => void;
}) {
  if (!node) {
    return <div className="graph-node missing">NA</div>;
  }

  return (
    <button
      className={`graph-node ${node.kind} ${selected ? "selected" : ""} ${pair?.isBreakpoint ? "breakpoint" : ""}`}
      onClick={() => onSelect(node.id)}
      title={node.summary}
      type="button"
    >
      <strong>{nodeToken(node)}</strong>
      <span>{fixedNodeCaption(node, pair)}</span>
      {node.sourceTraceEventId ? <em>source</em> : null}
      {annotationCount > 0 ? <small className="graph-annotation-badge">{annotationCount}</small> : null}
    </button>
  );
}

export function ConversationGraphView({
  graph,
  trace,
  onBranchTraceEvent,
}: {
  graph: ConversationGraph;
  trace: TraceEvent[];
  onBranchTraceEvent?: (traceEventId: string) => void;
}) {
  const allNodes = useMemo(
    () => [...graph.promptNodes, ...graph.responseNodes, ...graph.statusNodes],
    [graph.promptNodes, graph.responseNodes, graph.statusNodes],
  );
  const nodeById = useMemo(() => new Map(allNodes.map((node) => [node.id, node])), [allNodes]);
  const annotationById = useMemo(
    () => new Map(graph.annotations.map((annotation) => [annotation.id, annotation])),
    [graph.annotations],
  );
  const traceById = useMemo(() => new Map(trace.map((event) => [event.id, event])), [trace]);
  const firstSelectableNode = allNodes.find((node) => !node.synthetic)?.id ?? allNodes[0]?.id ?? null;
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(firstSelectableNode);
  const effectiveSelectedNodeId = selectedNodeId && nodeById.has(selectedNodeId) ? selectedNodeId : firstSelectableNode;
  const selectedNode = effectiveSelectedNodeId ? nodeById.get(effectiveSelectedNodeId) : undefined;
  const selectedPair =
    graph.pairs.find(
      (pair) =>
        pair.id === selectedNode?.pairId ||
        pair.promptNodeId === selectedNode?.id ||
        pair.responseNodeId === selectedNode?.id ||
        pair.statusNodeId === selectedNode?.id,
    ) ?? undefined;
  const selectedTrace = selectedNode?.traceEventId ? traceById.get(selectedNode.traceEventId) : undefined;
  const branchTraceEventId =
    selectedTrace?.id ?? selectedPair?.promptTraceEventId ?? selectedPair?.responseTraceEventId ?? undefined;
  const selectedAnnotations = useMemo(() => {
    const annotationIds = new Set<string>();

    for (const targetId of [selectedNode?.id, selectedPair?.id]) {
      if (!targetId) {
        continue;
      }

      for (const annotationId of graph.index.annotationIdsByTargetId[targetId] ?? []) {
        annotationIds.add(annotationId);
      }
    }

    if (selectedTrace?.id) {
      for (const annotationId of graph.index.annotationIdsByTraceEventId[selectedTrace.id] ?? []) {
        annotationIds.add(annotationId);
      }
    }

    return [...annotationIds].map((annotationId) => annotationById.get(annotationId)).filter(Boolean) as ConversationGraphAnnotation[];
  }, [annotationById, graph.index.annotationIdsByTargetId, graph.index.annotationIdsByTraceEventId, selectedNode, selectedPair, selectedTrace]);

  function annotationCountForNode(node?: ConversationGraphNode, pair?: ConversationGraphPair) {
    if (!node) {
      return 0;
    }

    const annotationIds = new Set<string>();

    for (const targetId of [node.id, pair?.id]) {
      if (!targetId) {
        continue;
      }

      for (const annotationId of graph.index.annotationIdsByTargetId[targetId] ?? []) {
        annotationIds.add(annotationId);
      }
    }

    return annotationIds.size;
  }

  function selectNode(nodeId: string) {
    setSelectedNodeId(nodeId);
  }

  function renderDualGraph() {
    if (graph.pairs.length === 0) {
      return (
        <div className="empty compact-empty">
          <div>
            <Network size={24} />
            <p>아직 graph로 만들 prompt-response pair가 없습니다.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="graph-dual-spine" aria-label="3 dimensional dual graph">
        <div className="graph-dual-spine-head">
          <span>Prompt graph</span>
          <span>Response graph</span>
        </div>
        {graph.pairs.map((pair) => {
          const promptNode = nodeById.get(pair.promptNodeId);
          const statusNode = nodeById.get(pair.statusNodeId);
          const responseNode = pair.responseNodeId ? nodeById.get(pair.responseNodeId) : undefined;
          const hasPromptNode = Boolean(promptNode && !promptNode.synthetic);
          const hasResponseNode = Boolean(responseNode && !responseNode.synthetic);
          const hasPreviousResponseNode = graph.responseNodes.some((node) => node.sequence === pair.sequence - 1 && !node.synthetic);
          const hasNextPromptNode = graph.promptNodes.some((node) => node.sequence === pair.sequence + 1 && !node.synthetic);
          const hasOriginStub = pair.sequence === 0 && hasPromptNode && hasResponseNode;
          const topRungVisible = hasPromptNode && hasResponseNode && (hasOriginStub || hasPreviousResponseNode);
          const lowerRungVisible = hasPromptNode && hasResponseNode && hasNextPromptNode;
          const statusVisible = hasPromptNode && hasResponseNode;
          const selectedNodeSequence = selectedNode && !selectedNode.synthetic ? selectedNode.sequence : undefined;
          const pairSetActive = selectedNodeSequence === pair.sequence;
          const topRungActive = topRungVisible && pairSetActive;
          const lowerRungActive = lowerRungVisible && pairSetActive;
          const ladderArrowId = `graph-ladder-arrow-${pair.sequence}`;

          return (
            <div className={`graph-dual-spine-row ${pair.isBreakpoint ? "breakpoint" : ""}`} key={pair.id}>
              <svg aria-hidden="true" className="graph-dual-ladder" preserveAspectRatio="none" viewBox="0 0 400 220">
                <defs>
                  <marker
                    id={ladderArrowId}
                    markerHeight="8"
                    markerUnits="strokeWidth"
                    markerWidth="8"
                    orient="auto"
                    refX="8"
                    refY="4"
                    viewBox="0 0 8 8"
                  >
                    <path className="graph-ladder-arrowhead" d="M 0 0 L 8 4 L 0 8 z" />
                  </marker>
                </defs>
                {hasOriginStub ? <line className="graph-ladder-origin-stub" x1="300" x2="300" y1="54" y2="130" /> : null}
                {topRungVisible ? (
                  <line
                    className={`graph-ladder-rung node-to-edge ${topRungActive ? "active" : ""}`}
                    markerEnd={`url(#${ladderArrowId})`}
                    x1="100"
                    x2="300"
                    y1="54"
                    y2="54"
                  />
                ) : null}
                {lowerRungVisible ? (
                  <line
                    className={`graph-ladder-rung response-to-prompt-edge ${lowerRungActive ? "active" : ""}`}
                    markerEnd={`url(#${ladderArrowId})`}
                    x1="300"
                    x2="100"
                    y1="164"
                    y2="164"
                  />
                ) : null}
                {topRungActive ? (
                  <circle className="graph-ladder-packet" r="3">
                    <animateMotion dur="1500ms" path="M100 54 H300" repeatCount="indefinite" />
                  </circle>
                ) : null}
                {lowerRungActive ? (
                  <circle className="graph-ladder-packet secondary" r="3">
                    <animateMotion dur="1350ms" path="M300 164 H100" repeatCount="indefinite" />
                  </circle>
                ) : null}
              </svg>
              {statusVisible ? (
                <div className={`graph-status-cell-node ${pairSetActive ? "active" : ""}`}>
                  <svg aria-hidden="true" className="graph-status-swirl" viewBox="0 0 96 96">
                    <path className="graph-status-swirl-track" d="M69 23A32 32 0 1 0 78 58" />
                    <path className="graph-status-swirl-arrow" d="M71 14L68 27L82 24Z" />
                  </svg>
                  <GraphNodeButton
                    node={statusNode}
                    pair={pair}
                    annotationCount={annotationCountForNode(statusNode, pair)}
                    selected={pairSetActive}
                    onSelect={selectNode}
                  />
                </div>
              ) : null}

              <div className="graph-spine-slot prompt-spine">
                <div className="graph-node-slot">
                  <GraphNodeButton
                    node={promptNode}
                    pair={pair}
                    annotationCount={annotationCountForNode(promptNode, pair)}
                    selected={pairSetActive}
                    onSelect={selectNode}
                  />
                </div>
              </div>

              <div className="graph-spine-slot response-spine">
                <div className="graph-node-slot">
                  {responseNode ? (
                    <GraphNodeButton
                      node={responseNode}
                      pair={pair}
                      annotationCount={annotationCountForNode(responseNode, pair)}
                      selected={pairSetActive}
                      onSelect={selectNode}
                    />
                  ) : (
                    <div className="graph-node missing">wait</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="conversation-graph-view">
      <div className="graph-overview">
        <div className="graph-stat">
          <strong>{graph.promptNodes.length}</strong>
          <span>prompt nodes</span>
        </div>
        <div className="graph-stat">
          <strong>{graph.responseNodes.length}</strong>
          <span>response nodes</span>
        </div>
        <div className="graph-stat">
          <strong>{graph.statusNodes.length}</strong>
          <span>status nodes</span>
        </div>
        <div className="graph-stat">
          <strong>{graph.pairs.length}</strong>
          <span>paired turns</span>
        </div>
        <div className="graph-stat">
          <strong>{graph.annotations.length}</strong>
          <span>annotations</span>
        </div>
      </div>

      <div className="graph-workspace">
        <div className="graph-canvas">{renderDualGraph()}</div>

        <aside className="graph-detail-panel">
          <div>
            <p className="eyebrow">Selected Node</p>
            <h3>{selectedNode?.label ?? "No node selected"}</h3>
            <p className="muted">{selectedNode ? nodeKindLabel(selectedNode.kind) : "Send a prompt to populate the graph."}</p>
          </div>
          {selectedPair ? (
            <div className="graph-status-group">
              <span className={statusClass(selectedPair)}>{selectedPair.status}</span>
              {selectedPair.isBreakpoint ? (
                <span className="graph-status breakpoint">
                  <GitBranch size={13} /> breakpoint
                </span>
              ) : null}
            </div>
          ) : null}
          {selectedTrace ? (
            <pre className="graph-detail-content">{selectedTrace.content}</pre>
          ) : (
            <p className="muted">{selectedNode?.summary ?? "No trace event is attached to this synthetic node."}</p>
          )}
          {selectedPair ? (
            <div className="graph-reason-list">
              <strong>Task status reasons</strong>
              {selectedPair.statusReasons.map((reason) => (
                <span key={reason}>{reason}</span>
              ))}
            </div>
          ) : null}
          <div className="graph-annotation-list">
            <strong>Graph annotations</strong>
            {selectedAnnotations.length === 0 ? (
              <span className="muted">No annotations on this graph state yet.</span>
            ) : (
              selectedAnnotations.map((annotation) => (
                <article className={`graph-annotation-card ${annotation.severity}`} key={annotation.id}>
                  <div>
                    <span>{annotationKindLabel(annotation.kind)}</span>
                    <small>{annotationSourceLabel(annotation.source)}</small>
                  </div>
                  <h4>{annotation.title}</h4>
                  <p>{annotation.explanation}</p>
                  <footer>
                    <span>confidence {Math.round(annotation.confidence * 100)}%</span>
                    {typeof annotation.scoreImpact === "number" ? <span>impact {annotation.scoreImpact > 0 ? "+" : ""}{annotation.scoreImpact}</span> : null}
                  </footer>
                  {annotation.evidenceTraceEventIds.length > 0 ? (
                    <div className="graph-annotation-evidence">
                      <Info size={13} />
                      <span>
                        {annotation.evidenceTraceEventIds
                          .map((traceEventId) => {
                            const event = traceById.get(traceEventId);
                            return event ? `${event.role}: ${compactText(event.content, 72)}` : traceEventId;
                          })
                          .join(" / ")}
                      </span>
                    </div>
                  ) : null}
                </article>
              ))
            )}
          </div>
          {onBranchTraceEvent && branchTraceEventId ? (
            <button className="button primary" onClick={() => onBranchTraceEvent(branchTraceEventId)} type="button">
              <GitBranch size={15} /> Branch from node
            </button>
          ) : null}
          <p className="muted">
            <Workflow size={14} /> Graph is derived from the immutable trace. Edits happen through new prompts or replay branches.
          </p>
        </aside>
      </div>
    </div>
  );
}
