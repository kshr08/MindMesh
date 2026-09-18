import type { ConfidenceStatus, NodeType } from "@prisma/client";

export const KNOWLEDGE_FRESHNESS_STATES = [
  "NEVER_REVIEWED",
  "FRESH",
  "DUE",
  "NEEDS_REVIEW",
] as const;

export type KnowledgeFreshnessState =
  (typeof KNOWLEDGE_FRESHNESS_STATES)[number];

export interface KnowledgeFreshnessItem {
  nodeId: string;
  title: string;
  type: NodeType;
  status: ConfidenceStatus;
  lastReviewed: string | null;
  daysSinceReview: number | null;
  freshness: KnowledgeFreshnessState;
  priority: number;
}

export interface KnowledgeFreshnessSummary {
  totalNodes: number;
  neverReviewed: number;
  fresh: number;
  due: number;
  needsReview: number;
  items: KnowledgeFreshnessItem[];
}