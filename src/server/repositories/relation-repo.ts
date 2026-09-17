import { db } from "@/lib/db";
import { Prisma, type KnowledgeRelation, type RelationType } from "@prisma/client";

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

export interface CreateRelationData {
  sourceId: string;
  targetId: string;
  relationType: RelationType;
}

export type CreateRelationResult =
  | { ok: true; relation: KnowledgeRelation }
  | { ok: false; reason: "NOT_FOUND" | "DUPLICATE" };

/**
 * Creates a relation only after verifying BOTH nodes belong to userId.
 * Knowing a node's id is not authorization — a user must not be able to
 * link their nodes to (or via) another user's node, nor manipulate a
 * relation that isn't theirs. Wrapped in a transaction so the ownership
 * check and the insert are atomic.
 */
export async function createRelationForUser(
  userId: string,
  data: CreateRelationData,
): Promise<CreateRelationResult> {
  return db.$transaction(async (tx) => {
    const [source, target] = await Promise.all([
      tx.knowledgeNode.findFirst({
        where: { id: data.sourceId, userId },
        select: { id: true },
      }),
      tx.knowledgeNode.findFirst({
        where: { id: data.targetId, userId },
        select: { id: true },
      }),
    ]);

    if (!source || !target) {
      return { ok: false, reason: "NOT_FOUND" };
    }

    try {
      const relation = await tx.knowledgeRelation.create({ data });
      return { ok: true, relation };
    } catch (error) {
      // P2002 = unique constraint violation on [sourceId, targetId, relationType]
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return { ok: false, reason: "DUPLICATE" };
      }
      throw error;
    }
  });
}

/**
 * Scoped delete: the ownership check (via the relation's source node) is
 * baked into the WHERE clause of a single deleteMany, so it's already
 * atomic — mirrors deleteNodeForUser's pattern.
 */
export async function deleteRelationForUser(
  id: string,
  userId: string,
): Promise<boolean> {
  const { count } = await db.knowledgeRelation.deleteMany({
    where: { id, source: { userId } },
  });

  return count > 0;
}