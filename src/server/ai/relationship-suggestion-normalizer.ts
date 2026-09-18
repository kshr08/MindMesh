import {
  relationshipSuggestionProposalSchema,
  rawRelationshipSuggestionProposalSchema,
  type RawRelationshipSuggestionProposal,
  type RelationshipSuggestionProposal,
} from "@/server/ai/relationship-suggestion-schema";
import type { RelationshipSuggestionContext } from "@/server/ai/types";
import { normalizeTitle } from "@/lib/normalize-title";

export function normalizeRelationshipSuggestions(
  raw: RawRelationshipSuggestionProposal,
  context: RelationshipSuggestionContext,
): RelationshipSuggestionProposal {
  const parsed = rawRelationshipSuggestionProposalSchema.parse(raw);
  const nodesByTitle = new Map(
    context.nodes.map((node) => [normalizeTitle(node.title), node]),
  );
  const existingRelationshipKeys = new Set(
    context.existingRelationships.map((relationship) =>
      relationshipKey(
        relationship.sourceTitle,
        relationship.targetTitle,
        relationship.relationType,
      ),
    ),
  );
  const seenKeys = new Set<string>();
  const relationships = [];

  for (const relationship of parsed.relationships) {
    const source = nodesByTitle.get(normalizeTitle(relationship.sourceTitle));
    const target = nodesByTitle.get(normalizeTitle(relationship.targetTitle));
    if (!source || !target) {
      throw new Error("AI provider returned an invalid relationship endpoint.");
    }
    if (normalizeTitle(source.title) === normalizeTitle(target.title)) {
      throw new Error("AI provider returned a self-loop relationship.");
    }

    const sourceTitle = source.title.trim();
    const targetTitle = target.title.trim();
    const key = relationshipKey(sourceTitle, targetTitle, relationship.relationType);
    if (seenKeys.has(key)) continue;

    seenKeys.add(key);
    relationships.push({
      ...relationship,
      sourceTitle,
      targetTitle,
      selected: !existingRelationshipKeys.has(key),
      existing: existingRelationshipKeys.has(key),
    });
  }

  return relationshipSuggestionProposalSchema.parse({ relationships });
}

function relationshipKey(
  sourceTitle: string,
  targetTitle: string,
  relationType: string,
): string {
  return `${normalizeTitle(sourceTitle)}:${normalizeTitle(targetTitle)}:${relationType}`;
}
