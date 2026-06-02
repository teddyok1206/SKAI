import type { Attempt } from "@/lib/types";

export interface BranchTreeNode {
  attempt: Attempt;
  children: BranchTreeNode[];
}

export interface BranchTree {
  roots: BranchTreeNode[];
  nodeCount: number;
  branchCount: number;
}

function sortAttempts(attempts: Attempt[]) {
  return [...attempts].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function sortNodes(nodes: BranchTreeNode[]) {
  nodes.sort((a, b) => a.attempt.createdAt.localeCompare(b.attempt.createdAt));
  nodes.forEach((node) => sortNodes(node.children));
}

export function buildBranchTree(attempts: Attempt[], problemId: string): BranchTree {
  const scopedAttempts = sortAttempts(attempts.filter((attempt) => attempt.problemId === problemId));
  const nodes = new Map<string, BranchTreeNode>();
  const childrenByParentId = new Map<string, BranchTreeNode[]>();
  const roots: BranchTreeNode[] = [];

  for (const attempt of scopedAttempts) {
    nodes.set(attempt.id, {
      attempt,
      children: [],
    });
  }

  for (const node of nodes.values()) {
    const parentAttemptId = node.attempt.branch?.parentAttemptId;
    const parent = parentAttemptId ? nodes.get(parentAttemptId) : undefined;

    if (!parentAttemptId || !parent) {
      roots.push(node);
      continue;
    }

    const siblings = childrenByParentId.get(parentAttemptId) ?? [];
    siblings.push(node);
    childrenByParentId.set(parentAttemptId, siblings);
  }

  for (const [parentId, children] of childrenByParentId) {
    const parent = nodes.get(parentId);
    if (parent) {
      parent.children = children;
    }
  }

  sortNodes(roots);

  return {
    roots,
    nodeCount: nodes.size,
    branchCount: scopedAttempts.filter((attempt) => attempt.branch).length,
  };
}
