import {
  countNodesByUserId,
  createNode,
  deleteNodeForUser,
  findNodesByUserId,
  markNodeReviewedForUser,
  updateNodeForUser,
} from "@/server/repositories/node-repo";
import {
  countRelationsByUserId,
  findRelationsByUserId,
  deleteRelationForUser,
  createRelationForUser,
} from "@/server/repositories/relation-repo";
import type { KnowledgeGraph } from "@/types/knowledge-graph";
import type {
  CreateKnowledgeNodeInput,
  UpdateKnowledgeNodeInput,
} from "@/lib/validation/knowledge-node";
import type { CreateKnowledgeRelationInput } from "@/lib/validation/knowledge-relation";
import type { KnowledgeNode, KnowledgeRelation } from "@prisma/client";

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

export function markKnowledgeNodeReviewed(
  userId: string,
  id: string,
): Promise<KnowledgeNode | null> {
  return markNodeReviewedForUser(id, userId);
}

export function deleteKnowledgeNode(userId: string, id: string): Promise<boolean> {
  return deleteNodeForUser(id, userId);
}

export type CreateRelationServiceResult =
  | { success: true; relation: KnowledgeRelation }
  | { success: false; error: string };

export async function createKnowledgeRelation(
  userId: string,
  input: CreateKnowledgeRelationInput,
): Promise<CreateRelationServiceResult> {
  const result = await createRelationForUser(userId, input);

  if (!result.ok) {
    if (result.reason === "DUPLICATE") {
      return { success: false, error: "This relationship already exists." };
    }
    return { success: false, error: "One or both nodes no longer exist." };
  }

  return { success: true, relation: result.relation };
}

export function deleteKnowledgeRelation(userId: string, id: string): Promise<boolean> {
  return deleteRelationForUser(id, userId);
}