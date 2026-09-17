import type { ExtractKnowledgeContext } from "@/server/ai/types";

export function knowledgeExtractionPrompt(
  notes: string,
  context: ExtractKnowledgeContext,
): string {
  const existingTitles = context.existingNodes.map((node) => node.title).join(", ");

  return `Extract meaningful knowledge entities and supported relationships from the notes below.

Classify entities only as CONCEPT, PROJECT, SKILL, TECHNOLOGY, or RESOURCE.
Use relationships only as USES, DEPENDS_ON, PREREQUISITE_FOR, RELATED_TO, PART_OF, LEARNED_THROUGH, IMPLEMENTED_IN, or SIMILAR_TO.
A project is something the user builds or has built; a technology is a tool, framework, or platform; a skill is an ability; a concept is an idea or subject; a resource is a learning or reference item.
Avoid unsupported facts, duplicate nodes, and obvious naming variations. Return ONLY JSON matching this shape: {"nodes":[{"title":"...","type":"CONCEPT","description":null}],"relationships":[{"sourceTitle":"...","targetTitle":"...","relationType":"USES"}]}.
Every relationship endpoint must exactly match a proposed node title. Do not include markdown.
Existing graph titles for duplicate awareness: ${existingTitles || "(none)"}

Notes:
${notes}`;
}
