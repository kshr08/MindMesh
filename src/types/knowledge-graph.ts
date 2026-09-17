import type { KnowledgeNode, KnowledgeRelation } from "@prisma/client";

export interface KnowledgeGraph {
  nodes: KnowledgeNode[];
  relations: KnowledgeRelation[];
  nodeCount: number;
  relationCount: number;
}
