import { db } from "@/lib/db";
import type { KnowledgeNode } from "@prisma/client";

/**
 * Repository layer: Prisma/database access only.
 * No business logic here — that belongs in the service layer.
 */

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
