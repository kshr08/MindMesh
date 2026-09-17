import { knowledgeProposalSchema, rawKnowledgeProposalSchema } from "@/server/ai/proposal-schema";
import type { RawKnowledgeProposal } from "@/server/ai/proposal-schema";
import type { ExtractKnowledgeContext, KnowledgeProposal } from "@/server/ai/types";
import { normalizeTitle } from "@/lib/normalize-title";

export function normalizeKnowledgeProposal(
  raw: RawKnowledgeProposal,
  context: ExtractKnowledgeContext,
): KnowledgeProposal {
  const parsed = rawKnowledgeProposalSchema.parse(raw);
  const existingTitles = new Set(
    context.existingNodes.map((node) => normalizeTitle(node.title)),
  );
  const nodesByTitle = new Map<string, KnowledgeProposal["nodes"][number]>();

  for (const node of parsed.nodes) {
    const key = normalizeTitle(node.title);
    if (!nodesByTitle.has(key)) {
      nodesByTitle.set(key, {
        title: node.title.trim(),
        type: node.type,
        description: node.description?.trim() || null,
        existing: existingTitles.has(key),
      });
    }
  }

  const relationships = parsed.relationships.map((relationship) => {
    const source = nodesByTitle.get(normalizeTitle(relationship.sourceTitle));
    const target = nodesByTitle.get(normalizeTitle(relationship.targetTitle));
    if (!source || !target || source.title === target.title) {
      throw new Error("AI provider returned an invalid relationship endpoint.");
    }

    return {
      sourceTitle: source.title,
      targetTitle: target.title,
      relationType: relationship.relationType,
    };
  });

  return knowledgeProposalSchema.parse({
    nodes: [...nodesByTitle.values()],
    relationships,
  });
}

