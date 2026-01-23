import { Pinecone } from '@pinecone-database/pinecone';
import { createOpenAI } from '@ai-sdk/openai';
import { embed } from 'ai';

const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
});

const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Or use OpenRouter
});

const index = pc.index(process.env.PINECONE_INDEX || 'story-bible');

/**
 * Ingest text into the Story Bible
 */
export async function ingestStoryBible(projectId: string, text: string, metadata: any = {}) {
    const { embedding } = await embed({
        model: openai.embedding('text-embedding-3-small'),
        value: text,
    });

    await index.upsert([
        {
            id: `${projectId}-${Date.now()}`,
            values: embedding,
            metadata: {
                ...metadata,
                projectId,
                text,
                timestamp: new Date().toISOString(),
            },
        },
    ]);
}

/**
 * Query the Story Bible for relevant context
 */
export async function queryStoryBible(projectId: string, query: string, topK = 3) {
    const { embedding } = await embed({
        model: openai.embedding('text-embedding-3-small'),
        value: query,
    });

    const results = await index.query({
        vector: embedding,
        topK,
        filter: { projectId: { $eq: projectId } },
        includeMetadata: true,
    });

    return results.matches.map((m) => ({
        text: m.metadata?.text as string,
        score: m.score,
        source: m.metadata?.source || 'Story Bible',
    }));
}
