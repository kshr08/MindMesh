import type { Edge, Node } from "@xyflow/react";
import type { ConfidenceStatus, NodeType } from "@prisma/client";

export interface KnowledgeNodeData extends Record<string, unknown> {
  id: string;
  title: string;
  type: NodeType;
  status: ConfidenceStatus;
  description: string | null;
}

export type KnowledgeFlowNode = Node<KnowledgeNodeData, "knowledge">;export type KnowledgeFlowEdge = Edge<{ relationType: string }>;