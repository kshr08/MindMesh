import { NodeType, RelationType } from "@prisma/client";
import { z } from "zod";

const titleSchema = z.string().trim().min(1).max(120);
const evidenceSchema = z.string().trim().min(1).max(500);
const descriptionSchema = z.string().trim().max(2000).nullable();

export const relationshipSupportSchema = z.enum(["EXPLICIT", "INFERRED"]);

const rawRelationshipSuggestionSchema = z.object({
  sourceTitle: titleSchema,
  targetTitle: titleSchema,
  relationType: z.nativeEnum(RelationType),
  support: relationshipSupportSchema,
  evidence: evidenceSchema,
}).strict();

export const rawRelationshipSuggestionProposalSchema = z.object({
  relationships: z.array(rawRelationshipSuggestionSchema).max(200),
}).strict();

export const relationshipSuggestionSchema = rawRelationshipSuggestionSchema.extend({
  selected: z.boolean(),
  existing: z.boolean(),
});

export const relationshipSuggestionProposalSchema = z.object({
  relationships: z.array(relationshipSuggestionSchema).max(200),
});

export const relationshipSuggestionInputSchema = z
  .object({
    notes: z
      .string()
      .trim()
      .min(1, "Enter some notes to suggest relationships.")
      .max(12000, "Notes must be 12,000 characters or fewer."),
    nodes: z
      .array(
        z
          .object({
            title: titleSchema,
            type: z.nativeEnum(NodeType),
            description: descriptionSchema,
            selected: z.boolean(),
          })
          .strict(),
      )
      .max(100),
  })
  .strict();

export type RelationshipSuggestionInput = z.infer<
  typeof relationshipSuggestionInputSchema
>;

export type RawRelationshipSuggestionProposal = z.infer<
  typeof rawRelationshipSuggestionProposalSchema
>;
export type RelationshipSuggestionProposal = z.infer<
  typeof relationshipSuggestionProposalSchema
>;
