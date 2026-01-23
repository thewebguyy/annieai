import { createOpenAI } from '@ai-sdk/openai';

export const openrouter = createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
});

export type ModelAlias = 'claude' | 'gpt' | 'grok' | 'gemini';

export const MODELS: Record<ModelAlias, string> = {
    claude: 'anthropic/claude-4.5',   // Emotional/Dialogue
    gpt: 'openai/gpt-5',              // Logic/Structure
    grok: 'x-ai/grok-4',              // Uncensored/Wit
    gemini: 'google/gemini-3.0',      // World-building/Long-context
};

export const TASK_ROUIING: Record<string, ModelAlias> = {
    'dialogue': 'claude',
    'emotion': 'claude',
    'structure': 'gpt',
    'plot': 'gpt',
    'logic': 'gpt',
    'wit': 'grok',
    'research': 'grok',
    'world': 'gemini',
    'lore': 'gemini',
    'long-context': 'gemini',
};

export function getModelForTask(taskDescription: string): ModelAlias {
    const lower = taskDescription.toLowerCase();
    if (lower.includes('dialogue') || lower.includes('eeling') || lower.includes('character')) return 'claude';
    if (lower.includes('plot') || lower.includes('outline') || lower.includes('logic')) return 'gpt';
    if (lower.includes('joke') || lower.includes('wit') || lower.includes('news')) return 'grok';
    if (lower.includes('world') || lower.includes('history') || lower.includes('bible')) return 'gemini';
    return 'gpt'; // Default
}
