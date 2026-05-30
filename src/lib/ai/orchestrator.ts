// Architectural Layer: Utility / AI Configuration
// Dependencies: @ai-sdk/openai, ai, zod

import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

export const getOpenRouterClient = () => {
  const apiKey = process.env.OPENROUTER_API_KEY || "dummy-openrouter-key";
  return createOpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
  });
};

export type ModelAlias = "claude" | "gpt" | "grok" | "gemini";

// Mapped to stable production models currently available on OpenRouter.
// Futuristic mappings are noted in comments as the intended upgrade path.
export const MODELS: Record<ModelAlias, string> = {
  // anthropic/claude-4.5 (intended upgrade)
  claude: "anthropic/claude-3.5-sonnet",
  
  // openai/gpt-5 (intended upgrade)
  gpt: "openai/gpt-4o",
  
  // x-ai/grok-4 (intended upgrade)
  grok: "x-ai/grok-2",
  
  // google/gemini-pro-1.5 (intended upgrade)
  gemini: "google/gemini-2.5-pro",
};

export const modelWindowLimits: Record<ModelAlias, number> = {
  claude: 200000,
  gpt: 128000,
  grok: 128000,
  gemini: 1000000,
};

const routingSchema = z.object({
  model: z.enum(["claude", "gpt", "grok", "gemini"]),
  reasoning: z.string(),
  taskType: z.string(),
});

/**
 * Intelligent Router: Evaluates user query and dispatches the task to the optimal LLM.
 */
export async function routeTask(
  task: string,
  requestId: string
): Promise<{ model: ModelAlias; reasoning: string }> {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[DEV FALLBACK] Routing decision skipped (no OpenRouter API key). Falling back to GPT.");
        return { model: "gpt", reasoning: "Fallback due to missing API key in dev mode" };
      }
      throw new Error("Missing OpenRouter API key.");
    }

    const openrouter = getOpenRouterClient();

    const { object } = await generateObject({
      model: openrouter("openai/gpt-4o-mini"),
      schema: routingSchema,
      prompt: `Analyze the following scriptwriting task and route it to the best AI expert.
      
      Experts:
      - claude: Best for emotional depth, nuanced dialogue, and character subtext.
      - gpt: Best for logical structure, plot consistency, and technical screenplay formatting.
      - grok: Best for edgy wit, dark humor, and real-time cultural relevance.
      - gemini: Best for massive lore, world-building, and cross-referencing large volumes of story bible data.

      Task: "${task}"`,
    });

    return {
      model: object.model as ModelAlias,
      reasoning: object.reasoning,
    };
  } catch (error) {
    console.warn(`[Routing Fallback] Error in routeTask (RequestId: ${requestId}). Falling back to GPT.`, error);
    return {
      model: "gpt",
      reasoning: "System fallback due to routing error",
    };
  }
}
