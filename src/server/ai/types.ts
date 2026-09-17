import type { ConfidenceStatus, NodeType, RelationType } from "@prisma/client";
import type { RawKnowledgeProposal } from "@/server/ai/proposal-schema";

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

export interface AIService {
  extractKnowledge(input: string, context: ExtractKnowledgeContext): Promise<RawKnowledgeProposal>;
}
