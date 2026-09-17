import {
  countNodesByUserId,
  findNodesByUserId,
} from "@/server/repositories/node-repo";
import {
  countRelationsByUserId,
  findRelationsByUserId,
} from "@/server/repositories/relation-repo";
import type { KnowledgeGraph } from "@/types/knowledge-graph";

/**
 * Service layer: business logic + orchestration across repositories.
 * Server Components / Server Actions call into here — never into
 * repositories or Prisma directly.
 */

export async function getKnowledgeGraph(
  userId: string,
): Promise<KnowledgeGraph> {
  const [nodes, relations, nodeCount, relationCount] = await Promise.all([
    findNodesByUserId(userId),
    findRelationsByUserId(userId),
    countNodesByUserId(userId),
    countRelationsByUserId(userId),
  ]);

  return { nodes, relations, nodeCount, relationCount };
}
