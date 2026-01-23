import { createOpenAI } from '@ai-sdk/openai';
import { generateObject, streamText } from 'ai';
import { z } from 'zod';

export const openrouter = createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
});

export type ModelAlias = 'claude' | 'gpt' | 'grok' | 'gemini';

export const MODELS: Record<ModelAlias, string> = {
    claude: 'anthropic/claude-4.5',   // Emotional/Dialogue
    gpt: 'openai/gpt-5',              // Logic/Structure
    grok: 'x-ai/grok-4',              // Uncensored/Wit
    gemini: 'google/gemini-pro-1.5',  // World-building/Long-context (Pro for better reasoning)
};

const routingSchema = z.object({
    model: z.enum(['claude', 'gpt', 'grok', 'gemini']),
    reasoning: z.string(),
    taskType: z.string(),
});

/**
 * Intelligent Router: Uses a high-speed model to decide which expert to call.
 */
export async function routeTask(task: string): Promise<{ model: ModelAlias; reasoning: string }> {
    try {
        const { object } = await generateObject({
            model: openrouter('openai/gpt-4o-mini'), // Fast router model
            schema: routingSchema,
            prompt: `Analyze the following scriptwriting task and route it to the best AI expert.
      Experts:
      - CLAUDE: Best for emotional depth, nuanced dialogue, and character subtext.
      - GPT: Best for logical structure, plot consistency, and technical screenplay formatting.
      - GROK: Best for edgy wit, dark humor, and real-time cultural relevance.
      - GEMINI: Best for massive lore, world-building, and cross-referencing large volumes of story bible data.

      Task: "${task}"`,
        });

        return { model: object.model as ModelAlias, reasoning: object.reasoning };
    } catch (error) {
        console.error("Routing error, falling back to GPT:", error);
        return { model: 'gpt', reasoning: 'Fallback due to error' };
    }
}
