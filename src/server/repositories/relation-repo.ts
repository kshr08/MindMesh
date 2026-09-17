import { db } from "@/lib/db";
import type { KnowledgeRelation } from "@prisma/client";

/**
 * Repository layer: Prisma/database access only.
 * No business logic here — that belongs in the service layer.
 *
 * KnowledgeRelation has no userId column of its own; ownership is derived
 * through the source node, since relations only ever connect nodes that
 * belong to the same user.
 */

export function findRelationsByUserId(
  userId: string,
): Promise<KnowledgeRelation[]> {
  return db.knowledgeRelation.findMany({
    where: { source: { userId } },
    orderBy: { createdAt: "asc" },
  });
}

export function countRelationsByUserId(userId: string): Promise<number> {
  return db.knowledgeRelation.count({
    where: { source: { userId } },
  });
}
