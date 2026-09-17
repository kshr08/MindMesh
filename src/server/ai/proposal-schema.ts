import { NodeType, RelationType } from "@prisma/client";
import { z } from "zod";

const titleSchema = z.string().trim().min(1).max(120);

export const rawKnowledgeProposalSchema = z.object({
  nodes: z.array(
    z.object({
      title: titleSchema,
      type: z.nativeEnum(NodeType),
      description: z.string().trim().max(2000).nullable().optional(),
    }),
  ).max(100),
  relationships: z.array(
    z.object({
      sourceTitle: titleSchema,
      targetTitle: titleSchema,
      relationType: z.nativeEnum(RelationType),
    }),
  ).max(200).refine(
    (relationships) => relationships.every((relationship) => relationship.sourceTitle !== relationship.targetTitle),
    "A relationship cannot connect a node to itself.",
  ),
});

export const knowledgeProposalSchema = z.object({
  nodes: z.array(
    z.object({
      title: titleSchema,
      type: z.nativeEnum(NodeType),
      description: z.string().trim().max(2000).nullable(),
      existing: z.boolean(),
    }),
  ).max(100),
  relationships: rawKnowledgeProposalSchema.shape.relationships,
});

export const extractKnowledgeInputSchema = z.object({
  notes: z.string().trim().min(1, "Enter some notes to extract.").max(12000, "Notes must be 12,000 characters or fewer."),
});

export const importKnowledgeProposalInputSchema = z.object({
  nodes: z.array(
    z.object({
      title: titleSchema,
      type: z.nativeEnum(NodeType),
      description: z.string().trim().max(2000).nullable(),
      selected: z.boolean(),
    }),
  ).max(100),
  relationships: z.array(
    z.object({
      sourceTitle: titleSchema,
      targetTitle: titleSchema,
      relationType: z.nativeEnum(RelationType),
      selected: z.boolean(),
    }),
  ).max(200),
});

export type RawKnowledgeProposal = z.infer<typeof rawKnowledgeProposalSchema>;
export type ImportKnowledgeProposalInput = z.infer<typeof importKnowledgeProposalInputSchema>;
