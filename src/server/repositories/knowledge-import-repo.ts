import { type KnowledgeNode, type KnowledgeRelation } from "@prisma/client";

import { db } from "@/lib/db";
import { normalizeTitle } from "@/lib/normalize-title";
import type { ImportKnowledgeProposalInput } from "@/server/ai/proposal-schema";

export async function importKnowledgeForUser(
  userId: string,
  input: ImportKnowledgeProposalInput,
): Promise<{ nodes: KnowledgeNode[]; relations: KnowledgeRelation[] }> {
  return db.$transaction(async (tx) => {
    const ownedNodes = await tx.knowledgeNode.findMany({ where: { userId } });
    const nodesByTitle = new Map(ownedNodes.map((node) => [normalizeTitle(node.title), node]));
    const createdNodes: KnowledgeNode[] = [];

    for (const nodeInput of input.nodes) {
      if (!nodeInput.selected) continue;

      const key = normalizeTitle(nodeInput.title);
      if (nodesByTitle.has(key)) continue;

      const node = await tx.knowledgeNode.create({
        data: {
          userId,
          title: nodeInput.title.trim(),
          type: nodeInput.type,
          status: "NEW",
          description: nodeInput.description?.trim() || null,
        },
      });
      nodesByTitle.set(key, node);
      createdNodes.push(node);
    }

    const nodeIds = [...nodesByTitle.values()].map((node) => node.id);
    const existingRelations = await tx.knowledgeRelation.findMany({
      where: {
        sourceId: { in: nodeIds },
        targetId: { in: nodeIds },
      },
      select: { sourceId: true, targetId: true, relationType: true },
    });
    const relationKeys = new Set(
      existingRelations.map((relation) =>
        `${relation.sourceId}:${relation.targetId}:${relation.relationType}`,
      ),
    );

    const relations: KnowledgeRelation[] = [];
    for (const relationship of input.relationships) {
      if (!relationship.selected) continue;

      const source = nodesByTitle.get(normalizeTitle(relationship.sourceTitle));
      const target = nodesByTitle.get(normalizeTitle(relationship.targetTitle));
      if (!source || !target || source.id === target.id) {
        throw new Error("A selected relationship references an unavailable node.");
      }

      const relationKey = `${source.id}:${target.id}:${relationship.relationType}`;
      if (relationKeys.has(relationKey)) continue;

      const relation = await tx.knowledgeRelation.create({
        data: {
          sourceId: source.id,
          targetId: target.id,
          relationType: relationship.relationType,
        },
      });
      relationKeys.add(relationKey);
      relations.push(relation);
    }

    return { nodes: createdNodes, relations };
  });
}
