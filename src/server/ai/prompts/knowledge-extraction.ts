import type { ExtractKnowledgeContext } from "@/server/ai/types";

export function knowledgeExtractionPrompt(
  notes: string,
  context: ExtractKnowledgeContext,
): string {
  const existingTitles = context.existingNodes.map((node) => node.title).join(", ");

  return `Extract knowledge comprehensively from the notes below. This is an entity-extraction task, not a summary.

Extract ALL meaningful entities explicitly mentioned in the notes. Do not return only the most important, central, or representative entities, and do not omit an entity because another entity seems more important. Preserve meaningful entities even when they are mentioned only once. If the notes explicitly list many technologies, normally return each meaningful listed technology as its own node.

Classify entities only as CONCEPT, PROJECT, SKILL, TECHNOLOGY, or RESOURCE:
- Every explicitly mentioned meaningful technology, tool, framework, library, platform, or infrastructure technology should normally be a TECHNOLOGY node.
- A project the user is building or has built should be a PROJECT node.
- An explicitly mentioned meaningful subject or idea, such as scalability, reliability, distributed systems, or system design, should be a CONCEPT node.
- An explicitly mentioned ability or competency should be a SKILL node.
- An explicitly mentioned learning or reference material should be a RESOURCE node.

Do not invent entities or unsupported facts. Keep descriptions concise and grounded in the notes. Normalize only obvious naming variations, and avoid duplicate nodes within the proposal. Existing graph titles are provided for duplicate awareness, but they must not cause an explicitly mentioned relevant entity to be omitted; return it when needed so relationships can reference it.

Create relationships only when they are explicitly stated or strongly supported by the notes. Use relationships only as USES, DEPENDS_ON, PREREQUISITE_FOR, RELATED_TO, PART_OF, LEARNED_THROUGH, IMPLEMENTED_IN, or SIMILAR_TO. Every relationship sourceTitle and targetTitle must exactly match the title of a node returned in the proposal, and source and target must be different.

Return ONLY JSON matching this shape: {"nodes":[{"title":"...","type":"CONCEPT","description":null}],"relationships":[{"sourceTitle":"...","targetTitle":"...","relationType":"USES"}]}. Do not include markdown or any text outside the JSON.
Existing graph titles for duplicate awareness: ${existingTitles || "(none)"}

Notes:
${notes}`;
}
