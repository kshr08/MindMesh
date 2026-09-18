import { rawKnowledgeProposalSchema } from "@/server/ai/proposal-schema";
import type { RawKnowledgeProposal } from "@/server/ai/proposal-schema";
import { knowledgeExtractionPrompt } from "@/server/ai/prompts/knowledge-extraction";
import { relationshipSuggestionPrompt } from "@/server/ai/prompts/relationship-suggestions";
import { rawRelationshipSuggestionProposalSchema } from "@/server/ai/relationship-suggestion-schema";
import type { RawRelationshipSuggestionProposal } from "@/server/ai/relationship-suggestion-schema";
import type {
  AIService,
  ExtractKnowledgeContext,
  RelationshipSuggestionContext,
} from "@/server/ai/types";

const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_BASE_URL = "https://api.openai.com/v1";

interface ExtractionCompletionUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

interface ExtractionCompletionMessage {
  content?: string | null;
  reasoning?: string | null;
}

interface ExtractionCompletionChoice {
  finish_reason?: string | null;
  message?: ExtractionCompletionMessage;
}

interface ExtractionCompletionPayload {
  model?: string;
  choices?: ExtractionCompletionChoice[];
  usage?: ExtractionCompletionUsage;
}

export class OpenAICompatibleProvider implements AIService {
  async extractKnowledge(
    input: string,
    context: ExtractKnowledgeContext,
  ): Promise<RawKnowledgeProposal> {
    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) throw new Error("AI provider is not configured.");

    const response = await fetch(`${process.env.AI_BASE_URL ?? DEFAULT_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL ?? DEFAULT_MODEL,
        temperature: 0.1,
        max_tokens: 6000,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You extract knowledge into validated JSON." },
          { role: "user", content: knowledgeExtractionPrompt(input, context) },
        ],
      }),
      signal: AbortSignal.timeout(90000),
    });

    if (!response.ok) throw new Error(`AI provider returned ${response.status}.`);

    const payload = (await response.json()) as ExtractionCompletionPayload;
    const choice = payload.choices?.[0];
    const content = choice?.message?.content;

    if (!content) {
      const diagnosticParts: string[] = [
        `status=${response.status}`,
        `model=${payload.model ?? "unknown"}`,
        `finish_reason=${choice?.finish_reason ?? "unknown"}`,
        `hasContent=${Boolean(choice?.message?.content)}`,
        `hasReasoning=${Boolean(choice?.message?.reasoning)}`,
      ];

      if (payload.usage?.prompt_tokens !== undefined) {
        diagnosticParts.push(`promptTokens=${payload.usage.prompt_tokens}`);
      }
      if (payload.usage?.completion_tokens !== undefined) {
        diagnosticParts.push(`completionTokens=${payload.usage.completion_tokens}`);
      }
      if (payload.usage?.total_tokens !== undefined) {
        diagnosticParts.push(`totalTokens=${payload.usage.total_tokens}`);
      }

      throw new Error(`AI provider returned no proposal (${diagnosticParts.join(" ")}).`);
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(content);
    } catch {
      throw new Error("AI provider returned malformed JSON.");
    }

    const parsed = rawKnowledgeProposalSchema.safeParse(parsedJson);
    if (!parsed.success) throw new Error("AI provider returned an invalid proposal.");

    return parsed.data;
  }

  async suggestRelationships(
    notes: string,
    context: RelationshipSuggestionContext,
  ): Promise<RawRelationshipSuggestionProposal> {
    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) throw new Error("AI provider is not configured.");

    const response = await fetch(`${process.env.AI_BASE_URL ?? DEFAULT_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL ?? DEFAULT_MODEL,
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You suggest conservative relationships into validated JSON." },
          { role: "user", content: relationshipSuggestionPrompt(notes, context) },
        ],
      }),
      signal: AbortSignal.timeout(90000),
    });

    if (!response.ok) throw new Error(`AI provider returned ${response.status}.`);

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string | null } }[];
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error("AI provider returned no relationship proposal.");

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(content);
    } catch {
      throw new Error("AI provider returned malformed relationship JSON.");
    }

    const parsed = rawRelationshipSuggestionProposalSchema.safeParse(parsedJson);
    if (!parsed.success) throw new Error("AI provider returned an invalid relationship proposal.");

    return parsed.data;
  }
}