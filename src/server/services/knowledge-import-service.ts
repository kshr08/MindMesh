import { importKnowledgeForUser } from "@/server/repositories/knowledge-import-repo";
import { importKnowledgeProposalInputSchema } from "@/server/ai/proposal-schema";
import type { KnowledgeNode, KnowledgeRelation } from "@prisma/client";

export interface KnowledgeImportResult {
  nodes: KnowledgeNode[];
  relations: KnowledgeRelation[];
}

export async function importKnowledgeProposal(
  userId: string,
  input: unknown,
): Promise<KnowledgeImportResult> {
  const parsed = importKnowledgeProposalInputSchema.parse(input);
  return importKnowledgeForUser(userId, parsed);
}
