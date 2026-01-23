'use server';

import { Pinecone } from '@pinecone-database/pinecone';
import { createOpenAI } from '@ai-sdk/openai';
import { embed } from 'ai';

// Lazy client instantiation to avoid build-time errors when ENV is missing
let _pinecone: Pinecone | null = null;
const getPinecone = () => {
    if (!_pinecone) {
        if (!process.env.PINECONE_API_KEY) {
            console.warn("PINECONE_API_KEY is missing. RAG will be disabled.");
            return null;
        }
        _pinecone = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY,
        });
    }
    return _pinecone;
};

const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy',
});

/**
 * Ingest text into the Story Bible (Server Action)
 */
export async function ingestStoryBible(projectId: string, text: string, metadata: any = {}) {
    const pc = getPinecone();
    if (!pc) return { success: false, error: "Pinecone not configured" };

    const { embedding } = await embed({
        model: openai.embedding('text-embedding-3-small'),
        value: text,
    });

    const index = pc.index(process.env.PINECONE_INDEX || 'story-bible');

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
        } as any,
    ]);

    return { success: true };
}

/**
 * Query the Story Bible for relevant context (Server Action)
 */
export async function queryStoryBible(projectId: string, query: string, topK = 3) {
    const pc = getPinecone();
    if (!pc) return [];

    const { embedding } = await embed({
        model: openai.embedding('text-embedding-3-small'),
        value: query,
    });

    const index = pc.index(process.env.PINECONE_INDEX || 'story-bible');

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
