import type { GraphStateSnapshot, GraphStateSnapshotAnnotation, GraphStateTransition } from "@/lib/types";

function statusLabel(snapshot: GraphStateSnapshot) {
  if (snapshot.missing) {
    return "missing";
  }

  return snapshot.status ?? "unknown";
}

function compactId(value?: string) {
  if (!value) {
    return "none";
  }

  if (value.length <= 28) {
    return value;
  }

  return `${value.slice(0, 14)}...${value.slice(-8)}`;
}

function AnnotationChips({
  annotations,
  emptyLabel,
}: {
  annotations: GraphStateSnapshotAnnotation[];
  emptyLabel: string;
}) {
  if (annotations.length === 0) {
    return <span className="muted">{emptyLabel}</span>;
  }

  return (
    <div className="graph-transition-chip-row">
      {annotations.slice(0, 5).map((annotation) => (
        <span className={`graph-transition-chip ${annotation.severity}`} key={annotation.id}>
          {annotation.title}
        </span>
      ))}
    </div>
  );
}

function GraphStateCard({ label, snapshot }: { label: string; snapshot: GraphStateSnapshot }) {
  return (
    <article className="graph-state-card">
      <div className="graph-state-card-top">
        <strong>{label}</strong>
        <span className={`graph-state-status ${snapshot.status ?? "missing"}`}>{statusLabel(snapshot)}</span>
      </div>
      <p>{snapshot.summary}</p>
      <dl>
        <div>
          <dt>pair</dt>
          <dd>{compactId(snapshot.pairId)}</dd>
        </div>
        <div>
          <dt>degree</dt>
          <dd>
            in {snapshot.directedDegree.incoming} / out {snapshot.directedDegree.outgoing}
          </dd>
        </div>
      </dl>
      <AnnotationChips annotations={snapshot.annotations} emptyLabel="no annotations" />
    </article>
  );
}

export function GraphStateTransitionView({ transition }: { transition?: GraphStateTransition }) {
  if (!transition) {
    return null;
  }

  return (
    <div className="graph-transition-view">
      <div className="graph-transition-header">
        <strong>Graph-state transition</strong>
        <span>
          {compactId(transition.parentPairId)} -&gt; {compactId(transition.childPairId)}
        </span>
      </div>
      <div className="graph-state-card-grid">
        <GraphStateCard label="Before" snapshot={transition.before} />
        <GraphStateCard label="After" snapshot={transition.after} />
      </div>
      {transition.transitionLabels.length > 0 ? (
        <div className="graph-transition-chip-row">
          {transition.transitionLabels.map((label) => (
            <span className="signal-chip" key={label}>
              {label}
            </span>
          ))}
        </div>
      ) : null}
      <div className="graph-annotation-delta">
        <div>
          <strong>Added</strong>
          <AnnotationChips annotations={transition.annotationDelta.added} emptyLabel="none" />
        </div>
        <div>
          <strong>Removed</strong>
          <AnnotationChips annotations={transition.annotationDelta.removed} emptyLabel="none" />
        </div>
      </div>
    </div>
  );
}
