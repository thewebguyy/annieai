import { streamText, CoreMessage } from 'ai';
import { openrouter, getModelForTask, MODELS } from '@/lib/ai/orchestrator';

export const runtime = 'edge';

export async function POST(req: Request) {
  const { messages }: { messages: CoreMessage[] } = await req.json();
  const lastMessage = messages[messages.length - 1];


  // Orchestration Logic
  // In a real app, we might use a dedicated 'router' model first to decide steps.
  // For V1 MVP, we use keyword analysis from the orchestrator lib.
  const task = typeof lastMessage.content === 'string' ? lastMessage.content : '';
  const modelAlias = getModelForTask(task);
  const modelId = MODELS[modelAlias];

  console.log(`[Orchestrator] Routing task "${task.substring(0, 20)}..." to ${modelAlias} (${modelId})`);

  // System Prompt Construction
  const systemPrompt = `
    You are ANNIE, a Creative Intelligence Orchestrator. 
    You are currently routing this request to the ${modelAlias.toUpperCase()} model, which is optimized for this specific task.
    
    Context:
    - User is writing a screenplay.
    - Format: Industry standard screenplay format.
    - Style: Professional, Creative, Concise.
    
    If asked to write a scene, output Markdown that visually resembles a screenplay:
    **INT. LOCATION - DAY**
    ACTION lines here.
    
    CHARACTER
    Dialogue here.
  `;

  const result = await streamText({
    model: openrouter(modelId),
    messages,
    system: systemPrompt,
    temperature: 0.7,
  });

  return result.toDataStreamResponse();
}
