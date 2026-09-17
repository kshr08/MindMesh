import {
  countNodesByUserId,
  createNode,
  deleteNodeForUser,
  findNodesByUserId,
  updateNodeForUser,
} from "@/server/repositories/node-repo";
import {
  countRelationsByUserId,
  findRelationsByUserId,
} from "@/server/repositories/relation-repo";
import type { KnowledgeGraph } from "@/types/knowledge-graph";
import type {
  CreateKnowledgeNodeInput,
  UpdateKnowledgeNodeInput,
} from "@/lib/validation/knowledge-node";
import type { KnowledgeNode } from "@prisma/client";

export async function getKnowledgeGraph(userId: string): Promise<KnowledgeGraph> {
  const [nodes, relations, nodeCount, relationCount] = await Promise.all([
    findNodesByUserId(userId),
    findRelationsByUserId(userId),
    countNodesByUserId(userId),
    countRelationsByUserId(userId),
  ]);

  return { nodes, relations, nodeCount, relationCount };
}

export function createKnowledgeNode(
  userId: string,
  input: CreateKnowledgeNodeInput,
): Promise<KnowledgeNode> {
  return createNode({
    userId,
    title: input.title,
    type: input.type,
    status: input.status,
    description: input.description,
  });
}

export function updateKnowledgeNode(
  userId: string,
  input: UpdateKnowledgeNodeInput,
): Promise<KnowledgeNode | null> {
  return updateNodeForUser(input.id, userId, {
    title: input.title,
    type: input.type,
    status: input.status,
    description: input.description,
  });
}

export function deleteKnowledgeNode(userId: string, id: string): Promise<boolean> {
  return deleteNodeForUser(id, userId);
}