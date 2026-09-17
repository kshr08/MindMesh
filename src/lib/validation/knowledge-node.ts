import { ConfidenceStatus, NodeType } from "@prisma/client";
import { z } from "zod";

export const TITLE_MAX_LENGTH = 120;
export const DESCRIPTION_MAX_LENGTH = 2000;

export const nodeTypeSchema = z.nativeEnum(NodeType);
export const confidenceStatusSchema = z.nativeEnum(ConfidenceStatus);

const titleSchema = z
  .string()
  .trim()
  .min(1, "Title is required.")
  .max(TITLE_MAX_LENGTH, `Title must be ${TITLE_MAX_LENGTH} characters or fewer.`);

const descriptionSchema = z
  .string()
  .trim()
  .max(
    DESCRIPTION_MAX_LENGTH,
    `Description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer.`,
  )
  .optional()
  .nullable()
  .transform((value) => (value ? value : null));

export const createKnowledgeNodeSchema = z.object({
  title: titleSchema,
  type: nodeTypeSchema,
  status: confidenceStatusSchema,
  description: descriptionSchema,
});

export const updateKnowledgeNodeSchema = createKnowledgeNodeSchema.extend({
  id: z.string().min(1, "Node id is required."),
});

export const deleteKnowledgeNodeSchema = z.object({
  id: z.string().min(1, "Node id is required."),
});

export type CreateKnowledgeNodeInput = z.infer<typeof createKnowledgeNodeSchema>;
export type UpdateKnowledgeNodeInput = z.infer<typeof updateKnowledgeNodeSchema>;
export type DeleteKnowledgeNodeInput = z.infer<typeof deleteKnowledgeNodeSchema>;