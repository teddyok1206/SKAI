"use client";

import { GitBranch, GitCommitHorizontal, Trophy } from "lucide-react";
import type { BranchTree, BranchTreeNode } from "@/lib/branch-tree";

interface BranchTreeExplorerProps {
  tree: BranchTree;
  currentAttemptId?: string;
  onOpenAttempt: (attemptId: string) => void;
}

function branchLabel(node: BranchTreeNode) {
  if (!node.attempt.branch) {
    return "root";
  }

  return `trace ${node.attempt.branch.parentTraceIndex + 1}`;
}

function renderNode(
  node: BranchTreeNode,
  depth: number,
  currentAttemptId: string | undefined,
  onOpenAttempt: (attemptId: string) => void,
) {
  const isCurrent = node.attempt.id === currentAttemptId;
  const score = node.attempt.scoreReport?.totalScore;

  return (
    <li className="branch-tree-item" key={node.attempt.id}>
      <button
        className={`branch-tree-node ${isCurrent ? "active" : ""}`}
        onClick={() => onOpenAttempt(node.attempt.id)}
        type="button"
      >
        <span className="branch-tree-icon">
          {node.attempt.branch ? <GitBranch size={14} /> : <GitCommitHorizontal size={14} />}
        </span>
        <span className="branch-tree-main">
          <strong>{node.attempt.branch?.label ?? node.attempt.title}</strong>
          <small>
            {branchLabel(node)} · {node.attempt.trace.length} events
            {score !== undefined ? ` · ${score}점` : ""}
          </small>
        </span>
        {isCurrent ? <span className="material-state selected">현재</span> : null}
      </button>
      {node.children.length > 0 ? (
        <ol className="branch-tree-list">
          {node.children.map((child) => renderNode(child, depth + 1, currentAttemptId, onOpenAttempt))}
        </ol>
      ) : null}
    </li>
  );
}

export function BranchTreeExplorer({ tree, currentAttemptId, onOpenAttempt }: BranchTreeExplorerProps) {
  if (tree.nodeCount === 0) {
    return <p className="muted">아직 저장된 attempt가 없습니다.</p>;
  }

  return (
    <div className="branch-tree-explorer">
      <div className="branch-tree-summary">
        <span>
          <GitBranch size={14} /> {tree.branchCount} branches
        </span>
        <span>
          <Trophy size={14} /> {tree.nodeCount} attempts
        </span>
      </div>
      <ol className="branch-tree-list">
        {tree.roots.map((root) => renderNode(root, 0, currentAttemptId, onOpenAttempt))}
      </ol>
    </div>
  );
}
