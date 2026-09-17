import type { KnowledgeGraph } from "@/types/knowledge-graph";
import type { KnowledgeFlowEdge, KnowledgeFlowNode } from "@/types/graph-flow";

const COLUMN_WIDTH = 240;
const ROW_HEIGHT = 180;
const COLUMNS = 4;

export function toFlowGraph(graph: KnowledgeGraph): {
  nodes: KnowledgeFlowNode[];
  edges: KnowledgeFlowEdge[];
} {
  const nodes: KnowledgeFlowNode[] = graph.nodes.map((node, index) => ({
    id: node.id,
    type: "knowledge",
    position: {
      x: (index % COLUMNS) * COLUMN_WIDTH,
      y: Math.floor(index / COLUMNS) * ROW_HEIGHT,
    },
    data: {
      id: node.id,
      title: node.title,
      type: node.type,
      status: node.status,
      description: node.description,
    },
  }));

  const edges: KnowledgeFlowEdge[] = graph.relations.map((relation) => ({
    id: relation.id,
    source: relation.sourceId,
    target: relation.targetId,
    data: { relationType: relation.relationType },
  }));

  return { nodes, edges };
}