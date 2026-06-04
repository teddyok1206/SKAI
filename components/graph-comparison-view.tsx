"use client";

import { useState } from "react";
import { GitBranch } from "lucide-react";
import { ConversationGraphView } from "@/components/conversation-graph-view";
import { useLanguagePreference } from "@/components/language-toggle";
import {
  defaultGraphOverlayControls,
  graphOverlayLayerOrder,
} from "@/lib/graph-overlay";
import { getCopy, type Locale } from "@/lib/i18n";
import type {
  ConversationGraph,
  GraphOverlayControls,
  GraphStateTransition,
  TraceEvent,
} from "@/lib/types";

function TransitionLabels({ transition, locale }: { transition?: GraphStateTransition; locale: Locale }) {
  if (!transition || transition.transitionLabels.length === 0) {
    return <p className="muted">{getCopy("graphComparison.noDelta", locale)}</p>;
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
  const { locale } = useLanguagePreference();
  const t = (key: string) => getCopy(key, locale);
  const [overlayControls, setOverlayControls] = useState<GraphOverlayControls>(defaultGraphOverlayControls);

  return (
    <div className="graph-comparison-view">
      <div className="graph-comparison-header">
        <div>
          <strong>
            <GitBranch size={16} /> {t("graphComparison.title")}
          </strong>
          <p className="muted">{t("graphComparison.description")}</p>
        </div>
        <TransitionLabels transition={transition} locale={locale} />
      </div>
      <div className="graph-comparison-legend">
        {overlayControls.enabled ? (
          graphOverlayLayerOrder
            .filter((layer) => overlayControls.layers[layer])
            .map((layer) => <span key={layer}>{t(`graph.overlay.${layer}`)}</span>)
        ) : (
          <span>{t("graph.overlay.off")}</span>
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
          title={t("graphComparison.parentGraph")}
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
          title={t("graphComparison.childGraph")}
          trace={childTrace}
        />
      </div>
    </div>
  );
}
