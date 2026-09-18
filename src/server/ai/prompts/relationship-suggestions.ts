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

Do not suggest relationships that already exist below.

=== RELATIONSHIP TYPE DEFINITIONS ===

Each relation type has a specific meaning and direction. Use ONLY the definition below for each type. If a candidate relationship does not clearly match a definition, do not suggest it — do not force it into the closest-sounding type.

1. USES
Source actively uses or utilizes target.
Valid: MindMesh -> USES -> React Flow
Valid: MindMesh -> USES -> PostgreSQL
Invalid: React Flow -> USES -> graph visualization (unless the note explicitly states React Flow uses graph visualization)

2. DEPENDS_ON
Source depends on target for its operation, implementation, or existence.
Valid: Application -> DEPENDS_ON -> PostgreSQL
Do not use DEPENDS_ON merely because two things are mentioned together in the same note.

3. PREREQUISITE_FOR
Source is a prerequisite that should be known/completed before target.
Valid: JavaScript -> PREREQUISITE_FOR -> React
Only use when prerequisite ordering is explicitly stated or strongly and unambiguously supported.

4. RELATED_TO
Use only for a genuine conceptual/topic relationship when the note explicitly states or strongly establishes that the two entities are related.
Do NOT use RELATED_TO simply because:
- two entities appear in the same sentence
- one is a technology and one is a concept
- one is used to implement another
- they are both part of the same application
Prefer a more specific relationship type when one is supported instead of defaulting to RELATED_TO.

5. PART_OF
Source is a genuine constituent/subcomponent of target.
Valid: Authentication Module -> PART_OF -> MindMesh
Do NOT use PART_OF for:
- technologies used by a project
- concepts associated with a project
- technologies involved in a general domain
- things merely used to build something

6. LEARNED_THROUGH
Source is knowledge/skill/concept that was learned through target.
Valid: React -> LEARNED_THROUGH -> React Course
Only use when learning is explicitly mentioned or clearly supported.

7. IMPLEMENTED_IN
Source is a feature, concept, capability, or functionality that is implemented inside target.
Valid: Authentication -> IMPLEMENTED_IN -> MindMesh
Do NOT use IMPLEMENTED_IN for a technology simply because the technology is used by a project or frontend.
Example: "The frontend uses Next.js" must NOT produce: Next.js -> IMPLEMENTED_IN -> frontend development
The correct relationship there, when direction and supplied nodes support it, is: frontend/application/project -> USES -> Next.js

8. SIMILAR_TO
Use only when the note explicitly states or strongly establishes similarity, equivalence, or comparable purpose.
Do not use it as a generic fallback for two unrelated-but-nearby entities.

=== WORKED EXAMPLES ===

Input: "MindMesh uses React Flow for graph visualization."
Valid: MindMesh -> USES -> React Flow
Invalid: React Flow -> RELATED_TO -> graph visualization
Invalid: React Flow -> IMPLEMENTED_IN -> graph visualization
Invalid: React Flow -> PART_OF -> MindMesh

Input: "The database uses PostgreSQL with Prisma."
Valid (only if the actual supplied nodes/wording establish the source clearly): database/application/project -> USES -> PostgreSQL, database/application/project -> USES -> Prisma
Invalid: PostgreSQL -> PART_OF -> database design
Invalid: PostgreSQL -> IMPLEMENTED_IN -> database design

Input: "Authentication is implemented in MindMesh."
Valid: Authentication -> IMPLEMENTED_IN -> MindMesh

Input: "JavaScript is a prerequisite for learning React."
Valid: JavaScript -> PREREQUISITE_FOR -> React

Input: "I learned React through a frontend development course."
Valid: React -> LEARNED_THROUGH -> frontend development course

=== GENERAL RULES ===

- Never invent entities or relationships just because two entities are present in the same note.
- Every relationship must be directly supported by the supplied notes/context.
- Prefer no relationship over a weak or speculative one.
- Prefer a specific relationship type over RELATED_TO whenever a specific type is actually supported.
- Do not create a relationship merely because the source and target are semantically associated or thematically nearby.
- Do not reverse relationship direction from what the note supports.
- Never create self-loops.
- Do not suggest a relationship that already exists (listed below).
- Respect the allowed relation types supplied above; never use any other type.
- Keep the proposal set small and high-confidence rather than trying to connect everything.

=== SUPPORT LABELS ===

EXPLICIT: the note directly states the relationship, or uses wording that clearly and unambiguously establishes it.
INFERRED: the relationship is not directly stated but follows strongly and specifically from the supplied notes/node context. INFERRED relationships must have especially strong evidence — do not label a weak guess as INFERRED. If evidence is weak or ambiguous, omit the relationship entirely rather than labeling it INFERRED.

Return ONLY JSON with this exact shape: {"relationships":[{"sourceTitle":"...","targetTitle":"...","relationType":"USES","support":"EXPLICIT","evidence":"..."}]}. Do not include markdown or text outside the JSON.

Supplied nodes:
${nodes}

Existing relationships:
${existingRelationships}

Notes:
${notes}`;
}