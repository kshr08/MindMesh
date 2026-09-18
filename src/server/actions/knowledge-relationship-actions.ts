"use server";

import { RelationType, type KnowledgeNode } from "@prisma/client";

import type { ActionResult } from "@/server/actions/knowledge-node-actions";
import { getAuthenticatedUserId } from "@/lib/auth-user";
import { normalizeTitle } from "@/lib/normalize-title";
import { getAIService } from "@/server/ai/ai-service";
import {
  relationshipSuggestionInputSchema,
  type RelationshipSuggestionInput,
  type RelationshipSuggestionProposal,
} from "@/server/ai/relationship-suggestion-schema";
import { normalizeRelationshipSuggestions } from "@/server/ai/relationship-suggestion-normalizer";
import type {
  RelationshipSuggestionContext,
  RelationshipSuggestionNode,
} from "@/server/ai/types";
import { getKnowledgeGraph } from "@/server/services/knowledge-graph-service";

export async function suggestKnowledgeRelationshipsAction(
  input: unknown,
): Promise<ActionResult<RelationshipSuggestionProposal>> {
  const parsed = relationshipSuggestionInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Enter valid relationship context.",
    };
  }

  const userId = await getAuthenticatedUserId();
  if (!userId) return { success: false, error: "You must be signed in." };

  try {
    const graph = await getKnowledgeGraph(userId);
    const existingNodesByTitle = new Map(
      graph.nodes.map((node) => [normalizeTitle(node.title), node]),
    );
    const reviewedNodes = buildSuggestionNodes(parsed.data, existingNodesByTitle);
    const nodesById = new Map(graph.nodes.map((node) => [node.id, node]));
    const existingRelationships = graph.relations.flatMap((relationship) => {
      const source = nodesById.get(relationship.sourceId);
      const target = nodesById.get(relationship.targetId);
      if (!source || !target) return [];

      return [{
        sourceTitle: source.title,
        targetTitle: target.title,
        relationType: relationship.relationType,
      }];
    });
    const context: RelationshipSuggestionContext = {
      nodes: reviewedNodes,
      existingRelationships,
      allowedRelationTypes: Object.values(RelationType) as RelationType[],
    };

    const rawProposal = await getAIService().suggestRelationships(
      parsed.data.notes,
      context,
    );

    return {
      success: true,
      data: normalizeRelationshipSuggestions(rawProposal, context),
    };
  } catch (error) {
    console.error("suggestKnowledgeRelationshipsAction failed", error);
    return {
      success: false,
      error: "Could not suggest relationships. Please try again.",
    };
  }
}

function buildSuggestionNodes(
  input: RelationshipSuggestionInput,
  existingNodesByTitle: Map<
    string,
    Pick<KnowledgeNode, "title" | "type" | "description">
  >,
): RelationshipSuggestionNode[] {
  const nodesByTitle = new Map<string, RelationshipSuggestionNode>();

  for (const node of input.nodes) {
    const key = normalizeTitle(node.title);
    const existing = existingNodesByTitle.get(key);
    if (existing) {
      nodesByTitle.set(key, {
        title: existing.title,
        type: existing.type,
        description: existing.description,
        existing: true,
      });
    } else if (node.selected && !nodesByTitle.has(key)) {
      nodesByTitle.set(key, {
        title: node.title.trim(),
        type: node.type,
        description: node.description?.trim() || null,
        existing: false,
      });
    }
  }

  for (const existing of existingNodesByTitle.values()) {
    if (!nodesByTitle.has(normalizeTitle(existing.title))) {
      nodesByTitle.set(normalizeTitle(existing.title), {
        title: existing.title,
        type: existing.type,
        description: existing.description,
        existing: true,
      });
    }
  }

  return [...nodesByTitle.values()];
}