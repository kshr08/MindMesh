import type { KnowledgeNode } from "@prisma/client";

import type {
  KnowledgeFreshnessItem,
  KnowledgeFreshnessState,
  KnowledgeFreshnessSummary,
} from "@/types/knowledge-freshness";

export const KNOWLEDGE_REVIEW_WINDOW_DAYS = 30;

function daysBetween(now: Date, earlier: Date): number {
  const millisecondsPerDay = 1000 * 60 * 60 * 24;

  return Math.max(
    0,
    Math.floor((now.getTime() - earlier.getTime()) / millisecondsPerDay),
  );
}

function calculateFreshness(
  node: KnowledgeNode,
  now: Date,
): {
  freshness: KnowledgeFreshnessState;
  daysSinceReview: number | null;
} {
  if (node.status === "NEEDS_REVIEW") {
    return {
      freshness: "NEEDS_REVIEW",
      daysSinceReview: node.lastReviewed
        ? daysBetween(now, node.lastReviewed)
        : null,
    };
  }

  if (!node.lastReviewed) {
    return {
      freshness: "NEVER_REVIEWED",
      daysSinceReview: null,
    };
  }

  const daysSinceReview = daysBetween(now, node.lastReviewed);

  if (daysSinceReview > KNOWLEDGE_REVIEW_WINDOW_DAYS) {
    return {
      freshness: "DUE",
      daysSinceReview,
    };
  }

  return {
    freshness: "FRESH",
    daysSinceReview,
  };
}

/**
 * Calculates a deterministic review priority.
 *
 * This is deliberately not an AI score. It is only a signal describing
 * how much attention a node may deserve based on existing graph state.
 *
 * Higher values mean "surface this earlier for review."
 */
function calculatePriority(
  freshness: KnowledgeFreshnessState,
  daysSinceReview: number | null,
): number {
  if (freshness === "NEEDS_REVIEW") {
    return 100;
  }

  if (freshness === "NEVER_REVIEWED") {
    return 80;
  }

  if (freshness === "DUE") {
    return Math.min(70, 30 + (daysSinceReview ?? 0));
  }

  return 0;
}

export function analyzeKnowledgeFreshness(
  nodes: KnowledgeNode[],
  now = new Date(),
): KnowledgeFreshnessSummary {
  const items: KnowledgeFreshnessItem[] = nodes.map((node) => {
    const { freshness, daysSinceReview } = calculateFreshness(node, now);

    return {
      nodeId: node.id,
      title: node.title,
      type: node.type,
      status: node.status,
      lastReviewed: node.lastReviewed?.toISOString() ?? null,
      daysSinceReview,
      freshness,
      priority: calculatePriority(freshness, daysSinceReview),
    };
  });

  const neverReviewed = items.filter(
    (item) => item.freshness === "NEVER_REVIEWED",
  ).length;

  const fresh = items.filter(
    (item) => item.freshness === "FRESH",
  ).length;

  const due = items.filter(
    (item) => item.freshness === "DUE",
  ).length;

  const needsReview = items.filter(
    (item) => item.freshness === "NEEDS_REVIEW",
  ).length;

  return {
    totalNodes: nodes.length,
    neverReviewed,
    fresh,
    due,
    needsReview,
    items: items.sort((a, b) => b.priority - a.priority),
  };
}