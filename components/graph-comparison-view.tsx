"use client";

import { useState } from "react";
import { GitBranch } from "lucide-react";
import { ConversationGraphView } from "@/components/conversation-graph-view";
import {
  defaultGraphOverlayControls,
  graphOverlayLayerLabels,
  graphOverlayLayerOrder,
} from "@/lib/graph-overlay";
import type {
  ConversationGraph,
  GraphOverlayControls,
  GraphStateTransition,
  TraceEvent,
} from "@/lib/types";

function TransitionLabels({ transition }: { transition?: GraphStateTransition }) {
  if (!transition || transition.transitionLabels.length === 0) {
    return <p className="muted">아직 graph-state delta label이 없습니다.</p>;
  }

  return (
    <div className="graph-comparison-labels">
      {transition.transitionLabels.map((label) => (
        <span className="signal-chip" key={label}>
          {label}
        </span>
      ))}
    </div>
  );
}

export function GraphComparisonView({
  parentGraph,
  childGraph,
  parentTrace,
  childTrace,
  transition,
}: {
  parentGraph: ConversationGraph;
  childGraph: ConversationGraph;
  parentTrace: TraceEvent[];
  childTrace: TraceEvent[];
  transition?: GraphStateTransition;
}) {
  const [overlayControls, setOverlayControls] = useState<GraphOverlayControls>(defaultGraphOverlayControls);

  return (
    <div className="graph-comparison-view">
      <div className="graph-comparison-header">
        <div>
          <strong>
            <GitBranch size={16} /> Parallel graph comparison
          </strong>
          <p className="muted">문장 차이가 아니라 parent와 branch의 orchestration state 변화를 먼저 봅니다.</p>
        </div>
        <TransitionLabels transition={transition} />
      </div>
      <div className="graph-comparison-legend">
        {overlayControls.enabled ? (
          graphOverlayLayerOrder
            .filter((layer) => overlayControls.layers[layer])
            .map((layer) => <span key={layer}>{graphOverlayLayerLabels[layer]}</span>)
        ) : (
          <span>Overlay off</span>
        )}
      </div>
      <div className="graph-comparison-grid">
        <ConversationGraphView
          compact
          focusPairId={transition?.parentPairId}
          graph={parentGraph}
          hideDetailPanel
          overlayControls={overlayControls}
          onOverlayControlsChange={setOverlayControls}
          title="Parent graph"
          trace={parentTrace}
        />
        <ConversationGraphView
          compact
          focusPairId={transition?.childPairId}
          graph={childGraph}
          hideDetailPanel
          hideOverlayControls
          overlayControls={overlayControls}
          onOverlayControlsChange={setOverlayControls}
          title="Child branch graph"
          trace={childTrace}
        />
      </div>
    </div>
  );
}
