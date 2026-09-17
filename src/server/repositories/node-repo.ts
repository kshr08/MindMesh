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

/**
 * Scoped update: verifies ownership and updates atomically inside a
 * transaction. Returns null if no node with this id belongs to userId,
 * so the caller can distinguish "not found / not yours" from a thrown
 * error rather than silently updating (or leaking) another user's row.
 */
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
 * Scoped delete: the ownership check is baked into the WHERE clause of
 * a single deleteMany, so it's already atomic. Associated relations are
 * removed automatically via the existing cascade
 * (KnowledgeRelation.sourceId/targetId onDelete: Cascade) — no extra
 * relation-repo call needed.
 */
export async function deleteNodeForUser(id: string, userId: string): Promise<boolean> {
  const { count } = await db.knowledgeNode.deleteMany({
    where: { id, userId },
  });

  return count > 0;
}