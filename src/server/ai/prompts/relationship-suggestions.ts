import type { RelationshipSuggestionContext } from "@/server/ai/types";

export function relationshipSuggestionPrompt(
  notes: string,
  context: RelationshipSuggestionContext,
): string {
  const nodes = context.nodes
    .map(
      (node) =>
        `- ${node.title} [${node.type}]${node.description ? `: ${node.description}` : ""}`,
    )
    .join("\n");
  const existingRelationships = context.existingRelationships.length
    ? context.existingRelationships
        .map(
          (relationship) =>
            `- ${relationship.sourceTitle} -> ${relationship.relationType} -> ${relationship.targetTitle}`,
        )
        .join("\n")
    : "(none)";
  const allowedRelationTypes = context.allowedRelationTypes.join(", ");

  return `Suggest a small number of meaningful, well-supported relationships for the supplied knowledge graph. This is a conservative relationship-proposal task, not a general knowledge task.

Only use nodes supplied below. Never invent entities or endpoint titles. Every sourceTitle and targetTitle must exactly match a supplied node title. Do not create self-loops. Only use these relation types: ${allowedRelationTypes}.

Do not suggest relationships that already exist below. Prefer relationships explicitly supported by the notes. You may suggest an INFERRED relationship only when the notes and supplied node context strongly support it; include concise evidence. Do not assume a relationship merely because two technologies are commonly used together. A smaller number of well-supported relationships is better than speculative suggestions.

Return ONLY JSON with this exact shape: {"relationships":[{"sourceTitle":"...","targetTitle":"...","relationType":"USES","support":"EXPLICIT","evidence":"..."}]}. Do not include markdown or text outside the JSON.

Supplied nodes:
${nodes}

Existing relationships:
${existingRelationships}

Notes:
${notes}`;
}
