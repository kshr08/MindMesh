import type { ConfidenceStatus, NodeType, RelationType } from "@prisma/client";
import type { RawKnowledgeProposal } from "@/server/ai/proposal-schema";
import type { RawRelationshipSuggestionProposal } from "@/server/ai/relationship-suggestion-schema";

export interface KnowledgeProposalNode {
  title: string;
  type: NodeType;
  description: string | null;
  existing: boolean;
}

export interface KnowledgeProposalRelationship {
  sourceTitle: string;
  targetTitle: string;
  relationType: RelationType;
}

export interface KnowledgeProposal {
  nodes: KnowledgeProposalNode[];
  relationships: KnowledgeProposalRelationship[];
}

export interface ExtractKnowledgeContext {
  existingNodes: { title: string; type: NodeType; status: ConfidenceStatus }[];
}

export interface RelationshipSuggestionNode {
  title: string;
  type: NodeType;
  description: string | null;
  existing: boolean;
}

export interface RelationshipSuggestionContext {
  nodes: RelationshipSuggestionNode[];
  existingRelationships: {
    sourceTitle: string;
    targetTitle: string;
    relationType: RelationType;
  }[];
  allowedRelationTypes: RelationType[];
}

export interface AIService {
  extractKnowledge(input: string, context: ExtractKnowledgeContext): Promise<RawKnowledgeProposal>;
  suggestRelationships(
    notes: string,
    context: RelationshipSuggestionContext,
  ): Promise<RawRelationshipSuggestionProposal>;
}
