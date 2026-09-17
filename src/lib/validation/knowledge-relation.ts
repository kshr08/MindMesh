import { RelationType } from "@prisma/client";
import { z } from "zod";

export const relationTypeSchema = z.nativeEnum(RelationType);

export const createKnowledgeRelationSchema = z
  .object({
    sourceId: z.string().min(1, "Source node is required."),
    targetId: z.string().min(1, "Target node is required."),
    relationType: relationTypeSchema,
  })
  .refine((data) => data.sourceId !== data.targetId, {
    message: "A node cannot be related to itself.",
    path: ["targetId"],
  });

export const deleteKnowledgeRelationSchema = z.object({
  id: z.string().min(1, "Relation id is required."),
});

export type CreateKnowledgeRelationInput = z.infer<typeof createKnowledgeRelationSchema>;
export type DeleteKnowledgeRelationInput = z.infer<typeof deleteKnowledgeRelationSchema>;

export const RELATION_TYPE_OPTIONS: { value: RelationType; label: string }[] = [
  { value: "USES", label: "Uses" },
  { value: "DEPENDS_ON", label: "Depends on" },
  { value: "PREREQUISITE_FOR", label: "Prerequisite for" },
  { value: "RELATED_TO", label: "Related to" },
  { value: "PART_OF", label: "Part of" },
  { value: "LEARNED_THROUGH", label: "Learned through" },
  { value: "IMPLEMENTED_IN", label: "Implemented in" },
  { value: "SIMILAR_TO", label: "Similar to" },
];

export const RELATION_TYPE_LABEL: Record<RelationType, string> = Object.fromEntries(
  RELATION_TYPE_OPTIONS.map((opt) => [opt.value, opt.label]),
) as Record<RelationType, string>;