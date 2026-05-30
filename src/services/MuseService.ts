// Architectural Layer: Service Layer
// Dependencies: ai, src/lib/ai/orchestrator.ts, src/services/RagService.ts, src/lib/sentry.ts

import { streamText } from "ai";
import {
  getOpenRouterClient,
  routeTask,
  MODELS,
  modelWindowLimits,
  type ModelAlias,
} from "../lib/ai/orchestrator";
import { RagService } from "./RagService";
import { Sentry } from "../lib/sentry";

export interface ChatMessage {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
}

export class MuseService {
  /**
   * Orchestrates the chat query processing in parallel:
   * 1. Dispatches routing (or uses manually requested model).
   * 2. Queries Pinecone Story Bible namespace (RAG).
   * 3. Prevents context window overflows by truncating from the middle.
   * 4. Assembles the system prompt without downstream prompt injection.
   * 5. Initiates OpenRouter text streaming response.
   */
  static async chat(
    projectId: string,
    userId: string,
    messages: ChatMessage[],
    modelOverride: "Auto" | "Claude" | "GPT" | "Grok" | "Gemini",
    requestId: string
  ) {
    try {
      const lastMessage = messages[messages.length - 1];
      const userQuery = lastMessage?.content || "";

      const startParallels = Date.now();

      // 1 & 2: Routing and RAG in parallel
      const routingPromise =
        modelOverride === "Auto"
          ? routeTask(userQuery, requestId)
          : Promise.resolve({
              model: modelOverride.toLowerCase() as ModelAlias,
              reasoning: "User selected override",
            });

      const ragPromise = RagService.query(projectId, userQuery);

      const [routing, ragContext] = await Promise.all([routingPromise, ragPromise]);
      
      const ragRetrievalMs = Date.now() - startParallels;

      const modelAlias = routing.model;
      const modelId = MODELS[modelAlias];
      const modelLimit = modelWindowLimits[modelAlias];

      // Format Story Bible snippets
      let formattedContext = "";
      if (ragContext.length > 0) {
        formattedContext =
          "\nRELEVANT STORY BIBLE CONTEXT:\n" +
          ragContext.map((snippet) => `- [${snippet.source}] ${snippet.text}`).join("\n");
      }

      // 3. Assemble system prompt (never inject routing.reasoning string)
      const systemPrompt = `
You are ANNIE, a Creative Intelligence Orchestrator for scriptwriters.
You are acting as the ${modelAlias.toUpperCase()} expert.

Guidelines:
- Maintain industry-standard screenplay formatting.
- Use the provided context from the Story Bible to ensure continuity.
- If the user asks for a scene, use Markdown for script elements.

${formattedContext}
      `.trim();

      // 4. Token guard check: truncate history if it exceeds 90% of model limit
      const cleanMessages = messages.map(({ role, content }) => ({ role, content }));
      const truncated = this.truncateHistory(cleanMessages, systemPrompt, modelLimit);

      // 5. OpenRouter streaming call
      const openrouter = getOpenRouterClient();
      
      const result = await streamText({
        model: openrouter(modelId),
        messages: truncated,
        system: systemPrompt,
        temperature: 0.7,
      });

      return {
        result,
        modelAlias,
        reasoning: routing.reasoning,
        routingDecisionMs: ragRetrievalMs, // Parallel task execution time
        ragRetrievalMs,
      };
    } catch (e) {
      Sentry.captureException(e, { extra: { requestId, projectId, userId } });
      throw e;
    }
  }

  /**
   * Truncates message history from the middle (preserves first project setup message
   * and the last 6 messages) to prevent context window overflow.
   */
  private static truncateHistory(
    messages: { role: "user" | "assistant" | "system"; content: string }[],
    systemPrompt: string,
    modelLimit: number
  ): { role: "user" | "assistant" | "system"; content: string }[] {
    const maxTokens = Math.floor(modelLimit * 0.9);
    
    // Quick token estimate: 4 characters per token
    const estimateTokens = (text: string) => Math.ceil(text.length / 4);

    const systemTokens = estimateTokens(systemPrompt);
    const messagesTokens = messages.reduce((acc, m) => acc + estimateTokens(m.content), 0);
    const totalTokens = systemTokens + messagesTokens;

    if (totalTokens <= maxTokens) {
      return messages;
    }

    // Keep first message (often contains structural guidelines or project prompt context)
    // and the last 6 messages (corresponds to last 3 user turns + responses)
    const preserveCount = Math.min(messages.length, 6);
    const preservedEnd = messages.slice(messages.length - preserveCount);

    if (messages.length <= preserveCount + 1) {
      return messages;
    }

    const firstMessage = messages[0];
    const middleMessages = messages.slice(1, messages.length - preserveCount);

    const currentMiddle = [...middleMessages];
    while (currentMiddle.length > 0) {
      const candidates = [firstMessage, ...currentMiddle, ...preservedEnd];
      const candidatesTokens =
        systemTokens + candidates.reduce((acc, m) => acc + estimateTokens(m.content), 0);
      
      if (candidatesTokens <= maxTokens) {
        return candidates;
      }
      currentMiddle.shift(); // Evict oldest messages in the middle
    }

    return [firstMessage, ...preservedEnd];
  }
}
