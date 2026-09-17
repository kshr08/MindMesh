"use server";

import { revalidatePath } from "next/cache";

import { getAIService } from "@/server/ai/ai-service";
import { extractKnowledgeInputSchema } from "@/server/ai/proposal-schema";
import { normalizeKnowledgeProposal } from "@/server/ai/proposal-normalizer";
import { getAuthenticatedUserId } from "@/lib/auth-user";
import { findNodesByUserId } from "@/server/repositories/node-repo";
import { importKnowledgeProposal } from "@/server/services/knowledge-import-service";
import type { KnowledgeProposal } from "@/server/ai/types";
import type { ActionResult } from "@/server/actions/knowledge-node-actions";
import type { ConfidenceStatus, NodeType, RelationType } from "@prisma/client";

export interface ImportedKnowledgeResult {
  nodes: {
    id: string;
    title: string;
    type: NodeType;
    status: ConfidenceStatus;
    description: string | null;
  }[];
  relations: {
    id: string;
    sourceId: string;
    targetId: string;
    relationType: RelationType;
  }[];
}

export async function extractKnowledgeAction(
  input: unknown,
): Promise<ActionResult<KnowledgeProposal>> {
  const parsed = extractKnowledgeInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Enter valid notes." };
  }

  const userId = await getAuthenticatedUserId();
  if (!userId) return { success: false, error: "You must be signed in." };

  try {
    const existingNodes = await findNodesByUserId(userId);
    const rawProposal = await getAIService().extractKnowledge(parsed.data.notes, {
      existingNodes: existingNodes.map((node) => ({
        title: node.title,
        type: node.type,
        status: node.status,
      })),
    });
    return {
      success: true,
      data: normalizeKnowledgeProposal(rawProposal, {
        existingNodes: existingNodes.map((node) => ({
          title: node.title,
          type: node.type,
          status: node.status,
        })),
      }),
    };
  } catch (error) {
    console.error("extractKnowledgeAction failed", error);
    return { success: false, error: "Could not extract knowledge. Check the AI provider configuration and try again." };
  }
}

export async function importKnowledgeProposalAction(
  input: unknown,
): Promise<ActionResult<ImportedKnowledgeResult>> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { success: false, error: "You must be signed in." };

  try {
    const result = await importKnowledgeProposal(userId, input);
    revalidatePath("/graph");
    return { success: true, data: { nodes: result.nodes, relations: result.relations } };
  } catch (error) {
    console.error("importKnowledgeProposalAction failed", error);
    return { success: false, error: "Could not import the selected knowledge. Nothing was saved." };
  }
}
