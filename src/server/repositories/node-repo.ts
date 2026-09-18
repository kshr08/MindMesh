import { db } from "@/lib/db";
import type { ConfidenceStatus, KnowledgeNode, NodeType } from "@prisma/client";

export function findNodesByUserId(userId: string): Promise<KnowledgeNode[]> {
  return db.knowledgeNode.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}

export function countNodesByUserId(userId: string): Promise<number> {
  return db.knowledgeNode.count({
    where: { userId },
  });
}

export interface CreateNodeData {
  userId: string;
  title: string;
  type: NodeType;
  status: ConfidenceStatus;
  description: string | null;
}

export function createNode(data: CreateNodeData): Promise<KnowledgeNode> {
  return db.knowledgeNode.create({ data });
}

export interface UpdateNodeData {
  title: string;
  type: NodeType;
  status: ConfidenceStatus;
  description: string | null;
}

export async function updateNodeForUser(
  id: string,
  userId: string,
  data: UpdateNodeData,
): Promise<KnowledgeNode | null> {
  return db.$transaction(async (tx) => {
    const owned = await tx.knowledgeNode.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!owned) return null;

    return tx.knowledgeNode.update({ where: { id }, data });
  });
}

/**
 * Marks an owned node as reviewed now.
 *
 * The ownership check is part of the update WHERE clause, so a user
 * cannot update another user's node even if they know its id.
 */
export async function markNodeReviewedForUser(
  id: string,
  userId: string,
): Promise<KnowledgeNode | null> {
  const result = await db.knowledgeNode.updateMany({
    where: { id, userId },
    data: { lastReviewed: new Date() },
  });

  if (result.count === 0) return null;

  return db.knowledgeNode.findUnique({
    where: { id },
  });
}

export async function deleteNodeForUser(id: string, userId: string): Promise<boolean> {
  const { count } = await db.knowledgeNode.deleteMany({
    where: { id, userId },
  });

  return count > 0;
}