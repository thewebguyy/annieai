import { streamText } from 'ai';
import { openrouter, routeTask, MODELS } from '@/lib/ai/orchestrator';
import { queryStoryBible } from '@/lib/ai/rag';

export const runtime = 'edge';

export async function POST(req: Request) {
  const { messages, projectId = 'default' }: { messages: any[], projectId?: string } = await req.json();
  const lastMessage = messages[messages.length - 1];
  const userQuery = (lastMessage?.content as string) || '';

  // 1. Intelligent Routing
  const { model: modelAlias, reasoning } = await routeTask(userQuery);
  const modelId = MODELS[modelAlias];

  // 2. RAG Context Retrieval
  let context = "";
  try {
    const relevantSnippets = await queryStoryBible(projectId, userQuery);
    if (relevantSnippets.length > 0) {
      context = "\nRELEVANT STORY BIBLE CONTEXT:\n" +
        relevantSnippets.map(s => `- ${s.text}`).join('\n');
    }
  } catch (e) {
    console.error("RAG retrieval failed:", e);
  }

  // 3. System Prompt Construction
  const systemPrompt = `
    You are ANNIE, a Creative Intelligence Orchestrator for scriptwriters.
    Task Routing: You are acting as the ${modelAlias.toUpperCase()} expert.
    Reasoning for choice: ${reasoning}

    Guidelines:
    - Maintain industry-standard screenplay formatting.
    - Use the provided context from the Story Bible to ensure continuity.
    - If the user asks for a scene, use Markdown for script elements.

    ${context}
  `;

  const result = await streamText({
    model: openrouter(modelId),
    messages,
    system: systemPrompt,
    temperature: 0.7,
  });

  return result.toTextStreamResponse({
    headers: {
      'x-annie-model': modelAlias,
      'x-annie-reasoning': encodeURIComponent(reasoning),
    }
  });
}
