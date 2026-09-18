import type { KnowledgeGraph } from "@/types/knowledge-graph";
import type {
  KnowledgeFlowEdge,
  KnowledgeFlowNode,
} from "@/types/graph-flow";
import { RELATION_TYPE_LABEL } from "@/lib/validation/knowledge-relation";
import { computeGraphLayout } from "@/lib/graph-layout";

export function toFlowGraph(graph: KnowledgeGraph): {
  nodes: KnowledgeFlowNode[];
  edges: KnowledgeFlowEdge[];
} {
  const layoutPositions = computeGraphLayout(
    graph.nodes.map((node) => ({ id: node.id })),
    graph.relations.map((relation) => ({
      source: relation.sourceId,
      target: relation.targetId,
    })),
  );

  const nodes: KnowledgeFlowNode[] = graph.nodes.map((node) => {
    const position = layoutPositions.get(node.id) ?? { x: 0, y: 0 };

    return {
      id: node.id,
      type: "knowledge",
      position,
      data: {
        id: node.id,
        title: node.title,
        type: node.type,
        status: node.status,
        description: node.description,
        lastReviewed: node.lastReviewed?.toISOString() ?? null,
      },
    };
  });

  const edges: KnowledgeFlowEdge[] = graph.relations.map((relation) => ({
    id: relation.id,
    source: relation.sourceId,
    target: relation.targetId,
    label: RELATION_TYPE_LABEL[relation.relationType],
    data: { relationType: relation.relationType },
  }));

  return { nodes, edges };
}