"use client";

import { useMemo, useState } from "react";
import { GitBranch, Network, Route, Workflow } from "lucide-react";
import type {
  ConversationGraph,
  ConversationGraphEdge,
  ConversationGraphNode,
  ConversationGraphPair,
  ConversationGraphProjection,
  TraceEvent,
} from "@/lib/types";

type GraphTab = "dual" | ConversationGraphProjection | "index";

const graphTabs: Array<{ id: GraphTab; label: string }> = [
  { id: "dual", label: "3D Dual" },
  { id: "prompt_graph", label: "Prompt" },
  { id: "response_graph", label: "Response" },
  { id: "status_layer", label: "Status" },
  { id: "index", label: "Index" },
];

function projectionLabel(projection: ConversationGraphProjection) {
  if (projection === "prompt_graph") {
    return "Prompt graph";
  }

  if (projection === "response_graph") {
    return "Response graph";
  }

  return "Task-status layer";
}

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

function GraphNodeButton({
  node,
  selected,
  pair,
  onSelect,
}: {
  node?: ConversationGraphNode;
  selected: boolean;
  pair?: ConversationGraphPair;
  onSelect: (nodeId: string) => void;
}) {
  if (!node) {
    return <div className="graph-node missing">No node</div>;
  }

  return (
    <button
      className={`graph-node ${node.kind} ${selected ? "selected" : ""} ${pair?.isBreakpoint ? "breakpoint" : ""}`}
      onClick={() => onSelect(node.id)}
      type="button"
    >
      <span>{node.label}</span>
      <strong>{nodeKindLabel(node.kind)}</strong>
      <small>{node.summary || "No summary yet."}</small>
      {node.sourceTraceEventId ? <em>source trace</em> : null}
    </button>
  );
}

function EdgeList({ edges }: { edges: ConversationGraphEdge[] }) {
  if (edges.length === 0) {
    return <p className="muted">No edges in this projection yet.</p>;
  }

  return (
    <div className="graph-edge-list">
      {edges.map((edge) => (
        <div className="graph-edge-chip" key={edge.id}>
          <Route size={14} />
          <span>{edge.sourceNodeId}</span>
          <strong>→</strong>
          <span>{edge.targetNodeId}</span>
          <small>{edge.label}</small>
        </div>
      ))}
    </div>
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
  const [activeTab, setActiveTab] = useState<GraphTab>("dual");
  const allNodes = useMemo(
    () => [...graph.promptNodes, ...graph.responseNodes, ...graph.statusNodes],
    [graph.promptNodes, graph.responseNodes, graph.statusNodes],
  );
  const nodeById = useMemo(() => new Map(allNodes.map((node) => [node.id, node])), [allNodes]);
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
  const selectedIncidence = selectedNode ? graph.index.incidence[selectedNode.id] : undefined;
  const branchTraceEventId =
    selectedTrace?.id ?? selectedPair?.promptTraceEventId ?? selectedPair?.responseTraceEventId ?? undefined;

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
      <div className="graph-lanes" aria-label="3 dimensional dual graph">
        <div className="graph-lane-head">
          <span>Prompt nodes</span>
          <span>Task-status layer</span>
          <span>Response nodes</span>
        </div>
        {graph.pairs.map((pair) => {
          const promptNode = nodeById.get(pair.promptNodeId);
          const statusNode = nodeById.get(pair.statusNodeId);
          const responseNode = pair.responseNodeId ? nodeById.get(pair.responseNodeId) : undefined;

          return (
            <div className={`graph-lane-row ${pair.isBreakpoint ? "breakpoint" : ""}`} key={pair.id}>
              <GraphNodeButton
                node={promptNode}
                pair={pair}
                selected={effectiveSelectedNodeId === promptNode?.id}
                onSelect={selectNode}
              />
              <div className="graph-lane-link">
                <span>prompt → status</span>
                <span className={statusClass(pair)}>{pair.status}</span>
                <span>status → response</span>
              </div>
              <GraphNodeButton
                node={statusNode}
                pair={pair}
                selected={effectiveSelectedNodeId === statusNode?.id}
                onSelect={selectNode}
              />
              <div className="graph-lane-link response-link">
                <span>dual edge</span>
              </div>
              {responseNode ? (
                <GraphNodeButton
                  node={responseNode}
                  pair={pair}
                  selected={effectiveSelectedNodeId === responseNode.id}
                  onSelect={selectNode}
                />
              ) : (
                <div className="graph-node missing">Pending response</div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  function renderProjection(projection: ConversationGraphProjection) {
    const nodes =
      projection === "prompt_graph"
        ? graph.promptNodes
        : projection === "response_graph"
          ? graph.responseNodes
          : graph.statusNodes;
    const edges =
      projection === "prompt_graph"
        ? graph.promptEdges
        : projection === "response_graph"
          ? graph.responseEdges
          : graph.statusEdges;

    return (
      <div className="graph-projection">
        <div className="graph-projection-header">
          <strong>{projectionLabel(projection)}</strong>
          <span>
            {nodes.length} nodes · {edges.length} edges
          </span>
        </div>
        <div className="graph-node-strip">
          {nodes.map((node) => (
            <GraphNodeButton
              key={node.id}
              node={node}
              selected={effectiveSelectedNodeId === node.id}
              pair={graph.pairs.find(
                (pair) => pair.promptNodeId === node.id || pair.responseNodeId === node.id || pair.statusNodeId === node.id,
              )}
              onSelect={selectNode}
            />
          ))}
        </div>
        <EdgeList edges={edges} />
      </div>
    );
  }

  function renderIndex() {
    const selectedIncoming = selectedIncidence?.incoming ?? [];
    const selectedOutgoing = selectedIncidence?.outgoing ?? [];

    return (
      <div className="graph-index-grid">
        <div className="graph-stat">
          <strong>{Object.keys(graph.index.promptNodeByTraceEventId).length}</strong>
          <span>prompt trace index</span>
        </div>
        <div className="graph-stat">
          <strong>{Object.keys(graph.index.responseNodeByTraceEventId).length}</strong>
          <span>response trace index</span>
        </div>
        <div className="graph-stat">
          <strong>{Object.keys(graph.index.adjacency).length}</strong>
          <span>adjacency keys</span>
        </div>
        <div className="graph-stat">
          <strong>{Object.keys(graph.index.incidence).length}</strong>
          <span>incidence rows</span>
        </div>
        <div className="graph-index-detail">
          <strong>Selected incidence</strong>
          <p className="muted">{selectedNode?.id ?? "No node selected"}</p>
          <div className="graph-edge-list">
            <div className="graph-edge-chip">
              <span>incoming</span>
              <small>{selectedIncoming.length > 0 ? selectedIncoming.join(", ") : "none"}</small>
            </div>
            <div className="graph-edge-chip">
              <span>outgoing</span>
              <small>{selectedOutgoing.length > 0 ? selectedOutgoing.join(", ") : "none"}</small>
            </div>
          </div>
        </div>
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
      </div>

      <div className="graph-tabs" role="tablist" aria-label="Graph projections">
        {graphTabs.map((tab) => (
          <button
            aria-selected={activeTab === tab.id}
            className={activeTab === tab.id ? "active" : ""}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            role="tab"
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="graph-workspace">
        <div className="graph-canvas">
          {activeTab === "dual" ? renderDualGraph() : null}
          {activeTab === "prompt_graph" ? renderProjection("prompt_graph") : null}
          {activeTab === "response_graph" ? renderProjection("response_graph") : null}
          {activeTab === "status_layer" ? renderProjection("status_layer") : null}
          {activeTab === "index" ? renderIndex() : null}
        </div>

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
          {selectedIncidence ? (
            <div className="graph-reason-list">
              <strong>Incidence</strong>
              <span>incoming: {selectedIncidence.incoming.length}</span>
              <span>outgoing: {selectedIncidence.outgoing.length}</span>
            </div>
          ) : null}
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
