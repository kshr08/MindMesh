import { OpenAICompatibleProvider } from "@/server/ai/providers/openai-compatible-provider";
import type { AIService } from "@/server/ai/types";

let service: AIService | undefined;

export function getAIService(): AIService {
  service ??= new OpenAICompatibleProvider();
  return service;
}
